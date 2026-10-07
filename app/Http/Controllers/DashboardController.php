<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Announcement;
use App\Models\Task;
use App\Models\DocumentRoute;
use App\Models\Requirement;
use App\Models\Submission;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Stats
        $stats = [
            'active_announcements' => Announcement::where('status', 'active')->count(),
            'pending_tasks' => Task::where('status', '!=', 'completed')->count(),
            'active_documents' => DocumentRoute::where('status', '!=', 'released')->count(),
        ];

        // Specific to Faculty vs Admin
        // For simplicity we will fetch overall pending requirements
        // A pending requirement is one where the user hasn't submitted yet
        $pendingRequirements = Requirement::whereDoesntHave('submissions', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->where(function ($query) use ($user) {
            $query->whereNull('assigned_to')->orWhere('assigned_to', $user->id);
        })->count();

        $stats['pending_requirements'] = $pendingRequirements;

        $recentAnnouncements = Announcement::where('status', 'active')
            ->latest()
            ->take(3)
            ->get();

        $recentDocuments = DocumentRoute::latest()->take(5)->get();
        $recentTasks = Task::where('status', '!=', 'completed')->latest()->take(4)->get();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recent_announcements' => $recentAnnouncements,
            'recent_documents' => $recentDocuments,
            'recent_tasks' => $recentTasks,
        ]);
    }
}
