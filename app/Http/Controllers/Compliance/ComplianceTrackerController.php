<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Models\Requirement;
use App\Models\Program;
use Inertia\Inertia;

class ComplianceTrackerController extends Controller
{
    public function index()
    {
        $totalSubmissions = Submission::count();
        $completedSubmissions = Submission::whereNotNull('submitted_at')->count();
        $pendingSubmissions = Submission::whereNull('submitted_at')->count();

        $overdueSubmissions = Submission::whereNull('submitted_at')
            ->whereHas('requirement', function($q) {
                $q->where('due_date', '<', now());
            })->count();

        $overallRate = $totalSubmissions > 0 ? round(($completedSubmissions / $totalSubmissions) * 100) : 0;

        $stats = [
            'overall_rate' => $overallRate,
            'completed' => $completedSubmissions,
            'pending' => $pendingSubmissions,
            'overdue' => $overdueSubmissions,
            'total' => $totalSubmissions,
        ];

        return Inertia::render('compliance/tracker/index', [
            'stats' => $stats
        ]);
    }
}
