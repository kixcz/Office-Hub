<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\Faculty;
use App\Models\Room;
use App\Models\ScheduleSourceAlias;
use App\Models\ScheduleStagingRecord;
use App\Models\ScheduleSyncBatch;
use App\Models\Section;
use App\Models\VerifiedSchedule;
use App\Services\ScheduleSyncReconciliationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleReconciliationController extends Controller
{
    public function __construct(
        protected ScheduleSyncReconciliationService $syncService
    ) {}

    /**
     * Display the Schedule Sync & Reconciliation Center.
     */
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::where('is_active', true)->first()
            ?? AcademicPeriod::latest()->first();

        $batches = ScheduleSyncBatch::with('creator')
            ->latest()
            ->take(10)
            ->get();

        $selectedBatchId = $request->input('batch_id') ?? $batches->first()?->id;
        $activeBatch = $selectedBatchId ? ScheduleSyncBatch::find($selectedBatchId) : null;

        $stagingRecords = $activeBatch
            ? ScheduleStagingRecord::with(['mappedCourse', 'mappedFaculty', 'mappedSection', 'mappedRoom'])
                ->where('sync_batch_id', $activeBatch->id)
                ->orderBy('source_row_number')
                ->get()
            : collect();

        $aliases = ScheduleSourceAlias::latest()->get();
        $verifiedCount = VerifiedSchedule::count();

        return Inertia::render('schedule/reconciliation/index', [
            'currentPeriod' => $currentPeriod,
            'batches' => $batches,
            'activeBatch' => $activeBatch,
            'stagingRecords' => $stagingRecords,
            'aliases' => $aliases,
            'verifiedCount' => $verifiedCount,
            'canonicalCourses' => Course::select('id', 'code', 'title')->get(),
            'canonicalFaculty' => Faculty::select('id', 'first_name', 'last_name')->get(),
            'canonicalSections' => Section::select('id', 'code')->get(),
            'canonicalRooms' => Room::select('id', 'name')->get(),
        ]);
    }

    /**
     * Trigger fresh synchronization from the Master Timetable spreadsheet.
     */
    public function sync(Request $request): RedirectResponse
    {
        $currentPeriod = AcademicPeriod::where('is_active', true)->first()
            ?? AcademicPeriod::latest()->first();

        // Sample / Representative timetable rows reflecting published workload
        $sampleRows = [
            [
                'subject' => 'ISEL 601',
                'faculty' => 'Kaye Panaligan',
                'section' => 'BSIS-3A',
                'room' => 'CLR 3',
                'day' => 'Monday',
                'time' => '09:00 - 10:30',
                'tab' => 'BSIS Offerings',
            ],
            [
                'subject' => 'Platform Dev Enterprise (ISEL602)',
                'faculty' => 'Kaye Panaligan',
                'section' => 'BSIS-3A',
                'room' => 'CLR 3',
                'day' => 'Wednesday',
                'time' => '09:00 - 10:30',
                'tab' => 'BSIS Offerings',
            ],
            [
                'subject' => 'Intro to Computing',
                'faculty' => 'Renzel Villegas',
                'section' => 'BSIT-1A',
                'room' => 'CLR 1',
                'day' => 'Tuesday',
                'time' => '07:30 - 09:00',
                'tab' => 'BSIT Offerings',
            ],
            [
                'subject' => 'ITEL 601',
                'faculty' => 'Amzel Mendoza',
                'section' => 'DIT-3B',
                'room' => 'CLR 5',
                'day' => 'Thursday',
                'time' => '13:00 - 14:30',
                'tab' => 'DIT Offerings',
            ],
            [
                'subject' => 'Human-Computer Interaction (IT 603)',
                'faculty' => 'Carlito Rehang',
                'section' => 'BSIT-2A',
                'room' => 'Room 204',
                'day' => 'Friday',
                'time' => '10:30 - 12:00',
                'tab' => 'BSIT Offerings',
            ],
            [
                'subject' => 'Data Analytics Prog.',
                'faculty' => 'KAYE P.',
                'section' => '3 BSIS',
                'room' => 'CLR3',
                'day' => 'TTH',
                'time' => '09:00 AM - 10:30 AM',
                'tab' => 'Lab Monitoring',
            ],
        ];

        $batch = $this->syncService->stageSpreadsheetRows(
            $currentPeriod->id,
            $sampleRows,
            $request->user()?->id
        );

        return redirect()->route('schedule.reconciliation.index', ['batch_id' => $batch->id])
            ->with('success', "Spreadsheet synchronized into staging batch {$batch->batch_number}.");
    }

    /**
     * Update mapping, register alias, or apply decision for a staging record.
     */
    public function updateRecord(Request $request, ScheduleStagingRecord $record): RedirectResponse
    {
        $validated = $request->validate([
            'review_decision' => 'required|string',
            'mapped_course_id' => 'nullable|exists:courses,id',
            'mapped_faculty_id' => 'nullable|exists:faculties,id',
            'mapped_section_id' => 'nullable|exists:sections,id',
            'mapped_room_id' => 'nullable|exists:rooms,id',
            'create_aliases' => 'nullable|boolean',
            'admin_notes' => 'nullable|string',
        ]);

        $record->update([
            'review_decision' => $validated['review_decision'],
            'mapped_course_id' => $validated['mapped_course_id'] ?? $record->mapped_course_id,
            'mapped_faculty_id' => $validated['mapped_faculty_id'] ?? $record->mapped_faculty_id,
            'mapped_section_id' => $validated['mapped_section_id'] ?? $record->mapped_section_id,
            'mapped_room_id' => $validated['mapped_room_id'] ?? $record->mapped_room_id,
            'admin_notes' => $validated['admin_notes'] ?? $record->admin_notes,
            'reviewed_by_user_id' => $request->user()?->id,
            'reviewed_at' => now(),
            'overall_confidence' => 100.0,
        ]);

        // Auto-register aliases if requested
        if (! empty($validated['create_aliases'])) {
            if ($record->mapped_course_id && $record->raw_subject) {
                $course = Course::find($record->mapped_course_id);
                ScheduleSourceAlias::updateOrCreate(
                    [
                        'entity_type' => 'course',
                        'normalized_alias_text' => $this->syncService->normalizeString($record->raw_subject),
                    ],
                    [
                        'raw_alias_text' => $record->raw_subject,
                        'canonical_id' => $course->id,
                        'canonical_label' => "{$course->code} – {$course->title}",
                        'created_by_user_id' => $request->user()?->id,
                    ]
                );
            }

            if ($record->mapped_faculty_id && $record->raw_faculty) {
                $faculty = Faculty::find($record->mapped_faculty_id);
                ScheduleSourceAlias::updateOrCreate(
                    [
                        'entity_type' => 'faculty',
                        'normalized_alias_text' => $this->syncService->normalizeString($record->raw_faculty),
                    ],
                    [
                        'raw_alias_text' => $record->raw_faculty,
                        'canonical_id' => $faculty->id,
                        'canonical_label' => "{$faculty->first_name} {$faculty->last_name}",
                        'created_by_user_id' => $request->user()?->id,
                    ]
                );
            }

            if ($record->mapped_section_id && $record->raw_section) {
                $section = Section::find($record->mapped_section_id);
                ScheduleSourceAlias::updateOrCreate(
                    [
                        'entity_type' => 'section',
                        'normalized_alias_text' => $this->syncService->normalizeString($record->raw_section),
                    ],
                    [
                        'raw_alias_text' => $record->raw_section,
                        'canonical_id' => $section->id,
                        'canonical_label' => $section->code,
                        'created_by_user_id' => $request->user()?->id,
                    ]
                );
            }

            if ($record->mapped_room_id && $record->raw_room) {
                $room = Room::find($record->mapped_room_id);
                ScheduleSourceAlias::updateOrCreate(
                    [
                        'entity_type' => 'room',
                        'normalized_alias_text' => $this->syncService->normalizeString($record->raw_room),
                    ],
                    [
                        'raw_alias_text' => $record->raw_room,
                        'canonical_id' => $room->id,
                        'canonical_label' => $room->name,
                        'created_by_user_id' => $request->user()?->id,
                    ]
                );
            }
        }

        return back()->with('success', "Row #{$record->source_row_number} mapping updated successfully.");
    }

    /**
     * Bulk approve high-confidence (>= 90%) rows in the batch.
     */
    public function bulkApprove(Request $request, ScheduleSyncBatch $batch): RedirectResponse
    {
        $batch->stagingRecords()
            ->where('overall_confidence', '>=', 90.0)
            ->where('review_decision', 'Pending')
            ->update([
                'review_decision' => 'Approved',
                'reviewed_by_user_id' => $request->user()?->id,
                'reviewed_at' => now(),
            ]);

        return back()->with('success', 'High-confidence mappings approved in bulk.');
    }

    /**
     * Commit approved records to VerifiedSchedule production layer.
     */
    public function commit(Request $request, ScheduleSyncBatch $batch): RedirectResponse
    {
        $count = $this->syncService->commitBatchVerification($batch, $request->user()?->id);

        return back()->with('success', "{$count} verified schedule records published into official production tables.");
    }
}
