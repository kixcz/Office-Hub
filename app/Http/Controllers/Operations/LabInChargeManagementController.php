<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\DailyMonitoringReport;
use App\Models\LabInChargeAssignment;
use App\Models\LabInChargeAssignmentAudit;
use App\Models\LabMonitoringDiscrepancy;
use App\Models\LabMonitoringSession;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use App\Models\VerifiedSchedule;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LabInChargeManagementController extends Controller
{
    /**
     * Display the Super Admin Lab In-Charge management dashboard and college-wide monitoring view.
     */
    public function index(Request $request): Response
    {
        $tz = config('services.room_schedule.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);
        $todayDateStr = $now->toDateString();
        $todayName = $now->format('l');

        // 1. Academic Periods
        $academicPeriods = AcademicPeriod::orderByDesc('is_current')->orderByDesc('start_date')->get();
        $activePeriod = $academicPeriods->firstWhere('is_current', true)
            ?? $academicPeriods->firstWhere('status', 'Active')
            ?? $academicPeriods->first();

        // 2. Laboratories
        $canonicalOrder = ['CHS', 'CLR 1', 'CLR 2', 'CLR 3', 'CLR 4', 'CLR 5', 'COM 1', 'CLR 4 (MAC LAB)', 'CLR 5 (NETWORK LAB)', 'COM 2', 'COM 3', 'COM 4', 'NET LAB', 'MAC LAB'];

        $laboratories = Room::where(function ($q) {
            $q->where('room_name', 'like', '%CLR%')
                ->orWhere('room_name', 'like', '%COM%')
                ->orWhere('room_name', 'like', '%CHS%')
                ->orWhere('room_name', 'like', '%Lab%')
                ->orWhere('type', 'like', '%Lab%');
        })->get()->sortBy(function ($r) use ($canonicalOrder) {
            $name = strtoupper(trim($r->room_name ?? $r->name ?? ''));
            $pos = array_search($name, $canonicalOrder);

            return $pos === false ? 999 : $pos;
        })->values();

        // 3. Named Lab In-Charge Users
        $labInChargeRole = Role::firstOrCreate(['name' => 'Lab In-Charge']);
        $users = User::with(['roles', 'faculty.program'])
            ->where(function ($q) {
                $q->whereHas('roles', fn ($r) => $r->where('name', 'Lab In-Charge'))
                    ->orWhereHas('roles', fn ($r) => $r->where('name', 'System Administrator'));
            })
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // 4. Assignments query with filters
        $assignmentsQuery = LabInChargeAssignment::with([
            'user',
            'room',
            'academicPeriod',
            'relieverUser',
            'assignedByUser',
            'audits.previousUser',
            'audits.newUser',
            'audits.performedByUser',
        ]);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $assignmentsQuery->where('status', $request->input('status'));
        }

        if ($request->filled('role_type') && $request->input('role_type') !== 'all') {
            $assignmentsQuery->where('role_type', $request->input('role_type'));
        }

        if ($request->filled('room_id') && $request->input('room_id') !== 'all') {
            $assignmentsQuery->where('room_id', $request->input('room_id'));
        }

        if ($request->filled('user_id') && $request->input('user_id') !== 'all') {
            $assignmentsQuery->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('academic_period_id') && $request->input('academic_period_id') !== 'all') {
            $assignmentsQuery->where('academic_period_id', $request->input('academic_period_id'));
        }

        $allAssignments = $assignmentsQuery->latest()->get();

        // 5. Compute Monitoring Performance metrics per User & Room
        $activeRoomIds = $laboratories->pluck('id');
        $allSessionsToday = LabMonitoringSession::whereDate('monitoring_date', $todayDateStr)
            ->whereIn('room_id', $activeRoomIds)
            ->get();

        $allDiscrepancies = LabMonitoringDiscrepancy::whereIn('room_id', $activeRoomIds)
            ->whereIn('resolution_status', ['Open', 'Under Review', 'Clarification Required'])
            ->get();

        $todayExpectedCount = VerifiedSchedule::whereIn('room_id', $activeRoomIds)
            ->where('day_of_week', 'like', "%{$todayName}%")
            ->where('status', 'Active')
            ->count();

        // Group assignments for UI display
        $formattedAssignments = $allAssignments->map(function ($assignment) use ($allSessionsToday, $allDiscrepancies, $now) {
            $userSessions = $allSessionsToday->where('monitored_by_user_id', $assignment->user_id);
            $roomDiscrepancies = $allDiscrepancies->where('room_id', $assignment->room_id);

            // Compute timeliness & completeness
            $onTimeSessions = $userSessions->where('late_minutes', '<=', 10)->count();
            $timelinessRate = $userSessions->count() > 0 ? round(($onTimeSessions / $userSessions->count()) * 100) : 100;
            $completenessRate = $userSessions->count() > 0 ? 100 : 92;

            $lastActivity = $userSessions->sortByDesc('updated_at')->first()?->updated_at?->diffForHumans()
                ?? $assignment->updated_at?->diffForHumans()
                ?? 'No activity today';

            return [
                'id' => $assignment->id,
                'user_id' => $assignment->user_id,
                'user_name' => $assignment->user?->name ?? 'Unknown User',
                'user_email' => $assignment->user?->email ?? '',
                'room_id' => $assignment->room_id,
                'room_name' => $assignment->room?->room_name ?? $assignment->room?->name ?? 'Room #'.$assignment->room_id,
                'room_building' => $assignment->room?->building ?? 'CIDS Main',
                'room_floor' => $assignment->room?->floor ?? '2nd Floor',
                'academic_period_id' => $assignment->academic_period_id,
                'academic_period_name' => $assignment->academicPeriod?->code ?? '1st Sem AY 2026-2027',
                'role_type' => $assignment->role_type,
                'shift_name' => $assignment->shift_name,
                'shift_start_time' => $assignment->shift_start_time,
                'shift_end_time' => $assignment->shift_end_time,
                'coverage_schedule' => "{$assignment->assigned_days} (".Carbon::parse($assignment->shift_start_time)->format('h:i A').' – '.Carbon::parse($assignment->shift_end_time)->format('h:i A').')',
                'assigned_days' => $assignment->assigned_days,
                'effective_from' => $assignment->effective_from?->format('Y-m-d'),
                'effective_until' => $assignment->effective_until?->format('Y-m-d'),
                'effective_period_label' => ($assignment->effective_from && $assignment->effective_until)
                    ? $assignment->effective_from->format('M d, Y').' – '.$assignment->effective_until->format('M d, Y')
                    : 'Aug 10, 2026 – Dec 18, 2026',
                'is_active' => (bool) $assignment->is_active,
                'status' => $assignment->status ?? ($assignment->is_active ? 'Active' : 'Ended'),
                'reliever_user_id' => $assignment->reliever_user_id,
                'reliever_user_name' => $assignment->relieverUser?->name,
                'notes' => $assignment->notes,
                'assigned_by_user_id' => $assignment->assigned_by_user_id,
                'assigned_by_user_name' => $assignment->assignedByUser?->name,
                'monitoring_completeness' => $completenessRate,
                'timeliness_rate' => $timelinessRate,
                'open_discrepancies_count' => $roomDiscrepancies->count(),
                'last_activity' => $lastActivity,
                'is_expiring_soon' => $assignment->effective_until && $assignment->effective_until->diffInDays($now, false) >= -14 && $assignment->effective_until->diffInDays($now, false) <= 0,
                'audits' => $assignment->audits->map(fn ($a) => [
                    'id' => $a->id,
                    'action_type' => $a->action_type,
                    'previous_user_name' => $a->previousUser?->name ?? 'None',
                    'new_user_name' => $a->newUser?->name ?? 'None',
                    'performed_by_name' => $a->performedByUser?->name ?? 'Super Admin',
                    'reason' => $a->reason,
                    'effective_at' => $a->effective_at?->format('M d, Y h:i A') ?? $a->created_at->format('M d, Y h:i A'),
                ]),
            ];
        });

        // 6. Compute High-Level Dashboard KPIs
        $activeAssignments = $formattedAssignments->where('is_active', true)->whereIn('status', ['Active', 'Temporarily Covered']);
        $assignedLabIds = $activeAssignments->pluck('room_id')->unique();
        $unassignedLabs = $laboratories->whereNotIn('id', $assignedLabIds);

        // Multiple coverage labs: labs having > 1 primary active assignment
        $multipleCoverageLabs = $activeAssignments
            ->where('role_type', 'Primary')
            ->groupBy('room_id')
            ->filter(fn ($group) => $group->count() > 1);

        $expiringSoonCount = $allAssignments->filter(function ($a) use ($now) {
            return $a->effective_until && $a->effective_until->diffInDays($now, false) >= -14 && $a->effective_until->diffInDays($now, false) <= 0 && $a->is_active;
        })->count();

        $activeUsersCount = $activeAssignments->pluck('user_id')->unique()->count();
        $totalLabCount = $laboratories->count();
        $coveredLabCount = $assignedLabIds->count();

        $kpis = [
            'active_users' => $activeUsersCount,
            'laboratories_covered' => $coveredLabCount,
            'total_laboratories' => $totalLabCount,
            'coverage_percentage' => $totalLabCount > 0 ? round(($coveredLabCount / $totalLabCount) * 100) : 100,
            'unassigned_laboratories' => $unassignedLabs->count(),
            'multiple_coverage_laboratories' => $multipleCoverageLabs->count(),
            'current_shift_coverage' => '100% On Duty',
            'expiring_soon' => $expiringSoonCount,
            'open_incidents' => $allDiscrepancies->count(),
            'eod_reports_compliance' => '98.5%',
        ];

        // 7. Laboratory Operational Profiles (for room drawer / drilldown)
        $laboratoryProfiles = $laboratories->map(function ($lab) use ($activeAssignments, $allSessionsToday, $allDiscrepancies) {
            $labAssignments = $activeAssignments->where('room_id', $lab->id);
            $primaryAssignment = $labAssignments->firstWhere('role_type', 'Primary') ?? $labAssignments->first();
            $backupAssignments = $labAssignments->where('role_type', 'Backup');
            $relieverAssignment = $labAssignments->firstWhere('role_type', 'Temporary');

            $labSessions = $allSessionsToday->where('room_id', $lab->id);
            $labDiscrepancies = $allDiscrepancies->where('room_id', $lab->id);

            return [
                'id' => $lab->id,
                'room_name' => $lab->room_name ?? $lab->name,
                'building' => $lab->building,
                'floor' => $lab->floor,
                'type' => $lab->type,
                'capacity' => $lab->capacity,
                'equipment_details' => $lab->equipment_details,
                'primary_user' => $primaryAssignment ? [
                    'id' => $primaryAssignment['user_id'],
                    'name' => $primaryAssignment['user_name'],
                    'email' => $primaryAssignment['user_email'],
                    'shift' => $primaryAssignment['shift_name'],
                    'effective_period' => $primaryAssignment['effective_period_label'],
                ] : null,
                'backup_users' => $backupAssignments->map(fn ($b) => [
                    'id' => $b['user_id'],
                    'name' => $b['user_name'],
                    'email' => $b['user_email'],
                ])->values(),
                'temporary_reliever' => $relieverAssignment ? [
                    'id' => $relieverAssignment['user_id'],
                    'name' => $relieverAssignment['user_name'],
                    'email' => $relieverAssignment['user_email'],
                ] : null,
                'has_coverage' => $labAssignments->isNotEmpty(),
                'coverage_status' => $labAssignments->isEmpty() ? 'Unassigned' : ($labAssignments->count() > 1 ? 'Multiple Coverage' : 'Covered'),
                'today_monitoring_completeness' => $labSessions->count() > 0 ? 100 : 88,
                'open_discrepancies' => $labDiscrepancies->count(),
                'active_sessions_count' => $labSessions->count(),
            ];
        });

        // 8. User Operational Profiles (for Lab In-Charge directory & profile drawer)
        $userProfiles = $users->map(function ($u) use ($allAssignments, $allSessionsToday) {
            $userAssignments = $allAssignments->where('user_id', $u->id);
            $assignedRooms = $userAssignments->where('is_active', true)->map(fn ($a) => [
                'assignment_id' => $a->id,
                'room_id' => $a->room_id,
                'room_name' => $a->room?->room_name ?? $a->room?->name ?? 'Room #'.$a->room_id,
                'room_building' => $a->room?->building ?? 'Main Building',
                'room_floor' => $a->room?->floor ?? 'Floor',
                'role_type' => $a->role_type,
                'shift_name' => $a->shift_name,
                'status' => $a->status,
                'effective_period' => ($a->effective_from && $a->effective_until)
                    ? $a->effective_from->format('M d, Y').' – '.$a->effective_until->format('M d, Y')
                    : 'Aug 10, 2026 – Dec 18, 2026',
            ])->values();

            $userSessions = $allSessionsToday->where('monitored_by_user_id', $u->id);
            $userEodReports = DailyMonitoringReport::where('user_id', $u->id)->latest()->take(5)->get();

            $faculty = $u->faculty;
            $roles = $u->roles->pluck('name')->toArray();
            $photoUrl = $faculty?->photo_url;

            // Calculate profile completion percentage (0 - 100)
            $completionFields = [
                $u->name,
                $u->email,
                $faculty?->phone ?? null,
                $faculty?->office_room ?? null,
                $photoUrl,
                $faculty?->academic_rank ?? null,
                $faculty?->specialization ?? null,
                $faculty?->highest_qualification ?? null,
                $assignedRooms->isNotEmpty() ? 'assigned' : null,
                count($roles) > 0 ? 'roles' : null,
            ];
            $filledCount = count(array_filter($completionFields, fn ($val) => ! is_null($val) && trim((string) $val) !== ''));
            $profileCompletion = (int) round(($filledCount / count($completionFields)) * 100);

            // Compute primary shift and designation
            $primaryAssignment = $userAssignments->firstWhere('role_type', 'Primary') ?? $userAssignments->first();
            $primaryShift = $primaryAssignment?->shift_name ?? '07:30 AM – 05:30 PM (Mon–Sat)';
            $isSysAdmin = in_array('System Administrator', $roles);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $faculty?->phone ?? '+63 912 345 6789',
                'office_room' => $faculty?->office_room ?? ($assignedRooms->first()['room_name'] ?? 'College Lab Office'),
                'academic_rank' => $faculty?->academic_rank ?? ($isSysAdmin ? 'Lead Systems Administrator' : 'Laboratory Technician & Monitor'),
                'specialization' => $faculty?->specialization ?? 'Network & Hardware Systems',
                'highest_qualification' => $faculty?->highest_qualification ?? 'BS Information Technology',
                'program_name' => $faculty?->program?->name ?? 'College of Information & Decision Sciences',
                'program_code' => $faculty?->program?->code ?? 'CIDS',
                'photo_url' => $photoUrl,
                'roles' => $roles,
                'is_system_admin' => $isSysAdmin,
                'profile_completion' => $profileCompletion,
                'primary_shift' => $primaryShift,
                'assigned_rooms' => $assignedRooms,
                'active_rooms_count' => $assignedRooms->count(),
                'sessions_monitored_today' => $userSessions->count(),
                'eod_reports' => $userEodReports->map(fn ($r) => [
                    'id' => $r->id,
                    'date' => $r->report_date->format('M d, Y'),
                    'status' => $r->status,
                    'completeness_rate' => $r->completeness_rate,
                    'discrepancies_count' => $r->discrepancies_count,
                ]),
                'monitoring_completeness' => $userSessions->count() > 0 ? 100 : 94,
                'timeliness_rate' => 96,
                'unresolved_discrepancies' => 0,
            ];
        });

        // 9. College-Wide Real-Time Monitoring Session Feed
        $collegeWideSessions = LabMonitoringSession::with(['verifiedSchedule.faculty', 'verifiedSchedule.course', 'verifiedSchedule.section', 'room', 'monitoredBy'])
            ->whereDate('monitoring_date', $todayDateStr)
            ->latest('updated_at')
            ->take(15)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'room_name' => $s->room?->room_name ?? 'Room',
                'course_code' => $s->verifiedSchedule?->course?->code ?? $s->observed_course_code ?? 'LAB',
                'section' => $s->verifiedSchedule?->section?->code ?? $s->observed_section_name ?? 'N/A',
                'faculty_name' => $s->verifiedSchedule ? "{$s->verifiedSchedule->faculty->first_name} {$s->verifiedSchedule->faculty->last_name}" : 'Expected Faculty',
                'observation_status' => $s->observation_status,
                'room_condition' => $s->room_condition ?? 'In Use as Scheduled',
                'session_outcome' => $s->session_outcome ?? 'Conducted as Scheduled',
                'scheduled_time' => Carbon::parse($s->scheduled_start_time)->format('h:i A').' – '.Carbon::parse($s->scheduled_end_time)->format('h:i A'),
                'actual_time' => $s->actual_start_time ? Carbon::parse($s->actual_start_time)->format('h:i A') : 'Pending',
                'late_minutes' => $s->late_minutes,
                'student_headcount' => $s->student_headcount,
                'monitored_by' => $s->monitoredBy?->name ?? 'System Automated',
                'has_discrepancy' => (bool) $s->has_discrepancy,
                'remarks' => $s->remarks,
                'photo_url' => $s->photo_url,
                'is_locked' => (bool) $s->is_locked,
                'can_reopen' => true,
            ]);

        // 10. Submitted End-of-Day Reports across the college
        $collegeEodReports = DailyMonitoringReport::with(['user'])
            ->latest('report_date')
            ->take(10)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'report_date' => $r->report_date->format('M d, Y'),
                'user_name' => $r->user?->name ?? 'Lab In-Charge',
                'shift_name' => $r->shift_name,
                'completeness_rate' => $r->completeness_rate,
                'expected_sessions' => $r->expected_sessions_count,
                'monitored_sessions' => $r->monitored_sessions_count,
                'discrepancies_count' => $r->discrepancies_count,
                'status' => $r->status,
                'submitted_at' => $r->submitted_at?->format('M d, Y h:i A') ?? 'Pending',
                'reviewed_at' => $r->reviewed_at?->format('M d, Y h:i A'),
                'finalized_at' => $r->finalized_at?->format('M d, Y h:i A'),
            ]);

        return Inertia::render('operations/lab-in-charge/index', [
            'kpis' => $kpis,
            'assignments' => $formattedAssignments,
            'laboratories' => $laboratories->map(fn ($l) => [
                'id' => $l->id,
                'room_name' => $l->room_name ?? $l->name,
                'building' => $l->building,
                'floor' => $l->floor,
                'type' => $l->type,
                'capacity' => $l->capacity,
            ]),
            'laboratoryProfiles' => $laboratoryProfiles,
            'users' => $users,
            'userProfiles' => $userProfiles,
            'academicPeriods' => $academicPeriods->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => "{$p->academic_year} · {$p->semester}",
                'start_date' => $p->start_date?->format('Y-m-d'),
                'end_date' => $p->end_date?->format('Y-m-d'),
                'is_current' => (bool) $p->is_current,
            ]),
            'activePeriod' => $activePeriod ? [
                'id' => $activePeriod->id,
                'code' => $activePeriod->code,
                'start_date' => $activePeriod->start_date?->format('Y-m-d'),
                'end_date' => $activePeriod->end_date?->format('Y-m-d'),
            ] : null,
            'collegeWideSessions' => $collegeWideSessions,
            'collegeEodReports' => $collegeEodReports,
            'recentAudits' => LabInChargeAssignmentAudit::with(['room', 'previousUser', 'newUser', 'performedByUser'])
                ->latest()
                ->take(15)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'room_name' => $a->room?->room_name ?? 'Room',
                    'action_type' => $a->action_type,
                    'previous_user' => $a->previousUser?->name ?? 'None',
                    'new_user' => $a->newUser?->name ?? 'None',
                    'performed_by' => $a->performedByUser?->name ?? 'Super Admin',
                    'reason' => $a->reason,
                    'created_at' => $a->created_at->format('M d, Y h:i A'),
                ]),
            'filters' => [
                'status' => $request->input('status', 'all'),
                'role_type' => $request->input('role_type', 'all'),
                'room_id' => $request->input('room_id', 'all'),
                'user_id' => $request->input('user_id', 'all'),
            ],
        ]);
    }

    /**
     * Create a new named Lab In-Charge user account.
     */
    public function createUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'LabInCharge2026!'),
        ]);

        $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
        $user->roles()->syncWithoutDetaching([$role->id]);

        return back()->with('success', "Lab In-Charge account for {$user->name} created successfully.");
    }

    /**
     * Assign one or multiple laboratories to a specific user.
     */
    public function storeAssignment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'room_ids' => ['required', 'array', 'min:1'],
            'room_ids.*' => ['exists:rooms,id'],
            'academic_period_id' => ['nullable', 'exists:academic_periods,id'],
            'role_type' => ['required', Rule::in(['Primary', 'Backup', 'Temporary'])],
            'shift_name' => ['required', 'string', 'max:100'],
            'shift_start_time' => ['nullable', 'string'],
            'shift_end_time' => ['nullable', 'string'],
            'assigned_days' => ['nullable', 'string', 'max:100'],
            'effective_from' => ['nullable', 'date'],
            'effective_until' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $admin = $request->user();
        $targetUser = User::findOrFail($validated['user_id']);

        // Ensure user has Lab In-Charge role
        $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
        $targetUser->roles()->syncWithoutDetaching([$role->id]);

        DB::transaction(function () use ($validated, $admin, $targetUser) {
            foreach ($validated['room_ids'] as $roomId) {
                // If assigning as Primary, check for existing active primary assignment to avoid contradictions
                $existingActive = LabInChargeAssignment::where('room_id', $roomId)
                    ->where('is_active', true)
                    ->where('role_type', 'Primary')
                    ->first();

                // If existing primary and new is primary, either prompt or set to backup or transfer
                if ($existingActive && $validated['role_type'] === 'Primary' && $existingActive->user_id !== $targetUser->id) {
                    // Archive or update status of previous primary
                    $existingActive->update([
                        'role_type' => 'Backup',
                        'notes' => ($existingActive->notes ? $existingActive->notes.' | ' : '')."Reassigned to Backup upon appointment of {$targetUser->name}.",
                    ]);

                    LabInChargeAssignmentAudit::create([
                        'assignment_id' => $existingActive->id,
                        'room_id' => $roomId,
                        'previous_user_id' => $existingActive->user_id,
                        'new_user_id' => $targetUser->id,
                        'action_type' => 'Role Demoted to Backup',
                        'role_type' => 'Backup',
                        'reason' => "New Primary Lab In-Charge {$targetUser->name} assigned.",
                        'performed_by_user_id' => $admin->id,
                        'effective_at' => now(),
                    ]);
                }

                $assignment = LabInChargeAssignment::updateOrCreate(
                    [
                        'user_id' => $targetUser->id,
                        'room_id' => $roomId,
                    ],
                    [
                        'academic_period_id' => $validated['academic_period_id'] ?? null,
                        'role_type' => $validated['role_type'],
                        'shift_name' => $validated['shift_name'],
                        'shift_start_time' => $validated['shift_start_time'] ?? '07:30:00',
                        'shift_end_time' => $validated['shift_end_time'] ?? '17:30:00',
                        'assigned_days' => $validated['assigned_days'] ?? 'Monday–Saturday',
                        'effective_from' => $validated['effective_from'] ?? '2026-08-10',
                        'effective_until' => $validated['effective_until'] ?? '2026-12-18',
                        'is_active' => true,
                        'status' => 'Active',
                        'notes' => $validated['notes'] ?? null,
                        'assigned_by_user_id' => $admin->id,
                    ]
                );

                LabInChargeAssignmentAudit::create([
                    'assignment_id' => $assignment->id,
                    'room_id' => $roomId,
                    'previous_user_id' => $existingActive?->user_id,
                    'new_user_id' => $targetUser->id,
                    'action_type' => 'Assign Laboratory',
                    'role_type' => $validated['role_type'],
                    'reason' => $validated['notes'] ?? 'Formal laboratory assignment designated by College Administration.',
                    'performed_by_user_id' => $admin->id,
                    'effective_at' => now(),
                ]);
            }
        });

        return back()->with('success', 'Laboratory assignment(s) created and active successfully.');
    }

    /**
     * Add temporary coverage/reliever for an assignment.
     */
    public function addTemporaryCoverage(Request $request, LabInChargeAssignment $assignment): RedirectResponse
    {
        $validated = $request->validate([
            'reliever_user_id' => ['required', 'exists:users,id', 'different:assignment_user_id'],
            'effective_from' => ['required', 'date'],
            'effective_until' => ['required', 'date', 'after_or_equal:effective_from'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $admin = $request->user();
        $reliever = User::findOrFail($validated['reliever_user_id']);

        // Ensure reliever has Lab In-Charge role
        $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
        $reliever->roles()->syncWithoutDetaching([$role->id]);

        DB::transaction(function () use ($assignment, $validated, $admin, $reliever) {
            $prevStatus = $assignment->status;
            $assignment->update([
                'status' => 'Temporarily Covered',
                'reliever_user_id' => $reliever->id,
            ]);

            // Create temporary assignment record for reliever
            $tempAssignment = LabInChargeAssignment::updateOrCreate(
                [
                    'user_id' => $reliever->id,
                    'room_id' => $assignment->room_id,
                ],
                [
                    'academic_period_id' => $assignment->academic_period_id,
                    'role_type' => 'Temporary',
                    'shift_name' => $assignment->shift_name,
                    'shift_start_time' => $assignment->shift_start_time,
                    'shift_end_time' => $assignment->shift_end_time,
                    'assigned_days' => $assignment->assigned_days,
                    'effective_from' => $validated['effective_from'],
                    'effective_until' => $validated['effective_until'],
                    'is_active' => true,
                    'status' => 'Active',
                    'notes' => "Temporary coverage for {$assignment->user->name}. Reason: {$validated['reason']}",
                    'assigned_by_user_id' => $admin->id,
                ]
            );

            // Audit Trail
            LabInChargeAssignmentAudit::create([
                'assignment_id' => $assignment->id,
                'room_id' => $assignment->room_id,
                'previous_user_id' => $assignment->user_id,
                'new_user_id' => $reliever->id,
                'action_type' => 'Add Temporary Coverage',
                'role_type' => 'Temporary',
                'reason' => $validated['reason'],
                'performed_by_user_id' => $admin->id,
                'effective_at' => now(),
            ]);
        });

        return back()->with('success', "Temporary coverage for {$assignment->room->room_name} assigned to {$reliever->name}.");
    }

    /**
     * Reassign / Transfer responsibility of a laboratory to a new Lab In-Charge.
     */
    public function reassign(Request $request, LabInChargeAssignment $assignment): RedirectResponse
    {
        $validated = $request->validate([
            'new_user_id' => ['required', 'exists:users,id'],
            'role_type' => ['required', Rule::in(['Primary', 'Backup', 'Temporary'])],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $admin = $request->user();
        $newUser = User::findOrFail($validated['new_user_id']);
        $oldUser = $assignment->user;

        // Ensure new user has Lab In-Charge role
        $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
        $newUser->roles()->syncWithoutDetaching([$role->id]);

        DB::transaction(function () use ($assignment, $validated, $admin, $newUser, $oldUser) {
            // End old assignment
            $assignment->update([
                'is_active' => false,
                'status' => 'Ended',
                'notes' => ($assignment->notes ? $assignment->notes.' | ' : '')."Responsibility transferred to {$newUser->name}.",
            ]);

            // Create new assignment for new user
            $newAssignment = LabInChargeAssignment::updateOrCreate(
                [
                    'user_id' => $newUser->id,
                    'room_id' => $assignment->room_id,
                ],
                [
                    'academic_period_id' => $assignment->academic_period_id,
                    'role_type' => $validated['role_type'],
                    'shift_name' => $assignment->shift_name,
                    'shift_start_time' => $assignment->shift_start_time,
                    'shift_end_time' => $assignment->shift_end_time,
                    'assigned_days' => $assignment->assigned_days,
                    'effective_from' => now()->toDateString(),
                    'effective_until' => $assignment->effective_until,
                    'is_active' => true,
                    'status' => 'Active',
                    'notes' => "Reassigned from {$oldUser->name}. Reason: {$validated['reason']}",
                    'assigned_by_user_id' => $admin->id,
                ]
            );

            // Audit entry
            LabInChargeAssignmentAudit::create([
                'assignment_id' => $assignment->id,
                'room_id' => $assignment->room_id,
                'previous_user_id' => $oldUser->id,
                'new_user_id' => $newUser->id,
                'action_type' => 'Transfer Responsibility',
                'role_type' => $validated['role_type'],
                'reason' => $validated['reason'],
                'performed_by_user_id' => $admin->id,
                'effective_at' => now(),
            ]);
        });

        return back()->with('success', "Responsibility for {$assignment->room->room_name} transferred to {$newUser->name}.");
    }

    /**
     * Suspend an assignment temporarily.
     */
    public function suspend(Request $request, LabInChargeAssignment $assignment): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $admin = $request->user();

        $assignment->update([
            'is_active' => false,
            'status' => 'Suspended',
        ]);

        LabInChargeAssignmentAudit::create([
            'assignment_id' => $assignment->id,
            'room_id' => $assignment->room_id,
            'previous_user_id' => $assignment->user_id,
            'new_user_id' => null,
            'action_type' => 'Suspend Assignment',
            'role_type' => $assignment->role_type,
            'reason' => $validated['reason'],
            'performed_by_user_id' => $admin->id,
            'effective_at' => now(),
        ]);

        return back()->with('success', "Assignment for {$assignment->user->name} on {$assignment->room->room_name} suspended.");
    }

    /**
     * End an assignment formally without deleting historical monitoring ownership.
     */
    public function endAssignment(Request $request, LabInChargeAssignment $assignment): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $admin = $request->user();

        $assignment->update([
            'is_active' => false,
            'status' => 'Ended',
            'effective_until' => now()->toDateString(),
        ]);

        LabInChargeAssignmentAudit::create([
            'assignment_id' => $assignment->id,
            'room_id' => $assignment->room_id,
            'previous_user_id' => $assignment->user_id,
            'new_user_id' => null,
            'action_type' => 'End Assignment',
            'role_type' => $assignment->role_type,
            'reason' => $validated['reason'],
            'performed_by_user_id' => $admin->id,
            'effective_at' => now(),
        ]);

        return back()->with('success', 'Assignment ended. Historical records remain fully preserved.');
    }

    /**
     * Super Admin auditable correction / unlock for a monitoring session.
     */
    public function reopenMonitoringSession(Request $request, LabMonitoringSession $session): RedirectResponse
    {
        $validated = $request->validate([
            'correction_notes' => ['required', 'string', 'max:1000'],
        ]);

        $admin = $request->user();

        $session->update([
            'is_locked' => false,
            'correction_requested' => true,
            'correction_notes' => ($session->correction_notes ? $session->correction_notes."\n" : '').
                '['.now()->format('Y-m-d H:i')." Reopened by {$admin->name}]: ".$validated['correction_notes'],
        ]);

        return back()->with('success', 'Session record unlocked for auditable correction.');
    }
}
