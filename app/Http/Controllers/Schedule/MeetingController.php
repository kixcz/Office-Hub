<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class MeetingController extends Controller
{
    public function index()
    {
        $meetings = Meeting::with(['organizer', 'program'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();
            
        $programs = Program::all();
            
        return Inertia::render('schedule/meetings/index', [
            'meetings' => $meetings,
            'programs' => $programs
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
        ]);

        $validated['organizer_id'] = $request->user()->id;

        Meeting::create($validated);

        return redirect()->back()->with('success', 'Meeting created successfully.');
    }

    public function destroy(Meeting $meeting)
    {
        $meeting->delete();
        return redirect()->back();
    }
}
