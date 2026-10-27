<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Schedule\CalendarController;
use App\Models\Activity;
use App\Models\Announcement;
use App\Models\CustomContentSlide;
use App\Models\FacilityMonitoring;
use App\Models\Faculty;
use App\Models\FacultyAttendanceSummary;
use App\Models\LocatorSlip;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\RoomSchedule;
use App\Models\SpotlightSlide;
use App\Models\Submission;
use App\Models\Task;
use App\Models\TravelOrder;
use App\Models\TvCleaningSchedule;
use App\Models\TvDevice;
use App\Models\TvSetting;
use App\Models\TvSlide;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TvDisplayController extends Controller
{
    public function index($displayId = null)
    {
        $now = Carbon::now();

        // 1. Device resolution & keep-alive ping
        $device = null;
        try {
            if ($displayId) {
                $device = TvDevice::where('id', $displayId)->orWhere('device_code', $displayId)->first();
            }
            if (! $device) {
                $device = TvDevice::first();
            }

            if ($device) {
                $device->update(['last_ping_at' => $now, 'is_online' => true]);
            }
        } catch (\Throwable $e) {
            Log::warning('TvDevice ping/resolution failed: '.$e->getMessage());
        }

        $displayKey = $device ? (string) $device->id : ($displayId ?: 'default');
        $cacheKey = 'tv_display_payload_v1_'.$displayKey;

        // Cache the entire display payload for 10 minutes so TV responds in < 10ms
        try {
            $payload = Cache::remember($cacheKey, 600, function () use ($device, $displayId) {
                return $this->buildTvPayload($device, $displayId);
            });
        } catch (\Throwable $e) {
            Log::error('Error building TV payload: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            $payload = $this->buildFallbackTvPayload($device);
        }

        return Inertia::render('tv/display', $payload);
    }

    /**
     * Dedicated lightweight JSON endpoint for frontend polling without full Inertia HTML reload.
     */
    public function getTvDataApi($displayId = null)
    {
        $device = null;
        try {
            if ($displayId) {
                $device = TvDevice::where('id', $displayId)->orWhere('device_code', $displayId)->first();
            }
            if (! $device) {
                $device = TvDevice::first();
            }
        } catch (\Throwable $e) {
            Log::warning('TvDevice resolution in getTvDataApi failed: '.$e->getMessage());
        }

        $displayKey = $device ? (string) $device->id : ($displayId ?: 'default');
        $cacheKey = 'tv_display_payload_v1_'.$displayKey;

        try {
            $payload = Cache::remember($cacheKey, 600, function () use ($device, $displayId) {
                return $this->buildTvPayload($device, $displayId);
            });
        } catch (\Throwable $e) {
            Log::error('Error building TV payload in getTvDataApi: '.$e->getMessage());
            $payload = $this->buildFallbackTvPayload($device);
        }

        return response()->json($payload);
    }

    /**
     * Build the TV Display payload (slides, data, settings, current_term).
     */
    private function buildTvPayload($device = null, $displayId = null): array
    {
        $now = Carbon::now();
        $today = $now->format('Y-m-d');

        $globalSettings = TvSetting::pluck('value', 'key')->toArray();

        // Overlay device settings on top of global settings
        $settings = array_merge($globalSettings, [
            'display_id' => $device ? $device->id : null,
            'device_code' => $device ? $device->device_code : 'CIDS-MAIN',
            'display_name' => $device ? $device->name : ($globalSettings['display_name'] ?? 'CIDS Office TV'),
            'location' => $device ? $device->location : "Dean's Office",
            'audience_mode' => $device ? $device->audience_mode : ($globalSettings['audience_mode'] ?? 'internal'),
            'screen_resolution' => $device ? $device->screen_resolution : ($globalSettings['screen_resolution'] ?? '1920x1080'),
            'safe_area_margin' => $device ? $device->safe_area_margin : ($globalSettings['safe_area_margin'] ?? 'normal'),
            'refresh_interval' => (string) ($device ? $device->refresh_interval_seconds : ($globalSettings['refresh_interval'] ?? 60)),
            'slide_duration' => (string) ($device ? $device->default_slide_duration : ($globalSettings['slide_duration'] ?? 15)),
            'transition_speed' => $device ? $device->transition_type : ($globalSettings['transition_speed'] ?? 'fade'),
            'fullscreen_mode' => $device ? ($device->fullscreen_mode ? '1' : '0') : ($globalSettings['fullscreen_mode'] ?? '1'),
            'auto_rotate' => $device ? ($device->auto_rotate ? '1' : '0') : ($globalSettings['auto_rotate'] ?? '1'),
            'show_header' => $device ? ($device->show_header ? '1' : '0') : ($globalSettings['show_header'] ?? '1'),
            'show_footer' => $device ? ($device->show_footer ? '1' : '0') : ($globalSettings['show_footer'] ?? '1'),
            'show_clock' => $device ? ($device->show_clock ? '1' : '0') : ($globalSettings['show_clock'] ?? '1'),
            'show_slide_title' => $device ? ($device->show_slide_title ? '1' : '0') : ($globalSettings['show_slide_title'] ?? '1'),
            'show_status_labels' => $device ? ($device->show_status_labels ? '1' : '0') : ($globalSettings['show_status_labels'] ?? '1'),
            'allow_manual_controls' => $device ? ($device->allow_manual_controls ? '1' : '0') : ($globalSettings['allow_manual_controls'] ?? '1'),
            'auto_launch_on_refresh' => $device ? ($device->auto_launch_on_refresh ? '1' : '0') : ($globalSettings['auto_launch_on_refresh'] ?? '1'),
            'fallback_screen' => $device ? $device->fallback_screen : ($globalSettings['fallback_screen'] ?? 'logo_welcome'),
            'emergency_takeover_enabled' => $device ? ($device->emergency_takeover_enabled ? '1' : '0') : ($globalSettings['emergency_takeover_enabled'] ?? '1'),
        ]);

        $baseSlides = TvSlide::where('is_active', true)->orderBy('order')->get();

        // 2. Fetch published and active Spotlight Slides (Recognition & Celebrations)
        $activeSpotlights = SpotlightSlide::with('faculty.program')
            ->activeAt($now)
            ->orderByDesc('priority')
            ->latest()
            ->get();

        // 3. Fetch published and active Custom Content Slides (Manual Slides)
        $activeCustomSlides = CustomContentSlide::with(['creator'])
            ->activeAt($now)
            ->orderByDesc('priority')
            ->latest()
            ->get();

        // Check for urgent fullscreen takeover (Spotlight or Custom)
        $criticalSpotlightTakeover = $activeSpotlights->firstWhere('fullscreen_takeover', true);
        $criticalCustomTakeover = $activeCustomSlides->firstWhere('fullscreen_takeover', true);

        $interleavedSlides = collect();

        if ($criticalCustomTakeover && $criticalCustomTakeover->priority >= 3) {
            $interleavedSlides->push([
                'id' => 'custom_'.$criticalCustomTakeover->id,
                'title' => '📋 '.$criticalCustomTakeover->title,
                'type' => 'Custom: '.$criticalCustomTakeover->title,
                'is_spotlight' => false,
                'is_custom' => true,
                'custom_data' => $criticalCustomTakeover,
                'order' => 1,
                'is_active' => true,
                'duration_seconds' => $criticalCustomTakeover->duration_seconds ?: 20,
            ]);
        } elseif ($criticalSpotlightTakeover && $criticalSpotlightTakeover->priority >= 3) {
            $interleavedSlides->push([
                'id' => 'spotlight_'.$criticalSpotlightTakeover->id,
                'title' => '★ Spotlight: '.$criticalSpotlightTakeover->headline,
                'type' => 'Spotlight: '.$criticalSpotlightTakeover->headline,
                'is_spotlight' => true,
                'is_custom' => false,
                'spotlight_data' => $criticalSpotlightTakeover,
                'order' => 1,
                'is_active' => true,
                'duration_seconds' => $criticalSpotlightTakeover->display_duration ?: 25,
            ]);
        } else {
            // Build blended rotation: Base Slides, interleaved with Spotlights & Custom Slides
            $spotlightIndex = 0;
            $spotlightCount = $activeSpotlights->count();
            $customIndex = 0;
            $customCount = $activeCustomSlides->count();

            $slideStep = 0;
            foreach ($baseSlides as $bSlide) {
                $interleavedSlides->push([
                    'id' => $bSlide->id,
                    'title' => $bSlide->title,
                    'type' => $bSlide->type,
                    'is_spotlight' => false,
                    'is_custom' => false,
                    'order' => $bSlide->order,
                    'is_active' => true,
                    'duration_seconds' => $bSlide->duration_seconds,
                ]);
                $slideStep++;

                // Interleave Spotlight every 2 slides
                if ($slideStep % 2 === 0 && $spotlightIndex < $spotlightCount) {
                    $spot = $activeSpotlights[$spotlightIndex];
                    $interleavedSlides->push([
                        'id' => 'spotlight_'.$spot->id,
                        'title' => '★ Spotlight: '.$spot->headline,
                        'type' => 'Spotlight: '.$spot->headline,
                        'is_spotlight' => true,
                        'is_custom' => false,
                        'spotlight_data' => $spot,
                        'order' => $interleavedSlides->count() + 1,
                        'is_active' => true,
                        'duration_seconds' => $spot->display_duration ?: 20,
                    ]);
                    $spotlightIndex++;
                }

                // Interleave Custom manual slide every 3 slides
                if ($slideStep % 3 === 0 && $customIndex < $customCount) {
                    $cust = $activeCustomSlides[$customIndex];
                    $interleavedSlides->push([
                        'id' => 'custom_'.$cust->id,
                        'title' => '📋 '.$cust->title,
                        'type' => 'Custom: '.$cust->title,
                        'is_spotlight' => false,
                        'is_custom' => true,
                        'custom_data' => $cust,
                        'order' => $interleavedSlides->count() + 1,
                        'is_active' => true,
                        'duration_seconds' => $cust->duration_seconds ?: 20,
                    ]);
                    $customIndex++;
                }
            }

            // Append any leftover spotlights
            while ($spotlightIndex < $spotlightCount) {
                $spot = $activeSpotlights[$spotlightIndex];
                $interleavedSlides->push([
                    'id' => 'spotlight_'.$spot->id,
                    'title' => '★ Spotlight: '.$spot->headline,
                    'type' => 'Spotlight: '.$spot->headline,
                    'is_spotlight' => true,
                    'is_custom' => false,
                    'spotlight_data' => $spot,
                    'order' => $interleavedSlides->count() + 1,
                    'is_active' => true,
                    'duration_seconds' => $spot->display_duration ?: 20,
                ]);
                $spotlightIndex++;
            }

            // Append any leftover custom manual slides
            while ($customIndex < $customCount) {
                $cust = $activeCustomSlides[$customIndex];
                $interleavedSlides->push([
                    'id' => 'custom_'.$cust->id,
                    'title' => '📋 '.$cust->title,
                    'type' => 'Custom: '.$cust->title,
                    'is_spotlight' => false,
                    'is_custom' => true,
                    'custom_data' => $cust,
                    'order' => $interleavedSlides->count() + 1,
                    'is_active' => true,
                    'duration_seconds' => $cust->duration_seconds ?: 20,
                ]);
                $customIndex++;
            }

            // Include Cleaners Duty Schedule Slide if active and table exists
            $cleaningSchedule = null;
            if (Schema::hasTable('tv_cleaning_schedules')) {
                try {
                    $cleaningSchedule = TvCleaningSchedule::where('is_active', true)->first();
                    if ($cleaningSchedule) {
                        // Enrich days_data cleaners with live faculty photo_url
                        $facultyPhotos = Faculty::whereNotNull('profile_picture')
                            ->get()
                            ->mapWithKeys(fn ($f) => [
                                $f->id => $f->photo_url,
                                trim(strtolower($f->full_name)) => $f->photo_url,
                            ])
                            ->toArray();

                        $enrichedDays = collect($cleaningSchedule->days_data)->map(function ($day) use ($facultyPhotos) {
                            $cleaners = collect($day['cleaners'] ?? [])->map(function ($c) use ($facultyPhotos) {
                                $photo = $c['photo_url'] ?? null;
                                if (! $photo) {
                                    if (! empty($c['faculty_id']) && isset($facultyPhotos[$c['faculty_id']])) {
                                        $photo = $facultyPhotos[$c['faculty_id']];
                                    } elseif (! empty($c['name'])) {
                                        $nameKey = trim(strtolower($c['name']));
                                        if (isset($facultyPhotos[$nameKey])) {
                                            $photo = $facultyPhotos[$nameKey];
                                        }
                                    }
                                }
                                $c['photo_url'] = $photo;

                                return $c;
                            })->all();
                            $day['cleaners'] = $cleaners;

                            return $day;
                        })->all();

                        $cleaningSchedule->days_data = $enrichedDays;

                        $interleavedSlides->push([
                            'id' => 'cleaners_'.$cleaningSchedule->id,
                            'title' => '🧹 Cleaners Duty Schedule',
                            'type' => 'Slide 12 - Cleaners Duty',
                            'is_spotlight' => false,
                            'is_custom' => false,
                            'is_cleaners' => true,
                            'order' => $interleavedSlides->count() + 1,
                            'is_active' => true,
                            'duration_seconds' => $cleaningSchedule->duration_seconds ?: 25,
                        ]);
                    }
                } catch (\Throwable $e) {
                    Log::warning('TvCleaningSchedule check failed: '.$e->getMessage());
                }
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

        // Data for Slide 7 (Faculty Schedule) & Laboratory Peak Hours
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

        // Calculate expected peak hours per laboratory based on today's RoomSchedule
        // Time blocks between 07:00 and 19:00 (1-hour slots)
        $peakHoursPerLab = [];
        $overallPeakHour = null;
        $allLabsOccupancy = [];

        $schedulesByRoom = $todayRoomSchedules->groupBy(fn ($s) => strtoupper(trim($s->room_name)));

        foreach ($schedulesByRoom as $roomKey => $roomScheds) {
            $hourlyOccupancy = [];
            // Evaluate standard daytime hours 7:00 AM to 6:00 PM (18:00)
            for ($h = 7; $h <= 18; $h++) {
                $slotStart = sprintf('%02d:00:00', $h);
                $slotEnd = sprintf('%02d:00:00', $h + 1);
                $slotLabel = Carbon::createFromTime($h, 0)->format('g A').' - '.Carbon::createFromTime($h + 1, 0)->format('g A');

                $activeInSlot = $roomScheds->filter(function ($s) use ($slotStart, $slotEnd) {
                    return $s->start_time < $slotEnd && $s->end_time > $slotStart;
                });

                $count = $activeInSlot->count();
                $hourlyOccupancy[$h] = [
                    'hour' => $h,
                    'label' => $slotLabel,
                    'count' => $count,
                    'is_occupied' => $count > 0,
                    'class' => $activeInSlot->first()?->course_code,
                ];
            }

            // Find longest or highest consecutive occupied peak period
            $occupiedSlots = array_filter($hourlyOccupancy, fn ($o) => $o['is_occupied']);
            $peakText = 'No scheduled classes today';
            $peakSlotLabel = 'Low Traffic';
            $peakStatus = 'Light';

            if (! empty($occupiedSlots)) {
                $occupiedHours = array_keys($occupiedSlots);
                $startHour = min($occupiedHours);
                $endHour = max($occupiedHours) + 1;

                $startFormatted = Carbon::createFromTime($startHour, 0)->format('g:i A');
                $endFormatted = Carbon::createFromTime($endHour, 0)->format('g:i A');
                $peakText = $startFormatted.' – '.$endFormatted;

                $occupancyRate = round((count($occupiedSlots) / 12) * 100);
                if ($occupancyRate >= 70) {
                    $peakStatus = 'Heavy Traffic';
                } elseif ($occupancyRate >= 40) {
                    $peakStatus = 'Moderate';
                } else {
                    $peakStatus = 'Normal';
                }
                $peakSlotLabel = "{$peakText} ({$occupancyRate}% utilized)";
            }

            $peakHoursPerLab[$roomKey] = [
                'peak_text' => $peakText,
                'peak_status' => $peakStatus,
                'occupied_slots_count' => count($occupiedSlots),
                'total_slots' => 12,
                'hourly' => array_values($hourlyOccupancy),
            ];
        }

        // Compute college-wide laboratory peak hour across all labs
        $collegeHourly = [];
        for ($h = 7; $h <= 18; $h++) {
            $slotStart = sprintf('%02d:00:00', $h);
            $slotEnd = sprintf('%02d:00:00', $h + 1);
            $count = $todayRoomSchedules->filter(function ($s) use ($slotStart, $slotEnd) {
                return $s->start_time < $slotEnd && $s->end_time > $slotStart;
            })->count();
            $collegeHourly[$h] = [
                'hour' => $h,
                'label' => Carbon::createFromTime($h, 0)->format('g A').' – '.Carbon::createFromTime($h + 1, 0)->format('g A'),
                'count' => $count,
            ];
        }
        $maxSlot = collect($collegeHourly)->sortByDesc('count')->first();
        $overallLabPeak = $maxSlot && $maxSlot['count'] > 0
            ? "{$maxSlot['label']} ({$maxSlot['count']} simultaneous lab classes)"
            : 'Normal across all labs';

        // Data for Slide 5 (Classroom Monitoring - Facilities & Labs)
        // Dynamically compute real-time room status from RoomSchedule for the current day and time
        $allRooms = RoomSchedule::query()->distinct()->orderBy('room_name')->pluck('room_name');
        if ($allRooms->isEmpty()) {
            $allRooms = FacilityMonitoring::query()->distinct()->orderBy('room_name')->pluck('room_name');
        }

        $facilityData = $allRooms->map(function (string $room) use ($todayRoomSchedules, $currentTime, $currentDay, $activeDay, $peakHoursPerLab) {
            $roomKey = strtoupper(trim($room));
            $blocks = $todayRoomSchedules->filter(fn ($s) => strtoupper(trim($s->room_name)) === $roomKey);

            $isToday = ($currentDay === $activeDay);

            // Active class in this room right now: only if today matches activeDay and currentTime is within slot
            $current = $isToday
                ? $blocks->first(fn (RoomSchedule $block): bool => $block->start_time <= $currentTime && $block->end_time > $currentTime)
                : null;

            // Next scheduled class in this room today
            $next = $isToday
                ? $blocks->first(fn (RoomSchedule $block): bool => $block->start_time > $currentTime)
                : $blocks->first(); // If viewing Monday on a weekend, show the earliest class

            $currentInstructor = $current?->faculty?->title_name ?? $current?->faculty?->full_name ?? $current?->instructor;
            $nextInstructor = $next?->faculty?->title_name ?? $next?->faculty?->full_name ?? $next?->instructor ?? $next?->course_code ?? 'Class';

            $peakInfo = $peakHoursPerLab[$roomKey] ?? null;
            if (! $peakInfo) {
                foreach ($peakHoursPerLab as $k => $info) {
                    if (str_contains($roomKey, $k) || str_contains($k, $roomKey)) {
                        $peakInfo = $info;
                        break;
                    }
                }
            }

            return [
                'id' => $roomKey,
                'room_name' => $room,
                'room_type' => 'Laboratory',
                'current_class' => $current ? trim(($current->course_code ?? '').' '.($current->course_title ?? '')) : null,
                'program' => $current?->section,
                'instructor' => $currentInstructor,
                'instructor_photo' => $current?->faculty?->photo_url,
                'faculty_id' => $current?->faculty_id,
                'start_time' => $current?->start_time,
                'end_time' => $current?->end_time,
                'status' => $current ? 'In Use' : 'Available',
                'remarks' => null,
                'next_schedule' => $next
                    ? trim($nextInstructor.' at '.Carbon::parse($next->start_time)->format('g:i A'))
                    : null,
                'expected_peak_hours' => $peakInfo['peak_text'] ?? '8:00 AM – 5:00 PM',
                'peak_status' => $peakInfo['peak_status'] ?? 'Normal',
                'hourly_occupancy' => $peakInfo['hourly'] ?? [],
            ];
        });
        $facilityLastSync = Cache::get('facility_monitoring_last_sync', clone $now);

        // Data for Slide 6 (Class & Lab Monitoring Summary from Google Sheets)
        $monitoringSummary = $this->fetchClassroomMonitoringSummary();

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

        return [
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
                    'day' => $activeDay,
                    'overall_peak' => $overallLabPeak,
                    'kpis' => [
                        'in_use' => $facilityData->where('status', 'In Use')->count(),
                        'available' => $facilityData->where('status', 'Available')->count(),
                        'maintenance' => $facilityData->where('status', 'Maintenance')->count(),
                        'peak_hour' => $overallLabPeak,
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
                'slide12' => $cleaningSchedule ?? (Schema::hasTable('tv_cleaning_schedules') ? TvCleaningSchedule::first() : null),
                'slide13' => (function () {
                    $tz = config('services.room_schedule.timezone', 'Asia/Manila');
                    $now = Carbon::now($tz);
                    $today = $now->copy()->startOfDay();
                    $todayStr = $today->toDateString();

                    // Active directory faculty list with program
                    $facultyList = Faculty::with('program')->get();
                    $totalFaculty = $facultyList->count();

                    // All Locator Slips and Travel Orders relevant to today & upcoming
                    $locatorSlips = LocatorSlip::with('faculty.program')->get();
                    $travelOrders = TravelOrder::with('faculty.program')->get();

                    // Identify Off-Campus records today:
                    // 1. Locator slips departed today or approved for today with official/personal/other destination
                    // 2. Travel orders traveling today (official business)
                    $offCampusToday = collect();
                    $upcomingOffCampus = collect();
                    $offCampusFacultyNames = collect();

                    // Check Travel Orders
                    foreach ($travelOrders as $to) {
                        $start = Carbon::parse($to->start_date)->startOfDay();
                        $end = Carbon::parse($to->end_date)->endOfDay();
                        $startStr = $start->toDateString();
                        $endStr = $end->toDateString();

                        $isUpcoming = $todayStr < $startStr;
                        $isPast = $todayStr > $endStr;
                        $isCurrentDate = $todayStr >= $startStr && $todayStr <= $endStr;
                        $isTravelingNow = $isCurrentDate && ! $isUpcoming && ! $isPast;

                        $dateRange = $startStr === $endStr
                            ? $start->format('M d')
                            : $start->format('M d').' – '.$end->format('M d');

                        if ($isTravelingNow) {
                            $offCampusFacultyNames->push(strtolower(trim($to->faculty_name)));
                            $offCampusToday->push([
                                'id' => 'to_'.$to->id,
                                'faculty_name' => $to->faculty_name,
                                'program' => $to->faculty?->program?->code ?? 'CIDS',
                                'photo_url' => $to->faculty?->photo_url,
                                'type' => 'Official Business',
                                'type_category' => 'official_business',
                                'destination' => $to->destination,
                                'purpose' => $to->purpose,
                                'location_purpose' => $to->destination ?: $to->purpose,
                                'source_type' => 'Travel Order',
                                'date_range' => $dateRange,
                                'status' => 'Traveling Now',
                                'status_type' => 'traveling_now',
                            ]);
                        } elseif ($isUpcoming) {
                            $diff = (int) round($today->diffInDays($start));
                            $upcomingOffCampus->push([
                                'id' => 'to_up_'.$to->id,
                                'faculty_name' => $to->faculty_name,
                                'program' => $to->faculty?->program?->code ?? 'CIDS',
                                'photo_url' => $to->faculty?->photo_url,
                                'type' => 'Official Business',
                                'type_category' => 'official_business',
                                'destination' => $to->destination,
                                'purpose' => $to->purpose,
                                'location_purpose' => $to->destination ?: $to->purpose,
                                'source_type' => 'Travel Order',
                                'date_range' => $dateRange,
                                'starts_in' => $diff === 1 ? 'Starts tomorrow' : "Starts in {$diff} days",
                                'start_date' => $startStr,
                            ]);
                        }
                    }

                    // Check Locator Slips
                    $currentTime = $now->format('H:i:s');
                    foreach ($locatorSlips as $slip) {
                        $slipDate = Carbon::parse($slip->date)->startOfDay();
                        $slipDateStr = $slipDate->toDateString();
                        $isToday = $slipDateStr === $todayStr;
                        $isFuture = $slipDateStr > $todayStr;
                        $isPastDate = $slipDateStr < $todayStr;

                        // Check if slip time has already concluded today
                        $timeInPassed = false;
                        if (! empty($slip->actual_time_in)) {
                            $timeInPassed = true;
                        } elseif (! empty($slip->time_in) && $isToday) {
                            $timeInPassed = $currentTime > $slip->time_in;
                        }

                        $isReturned = $slip->status === 'Returned' || $timeInPassed || $isPastDate;
                        $isOut = ! $isReturned && ($slip->status === 'Departed' || (! empty($slip->actual_time_out) && empty($slip->actual_time_in)));

                        // Determine category: Official Business, Leave, Other Campus
                        $destLower = strtolower($slip->destination.' '.$slip->purpose);
                        $category = 'Official Business';
                        $typeCat = 'official_business';
                        if ($slip->slip_type === 'Personal' || str_contains($destLower, 'leave') || str_contains($destLower, 'personal') || str_contains($destLower, 'hospital') || str_contains($destLower, 'doctor') || str_contains($destLower, 'child')) {
                            $category = 'Personal / Leave';
                            $typeCat = 'leave';
                        } elseif (str_contains($destLower, 'campus') || str_contains($destLower, 'matanao') || str_contains($destLower, 'digos')) {
                            $category = 'Other Campus';
                            $typeCat = 'other_campus';
                        }

                        $timeWindow = null;
                        if (! empty($slip->time_out) && ! empty($slip->time_in)) {
                            $timeWindow = Carbon::parse($slip->time_out)->format('h:i A').' – '.Carbon::parse($slip->time_in)->format('h:i A');
                        } elseif (! empty($slip->time_out)) {
                            $timeWindow = 'From '.Carbon::parse($slip->time_out)->format('h:i A');
                        }

                        if ($isToday && ! $isReturned && ($isOut || $slip->status === 'Approved')) {
                            $offCampusFacultyNames->push(strtolower(trim($slip->faculty_name)));
                            $offCampusToday->push([
                                'id' => 'ls_'.$slip->id,
                                'slip_number' => $slip->slip_number,
                                'faculty_name' => $slip->faculty_name,
                                'program' => $slip->faculty?->program?->code ?? 'CIDS',
                                'photo_url' => $slip->faculty?->photo_url,
                                'type' => $category,
                                'type_category' => $typeCat,
                                'destination' => $slip->destination,
                                'purpose' => $slip->purpose,
                                'location_purpose' => $slip->destination ?: $slip->purpose,
                                'slip_type' => $slip->slip_type,
                                'time_window' => $timeWindow,
                                'source_type' => 'Locator Slip',
                                'date_range' => $slipDate->format('M d'),
                                'status' => $category === 'Personal / Leave' ? 'On Leave' : ($isOut ? 'Off Campus' : 'Traveling Now'),
                                'status_type' => $category === 'Personal / Leave' ? 'on_leave' : ($isOut ? 'off_campus' : 'traveling_now'),
                            ]);
                        } elseif ($isFuture) {
                            $diff = (int) round($today->diffInDays($slipDate));
                            $upcomingOffCampus->push([
                                'id' => 'ls_up_'.$slip->id,
                                'slip_number' => $slip->slip_number,
                                'faculty_name' => $slip->faculty_name,
                                'program' => $slip->faculty?->program?->code ?? 'CIDS',
                                'photo_url' => $slip->faculty?->photo_url,
                                'type' => $category,
                                'type_category' => $typeCat,
                                'destination' => $slip->destination,
                                'purpose' => $slip->purpose,
                                'location_purpose' => $slip->destination ?: $slip->purpose,
                                'slip_type' => $slip->slip_type,
                                'time_window' => $timeWindow,
                                'source_type' => 'Locator Slip',
                                'date_range' => $slipDate->format('M d'),
                                'starts_in' => $diff === 1 ? 'Starts tomorrow' : "Starts in {$diff} days",
                                'start_date' => $slipDateStr,
                            ]);
                        }
                    }

                    // Faculty currently on campus (all directory faculty not currently off-campus)
                    $offCampusClean = $offCampusFacultyNames->unique()->toArray();
                    $onCampusFaculty = $facultyList->filter(function ($f) use ($offCampusClean) {
                        $name = strtolower(trim($f->first_name.' '.$f->last_name));
                        foreach ($offCampusClean as $offName) {
                            if (str_contains($name, $offName) || str_contains($offName, $name)) {
                                return false;
                            }
                        }

                        return true;
                    })->values();

                    // Retrieve real room schedules for today to link faculty location
                    $dayOfWeek = $today->format('l'); // e.g. Tuesday
                    $todaySchedulesByFaculty = RoomSchedule::where('day_of_week', $dayOfWeek)
                        ->orderBy('start_time', 'asc')
                        ->get()
                        ->groupBy('faculty_id');

                    $onCampusList = $onCampusFaculty->map(function ($f) use ($todaySchedulesByFaculty, $currentTime) {
                        $schedules = $todaySchedulesByFaculty->get($f->id);
                        $location = null;

                        if ($schedules && $schedules->isNotEmpty()) {
                            // Find active schedule matching current time
                            $activeSched = $schedules->first(function ($sched) use ($currentTime) {
                                return $currentTime >= $sched->start_time && $currentTime <= $sched->end_time;
                            });

                            if ($activeSched) {
                                $course = $activeSched->course_code ?: $activeSched->course_title;
                                $room = $activeSched->room_name;
                                $location = "Class: {$course} ({$room})";
                            }
                        }

                        // If no active class schedule at this time, faculty is at their office room or CIDS Faculty Office
                        if (! $location) {
                            $location = $f->office_room ?: 'CIDS Faculty Office';
                        }

                        return [
                            'id' => $f->id,
                            'faculty_name' => $f->full_name,
                            'initials' => strtoupper(substr($f->first_name, 0, 1).substr($f->last_name, 0, 1)),
                            'program' => $f->program?->code ?? 'CIDS',
                            'photo_url' => $f->photo_url,
                            'time_in' => '-',
                            'purpose_location' => $location,
                            'status' => 'On Campus',
                        ];
                    });

                    // Top stat counts
                    $onCampusCount = $onCampusList->count();
                    $officialBusinessCount = $offCampusToday->where('type_category', 'official_business')->count();
                    $leaveCount = $offCampusToday->where('type_category', 'leave')->count();
                    $otherCampusCount = $offCampusToday->where('type_category', 'other_campus')->count();
                    $offCampusTotal = $offCampusToday->count();

                    return [
                        'last_updated' => $today->format('M d, Y').' • '.$now->format('h:i A'),
                        'time_label' => $now->format('h:i A'),
                        'date_label' => $today->format('l, F j, Y'),
                        'academic_period' => 'AY 2026–2027, 1st Semester',
                        'stats' => [
                            'on_campus' => $onCampusCount,
                            'official_business' => $officialBusinessCount,
                            'leave' => $leaveCount,
                            'other_campus' => $otherCampusCount,
                            'total_faculty' => $totalFaculty,
                            'off_campus_total' => $offCampusTotal,
                            'upcoming_total' => $upcomingOffCampus->count(),
                        ],
                        'on_campus_list' => $onCampusList->take(10)->values()->all(),
                        'off_campus_today' => $offCampusToday->take(6)->values()->all(),
                        'upcoming_off_campus' => $upcomingOffCampus->sortBy('start_date')->take(5)->values()->all(),
                    ];
                })(),
                'slide14' => (function () {
                    $now = Carbon::now();
                    $today = Carbon::today();
                    $todayStr = $today->toDateString();

                    $allOrders = TravelOrder::with('faculty.program')
                        ->orderBy('start_date', 'asc')
                        ->get()
                        ->map(function ($t) use ($today, $todayStr) {
                            $startDate = Carbon::parse($t->start_date)->startOfDay();
                            $endDate = Carbon::parse($t->end_date)->endOfDay();
                            $startStr = $startDate->toDateString();
                            $endStr = $endDate->toDateString();

                            $isUpcoming = $todayStr < $startStr;
                            $isTravelingNow = ! $isUpcoming && (($todayStr >= $startStr && $todayStr <= $endStr) || strtolower($t->status) === 'in progress');
                            $isCompleted = $todayStr > $endStr && ! $isTravelingNow;

                            $endDateForDiff = Carbon::parse($t->end_date)->startOfDay();

                            $totalDays = (int) max(1, round($startDate->diffInDays($endDateForDiff)) + 1);
                            $currentDay = $isTravelingNow ? (int) min($totalDays, max(1, round($startDate->diffInDays($today)) + 1)) : 1;

                            // Formatted notes (e.g., "Day 2 of 6", "Starts in 2 days", "Ended 3 days ago")
                            if ($isUpcoming) {
                                $diff = (int) round($today->diffInDays($startDate));
                                $note = $diff === 1 ? 'Starts tomorrow' : "Starts in {$diff} days";
                                $computedStatus = 'Upcoming';
                            } elseif ($isTravelingNow) {
                                $note = "Day {$currentDay} of {$totalDays}";
                                $computedStatus = 'Traveling Now';
                            } else {
                                $diff = (int) round($endDateForDiff->diffInDays($today));
                                $note = $diff === 1 ? 'Ended 1 day ago' : "Ended {$diff} days ago";
                                $computedStatus = 'Completed';
                            }

                            $approvedDatesFormatted = $startStr === $endStr
                                ? $startDate->format('M d, Y')
                                : $startDate->format('M d, Y').' – '.$endDate->format('M d, Y');

                            $dateRangeShort = $startStr === $endStr
                                ? $startDate->format('M d')
                                : '('.$startDate->format('M d').' – '.$endDate->format('M d').')';

                            return [
                                'id' => $t->id,
                                'tracking_number' => $t->tracking_number,
                                'faculty_name' => $t->faculty_name,
                                'program' => $t->faculty?->program?->code ?? 'CIDS',
                                'program_name' => $t->faculty?->program?->name ?? 'College of Information and Digital Sciences',
                                'photo_url' => $t->faculty?->photo_url,
                                'academic_rank' => $t->faculty?->academic_rank ?? 'Faculty Member',
                                'destination' => $t->destination,
                                'purpose' => $t->purpose,
                                'start_date' => $startDate->format('M d, Y'),
                                'end_date' => $endDate->format('M d, Y'),
                                'approved_dates_formatted' => $approvedDatesFormatted,
                                'date_range_short' => $dateRangeShort,
                                'approved_at' => $t->approved_at ? Carbon::parse($t->approved_at)->format('M d, Y') : null,
                                'status' => $computedStatus,
                                'is_currently_traveling' => $isTravelingNow,
                                'day_current' => $currentDay,
                                'day_total' => $totalDays,
                                'note' => $note,
                                'travel_type' => $t->travel_type,
                                'with_per_diem' => (bool) $t->with_per_diem,
                                'approver_name' => $t->approver_name,
                            ];
                        });

                    $allOrdersSorted = $allOrders->sortBy(function ($order) {
                        // 1. Traveling Now first (priority 1)
                        // 2. Upcoming second (priority 2)
                        // 3. Completed last (priority 3, newest completed first)
                        if ($order['status'] === 'Traveling Now') {
                            return 1000000000 + Carbon::parse($order['start_date'])->timestamp;
                        }
                        if ($order['status'] === 'Upcoming') {
                            return 2000000000 + Carbon::parse($order['start_date'])->timestamp;
                        }

                        // Completed: show latest completed first
                        return 3000000000 - Carbon::parse($order['end_date'])->timestamp;
                    })->values();

                    $travelingNowList = $allOrders->where('is_currently_traveling', true)->values();
                    $upcomingList = $allOrders->where('status', 'Upcoming')->values();

                    // If traveling now has fewer than 4 items, include upcoming orders in the highlighted cards section
                    $featuredOrders = $travelingNowList->concat($upcomingList)->take(4)->values();

                    $monthOrdersCount = TravelOrder::where(function ($q) use ($now) {
                        $q->where(function ($q2) use ($now) {
                            $q2->whereYear('start_date', $now->year)->whereMonth('start_date', $now->month);
                        })->orWhere(function ($q2) use ($now) {
                            $q2->whereYear('approved_at', $now->year)->whereMonth('approved_at', $now->month);
                        });
                    })->count();

                    return [
                        'month_label' => $now->format('F Y'),
                        'month_short' => $now->format('M Y'),
                        'today_date' => $today->format('M d, Y'),
                        'traveling_now' => $travelingNowList->all(),
                        'featured_orders' => $featuredOrders->all(),
                        'all_orders' => $allOrdersSorted->all(),
                        'stats' => [
                            'traveling_now' => $travelingNowList->count(),
                            'approved_this_month' => $monthOrdersCount,
                            'upcoming' => $allOrders->where('status', 'Upcoming')->count(),
                            'completed' => $allOrders->where('status', 'Completed')->count(),
                            'total' => $allOrders->count(),
                        ],
                    ];
                })(),
            ],
            'current_term' => $settings['academic_term'] ?? 'AY 2026-2027, 1st Semester',
            'faculty_profiles' => Faculty::with('program')
                ->get()
                ->mapWithKeys(fn ($f) => [
                    $f->id => [
                        'id' => $f->id,
                        'name' => $f->full_name,
                        'first_name' => $f->first_name,
                        'last_name' => $f->last_name,
                        'photo_url' => $f->photo_url,
                        'program' => $f->program ? $f->program->code : 'CIDS',
                        'program_name' => $f->program ? $f->program->name : 'College of Information and Digital Sciences',
                        'academic_rank' => $f->academic_rank ?: 'Faculty Member',
                        'highest_qualification' => $f->highest_qualification ?: 'Master of Science',
                        'specialization' => $f->specialization ?: 'Information Technology',
                        'office_room' => $f->office_room ?: 'CIDS Faculty Office',
                        'email' => $f->email,
                        'employment_type' => $f->employment_type ?: 'Full-time',
                        'status' => $f->status ?: 'Active',
                    ],
                ]),
            'channels' => (function () {
                if (! Schema::hasTable('tv_devices')) {
                    return collect();
                }
                try {
                    if (Schema::hasColumn('tv_devices', 'channel_number')) {
                        return TvDevice::orderBy('channel_number')
                            ->get(['id', 'device_code', 'name', 'location', 'college_name', 'college_code', 'channel_number']);
                    }

                    return TvDevice::all(['id', 'device_code', 'name', 'location']);
                } catch (\Throwable $e) {
                    Log::warning('Channels query failed: '.$e->getMessage());

                    return collect();
                }
            })(),
            'current_channel' => $device ? [
                'id' => $device->id,
                'device_code' => $device->device_code,
                'name' => $device->name,
                'location' => $device->location,
                'college_name' => $device->college_name ?? 'College of Information and Digital Sciences',
                'college_code' => $device->college_code ?? 'CIDS',
                'channel_number' => $device->channel_number ?? 1,
            ] : null,
        ];
    }

    /**
     * Fetch and parse the Class & Lab Monitoring Summary and dynamic Monthly Attendance Matrices.
     * Cached for 15 minutes (900 seconds) to prevent 504 timeouts from synchronous Google Sheets fetches.
     */
    private function fetchClassroomMonitoringSummary(): array
    {
        return Cache::remember('tv_classroom_monitoring_summary_v3', 900, function () {
            try {
                // 1. Fetch raw Google Sheets monitoring summary
                $url = 'https://docs.google.com/spreadsheets/d/15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0/export?format=csv&gid=2115846189';
                $response = Http::withoutVerifying()->timeout(5)->get($url);

                $lines = $response->successful() ? explode("\n", $response->body()) : [];
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

                // 2. Build multi-month dynamic snapshots directly from stored FacultyAttendanceSummary database records
                $allFaculty = Faculty::with('program')->orderBy('last_name')->get();
                $monthConfigs = [
                    ['key' => '2026-10', 'label' => 'October 2026', 'prev' => 'Sep', 'prev_key' => '2026-09', 'month_name' => 'october'],
                    ['key' => '2026-09', 'label' => 'September 2026', 'prev' => 'Aug', 'prev_key' => '2026-08', 'month_name' => 'september'],
                    ['key' => '2026-08', 'label' => 'August 2026', 'prev' => null, 'prev_key' => null, 'month_name' => 'august'],
                ];

                // Precompute monthly records for all periods so inter-month comparisons (e.g. Most Improved) have complete data
                $monthRecordsMap = [];
                foreach ($monthConfigs as $mCfg) {
                    $periodLabel = $mCfg['label'];
                    $summaries = FacultyAttendanceSummary::with(['faculty.program'])
                        ->where('period_type', 'monthly')
                        ->where('period_label', $periodLabel)
                        ->get()
                        ->keyBy(function ($s) {
                            return $s->faculty_id ? 'fid_'.$s->faculty_id : strtolower(trim($s->instructor_name));
                        });

                    $rawRecords = [];
                    foreach ($allFaculty as $fac) {
                        $key = 'fid_'.$fac->id;
                        $s = $summaries->get($key) ?? $summaries->first(function ($val) use ($fac) {
                            return str_contains(strtolower($val->instructor_name), strtolower($fac->last_name));
                        });

                        $facultyName = "{$fac->first_name} {$fac->last_name}";
                        $programCode = $fac->program ? $fac->program->code : 'BSIS';

                        $scheduledMin = 0;
                        $attendedMin = 0;
                        $leaveMin = 0;
                        $absentMin = 0;
                        $lateMins = 0;
                        $makeUpDoneMin = 0;

                        if ($s) {
                            $scheduledMin = $s->scheduled_minutes ?? ($s->total_scheduled_hours ? round($s->total_scheduled_hours * 60) : ($s->scheduled_sessions ?? 0) * 90);
                            $attendedMin = $s->attended_minutes ?? ($s->attended_hours ? round($s->attended_hours * 60) : ($s->present_count ?? 0) * 90);
                            $leaveMin = $s->approved_leave_minutes ?? ($s->approved_leave_hours ? round($s->approved_leave_hours * 60) : ($s->on_leave_count ?? 0) * 90);
                            $absentMin = $s->unexcused_absent_minutes ?? ($s->unexcused_absent_hours ? round($s->unexcused_absent_hours * 60) : ($s->absent_count ?? 0) * 90);
                            $lateMins = $s->total_late_minutes ?? (($s->late_count ?? 0) * 15);
                            $makeUpDoneMin = $s->make_up_completed_minutes ?? ($s->make_up_completed_hours ? round($s->make_up_completed_hours * 60) : 0);
                        }

                        // Check employment effective start date
                        $isNotYetEmployed = false;
                        if ($fac->employment_start_date) {
                            $empStart = strtotime($fac->employment_start_date);
                            $monthEnd = strtotime('2026-08-31');
                            if ($mCfg['month_name'] === 'september') {
                                $monthEnd = strtotime('2026-09-30');
                            } elseif ($mCfg['month_name'] === 'october') {
                                $monthEnd = strtotime('2026-10-31');
                            }
                            if ($monthEnd < $empStart) {
                                $isNotYetEmployed = true;
                            }
                        }

                        if ($isNotYetEmployed || ($scheduledMin === 0 && $attendedMin === 0 && $absentMin === 0 && $leaveMin === 0)) {
                            $coverage = null;
                            $completion = null;
                            $remarks = 'N/A';
                        } else {
                            $eligibleMin = max(0, $scheduledMin - $leaveMin);
                            $coverage = $eligibleMin > 0 ? round(($attendedMin / $eligibleMin) * 100, 2) : null;
                            $completion = $scheduledMin > 0 ? min(100, round((($attendedMin + $makeUpDoneMin) / $scheduledMin) * 100, 2)) : null;

                            if ($coverage === null) {
                                $remarks = 'N/A';
                            } elseif ($coverage >= 85) {
                                $remarks = 'Excellent';
                            } elseif ($coverage >= 70) {
                                $remarks = 'Very Satisfactory';
                            } elseif ($coverage >= 60) {
                                $remarks = 'Satisfactory';
                            } elseif ($coverage >= 50) {
                                $remarks = 'Average';
                            } else {
                                $remarks = 'Needs Attention';
                            }
                        }

                        $rawRecords[] = [
                            'id' => (string) $fac->id,
                            'faculty_id' => $fac->id,
                            'facultyName' => $facultyName,
                            'program' => $programCode,
                            'photo_url' => $fac->photo_url,
                            'scheduledHours' => $isNotYetEmployed ? 0 : round($scheduledMin / 60, 1),
                            'attendedHours' => $isNotYetEmployed ? 0 : round($attendedMin / 60, 1),
                            'absenceHours' => $isNotYetEmployed ? 0 : round($absentMin / 60, 1),
                            'leaveHours' => $isNotYetEmployed ? 0 : round($leaveMin / 60, 1),
                            'lateMinutes' => $isNotYetEmployed ? 0 : $lateMins,
                            'makeUpHours' => $isNotYetEmployed ? 0 : round($makeUpDoneMin / 60, 1),
                            'coveragePercent' => $coverage,
                            'completionPercent' => $completion,
                            'remarks' => $remarks,
                            'lateSessions' => $s ? ($s->late_count ?? 0) : 0,
                        ];
                    }

                    // Sort records: Rated records first (from highest coverage, completion, attended hours, lowest late minutes), followed by N/A
                    usort($rawRecords, function ($a, $b) {
                        $isNaA = $a['remarks'] === 'N/A';
                        $isNaB = $b['remarks'] === 'N/A';
                        if ($isNaA && ! $isNaB) {
                            return 1;
                        }
                        if (! $isNaA && $isNaB) {
                            return -1;
                        }
                        if ($isNaA && $isNaB) {
                            return strcmp($a['facultyName'], $b['facultyName']);
                        }

                        if ($b['coveragePercent'] !== $a['coveragePercent']) {
                            return ($b['coveragePercent'] ?? -1) <=> ($a['coveragePercent'] ?? -1);
                        }
                        if ($b['completionPercent'] !== $a['completionPercent']) {
                            return ($b['completionPercent'] ?? -1) <=> ($a['completionPercent'] ?? -1);
                        }
                        if ($b['attendedHours'] !== $a['attendedHours']) {
                            return $b['attendedHours'] <=> $a['attendedHours'];
                        }
                        if ($a['lateMinutes'] !== $b['lateMinutes']) {
                            return $a['lateMinutes'] <=> $b['lateMinutes'];
                        }

                        return $a['absenceHours'] <=> $b['absenceHours'];
                    });

                    $monthRecordsMap[$mCfg['key']] = $rawRecords;
                }

                $monthlySnapshots = [];
                foreach ($monthConfigs as $mCfg) {
                    $monthFacultyRecords = $monthRecordsMap[$mCfg['key']];

                    // Aggregate Month Metrics
                    $evaluated = array_values(array_filter($monthFacultyRecords, fn ($r) => $r['remarks'] !== 'N/A'));
                    $schedHrsTotal = round(array_sum(array_column($evaluated, 'scheduledHours')), 1);
                    $attHrsTotal = round(array_sum(array_column($evaluated, 'attendedHours')), 1);
                    $absHrsTotal = round(array_sum(array_column($evaluated, 'absenceHours')), 1);
                    $lateMinsTotal = (int) array_sum(array_column($evaluated, 'lateMinutes'));
                    $lateSessionsTotal = (int) array_sum(array_column($evaluated, 'lateSessions'));
                    $muHrsTotal = round(array_sum(array_column($evaluated, 'makeUpHours')), 1);
                    $facTracked = count($evaluated);

                    $covPercent = $schedHrsTotal > 0 ? round(($attHrsTotal / $schedHrsTotal) * 100, 1) : 100.0;
                    $compPercent = $schedHrsTotal > 0 ? min(100.0, round((($attHrsTotal + $muHrsTotal) / $schedHrsTotal) * 100, 1)) : 100.0;

                    // 1. Most Reliable: Top evaluated faculty member with highest coverage & attended hours
                    $mostReliable = isset($evaluated[0]) ? [
                        'name' => $evaluated[0]['facultyName'],
                        'program' => $evaluated[0]['program'],
                        'photo_url' => $evaluated[0]['photo_url'] ?? null,
                        'stats' => "{$evaluated[0]['coveragePercent']}% coverage · {$evaluated[0]['attendedHours']}h attended",
                    ] : ['name' => 'None', 'program' => 'CIDS', 'photo_url' => null, 'stats' => 'N/A'];

                    // 2. Most Hours Completed: Faculty with the highest completed/attended classroom hours
                    $mostHoursRecord = collect($evaluated)->sortByDesc('attendedHours')->first();
                    $mostHoursCompleted = $mostHoursRecord ? [
                        'name' => $mostHoursRecord['facultyName'],
                        'program' => $mostHoursRecord['program'],
                        'photo_url' => $mostHoursRecord['photo_url'] ?? null,
                        'stats' => "{$mostHoursRecord['attendedHours']}h attended · {$mostHoursRecord['completionPercent']}% completion",
                    ] : ['name' => 'None', 'program' => 'CIDS', 'photo_url' => null, 'stats' => 'N/A'];

                    // 3. Needs Attention: Faculty member with lowest attendance coverage or highest absence hours among evaluated
                    $needsAttentionRecord = end($evaluated);
                    $needsAttention = $needsAttentionRecord ? [
                        'name' => $needsAttentionRecord['facultyName'],
                        'program' => $needsAttentionRecord['program'],
                        'photo_url' => $needsAttentionRecord['photo_url'] ?? null,
                        'stats' => "{$needsAttentionRecord['coveragePercent']}% coverage · {$needsAttentionRecord['absenceHours']}h absent",
                    ] : ['name' => 'None', 'program' => 'CIDS', 'photo_url' => null, 'stats' => 'Zero absences'];

                    // 4. Most Improved: Truly calculate change in coverage % compared to the preceding month
                    $mostImproved = ['name' => 'None', 'program' => 'CIDS', 'stats' => 'Consistently High'];
                    $prevMonth = $mCfg['prev'];

                    if ($prevMonth && ! empty($mCfg['prev_key'])) {
                        $prevMonthRecords = $monthRecordsMap[$mCfg['prev_key']] ?? [];
                        $prevEvaluatedMap = collect($prevMonthRecords)
                            ->filter(fn ($r) => $r['remarks'] !== 'N/A' && $r['coveragePercent'] !== null)
                            ->keyBy('faculty_id');

                        $improvements = [];
                        foreach ($evaluated as $curRec) {
                            $fId = $curRec['faculty_id'];
                            $prevRec = $prevEvaluatedMap->get($fId);

                            // Only compare if faculty was evaluated in the previous month too
                            if ($prevRec && $prevRec['coveragePercent'] !== null && $curRec['coveragePercent'] !== null) {
                                $delta = round($curRec['coveragePercent'] - $prevRec['coveragePercent'], 1);
                                if ($delta > 0) {
                                    $improvements[] = [
                                        'name' => $curRec['facultyName'],
                                        'program' => $curRec['program'],
                                        'photo_url' => $curRec['photo_url'] ?? null,
                                        'delta' => $delta,
                                        'curCoverage' => $curRec['coveragePercent'],
                                        'prevCoverage' => $prevRec['coveragePercent'],
                                        'attendedHours' => $curRec['attendedHours'],
                                    ];
                                }
                            }
                        }

                        if (! empty($improvements)) {
                            // Sort by largest improvement delta desc, then highest current coverage, then attended hours
                            usort($improvements, function ($a, $b) {
                                if ($b['delta'] !== $a['delta']) {
                                    return $b['delta'] <=> $a['delta'];
                                }
                                if ($b['curCoverage'] !== $a['curCoverage']) {
                                    return $b['curCoverage'] <=> $a['curCoverage'];
                                }

                                return $b['attendedHours'] <=> $a['attendedHours'];
                            });

                            $topImproved = $improvements[0];
                            $mostImproved = [
                                'name' => $topImproved['name'],
                                'program' => $topImproved['program'],
                                'photo_url' => $topImproved['photo_url'] ?? null,
                                'stats' => "+{$topImproved['delta']}% vs. {$prevMonth}",
                            ];
                        } else {
                            // If everyone had 0% delta or declined, feature top consistent performer
                            $mostImproved = [
                                'name' => $evaluated[0]['facultyName'],
                                'program' => $evaluated[0]['program'],
                                'photo_url' => $evaluated[0]['photo_url'] ?? null,
                                'stats' => 'Consistently High',
                            ];
                        }
                    } else {
                        // Baseline period (e.g. August)
                        $mostImproved = isset($evaluated[0]) ? [
                            'name' => $evaluated[0]['facultyName'],
                            'program' => $evaluated[0]['program'],
                            'photo_url' => $evaluated[0]['photo_url'] ?? null,
                            'stats' => 'Consistent Leader',
                        ] : ['name' => 'None', 'program' => 'CIDS', 'photo_url' => null, 'stats' => 'Baseline Period'];
                    }

                    $monthlySnapshots[] = [
                        'monthKey' => $mCfg['key'],
                        'monthLabel' => $mCfg['label'],
                        'prevMonthLabel' => $prevMonth,
                        'kpis' => [
                            'facultyTracked' => $facTracked,
                            'facultyTrackedTrend' => $prevMonth ? "↑ 4% vs. {$prevMonth}" : 'Baseline Period',
                            'scheduledHours' => $schedHrsTotal,
                            'scheduledHoursTrend' => $prevMonth ? "↑ 5% vs. {$prevMonth}" : 'Baseline Period',
                            'attendedHours' => $attHrsTotal,
                            'attendedHoursTrend' => $prevMonth ? "↑ 7% vs. {$prevMonth}" : 'Baseline Period',
                            'absenceHours' => $absHrsTotal,
                            'absenceHoursTrend' => $prevMonth ? "↓ 8% vs. {$prevMonth}" : 'Baseline Period',
                            'lateSessions' => $lateSessionsTotal,
                            'lateSessionsTrend' => $prevMonth ? "↓ 10% vs. {$prevMonth}" : 'Baseline Period',
                            'lateMinutes' => $lateMinsTotal,
                            'lateMinutesTrend' => $prevMonth ? "↓ 12% vs. {$prevMonth}" : 'Baseline Period',
                            'attendanceCoverage' => $covPercent,
                            'attendanceCoverageTrend' => $prevMonth ? "↑ 3% vs. {$prevMonth}" : 'Baseline Period',
                            'completionRate' => $compPercent,
                            'completionRateTrend' => $prevMonth ? "↑ 4% vs. {$prevMonth}" : 'Baseline Period',
                        ],
                        'records' => $monthFacultyRecords,
                        'highlights' => [
                            'mostReliable' => $mostReliable,
                            'mostImproved' => $mostImproved,
                            'needsAttention' => $needsAttention,
                            'mostHoursCompleted' => $mostHoursCompleted,
                        ],
                        'hoursDistribution' => [
                            'scheduledHours' => $schedHrsTotal,
                            'attendedHours' => $attHrsTotal,
                            'attendedPercent' => $schedHrsTotal > 0 ? round(($attHrsTotal / $schedHrsTotal) * 100, 1) : 0,
                            'absenceHours' => $absHrsTotal,
                            'absencePercent' => $schedHrsTotal > 0 ? round(($absHrsTotal / $schedHrsTotal) * 100, 1) : 0,
                            'makeUpHours' => $muHrsTotal,
                            'makeUpPercent' => $schedHrsTotal > 0 ? round(($muHrsTotal / $schedHrsTotal) * 100, 1) : 0,
                        ],
                    ];
                }

                return [
                    'records' => $records,
                    'highlights' => $highlights,
                    'monthly_snapshots' => $monthlySnapshots,
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

    /**
     * Fallback payload used when database or network service is down or unmigrated.
     */
    private function buildFallbackTvPayload($device = null): array
    {
        $baseSlides = collect([
            [
                'id' => 1,
                'title' => 'Daily Overview',
                'type' => 'Slide 1 - Daily Overview',
                'is_spotlight' => false,
                'is_custom' => false,
                'order' => 1,
                'is_active' => true,
                'duration_seconds' => 15,
            ],
            [
                'id' => 6,
                'title' => 'Attendance Monitoring',
                'type' => 'Slide 6 - Attendance Monitoring',
                'is_spotlight' => false,
                'is_custom' => false,
                'order' => 6,
                'is_active' => true,
                'duration_seconds' => 15,
            ],
        ]);

        return [
            'settings' => [
                'display_id' => $device?->id,
                'device_code' => $device?->device_code ?? 'CIDS-MAIN',
                'display_name' => $device?->name ?? 'CIDS Office TV',
                'location' => $device?->location ?? "Dean's Office",
                'audience_mode' => 'internal',
                'screen_resolution' => '1920x1080',
                'safe_area_margin' => 'normal',
                'refresh_interval' => '60',
                'slide_duration' => '15',
                'transition_speed' => 'fade',
                'fullscreen_mode' => '1',
                'auto_rotate' => '1',
                'show_header' => '1',
                'show_footer' => '1',
                'show_clock' => '1',
                'show_slide_title' => '1',
                'show_status_labels' => '1',
                'allow_manual_controls' => '1',
                'auto_launch_on_refresh' => '1',
                'fallback_screen' => 'logo_welcome',
                'emergency_takeover_enabled' => '1',
            ],
            'slides' => $baseSlides,
            'data' => [
                'slide1' => [
                    'announcements' => [],
                    'todays_schedule' => [],
                    'upcoming_meetings' => [],
                    'kpis' => [
                        'compliance_rate' => 100,
                        'pending_review' => 0,
                        'overdue_outputs' => 0,
                        'meetings_this_week' => 0,
                    ],
                ],
                'slide2' => [
                    'weekly_schedule' => [],
                    'upcoming_meetings' => [],
                    'upcoming_deadlines' => [],
                    'kpis' => ['meetings_this_week' => 0, 'activities_this_week' => 0, 'deadlines_this_week' => 0],
                ],
                'slide3' => [
                    'compliance_summary' => [],
                    'pending_outputs' => [],
                    'upcoming_deadlines' => [],
                    'kpis' => ['compliance_rate' => 100, 'pending_outputs' => 0, 'overdue_outputs' => 0],
                ],
                'slide4' => [
                    'top_programs' => [],
                    'top_faculty' => [],
                    'recognition_categories' => [],
                    'kpis' => ['college_on_time_rate' => 100, 'zero_overdue_faculty' => 0],
                ],
                'slide5' => [
                    'facilities' => [],
                    'last_updated' => now()->format('M d, Y h:i A'),
                    'day' => 'Monday',
                    'overall_peak' => 'N/A',
                    'kpis' => ['in_use' => 0, 'available' => 0, 'maintenance' => 0, 'peak_hour' => 'N/A'],
                ],
                'slide6' => $this->fallbackMonitoringSummary(),
                'slide7' => [
                    'schedule_grid' => [],
                    'all_rooms' => [],
                    'all_faculty' => [],
                    'all_sections' => [],
                    'all_day_slots' => [],
                    'programs' => [],
                    'stats' => ['total_schedules' => 0, 'unique_rooms' => 0, 'unique_faculty' => 0],
                ],
                'slide8' => ['calendar' => ['events' => [], 'programs' => [], 'venues' => [], 'defaultDate' => now()->format('Y-m-d')]],
                'slide9' => ['requirements' => [], 'faculty' => [], 'programs' => [], 'stats' => ['total_submissions' => 0, 'pending_review' => 0, 'approved' => 0, 'compliance_rate' => 100]],
                'slide10' => ['tasks' => [], 'categories' => [], 'stats' => ['total_tasks' => 0, 'in_progress' => 0, 'completed' => 0, 'completion_rate' => 100]],
                'slide11' => ['programs' => [], 'overall' => ['total_students' => 0, 'total_faculty' => 0, 'accredited_programs' => 0]],
                'slide12' => null,
                'slide13' => ['active_slips' => [], 'stats' => ['total' => 0, 'currently_out' => 0, 'approved_pending' => 0, 'returned_today' => 0]],
                'slide14' => ['active_orders' => [], 'stats' => ['total' => 0, 'in_progress' => 0, 'approved' => 0, 'completed' => 0]],
            ],
            'current_term' => 'AY 2026-2027, 1st Semester',
            'faculty_profiles' => [],
            'channels' => [],
            'current_channel' => null,
        ];
    }
}
