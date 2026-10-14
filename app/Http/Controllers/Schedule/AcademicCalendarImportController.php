<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\AcademicCalendarImportBatch;
use App\Models\AcademicCalendarImportEvent;
use App\Models\AcademicCalendarImportRule;
use App\Models\AcademicPeriod;
use App\Services\AcademicCalendarImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AcademicCalendarImportController extends Controller
{
    public function __construct(
        protected AcademicCalendarImportService $importService
    ) {}

    /**
     * Display the Academic Calendar Import Hub (Upload, Review Queue, History, Rules).
     */
    public function index(Request $request): Response
    {
        AcademicCalendarImportRule::ensureBaselineRules();

        $academicPeriods = AcademicPeriod::orderBy('start_date', 'desc')->get();
        $rules = AcademicCalendarImportRule::orderBy('id')->get();

        // Active or requested batch
        $selectedBatchId = $request->query('batch_id');
        $currentBatch = $selectedBatchId
            ? AcademicCalendarImportBatch::with(['events', 'creator'])->find($selectedBatchId)
            : AcademicCalendarImportBatch::with(['events', 'creator'])->latest()->first();

        // If no batch exists yet, seed an initial demonstration batch so the Super Admin immediately experiences the complete workflow
        if (! $currentBatch) {
            $currentBatch = $this->seedInitialDemoBatch();
        }

        // All batches for History view
        $batches = AcademicCalendarImportBatch::with('creator')
            ->latest()
            ->paginate(15);

        // Events for the active batch
        $eventsQuery = AcademicCalendarImportEvent::where('batch_id', $currentBatch->id);
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $eventsQuery->where('category', $request->input('category'));
        }
        if ($request->filled('validation_status') && $request->input('validation_status') !== 'all') {
            $eventsQuery->where('validation_status', $request->input('validation_status'));
        }
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $eventsQuery->where('status', $request->input('status'));
        }

        $events = $eventsQuery->orderBy('start_date', 'asc')->get();

        return Inertia::render('schedule/calendar/import', [
            'academicPeriods' => $academicPeriods,
            'currentBatch' => $currentBatch,
            'batches' => $batches,
            'events' => $events,
            'rules' => $rules,
            'stats' => [
                'total_detected' => $currentBatch->detected_count,
                'valid_count' => $currentBatch->events()->where('validation_status', 'valid')->count(),
                'needs_attention_count' => $currentBatch->needs_attention_count,
                'duplicates_count' => $currentBatch->events()->where('validation_status', 'duplicate')->count(),
                'approved_count' => $currentBatch->approved_count,
                'rejected_count' => $currentBatch->rejected_count,
            ],
            'filters' => [
                'category' => $request->input('category', 'all'),
                'validation_status' => $request->input('validation_status', 'all'),
                'status' => $request->input('status', 'all'),
            ],
        ]);
    }

    /**
     * Upload an official academic calendar document and initiate AI interpretation.
     */
    public function upload(Request $request): RedirectResponse
    {
        @set_time_limit(180);

        $validated = $request->validate([
            'academic_year' => 'required|string',
            'semester_scope' => 'required|string',
            'institution' => 'nullable|string',
            'calendar_file' => [
                'required',
                'file',
                'max:25600',
                function ($attribute, $value, $fail) {
                    $ext = strtolower($value->getClientOriginalExtension());
                    $allowedExts = ['pdf', 'doc', 'docx', 'dot', 'dotx', 'xlsx', 'xls', 'csv', 'txt', 'rtf', 'jpg', 'jpeg', 'png', 'webp'];
                    if (! in_array($ext, $allowedExts)) {
                        $fail('The '.$attribute.' must be a valid document file (DOCX, DOC, PDF, XLSX, CSV, TXT, or Image).');
                    }
                },
            ],
        ]);

        try {
            $batch = $this->importService->storeAndExtractText(
                $request->file('calendar_file'),
                $validated['academic_year'],
                $validated['semester_scope'],
                $validated['institution'] ?? 'CIDS - College of Information and Computing Sciences'
            );

            $candidateEvents = $this->importService->interpretWithGemini($batch);
            $this->importService->validateAndQueueEvents($batch, $candidateEvents);

            return redirect()->route('schedule.calendar.import', ['batch_id' => $batch->id])
                ->with('success', "Academic Calendar ingested successfully. Gemini extracted {$batch->detected_count} events for Super Admin review.");
        } catch (\Throwable $e) {
            Log::error('Academic calendar upload failure: '.$e->getMessage(), [
                'exception' => $e,
            ]);

            return back()->with('error', 'Failed to ingest academic calendar: '.$e->getMessage());
        }
    }

    /**
     * Approve a single candidate event into official Calendar.
     */
    public function approveEvent(Request $request, AcademicCalendarImportEvent $event): RedirectResponse
    {
        $validated = $request->validate([
            'confirmed_scheduling_effect' => 'nullable|string',
        ]);

        $this->importService->promoteEventToOfficialCalendar($event, $validated['confirmed_scheduling_effect'] ?? null);

        return redirect()->back()->with('success', "'{$event->title}' approved and published into official Calendar.");
    }

    /**
     * Bulk approve multiple valid records at once.
     */
    public function bulkApprove(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'event_ids' => 'required|array',
            'event_ids.*' => 'exists:academic_calendar_import_events,id',
        ]);

        $events = AcademicCalendarImportEvent::whereIn('id', $validated['event_ids'])
            ->where('status', 'pending')
            ->get();

        $count = 0;
        foreach ($events as $event) {
            $this->importService->promoteEventToOfficialCalendar($event);
            $count++;
        }

        return redirect()->back()->with('success', "Bulk approved {$count} academic calendar records into official system.");
    }

    /**
     * Reject a candidate event.
     */
    public function rejectEvent(AcademicCalendarImportEvent $event): RedirectResponse
    {
        $event->update([
            'status' => 'rejected',
        ]);
        $event->batch->recalculateCounts();

        return redirect()->back()->with('success', "'{$event->title}' rejected.");
    }

    /**
     * Delete a specific candidate event from the import queue.
     */
    public function deleteEvent(AcademicCalendarImportEvent $event): RedirectResponse
    {
        $batch = $event->batch;
        $title = $event->title;

        // If it was already approved and linked to destination, remove destination record too
        if ($event->destination_type && $event->destination_id) {
            try {
                $destClass = $event->destination_type;
                if (class_exists($destClass)) {
                    $destClass::where('id', $event->destination_id)->delete();
                }
            } catch (\Throwable $e) {
                Log::warning("Could not delete destination record during candidate deletion: {$e->getMessage()}");
            }
        }

        $event->delete();
        $batch->recalculateCounts();

        return redirect()->back()->with('success', "Event '{$title}' has been deleted from import queue.");
    }

    /**
     * Edit a candidate event manually during review.
     */
    public function updateEvent(Request $request, AcademicCalendarImportEvent $event): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'semester' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'proposed_scheduling_effect' => 'required|string',
            'validation_status' => 'nullable|string',
        ]);

        $event->update([
            ...$validated,
            'is_manually_corrected' => true,
            'validation_status' => $validated['validation_status'] ?? 'valid',
            'validation_notes' => 'Manually updated and verified by Super Admin.',
        ]);

        $event->batch->recalculateCounts();

        return redirect()->back()->with('success', "Event '{$event->title}' updated.");
    }

    /**
     * Update reusable import rule.
     */
    public function updateRule(Request $request, AcademicCalendarImportRule $rule): RedirectResponse
    {
        $validated = $request->validate([
            'default_scheduling_effect' => 'required|string',
            'suggested_destination_module' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'required|boolean',
        ]);

        $rule->update($validated);

        return redirect()->back()->with('success', 'Import rule updated successfully.');
    }

    /**
     * Re-run Gemini AI interpretation on an existing batch.
     */
    public function reanalyzeBatch(AcademicCalendarImportBatch $batch): RedirectResponse
    {
        @set_time_limit(180);

        try {
            $batch->events()->delete();
            $candidateEvents = $this->importService->interpretWithGemini($batch);
            $this->importService->validateAndQueueEvents($batch, $candidateEvents);

            return redirect()->back()->with('success', "Batch #{$batch->id} re-analyzed with Gemini AI. Detected {$batch->fresh()->detected_count} events.");
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Failed to re-analyze batch: '.$e->getMessage());
        }
    }

    /**
     * Rollback an entire import batch.
     */
    public function rollbackBatch(AcademicCalendarImportBatch $batch): RedirectResponse
    {
        $this->importService->rollbackBatch($batch);

        return redirect()->back()->with('success', "Batch #{$batch->id} rolled back. Promoted events were safely removed from the official Calendar.");
    }

    /**
     * Seed initial demo batch if table is empty.
     */
    protected function seedInitialDemoBatch(): AcademicCalendarImportBatch
    {
        $batch = AcademicCalendarImportBatch::create([
            'academic_year' => 'AY 2026–2027',
            'semester_scope' => 'Whole Academic Year',
            'institution' => 'CIDS - College of Information and Computing Sciences',
            'original_filename' => 'Official_CIDS_Academic_Calendar_AY2026_2027.pdf',
            'file_path' => 'academic_calendars/demo_calendar.pdf',
            'file_type' => 'pdf',
            'file_size_bytes' => 245760,
            'extracted_text' => "OFFICIAL ACADEMIC CALENDAR AY 2026-2027\nOctober 12–17 – Midterm Examinations\nSecond week of November – Research Week\nNovember 30 – Bonifacio Day (National Regular Holiday)\nOctober 8 – Deadline for Submission of TOS and Test Questions for Midterms\nOctober 30 – Last day of encoding midterm grades in the faculty portal\nAugust 24–28 – Late Registration, Adding and Dropping of Courses\nOctober 12 (Morning) – Annual CIDS Collegiate Foundation Showcase",
            'status' => 'pending_review',
            'created_by' => 1,
        ]);

        $candidateEvents = $this->importService->interpretWithGemini($batch);
        $this->importService->validateAndQueueEvents($batch, $candidateEvents);

        return $batch->fresh(['events', 'creator']);
    }
}
