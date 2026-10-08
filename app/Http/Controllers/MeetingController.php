<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MeetingController extends Controller
{
    public function index()
    {
        $meetings = Meeting::with('organizer')
            ->orderBy('start_time', 'asc')
            ->get();

        return Inertia::render('meetings/index', [
            'meetings' => $meetings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'location' => 'nullable|string|max:255',
            'is_public' => 'boolean',
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
