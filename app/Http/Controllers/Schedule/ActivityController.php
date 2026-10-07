<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index()
    {
        $activities = Activity::with('program')
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();
            
        $programs = Program::all();
            
        return Inertia::render('schedule/activities/index', [
            'activities' => $activities,
            'programs' => $programs
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'venue' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'visibility' => 'required|string',
            'status' => 'required|string',
            'program_id' => 'nullable|exists:programs,id',
        ]);

        Activity::create($validated);

        return redirect()->back()->with('success', 'Activity created successfully.');
    }

    public function destroy(Activity $activity)
    {
        $activity->delete();
        return redirect()->back();
    }
}
