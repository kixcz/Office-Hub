<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Requirement;
use App\Models\Submission;
use App\Models\Program;
use App\Models\Meeting;
use App\Models\Activity;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();
        
        // Basic Stats
        $activeRequirements = Requirement::where('due_date', '>=', $now)->count();
        $totalSubmissions = Submission::count();
        
        $submissions = Submission::with('requirement', 'faculty.program')->get();
        
        $pending = 0;
        $overdue = 0;
        $complied = 0;
        $onTime = 0;
        $late = 0;
        
        foreach($submissions as $s) {
            $dueDate = Carbon::parse($s->requirement->due_date);
            if ($s->submitted_at) {
                $complied++;
                if (Carbon::parse($s->submitted_at)->greaterThan($dueDate)) {
                    $late++;
                } else {
                    $onTime++;
                }
            } else {
                if ($now->greaterThan($dueDate)) {
                    $overdue++;
                } else {
                    $pending++;
                }
            }
        }
        
        $stats = [
            'active_requirements' => $activeRequirements,
            'total_submissions' => $totalSubmissions,
            'pending_outputs' => $pending,
            'overdue_outputs' => $overdue,
        ];
        
        $complianceSummary = [
            'total' => $totalSubmissions,
            'complied' => $complied,
            'on_time' => $onTime,
            'late' => $late,
            'pending' => $pending,
            'overdue' => $overdue,
            'compliance_rate' => $totalSubmissions > 0 ? round(($complied / $totalSubmissions) * 100, 1) : 0,
            'on_time_rate' => $totalSubmissions > 0 ? round(($onTime / $totalSubmissions) * 100, 1) : 0,
        ];
        
        // Program Compliance
        $programsData = [];
        $programs = Program::with('faculties.submissions.requirement')->get();
        foreach($programs as $p) {
            $pTotal = 0;
            $pComplied = 0;
            $pOnTime = 0;
            foreach($p->faculties as $f) {
                foreach($f->submissions as $s) {
                    $pTotal++;
                    if ($s->submitted_at) {
                        $pComplied++;
                        if (!Carbon::parse($s->submitted_at)->greaterThan(Carbon::parse($s->requirement->due_date))) {
                            $pOnTime++;
                        }
                    }
                }
            }
            $programsData[] = [
                'id' => $p->id,
                'name' => $p->code,
                'compliance_rate' => $pTotal > 0 ? round(($pComplied / $pTotal) * 100, 1) : 0,
                'on_time_rate' => $pTotal > 0 ? round(($pOnTime / $pTotal) * 100, 1) : 0,
            ];
        }
        
        // Today's Schedule
        $today = $now->format('Y-m-d');
        $meetings = Meeting::where('date', $today)->get()->map(fn($m) => [
            'title' => $m->title,
            'time' => $m->start_time . ' - ' . $m->end_time,
            'type' => 'Meeting',
            'venue' => $m->venue
        ]);
        
        $activities = Activity::where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->get()->map(fn($a) => [
            'title' => $a->title,
            'time' => 'All Day', // simplifying for dash
            'type' => 'Activity',
            'venue' => $a->venue
        ]);
        
        $todaysSchedule = $meetings->concat($activities);
        
        // Upcoming Deadlines
        $upcomingDeadlines = Requirement::where('due_date', '>=', $now)
            ->orderBy('due_date', 'asc')
            ->take(5)
            ->get();
            
        // Urgent Pending Outputs
        $urgentPending = $submissions->filter(function($s) {
            return !$s->submitted_at;
        })->sortBy(function($s) {
            return Carbon::parse($s->requirement->due_date)->timestamp;
        })->take(5)->map(function($s) use ($now) {
            $dueDate = Carbon::parse($s->requirement->due_date);
            return [
                'id' => $s->id,
                'faculty' => $s->faculty ? $s->faculty->first_name . ' ' . $s->faculty->last_name : 'Unknown',
                'program' => $s->faculty && $s->faculty->program ? $s->faculty->program->code : 'N/A',
                'requirement' => $s->requirement->title,
                'due_date' => $s->requirement->due_date,
                'status' => $now->greaterThan($dueDate) ? 'Overdue' : 'Pending',
                'urgency_days' => $now->diffInDays($dueDate, false)
            ];
        })->values();

        // Top Performing Programs
        $topPrograms = collect($programsData)->sortByDesc(function($p) {
            return $p['on_time_rate'] * 100 + $p['compliance_rate'];
        })->take(3)->values();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'compliance_summary' => $complianceSummary,
            'program_compliance' => $programsData,
            'todays_schedule' => $todaysSchedule,
            'upcoming_deadlines' => $upcomingDeadlines,
            'urgent_pending' => $urgentPending,
            'top_programs' => $topPrograms,
            'current_term' => 'AY 2026-2027, 1st Semester',
        ]);
    }
}
