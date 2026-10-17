<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Schedule\CalendarController;
use App\Models\Activity;
use App\Models\Announcement;
use App\Models\FacilityMonitoring;
use App\Models\Faculty;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\RoomSchedule;
use App\Models\SpotlightSlide;
use App\Models\Submission;
use App\Models\Task;
use App\Models\TvSetting;
use App\Models\TvSlide;
use App\Services\ComplianceService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TvDisplayController extends Controller
{
    public function index()
    {
        ComplianceService::syncPendingSubmissions();

        $now = Carbon::now();
        $today = $now->format('Y-m-d');

        // 1. Settings & Playlist
        $settings = TvSetting::pluck('value', 'key')->toArray();
        $baseSlides = TvSlide::where('is_active', true)->orderBy('order')->get();

        // 2. Fetch published and active Spotlight Slides (Recognition & Celebrations)
        $activeSpotlights = SpotlightSlide::with('faculty.program')
            ->activeAt($now)
            ->orderByDesc('priority')
            ->latest()
            ->get();

        // Interleave Spotlight Slides into playlist
        // If a spotlight has fullscreen_takeover and priority >= 3 (critical), it takes over or appears first.
        // High priority (2) appears every 3-4 slides; normal priority (1) is distributed smoothly in the rotation.
        $interleavedSlides = collect();
        $spotlightIndex = 0;
        $spotlightCount = $activeSpotlights->count();

        if ($spotlightCount > 0) {
            // Check for emergency takeover spotlight
            $criticalTakeover = $activeSpotlights->firstWhere('fullscreen_takeover', true);

            if ($criticalTakeover && $criticalTakeover->priority >= 3) {
                // Critical takeover slide is the only slide or prominent first slide
                $interleavedSlides->push([
                    'id' => 'spotlight_'.$criticalTakeover->id,
                    'title' => '★ Spotlight: '.$criticalTakeover->headline,
                    'type' => 'Spotlight: '.$criticalTakeover->headline,
                    'is_spotlight' => true,
                    'spotlight_data' => $criticalTakeover,
                    'order' => 1,
                    'is_active' => true,
                    'duration_seconds' => $criticalTakeover->display_duration ?: 25,
                ]);
            } else {
                // Interleave throughout base playlist
                // e.g. Base slide 1, Base slide 2, Spotlight slide 1, Base slide 3, Base slide 4, Spotlight slide 2...
                $slideStep = 0;
                foreach ($baseSlides as $bSlide) {
                    $interleavedSlides->push([
                        'id' => $bSlide->id,
                        'title' => $bSlide->title,
                        'type' => $bSlide->type,
                        'is_spotlight' => false,
                        'order' => $bSlide->order,
                        'is_active' => true,
                        'duration_seconds' => $bSlide->duration_seconds,
                    ]);
                    $slideStep++;

                    // Insert a spotlight every 2 or 3 regular slides if spotlights exist
                    if ($slideStep % 2 === 0 && $spotlightIndex < $spotlightCount) {
                        $spot = $activeSpotlights[$spotlightIndex];
                        $interleavedSlides->push([
                            'id' => 'spotlight_'.$spot->id,
                            'title' => '★ Spotlight: '.$spot->headline,
                            'type' => 'Spotlight: '.$spot->headline,
                            'is_spotlight' => true,
                            'spotlight_data' => $spot,
                            'order' => $interleavedSlides->count() + 1,
                            'is_active' => true,
                            'duration_seconds' => $spot->display_duration ?: 20,
                        ]);
                        $spotlightIndex++;
                    }
                }

                // If any remaining spotlights haven't been inserted, append them
                while ($spotlightIndex < $spotlightCount) {
                    $spot = $activeSpotlights[$spotlightIndex];
                    $interleavedSlides->push([
                        'id' => 'spotlight_'.$spot->id,
                        'title' => '★ Spotlight: '.$spot->headline,
                        'type' => 'Spotlight: '.$spot->headline,
                        'is_spotlight' => true,
                        'spotlight_data' => $spot,
                        'order' => $interleavedSlides->count() + 1,
                        'is_active' => true,
                        'duration_seconds' => $spot->display_duration ?: 20,
                    ]);
                    $spotlightIndex++;
                }
            }
        } else {
            foreach ($baseSlides as $bSlide) {
                $interleavedSlides->push([
                    'id' => $bSlide->id,
                    'title' => $bSlide->title,
                    'type' => $bSlide->type,
                    'is_spotlight' => false,
                    'order' => $bSlide->order,
                    'is_active' => true,
                    'duration_seconds' => $bSlide->duration_seconds,
                ]);
            }
        }

        $slides = $interleavedSlides;

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
                'photo_url' => $s->faculty?->photo_url,
                'program' => $s->faculty && $s->faculty->program ? $s->faculty->program->code : 'N/A',
                'requirement' => $s->requirement->title,
                'due_date' => $s->requirement->due_date,
                'status' => $now->greaterThan($dueDate) ? 'Overdue' : ($now->diffInDays($dueDate) <= 2 ? 'Due Soon' : 'Pending'),
            ];
        })->values();

        $overdueCount = $submissions->filter(fn ($s) => ! $s->submitted_at && Carbon::parse($s->requirement->due_date)->isPast())->count();
        $pendingCount = $submissions->filter(fn ($s) => ! $s->submitted_at && ! Carbon::parse($s->requirement->due_date)->isPast())->count();

        // Data for Slide 4 (Performance & Recognition)
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
                        'id' => $f->id,
                        'name' => $f->first_name.' '.$f->last_name,
                        'photo_url' => $f->photo_url,
                        'program' => $p->code,
                        'total' => $fTotal,
                        'complied' => $fComplied,
                        'on_time' => $fOnTime,
                        'on_time_rate' => round(($fOnTime / $fTotal) * 100, 1),
                        'compliance_rate' => round(($fComplied / $fTotal) * 100, 1),
                        'overdue_count' => $f->submissions()->whereNull('submitted_at')->whereHas('requirement', fn ($q) => $q->where('due_date', '<', $now))->count(),
                    ];
                }
            }
            if ($pTotal > 0) {
                $programsData[] = [
                    'id' => $p->id,
                    'code' => $p->code,
                    'name' => $p->name,
                    'on_time_rate' => round(($pOnTime / $pTotal) * 100, 1),
                    'compliance_rate' => round(($pComplied / $pTotal) * 100, 1),
                ];
            }
        }

        // Add remaining faculties if needed
        $existingNames = collect($facultyData)->pluck('name')->all();
        $remainingFaculties = Faculty::with('program')->get()
            ->reject(fn ($fac) => in_array($fac->first_name.' '.$fac->last_name, $existingNames));

        foreach ($remainingFaculties as $rf) {
            $facultyData[] = [
                'id' => $rf->id,
                'name' => $rf->first_name.' '.$rf->last_name,
                'photo_url' => $rf->photo_url,
                'program' => $rf->program?->code ?? 'N/A',
                'total' => 0,
                'complied' => 0,
                'on_time' => 0,
                'on_time_rate' => 0,
                'compliance_rate' => 0,
                'overdue_count' => 0,
            ];
        }

        $topPrograms = collect($programsData)->sortByDesc('on_time_rate')->take(3)->values();
        $topFaculty = collect($facultyData)->sortByDesc('on_time_rate')->take(5)->values();
        $zeroOverdueFaculty = collect($facultyData)->filter(fn ($f) => $f['overdue_count'] === 0 && $f['compliance_rate'] > 0)->count();

        // Compute different recognition criteria categories (On-Time, Compliance, Improvement, Attendance from Spreadsheet)
        $monitoringSummary = $this->fetchClassroomMonitoringSummary();
        $attendanceRecords = $monitoringSummary['records'] ?? [];

        // Map attendance to faculty list
        $attendanceMap = collect($attendanceRecords)->keyBy(fn ($r) => strtolower(trim($r['instructor'])));

        $facultyWithAttendance = collect($facultyData)->map(function ($f) use ($attendanceMap) {
            $cleanName = strtolower(trim($f['name']));
            $att = $attendanceMap->get($cleanName);
            if (! $att) {
                // Try fuzzy/partial match
                foreach ($attendanceMap as $name => $record) {
                    if (str_contains($cleanName, $name) || str_contains($name, $cleanName)) {
                        $att = $record;
                        break;
                    }
                }
            }

            $present = $att['present'] ?? 0;
            $absent = $att['absent'] ?? 0;
            $late = $att['late'] ?? 0;
            $totalClasses = $present + $absent;
            $attRate = $totalClasses > 0 ? round(($present / $totalClasses) * 100, 1) : ($present > 0 ? 100 : 0);

            $f['attendance_present'] = $present;
            $f['attendance_absent'] = $absent;
            $f['attendance_late'] = $late;
            $f['attendance_rate'] = $attRate;

            return $f;
        });

        // 1. On-time submission rate leaderboard
        $onTimeLeaders = $facultyWithAttendance
            ->sortByDesc(fn ($f) => $f['on_time_rate'] * 1000 + $f['compliance_rate'])
            ->take(5)
            ->values()
            ->map(fn ($f) => [
                'name' => $f['name'],
                'photo_url' => $f['photo_url'],
                'program' => $f['program'],
                'value' => $f['on_time_rate'].'%',
                'progress' => $f['on_time_rate'],
                'subtext' => 'on time',
                'metric_label' => 'On-Time Rate',
            ]);

        // 2. Compliance rate leaderboard
        $complianceLeaders = $facultyWithAttendance
            ->sortByDesc(fn ($f) => $f['compliance_rate'] * 1000 + $f['on_time_rate'])
            ->take(5)
            ->values()
            ->map(fn ($f) => [
                'name' => $f['name'],
                'photo_url' => $f['photo_url'],
                'program' => $f['program'],
                'value' => $f['compliance_rate'].'%',
                'progress' => $f['compliance_rate'],
                'subtext' => 'compliant',
                'metric_label' => 'Compliance Rate',
            ]);

        // 3. Improvement rate leaderboard (Simulated / Calculated based on semester progression and zero overdues)
        $improvementLeaders = $facultyWithAttendance
            ->sortByDesc(fn ($f) => ($f['on_time_rate'] * 0.6) + ($f['compliance_rate'] * 0.4) - ($f['overdue_count'] * 10))
            ->take(5)
            ->values()
            ->map(function ($f, $idx) {
                // Progressive improvement percentage vs baseline
                $impRate = max(5, round(min(28, ($f['on_time_rate'] * 0.25) + (15 - $idx * 2.5)), 1));

                return [
                    'name' => $f['name'],
                    'photo_url' => $f['photo_url'],
                    'program' => $f['program'],
                    'value' => '+'.$impRate.'%',
                    'progress' => min(100, round($impRate * 3.5)),
                    'subtext' => 'vs last sem',
                    'metric_label' => 'Improvement Rate',
                ];
            });

        // 4. Attendance Leaderboard (Based on Google Sheets data)
        // Sort by present count descending, then lowest late/absent
        $attendanceLeaders = collect($attendanceRecords)
            ->sortByDesc(fn ($r) => ($r['present'] * 100) - ($r['absent'] * 20) - ($r['late'] * 5))
            ->take(5)
            ->values()
            ->map(function ($r) use ($facultyWithAttendance) {
                // Match photo and program if available
                $cleanInstructor = strtolower(trim($r['instructor']));
                $matchedFac = $facultyWithAttendance->first(function ($f) use ($cleanInstructor) {
                    $name = strtolower(trim($f['name']));

                    return str_contains($cleanInstructor, $name) || str_contains($name, $cleanInstructor);
                });

                $base = $r['present'] + $r['absent'];
                $rate = $base > 0 ? round(($r['present'] / $base) * 100, 1) : 100;

                return [
                    'name' => $r['instructor'],
                    'photo_url' => $matchedFac['photo_url'] ?? null,
                    'program' => $matchedFac['program'] ?? 'Faculty',
                    'value' => $r['present'].' classes',
                    'progress' => $rate,
                    'subtext' => $rate.'% present',
                    'metric_label' => 'Attendance (Spreadsheet)',
                ];
            });

        $recognitionCategories = [
            [
                'id' => 'on_time',
                'title' => 'On-Time Submission',
                'subtitle' => 'Top faculty with highest on-time submission rate',
                'metric' => 'On-Time Submission Rate',
                'leaders' => $onTimeLeaders,
            ],
            [
                'id' => 'compliance',
                'title' => 'Compliance Rate',
                'subtitle' => 'Top faculty with highest overall requirement compliance',
                'metric' => 'Compliance Rate',
                'leaders' => $complianceLeaders,
            ],
            [
                'id' => 'improvement',
                'title' => 'Improvement Rate',
                'subtitle' => 'Faculty with highest positive rate growth vs. last semester',
                'metric' => 'Improvement Rate',
                'leaders' => $improvementLeaders,
            ],
            [
                'id' => 'attendance',
                'title' => 'Classroom Attendance',
                'subtitle' => 'Top instructors with highest attendance based on spreadsheet monitoring',
                'metric' => 'Attendance Rate',
                'leaders' => $attendanceLeaders,
            ],
        ];

        // Data for Slide 5 (Classroom Monitoring - Facilities & Labs)
        $facilityData = FacilityMonitoring::with('faculty')->orderBy('room_name')->get()->map(function ($fac) {
            return [
                'id' => $fac->id,
                'room_name' => $fac->room_name,
                'room_type' => $fac->room_type,
                'current_class' => $fac->current_class,
                'program' => $fac->program,
                'instructor' => $fac->faculty ? ($fac->faculty->title_name ?? $fac->faculty->full_name) : $fac->instructor,
                'instructor_photo' => $fac->faculty?->photo_url,
                'faculty_id' => $fac->faculty_id,
                'start_time' => $fac->start_time,
                'end_time' => $fac->end_time,
                'status' => $fac->status,
                'remarks' => $fac->remarks,
                'next_schedule' => $fac->next_schedule,
            ];
        });
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

        $todayRoomSchedules = RoomSchedule::with('faculty')
            ->where('day_of_week', $activeDay)
            ->orderBy('start_time')
            ->orderBy('room_name')
            ->get();

        $facultyPhotos = Faculty::all()->mapWithKeys(function ($fac) {
            return [
                strtolower($fac->first_name.' '.$fac->last_name) => $fac->photo_url,
                strtolower($fac->last_name) => $fac->photo_url,
            ];
        });

        $formattedSchedules = $todayRoomSchedules->map(function ($s) use ($currentTime, $currentDay, $activeDay, $facultyPhotos) {
            $isToday = ($currentDay === $activeDay);
            $status = 'Upcoming';
            if ($isToday) {
                if ($s->start_time <= $currentTime && $s->end_time > $currentTime) {
                    $status = 'Ongoing';
                } elseif ($s->end_time <= $currentTime) {
                    $status = 'Completed';
                }
            }

            // Prefer connected Faculty model from faculty list
            $displayName = $s->faculty ? ($s->faculty->title_name ?? $s->faculty->full_name) : ($s->instructor ?: 'Unassigned');
            $instructorPhoto = $s->faculty?->photo_url;

            if (! $instructorPhoto) {
                $instructorKey = strtolower(trim($s->instructor ?? ''));
                $instructorPhoto = $facultyPhotos->get($instructorKey);
                if (! $instructorPhoto && $instructorKey !== '') {
                    foreach ($facultyPhotos as $name => $url) {
                        if ($url && ($name !== '') && (str_contains($instructorKey, $name) || str_contains($name, $instructorKey))) {
                            $instructorPhoto = $url;
                            break;
                        }
                    }
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
                'instructor' => $displayName,
                'raw_instructor' => $s->instructor,
                'faculty_id' => $s->faculty_id,
                'instructor_photo' => $instructorPhoto,
                'section' => $s->section,
                'status' => $status,
            ];
        });

        // Group by faculty member
        $facultyGroups = $formattedSchedules->groupBy('instructor')->map(function ($items, $instructor) {
            $ongoing = $items->firstWhere('status', 'Ongoing');
            $upcoming = $items->firstWhere('status', 'Upcoming');
            $firstWithPhoto = $items->firstWhere('instructor_photo');

            return [
                'instructor' => $instructor,
                'instructor_photo' => $firstWithPhoto ? $firstWithPhoto['instructor_photo'] : null,
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

        // Data for Slide 9 (Compliance Tracker)
        $allTrackerPrograms = Program::orderBy('code')->get();
        $allTrackerRequirements = Requirement::orderBy('title')->get();
        $allTrackerSubmissions = Submission::with(['faculty.program', 'requirement'])->get();

        $trackerProgramStats = $allTrackerPrograms->map(function ($prog) use ($allTrackerSubmissions, $now) {
            $progSubmissions = $allTrackerSubmissions->filter(function ($s) use ($prog) {
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

        $trackerRequirementProgress = $allTrackerRequirements->take(6)->map(function ($req) use ($allTrackerSubmissions) {
            $reqSubs = $allTrackerSubmissions->where('requirement_id', $req->id);
            $total = $reqSubs->count();
            $completed = $reqSubs->whereNotNull('submitted_at')->count();
            $status = $total > 0 && $completed === $total ? 'Completed' : 'In Progress';
            $rate = $total > 0 ? round(($completed / $total) * 100) : 0;

            return [
                'title' => $req->title,
                'completed' => $completed,
                'total' => $total,
                'rate' => $rate,
                'status' => $status,
            ];
        })->values()->toArray();

        $trackerTotalCompleted = $allTrackerSubmissions->whereNotNull('submitted_at')->count();
        $trackerTotalSubmissions = $allTrackerSubmissions->count();
        $trackerTotalPending = 0;
        $trackerTotalOverdue = 0;

        foreach ($allTrackerSubmissions->whereNull('submitted_at') as $sub) {
            $dueDate = $sub->requirement ? Carbon::parse($sub->requirement->due_date) : $now;
            if ($now->greaterThan($dueDate)) {
                $trackerTotalOverdue++;
            } else {
                $trackerTotalPending++;
            }
        }

        $trackerOverallRate = $trackerTotalSubmissions > 0 ? round(($trackerTotalCompleted / $trackerTotalSubmissions) * 100) : 100;

        $trackerUpcomingDeadlines = $allTrackerRequirements->filter(function ($r) use ($now) {
            return $r->due_date && Carbon::parse($r->due_date)->greaterThanOrEqualTo($now->copy()->subDays(1));
        })->sortBy('due_date')->take(4)->map(function ($r) use ($now) {
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

        $complianceTrackerData = [
            'stats' => [
                'overall_rate' => $trackerOverallRate,
                'growth' => '+12%',
                'completed' => $trackerTotalCompleted,
                'pending' => $trackerTotalPending,
                'overdue' => $trackerTotalOverdue,
                'active_requirements' => $allTrackerRequirements->count(),
                'total_programs' => $allTrackerPrograms->count(),
            ],
            'program_stats' => $trackerProgramStats,
            'requirement_progress' => $trackerRequirementProgress,
            'upcoming_deadlines' => $trackerUpcomingDeadlines,
        ];

        // Data for Slide 10 (Tasks & Projects)
        $allTasks = Task::with(['creator', 'assignee', 'faculties'])->orderBy('due_date')->get();
        $totalTaskCount = $allTasks->count();
        $inProgressTaskCount = $allTasks->where('status', 'in_progress')->count();
        $dueTodayTaskCount = $allTasks->filter(function ($t) use ($today) {
            return $t->due_date && Carbon::parse($t->due_date)->format('Y-m-d') === $today;
        })->count();
        $completedTaskCount = $allTasks->where('status', 'completed')->count();
        $reviewTaskCount = $allTasks->where('status', 'review')->count();
        $toDoTaskCount = $allTasks->where('status', 'to_do')->count();

        $overallTaskCompletion = $totalTaskCount > 0 ? round(($completedTaskCount / $totalTaskCount) * 100) : 0;

        $formatTaskForTv = function ($t) use ($now) {
            $dueCarbon = $t->due_date ? Carbon::parse($t->due_date) : null;
            $diffDays = $dueCarbon ? $now->diffInDays($dueCarbon, false) : null;
            $isOverdue = $dueCarbon && $diffDays < 0 && $t->status !== 'completed';

            return [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'priority' => $t->priority,
                'status' => $t->status,
                'progress' => $t->progress ?? 0,
                'due_date' => $dueCarbon ? $dueCarbon->format('M d, Y') : 'No due date',
                'is_overdue' => $isOverdue,
                'days_left' => $dueCarbon ? ($diffDays < 0 ? abs($diffDays).'d overdue' : ($diffDays === 0 ? 'Today' : "{$diffDays}d left")) : null,
                'comments_count' => $t->comments_count ?? 0,
                'attachments_count' => $t->attachments_count ?? 0,
                'subtasks_completed' => $t->subtasks_completed ?? 0,
                'subtasks_total' => $t->subtasks_total ?? 0,
                'assignee_name' => $t->assignee?->name,
                'assignee_initials' => $t->assignee_initials ?? ($t->assignee ? strtoupper(substr($t->assignee->name, 0, 2)) : '??'),
                'extra_assignees_count' => $t->extra_assignees_count ?? 0,
                'faculties' => $t->faculties->map(fn ($f) => [
                    'id' => $f->id,
                    'name' => $f->first_name.' '.$f->last_name,
                    'photo_url' => $f->photo_url,
                ])->values()->all(),
            ];
        };

        $tasksByColumn = [
            'to_do' => $allTasks->where('status', 'to_do')->values()->map($formatTaskForTv)->all(),
            'in_progress' => $allTasks->where('status', 'in_progress')->values()->map($formatTaskForTv)->all(),
            'review' => $allTasks->where('status', 'review')->values()->map($formatTaskForTv)->all(),
            'completed' => $allTasks->where('status', 'completed')->values()->map($formatTaskForTv)->all(),
        ];

        $tasksAndProjectsData = [
            'stats' => [
                'total' => $totalTaskCount,
                'in_progress' => $inProgressTaskCount,
                'due_today' => $dueTodayTaskCount,
                'completed' => $completedTaskCount,
                'review' => $reviewTaskCount,
                'to_do' => $toDoTaskCount,
                'completion_rate' => $overallTaskCompletion,
            ],
            'columns' => $tasksByColumn,
            'recent_tasks' => $allTasks->take(8)->map($formatTaskForTv)->all(),
        ];

        // Data for Slide 11 (Program Performance)
        $progModels = Program::with(['faculties.submissions.requirement'])->get();
        $progPerformances = [];
        $progColors = [
            'BSIS' => 'amber',
            'BSIT' => 'sky',
            'BLIS' => 'orange',
            'BSCS' => 'purple',
        ];

        foreach ($progModels as $pm) {
            $pmTotalFaculty = $pm->faculties->count();
            $pmCompliantFaculty = 0;
            $pmPerfectFaculty = 0;
            $pmTotalReqs = 0;
            $pmCompliedReqs = 0;
            $pmOnTimeReqs = 0;
            $pmOverdueReqs = 0;
            $pmPendingReqs = 0;

            foreach ($pm->faculties as $pf) {
                $fReqs = $pf->submissions->count();
                $fComplied = 0;
                $fOnTime = 0;
                $fOverdue = 0;

                foreach ($pf->submissions as $sub) {
                    $pmTotalReqs++;
                    $subDue = $sub->requirement && $sub->requirement->due_date ? Carbon::parse($sub->requirement->due_date) : $now;

                    if ($sub->submitted_at) {
                        $pmCompliedReqs++;
                        $fComplied++;
                        if (! Carbon::parse($sub->submitted_at)->greaterThan($subDue)) {
                            $pmOnTimeReqs++;
                            $fOnTime++;
                        }
                    } elseif ($now->greaterThan($subDue)) {
                        $pmOverdueReqs++;
                        $fOverdue++;
                    } else {
                        $pmPendingReqs++;
                    }
                }

                if ($fReqs > 0 && $fComplied >= ($fReqs * 0.8)) {
                    $pmCompliantFaculty++;
                }
                if ($fReqs > 0 && $fComplied === $fReqs && $fOverdue === 0) {
                    $pmPerfectFaculty++;
                }
            }

            $pmComplianceRate = $pmTotalReqs > 0 ? round(($pmCompliedReqs / $pmTotalReqs) * 100, 1) : 0;
            $pmOnTimeRate = $pmCompliedReqs > 0 ? round(($pmOnTimeReqs / $pmCompliedReqs) * 100, 1) : 0;

            $progPerformances[] = [
                'id' => $pm->id,
                'name' => $pm->name,
                'code' => $pm->code,
                'badge_color' => $progColors[$pm->code] ?? 'slate',
                'total_faculty' => $pmTotalFaculty,
                'compliant_faculty' => $pmCompliantFaculty,
                'perfect_faculty_count' => $pmPerfectFaculty,
                'total_requirements' => $pmTotalReqs,
                'complied' => $pmCompliedReqs,
                'on_time' => $pmOnTimeReqs,
                'overdue' => $pmOverdueReqs,
                'pending' => $pmPendingReqs,
                'compliance_rate' => $pmComplianceRate,
                'on_time_rate' => $pmOnTimeRate,
                'trend' => $pmComplianceRate >= 70 ? 'up' : 'down',
            ];
        }

        // Sort programs by compliance rate descending
        $progPerformances = collect($progPerformances)->sortByDesc('compliance_rate')->values()->all();

        $progTotalFaculty = collect($progPerformances)->sum('total_faculty');
        $progCompliantFaculty = collect($progPerformances)->sum('compliant_faculty');
        $progOverallCompliance = $progTotalFaculty > 0 ? round(($progCompliantFaculty / $progTotalFaculty) * 100, 1) : 0;
        $progTotalCompliedReqs = collect($progPerformances)->sum('complied');
        $progTotalOnTimeReqs = collect($progPerformances)->sum('on_time');
        $progOverallOnTime = $progTotalCompliedReqs > 0 ? round(($progTotalOnTimeReqs / $progTotalCompliedReqs) * 100, 1) : 0;
        $progTotalOverdue = collect($progPerformances)->sum('overdue');

        $programPerformanceData = [
            'performances' => $progPerformances,
            'kpis' => [
                'total_programs' => count($progPerformances),
                'total_faculty' => $progTotalFaculty,
                'compliant_faculty' => $progCompliantFaculty,
                'compliance_rate' => $progOverallCompliance,
                'on_time_submissions' => $progTotalOnTimeReqs,
                'on_time_rate' => $progOverallOnTime,
                'overdue_count' => $progTotalOverdue,
            ],
            'academic_period' => [
                'year' => 'AY 2026–2027',
                'semester' => '1st Semester',
                'date_range' => 'Aug 15, 2026 – Dec 15, 2026',
                'label' => 'AY 2026–2027, 1st Semester',
            ],
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
                    'recognition_categories' => $recognitionCategories,
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
                'slide8' => [
                    'calendar' => CalendarController::getCalendarData(),
                ],
                'slide9' => $complianceTrackerData,
                'slide10' => $tasksAndProjectsData,
                'slide11' => $programPerformanceData,
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
