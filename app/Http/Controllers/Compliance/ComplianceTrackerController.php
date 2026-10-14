<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\Submission;
use App\Services\ComplianceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceTrackerController extends Controller
{
    public function index(Request $request): Response
    {
        ComplianceService::syncPendingSubmissions();

        $programs = Program::orderBy('code')->get();
        $requirements = Requirement::orderBy('title')->get();

        $selectedYear = $request->query('year', '2026 – 2027');
        $selectedSemester = $request->query('semester', '1st Semester');
        $selectedProgram = $request->query('program', 'all');
        $selectedRequirement = $request->query('requirement', 'all');
        $selectedStatus = $request->query('status', 'all');
        $search = $request->query('search', '');

        $now = Carbon::now();

        // 1. Program Compliance Data dynamically computed from real submissions
        $allSubmissions = Submission::with(['faculty.program', 'requirement'])->get();

        $programStats = $programs->map(function ($prog) use ($allSubmissions, $now) {
            $progSubmissions = $allSubmissions->filter(function ($s) use ($prog) {
                return $s->faculty && $s->faculty->program_id === $prog->id;
            });

            $total = $progSubmissions->count();
            $submitted = $progSubmissions->whereNotNull('submitted_at')->count();
            $pending = 0;
            $overdue = 0;

            foreach ($progSubmissions->whereNull('submitted_at') as $sub) {
                $dueDate = $sub->requirement ? Carbon::parse($sub->requirement->due_date) : $now;
                if ($now->greaterThan($dueDate)) {
                    $overdue++;
                } else {
                    $pending++;
                }
            }

            $rate = $total > 0 ? round(($submitted / $total) * 100) : 100;
            $status = $rate >= 80 ? 'Compliant' : ($rate >= 50 ? 'In Progress' : 'Needs Attention');

            return [
                'id' => $prog->id,
                'code' => $prog->code,
                'name' => "{$prog->code} – {$prog->name}",
                'submitted' => $submitted,
                'pending' => $pending,
                'overdue' => $overdue,
                'total' => $total,
                'compliance_rate' => $rate,
                'status' => $status,
            ];
        })->values()->toArray();

        // 2. Requirement Progress Items (Computed from actual requirements and submissions)
        $requirementProgress = $requirements->take(5)->map(function ($req) use ($allSubmissions) {
            $reqSubs = $allSubmissions->where('requirement_id', $req->id);
            $total = $reqSubs->count();
            $completed = $reqSubs->whereNotNull('submitted_at')->count();
            $status = $total > 0 && $completed === $total ? 'Completed' : 'In Progress';

            return [
                'title' => $req->title,
                'completed' => $completed,
                'total' => $total,
                'status' => $status,
            ];
        })->values()->toArray();

        // 3. Upcoming Deadlines
        $upcomingDeadlines = $requirements->filter(function ($r) use ($now) {
            return $r->due_date && Carbon::parse($r->due_date)->greaterThanOrEqualTo($now->copy()->subDays(1));
        })->sortBy('due_date')->take(3)->map(function ($r) use ($now) {
            $d = Carbon::parse($r->due_date);
            $diff = $now->diffInDays($d, false);
            $badge = $diff < 0 ? 'Overdue' : ($diff <= 3 ? 'Due Soon' : 'Upcoming');
            $badgeColor = $diff < 0 ? 'rose' : ($diff <= 3 ? 'amber' : 'blue');
            $daysLeft = $diff < 0 ? abs($diff).' days overdue' : ($diff === 0 ? 'Due Today' : "{$diff} days left");

            return [
                'day' => $d->format('d'),
                'month' => strtoupper($d->format('M')),
                'title' => $r->title,
                'scope' => $r->program ? $r->program->code : 'All Programs',
                'badge' => $badge,
                'badge_color' => $badgeColor,
                'days_left' => $daysLeft,
            ];
        })->values()->toArray();

        // Total metrics matching exact database state
        $totalCompleted = $allSubmissions->whereNotNull('submitted_at')->count();
        $totalSubmissionsCount = $allSubmissions->count();
        $totalPending = 0;
        $totalOverdue = 0;

        foreach ($allSubmissions->whereNull('submitted_at') as $sub) {
            $dueDate = $sub->requirement ? Carbon::parse($sub->requirement->due_date) : $now;
            if ($now->greaterThan($dueDate)) {
                $totalOverdue++;
            } else {
                $totalPending++;
            }
        }

        $overallRate = $totalSubmissionsCount > 0 ? round(($totalCompleted / $totalSubmissionsCount) * 100) : 100;

        return Inertia::render('compliance/tracker/index', [
            'stats' => [
                'overall_rate' => $overallRate,
                'growth' => '+12%',
                'completed' => $totalCompleted,
                'pending' => $totalPending,
                'overdue' => $totalOverdue,
                'active_requirements' => $requirements->count(),
                'total_programs' => $programs->count(),
            ],
            'program_stats' => $programStats,
            'requirement_progress' => $requirementProgress,
            'upcoming_deadlines' => $upcomingDeadlines,
            'programs' => $programs,
            'requirements' => $requirements,
            'filters' => [
                'year' => $selectedYear,
                'semester' => $selectedSemester,
                'program' => $selectedProgram,
                'requirement' => $selectedRequirement,
                'status' => $selectedStatus,
                'search' => $search,
            ],
        ]);
    }
}
