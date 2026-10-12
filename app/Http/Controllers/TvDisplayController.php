<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Announcement;
use App\Models\FacilityMonitoring;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\RoomSchedule;
use App\Models\Submission;
use App\Models\TvSetting;
use App\Models\TvSlide;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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
        $activeAnnouncements = Announcement::with('author')->where('status', 'active')->latest()->get();

        $meetingsToday = Meeting::where('date', $today)->orderBy('start_time')->get()->map(fn ($m) => [
            'id' => $m->id,
            'title' => $m->title,
            'time' => $m->start_time.' - '.$m->end_time,
            'venue' => $m->venue,
            'type' => 'Meeting',
        ]);

        $activitiesToday = Activity::where('date', $today)->get()->map(fn ($a) => [
            'id' => $a->id,
            'title' => $a->title,
            'time' => $a->start_time && $a->end_time ? $a->start_time.' - '.$a->end_time : 'All Day',
            'venue' => $a->venue,
            'type' => 'Activity',
        ]);

        $todaysSchedule = $meetingsToday->concat($activitiesToday)->sortBy('time')->values();

        $upcomingMeetings = Meeting::where('date', '>=', $today)
            ->orderBy('date')->orderBy('start_time')
            ->take(5)->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'date' => Carbon::parse($m->date)->format('M d, Y'),
                'time' => $m->start_time.' - '.$m->end_time,
                'venue' => $m->venue,
            ]);

        // Data for Slide 2 (Weekly Schedule)
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();

        $weeklyMeetings = Meeting::whereBetween('date', [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')])->get();
        $weeklyActivities = Activity::whereBetween('date', [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')])->get();

        $weeklySchedule = [];
        for ($i = 0; $i < 5; $i++) {
            $day = $weekStart->copy()->addDays($i);
            $dayStr = $day->format('Y-m-d');

            $dayItems = [];
            foreach ($weeklyMeetings->where('date', $dayStr) as $m) {
                $dayItems[] = ['title' => $m->title, 'time' => $m->start_time, 'venue' => $m->venue, 'type' => 'Meeting'];
            }
            foreach ($weeklyActivities->where('date', $dayStr) as $a) {
                $dayItems[] = [
                    'title' => $a->title,
                    'time' => $a->start_time && $a->end_time ? $a->start_time.' - '.$a->end_time : 'All Day',
                    'venue' => $a->venue,
                    'type' => 'Activity',
                ];
            }

            $weeklySchedule[] = [
                'date' => $day->format('l, M d'),
                'is_today' => $dayStr == $today,
                'items' => collect($dayItems)->sortBy('time')->values(),
            ];
        }

        $upcomingDeadlines = Requirement::where('due_date', '>=', $now)
            ->orderBy('due_date')->take(5)->get();

        // Data for Slide 3 (Compliance)
        $requirements = Requirement::withCount('submissions')->get();
        $totalSubmissions = Submission::count();
        $compliedSubmissions = Submission::whereNotNull('submitted_at')->count();
        $overallCompliance = $totalSubmissions > 0 ? round(($compliedSubmissions / $totalSubmissions) * 100, 1) : 0;

        $complianceSummary = $requirements->map(fn ($r) => [
            'id' => $r->id,
            'title' => $r->title,
            'total' => $r->submissions_count,
            'complied' => $r->submissions()->whereNotNull('submitted_at')->count(),
        ])->map(function ($r) {
            $r['rate'] = $r['total'] > 0 ? round(($r['complied'] / $r['total']) * 100, 1) : 0;

            return $r;
        });

        $submissions = Submission::with('requirement', 'faculty.program')->get();
        $pendingOutputs = $submissions->filter(fn ($s) => ! $s->submitted_at)->sortBy(fn ($s) => Carbon::parse($s->requirement->due_date)->timestamp)->take(6)->map(function ($s) use ($now) {
            $dueDate = Carbon::parse($s->requirement->due_date);

            return [
                'id' => $s->id,
                'faculty' => $s->faculty ? $s->faculty->first_name.' '.$s->faculty->last_name : 'Unknown',
                'program' => $s->faculty && $s->faculty->program ? $s->faculty->program->code : 'N/A',
                'requirement' => $s->requirement->title,
                'due_date' => $s->requirement->due_date,
                'status' => $now->greaterThan($dueDate) ? 'Overdue' : ($now->diffInDays($dueDate) <= 2 ? 'Due Soon' : 'Pending'),
            ];
        })->values();

        $overdueCount = $submissions->filter(fn ($s) => ! $s->submitted_at && Carbon::parse($s->requirement->due_date)->isPast())->count();
        $pendingCount = $submissions->filter(fn ($s) => ! $s->submitted_at && ! Carbon::parse($s->requirement->due_date)->isPast())->count();

        // Data for Slide 4 (Performance)
        $programs = Program::with('faculties.submissions.requirement')->get();
        $programsData = [];
        $facultyData = [];

        foreach ($programs as $p) {
            $pTotal = 0;
            $pComplied = 0;
            $pOnTime = 0;
            foreach ($p->faculties as $f) {
                $fTotal = 0;
                $fComplied = 0;
                $fOnTime = 0;

                foreach ($f->submissions as $s) {
                    $pTotal++;
                    $fTotal++;
                    if ($s->submitted_at) {
                        $pComplied++;
                        $fComplied++;
                        if (! Carbon::parse($s->submitted_at)->greaterThan(Carbon::parse($s->requirement->due_date))) {
                            $pOnTime++;
                            $fOnTime++;
                        }
                    }
                }

                if ($fTotal > 0) {
                    $facultyData[] = [
                        'name' => $f->first_name.' '.$f->last_name,
                        'program' => $p->code,
                        'on_time_rate' => round(($fOnTime / $fTotal) * 100, 1),
                        'compliance_rate' => round(($fComplied / $fTotal) * 100, 1),
                        'overdue_count' => $fTotal - $fComplied - $f->submissions()->whereNull('submitted_at')->whereHas('requirement', fn ($q) => $q->where('due_date', '>=', $now))->count(), // rough estimate, actual should be computed
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
        $zeroOverdueFaculty = collect($facultyData)->filter(fn ($f) => $f['on_time_rate'] == 100)->count(); // Simplified

        // Data for Slide 5 (Classroom Monitoring - Facilities & Labs)
        $facilityData = FacilityMonitoring::orderBy('room_name')->get();
        $facilityLastSync = Cache::get('facility_monitoring_last_sync', clone $now);

        // Data for Slide 6 (Class & Lab Monitoring Summary from Google Sheets)
        $monitoringSummary = $this->fetchClassroomMonitoringSummary();

        // Data for Slide 7 (Faculty Schedule)
        $tz = config('services.room_schedule.timezone', 'Asia/Manila');
        $scheduleNow = Carbon::now($tz);
        $currentDay = $scheduleNow->format('l');
        $currentTime = $scheduleNow->format('H:i:s');

        // If today is a weekend without schedules, default to Monday
        $activeDay = in_array($currentDay, ['Saturday', 'Sunday']) ? 'Monday' : $currentDay;

        $todayRoomSchedules = RoomSchedule::query()
            ->where('day_of_week', $activeDay)
            ->orderBy('start_time')
            ->orderBy('room_name')
            ->get();

        $formattedSchedules = $todayRoomSchedules->map(function ($s) use ($currentTime, $currentDay, $activeDay) {
            $isToday = ($currentDay === $activeDay);
            $status = 'Upcoming';
            if ($isToday) {
                if ($s->start_time <= $currentTime && $s->end_time > $currentTime) {
                    $status = 'Ongoing';
                } elseif ($s->end_time <= $currentTime) {
                    $status = 'Completed';
                }
            }

            return [
                'id' => $s->id,
                'room_name' => $s->room_name,
                'day_of_week' => $s->day_of_week,
                'start_time' => Carbon::parse($s->start_time)->format('g:i A'),
                'end_time' => Carbon::parse($s->end_time)->format('g:i A'),
                'raw_start' => $s->start_time,
                'raw_end' => $s->end_time,
                'course_code' => $s->course_code,
                'course_title' => $s->course_title,
                'instructor' => $s->instructor ?: 'Unassigned',
                'section' => $s->section,
                'status' => $status,
            ];
        });

        // Group by faculty member
        $facultyGroups = $formattedSchedules->groupBy('instructor')->map(function ($items, $instructor) {
            $ongoing = $items->firstWhere('status', 'Ongoing');
            $upcoming = $items->firstWhere('status', 'Upcoming');

            return [
                'instructor' => $instructor,
                'total_classes' => $items->count(),
                'has_ongoing' => ! is_null($ongoing),
                'current_class' => $ongoing,
                'next_class' => $upcoming,
                'rooms' => $items->pluck('room_name')->unique()->values()->all(),
                'classes' => $items->values()->all(),
            ];
        })->values()->sortByDesc('has_ongoing')->values();

        $facultyScheduleData = [
            'day' => $activeDay,
            'is_today' => ($currentDay === $activeDay),
            'current_time' => $scheduleNow->format('g:i A'),
            'schedules' => $formattedSchedules->values()->all(),
            'faculty_groups' => $facultyGroups->all(),
            'kpis' => [
                'total_classes' => $formattedSchedules->count(),
                'ongoing_classes' => $formattedSchedules->where('status', 'Ongoing')->count(),
                'upcoming_classes' => $formattedSchedules->where('status', 'Upcoming')->count(),
                'completed_classes' => $formattedSchedules->where('status', 'Completed')->count(),
                'active_instructors' => $formattedSchedules->pluck('instructor')->unique()->count(),
            ],
            'last_updated' => $scheduleNow->format('M d, Y g:i A'),
        ];

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
                    ],
                ],
                'slide2' => [
                    'weekly_schedule' => $weeklySchedule,
                    'upcoming_meetings' => $upcomingMeetings,
                    'upcoming_deadlines' => $upcomingDeadlines,
                    'kpis' => [
                        'meetings_this_week' => $weeklyMeetings->count(),
                        'activities_this_week' => $weeklyActivities->count(),
                        'deadlines_this_week' => $upcomingDeadlines->filter(fn ($d) => Carbon::parse($d->due_date)->isCurrentWeek())->count(),
                    ],
                ],
                'slide3' => [
                    'compliance_summary' => $complianceSummary,
                    'pending_outputs' => $pendingOutputs,
                    'upcoming_deadlines' => $upcomingDeadlines,
                    'kpis' => [
                        'compliance_rate' => $overallCompliance,
                        'pending_outputs' => $pendingCount,
                        'overdue_outputs' => $overdueCount,
                    ],
                ],
                'slide4' => [
                    'top_programs' => $topPrograms,
                    'top_faculty' => $topFaculty,
                    'kpis' => [
                        'college_on_time_rate' => $topPrograms->avg('on_time_rate') ? round($topPrograms->avg('on_time_rate'), 1) : 0,
                        'zero_overdue_faculty' => $zeroOverdueFaculty,
                    ],
                ],
                'slide5' => [
                    'facilities' => $facilityData,
                    'last_updated' => Carbon::parse($facilityLastSync)->format('M d, Y h:i A'),
                    'kpis' => [
                        'in_use' => $facilityData->where('status', 'In Use')->count(),
                        'available' => $facilityData->where('status', 'Available')->count(),
                        'maintenance' => $facilityData->where('status', 'Maintenance')->count(),
                    ],
                ],
                'slide6' => $monitoringSummary,
                'slide7' => $facultyScheduleData,
            ],
            'current_term' => $settings['academic_term'] ?? 'AY 2026-2027, 1st Semester',
        ]);
    }

    /**
     * Fetch and parse the Class & Lab Monitoring Summary from Google Sheets.
     */
    private function fetchClassroomMonitoringSummary(): array
    {
        return Cache::remember('tv_classroom_monitoring_summary', 120, function () {
            try {
                $url = 'https://docs.google.com/spreadsheets/d/15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0/export?format=csv&gid=2115846189';
                $response = Http::withoutVerifying()->timeout(8)->get($url);

                if (! $response->successful()) {
                    return $this->fallbackMonitoringSummary();
                }

                $lines = explode("\n", $response->body());
                $header = null;
                $records = [];
                $highlights = [];

                foreach ($lines as $line) {
                    $row = str_getcsv($line);
                    if (empty($row) || ! isset($row[0])) {
                        continue;
                    }

                    $firstCell = trim($row[0]);
                    if ($firstCell === 'List of Instructor:') {
                        $header = array_slice($row, 0, 9);

                        continue;
                    }

                    if ($header && $firstCell !== '' && ! str_starts_with($firstCell, 'Most ')) {
                        $records[] = [
                            'instructor' => $firstCell,
                            'present' => (int) ($row[1] ?? 0),
                            'absent' => (int) ($row[2] ?? 0),
                            'late' => (int) ($row[3] ?? 0),
                            'online' => (int) ($row[4] ?? 0),
                            'others' => (int) ($row[5] ?? 0),
                            'on_leave' => (int) ($row[6] ?? 0),
                            'sub_insert' => (int) ($row[7] ?? 0),
                            'total_late_mins' => (int) ($row[8] ?? 0),
                        ];
                    }

                    for ($i = 0; $i < count($row); $i++) {
                        $cellText = trim($row[$i] ?? '');
                        if (str_starts_with($cellText, 'Most ')) {
                            $key = rtrim($cellText, ':');
                            $val = trim($row[$i + 1] ?? '');
                            if ($val) {
                                $highlights[$key] = $val;
                            }
                        }
                    }
                }

                $totalPresent = array_sum(array_column($records, 'present'));
                $totalAbsent = array_sum(array_column($records, 'absent'));
                $totalLate = array_sum(array_column($records, 'late'));
                $totalOnline = array_sum(array_column($records, 'online'));
                $totalOnLeave = array_sum(array_column($records, 'on_leave'));
                $totalSubInsert = array_sum(array_column($records, 'sub_insert'));
                $totalLateMins = array_sum(array_column($records, 'total_late_mins'));

                return [
                    'records' => $records,
                    'highlights' => $highlights,
                    'kpis' => [
                        'present' => $totalPresent,
                        'absent' => $totalAbsent,
                        'late' => $totalLate,
                        'online' => $totalOnline,
                        'on_leave' => $totalOnLeave,
                        'sub_insert' => $totalSubInsert,
                        'total_late_mins' => $totalLateMins,
                        'faculty_count' => count($records),
                    ],
                    'last_updated' => now()->format('M d, Y h:i A'),
                ];
            } catch (\Throwable $e) {
                Log::warning('Error fetching monitoring summary sheet: '.$e->getMessage());

                return $this->fallbackMonitoringSummary();
            }
        });
    }

    private function fallbackMonitoringSummary(): array
    {
        return [
            'records' => [],
            'highlights' => [],
            'kpis' => [
                'present' => 0,
                'absent' => 0,
                'late' => 0,
                'online' => 0,
                'on_leave' => 0,
                'sub_insert' => 0,
                'total_late_mins' => 0,
                'faculty_count' => 0,
            ],
            'last_updated' => now()->format('M d, Y h:i A'),
        ];
    }
}
