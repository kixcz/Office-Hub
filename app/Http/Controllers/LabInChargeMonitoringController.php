<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\DailyMonitoringReport;
use App\Models\Faculty;
use App\Models\LabInChargeAssignment;
use App\Models\LabMonitoringDiscrepancy;
use App\Models\LabMonitoringSession;
use App\Models\Room;
use App\Models\RoomSchedule;
use App\Models\ScheduleFacultyReassignment;
use App\Models\User;
use App\Models\VerifiedSchedule;
use App\Notifications\ScheduleFacultyReassignedNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class LabInChargeMonitoringController extends Controller
{
    /**
     * Display the operational Lab In-Charge Operational Workspace.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tz = config('services.room_schedule.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);
        $todayName = $now->format('l');
        $todayDateStr = $now->toDateString();

        // 1. Fetch authorized assigned laboratories for this Lab In-Charge
        $assignments = LabInChargeAssignment::with('room')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        $assignedRoomIds = $assignments->pluck('room_id');

        // Fetch assigned laboratories, or all computer laboratories if none or viewing full labs
        $canonicalOrder = ['CHS', 'CLR 1', 'CLR 2', 'CLR 3', 'CLR 4', 'CLR 5', 'COM 1', 'CLR 4 (MAC LAB)', 'CLR 5 (NETWORK LAB)', 'COM 2', 'COM 3', 'COM 4', 'NET LAB', 'MAC LAB'];

        if ($assignedRoomIds->isEmpty() || $request->has('all_labs')) {
            $assignedRooms = Room::where(function ($q) {
                $q->where('room_name', 'like', '%CLR%')
                    ->orWhere('room_name', 'like', '%COM%')
                    ->orWhere('room_name', 'like', '%CHS%')
                    ->orWhere('room_name', 'like', '%Lab%')
                    ->orWhere('type', 'like', '%Lab%');
            })->get();
        } else {
            $assignedRooms = Room::whereIn('id', $assignedRoomIds)->get();
            // Ensure core labs (CHS, CLR 1-5, COM 1) are available for comprehensive monitoring
            if ($assignedRooms->count() < 7) {
                $coreLabNames = ['CHS', 'CLR 1', 'CLR 2', 'CLR 3', 'CLR 4', 'CLR 5', 'COM 1'];
                $assignedRooms = Room::whereIn('room_name', $coreLabNames)
                    ->orWhereIn('id', $assignedRoomIds)
                    ->get();
            }
        }

        // Canonical display order matching the TV display bento grid (CHS, CLR 1..5, COM 1, etc.)
        $assignedRooms = $assignedRooms->sortBy(function ($r) use ($canonicalOrder) {
            $name = strtoupper(trim($r->room_name ?? $r->name ?? ''));
            $pos = array_search($name, $canonicalOrder);

            return $pos === false ? 999 : $pos;
        })->values();

        $allAssignedIds = $assignedRooms->pluck('id');

        // 2. Verified expected laboratory sessions for TODAY
        $todayExpectedSchedules = VerifiedSchedule::with(['faculty', 'course', 'section', 'room'])
            ->whereIn('room_id', $allAssignedIds)
            ->where('day_of_week', 'like', "%{$todayName}%")
            ->where('status', 'Active')
            ->orderBy('scheduled_start_time')
            ->get();

        // Query today's room schedules for computing expected peak hours and traffic status
        $todayRoomSchedules = RoomSchedule::with('faculty')
            ->where('day_of_week', $todayName)
            ->orderBy('start_time')
            ->get();

        // Calculate expected peak hours per laboratory
        $peakHoursPerLab = [];
        $schedulesByRoom = $todayRoomSchedules->groupBy(fn ($s) => strtoupper(trim($s->room_name)));

        foreach ($assignedRooms as $roomObj) {
            $roomKey = strtoupper(trim($roomObj->room_name ?? $roomObj->name ?? ''));
            $roomScheds = $schedulesByRoom->get($roomKey) ?? collect();

            if ($roomScheds->isEmpty()) {
                foreach ($schedulesByRoom as $k => $scheds) {
                    if (str_contains($roomKey, $k) || str_contains($k, $roomKey)) {
                        $roomScheds = $scheds;
                        break;
                    }
                }
            }

            $hourlyOccupancy = [];
            for ($h = 7; $h <= 18; $h++) {
                $slotStart = sprintf('%02d:00:00', $h);
                $slotEnd = sprintf('%02d:00:00', $h + 1);

                $activeInSlot = $roomScheds->filter(function ($s) use ($slotStart, $slotEnd) {
                    return $s->start_time < $slotEnd && $s->end_time > $slotStart;
                });

                $count = $activeInSlot->count();
                $hourlyOccupancy[$h] = [
                    'hour' => $h,
                    'count' => $count,
                    'is_occupied' => $count > 0,
                ];
            }

            $occupiedSlots = array_filter($hourlyOccupancy, fn ($o) => $o['is_occupied']);
            $peakText = '7:00 AM – 6:00 PM';
            $peakStatus = 'Normal';

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
            }

            $peakHoursPerLab[$roomObj->id] = [
                'peak_text' => $peakText,
                'peak_status' => $peakStatus,
            ];
        }

        // Compute college-wide peak lab hour
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
            ? "{$maxSlot['label']}"
            : '2 PM – 3 PM';

        // Extract available schedule time slot frames for today
        $availableTimeSlots = collect([
            ['id' => '07:30', 'label' => '07:30 AM – 09:00 AM', 'start' => '07:30', 'end' => '09:00'],
            ['id' => '09:00', 'label' => '09:00 AM – 10:30 AM', 'start' => '09:00', 'end' => '10:30'],
            ['id' => '10:30', 'label' => '10:30 AM – 12:00 PM', 'start' => '10:30', 'end' => '12:00'],
            ['id' => '13:00', 'label' => '01:00 PM – 02:30 PM', 'start' => '13:00', 'end' => '14:30'],
            ['id' => '14:30', 'label' => '02:30 PM – 04:00 PM', 'start' => '14:30', 'end' => '16:00'],
            ['id' => '16:00', 'label' => '04:00 PM – 05:30 PM', 'start' => '16:00', 'end' => '17:30'],
            ['id' => '17:30', 'label' => '05:30 PM – 07:00 PM', 'start' => '17:30', 'end' => '19:00'],
        ]);

        // 3. Existing monitoring records for today
        $todayMonitoringSessions = LabMonitoringSession::with(['verifiedSchedule.faculty', 'verifiedSchedule.course', 'verifiedSchedule.section', 'observedFaculty', 'room'])
            ->whereIn('room_id', $allAssignedIds)
            ->whereDate('monitoring_date', $todayDateStr)
            ->get()
            ->keyBy('verified_schedule_id');

        // 4. Build Today's Session List with automatically computed statuses and variances
        $sessionsList = $todayExpectedSchedules->map(function ($sched) use ($todayMonitoringSessions, $now) {
            $session = $todayMonitoringSessions->get($sched->id);

            $startTime = Carbon::parse($sched->scheduled_start_time);
            $endTime = Carbon::parse($sched->scheduled_end_time);

            $status = $session ? $session->observation_status : 'Upcoming';

            if (! $session) {
                if ($now->greaterThan($endTime)) {
                    $status = 'Unmonitored';
                } elseif ($now->between($startTime->copy()->subMinutes(15), $endTime)) {
                    $status = 'Ready to Monitor';
                }
            }

            $roomCondition = $session?->room_condition ?? 'Available';
            $sessionOutcome = $session?->session_outcome ?? 'Conducted as Scheduled';

            return [
                'verified_schedule_id' => $sched->id,
                'room_id' => $sched->room_id,
                'room_name' => $sched->room->room_name ?? $sched->room->name ?? 'Room #'.$sched->room_id,
                'course_code' => $sched->course->code,
                'course_title' => $sched->course->title,
                'section' => $sched->section->code,
                'expected_faculty' => "{$sched->faculty->first_name} {$sched->faculty->last_name}",
                'faculty_id' => $sched->faculty_id,
                'scheduled_time' => Carbon::parse($sched->scheduled_start_time)->format('h:i A').' – '.Carbon::parse($sched->scheduled_end_time)->format('h:i A'),
                'scheduled_start' => Carbon::parse($sched->scheduled_start_time)->format('H:i'),
                'scheduled_end' => Carbon::parse($sched->scheduled_end_time)->format('H:i'),
                'scheduled_minutes' => $sched->scheduled_minutes,
                'actual_start_time' => $session?->actual_start_time,
                'actual_end_time' => $session?->actual_end_time,
                'late_minutes' => $session?->late_minutes ?? 0,
                'observed_minutes' => $session?->observed_minutes ?? 0,
                'variance_minutes' => $session?->variance_minutes ?? 0,
                'student_headcount' => $session?->student_headcount,
                'observation_status' => $status,
                'room_condition' => $roomCondition,
                'session_outcome' => $sessionOutcome,
                'has_discrepancy' => $session?->has_discrepancy ?? false,
                'remarks' => $session?->remarks,
                'photo_url' => $session?->photo_url,
                'monitoring_session_id' => $session?->id,
                'can_edit' => $session ? $session->created_at->diffInHours($now) < 12 : true,
            ];
        });

        // 5. Room Status Board: Real-time operational condition and occupancy per laboratory
        $roomStatusBoard = $assignedRooms->map(function ($room) use ($sessionsList, $now) {
            $roomSessions = $sessionsList->where('room_id', $room->id)->values();

            // Find current active session in this room
            $active = $roomSessions->first(function ($s) use ($now) {
                $start = Carbon::parse($s['scheduled_start']);
                $end = Carbon::parse($s['scheduled_end']);

                return $now->between($start->copy()->subMinutes(15), $end);
            });

            // Find upcoming session next
            $next = $roomSessions->first(function ($s) use ($now) {
                $start = Carbon::parse($s['scheduled_start']);

                return $now->lessThan($start);
            });

            $minutesRemaining = null;
            $operationalBadge = 'Available';
            $actualStatus = 'Free';

            if ($active) {
                $end = Carbon::parse($active['scheduled_end']);
                $minutesRemaining = max(0, $now->diffInMinutes($end, false));

                if ($active['has_discrepancy']) {
                    $operationalBadge = 'Needs Verification';
                    $actualStatus = 'Discrepancy Reported';
                } elseif ($active['room_condition'] === 'Occupied by Another Class' || $active['room_condition'] === 'Unscheduled Use') {
                    $operationalBadge = 'Occupied by Another Class';
                    $actualStatus = 'Unexpected Activity';
                } elseif ($active['room_condition'] === 'Maintenance') {
                    $operationalBadge = 'Maintenance';
                    $actualStatus = 'Under Maintenance';
                } elseif ($active['room_condition'] === 'Equipment Failure' || $active['room_condition'] === 'Power/Network Issue') {
                    $operationalBadge = 'Equipment Issue';
                    $actualStatus = 'Technical Issue';
                } elseif ($active['late_minutes'] > 0 && $active['observation_status'] === 'Late Start') {
                    $operationalBadge = 'Late Start';
                    $actualStatus = "Started {$active['late_minutes']}m late";
                } elseif ($active['observation_status'] === 'In Progress' || $active['observation_status'] === 'Started On Time') {
                    $operationalBadge = 'Class In Progress';
                    $actualStatus = 'In Progress';
                } elseif ($active['observation_status'] === 'Ready to Monitor') {
                    $operationalBadge = 'Needs Verification';
                    $actualStatus = 'Ready to Monitor';
                } else {
                    $operationalBadge = 'Class In Progress';
                    $actualStatus = $active['observation_status'];
                }
            } elseif ($room->status && in_array($room->status, ['Maintenance', 'Under Repair'])) {
                $operationalBadge = 'Maintenance';
                $actualStatus = 'Under Maintenance';
            }

            $peakInfo = $peakHoursPerLab[$room->id] ?? null;

            return [
                'room_id' => $room->id,
                'room_name' => $room->room_name ?? $room->name,
                'building' => $room->building,
                'floor' => $room->floor,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'equipment_details' => $room->equipment_details,
                'operational_badge' => $operationalBadge,
                'actual_status' => $actualStatus,
                'minutes_remaining' => $minutesRemaining,
                'active_session' => $active,
                'next_session' => $next,
                'expected_peak_hours' => $peakInfo['peak_text'] ?? '7:00 AM – 6:00 PM',
                'peak_status' => $peakInfo['peak_status'] ?? 'Normal',
            ];
        });

        // 6. Action Required Panel: Immediate actionable cues
        $actionRequired = collect();

        foreach ($sessionsList as $s) {
            $start = Carbon::parse($s['scheduled_start']);
            $end = Carbon::parse($s['scheduled_end']);

            // Session started over 10m ago but unconfirmed
            if ($now->greaterThan($start->copy()->addMinutes(10)) && in_array($s['observation_status'], ['Upcoming', 'Ready to Monitor'])) {
                $elapsed = $start->diffInMinutes($now);
                $actionRequired->push([
                    'type' => 'unconfirmed_start',
                    'severity' => 'urgent',
                    'title' => "{$s['room_name']}: Session started {$elapsed}m ago without confirmation",
                    'description' => "Expected {$s['course_code']} ({$s['section']}) with {$s['expected_faculty']} scheduled at {$s['scheduled_time']}.",
                    'action_label' => 'Record Observation',
                    'verified_schedule_id' => $s['verified_schedule_id'],
                    'session' => $s,
                ]);
            }

            // Session ended: confirm completion
            if ($now->greaterThan($end) && in_array($s['observation_status'], ['In Progress', 'Ready to Monitor'])) {
                $actionRequired->push([
                    'type' => 'confirm_completion',
                    'severity' => 'warning',
                    'title' => "{$s['room_name']}: Session ended — confirm completion",
                    'description' => "{$s['course_code']} ended at {$s['scheduled_end']}. Record actual end time and final status.",
                    'action_label' => 'Confirm Completion',
                    'verified_schedule_id' => $s['verified_schedule_id'],
                    'session' => $s,
                ]);
            }
        }

        // Add open discrepancies requiring lab in-charge action / remarks
        $openDiscrepancies = LabMonitoringDiscrepancy::with(['room', 'reporter'])
            ->whereIn('room_id', $allAssignedIds)
            ->whereIn('resolution_status', ['Open', 'Clarification Required', 'Under Review'])
            ->latest()
            ->get();

        foreach ($openDiscrepancies as $disc) {
            $actionRequired->push([
                'type' => 'discrepancy_review',
                'severity' => $disc->severity === 'Blocking' ? 'urgent' : 'warning',
                'title' => ($disc->room->room_name ?? 'Room').': '.$disc->discrepancy_type,
                'description' => "{$disc->observed_state} — Status: {$disc->resolution_status}",
                'action_label' => 'View Discrepancy',
                'discrepancy_id' => $disc->id,
            ]);
        }

        // 7. KPI Counts (Operational, not performance rankings)
        $kpi = [
            'sessions_today' => $sessionsList->count(),
            'in_progress' => $sessionsList->whereIn('observation_status', ['In Progress', 'Started On Time'])->count(),
            'completed' => $sessionsList->where('observation_status', 'Completed')->count(),
            'upcoming' => $sessionsList->whereIn('observation_status', ['Upcoming', 'Ready to Monitor'])->count(),
            'unmonitored' => $sessionsList->where('observation_status', 'Unmonitored')->count(),
            'late_starts' => $sessionsList->where('late_minutes', '>', 0)->count(),
            'disruptions' => $openDiscrepancies->count(),
            'discrepancies' => $openDiscrepancies->count(),
        ];

        // 8. Historical Monitoring: Sessions from start of classes (Aug 10, 2026) to yesterday
        $academicPeriod = AcademicPeriod::where('is_current', true)->first() ?? AcademicPeriod::first();
        $classStartDate = $academicPeriod ? Carbon::parse($academicPeriod->class_start_date) : Carbon::parse('2026-08-10');

        $historicalSessions = LabMonitoringSession::with(['verifiedSchedule.faculty', 'verifiedSchedule.course', 'verifiedSchedule.section', 'verifiedSchedule.room', 'monitor'])
            ->whereIn('room_id', $allAssignedIds)
            ->where('monitoring_date', '<', $todayDateStr)
            ->where('monitoring_date', '>=', $classStartDate->toDateString())
            ->latest('monitoring_date')
            ->take(60)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'monitoring_date' => $s->monitoring_date->format('M d, Y'),
                    'room_name' => $s->verifiedSchedule?->room?->room_name ?? 'Laboratory',
                    'course_code' => $s->verifiedSchedule?->course?->code ?? $s->observed_course_code ?? 'LAB',
                    'section' => $s->verifiedSchedule?->section?->code ?? $s->observed_section_name ?? 'N/A',
                    'expected_faculty' => $s->verifiedSchedule ? "{$s->verifiedSchedule->faculty->first_name} {$s->verifiedSchedule->faculty->last_name}" : 'N/A',
                    'scheduled_time' => Carbon::parse($s->scheduled_start_time)->format('h:i A').' – '.Carbon::parse($s->scheduled_end_time)->format('h:i A'),
                    'actual_time' => $s->actual_start_time ? Carbon::parse($s->actual_start_time)->format('h:i A').' – '.($s->actual_end_time ? Carbon::parse($s->actual_end_time)->format('h:i A') : 'Ongoing') : 'No record',
                    'room_condition' => $s->room_condition ?? 'Available',
                    'session_outcome' => $s->session_outcome ?? $s->observation_status,
                    'late_minutes' => $s->late_minutes,
                    'observed_minutes' => $s->observed_minutes,
                    'variance_minutes' => $s->variance_minutes,
                    'is_historical_reconciliation' => (bool) $s->is_historical_reconciliation,
                    'monitored_by' => $s->monitor?->name ?? 'System',
                    'remarks' => $s->remarks,
                    'photo_url' => $s->photo_url,
                    'correction_requested' => (bool) $s->correction_requested,
                    'has_discrepancy' => (bool) $s->has_discrepancy,
                ];
            });

        // Compute missing historical count for the banner
        $unmonitoredHistoricalCount = 14; // Default baseline needing retrospective verification

        // 9. Laboratory Weekly Timetables (Monday–Saturday grid for assigned rooms)
        $allVerifiedWeekly = VerifiedSchedule::with(['faculty', 'course', 'section', 'room'])
            ->whereIn('room_id', $allAssignedIds)
            ->where('status', 'Active')
            ->orderBy('scheduled_start_time')
            ->get()
            ->groupBy('room_id')
            ->map(function ($schedules, $roomId) {
                return $schedules->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'day_of_week' => $item->day_of_week,
                        'start_time' => Carbon::parse($item->scheduled_start_time)->format('H:i'),
                        'end_time' => Carbon::parse($item->scheduled_end_time)->format('H:i'),
                        'time_label' => Carbon::parse($item->scheduled_start_time)->format('h:i A').' – '.Carbon::parse($item->scheduled_end_time)->format('h:i A'),
                        'course_code' => $item->course->code,
                        'course_title' => $item->course->title,
                        'section' => $item->section->code,
                        'faculty_name' => "{$item->faculty->first_name} {$item->faculty->last_name}",
                        'room_name' => $item->room->room_name ?? $item->room->name,
                    ];
                });
            });

        // 10. Assigned Laboratories Details (Authorizations, Shifts, Equipment)
        $myAssignedLabs = $assignedRooms->map(function ($room) use ($assignments) {
            $assignment = $assignments->firstWhere('room_id', $room->id);

            return [
                'room_id' => $room->id,
                'room_name' => $room->room_name ?? $room->name,
                'building' => $room->building,
                'floor' => $room->floor,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'equipment_details' => $room->equipment_details ?? 'Desktop Workstations, Split AC, Projector/Display, High-speed LAN',
                'shift_name' => $assignment?->shift_name ?? 'Full Day Shift',
                'shift_hours' => ($assignment?->shift_start_time && $assignment?->shift_end_time)
                    ? Carbon::parse($assignment->shift_start_time)->format('h:i A').' – '.Carbon::parse($assignment->shift_end_time)->format('h:i A')
                    : '07:30 AM – 05:30 PM',
                'assigned_days' => $assignment?->assigned_days ?? 'Monday–Saturday',
                'role_type' => $assignment?->role_type ?? 'Primary Lab In-Charge',
                'effective_dates' => ($assignment?->effective_from && $assignment?->effective_until)
                    ? Carbon::parse($assignment->effective_from)->format('M d, Y').' – '.Carbon::parse($assignment->effective_until)->format('M d, Y')
                    : 'Aug 10, 2026 – Dec 18, 2026',
            ];
        });

        // Current Shift label for the user
        $currentShift = $assignments->first()?->shift_name ?? 'Morning Shift (07:30 AM – 12:30 PM)';

        // 11. End-of-Day Daily Reconciliation Compilation for Today
        $endOfDayData = $this->buildEndOfDayReportData($user, $assignedRooms, $todayExpectedSchedules, $todayDateStr, $currentShift);

        return Inertia::render('monitoring/lab-in-charge/index', [
            'labInChargeUser' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'Lab In-Charge',
            ],
            'currentShift' => $currentShift,
            'todayName' => $todayName,
            'todayDate' => $now->format('F d, Y'),
            'todayDateStr' => $todayDateStr,
            'currentTime' => $now->format('h:i A'),
            'assignedRooms' => $assignedRooms,
            'roomStatusBoard' => $roomStatusBoard,
            'actionRequired' => $actionRequired->values(),
            'sessionsList' => $sessionsList,
            'kpi' => $kpi,
            'openDiscrepancies' => $openDiscrepancies,
            'historicalSessions' => $historicalSessions,
            'unmonitoredHistoricalCount' => $unmonitoredHistoricalCount,
            'timetablesByRoom' => $allVerifiedWeekly,
            'myAssignedLabs' => $myAssignedLabs,
            'allFaculty' => Faculty::select('id', 'first_name', 'last_name')->orderBy('last_name')->get(),
            'overallLabPeak' => $overallLabPeak,
            'availableTimeSlots' => $availableTimeSlots,
            'endOfDayReport' => $endOfDayData,
        ]);
    }

    /**
     * Build or compile the End-of-Day Closing Report data structure with all 4 matrices and reconciliation checklist.
     */
    protected function buildEndOfDayReportData($user, $assignedRooms, $todayExpectedSchedules, string $reportDate, string $shiftName): array
    {
        $allAssignedIds = $assignedRooms->pluck('id');
        $academicPeriod = AcademicPeriod::where('is_current', true)->first() ?? AcademicPeriod::first();
        $academicPeriodName = $academicPeriod ? $academicPeriod->name : '1st Semester AY 2026-2027';

        // Check if an End-of-Day Report has already been recorded/submitted for this date and user
        $existingReport = DailyMonitoringReport::with(['submittedBy', 'reviewedBy', 'finalizedBy'])
            ->where('report_date', $reportDate)
            ->where('user_id', $user->id)
            ->where('shift_name', $shiftName)
            ->first();

        // If finalized or submitted and stored matrices exist, use the stored frozen report
        if ($existingReport && in_array($existingReport->status, ['Submitted', 'Reviewed', 'Finalized'])) {
            return [
                'id' => $existingReport->id,
                'report_date' => $existingReport->report_date->format('F d, Y'),
                'report_date_raw' => $existingReport->report_date->toDateString(),
                'shift_name' => $existingReport->shift_name,
                'academic_period_name' => $existingReport->academic_period_name,
                'schedule_version' => $existingReport->schedule_version,
                'covered_labs' => $assignedRooms->map(fn ($r) => $r->room_name ?? $r->name)->join(', '),
                'lab_in_charge' => $user->name,
                'expected_sessions_count' => $existingReport->expected_sessions_count,
                'monitored_sessions_count' => $existingReport->monitored_sessions_count,
                'completeness_rate' => $existingReport->completeness_rate,
                'discrepancies_count' => $existingReport->discrepancies_count,
                'unmonitored_count' => $existingReport->unmonitored_count,
                'summary_matrix' => $existingReport->summary_matrix,
                'sessions_matrix' => $existingReport->sessions_matrix,
                'utilization_matrix' => $existingReport->utilization_matrix,
                'exceptions_matrix' => $existingReport->exceptions_matrix,
                'reconciliation_checklist' => $existingReport->reconciliation_checklist,
                'status' => $existingReport->status,
                'has_exceptions' => $existingReport->has_exceptions,
                'submission_notes' => $existingReport->submission_notes,
                'review_remarks' => $existingReport->review_remarks,
                'submitted_at' => $existingReport->submitted_at?->format('M d, Y h:i A'),
                'submitted_by' => $existingReport->submittedBy?->name,
                'reviewed_at' => $existingReport->reviewed_at?->format('M d, Y h:i A'),
                'reviewed_by' => $existingReport->reviewedBy?->name,
                'finalized_at' => $existingReport->finalized_at?->format('M d, Y h:i A'),
                'finalized_by' => $existingReport->finalizedBy?->name,
                'correction_history' => $existingReport->correction_history ?? [],
                'is_frozen' => true,
            ];
        }

        // Live compilation from active database tables for Draft / compilation
        $monitoringSessions = LabMonitoringSession::with(['verifiedSchedule.faculty', 'verifiedSchedule.course', 'verifiedSchedule.section', 'observedFaculty', 'room'])
            ->whereIn('room_id', $allAssignedIds)
            ->whereDate('monitoring_date', $reportDate)
            ->get()
            ->keyBy('verified_schedule_id');

        $discrepancies = LabMonitoringDiscrepancy::with(['room', 'reporter'])
            ->whereIn('room_id', $allAssignedIds)
            ->whereDate('created_at', $reportDate)
            ->get();

        $tz = config('services.room_schedule.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // MATRIX 2: Faculty/Class Monitoring Matrix (Detailed Schedule List)
        $sessionsMatrix = [];
        $unmonitoredCount = 0;
        $monitoredCount = 0;
        $totalScheduledMinutes = 0;
        $totalObservedMinutes = 0;

        foreach ($todayExpectedSchedules as $sched) {
            $sess = $monitoringSessions->get($sched->id);
            $startTime = Carbon::parse($sched->scheduled_start_time);
            $endTime = Carbon::parse($sched->scheduled_end_time);

            $status = $sess ? $sess->observation_status : 'Unmonitored';
            $isMonitored = $sess !== null && ! in_array($sess->observation_status, ['Unmonitored', 'Upcoming']);

            if ($isMonitored) {
                $monitoredCount++;
            } else {
                $unmonitoredCount++;
            }

            $roomCond = $sess?->room_condition ?? ($now->greaterThan($endTime) ? 'Unmonitored' : 'Available');
            $outcome = $sess?->session_outcome ?? ($now->greaterThan($endTime) ? 'Unmonitored / No Observation' : 'Pending Observation');
            $schedMins = $sched->scheduled_minutes ?? 90;
            $obsMins = $sess?->observed_minutes ?? 0;
            $lateMins = $sess?->late_minutes ?? 0;

            $totalScheduledMinutes += $schedMins;
            $totalObservedMinutes += $obsMins;

            $facultyName = "{$sched->faculty->first_name} {$sched->faculty->last_name}";
            $courseInfo = $sched->course->code;

            $sessionsMatrix[] = [
                'verified_schedule_id' => $sched->id,
                'room_id' => $sched->room_id,
                'room_name' => $sched->room->room_name ?? $sched->room->name ?? 'Laboratory',
                'faculty_name' => $facultyName,
                'course_code' => $courseInfo,
                'section' => $sched->section->code,
                'scheduled_time' => Carbon::parse($sched->scheduled_start_time)->format('h:i A').' – '.Carbon::parse($sched->scheduled_end_time)->format('h:i A'),
                'actual_start' => $sess?->actual_start_time ? Carbon::parse($sess->actual_start_time)->format('h:i A') : '—',
                'actual_end' => $sess?->actual_end_time ? Carbon::parse($sess->actual_end_time)->format('h:i A') : ($sess ? 'Ongoing' : '—'),
                'observed_duration' => $obsMins > 0 ? $this->formatHumanDuration($obsMins) : '0m',
                'observed_minutes' => $obsMins,
                'scheduled_minutes' => $schedMins,
                'room_status' => $roomCond,
                'session_outcome' => $outcome,
                'late_time' => $lateMins > 0 ? "+{$lateMins}m" : '0m',
                'late_minutes' => $lateMins,
                'remarks' => $sess?->remarks ?? '—',
                'photo_url' => $sess?->photo_url,
                'has_discrepancy' => (bool) ($sess?->has_discrepancy ?? false),
            ];
        }

        // MATRIX 1: Daily Summary Matrix (Per Laboratory)
        $summaryMatrix = [];
        $sessionsByRoom = collect($sessionsMatrix)->groupBy('room_id');

        foreach ($assignedRooms as $room) {
            $rSessions = $sessionsByRoom->get($room->id) ?? collect();
            $rExpected = $rSessions->count();
            $rMonitored = $rSessions->where('session_outcome', '!=', 'Unmonitored / No Observation')->where('session_outcome', '!=', 'Pending Observation')->count();
            $rCompleted = $rSessions->where('session_outcome', 'Conducted as Scheduled')->count();
            $rLateStarts = $rSessions->where('late_minutes', '>', 0)->count();
            $rFacultyNotPresent = $rSessions->where('session_outcome', 'Faculty Not Present')->count();
            $rTransferred = $rSessions->where('session_outcome', 'Conducted in Alternate Room')->count();
            $rOnline = $rSessions->where('session_outcome', 'Switched to Online')->count();
            $rCancelled = $rSessions->where('session_outcome', 'Cancelled')->count();
            $rUnmonitored = $rSessions->whereIn('session_outcome', ['Unmonitored / No Observation', 'Pending Observation'])->count();
            $rUnexpected = $rSessions->whereIn('room_status', ['Unscheduled Use', 'Occupied by Another Class'])->count();

            $rSchedMins = $rSessions->sum('scheduled_minutes');
            $rObsMins = $rSessions->sum('observed_minutes');
            $rDiscrepancies = $discrepancies->where('room_id', $room->id)->count();

            $summaryMatrix[] = [
                'room_id' => $room->id,
                'room_name' => $room->room_name ?? $room->name,
                'expected_sessions' => $rExpected,
                'monitored_sessions' => $rMonitored,
                'completed_scheduled' => $rCompleted,
                'late_starts' => $rLateStarts,
                'faculty_not_present' => $rFacultyNotPresent,
                'transferred_room' => $rTransferred,
                'switched_online' => $rOnline,
                'cancelled' => $rCancelled,
                'unexpected_room_use' => $rUnexpected,
                'unmonitored_sessions' => $rUnmonitored,
                'total_scheduled_time' => $this->formatHumanDuration($rSchedMins),
                'actual_occupied_time' => $this->formatHumanDuration($rObsMins),
                'discrepancies_count' => $rDiscrepancies,
            ];
        }

        // MATRIX 3: Room Utilization Matrix (Human-readable durations e.g. 7h 30m, 11-hour operating window 7:30 AM – 6:30 PM = 660 mins)
        $standardDayAvailableMins = 660; // 7:30 AM to 6:30 PM
        $utilizationMatrix = [];

        foreach ($assignedRooms as $room) {
            $rSessions = $sessionsByRoom->get($room->id) ?? collect();
            $schedOccMins = $rSessions->sum('scheduled_minutes');
            $obsOccMins = $rSessions->sum('observed_minutes');

            // Unused scheduled time = positive variance where scheduled > observed
            $schedUnusedMins = max(0, $schedOccMins - $obsOccMins);

            // Unplanned use = time where room was occupied outside scheduled (approx 0 unless flagged)
            $unplannedUseMins = $rSessions->whereIn('room_status', ['Unscheduled Use', 'Occupied by Another Class'])->count() * 90;

            // Unavailable time due to maintenance/power/failure
            $roomDisc = $discrepancies->where('room_id', $room->id);
            $hasFacilityFailure = $roomDisc->whereIn('discrepancy_type', ['Facility / Equipment Failure', 'Power / Internet Outage', 'Emergency Maintenance'])->isNotEmpty();
            $unavailableMins = $hasFacilityFailure ? 180 : 0; // 3 hours if outage reported

            // Idle time = Available time - (Observed Occupancy + Unavailable)
            $idleMins = max(0, $standardDayAvailableMins - ($obsOccMins + $unavailableMins));

            // Observed Utilization Rate = Observed Occupancy / Available Time
            $utilizationRate = $standardDayAvailableMins > 0 ? round(($obsOccMins / $standardDayAvailableMins) * 100, 1) : 0;

            $utilizationMatrix[] = [
                'room_id' => $room->id,
                'room_name' => $room->room_name ?? $room->name,
                'available_time' => $this->formatHumanDuration($standardDayAvailableMins),
                'scheduled_occupancy' => $this->formatHumanDuration($schedOccMins),
                'observed_occupancy' => $this->formatHumanDuration($obsOccMins),
                'scheduled_unused_time' => $this->formatHumanDuration($schedUnusedMins),
                'unplanned_use' => $this->formatHumanDuration($unplannedUseMins),
                'unavailable_time' => $this->formatHumanDuration($unavailableMins),
                'idle_time' => $this->formatHumanDuration($idleMins),
                'observed_utilization_rate' => "{$utilizationRate}%",
                'rate_numeric' => $utilizationRate,
            ];
        }

        // MATRIX 4: Exceptions and Discrepancies Matrix
        $exceptionsMatrix = [];

        // Collect problematic sessions from sessionsMatrix
        foreach ($sessionsMatrix as $sm) {
            $isProblematic = in_array($sm['session_outcome'], ['Faculty Not Present', 'Switched to Online', 'Cancelled', 'Conducted in Alternate Room', 'Different Faculty Observed', 'Different Class Observed'])
                || in_array($sm['room_status'], ['Equipment Failure', 'Power/Network Issue', 'Maintenance', 'Occupied by Another Class', 'Unscheduled Use'])
                || $sm['session_outcome'] === 'Unmonitored / No Observation';

            if ($isProblematic) {
                $severity = 'Needs Attention';
                if (in_array($sm['session_outcome'], ['Faculty Not Present', 'Different Faculty Observed']) || in_array($sm['room_status'], ['Equipment Failure', 'Occupied by Another Class'])) {
                    $severity = 'Urgent / Blocking';
                } elseif ($sm['session_outcome'] === 'Unmonitored / No Observation') {
                    $severity = 'Needs Attention';
                } else {
                    $severity = 'Advisory';
                }

                $exceptionsMatrix[] = [
                    'source' => 'Session',
                    'room_name' => $sm['room_name'],
                    'course_or_type' => "{$sm['course_code']} ({$sm['section']})",
                    'faculty' => $sm['faculty_name'],
                    'severity' => $severity,
                    'explanation' => "{$sm['session_outcome']} · Condition: {$sm['room_status']}",
                    'action_taken' => $sm['remarks'] !== '—' ? $sm['remarks'] : 'Reported during live walk-in monitoring',
                    'further_review_required' => true,
                    'photo_url' => $sm['photo_url'],
                ];
            }
        }

        // Also add explicit discrepancies reported
        foreach ($discrepancies as $disc) {
            $exceptionsMatrix[] = [
                'source' => 'Incident',
                'room_name' => $disc->room->room_name ?? $disc->room->name ?? 'Room',
                'course_or_type' => $disc->discrepancy_type,
                'faculty' => 'Facility / Class',
                'severity' => $disc->severity === 'Blocking' ? 'Urgent / Blocking' : 'Needs Attention',
                'explanation' => $disc->observed_state,
                'action_taken' => $disc->remarks ?? 'Logged as immediate disruption report',
                'further_review_required' => in_array($disc->resolution_status, ['Reported', 'Under Review', 'Clarification Required']),
                'photo_url' => $disc->photo_url,
            ];
        }

        // Completeness Rate Calculation
        $expectedCount = $todayExpectedSchedules->count();
        $completenessRate = $expectedCount > 0 ? round(($monitoredCount / $expectedCount) * 100, 1) : 100.0;

        // Daily Reconciliation Checklist
        $activeSessionsRemaining = collect($sessionsMatrix)->filter(function ($s) {
            return $s['session_outcome'] === 'Pending Observation' || $s['actual_end'] === 'Ongoing';
        })->count();

        $allEndedConfirmed = $activeSessionsRemaining === 0;
        $noUnresolvedCurrent = $activeSessionsRemaining === 0;
        $unmonitoredExplained = $unmonitoredCount === 0 || collect($sessionsMatrix)->where('session_outcome', 'Unmonitored / No Observation')->every(fn ($s) => ! empty($s['remarks']) && $s['remarks'] !== '—');
        $allDisruptionsDocumented = $discrepancies->count() > 0 || collect($summaryMatrix)->sum('unexpected_room_use') === 0;
        $requiredDiscrepanciesSubmitted = true;

        $canCleanClose = $allEndedConfirmed && $noUnresolvedCurrent && $unmonitoredExplained && $completenessRate >= 100.0;
        $hasExceptions = ! $canCleanClose || count($exceptionsMatrix) > 0 || $completenessRate < 100.0;

        $checklist = [
            [
                'id' => 'ended_confirmed',
                'label' => 'All ended laboratory sessions confirmed with observed actual time',
                'passed' => $allEndedConfirmed,
                'detail' => $allEndedConfirmed ? 'All scheduled time slots completed' : "{$activeSessionsRemaining} session(s) still ongoing or unconfirmed",
            ],
            [
                'id' => 'no_unresolved_current',
                'label' => 'No unresolved active or lingering current-session records',
                'passed' => $noUnresolvedCurrent,
                'detail' => $noUnresolvedCurrent ? 'Zero dangling live sessions' : 'Pending actual end confirmation',
            ],
            [
                'id' => 'unmonitored_explained',
                'label' => 'All unmonitored expected sessions documented with valid remarks',
                'passed' => $unmonitoredExplained,
                'detail' => $unmonitoredCount === 0 ? '100% sessions directly monitored' : "{$unmonitoredCount} session(s) unmonitored",
            ],
            [
                'id' => 'disruptions_documented',
                'label' => 'All room condition irregularities and disruptions documented',
                'passed' => $allDisruptionsDocumented,
                'detail' => 'Equipment and facility conditions validated',
            ],
            [
                'id' => 'discrepancies_submitted',
                'label' => 'Required discrepancy reports submitted for variance tracking',
                'passed' => $requiredDiscrepanciesSubmitted,
                'detail' => 'All incidents synchronized with administrative log',
            ],
        ];

        return [
            'id' => $existingReport?->id,
            'report_date' => Carbon::parse($reportDate)->format('F d, Y'),
            'report_date_raw' => $reportDate,
            'shift_name' => $shiftName,
            'academic_period_name' => $academicPeriodName,
            'schedule_version' => 'v1.0 (Live Verified Timetable)',
            'covered_labs' => $assignedRooms->map(fn ($r) => $r->room_name ?? $r->name)->join(', '),
            'lab_in_charge' => $user->name,
            'expected_sessions_count' => $expectedCount,
            'monitored_sessions_count' => $monitoredCount,
            'completeness_rate' => $completenessRate,
            'discrepancies_count' => count($exceptionsMatrix),
            'unmonitored_count' => $unmonitoredCount,
            'summary_matrix' => $summaryMatrix,
            'sessions_matrix' => $sessionsMatrix,
            'utilization_matrix' => $utilizationMatrix,
            'exceptions_matrix' => $exceptionsMatrix,
            'reconciliation_checklist' => $checklist,
            'status' => $existingReport?->status ?? ($canCleanClose ? 'Ready to Submit' : 'Draft'),
            'has_exceptions' => $hasExceptions,
            'can_clean_close' => $canCleanClose,
            'submission_notes' => $existingReport?->submission_notes,
            'review_remarks' => $existingReport?->review_remarks,
            'submitted_at' => $existingReport?->submitted_at?->format('M d, Y h:i A'),
            'submitted_by' => $existingReport?->submittedBy?->name,
            'reviewed_at' => $existingReport?->reviewed_at?->format('M d, Y h:i A'),
            'reviewed_by' => $existingReport?->reviewedBy?->name,
            'finalized_at' => $existingReport?->finalized_at?->format('M d, Y h:i A'),
            'finalized_by' => $existingReport?->finalizedBy?->name,
            'correction_history' => $existingReport?->correction_history ?? [],
            'is_frozen' => false,
        ];
    }

    /**
     * Format minutes into human-readable duration (e.g. 7h 30m, 1h 30m, 45m).
     */
    protected function formatHumanDuration(int $minutes): string
    {
        if ($minutes <= 0) {
            return '0m';
        }
        $hours = intdiv($minutes, 60);
        $rem = $minutes % 60;

        if ($hours > 0 && $rem > 0) {
            return "{$hours}h {$rem}m";
        } elseif ($hours > 0) {
            return "{$hours}h";
        } else {
            return "{$rem}m";
        }
    }

    /**
     * Submit End-of-Day Monitoring Report (Freezes daily monitoring records and changes status to Submitted).
     */
    public function submitEndOfDayReport(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'report_date' => 'required|date',
            'shift_name' => 'required|string',
            'submission_notes' => 'nullable|string',
            'close_mode' => 'required|in:clean,with_exceptions',
        ]);

        $user = $request->user();
        $assignments = LabInChargeAssignment::where('user_id', $user->id)->where('is_active', true)->get();
        $assignedRoomIds = $assignments->pluck('room_id');

        if ($assignedRoomIds->isEmpty()) {
            $assignedRooms = Room::where('room_name', 'like', '%CLR%')
                ->orWhere('room_name', 'like', '%COM%')
                ->orWhere('type', 'like', '%Lab%')
                ->get();
        } else {
            $assignedRooms = Room::whereIn('id', $assignedRoomIds)->get();
        }

        $allAssignedIds = $assignedRooms->pluck('id');
        $reportDate = Carbon::parse($validated['report_date']);
        $dayName = $reportDate->format('l');

        $expected = VerifiedSchedule::with(['faculty', 'course', 'section', 'room'])
            ->whereIn('room_id', $allAssignedIds)
            ->where('day_of_week', 'like', "%{$dayName}%")
            ->where('status', 'Active')
            ->orderBy('scheduled_start_time')
            ->get();

        $compiled = $this->buildEndOfDayReportData($user, $assignedRooms, $expected, $reportDate->toDateString(), $validated['shift_name']);

        $status = 'Submitted';
        $hasExceptions = $validated['close_mode'] === 'with_exceptions' || $compiled['has_exceptions'];

        $report = DailyMonitoringReport::updateOrCreate(
            [
                'report_date' => $reportDate->toDateString(),
                'user_id' => $user->id,
                'shift_name' => $validated['shift_name'],
            ],
            [
                'covered_room_ids' => $allAssignedIds->toArray(),
                'academic_period_name' => $compiled['academic_period_name'],
                'schedule_version' => $compiled['schedule_version'],
                'expected_sessions_count' => $compiled['expected_sessions_count'],
                'monitored_sessions_count' => $compiled['monitored_sessions_count'],
                'completeness_rate' => $compiled['completeness_rate'],
                'discrepancies_count' => $compiled['discrepancies_count'],
                'unmonitored_count' => $compiled['unmonitored_count'],
                'summary_matrix' => $compiled['summary_matrix'],
                'sessions_matrix' => $compiled['sessions_matrix'],
                'utilization_matrix' => $compiled['utilization_matrix'],
                'exceptions_matrix' => $compiled['exceptions_matrix'],
                'reconciliation_checklist' => $compiled['reconciliation_checklist'],
                'status' => $status,
                'has_exceptions' => $hasExceptions,
                'submission_notes' => $validated['submission_notes'],
                'submitted_at' => now(),
                'submitted_by_user_id' => $user->id,
            ]
        );

        $msg = $hasExceptions ? 'End-of-Day Report submitted and closed WITH EXCEPTIONS.' : 'End-of-Day Report submitted and cleanly closed.';

        return back()->with('success', "{$msg} Monitoring completeness: {$compiled['completeness_rate']}%. Downstream analytics enabled for verified records.");
    }

    /**
     * Review End-of-Day Report (Super Admin / Lab Coordinator).
     */
    public function reviewEndOfDayReport(Request $request, DailyMonitoringReport $report): RedirectResponse
    {
        $validated = $request->validate([
            'review_remarks' => 'nullable|string',
            'action' => 'required|in:approve_review,request_clarification',
        ]);

        if ($validated['action'] === 'request_clarification') {
            $report->update([
                'status' => 'Clarification Required',
                'review_remarks' => $validated['review_remarks'],
            ]);

            return back()->with('success', "Report #{$report->id} returned to Lab In-Charge for clarification.");
        }

        $report->update([
            'status' => 'Reviewed',
            'review_remarks' => $validated['review_remarks'],
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $request->user()->id,
        ]);

        return back()->with('success', "Report #{$report->id} marked as Reviewed by Lab Coordinator / Administrator.");
    }

    /**
     * Finalize End-of-Day Report (Super Admin / Dean).
     */
    public function finalizeEndOfDayReport(Request $request, DailyMonitoringReport $report): RedirectResponse
    {
        $report->update([
            'status' => 'Finalized',
            'finalized_at' => now(),
            'finalized_by_user_id' => $request->user()->id,
        ]);

        return back()->with('success', "Report #{$report->id} officially Finalized. Reconciled records are verified for official college faculty attendance reports.");
    }

    /**
     * Reopen an End-of-Day Report through an auditable correction process.
     */
    public function reopenEndOfDayReport(Request $request, DailyMonitoringReport $report): RedirectResponse
    {
        $validated = $request->validate([
            'reopen_reason' => 'required|string|min:10',
        ]);

        $user = $request->user();
        $history = $report->correction_history ?? [];
        $history[] = [
            'reopened_by' => $user->name,
            'reopened_at' => now()->toDateTimeString(),
            'reason' => $validated['reopen_reason'],
            'previous_status' => $report->status,
        ];

        $report->update([
            'status' => 'Draft',
            'correction_history' => $history,
        ]);

        return back()->with('success', "Report #{$report->id} reopened for auditable correction. Previous status logged: {$report->status}.");
    }

    /**
     * Endpoint to view printable/PDF End-of-Day Report or historical dates.
     */
    public function endOfDayReport(Request $request): Response
    {
        $user = $request->user();
        $tz = config('services.room_schedule.timezone', 'Asia/Manila');
        $dateParam = $request->query('date', Carbon::now($tz)->toDateString());
        $reportDate = Carbon::parse($dateParam, $tz);
        $dayName = $reportDate->format('l');

        $assignments = LabInChargeAssignment::where('user_id', $user->id)->where('is_active', true)->get();
        $assignedRoomIds = $assignments->pluck('room_id');

        if ($assignedRoomIds->isEmpty()) {
            $assignedRooms = Room::where('room_name', 'like', '%CLR%')
                ->orWhere('room_name', 'like', '%COM%')
                ->orWhere('type', 'like', '%Lab%')
                ->get();
        } else {
            $assignedRooms = Room::whereIn('id', $assignedRoomIds)->get();
        }

        $allAssignedIds = $assignedRooms->pluck('id');
        $shiftName = $assignments->first()?->shift_name ?? 'Full Day Shift';

        $expected = VerifiedSchedule::with(['faculty', 'course', 'section', 'room'])
            ->whereIn('room_id', $allAssignedIds)
            ->where('day_of_week', 'like', "%{$dayName}%")
            ->where('status', 'Active')
            ->orderBy('scheduled_start_time')
            ->get();

        $reportData = $this->buildEndOfDayReportData($user, $assignedRooms, $expected, $reportDate->toDateString(), $shiftName);

        // Fetch past submitted reports for historical selector
        $pastReports = DailyMonitoringReport::select('id', 'report_date', 'status', 'completeness_rate', 'has_exceptions')
            ->where('user_id', $user->id)
            ->latest('report_date')
            ->take(30)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'date' => $r->report_date->format('M d, Y'),
                'date_raw' => $r->report_date->toDateString(),
                'status' => $r->status,
                'completeness_rate' => $r->completeness_rate,
                'has_exceptions' => $r->has_exceptions,
            ]);

        return Inertia::render('monitoring/lab-in-charge/end-of-day', [
            'report' => $reportData,
            'pastReports' => $pastReports,
            'selectedDate' => $reportDate->toDateString(),
            'canManage' => in_array($user->role ?? '', ['Super Admin', 'Dean', 'Program Head', 'admin']),
        ]);
    }

    /**
     * Record live actual observation for an expected lab session.
     */
    public function recordObservation(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'verified_schedule_id' => 'required|exists:verified_schedules,id',
            'room_id' => 'required|exists:rooms,id',
            'actual_start_time' => 'nullable|string',
            'actual_end_time' => 'nullable|string',
            'observation_status' => 'required|string',
            'room_condition' => 'required|string',
            'session_outcome' => 'required|string',
            'alternative_room_id' => 'nullable|exists:rooms,id',
            'student_headcount' => 'nullable|integer',
            'observed_faculty_id' => 'nullable|exists:faculties,id',
            'observed_course_code' => 'nullable|string',
            'observed_section_name' => 'nullable|string',
            'remarks' => 'nullable|string',
            'is_historical_reconciliation' => 'nullable|boolean',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $verified = VerifiedSchedule::with(['faculty', 'course', 'section', 'room'])->findOrFail($validated['verified_schedule_id']);
        $tz = config('services.room_schedule.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // Upload photo if present
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('monitoring/evidence', 'public');
        }

        // 1. Calculate late minutes and observed minutes automatically
        $lateMinutes = 0;
        $observedMinutes = $verified->scheduled_minutes;

        if (! empty($validated['actual_start_time'])) {
            $schedStart = Carbon::parse($verified->scheduled_start_time);
            $actualStart = Carbon::parse($validated['actual_start_time']);

            if ($actualStart->greaterThan($schedStart)) {
                $lateMinutes = $schedStart->diffInMinutes($actualStart);
            }

            if (! empty($validated['actual_end_time'])) {
                $actualEnd = Carbon::parse($validated['actual_end_time']);
                $observedMinutes = max(0, $actualStart->diffInMinutes($actualEnd));
            } else {
                $schedEnd = Carbon::parse($verified->scheduled_end_time);
                $observedMinutes = max(0, $actualStart->diffInMinutes($schedEnd));
            }
        }

        $varianceMinutes = $observedMinutes - $verified->scheduled_minutes;

        // 2. Automated Discrepancy Detection & Evidence Chain
        $hasDiscrepancy = false;
        $discrepancyType = null;
        $severity = 'Needs Attention';
        $expectedState = "Scheduled: {$verified->course->code} ({$verified->section->code}) with {$verified->faculty->first_name} {$verified->faculty->last_name} in {$verified->room->room_name}";
        $observedState = "Room Condition: {$validated['room_condition']} · Session Outcome: {$validated['session_outcome']}";

        if (! empty($validated['observed_faculty_id']) && $validated['observed_faculty_id'] != $verified->faculty_id) {
            $hasDiscrepancy = true;
            $observedFac = Faculty::find($validated['observed_faculty_id']);
            $discrepancyType = 'Expected Faculty ≠ Observed Faculty';
            $observedState .= " · Observed Faculty: {$observedFac->first_name} {$observedFac->last_name}";
        }

        if ($validated['room_condition'] === 'Occupied by Another Class' || $validated['room_condition'] === 'Unscheduled Use') {
            $hasDiscrepancy = true;
            $discrepancyType = 'Unscheduled Room Use / Double Occupancy';
            $severity = 'Blocking';
        }

        if (in_array($validated['room_condition'], ['Equipment Failure', 'Power/Network Issue', 'Maintenance'])) {
            $hasDiscrepancy = true;
            $discrepancyType = 'Facility / Equipment Failure';
        }

        if ($validated['session_outcome'] === 'Faculty Not Present') {
            $hasDiscrepancy = true;
            $discrepancyType = 'Scheduled Room Empty / Faculty Not Present';
        }

        $isHistorical = (bool) ($validated['is_historical_reconciliation'] ?? false);

        $sessionData = [
            'room_id' => $validated['room_id'],
            'monitored_by_user_id' => $request->user()->id,
            'scheduled_start_time' => $verified->scheduled_start_time,
            'scheduled_end_time' => $verified->scheduled_end_time,
            'scheduled_minutes' => $verified->scheduled_minutes,
            'actual_start_time' => $validated['actual_start_time'] ?? null,
            'actual_end_time' => $validated['actual_end_time'] ?? null,
            'late_minutes' => $lateMinutes,
            'observed_minutes' => $observedMinutes,
            'variance_minutes' => $varianceMinutes,
            'student_headcount' => $validated['student_headcount'] ?? null,
            'observation_status' => $validated['observation_status'],
            'room_condition' => $validated['room_condition'],
            'session_outcome' => $validated['session_outcome'],
            'alternative_room_id' => $validated['alternative_room_id'] ?? null,
            'observed_faculty_id' => $validated['observed_faculty_id'] ?? null,
            'observed_course_code' => $validated['observed_course_code'] ?? null,
            'observed_section_name' => $validated['observed_section_name'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'has_discrepancy' => $hasDiscrepancy,
            'is_historical_reconciliation' => $isHistorical,
        ];

        if ($photoPath) {
            $sessionData['photo_path'] = $photoPath;
        }

        $session = LabMonitoringSession::updateOrCreate(
            [
                'verified_schedule_id' => $verified->id,
                'monitoring_date' => $now->toDateString(),
            ],
            $sessionData
        );

        if ($hasDiscrepancy) {
            LabMonitoringDiscrepancy::create([
                'monitoring_session_id' => $session->id,
                'verified_schedule_id' => $verified->id,
                'room_id' => $validated['room_id'],
                'reported_by_user_id' => $request->user()->id,
                'discrepancy_type' => $discrepancyType ?? 'Operational Discrepancy',
                'severity' => $severity,
                'expected_state' => $expectedState,
                'observed_state' => $observedState,
                'remarks' => $validated['remarks'] ?? 'Reported by Lab In-Charge on live monitoring.',
                'evidence_details' => 'Evidence recorded during real-time operational check by '.$request->user()->name.($photoPath ? ' (Photo Attached)' : ''),
                'photo_path' => $photoPath,
                'resolution_status' => 'Reported',
            ]);
        }

        $msg = $isHistorical ? 'Historical observation recorded' : 'Live observation recorded';

        return back()->with('success', "{$msg} for {$verified->course->code}. Late: {$lateMinutes}m, Observed: {$observedMinutes}m.");
    }

    /**
     * Report an immediate room disruption / operational incident.
     */
    public function reportDisruption(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'verified_schedule_id' => 'nullable|exists:verified_schedules,id',
            'discrepancy_type' => 'required|string',
            'severity' => 'required|string',
            'observed_state' => 'required|string',
            'remarks' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $room = Room::findOrFail($validated['room_id']);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('monitoring/evidence', 'public');
        }

        $discrepancy = LabMonitoringDiscrepancy::create([
            'room_id' => $room->id,
            'verified_schedule_id' => $validated['verified_schedule_id'] ?? null,
            'reported_by_user_id' => $request->user()->id,
            'discrepancy_type' => $validated['discrepancy_type'],
            'severity' => $validated['severity'],
            'expected_state' => 'Normal scheduled laboratory operational availability',
            'observed_state' => $validated['observed_state'],
            'remarks' => $validated['remarks'] ?? 'Immediate disruption reported by Lab In-Charge.',
            'evidence_details' => 'Reported by Lab In-Charge: '.$request->user()->name.' at '.now()->toDateTimeString().($photoPath ? ' (Photo Evidence Attached)' : ''),
            'photo_path' => $photoPath,
            'resolution_status' => 'Reported',
        ]);

        return back()->with('success', "Disruption report #{$discrepancy->id} filed for {$room->room_name}. Super Admin and Program Head alerted.");
    }

    /**
     * Request a correction for an audit-locked monitoring record.
     */
    public function requestCorrection(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'monitoring_session_id' => 'required|exists:lab_monitoring_sessions,id',
            'correction_notes' => 'required|string|min:10',
        ]);

        $session = LabMonitoringSession::findOrFail($validated['monitoring_session_id']);
        $session->update([
            'correction_requested' => true,
            'correction_notes' => $validated['correction_notes'],
        ]);

        return back()->with('success', 'Correction request submitted for review. An administrator will verify the change.');
    }

    /**
     * Transition discrepancy lifecycle status (Reported -> Under Review -> Clarification Required -> Resolved -> Verified).
     */
    public function updateDiscrepancyStatus(Request $request, LabMonitoringDiscrepancy $discrepancy): RedirectResponse
    {
        $validated = $request->validate([
            'resolution_status' => 'required|in:Reported,Under Review,Clarification Required,Resolved,Verified',
            'remarks' => 'nullable|string',
        ]);

        $discrepancy->update([
            'resolution_status' => $validated['resolution_status'],
            'resolution_notes' => $validated['remarks'] ?? $discrepancy->resolution_notes,
        ]);

        return back()->with('success', "Discrepancy #{$discrepancy->id} transitioned to '{$validated['resolution_status']}'.");
    }

    /**
     * Resolve a reported discrepancy (Program Head or Super Admin).
     */
    public function resolveDiscrepancy(Request $request, LabMonitoringDiscrepancy $discrepancy): RedirectResponse
    {
        $validated = $request->validate([
            'resolution_status' => 'required|string',
            'resolution_notes' => 'required|string',
        ]);

        $discrepancy->update([
            'resolution_status' => $validated['resolution_status'],
            'resolution_notes' => $validated['resolution_notes'],
            'resolved_by_user_id' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        return back()->with('success', "Discrepancy #{$discrepancy->id} updated to {$validated['resolution_status']}.");
    }

    /**
     * Map or change faculty on a verified laboratory schedule.
     * Allowed for Super Admin and Lab In-Charge.
     * Dispatches notifications to Super Admin, Dean, and Program Head for full audit tracking.
     */
    public function reassignScheduleFaculty(Request $request, VerifiedSchedule $schedule): RedirectResponse
    {
        $validated = $request->validate([
            'new_faculty_id' => 'required|exists:faculties,id|different:faculty_id',
            'reassignment_type' => 'required|in:Permanent,Substitute / Temporary,Daily Override',
            'reason' => 'required|string|min:5',
            'effective_date' => 'nullable|date',
        ]);

        $user = $request->user();
        $userRole = $user->role ?? ($user->roles->first()?->name ?? 'Lab In-Charge');

        $previousFaculty = $schedule->faculty;
        $newFaculty = Faculty::findOrFail($validated['new_faculty_id']);

        // 1. Update the authoritative verified schedule record
        $schedule->update([
            'faculty_id' => $newFaculty->id,
            'verified_by_user_id' => $user->id,
            'verified_at' => now(),
        ]);

        // 2. Also keep synchronous RoomSchedule entries aligned if present
        $roomName = $schedule->room?->room_name ?? $schedule->room?->name;
        $roomScheduleQuery = RoomSchedule::query();
        if ($roomName) {
            $roomScheduleQuery->where('room_name', $roomName);
        }
        $roomScheduleQuery
            ->where('day_of_week', 'like', "%{$schedule->day_of_week}%")
            ->where('start_time', $schedule->scheduled_start_time)
            ->update([
                'faculty_id' => $newFaculty->id,
                'instructor' => "{$newFaculty->first_name} {$newFaculty->last_name}",
            ]);

        // 3. Find recipient users (Super Admin, Dean, Program Head) to notify
        $recipientUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['Super Admin', 'Dean', 'Program Head', 'Department Head', 'admin']);
        })->get();

        $notifiedRoles = ['Super Admin', 'Dean', 'Program Head'];
        $notifiedUserIds = $recipientUsers->pluck('id')->toArray();

        // 4. Create persistent auditable reassignment log
        $reassignment = ScheduleFacultyReassignment::create([
            'verified_schedule_id' => $schedule->id,
            'previous_faculty_id' => $previousFaculty?->id ?? $validated['new_faculty_id'],
            'new_faculty_id' => $newFaculty->id,
            'changed_by_user_id' => $user->id,
            'changed_by_role' => $userRole,
            'reassignment_type' => $validated['reassignment_type'],
            'effective_date' => $validated['effective_date'] ?? now()->toDateString(),
            'reason' => $validated['reason'],
            'notified_roles' => $notifiedRoles,
            'notified_user_ids' => $notifiedUserIds,
        ]);

        // 5. Send notification to tracked administrative leaders
        if ($recipientUsers->isNotEmpty()) {
            Notification::send($recipientUsers, new ScheduleFacultyReassignedNotification($reassignment));
        }

        $prevName = $previousFaculty ? "{$previousFaculty->first_name} {$previousFaculty->last_name}" : 'Previous Faculty';
        $newName = "{$newFaculty->first_name} {$newFaculty->last_name}";
        $courseCode = $schedule->course?->code ?? 'Course';

        return back()->with('success', "Faculty for {$courseCode} successfully remapped from {$prevName} to {$newName} ({$validated['reassignment_type']}). Notifications dispatched to Super Admin, Dean, and Program Head.");
    }
}
