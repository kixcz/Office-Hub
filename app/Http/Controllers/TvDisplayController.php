<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\TvSetting;
use App\Models\TvSlide;
use App\Models\Announcement;
use App\Models\Meeting;
use App\Models\Activity;
use App\Models\Requirement;
use App\Models\Submission;
use App\Models\Program;

class TvDisplayController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $today = $now->format('Y-m-d');
        
        // 1. Settings & Playlist
        $settings = TvSetting::pluck('value', 'key')->toArray();
        $slides = TvSlide::where('is_active', true)->orderBy('order')->get();

        // Data for Slide 1 (Daily Overview)
        $activeAnnouncements = Announcement::where('status', 'active')->latest()->get();
        
        $meetingsToday = Meeting::where('date', $today)->orderBy('start_time')->get()->map(fn($m) => [
            'id' => $m->id,
            'title' => $m->title,
            'time' => $m->start_time . ' - ' . $m->end_time,
            'venue' => $m->venue,
            'type' => 'Meeting',
        ]);
        
        $activitiesToday = Activity::where('start_date', '<=', $today)->where('end_date', '>=', $today)->get()->map(fn($a) => [
            'id' => $a->id,
            'title' => $a->title,
            'time' => 'All Day',
            'venue' => $a->venue,
            'type' => 'Activity',
        ]);
        
        $todaysSchedule = $meetingsToday->concat($activitiesToday)->sortBy('time')->values();
        
        $upcomingMeetings = Meeting::where('date', '>=', $today)
            ->orderBy('date')->orderBy('start_time')
            ->take(5)->get()->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'date' => Carbon::parse($m->date)->format('M d, Y'),
                'time' => $m->start_time . ' - ' . $m->end_time,
                'venue' => $m->venue
            ]);

        // Data for Slide 2 (Weekly Schedule)
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();
        
        $weeklyMeetings = Meeting::whereBetween('date', [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')])->get();
        $weeklyActivities = Activity::whereBetween('start_date', [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')])
            ->orWhereBetween('end_date', [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')])->get();
            
        $weeklySchedule = [];
        for ($i = 0; $i < 5; $i++) {
            $day = $weekStart->copy()->addDays($i);
            $dayStr = $day->format('Y-m-d');
            
            $dayItems = [];
            foreach($weeklyMeetings->where('date', $dayStr) as $m) {
                $dayItems[] = ['title' => $m->title, 'time' => $m->start_time, 'venue' => $m->venue, 'type' => 'Meeting'];
            }
            foreach($weeklyActivities as $a) {
                if ($dayStr >= $a->start_date && $dayStr <= $a->end_date) {
                    $dayItems[] = ['title' => $a->title, 'time' => 'All Day', 'venue' => $a->venue, 'type' => 'Activity'];
                }
            }
            
            $weeklySchedule[] = [
                'date' => $day->format('l, M d'),
                'is_today' => $dayStr == $today,
                'items' => collect($dayItems)->sortBy('time')->values()
            ];
        }

        $upcomingDeadlines = Requirement::where('due_date', '>=', $now)
            ->orderBy('due_date')->take(5)->get();

        // Data for Slide 3 (Compliance)
        $requirements = Requirement::withCount('submissions')->get();
        $totalSubmissions = Submission::count();
        $compliedSubmissions = Submission::whereNotNull('submitted_at')->count();
        $overallCompliance = $totalSubmissions > 0 ? round(($compliedSubmissions / $totalSubmissions) * 100, 1) : 0;
        
        $complianceSummary = $requirements->map(fn($r) => [
            'id' => $r->id,
            'title' => $r->title,
            'total' => $r->submissions_count,
            'complied' => $r->submissions()->whereNotNull('submitted_at')->count(),
        ])->map(function($r) {
            $r['rate'] = $r['total'] > 0 ? round(($r['complied'] / $r['total']) * 100, 1) : 0;
            return $r;
        });

        $submissions = Submission::with('requirement', 'faculty.program')->get();
        $pendingOutputs = $submissions->filter(fn($s) => !$s->submitted_at)->sortBy(fn($s) => Carbon::parse($s->requirement->due_date)->timestamp)->take(6)->map(function($s) use ($now) {
            $dueDate = Carbon::parse($s->requirement->due_date);
            return [
                'id' => $s->id,
                'faculty' => $s->faculty ? $s->faculty->first_name . ' ' . $s->faculty->last_name : 'Unknown',
                'program' => $s->faculty && $s->faculty->program ? $s->faculty->program->code : 'N/A',
                'requirement' => $s->requirement->title,
                'due_date' => $s->requirement->due_date,
                'status' => $now->greaterThan($dueDate) ? 'Overdue' : ($now->diffInDays($dueDate) <= 2 ? 'Due Soon' : 'Pending'),
            ];
        })->values();

        $overdueCount = $submissions->filter(fn($s) => !$s->submitted_at && Carbon::parse($s->requirement->due_date)->isPast())->count();
        $pendingCount = $submissions->filter(fn($s) => !$s->submitted_at && !Carbon::parse($s->requirement->due_date)->isPast())->count();

        // Data for Slide 4 (Performance)
        $programs = Program::with('faculties.submissions.requirement')->get();
        $programsData = [];
        $facultyData = [];
        
        foreach($programs as $p) {
            $pTotal = 0;
            $pComplied = 0;
            $pOnTime = 0;
            foreach($p->faculties as $f) {
                $fTotal = 0;
                $fComplied = 0;
                $fOnTime = 0;
                
                foreach($f->submissions as $s) {
                    $pTotal++; $fTotal++;
                    if ($s->submitted_at) {
                        $pComplied++; $fComplied++;
                        if (!Carbon::parse($s->submitted_at)->greaterThan(Carbon::parse($s->requirement->due_date))) {
                            $pOnTime++; $fOnTime++;
                        }
                    }
                }
                
                if ($fTotal > 0) {
                    $facultyData[] = [
                        'name' => $f->first_name . ' ' . $f->last_name,
                        'program' => $p->code,
                        'on_time_rate' => round(($fOnTime / $fTotal) * 100, 1),
                        'compliance_rate' => round(($fComplied / $fTotal) * 100, 1),
                        'overdue_count' => $fTotal - $fComplied - $f->submissions()->whereNull('submitted_at')->whereHas('requirement', fn($q) => $q->where('due_date', '>=', $now))->count() // rough estimate, actual should be computed
                    ];
                }
            }
            if ($pTotal > 0) {
                $programsData[] = [
                    'id' => $p->id,
                    'name' => $p->code,
                    'on_time_rate' => round(($pOnTime / $pTotal) * 100, 1),
                    'compliance_rate' => round(($pComplied / $pTotal) * 100, 1),
                ];
            }
        }
        
        $topPrograms = collect($programsData)->sortByDesc('on_time_rate')->take(3)->values();
        $topFaculty = collect($facultyData)->sortByDesc('on_time_rate')->take(5)->values();
        $zeroOverdueFaculty = collect($facultyData)->filter(fn($f) => $f['on_time_rate'] == 100)->count(); // Simplified

        return Inertia::render('tv/display', [
            'settings' => $settings,
            'slides' => $slides,
            'data' => [
                'slide1' => [
                    'announcements' => $activeAnnouncements,
                    'todays_schedule' => $todaysSchedule,
                    'upcoming_meetings' => $upcomingMeetings,
                    'kpis' => [
                        'compliance_rate' => $overallCompliance,
                        'pending_review' => $pendingCount,
                        'overdue_outputs' => $overdueCount,
                        'meetings_this_week' => $weeklyMeetings->count(),
                    ]
                ],
                'slide2' => [
                    'weekly_schedule' => $weeklySchedule,
                    'upcoming_meetings' => $upcomingMeetings,
                    'upcoming_deadlines' => $upcomingDeadlines,
                    'kpis' => [
                        'meetings_this_week' => $weeklyMeetings->count(),
                        'activities_this_week' => $weeklyActivities->count(),
                        'deadlines_this_week' => $upcomingDeadlines->filter(fn($d) => Carbon::parse($d->due_date)->isCurrentWeek())->count(),
                    ]
                ],
                'slide3' => [
                    'compliance_summary' => $complianceSummary,
                    'pending_outputs' => $pendingOutputs,
                    'upcoming_deadlines' => $upcomingDeadlines,
                    'kpis' => [
                        'compliance_rate' => $overallCompliance,
                        'pending_outputs' => $pendingCount,
                        'overdue_outputs' => $overdueCount,
                    ]
                ],
                'slide4' => [
                    'top_programs' => $topPrograms,
                    'top_faculty' => $topFaculty,
                    'kpis' => [
                        'college_on_time_rate' => $topPrograms->avg('on_time_rate') ? round($topPrograms->avg('on_time_rate'), 1) : 0,
                        'zero_overdue_faculty' => $zeroOverdueFaculty,
                    ]
                ]
            ],
            'current_term' => 'AY 2026-2027, 1st Semester'
        ]);
    }
}
