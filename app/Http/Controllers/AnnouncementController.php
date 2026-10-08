<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $announcements = Announcement::with('author')->latest()->paginate(10);

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('announcements/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'category' => 'nullable|string|max:255',
            'priority' => 'required|in:normal,high,urgent',
            'destination' => 'required|in:public,office',
            'status' => 'required|in:draft,approval,scheduled,active,archived',
            'publish_at' => 'nullable|date',
            'expire_at' => 'nullable|date|after_or_equal:publish_at',
        ]);

        $validated['author_id'] = auth()->id();

        Announcement::create($validated);

        return redirect()->route('announcements.index')->with('success', 'Announcement created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Announcement $announcement)
    {
        return Inertia::render('announcements/edit', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'category' => 'nullable|string|max:255',
            'priority' => 'required|in:normal,high,urgent',
            'destination' => 'required|in:public,office',
            'status' => 'required|in:draft,approval,scheduled,active,archived',
            'publish_at' => 'nullable|date',
            'expire_at' => 'nullable|date|after_or_equal:publish_at',
        ]);

        $announcement->update($validated);

        return redirect()->route('announcements.index')->with('success', 'Announcement updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return redirect()->route('announcements.index')->with('success', 'Announcement deleted successfully.');
    }
}
