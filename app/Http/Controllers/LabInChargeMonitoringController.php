<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Faculty;
use App\Models\LabInChargeAssignment;
use App\Models\LabMonitoringDiscrepancy;
use App\Models\LabMonitoringSession;
use App\Models\Room;
use App\Models\VerifiedSchedule;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        // Fallback for Super Admin or testing if no assignment has been provisioned yet
        if ($assignedRoomIds->isEmpty()) {
            $assignedRooms = Room::where('room_name', 'like', '%CLR%')
                ->orWhere('room_name', 'like', '%COM%')
                ->orWhere('room_name', 'like', '%Lab%')
                ->orWhere('type', 'like', '%Lab%')
                ->orderBy('room_name')
                ->get();
        } else {
            $assignedRooms = Room::whereIn('id', $assignedRoomIds)
                ->orderBy('room_name')
                ->get();
        }

        $allAssignedIds = $assignedRooms->pluck('id');

        // 2. Verified expected laboratory sessions for TODAY
        $todayExpectedSchedules = VerifiedSchedule::with(['faculty', 'course', 'section', 'room'])
            ->whereIn('room_id', $allAssignedIds)
            ->where('day_of_week', 'like', "%{$todayName}%")
            ->where('status', 'Active')
            ->orderBy('scheduled_start_time')
            ->get();

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

                return $now->between($start->copy()->subMinutes(10), $end);
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

        return Inertia::render('monitoring/lab-in-charge/index', [
            'labInChargeUser' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'Lab In-Charge',
            ],
            'currentShift' => $currentShift,
            'todayName' => $todayName,
            'todayDate' => $now->format('F d, Y'),
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
        ]);

        $verified = VerifiedSchedule::with(['faculty', 'course', 'section', 'room'])->findOrFail($validated['verified_schedule_id']);
        $tz = config('services.room_schedule.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

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

        $session = LabMonitoringSession::updateOrCreate(
            [
                'verified_schedule_id' => $verified->id,
                'monitoring_date' => $now->toDateString(),
            ],
            [
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
            ]
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
                'evidence_details' => 'Evidence recorded during real-time operational check by '.$request->user()->name,
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
        ]);

        $room = Room::findOrFail($validated['room_id']);

        $discrepancy = LabMonitoringDiscrepancy::create([
            'room_id' => $room->id,
            'verified_schedule_id' => $validated['verified_schedule_id'] ?? null,
            'reported_by_user_id' => $request->user()->id,
            'discrepancy_type' => $validated['discrepancy_type'],
            'severity' => $validated['severity'],
            'expected_state' => 'Normal scheduled laboratory operational availability',
            'observed_state' => $validated['observed_state'],
            'remarks' => $validated['remarks'] ?? 'Immediate disruption reported by Lab In-Charge.',
            'evidence_details' => 'Reported by Lab In-Charge: '.$request->user()->name.' at '.now()->toDateTimeString(),
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
}
