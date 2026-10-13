<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        self::ensureBaselineAnnouncements();

        $query = Announcement::with('author')->latest('publish_at');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('priority') && $request->input('priority') !== 'all') {
            $query->where('priority', strtolower($request->input('priority')));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', strtolower($request->input('status')));
        }

        $announcements = $query->paginate(10)->withQueryString();

        $totalCount = Announcement::count();
        $activeCount = Announcement::where('status', 'active')->count();
        $scheduledCount = Announcement::where('status', 'scheduled')->count();
        $archivedCount = Announcement::where('status', 'archived')->count();

        $stats = [
            'total' => $totalCount,
            'active' => $activeCount,
            'scheduled' => $scheduledCount,
            'archived' => $archivedCount,
            'active_percentage' => $totalCount > 0 ? round(($activeCount / $totalCount) * 100) : 100,
            'scheduled_percentage' => $totalCount > 0 ? round(($scheduledCount / $totalCount) * 100) : 0,
            'archived_percentage' => $totalCount > 0 ? round(($archivedCount / $totalCount) * 100) : 0,
        ];

        $categories = Announcement::select('category')->distinct()->pluck('category')->filter()->values();

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
            'stats' => $stats,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'priority', 'status']),
        ]);
    }

    /**
     * Seed baseline announcements matching UI mockup if not already created.
     */
    public static function ensureBaselineAnnouncements(): void
    {
        $authorId = auth()->id() ?: (User::first()?->id ?: 1);

        Announcement::firstOrCreate(
            ['title' => 'Midterm Examination Schedule'],
            [
                'message' => 'Please be guided with the midterm examination schedule for the First Semester, AY 2026–2027. Students are advised to verify their room assignments and secure examination permits accordingly.',
                'category' => 'General',
                'priority' => 'normal',
                'destination' => 'public',
                'status' => 'active',
                'publish_at' => Carbon::parse('2026-10-13 11:00:00'),
                'expire_at' => Carbon::parse('2026-10-25 17:00:00'),
                'author_id' => $authorId,
            ]
        );

        Announcement::firstOrCreate(
            ['title' => 'Submission of TOS and TQ'],
            [
                'message' => 'All graduating students are required to submit their respective TOS and TQ forms on or before the departmental deadline to ensure proper clearance and endorsement.',
                'category' => 'Requirement',
                'priority' => 'normal',
                'destination' => 'office',
                'status' => 'active',
                'publish_at' => Carbon::parse('2026-10-12 09:00:00'),
                'expire_at' => Carbon::parse('2026-10-20 17:00:00'),
                'author_id' => $authorId,
            ]
        );

        Announcement::firstOrCreate(
            ['title' => 'Enrollment for Second Semester'],
            [
                'message' => 'Online enrollment for the Second Semester, AY 2026–2027 will begin on November 3, 2026. Please complete prerequisites and check your academic evaluation prior to registration.',
                'category' => 'Enrollment',
                'priority' => 'high',
                'destination' => 'public',
                'status' => 'active',
                'publish_at' => Carbon::parse('2026-11-03 08:00:00'),
                'expire_at' => Carbon::parse('2026-11-15 17:00:00'),
                'author_id' => $authorId,
            ]
        );
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
