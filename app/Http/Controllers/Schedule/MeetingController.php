<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MeetingController extends Controller
{
    public function index()
    {
        $scopeCollegeId = CalendarController::resolveCollegeId();

        $meetingsQuery = Meeting::with(['organizer', 'program'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc');

        $programsQuery = Program::query();

        if ($scopeCollegeId) {
            $collegeProgramIds = Program::where('college_id', $scopeCollegeId)->pluck('id')->toArray();
            $programsQuery->where('college_id', $scopeCollegeId);

            $meetingsQuery->where(function ($q) use ($collegeProgramIds, $scopeCollegeId) {
                if (! empty($collegeProgramIds)) {
                    $q->whereIn('program_id', $collegeProgramIds);
                    foreach ($collegeProgramIds as $pid) {
                        $q->orWhereJsonContains('program_ids', (int) $pid)
                            ->orWhereJsonContains('program_ids', (string) $pid);
                    }
                }
                $q->orWhere(function ($sub) use ($scopeCollegeId) {
                    $sub->whereNull('program_id')
                        ->where(function ($orgQ) use ($scopeCollegeId) {
                            $orgQ->whereHas('organizer', function ($uq) use ($scopeCollegeId) {
                                $uq->where('college_id', $scopeCollegeId)
                                    ->orWhereNull('college_id');
                            })
                                ->orWhereDoesntHave('organizer');
                        });
                });
            });
        }

        $meetings = $meetingsQuery->get()
            ->each(function ($meeting) {
                $meeting->append('programs');
            });

        $programs = $programsQuery->get();

        return Inertia::render('schedule/meetings/index', [
            'meetings' => $meetings,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'venue' => 'nullable|string|max:255',
            'agenda' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|string',
            'program_id' => 'nullable|exists:programs,id',
            'program_ids' => 'nullable|array',
            'program_ids.*' => 'exists:programs,id',
        ]);

        $programIds = $validated['program_ids'] ?? [];
        if (! empty($validated['program_id']) && ! in_array($validated['program_id'], $programIds)) {
            $programIds[] = $validated['program_id'];
        }

        if (! empty($programIds)) {
            $validated['program_ids'] = array_values(array_unique(array_map('intval', $programIds)));
            $validated['program_id'] = $validated['program_ids'][0] ?? null;
        } else {
            $validated['program_ids'] = null;
            $validated['program_id'] = null;
        }

        $validated['organizer_id'] = $request->user()->id;

        Meeting::create($validated);

        CalendarController::clearCalendarCache();

        return redirect()->back()->with('success', 'Meeting created successfully.');
    }

    public function destroy(Meeting $meeting)
    {
        $meeting->delete();

        CalendarController::clearCalendarCache();

        return redirect()->back()->with('success', 'Meeting deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:meetings,id',
        ]);

        $count = Meeting::whereIn('id', $validated['ids'])->delete();

        CalendarController::clearCalendarCache();

        return redirect()->back()->with('success', "{$count} meeting(s) deleted successfully.");
    }
}
