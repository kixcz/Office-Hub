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
        $meetings = Meeting::with(['organizer', 'program'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get()
            ->each(function ($meeting) {
                $meeting->append('programs');
            });

        $programs = Program::all();

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

        return redirect()->back()->with('success', 'Meeting created successfully.');
    }

    public function destroy(Meeting $meeting)
    {
        $meeting->delete();

        return redirect()->back()->with('success', 'Meeting deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:meetings,id',
        ]);

        $count = Meeting::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', "{$count} meeting(s) deleted successfully.");
    }
}
