<?php

namespace App\Http\Controllers\Institution;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Activity;
use App\Models\College;
use App\Models\Course;
use App\Models\Curriculum;
use App\Models\Faculty;
use App\Models\InstitutionAccessRequest;
use App\Models\InstitutionAuditLog;
use App\Models\InstitutionPolicyTemplate;
use App\Models\InstitutionSetting;
use App\Models\InstitutionWorkflowDefinition;
use App\Models\Permission;
use App\Models\Program;
use App\Models\Role;
use App\Models\Room;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use App\Services\PortalContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionGovernanceController extends Controller
{
    /**
     * Complete catalog of Velora modules controlled by the Institution Super Admin.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getModulesCatalog(): array
    {
        return [
            ['id' => 'scheduling', 'name' => 'Semester Scheduling & OR-Tools', 'category' => 'Academic Operations', 'icon' => 'CalendarDays', 'global_enabled' => true],
            ['id' => 'faculty_attendance', 'name' => 'Faculty Attendance & Reconciliation', 'category' => 'Faculty Governance', 'icon' => 'ClipboardCheck', 'global_enabled' => true],
            ['id' => 'lab_monitoring', 'name' => 'Facility & Lab Monitoring', 'category' => 'Facilities', 'icon' => 'SquareActivity', 'global_enabled' => true],
            ['id' => 'lab_inventory', 'name' => 'Laboratory Inventory & Assets', 'category' => 'Facilities', 'icon' => 'Monitor', 'global_enabled' => true],
            ['id' => 'compliance', 'name' => 'Compliance Submissions & Tracker', 'category' => 'Compliance', 'icon' => 'FileCheck', 'global_enabled' => true],
            ['id' => 'research_extension', 'name' => 'Research & Extension Tracking', 'category' => 'Evidence', 'icon' => 'BookOpen', 'global_enabled' => true],
            ['id' => 'projects_tasks', 'name' => 'Projects & Tasks Coordination', 'category' => 'Coordination', 'icon' => 'BookCheckIcon', 'global_enabled' => true],
            ['id' => 'accomplishments', 'name' => 'Accomplishment Portfolios', 'category' => 'Evidence', 'icon' => 'Award', 'global_enabled' => true],
            ['id' => 'exam_monitoring', 'name' => 'Exam Schedule & Conduct Monitoring', 'category' => 'Academic Operations', 'icon' => 'CalendarDays', 'global_enabled' => true],
            ['id' => 'make_up_classes', 'name' => 'Make-Up Class Recovery & Approvals', 'category' => 'Academic Operations', 'icon' => 'RefreshCw', 'global_enabled' => true],
            ['id' => 'tv_studio', 'name' => 'Campus TV Studio & Digital Signage', 'category' => 'Communications', 'icon' => 'Tv', 'global_enabled' => true],
            ['id' => 'performance', 'name' => 'Reports, Analytics & Recognition', 'category' => 'Analytics', 'icon' => 'Trophy', 'global_enabled' => true],
        ];
    }

    /**
     * Compute live structural & operational data quality / configuration health checks.
     *
     * @return array<int, array<string, mixed>>
     */
    private function computeHealthIssues(): array
    {
        $issues = [];

        $allUnits = College::with(['scopedRoles.role', 'entityScopedRoles.role', 'programs.curricula'])->get();
        $entities = $allUnits->where('type', 'Entity');
        $colleges = $allUnits->where('type', '!=', 'Entity');

        foreach ($entities as $ent) {
            $hasEntityAdmin = $ent->entityScopedRoles->contains(fn ($sr) => $sr->status === 'Active' && in_array($sr->role?->name, ['Entity Admin', 'Institution Super Admin']));
            if (! $hasEntityAdmin) {
                $issues[] = [
                    'id' => 'ent-no-admin-'.$ent->id,
                    'category' => 'Unassigned Administrator',
                    'severity' => 'warning',
                    'scope' => $ent->code,
                    'title' => "Entity '{$ent->code}' has no assigned Entity Admin",
                    'description' => "Campus entity {$ent->name} requires at least one Primary Entity Admin in Scoped Role Assignments.",
                    'action_url' => '/institution/scoped-roles',
                    'action_label' => 'Assign Entity Admin',
                ];
            }
        }

        foreach ($colleges as $col) {
            $hasCollegeAdmin = $col->scopedRoles->contains(fn ($sr) => $sr->status === 'Active' && in_array($sr->role?->name, ['College Admin', 'System Administrator']));
            if (! $hasCollegeAdmin) {
                $issues[] = [
                    'id' => 'col-no-admin-'.$col->id,
                    'category' => 'College Without Admin',
                    'severity' => 'critical',
                    'scope' => $col->code,
                    'title' => "College '{$col->code}' has no active College Admin",
                    'description' => "{$col->name} does not have an active College Admin bound in Scoped Role Assignments.",
                    'action_url' => '/institution/scoped-roles',
                    'action_label' => 'Bind College Admin',
                ];
            }

            if ($col->setup_progress < 100 || in_array($col->status, ['Not Configured', 'In Setup'])) {
                $issues[] = [
                    'id' => 'col-incomplete-'.$col->id,
                    'category' => 'Incomplete Configuration',
                    'severity' => $col->setup_progress < 50 ? 'critical' : 'warning',
                    'scope' => $col->code,
                    'title' => "College '{$col->code}' onboarding incomplete ({$col->setup_progress}%)",
                    'description' => "Currently at stage '{$col->setup_stage}' with status '{$col->status}'. Complete guided onboarding before full launch.",
                    'action_url' => "/institution/colleges/setup?college={$col->id}",
                    'action_label' => 'Complete Setup',
                ];
            }

            if (! $col->parent_id) {
                $issues[] = [
                    'id' => 'col-orphan-'.$col->id,
                    'category' => 'Orphaned Organizational Unit',
                    'severity' => 'warning',
                    'scope' => $col->code,
                    'title' => "College '{$col->code}' is not linked to a Parent Entity/Campus",
                    'description' => 'Every college must belong to a parent Campus/Entity in the Organization Structure Tree.',
                    'action_url' => '/institution/colleges',
                    'action_label' => 'Link Parent Entity',
                ];
            }
        }

        // Programs without active curricula
        $programsWithoutCurricula = Program::withCount(['curricula as active_curricula_count' => fn ($q) => $q->where('status', 'Active')])
            ->get()
            ->filter(fn ($p) => $p->active_curricula_count === 0);

        foreach ($programsWithoutCurricula as $prog) {
            $issues[] = [
                'id' => 'prog-no-curr-'.$prog->id,
                'category' => 'Program Governance',
                'severity' => 'warning',
                'scope' => $prog->code,
                'title' => "Program '{$prog->code}' has no active curriculum",
                'description' => "Degree program {$prog->name} requires an active curriculum before course offerings can be generated.",
                'action_url' => '/programs',
                'action_label' => 'Inspect Program',
            ];
        }

        // Expired scoped roles still marked Active
        $expiredRolesCount = ScopedRoleAssignment::where('status', 'Active')
            ->whereNotNull('effective_until')
            ->whereDate('effective_until', '<', now()->toDateString())
            ->count();

        if ($expiredRolesCount > 0) {
            $issues[] = [
                'id' => 'expired-roles',
                'category' => 'Expired Authority',
                'severity' => 'critical',
                'scope' => 'Institution-Wide',
                'title' => "{$expiredRolesCount} Scoped Role Assignment(s) past effective end date",
                'description' => 'Temporary or term-bounded role assignments have passed their effective_until date and should be expired.',
                'action_url' => '/institution/scoped-roles',
                'action_label' => 'Review Assignments',
            ];
        }

        // Active Academic Period check
        $activePeriod = AcademicPeriod::where('is_current', true)->orWhere('status', 'Active')->first();
        if (! $activePeriod || ! $activePeriod->class_start_date || ! $activePeriod->class_end_date) {
            $issues[] = [
                'id' => 'period-dates-missing',
                'category' => 'Academic Period Boundary',
                'severity' => 'critical',
                'scope' => 'Institution-Wide',
                'title' => 'Active Academic Period is missing official class boundary dates',
                'description' => 'Attendance, scheduling, and workload modules require verified class start and end dates.',
                'action_url' => '/administration/academic-periods',
                'action_label' => 'Configure Period',
            ];
        }

        return $issues;
    }

    /**
     * 1. Institution Super Admin Dashboard: Central Platform Governor & Organizational Architect Overview
     */
    public function dashboard(Request $request): Response
    {
        $allUnits = College::with(['parent', 'children', 'programs', 'scopedRoles.user', 'scopedRoles.role', 'entityScopedRoles.user', 'entityScopedRoles.role'])->get();
        $entities = $allUnits->where('type', 'Entity')->values();
        $colleges = $allUnits->where('type', '!=', 'Entity')->values();

        // Auto-expire any scoped role assignments whose effective_until has passed
        ScopedRoleAssignment::where('status', 'Active')
            ->whereNotNull('effective_until')
            ->whereDate('effective_until', '<', now()->toDateString())
            ->update(['status' => 'Expired']);

        $totalEntities = $entities->count();
        $activeEntities = $entities->where('status', 'Active')->count();
        $totalColleges = $colleges->count();
        $activeColleges = $colleges->where('status', 'Active')->count();
        $inSetupColleges = $colleges->where('status', 'In Setup')->count();
        $notConfiguredColleges = $colleges->where('status', 'Not Configured')->count();
        $readyColleges = $colleges->where('status', 'Ready')->count();

        $totalPrograms = Program::count();
        $totalUsers = User::count();
        $activeUsers = User::where('account_status', 'Active')->count();
        $suspendedUsers = User::whereIn('account_status', ['Suspended', 'Locked', 'Archived'])->count();
        $totalRoles = Role::count();
        $scopedRolesCount = ScopedRoleAssignment::where('status', 'Active')->count();
        $pendingAccessRequests = InstitutionAccessRequest::where('status', 'Pending')->count();
        $activeAcademicPeriods = AcademicPeriod::where('status', 'Active')->orWhere('is_current', true)->count();

        $featureFlags = InstitutionSetting::getVal('feature_flags', []);
        $integrations = InstitutionSetting::getVal('integrations_status', []);
        $terminology = InstitutionSetting::getVal('terminology_overrides', []);
        $modulesCatalog = $this->getModulesCatalog();
        $enabledModulesCount = collect($modulesCatalog)->where('global_enabled', true)->count();

        $healthIssues = $this->computeHealthIssues();
        $auditLogs = InstitutionAuditLog::latest()->take(8)->get();

        $recentChanges = $auditLogs->map(fn (InstitutionAuditLog $log) => [
            'id' => $log->id,
            'module' => $log->module,
            'action' => "{$log->action}: {$log->target_name}",
            'target' => $log->college_scope ?: ($log->entity_scope ?: 'Institution-Wide'),
            'actor' => $log->actor_name,
            'reason' => $log->reason,
            'timestamp' => $log->created_at?->diffForHumans() ?? 'Recently',
            'severity' => $log->severity,
        ]);

        $platformHealth = [
            'uptime' => '99.98%',
            'api_gateway' => 'Operational',
            'llm_status' => 'Google Gemini 2.5 Flash Online',
            'storage_used' => '14.2 GB / 100 GB (Shared Drive)',
            'unresolved_syncs' => 0,
            'audit_alerts' => collect($healthIssues)->where('severity', 'critical')->count(),
            'data_quality_score' => max(60, 100 - (count($healthIssues) * 3)),
        ];

        return Inertia::render('institution/dashboard', [
            'entities' => $entities,
            'colleges' => $colleges,
            'stats' => [
                'total_entities' => $totalEntities,
                'active_entities' => $activeEntities,
                'total_colleges' => $totalColleges,
                'active_colleges' => $activeColleges,
                'in_setup_colleges' => $inSetupColleges,
                'not_configured_colleges' => $notConfiguredColleges,
                'ready_colleges' => $readyColleges,
                'total_programs' => $totalPrograms,
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'suspended_users' => $suspendedUsers,
                'total_roles' => $totalRoles,
                'scoped_assignments' => $scopedRolesCount,
                'pending_access_requests' => $pendingAccessRequests,
                'active_academic_periods' => $activeAcademicPeriods,
                'enabled_modules_count' => $enabledModulesCount,
                'total_modules_count' => count($modulesCatalog),
                'health_issues_count' => count($healthIssues),
            ],
            'platform_health' => $platformHealth,
            'health_issues' => array_slice($healthIssues, 0, 6),
            'feature_flags' => $featureFlags,
            'integrations' => $integrations,
            'terminology' => $terminology,
            'recent_changes' => $recentChanges,
        ]);
    }

    /**
     * 2. Organization Management: Entities/Campuses, Colleges, Hierarchy & Structure Tree
     */
    public function colleges(Request $request): Response
    {
        $allUnits = College::with([
            'parent',
            'children',
            'programs',
            'scopedRoles.user',
            'scopedRoles.role',
            'entityScopedRoles.user',
            'entityScopedRoles.role',
        ])->orderBy('type', 'desc')->orderBy('code')->get();

        $entities = $allUnits->where('type', 'Entity')->values();
        $colleges = $allUnits->where('type', '!=', 'Entity')->values();
        $users = User::select('id', 'name', 'email', 'institutional_id')->orderBy('name')->get();
        $modulesCatalog = $this->getModulesCatalog();
        $unitHistory = InstitutionAuditLog::where('module', 'Organization')->latest()->take(15)->get();

        return Inertia::render('institution/colleges/index', [
            'entities' => $entities,
            'colleges' => $colleges,
            'allUnits' => $allUnits,
            'users' => $users,
            'modulesCatalog' => $modulesCatalog,
            'unitHistory' => $unitHistory,
            'initialView' => $request->query('view', 'tree'),
        ]);
    }

    /**
     * Create a new Entity (Campus) or College
     */
    public function storeCollege(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->isInstitutionSuperAdmin(), 403, 'Only the Institution Super Admin can create Entities or Colleges.');

        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:colleges,code',
            'name' => 'required|string|max:255',
            'acronym' => 'nullable|string|max:20',
            'type' => 'required|string|in:Entity,College,Campus,School,Institute,Department',
            'entity_type' => 'nullable|string|in:Main Campus,Satellite Campus,Extension Campus,Custom',
            'parent_id' => 'nullable|exists:colleges,id',
            'dean_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'contact_phone' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:Not Configured,In Setup,Ready,Active,Suspended,Archived',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
            'color_theme' => 'nullable|string|in:amber,blue,emerald,indigo,purple,rose',
            'entity_tv_enabled' => 'nullable|boolean',
            'allow_local_overrides' => 'nullable|boolean',
            'enabled_modules' => 'nullable|array',
            'admin_user_id' => 'nullable|exists:users,id',
        ]);

        $isEntity = $validated['type'] === 'Entity';

        $unit = College::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'acronym' => $validated['acronym'] ?: strtoupper($validated['code']),
            'type' => $validated['type'],
            'entity_type' => $isEntity ? ($validated['entity_type'] ?? 'Satellite Campus') : null,
            'parent_id' => $validated['parent_id'] ?? null,
            'dean_name' => $validated['dean_name'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'address' => $validated['address'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
            'status' => $validated['status'] ?? ($isEntity ? 'Active' : 'In Setup'),
            'effective_from' => $validated['effective_from'] ?? now()->toDateString(),
            'effective_until' => $validated['effective_until'] ?? null,
            'setup_stage' => $isEntity ? 'Active' : 'Identity',
            'setup_progress' => $isEntity ? 100 : 25,
            'color_theme' => $validated['color_theme'] ?? 'amber',
            'entity_tv_enabled' => $validated['entity_tv_enabled'] ?? true,
            'allow_local_overrides' => $validated['allow_local_overrides'] ?? true,
            'enabled_modules' => $validated['enabled_modules'] ?? [
                'scheduling' => true,
                'faculty_attendance' => true,
                'compliance' => true,
            ],
        ]);

        // Optionally bind initial Entity Admin or College Admin
        if (! empty($validated['admin_user_id'])) {
            $roleName = $isEntity ? 'Entity Admin' : 'College Admin';
            $role = Role::firstOrCreate(['name' => $roleName]);
            ScopedRoleAssignment::firstOrCreate([
                'user_id' => $validated['admin_user_id'],
                'role_id' => $role->id,
                'entity_id' => $isEntity ? $unit->id : $unit->parent_id,
                'college_id' => $isEntity ? null : $unit->id,
            ], [
                'institution' => 'Davao Del Sur State College',
                'scope_level' => $isEntity ? 'Entity' : 'College',
                'designation_type' => 'Primary',
                'effective_from' => now()->toDateString(),
                'status' => 'Active',
                'notes' => "Assigned during {$unit->code} creation",
                'assigned_by_user_id' => $request->user()?->id,
            ]);
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: $isEntity ? 'Created Campus Entity' : 'Created College Unit',
            targetName: "{$unit->name} ({$unit->code})",
            actor: $request->user(),
            previousValue: null,
            newValue: $unit->only(['code', 'name', 'type', 'entity_type', 'parent_id', 'status']),
            reason: 'Organizational unit registered by Institution Super Admin.',
            severity: 'success',
            entityScope: $isEntity ? $unit->code : $unit->parent?->code,
            collegeScope: $isEntity ? null : $unit->code,
            targetType: $unit->type,
        );

        return back()->with('success', "{$unit->type} '{$unit->code}' created and registered in the organization tree.");
    }

    /**
     * Move, Archive, Deactivate, or Structurally Reorganize an Entity or College
     */
    public function reorganizeCollege(Request $request, College $college): RedirectResponse
    {
        abort_unless($request->user()?->isInstitutionSuperAdmin(), 403, 'Only the Institution Super Admin can reorganize, move, or archive Entities and Colleges.');

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:colleges,id',
            'status' => 'required|string|in:Not Configured,In Setup,Ready,Active,Suspended,Archived',
            'entity_tv_enabled' => 'nullable|boolean',
            'allow_local_overrides' => 'nullable|boolean',
            'reason' => 'nullable|string|max:500',
        ]);

        $prev = $college->only(['parent_id', 'status', 'entity_tv_enabled', 'allow_local_overrides']);

        $college->update([
            'parent_id' => $validated['parent_id'] ?? $college->parent_id,
            'status' => $validated['status'],
            'entity_tv_enabled' => $validated['entity_tv_enabled'] ?? $college->entity_tv_enabled,
            'allow_local_overrides' => $validated['allow_local_overrides'] ?? $college->allow_local_overrides,
        ]);

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Structurally Reorganized Unit',
            targetName: "{$college->name} ({$college->code})",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $college->only(['parent_id', 'status', 'entity_tv_enabled', 'allow_local_overrides']),
            reason: $validated['reason'] ?? 'Organizational structure updated by Institution Super Admin.',
            severity: $validated['status'] === 'Archived' || $validated['status'] === 'Suspended' ? 'warning' : 'info',
            entityScope: $college->type === 'Entity' ? $college->code : $college->parent?->code,
            collegeScope: $college->type !== 'Entity' ? $college->code : null,
            targetType: $college->type,
        );

        return back()->with('success', "Organizational unit '{$college->code}' updated and logged in audit trail.");
    }

    /**
     * Update College / Entity details
     */
    public function updateCollege(Request $request, College $college): RedirectResponse
    {
        abort_unless($request->user()?->isInstitutionSuperAdmin(), 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'dean_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'contact_phone' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:colleges,id',
            'status' => 'required|string|in:Not Configured,In Setup,Ready,Active,Suspended,Archived',
        ]);

        $prev = $college->only(array_keys($validated));
        $college->update($validated);

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Updated Unit Metadata',
            targetName: "{$college->name} ({$college->code})",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated,
            reason: 'Updated unit profile & organizational parent.',
            severity: 'info',
            collegeScope: $college->code,
            targetType: $college->type,
        );

        return back()->with('success', "Updated {$college->code} configuration.");
    }

    /**
     * College Setup & Guided Configuration Workspace
     */
    public function collegeSetup(Request $request, ?College $college = null): Response
    {
        $allColleges = College::with('parent')->orderBy('type')->orderBy('code')->get();
        $targetCollegeId = $request->query('college');
        $targetCollege = $college
            ?? ($targetCollegeId ? $allColleges->firstWhere('id', (int) $targetCollegeId) : null)
            ?? $allColleges->where('type', '!=', 'Entity')->first()
            ?? $allColleges->first();

        // Load programs with curricula count, year levels and program head
        $programs = [];
        $otherCollegesPrograms = [];
        $candidateProgramHeads = [];
        $facilities = [];
        $otherCollegesFacilities = [];

        if ($targetCollege) {
            $programs = Program::where('college_id', $targetCollege->id)
                ->with(['curricula'])
                ->get()
                ->map(function ($prog) {
                    $progHeadAssignment = ScopedRoleAssignment::with('user')
                        ->where('program_id', $prog->id)
                        ->where('status', 'Active')
                        ->whereHas('role', fn ($q) => $q->whereIn('name', ['Program Head', 'Program Chair']))
                        ->first();

                    $activeCurriculum = $prog->curricula->firstWhere('status', 'Active') ?? $prog->curricula->first();

                    return [
                        'id' => $prog->id,
                        'college_id' => $prog->college_id,
                        'code' => $prog->code,
                        'name' => $prog->name,
                        'degree_level' => $prog->degree_level,
                        'department' => $prog->department,
                        'duration_years' => $prog->duration_years,
                        'year_levels' => $prog->duration_years, // standard mapping
                        'status' => $prog->status,
                        'description' => $prog->description,
                        'program_head' => $progHeadAssignment ? [
                            'user_id' => $progHeadAssignment->user?->id,
                            'name' => $progHeadAssignment->user?->name,
                            'email' => $progHeadAssignment->user?->email,
                        ] : null,
                        'curriculum_status' => $activeCurriculum ? 'Active ('.$activeCurriculum->version_name.')' : 'Not Configured',
                        'has_curriculum' => (bool) $activeCurriculum,
                    ];
                });

            // Potential candidate program heads (Users who are faculty, coordinators, chairs, or leaders)
            $candidateProgramHeads = User::where('is_active', true)
                ->where('status', '!=', 'Suspended')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'avatar', 'profile_photo_url']);

            // Programs from other colleges that can be copied/templated
            $otherCollegesPrograms = Program::where('college_id', '!=', $targetCollege->id)
                ->with('college:id,name,code')
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'college_id' => $p->college_id,
                    'college_code' => $p->college?->code,
                    'college_name' => $p->college?->name,
                    'code' => $p->code,
                    'name' => $p->name,
                    'degree_level' => $p->degree_level,
                    'duration_years' => $p->duration_years,
                ]);

            // Stage 6: College Facilities (Rooms)
            $facilities = Room::where('college_id', $targetCollege->id)
                ->orderBy('room_name')
                ->get()
                ->map(function ($room) {
                    $hasSchedulingBaseline = ! empty($room->capacity) && $room->capacity > 0 && ! empty($room->type);
                    $readiness = $room->setup_readiness ?: ($hasSchedulingBaseline ? 'Ready' : 'Incomplete');

                    return [
                        'id' => $room->id,
                        'college_id' => $room->college_id,
                        'facility_code' => $room->room_code ?: $room->room_name,
                        'facility_name' => $room->room_name,
                        'facility_type' => $room->type,
                        'custom_type' => $room->custom_type,
                        'building' => $room->building ?: 'Main Campus',
                        'floor' => $room->floor ?: 'Ground Floor',
                        'capacity' => (int) $room->capacity,
                        'is_shared' => (bool) $room->is_shared,
                        'status' => $room->status ?: 'Available',
                        'condition' => $room->condition ?: 'Good',
                        'operational_status' => $room->operational_status ?: 'Available',
                        'setup_readiness' => $readiness,
                        'operating_hours' => $room->operating_hours ?: '7:00 AM - 7:00 PM',
                        'supported_activities' => $room->supported_activities ?: ['Lecture', 'Laboratory'],
                        'capabilities' => $room->capabilities ?: [
                            'has_projector' => false,
                            'num_workstations' => 0,
                            'internet_type' => 'Campus Wi-Fi',
                            'specialized_software' => [],
                            'has_aircon' => true,
                            'power_redundancy' => 'Standard Grid',
                            'specialized_equipment' => '',
                        ],
                        'is_accessible' => (bool) $room->is_accessible,
                        'notes' => $room->notes,
                    ];
                });

            // Facilities from other colleges for copying / templating
            $otherCollegesFacilities = Room::where('college_id', '!=', $targetCollege->id)
                ->with('college:id,name,code')
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'college_id' => $r->college_id,
                    'college_code' => $r->college?->code,
                    'college_name' => $r->college?->name,
                    'facility_code' => $r->room_code ?: $r->room_name,
                    'facility_name' => $r->room_name,
                    'facility_type' => $r->type,
                    'building' => $r->building,
                    'floor' => $r->floor,
                    'capacity' => (int) $r->capacity,
                    'condition' => $r->condition ?: 'Good',
                    'status' => $r->status ?: 'Available',
                ]);
        }

        return Inertia::render('institution/colleges/setup', [
            'colleges' => $allColleges,
            'currentCollege' => $targetCollege,
            'modulesCatalog' => $this->getModulesCatalog(),
            'initialStage' => $request->query('stage'),
            'programs' => $programs,
            'candidateProgramHeads' => $candidateProgramHeads,
            'otherCollegesPrograms' => $otherCollegesPrograms,
            'facilities' => $facilities,
            'otherCollegesFacilities' => $otherCollegesFacilities,
        ]);
    }

    /**
     * Update Setup Stage / Progress & Branding / Identity for a College
     */
    public function updateCollegeSetup(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'setup_stage' => 'required|string',
            'setup_progress' => 'required|integer|min:0|max:100',
            'status' => 'required|string|in:Not Configured,In Setup,Ready,Active,Suspended,Archived',
            'enabled_modules' => 'nullable|array',
            'allow_local_overrides' => 'nullable|boolean',
            'entity_tv_enabled' => 'nullable|boolean',
            // Identity & Branding fields
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:30|unique:colleges,code,'.$college->id,
            'acronym' => 'nullable|string|max:30',
            'dean_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:500',
            'color_theme' => 'nullable|string|max:50',
            'primary_color' => 'nullable|string|max:30',
            'secondary_color' => 'nullable|string|max:30',
            'accent_color' => 'nullable|string|max:30',
            'surface_color' => 'nullable|string|max:30',
            'preset_key' => 'nullable|string|max:30',
            'slogan' => 'nullable|string|max:255',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:4096',
            'remove_logo' => 'nullable|boolean',
        ]);

        $prev = $college->only([
            'name',
            'code',
            'acronym',
            'dean_name',
            'contact_email',
            'setup_stage',
            'setup_progress',
            'status',
            'enabled_modules',
            'color_theme',
            'logo_url',
            'report_defaults',
        ]);

        $updatePayload = [
            'setup_stage' => $validated['setup_stage'],
            'setup_progress' => $validated['setup_progress'],
            'status' => $validated['status'],
        ];

        if (array_key_exists('enabled_modules', $validated) && is_array($validated['enabled_modules'])) {
            $updatePayload['enabled_modules'] = $validated['enabled_modules'];
        }
        if (array_key_exists('allow_local_overrides', $validated) && $validated['allow_local_overrides'] !== null) {
            $updatePayload['allow_local_overrides'] = (bool) $validated['allow_local_overrides'];
        }
        if (array_key_exists('entity_tv_enabled', $validated) && $validated['entity_tv_enabled'] !== null) {
            $updatePayload['entity_tv_enabled'] = (bool) $validated['entity_tv_enabled'];
        }
        if (! empty($validated['name'])) {
            $updatePayload['name'] = $validated['name'];
        }
        if (! empty($validated['code'])) {
            $updatePayload['code'] = strtoupper($validated['code']);
        }
        if (! empty($validated['acronym'])) {
            $updatePayload['acronym'] = strtoupper($validated['acronym']);
        } elseif (! empty($validated['code'])) {
            $updatePayload['acronym'] = strtoupper($validated['code']);
        }
        if (array_key_exists('dean_name', $validated)) {
            $updatePayload['dean_name'] = $validated['dean_name'];
        }
        if (array_key_exists('contact_email', $validated)) {
            $updatePayload['contact_email'] = $validated['contact_email'];
        }
        if (array_key_exists('contact_phone', $validated)) {
            $updatePayload['contact_phone'] = $validated['contact_phone'];
        }
        if (array_key_exists('address', $validated)) {
            $updatePayload['address'] = $validated['address'];
        }
        if (! empty($validated['color_theme'])) {
            $updatePayload['color_theme'] = $validated['color_theme'];
        }

        // Handle College Logo Upload or Removal
        if ($request->boolean('remove_logo')) {
            $updatePayload['logo_url'] = null;
        } elseif ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $safeCode = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', $updatePayload['code'] ?? $college->code));
            $filename = "college_{$safeCode}_".time().'.'.$file->getClientOriginalExtension();
            $uploadDir = public_path('uploads/colleges');
            if (! is_dir($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }
            $file->move($uploadDir, $filename);
            $updatePayload['logo_url'] = '/uploads/colleges/'.$filename;
        }

        // Persist Branding & Theme Colors inside report_defaults.branding
        $reportDefaults = is_array($college->report_defaults) ? $college->report_defaults : [];
        $currentBranding = $college->branding;

        $reportDefaults['branding'] = [
            'primary_color' => $validated['primary_color'] ?? $currentBranding['primary_color'],
            'secondary_color' => $validated['secondary_color'] ?? $currentBranding['secondary_color'],
            'accent_color' => $validated['accent_color'] ?? $currentBranding['accent_color'],
            'surface_color' => $validated['surface_color'] ?? $currentBranding['surface_color'],
            'preset_key' => $validated['preset_key'] ?? ($validated['color_theme'] ?? $currentBranding['preset_key']),
            'slogan' => array_key_exists('slogan', $validated) && $validated['slogan'] !== null
                ? $validated['slogan']
                : $currentBranding['slogan'],
        ];
        $updatePayload['report_defaults'] = $reportDefaults;

        $college->update($updatePayload);

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Updated College Branding & Guided Onboarding',
            targetName: "{$college->code} ({$validated['setup_stage']} · {$validated['setup_progress']}%)",
            actor: $request->user(),
            previousValue: $prev,
            newValue: collect($updatePayload)->except('logo')->toArray(),
            reason: "College configuration and branding updated at stage {$validated['setup_stage']}.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'College',
        );

        return back()->with('success', "Branding and setup configuration saved for {$college->code}.");
    }

    /**
     * Store a new program specifically during College Setup (Stage 5)
     */
    public function storeCollegeProgram(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:programs,code',
            'name' => 'required|string|max:255',
            'degree_level' => 'required|string|max:100',
            'department' => 'nullable|string|max:255',
            'duration_years' => 'required|integer|min:1|max:8',
            'program_head_id' => 'nullable|exists:users,id',
            'effective_academic_year' => 'nullable|string|max:50',
            'status' => 'required|string|in:Active,Inactive,Phased Out',
            'notes' => 'nullable|string',
        ]);

        $program = Program::create([
            'college_id' => $college->id,
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'degree_level' => $validated['degree_level'],
            'department' => $validated['department'] ?: $college->name,
            'duration_years' => $validated['duration_years'],
            'status' => $validated['status'],
            'description' => $validated['notes'] ?? null,
        ]);

        // If Program Head is selected, assign ScopedRoleAssignment
        if (! empty($validated['program_head_id'])) {
            $progHeadRole = Role::firstOrCreate(['name' => 'Program Head'], [
                'tier' => 'Operational',
                'scope_level' => 'Program',
                'description' => 'Academic leadership for a degree program',
            ]);

            ScopedRoleAssignment::updateOrCreate(
                [
                    'program_id' => $program->id,
                    'role_id' => $progHeadRole->id,
                    'status' => 'Active',
                ],
                [
                    'user_id' => $validated['program_head_id'],
                    'college_id' => $college->id,
                    'scope_level' => 'Program',
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'Setup Stage 5 Program Head Assignment',
                    'effective_from' => now()->toDateString(),
                    'assigned_by_user_id' => $request->user()?->id,
                ]
            );
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Created Program during College Onboarding',
            targetName: "{$program->code} - {$program->name} ({$college->code})",
            actor: $request->user(),
            previousValue: null,
            newValue: $program->toArray(),
            reason: "Program {$program->code} added to {$college->code} during onboarding.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Program',
        );

        return back()->with('success', "Program {$program->code} established successfully.");
    }

    /**
     * Update an existing program from College Setup (Stage 5)
     */
    public function updateCollegeProgram(Request $request, College $college, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:programs,code,'.$program->id,
            'name' => 'required|string|max:255',
            'degree_level' => 'required|string|max:100',
            'department' => 'nullable|string|max:255',
            'duration_years' => 'required|integer|min:1|max:8',
            'program_head_id' => 'nullable',
            'status' => 'required|string|in:Active,Inactive,Phased Out',
            'notes' => 'nullable|string',
        ]);

        $prev = $program->toArray();

        $program->update([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'degree_level' => $validated['degree_level'],
            'department' => $validated['department'] ?: $college->name,
            'duration_years' => $validated['duration_years'],
            'status' => $validated['status'],
            'description' => $validated['notes'] ?? $program->description,
        ]);

        $progHeadRole = Role::firstOrCreate(['name' => 'Program Head'], [
            'tier' => 'Operational',
            'scope_level' => 'Program',
            'description' => 'Academic leadership for a degree program',
        ]);

        if (! empty($validated['program_head_id'])) {
            ScopedRoleAssignment::updateOrCreate(
                [
                    'program_id' => $program->id,
                    'role_id' => $progHeadRole->id,
                    'status' => 'Active',
                ],
                [
                    'user_id' => (int) $validated['program_head_id'],
                    'college_id' => $college->id,
                    'scope_level' => 'Program',
                    'designation_type' => 'Primary',
                    'assigned_by_user_id' => $request->user()?->id,
                ]
            );
        } elseif ($validated['program_head_id'] === null || $validated['program_head_id'] === '' || $validated['program_head_id'] === 0) {
            // Unassign
            ScopedRoleAssignment::where('program_id', $program->id)
                ->where('role_id', $progHeadRole->id)
                ->delete();
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Updated Program from College Setup',
            targetName: "{$program->code} ({$college->code})",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $program->toArray(),
            reason: "Program {$program->code} updated in Stage 5 onboarding.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Program',
        );

        return back()->with('success', "Program {$program->code} updated successfully.");
    }

    /**
     * Delete a program from College Setup (Stage 5)
     */
    public function destroyCollegeProgram(Request $request, College $college, Program $program): RedirectResponse
    {
        $code = $program->code;
        $name = $program->name;

        // Remove ScopedRoleAssignments for this program
        ScopedRoleAssignment::where('program_id', $program->id)->delete();

        // Disassociate related models
        $program->curricula()->delete();
        $program->courses()->update(['program_id' => null]);
        $program->sections()->update(['program_id' => null]);
        $program->courseOfferings()->update(['program_id' => null]);
        $program->faculties()->update(['program_id' => null]);

        $program->delete();

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Removed Program from College Onboarding',
            targetName: "{$code} - {$name} ({$college->code})",
            actor: $request->user(),
            previousValue: null,
            newValue: null,
            reason: "Program {$code} deleted during Stage 5 onboarding.",
            severity: 'warning',
            collegeScope: $college->code,
            targetType: 'Program',
        );

        return back()->with('success', "Program {$code} removed successfully.");
    }

    /**
     * Bulk Import Programs via parsed CSV records (Stage 5)
     */
    public function bulkImportCollegePrograms(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'programs' => 'required|array|min:1',
            'programs.*.program_code' => 'required|string|max:30',
            'programs.*.program_name' => 'required|string|max:255',
            'programs.*.degree_level' => 'nullable|string|max:100',
            'programs.*.department' => 'nullable|string|max:255',
            'programs.*.duration_years' => 'nullable|integer|min:1|max:8',
            'programs.*.program_head_email' => 'nullable|string|max:255',
            'programs.*.status' => 'nullable|string|in:Active,Inactive,Phased Out',
        ]);

        $progHeadRole = Role::firstOrCreate(['name' => 'Program Head'], [
            'tier' => 'Operational',
            'scope_level' => 'Program',
            'description' => 'Academic leadership for a degree program',
        ]);

        $createdCount = 0;
        $updatedCount = 0;

        foreach ($validated['programs'] as $row) {
            $code = strtoupper(trim($row['program_code']));
            $name = trim($row['program_name']);
            $degreeLevel = ! empty($row['degree_level']) ? trim($row['degree_level']) : "Bachelor's Degree";
            $department = ! empty($row['department']) ? trim($row['department']) : $college->name;
            $durationYears = ! empty($row['duration_years']) ? (int) $row['duration_years'] : 4;
            $status = ! empty($row['status']) ? $row['status'] : 'Active';

            $program = Program::where('code', $code)->first();

            if ($program) {
                $program->update([
                    'college_id' => $college->id,
                    'name' => $name,
                    'degree_level' => $degreeLevel,
                    'department' => $department,
                    'duration_years' => $durationYears,
                    'status' => $status,
                ]);
                $updatedCount++;
            } else {
                $program = Program::create([
                    'college_id' => $college->id,
                    'code' => $code,
                    'name' => $name,
                    'degree_level' => $degreeLevel,
                    'department' => $department,
                    'duration_years' => $durationYears,
                    'status' => $status,
                ]);
                $createdCount++;
            }

            // Match Program Head by email if supplied
            if (! empty($row['program_head_email'])) {
                $user = User::where('email', trim($row['program_head_email']))->first();
                if ($user) {
                    ScopedRoleAssignment::updateOrCreate(
                        [
                            'program_id' => $program->id,
                            'role_id' => $progHeadRole->id,
                            'status' => 'Active',
                        ],
                        [
                            'user_id' => $user->id,
                            'college_id' => $college->id,
                            'scope_level' => 'Program',
                            'designation_type' => 'Primary',
                            'assigned_by_user_id' => $request->user()?->id,
                        ]
                    );
                }
            }
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Bulk Imported Programs via CSV',
            targetName: "{$college->code} ({$createdCount} added, {$updatedCount} updated)",
            actor: $request->user(),
            previousValue: null,
            newValue: ['created' => $createdCount, 'updated' => $updatedCount],
            reason: "Bulk imported {$createdCount} new program(s) and updated {$updatedCount} program(s) from CSV.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Program',
        );

        return back()->with('success', "Import completed: {$createdCount} program(s) created, {$updatedCount} updated.");
    }

    /**
     * Copy programs from an existing college template (Stage 5)
     */
    public function copyProgramsFromTemplate(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'source_program_ids' => 'required|array|min:1',
            'source_program_ids.*' => 'required|exists:programs,id',
        ]);

        $sources = Program::whereIn('id', $validated['source_program_ids'])->get();
        $copiedCount = 0;

        foreach ($sources as $src) {
            $targetCode = $src->code;

            // Check if already in this college
            $existsInCollege = Program::where('college_id', $college->id)->where('code', $targetCode)->exists();
            if ($existsInCollege) {
                continue;
            }

            // If code exists globally in another college, append a campus/college modifier if needed or keep if unique
            if (Program::where('code', $targetCode)->exists()) {
                $targetCode = "{$src->code}-{$college->code}";
            }

            Program::create([
                'college_id' => $college->id,
                'code' => $targetCode,
                'name' => $src->name,
                'degree_level' => $src->degree_level,
                'department' => $college->name,
                'duration_years' => $src->duration_years,
                'status' => 'Active',
                'description' => "Cloned from {$src->code} baseline definition during College Setup.",
            ]);

            $copiedCount++;
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Copied Programs from Existing Template',
            targetName: "{$college->code} ({$copiedCount} programs)",
            actor: $request->user(),
            previousValue: null,
            newValue: ['copied_count' => $copiedCount],
            reason: "Copied {$copiedCount} program blueprint(s) into {$college->code}.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Program',
        );

        return back()->with('success', "Successfully copied {$copiedCount} program blueprint(s) into {$college->code}.");
    }

    /**
     * Update Stage 5 Programs settings (e.g. allow college admin to modify definitions, require head)
     */
    public function updateProgramsSettings(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'allow_admin_modify_programs' => 'nullable|boolean',
            'require_head_before_activation' => 'nullable|boolean',
        ]);

        $inheritance = is_array($college->inheritance_settings) ? $college->inheritance_settings : [];
        $inheritance['allow_admin_modify_programs'] = $request->boolean('allow_admin_modify_programs', true);
        $inheritance['require_head_before_activation'] = $request->boolean('require_head_before_activation', false);

        $college->update([
            'inheritance_settings' => $inheritance,
        ]);

        return back()->with('success', "Program governance settings updated for {$college->code}.");
    }

    /**
     * Store a new facility for a college (Stage 6)
     */
    public function storeCollegeFacility(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'facility_code' => 'required|string|max:50',
            'facility_name' => 'required|string|max:150',
            'facility_type' => 'required|string|max:100',
            'custom_type' => 'nullable|string|max:100',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:0|max:1000',
            'is_shared' => 'nullable|boolean',
            'status' => 'required|string|in:Available,In Use,Maintenance,Under Repair,Reserved,Closed',
            'condition' => 'required|string|in:Good,Fair,Needs Repair,For Replacement',
            'operational_status' => 'nullable|string|max:100',
            'operating_hours' => 'nullable|string|max:100',
            'supported_activities' => 'nullable|array',
            'capabilities' => 'nullable|array',
            'is_accessible' => 'nullable|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        $code = trim($validated['facility_code']);
        $name = trim($validated['facility_name']);

        // Check if duplicate code or name exists in this college
        $exists = Room::where('college_id', $college->id)
            ->where(function ($q) use ($code, $name) {
                $q->where('room_code', $code)->orWhere('room_name', $name);
            })
            ->exists();

        if ($exists) {
            return back()->withErrors(['facility_code' => "A facility with code '{$code}' or name '{$name}' already exists in {$college->code}."]);
        }

        $hasSchedulingBaseline = ($validated['capacity'] > 0) && ! empty($validated['facility_type']);
        $readiness = $hasSchedulingBaseline ? 'Ready' : 'Incomplete';

        $room = Room::create([
            'college_id' => $college->id,
            'room_code' => $code,
            'room_name' => $name,
            'type' => $validated['facility_type'],
            'custom_type' => $validated['custom_type'] ?? null,
            'building' => $validated['building'] ?: 'Main Campus',
            'floor' => $validated['floor'] ?: 'Ground Floor',
            'capacity' => (int) $validated['capacity'],
            'is_shared' => $request->boolean('is_shared', false),
            'status' => $validated['status'],
            'condition' => $validated['condition'],
            'operational_status' => $validated['operational_status'] ?: 'Available',
            'setup_readiness' => $readiness,
            'operating_hours' => $validated['operating_hours'] ?: '7:00 AM - 7:00 PM',
            'supported_activities' => $validated['supported_activities'] ?? ['Lecture', 'Laboratory'],
            'capabilities' => $validated['capabilities'] ?? [
                'has_projector' => false,
                'num_workstations' => 0,
                'internet_type' => 'Campus Wi-Fi',
                'specialized_software' => [],
                'has_aircon' => true,
                'power_redundancy' => 'Standard Grid',
                'specialized_equipment' => '',
            ],
            'is_accessible' => $request->boolean('is_accessible', true),
            'notes' => $validated['notes'] ?? null,
        ]);

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Created Facility in College Setup',
            targetName: "{$room->room_code} ({$college->code})",
            actor: $request->user(),
            previousValue: null,
            newValue: $room->toArray(),
            reason: "Facility {$room->room_code} established in Stage 6 onboarding.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Room',
        );

        return back()->with('success', "Facility {$room->room_code} created successfully.");
    }

    /**
     * Update an existing college facility (Stage 6)
     */
    public function updateCollegeFacility(Request $request, College $college, Room $room): RedirectResponse
    {
        $validated = $request->validate([
            'facility_code' => 'required|string|max:50',
            'facility_name' => 'required|string|max:150',
            'facility_type' => 'required|string|max:100',
            'custom_type' => 'nullable|string|max:100',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:0|max:1000',
            'is_shared' => 'nullable|boolean',
            'status' => 'required|string|in:Available,In Use,Maintenance,Under Repair,Reserved,Closed',
            'condition' => 'required|string|in:Good,Fair,Needs Repair,For Replacement',
            'operational_status' => 'nullable|string|max:100',
            'operating_hours' => 'nullable|string|max:100',
            'supported_activities' => 'nullable|array',
            'capabilities' => 'nullable|array',
            'is_accessible' => 'nullable|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        $code = trim($validated['facility_code']);
        $name = trim($validated['facility_name']);

        // Check duplicate excluding self
        $exists = Room::where('college_id', $college->id)
            ->where('id', '!=', $room->id)
            ->where(function ($q) use ($code, $name) {
                $q->where('room_code', $code)->orWhere('room_name', $name);
            })
            ->exists();

        if ($exists) {
            return back()->withErrors(['facility_code' => "Another facility with code '{$code}' or name '{$name}' already exists in {$college->code}."]);
        }

        $prev = $room->toArray();
        $hasSchedulingBaseline = ($validated['capacity'] > 0) && ! empty($validated['facility_type']);
        $readiness = $hasSchedulingBaseline ? 'Ready' : 'Incomplete';

        $room->update([
            'room_code' => $code,
            'room_name' => $name,
            'type' => $validated['facility_type'],
            'custom_type' => $validated['custom_type'] ?? null,
            'building' => $validated['building'] ?: 'Main Campus',
            'floor' => $validated['floor'] ?: 'Ground Floor',
            'capacity' => (int) $validated['capacity'],
            'is_shared' => $request->boolean('is_shared', false),
            'status' => $validated['status'],
            'condition' => $validated['condition'],
            'operational_status' => $validated['operational_status'] ?: 'Available',
            'setup_readiness' => $readiness,
            'operating_hours' => $validated['operating_hours'] ?: '7:00 AM - 7:00 PM',
            'supported_activities' => $validated['supported_activities'] ?? $room->supported_activities,
            'capabilities' => $validated['capabilities'] ?? $room->capabilities,
            'is_accessible' => $request->boolean('is_accessible', true),
            'notes' => $validated['notes'] ?? $room->notes,
        ]);

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Updated Facility from College Setup',
            targetName: "{$room->room_code} ({$college->code})",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $room->toArray(),
            reason: "Facility {$room->room_code} updated in Stage 6 onboarding.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Room',
        );

        return back()->with('success', "Facility {$room->room_code} updated successfully.");
    }

    /**
     * Delete a facility from College Setup (Stage 6)
     */
    public function destroyCollegeFacility(Request $request, College $college, Room $room): RedirectResponse
    {
        $code = $room->room_code ?: $room->room_name;
        $prev = $room->toArray();

        $room->delete();

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Deleted Facility from College Setup',
            targetName: "{$code} ({$college->code})",
            actor: $request->user(),
            previousValue: $prev,
            newValue: null,
            reason: "Facility {$code} deleted during Stage 6 setup.",
            severity: 'warning',
            collegeScope: $college->code,
            targetType: 'Room',
        );

        return back()->with('success', "Facility {$code} removed successfully.");
    }

    /**
     * Bulk Import Facilities via CSV (Stage 6)
     */
    public function bulkImportCollegeFacilities(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'rows' => 'required|array|min:1',
            'rows.*.facility_code' => 'required|string|max:50',
            'rows.*.facility_name' => 'required|string|max:150',
            'rows.*.facility_type' => 'nullable|string|max:100',
            'rows.*.building' => 'nullable|string|max:100',
            'rows.*.floor' => 'nullable|string|max:50',
            'rows.*.capacity' => 'nullable|numeric|min:0|max:1000',
            'rows.*.operating_start' => 'nullable|string|max:20',
            'rows.*.operating_end' => 'nullable|string|max:20',
            'rows.*.status' => 'nullable|string|max:50',
            'rows.*.condition' => 'nullable|string|max:50',
            'rows.*.shared' => 'nullable',
            'rows.*.notes' => 'nullable|string|max:1000',
        ]);

        $createdCount = 0;
        $updatedCount = 0;

        foreach ($validated['rows'] as $row) {
            $code = trim($row['facility_code']);
            $name = trim($row['facility_name']);
            $type = ! empty($row['facility_type']) ? trim($row['facility_type']) : 'Classroom';
            $building = ! empty($row['building']) ? trim($row['building']) : ($college->name.' Building');
            $floor = ! empty($row['floor']) ? trim($row['floor']) : 'Ground Floor';
            $capacity = isset($row['capacity']) ? (int) $row['capacity'] : 40;

            $opStart = ! empty($row['operating_start']) ? trim($row['operating_start']) : '7:00 AM';
            $opEnd = ! empty($row['operating_end']) ? trim($row['operating_end']) : '7:00 PM';
            $operatingHours = "{$opStart} - {$opEnd}";

            $status = ! empty($row['status']) ? trim($row['status']) : 'Available';
            $condition = ! empty($row['condition']) ? trim($row['condition']) : 'Good';
            $isShared = filter_var($row['shared'] ?? false, FILTER_VALIDATE_BOOLEAN);

            $hasSchedulingBaseline = ($capacity > 0) && ! empty($type);
            $readiness = $hasSchedulingBaseline ? 'Ready' : 'Incomplete';

            $existing = Room::where('college_id', $college->id)
                ->where(function ($q) use ($code, $name) {
                    $q->where('room_code', $code)->orWhere('room_name', $name);
                })
                ->first();

            if ($existing) {
                $existing->update([
                    'room_code' => $code,
                    'room_name' => $name,
                    'type' => $type,
                    'building' => $building,
                    'floor' => $floor,
                    'capacity' => $capacity,
                    'is_shared' => $isShared,
                    'operating_hours' => $operatingHours,
                    'status' => $status,
                    'condition' => $condition,
                    'setup_readiness' => $readiness,
                    'notes' => $row['notes'] ?? $existing->notes,
                ]);
                $updatedCount++;
            } else {
                Room::create([
                    'college_id' => $college->id,
                    'room_code' => $code,
                    'room_name' => $name,
                    'type' => $type,
                    'building' => $building,
                    'floor' => $floor,
                    'capacity' => $capacity,
                    'is_shared' => $isShared,
                    'operating_hours' => $operatingHours,
                    'status' => $status,
                    'condition' => $condition,
                    'setup_readiness' => $readiness,
                    'operational_status' => 'Available',
                    'supported_activities' => ['Lecture', 'Laboratory'],
                    'capabilities' => [
                        'has_projector' => true,
                        'num_workstations' => ($type === 'Computer Lab' || $type === 'Laboratory') ? $capacity : 0,
                        'internet_type' => 'Campus Wi-Fi',
                        'specialized_software' => [],
                        'has_aircon' => true,
                        'power_redundancy' => 'Standard Grid',
                        'specialized_equipment' => '',
                    ],
                    'is_accessible' => true,
                    'notes' => $row['notes'] ?? null,
                ]);
                $createdCount++;
            }
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Bulk Imported Facilities via CSV',
            targetName: "{$college->code} ({$createdCount} added, {$updatedCount} updated)",
            actor: $request->user(),
            previousValue: null,
            newValue: ['created' => $createdCount, 'updated' => $updatedCount],
            reason: "Bulk imported {$createdCount} facility(ies) and updated {$updatedCount} in Stage 6 setup.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Room',
        );

        return back()->with('success', "Import completed: {$createdCount} facility(ies) created, {$updatedCount} updated.");
    }

    /**
     * Copy facilities from existing templates or other colleges (Stage 6)
     */
    public function copyFacilitiesFromTemplate(Request $request, College $college): RedirectResponse
    {
        $validated = $request->validate([
            'source_room_ids' => 'required|array|min:1',
            'source_room_ids.*' => 'required|exists:rooms,id',
        ]);

        $sources = Room::whereIn('id', $validated['source_room_ids'])->get();
        $copiedCount = 0;

        foreach ($sources as $src) {
            $targetCode = $src->room_code ?: $src->room_name;

            // Check if already in this college
            $existsInCollege = Room::where('college_id', $college->id)
                ->where(function ($q) use ($targetCode) {
                    $q->where('room_code', $targetCode)->orWhere('room_name', $targetCode);
                })
                ->exists();

            if ($existsInCollege) {
                continue;
            }

            // If code exists in another college, append college code to ensure uniqueness
            if (Room::where('room_name', $targetCode)->exists()) {
                $targetCode = "{$targetCode}-{$college->code}";
            }

            Room::create([
                'college_id' => $college->id,
                'room_code' => $targetCode,
                'room_name' => $targetCode,
                'type' => $src->type,
                'custom_type' => $src->custom_type,
                'building' => $src->building ?: ($college->name.' Hall'),
                'floor' => $src->floor ?: 'Ground Floor',
                'capacity' => $src->capacity ?: 40,
                'is_shared' => (bool) $src->is_shared,
                'status' => 'Available',
                'condition' => $src->condition ?: 'Good',
                'operational_status' => 'Available',
                'setup_readiness' => 'Ready',
                'operating_hours' => $src->operating_hours ?: '7:00 AM - 7:00 PM',
                'supported_activities' => $src->supported_activities ?: ['Lecture', 'Laboratory'],
                'capabilities' => $src->capabilities ?: [
                    'has_projector' => true,
                    'num_workstations' => 0,
                    'internet_type' => 'Campus Wi-Fi',
                    'specialized_software' => [],
                    'has_aircon' => true,
                    'power_redundancy' => 'Standard Grid',
                    'specialized_equipment' => '',
                ],
                'is_accessible' => (bool) $src->is_accessible,
                'notes' => "Cloned from {$src->room_name} standard specification during College Setup.",
            ]);

            $copiedCount++;
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Copied Facilities from Existing Template',
            targetName: "{$college->code} ({$copiedCount} facilities)",
            actor: $request->user(),
            previousValue: null,
            newValue: ['copied_count' => $copiedCount],
            reason: "Copied {$copiedCount} facility template(s) into {$college->code}.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'Room',
        );

        return back()->with('success', "Successfully copied {$copiedCount} facility template(s) into {$college->code}.");
    }

    /**
     * Update Stage 6 Facilities settings (allow college admin to modify, scheduling prerequisites, shared pool)
     */
    public function updateFacilitiesSettings(Request $request, College $college): RedirectResponse
    {
        $inheritance = is_array($college->inheritance_settings) ? $college->inheritance_settings : [];
        $inheritance['allow_admin_modify_facilities'] = $request->boolean('allow_admin_modify_facilities', true);
        $inheritance['require_capacity_before_scheduling'] = $request->boolean('require_capacity_before_scheduling', true);
        $inheritance['require_room_type_for_scheduling'] = $request->boolean('require_room_type_for_scheduling', true);
        $inheritance['allow_shared_facilities_across_colleges'] = $request->boolean('allow_shared_facilities_across_colleges', true);

        $college->update([
            'inheritance_settings' => $inheritance,
        ]);

        return back()->with('success', "Facility governance settings updated for {$college->code}.");
    }

    /**
     * 3. Institution Profile & Global Report Configuration
     */
    public function profile(): Response
    {
        $reportConfig = InstitutionSetting::getVal('global_report_config', [
            'header_line_1' => 'Republic of the Philippines',
            'header_line_2' => 'DAVAO DEL SUR STATE COLLEGE',
            'header_line_3' => 'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002',
            'footer_notice' => 'ISO 9001:2015 Certified · Generated via Velora / COMPASS Institutional Governance Platform',
            'methodology_note' => 'Attendance and workload metrics are reconciled across verified schedules, EHRIS official business records, and physical facility monitoring.',
            'allowed_export_formats' => ['PDF', 'XLSX', 'CSV'],
            'naming_convention' => '{INSTITUTION}_{ENTITY}_{COLLEGE}_{MODULE}_{AY}_{SEM}_{DATE}',
            'retention_years' => 5,
            'default_signatories' => [
                'prepared_by' => 'College Admin / Secretary',
                'reviewed_by' => 'Program Head / Department Chair',
                'approved_by' => 'College Dean',
                'executive_noted_by' => 'Vice President for Academic Affairs / VPAF',
            ],
        ]);

        $latestSetting = InstitutionSetting::where('group', 'profile')->latest('updated_at')->first();
        $lastUpdated = $latestSetting?->updated_at
            ? $latestSetting->updated_at->format('M j, Y, g:i A')
            : now()->format('M j, Y, g:i A');

        $defaultHeader = ($reportConfig['header_line_1'] ?? 'Republic of the Philippines').' · '.($reportConfig['header_line_2'] ?? 'DAVAO DEL SUR STATE COLLEGE');
        $defaultFooter = $reportConfig['footer_notice'] ?? 'ISO 9001:2015 Certified · Generated via Velora / COMPASS Institutional Governance Platform';

        $profile = [
            'name' => InstitutionSetting::getVal('institution_name', 'Davao Del Sur State College'),
            'acronym' => InstitutionSetting::getVal('institution_acronym', 'DSSC'),
            'address' => InstitutionSetting::getVal('institution_address', 'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002'),
            'timezone' => InstitutionSetting::getVal('institution_timezone', 'Asia/Manila (UTC+08:00)'),
            'email' => InstitutionSetting::getVal('institution_email', 'president@dssc.edu.ph'),
            'website' => InstitutionSetting::getVal('institution_website', 'https://www.dssc.edu.ph'),
            'logo_url' => InstitutionSetting::getVal('institution_logo_url', '/velora_logo-removebg-preview.png'),
            'report_header' => InstitutionSetting::getVal('institution_report_header', $defaultHeader),
            'report_footer' => InstitutionSetting::getVal('institution_report_footer', $defaultFooter),
            'last_updated' => $lastUpdated,
            'report_config' => $reportConfig,
        ];

        return Inertia::render('institution/profile/index', [
            'profile' => $profile,
        ]);
    }

    /**
     * Save Institution Profile, Official Logo & Global Report Configuration
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'acronym' => 'required|string|max:50',
            'address' => 'required|string|max:500',
            'timezone' => 'required|string|max:100',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'report_header' => 'nullable|string|max:500',
            'report_footer' => 'nullable|string|max:500',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:4096',
            'report_config' => 'nullable|array',
        ]);

        InstitutionSetting::setVal('institution_name', $validated['name'], 'profile', 'Institution Full Name');
        InstitutionSetting::setVal('institution_acronym', $validated['acronym'], 'profile', 'Institution Acronym');
        InstitutionSetting::setVal('institution_address', $validated['address'], 'profile', 'Official Campus Address');
        InstitutionSetting::setVal('institution_timezone', $validated['timezone'], 'profile', 'System Timezone');

        if (! empty($validated['email'])) {
            InstitutionSetting::setVal('institution_email', $validated['email'], 'profile', 'Institutional Email');
        }
        if (! empty($validated['website'])) {
            InstitutionSetting::setVal('institution_website', $validated['website'], 'profile', 'Institution Website');
        }
        if (! empty($validated['report_header'])) {
            InstitutionSetting::setVal('institution_report_header', $validated['report_header'], 'profile', 'Report Header Letterhead');
        }
        if (! empty($validated['report_footer'])) {
            InstitutionSetting::setVal('institution_report_footer', $validated['report_footer'], 'profile', 'Accreditation Footer Notice');
        }

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $filename = 'institution_logo_'.time().'.'.$file->getClientOriginalExtension();
            $uploadDir = public_path('uploads/institution');
            if (! is_dir($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }
            $file->move($uploadDir, $filename);
            $logoUrl = '/uploads/institution/'.$filename;
            InstitutionSetting::setVal('institution_logo_url', $logoUrl, 'profile', 'Institution Official Logo URL');
        }

        $reportConfig = InstitutionSetting::getVal('global_report_config', []);
        if (! empty($validated['report_footer'])) {
            $reportConfig['footer_notice'] = $validated['report_footer'];
        }
        if (! empty($validated['report_config'])) {
            $reportConfig = array_merge($reportConfig, $validated['report_config']);
        }
        InstitutionSetting::setVal('global_report_config', $reportConfig, 'profile', 'Global Report Templates & Signatory Standards');

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Updated Institution Profile & Brand Identity',
            targetName: $validated['name'].' ('.$validated['acronym'].')',
            actor: $request->user(),
            previousValue: null,
            newValue: collect($validated)->except('logo')->toArray(),
            reason: 'Updated global institutional identity, logo, and report header/signatory defaults.',
        );

        return back()->with('success', 'Institution profile, logo, and global report standards saved successfully.');
    }

    /**
     * 4. Users & Canonical Identity Management (One Account Per Person, Multi-Scope Attachable, Paginated, Profile & Activity Log)
     */
    public function users(Request $request): Response
    {
        // Ensure any Faculty record that hasn't been synced into a User account yet is synced
        Faculty::whereNull('user_id')->whereNotNull('email')->each(fn (Faculty $f) => $f->syncUserAccount());

        $search = trim((string) $request->query('search', ''));
        $statusFilter = (string) $request->query('status', 'All');
        $roleFilter = (string) $request->query('role', 'All');
        $entityFilter = (string) $request->query('entity', 'All');
        $collegeFilter = (string) $request->query('college', 'All');
        $perPage = max(10, min(100, (int) $request->query('per_page', 12)));

        $query = User::with([
            'roles:id,name,tier,risk_level',
            'faculty.program.college.parent',
            'scopedRoleAssignments.role',
            'scopedRoleAssignments.entity',
            'scopedRoleAssignments.college.parent',
            'scopedRoleAssignments.program.college',
        ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('institutional_id', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($statusFilter !== '' && $statusFilter !== 'All') {
            $query->where('account_status', $statusFilter);
        }

        if ($roleFilter !== '' && $roleFilter !== 'All') {
            $query->where(function ($q) use ($roleFilter) {
                $q->whereHas('roles', fn ($rq) => $rq->where('roles.id', $roleFilter)->orWhere('roles.name', $roleFilter))
                    ->orWhereHas('scopedRoleAssignments.role', fn ($sq) => $sq->where('roles.id', $roleFilter)->orWhere('roles.name', $roleFilter));
            });
        }

        if ($entityFilter !== '' && $entityFilter !== 'All') {
            $query->where(function ($q) use ($entityFilter) {
                $q->whereHas('scopedRoleAssignments', fn ($sq) => $sq->where('entity_id', $entityFilter))
                    ->orWhereHas('scopedRoleAssignments.college', fn ($cq) => $cq->where('parent_id', $entityFilter))
                    ->orWhereHas('faculty.program.college', fn ($fcq) => $fcq->where('parent_id', $entityFilter));
            });
        }

        if ($collegeFilter !== '' && $collegeFilter !== 'All') {
            $query->where(function ($q) use ($collegeFilter) {
                $q->whereHas('scopedRoleAssignments', fn ($sq) => $sq->where('college_id', $collegeFilter))
                    ->orWhereHas('faculty.program', fn ($fpq) => $fpq->where('college_id', $collegeFilter));
            });
        }

        $paginator = $query->orderBy('name')->paginate($perPage)->withQueryString();

        // Enrich each paginated user with resolved affiliations (entities, colleges, programs) and activity log
        $auditLogs = InstitutionAuditLog::latest()->limit(200)->get();

        $paginator->getCollection()->transform(function (User $u) use ($auditLogs) {
            $userEntities = collect();
            $userColleges = collect();
            $userPrograms = collect();

            foreach ($u->scopedRoleAssignments as $asgn) {
                if ($asgn->entity) {
                    $userEntities->push($asgn->entity->only(['id', 'code', 'name']));
                } elseif ($asgn->college?->parent) {
                    $userEntities->push($asgn->college->parent->only(['id', 'code', 'name']));
                }

                if ($asgn->college) {
                    $userColleges->push($asgn->college->only(['id', 'code', 'name']));
                }

                if ($asgn->program) {
                    $userPrograms->push($asgn->program->only(['id', 'code', 'name']));
                }
            }

            if ($u->faculty?->program) {
                $prog = $u->faculty->program;
                $userPrograms->push($prog->only(['id', 'code', 'name']));
                if ($prog->college) {
                    $userColleges->push($prog->college->only(['id', 'code', 'name']));
                    if ($prog->college->parent) {
                        $userEntities->push($prog->college->parent->only(['id', 'code', 'name']));
                    }
                }
            }

            // Build combined Activity & Governance Log for this user
            $userAuditEvents = $auditLogs->filter(function (InstitutionAuditLog $log) use ($u) {
                return $log->actor_user_id === $u->id
                    || str_contains(strtolower($log->target_name ?? ''), strtolower($u->email))
                    || str_contains(strtolower($log->target_name ?? ''), strtolower($u->name));
            })->take(10)->map(fn (InstitutionAuditLog $log) => [
                'id' => 'audit-'.$log->id,
                'type' => 'Governance Audit',
                'module' => $log->module,
                'title' => $log->action,
                'detail' => $log->reason ?: "Target: {$log->target_name}",
                'timestamp' => $log->created_at?->format('M d, Y h:i A') ?? 'Recently',
                'severity' => $log->severity,
            ])->values()->all();

            $facultyActivities = [];
            if ($u->faculty) {
                $facultyActivities = Activity::where('faculty_id', $u->faculty->id)
                    ->latest('date')
                    ->take(6)
                    ->get()
                    ->map(fn (Activity $act) => [
                        'id' => 'act-'.$act->id,
                        'type' => $act->category ?: 'Academic Activity',
                        'module' => 'Operations & Events',
                        'title' => $act->title,
                        'detail' => trim(($act->venue ? "Venue: {$act->venue} · " : '').($act->description ?? '')),
                        'timestamp' => $act->date ? date('M d, Y', strtotime((string) $act->date)) : 'Recorded',
                        'severity' => 'info',
                    ])->values()->all();
            }

            $sessionEvents = [
                [
                    'id' => 'login-'.$u->id,
                    'type' => 'Authentication',
                    'module' => 'Identity & Access',
                    'title' => $u->last_login_at ? 'Verified Portal Sign-In' : 'Canonical Identity Provisioned',
                    'detail' => $u->last_login_at
                        ? "Authenticated as {$u->email} (Status: {$u->account_status})"
                        : 'Account active since '.($u->effective_from ? $u->effective_from->format('M d, Y') : '2024-08-01'),
                    'timestamp' => $u->last_login_at ? $u->last_login_at->format('M d, Y h:i A') : 'System Record',
                    'severity' => 'success',
                ],
            ];

            $u->setAttribute('resolved_entities', $userEntities->unique('code')->values()->all());
            $u->setAttribute('resolved_colleges', $userColleges->unique('code')->values()->all());
            $u->setAttribute('resolved_programs', $userPrograms->unique('code')->values()->all());
            $u->setAttribute('activity_logs', array_slice(array_merge($userAuditEvents, $facultyActivities, $sessionEvents), 0, 12));

            // Compute profile completion percentage & primary designation label
            $score = 45; // Base canonical identity (name + email + account status)
            $missingFields = [];
            if (! empty($u->institutional_id)) {
                $score += 10;
            } else {
                $missingFields[] = 'Institutional ID';
            }
            if (! empty($u->phone) || ! empty($u->faculty?->phone)) {
                $score += 10;
            } else {
                $missingFields[] = 'Contact Phone';
            }
            if ($u->scopedRoleAssignments->isNotEmpty() || $u->roles->isNotEmpty()) {
                $score += 10;
            } else {
                $missingFields[] = 'Scoped Role Binding';
            }
            if ($u->faculty) {
                if (! empty($u->faculty->academic_rank)) {
                    $score += 7;
                } else {
                    $missingFields[] = 'Academic Rank';
                }
                if (! empty($u->faculty->highest_qualification)) {
                    $score += 6;
                } else {
                    $missingFields[] = 'Highest Qualification';
                }
                if (! empty($u->faculty->specialization)) {
                    $score += 6;
                } else {
                    $missingFields[] = 'Specialization';
                }
                if (! empty($u->faculty->office_room) || ! empty($u->faculty->photo_url)) {
                    $score += 6;
                } else {
                    $missingFields[] = 'Office Room / Photo';
                }
            } else {
                if (! empty($u->effective_from)) {
                    $score += 10;
                }
                if ($u->mfa_required) {
                    $score += 8;
                }
                if ($userColleges->isNotEmpty() || $userEntities->isNotEmpty()) {
                    $score += 7;
                }
            }
            $u->setAttribute('profile_completion', min(100, max(60, $score)));
            $u->setAttribute('missing_profile_fields', $missingFields);

            $primaryRoleName = $u->scopedRoleAssignments->first()?->role?->name
                ?? $u->roles->first()?->name
                ?? ($u->faculty?->academic_rank ?: 'Institutional Staff');
            $firstCollege = $userColleges->first();
            $designationLabel = $u->faculty?->academic_rank ?: $primaryRoleName;
            if (str_contains(strtolower($primaryRoleName), 'dean') && $firstCollege) {
                $designationLabel = "Dean, {$firstCollege['name']}";
            } elseif (str_contains(strtolower($primaryRoleName), 'college admin')) {
                $designationLabel = 'College Secretary / College Admin';
            } elseif (str_contains(strtolower($primaryRoleName), 'program')) {
                $designationLabel = $u->faculty?->academic_rank
                    ? "{$primaryRoleName} · {$u->faculty->academic_rank}"
                    : $primaryRoleName;
            }
            $u->setAttribute('designation_label', $designationLabel);

            return $u;
        });

        $roles = Role::orderBy('name')->get();
        $entities = College::where('type', 'Entity')->orderBy('code')->get();
        $colleges = College::where('type', '!=', 'Entity')->orderBy('code')->get();
        $programs = Program::orderBy('code')->get();

        // Build full Faculty Matrix dataset across all Entities, Campuses, Colleges & Programs for Download Reports
        $facultyMatrix = Faculty::with(['program.college.parent', 'user.roles', 'user.scopedRoleAssignments.role'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function (Faculty $f) {
                $prog = $f->program;
                $col = $prog?->college;
                $ent = $col?->parent;
                $u = $f->user;

                $completedChecks = 3; // name, email, status
                $totalChecks = 8;
                if (! empty($f->faculty_id) || ! empty($u?->institutional_id)) {
                    $completedChecks++;
                }
                if (! empty($f->academic_rank)) {
                    $completedChecks++;
                }
                if (! empty($f->highest_qualification)) {
                    $completedChecks++;
                }
                if (! empty($f->specialization)) {
                    $completedChecks++;
                }
                if (! empty($f->phone) || ! empty($u?->phone)) {
                    $completedChecks++;
                }
                $completionPct = (int) round(($completedChecks / $totalChecks) * 100);

                $roleNames = collect();
                if ($u) {
                    foreach ($u->scopedRoleAssignments as $sra) {
                        if ($sra->role) {
                            $roleNames->push($sra->role->name);
                        }
                    }
                    foreach ($u->roles as $r) {
                        $roleNames->push($r->name);
                    }
                }
                if ($roleNames->isEmpty()) {
                    $roleNames->push('Faculty Member');
                }

                return [
                    'id' => $f->id,
                    'institutional_id' => $u?->institutional_id ?: ($f->faculty_id ?: 'DSSC-FAC-'.str_pad((string) $f->id, 3, '0', STR_PAD_LEFT)),
                    'employee_id' => $f->employee_id,
                    'full_name' => $f->full_name,
                    'title_name' => $f->title_name,
                    'email' => $f->email ?: ($u?->email ?? ''),
                    'phone' => $f->phone ?: ($u?->phone ?? '—'),
                    'entity_code' => $ent?->code ?: 'DSSC-MAIN',
                    'entity_name' => $ent?->name ?: 'DSSC Main Campus (Matti, Digos City)',
                    'college_code' => $col?->code ?: 'CIDS',
                    'college_name' => $col?->name ?: 'College of Information and Digital Sciences',
                    'program_code' => $prog?->code ?: 'BSIS',
                    'program_name' => $prog?->name ?: 'Bachelor of Science in Information Systems',
                    'academic_rank' => $f->academic_rank ?: 'Instructor I',
                    'employment_type' => $f->employment_type ?: 'Full-Time / Regular',
                    'appointment_status' => $f->appointment_status ?: 'Permanent',
                    'highest_qualification' => $f->highest_qualification ?: 'Master\'s Degree',
                    'specialization' => $f->specialization ?: 'Information Systems & Computing',
                    'office_room' => $f->office_room ?: 'Faculty Center',
                    'roles' => $roleNames->unique()->values()->implode(', '),
                    'status' => $f->status ?: 'Active',
                    'profile_completion' => $completionPct,
                ];
            })
            ->values()
            ->all();

        $summaryStats = [
            'total_users' => User::count(),
            'active_users' => User::where('account_status', 'Active')->count(),
            'mfa_enforced' => User::where('mfa_required', true)->count(),
            'multi_role_users' => User::has('scopedRoleAssignments', '>=', 2)->count(),
            'entities_covered' => $entities->count(),
            'colleges_covered' => $colleges->count(),
            'total_faculty_matrix' => count($facultyMatrix),
        ];

        return Inertia::render('institution/users/index', [
            'usersPaginator' => $paginator,
            'users' => $paginator->items(),
            'facultyMatrix' => $facultyMatrix,
            'summaryStats' => $summaryStats,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'role' => $roleFilter,
                'entity' => $entityFilter,
                'college' => $collegeFilter,
                'per_page' => $perPage,
            ],
            'roles' => $roles,
            'entities' => $entities,
            'colleges' => $colleges,
            'programs' => $programs,
        ]);
    }

    /**
     * Create / Invite Canonical User Account
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'institutional_id' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:8',
            'account_status' => 'required|string|in:Active,Invited,Suspended,Locked,Archived',
            'mfa_required' => 'boolean',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
            'initial_role_id' => 'nullable|exists:roles,id',
            'scope_level' => 'nullable|string|in:Institution,Entity,College,Program',
            'entity_id' => 'nullable|exists:colleges,id',
            'college_id' => 'nullable|exists:colleges,id',
            'program_id' => 'nullable|exists:programs,id',
        ]);

        $user = User::create([
            'institutional_id' => $validated['institutional_id'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password'] ?: 'password'),
            'account_status' => $validated['account_status'],
            'mfa_required' => $validated['mfa_required'] ?? false,
            'effective_from' => $validated['effective_from'] ?? now()->toDateString(),
            'effective_until' => $validated['effective_until'] ?? null,
        ]);

        if (! empty($validated['initial_role_id'])) {
            $user->roles()->syncWithoutDetaching([$validated['initial_role_id']]);
            ScopedRoleAssignment::create([
                'user_id' => $user->id,
                'role_id' => $validated['initial_role_id'],
                'institution' => 'Davao Del Sur State College',
                'scope_level' => $validated['scope_level'] ?? 'College',
                'entity_id' => $validated['entity_id'] ?? null,
                'college_id' => $validated['college_id'] ?? null,
                'program_id' => $validated['program_id'] ?? null,
                'designation_type' => 'Primary',
                'effective_from' => $validated['effective_from'] ?? now()->toDateString(),
                'effective_until' => $validated['effective_until'] ?? null,
                'status' => 'Active',
                'notes' => 'Initial role bound during canonical identity provisioning',
                'assigned_by_user_id' => $request->user()?->id,
            ]);
        }

        InstitutionAuditLog::record(
            module: 'Users & Identity',
            action: 'Provisioned Canonical Identity',
            targetName: "{$user->name} ({$user->institutional_id} · {$user->email})",
            actor: $request->user(),
            previousValue: null,
            newValue: $user->only(['institutional_id', 'name', 'email', 'account_status', 'mfa_required']),
            reason: 'Created single canonical account in Velora Identity Directory.',
            severity: 'success',
        );

        return back()->with('success', "Canonical account provisioned for {$user->name} ({$user->institutional_id}).");
    }

    /**
     * Update Canonical User Identity
     */
    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'institutional_id' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:50',
            'mfa_required' => 'boolean',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date',
        ]);

        $prev = $user->only(['institutional_id', 'name', 'email', 'phone', 'mfa_required']);
        $user->update($validated);

        InstitutionAuditLog::record(
            module: 'Users & Identity',
            action: 'Corrected User Identity',
            targetName: "{$user->name} ({$user->email})",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated,
            reason: 'Identity record updated by Institution Super Admin.',
        );

        return back()->with('success', "Updated identity profile for {$user->name}.");
    }

    /**
     * Suspend, Activate, Lock, Archive, Force Logout, or Force Password Reset on a User
     */
    public function updateUserStatus(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:activate,suspend,lock,archive,force_logout,reset_password,toggle_mfa',
            'reason' => 'nullable|string|max:500',
        ]);

        $prevStatus = $user->account_status;
        $actionLabel = '';

        switch ($validated['action']) {
            case 'activate':
                $user->update(['account_status' => 'Active']);
                $actionLabel = 'Activated Account';
                break;
            case 'suspend':
                $user->update(['account_status' => 'Suspended']);
                $actionLabel = 'Suspended Account';
                break;
            case 'lock':
                $user->update(['account_status' => 'Locked']);
                $actionLabel = 'Locked Account';
                break;
            case 'archive':
                $user->update(['account_status' => 'Archived']);
                $actionLabel = 'Archived Account';
                break;
            case 'force_logout':
                DB::table('sessions')->where('user_id', $user->id)->delete();
                $actionLabel = 'Forced Immediate Session Logout';
                break;
            case 'reset_password':
                $user->update([
                    'password' => Hash::make('password'),
                    'force_password_reset' => true,
                ]);
                $actionLabel = 'Triggered Password Reset & Temporary Credential';
                break;
            case 'toggle_mfa':
                $user->update(['mfa_required' => ! $user->mfa_required]);
                $actionLabel = $user->mfa_required ? 'Enforced Mandatory MFA' : 'Relaxed MFA Requirement';
                break;
        }

        InstitutionAuditLog::record(
            module: 'Users & Identity',
            action: $actionLabel,
            targetName: "{$user->name} ({$user->email})",
            actor: $request->user(),
            previousValue: ['account_status' => $prevStatus],
            newValue: ['account_status' => $user->account_status, 'mfa_required' => $user->mfa_required],
            reason: $validated['reason'] ?? "Security lifecycle action '{$validated['action']}' executed.",
            severity: in_array($validated['action'], ['suspend', 'lock', 'archive', 'force_logout']) ? 'warning' : 'info',
        );

        return back()->with('success', "{$actionLabel} for {$user->name}.");
    }

    /**
     * Ensure comprehensive module permissions exist across all 12 Velora modules
     */
    protected function ensurePermissionCatalogSynced(): void
    {
        $catalog = [
            // 1. Institution Governance
            ['name' => 'institution.governance.view', 'module' => 'Institution Governance', 'capability' => 'View', 'description' => 'Access and view institutional profile, command center, and global standards.'],
            ['name' => 'institution.governance.create', 'module' => 'Institution Governance', 'capability' => 'Create', 'description' => 'Add new institutional governance policies, standards, and workflows.'],
            ['name' => 'institution.governance.edit', 'module' => 'Institution Governance', 'capability' => 'Edit', 'description' => 'Modify existing institutional profile, branding, and report letterheads.'],
            ['name' => 'institution.governance.delete', 'module' => 'Institution Governance', 'capability' => 'Delete', 'description' => 'Remove obsolete governance drafts or configuration records (with confirmation).'],
            ['name' => 'institution.governance.configure', 'module' => 'Institution Governance', 'capability' => 'Configure', 'description' => 'Configure feature flags, module availability, and terminology overrides.'],
            ['name' => 'institution.governance.assign', 'module' => 'Institution Governance', 'capability' => 'Assign', 'description' => 'Assign roles and configure scoped permissions for institutional administrators.'],

            // 2. Organization Management
            ['name' => 'organization.entity.view', 'module' => 'Organization Management', 'capability' => 'View', 'description' => 'View the organizational structure tree, entities, campuses, and colleges.'],
            ['name' => 'organization.entity.create', 'module' => 'Organization Management', 'capability' => 'Create', 'description' => 'Create, archive, or reorganize campus entities.'],
            ['name' => 'organization.college.create', 'module' => 'Organization Management', 'capability' => 'Create', 'description' => 'Create, move, or archive colleges under entities.'],
            ['name' => 'organization.college.configure', 'module' => 'Organization Management', 'capability' => 'Configure', 'description' => 'Configure college onboarding, branding, and module inheritance.'],
            ['name' => 'organization.program.manage', 'module' => 'Organization Management', 'capability' => 'Edit', 'description' => 'Create and manage degree programs and curricula.'],
            ['name' => 'organization.unit.delete', 'module' => 'Organization Management', 'capability' => 'Delete', 'description' => 'Archive or retire unreferenced organizational units.'],

            // 3. Users & Identity
            ['name' => 'users.view', 'module' => 'Users & Identity', 'capability' => 'View', 'description' => 'Browse canonical user accounts, profiles, and organizational affiliations.'],
            ['name' => 'users.create', 'module' => 'Users & Identity', 'capability' => 'Create', 'description' => 'Provision or invite new canonical user identities.'],
            ['name' => 'users.manage', 'module' => 'Users & Identity', 'capability' => 'Edit', 'description' => 'Update, suspend, lock, and manage canonical user accounts and MFA settings.'],
            ['name' => 'users.delete', 'module' => 'Users & Identity', 'capability' => 'Delete', 'description' => 'Archive or retire inactive user accounts with audit preservation.'],
            ['name' => 'users.export', 'module' => 'Users & Identity', 'capability' => 'Export', 'description' => 'Export the institutional faculty matrix and canonical identity directory.'],

            // 4. Roles & Permissions
            ['name' => 'roles.view', 'module' => 'Roles & Permissions', 'capability' => 'View', 'description' => 'View role definitions, permission matrix, and assigned users.'],
            ['name' => 'roles.create', 'module' => 'Roles & Permissions', 'capability' => 'Create', 'description' => 'Create or duplicate reusable custom roles.'],
            ['name' => 'roles.manage', 'module' => 'Roles & Permissions', 'capability' => 'Configure', 'description' => 'Modify role definitions, scope restrictions, and the granular permission matrix.'],
            ['name' => 'roles.delete', 'module' => 'Roles & Permissions', 'capability' => 'Delete', 'description' => 'Deactivate, retire, or delete eligible custom roles.'],

            // 5. Scoped Assignments
            ['name' => 'roles.assign.view', 'module' => 'Scoped Assignments', 'capability' => 'View', 'description' => 'Inspect active scoped role assignments and pending access requests.'],
            ['name' => 'roles.assign', 'module' => 'Scoped Assignments', 'capability' => 'Assign', 'description' => 'Bind User + Role + Scope + Effective Period across entities and colleges.'],
            ['name' => 'access_requests.review', 'module' => 'Scoped Assignments', 'capability' => 'Review', 'description' => 'Review incoming cross-entity or elevated role delegation requests.'],
            ['name' => 'access_requests.approve', 'module' => 'Scoped Assignments', 'capability' => 'Approve', 'description' => 'Approve or deny cross-entity or elevated access requests.'],

            // 6. Academic Governance
            ['name' => 'academic_period.view', 'module' => 'Academic Governance', 'capability' => 'View', 'description' => 'View active and historical academic periods, programs, and curricula.'],
            ['name' => 'academic_period.create', 'module' => 'Academic Governance', 'capability' => 'Create', 'description' => 'Create new academic periods, curriculum versions, and course catalog items.'],
            ['name' => 'academic_period.edit', 'module' => 'Academic Governance', 'capability' => 'Edit', 'description' => 'Modify academic period dates, curriculum mappings, and course offerings.'],
            ['name' => 'academic_period.configure', 'module' => 'Academic Governance', 'capability' => 'Configure', 'description' => 'Define institution-wide academic years, terms, and planning rules.'],
            ['name' => 'academic_period.approve', 'module' => 'Academic Governance', 'capability' => 'Approve', 'description' => 'Activate or close official academic periods and curriculum revisions.'],

            // 7. Semester Scheduling
            ['name' => 'schedule.view', 'module' => 'Semester Scheduling', 'capability' => 'View', 'description' => 'View master timetables, faculty loading, and room schedules.'],
            ['name' => 'schedule.generate', 'module' => 'Semester Scheduling', 'capability' => 'Create', 'description' => 'Run OR-Tools solver and generate schedule drafts.'],
            ['name' => 'schedule.edit', 'module' => 'Semester Scheduling', 'capability' => 'Edit', 'description' => 'Modify section assignments, faculty loads, and room allocations.'],
            ['name' => 'schedule.review', 'module' => 'Semester Scheduling', 'capability' => 'Review', 'description' => 'Review schedule candidates and flag conflicts.'],
            ['name' => 'schedule.approve', 'module' => 'Semester Scheduling', 'capability' => 'Approve', 'description' => 'Executive approval of college master timetable.'],
            ['name' => 'schedule.publish', 'module' => 'Semester Scheduling', 'capability' => 'Publish', 'description' => 'Publish official semester schedule version.'],

            // 8. Faculty Attendance
            ['name' => 'attendance.view', 'module' => 'Faculty Attendance', 'capability' => 'View', 'description' => 'View faculty attendance logs, locator slips, and reconciliation status.'],
            ['name' => 'attendance.edit', 'module' => 'Faculty Attendance', 'capability' => 'Edit', 'description' => 'Record or adjust faculty attendance, make-up classes, and travel orders.'],
            ['name' => 'attendance.verify', 'module' => 'Faculty Attendance', 'capability' => 'Verify', 'description' => 'Verify attendance correction requests and supporting documents.'],
            ['name' => 'attendance.export', 'module' => 'Faculty Attendance', 'capability' => 'Export', 'description' => 'Export verified faculty attendance and DTR reconciliation reports.'],

            // 9. Facility Monitoring
            ['name' => 'monitoring.view', 'module' => 'Facility Monitoring', 'capability' => 'View', 'description' => 'View daily room and laboratory session monitoring logs.'],
            ['name' => 'attendance.observe', 'module' => 'Facility Monitoring', 'capability' => 'Create', 'description' => 'Capture room/laboratory observation and evidence.'],
            ['name' => 'monitoring.verify', 'module' => 'Facility Monitoring', 'capability' => 'Verify', 'description' => 'Verify daily monitoring observations and discrepancies.'],
            ['name' => 'attendance.finalize', 'module' => 'Facility Monitoring', 'capability' => 'Approve', 'description' => 'Finalize end-of-day monitoring reports.'],
            ['name' => 'attendance.reopen', 'module' => 'Facility Monitoring', 'capability' => 'Configure', 'description' => 'Reopen locked monitoring sessions with audit reason.'],

            // 10. Inventory & Facilities
            ['name' => 'inventory.view', 'module' => 'Inventory & Facilities', 'capability' => 'View', 'description' => 'Inspect room and laboratory equipment registry.'],
            ['name' => 'inventory.create', 'module' => 'Inventory & Facilities', 'capability' => 'Create', 'description' => 'Register new rooms, laboratories, and equipment assets.'],
            ['name' => 'inventory.adjust', 'module' => 'Inventory & Facilities', 'capability' => 'Edit', 'description' => 'Submit inventory count or condition adjustment requests.'],
            ['name' => 'inventory.verify', 'module' => 'Inventory & Facilities', 'capability' => 'Verify', 'description' => 'Authorize and reconcile laboratory inventory adjustments.'],
            ['name' => 'inventory.assign', 'module' => 'Inventory & Facilities', 'capability' => 'Assign', 'description' => 'Assign Lab In-Charge custodians and temporary coverage.'],

            // 11. Compliance & Research
            ['name' => 'compliance.view', 'module' => 'Compliance & Research', 'capability' => 'View', 'description' => 'View compliance trackers, deliverables, and research portfolios.'],
            ['name' => 'compliance.submit', 'module' => 'Compliance & Research', 'capability' => 'Create', 'description' => 'Upload syllabus and faculty deliverable submissions.'],
            ['name' => 'compliance.review', 'module' => 'Compliance & Research', 'capability' => 'Review', 'description' => 'Review submitted syllabi, exams, and research outputs.'],
            ['name' => 'compliance.verify', 'module' => 'Compliance & Research', 'capability' => 'Verify', 'description' => 'Verify or return faculty compliance submissions.'],
            ['name' => 'research.verify', 'module' => 'Compliance & Research', 'capability' => 'Approve', 'description' => 'Approve faculty research, extension, and accomplishment portfolios.'],

            // 12. Reports, TV & Platform Governance
            ['name' => 'reports.view', 'module' => 'Reports & Analytics', 'capability' => 'View', 'description' => 'View institutional, college, and program performance dashboards.'],
            ['name' => 'reports.generate', 'module' => 'Reports & Analytics', 'capability' => 'Export', 'description' => 'Generate and export verified operational or executive reports.'],
            ['name' => 'tv.publish', 'module' => 'TV Studio & Signage', 'capability' => 'Publish', 'description' => 'Publish playlists, custom slides, and spotlights to TV displays.'],
            ['name' => 'platform.policies.configure', 'module' => 'Platform Governance', 'capability' => 'Configure', 'description' => 'Manage institution policy templates, workflows, and terminology.'],
            ['name' => 'platform.integrations.configure', 'module' => 'Platform Governance', 'capability' => 'Configure', 'description' => 'Configure Google Workspace, Sheets, EHRIS, and Gemini AI integrations.'],
            ['name' => 'platform.security.audit', 'module' => 'Platform Governance', 'capability' => 'Review', 'description' => 'Inspect immutable audit logs, security policies, and data quality health.'],
        ];

        $allPermIds = [];
        foreach ($catalog as $item) {
            $perm = Permission::updateOrCreate(
                ['name' => $item['name']],
                [
                    'module' => $item['module'],
                    'capability' => $item['capability'],
                    'description' => $item['description'],
                ],
            );
            $allPermIds[] = $perm->id;
        }

        // Ensure Institution Super Admin has all permissions if it currently has fewer than 20
        $superAdminRole = Role::where('name', 'Institution Super Admin')->first();
        if ($superAdminRole && $superAdminRole->permissions()->count() < 20) {
            $superAdminRole->permissions()->syncWithoutDetaching($allPermIds);
        }
    }

    /**
     * 5. Role Management & Granular Permission Matrix UI
     */
    public function roles(): Response
    {
        $this->ensurePermissionCatalogSynced();

        $roles = Role::with([
            'permissions:id,name,module,capability,description',
            'users:id,name,email,institutional_id,account_status',
            'scopedAssignments.user:id,name,email,institutional_id,account_status',
            'scopedAssignments.entity:id,code,name',
            'scopedAssignments.college:id,code,name',
            'scopedAssignments.program:id,code,name',
        ])->withCount(['users', 'scopedAssignments'])->orderBy('id')->get();

        $permissions = Permission::orderBy('module')->orderBy('id')->get();

        $auditLogs = InstitutionAuditLog::whereIn('module', ['Roles & Permissions', 'Scoped Assignments', 'Users & Identity'])
            ->latest()
            ->limit(120)
            ->get();

        $defaultScopesByTier = [
            'Institution' => ['Institution', 'Entity', 'College', 'Program'],
            'Entity' => ['Entity', 'College'],
            'College' => ['College', 'Program'],
            'Program' => ['Program'],
            'Academic' => ['College', 'Program'],
            'Operational' => ['Entity', 'College', 'Operational'],
        ];

        $roles->transform(function (Role $role) use ($auditLogs, $defaultScopesByTier) {
            // Merge direct role users and scoped assignment users into a deduplicated list
            $assignedUsers = collect();

            foreach ($role->scopedAssignments as $sra) {
                if ($sra->user) {
                    $scopeCode = $sra->program?->code
                        ?: ($sra->college?->code ?: ($sra->entity?->code ?: $sra->scope_level));
                    $assignedUsers->push([
                        'id' => $sra->user->id,
                        'name' => $sra->user->name,
                        'email' => $sra->user->email,
                        'institutional_id' => $sra->user->institutional_id ?: sprintf('DSSC-USR-%03d', $sra->user->id),
                        'scope_level' => $sra->scope_level,
                        'scope_code' => $scopeCode,
                        'designation_type' => $sra->designation_type ?: 'Primary',
                        'status' => $sra->status ?: 'Active',
                    ]);
                }
            }

            foreach ($role->users as $u) {
                if (! $assignedUsers->contains('id', $u->id)) {
                    $assignedUsers->push([
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'institutional_id' => $u->institutional_id ?: sprintf('DSSC-USR-%03d', $u->id),
                        'scope_level' => $role->tier ?: 'College',
                        'scope_code' => strtoupper(substr($role->tier ?: 'COL', 0, 4)),
                        'designation_type' => 'Primary',
                        'status' => $u->account_status ?: 'Active',
                    ]);
                }
            }

            $roleLogs = $auditLogs->filter(function (InstitutionAuditLog $log) use ($role) {
                return str_contains(strtolower($log->target_name ?? ''), strtolower($role->name));
            })->take(15)->map(fn (InstitutionAuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'target_name' => $log->target_name,
                'actor_name' => $log->actor_name ?: 'Dr. Arthur Pendelton',
                'actor_role' => $log->actor_role ?: 'Institution Super Admin',
                'reason' => $log->reason,
                'severity' => $log->severity ?: 'info',
                'previous_value' => $log->previous_value,
                'new_value' => $log->new_value,
                'timestamp' => $log->created_at?->format('M d, Y · h:i A') ?? 'Recently',
            ])->values()->all();

            $uniqueUserCount = $assignedUsers->unique('id')->count();
            $scopedCount = $role->scoped_assignments_count ?? 0;
            $isSystem = (bool) $role->is_system_role;

            $canDelete = ! $isSystem && $uniqueUserCount === 0 && $scopedCount === 0;
            $deleteBlockReason = null;
            if ($isSystem) {
                $deleteBlockReason = 'Protected core system role. System roles cannot be permanently deleted; use Deactivate / Retire Role if needed.';
            } elseif ($uniqueUserCount > 0 || $scopedCount > 0) {
                $deleteBlockReason = "Assigned to {$uniqueUserCount} user(s) across {$scopedCount} scoped binding(s). Deactivate / Retire Role instead to preserve historical assignments and audit integrity.";
            }

            $role->setAttribute('status', $role->status ?: 'Active');
            $role->setAttribute(
                'allowed_scopes',
                ! empty($role->allowed_scopes)
                    ? $role->allowed_scopes
                    : ($defaultScopesByTier[$role->tier ?? 'College'] ?? ['College', 'Program']),
            );
            $role->setAttribute('requires_mfa', (bool) ($role->requires_mfa || in_array($role->risk_level, ['Critical', 'High'])));
            $role->setAttribute('requires_approval', (bool) ($role->requires_approval || in_array($role->risk_level, ['Critical', 'High', 'Elevated'])));
            $role->setAttribute('assigned_users', $assignedUsers->unique('id')->values()->all());
            $role->setAttribute('users_count', $uniqueUserCount);
            $role->setAttribute('role_audit_logs', $roleLogs);
            $role->setAttribute('can_delete', $canDelete);
            $role->setAttribute('delete_block_reason', $deleteBlockReason);
            $role->setAttribute('updated_at_formatted', $role->updated_at?->format('M d, Y · h:i A') ?? 'Nov 05, 2026');

            return $role;
        });

        $formattedAuditHistory = $auditLogs->map(fn (InstitutionAuditLog $log) => [
            'id' => $log->id,
            'module' => $log->module,
            'action' => $log->action,
            'target_name' => $log->target_name,
            'actor_name' => $log->actor_name ?: 'Dr. Arthur Pendelton',
            'actor_role' => $log->actor_role ?: 'Institution Super Admin',
            'reason' => $log->reason,
            'severity' => $log->severity ?: 'info',
            'previous_value' => $log->previous_value,
            'new_value' => $log->new_value,
            'timestamp' => $log->created_at?->format('M d, Y · h:i A') ?? 'Recently',
        ])->values()->all();

        return Inertia::render('institution/users/roles-permissions', [
            'roles' => $roles,
            'permissions' => $permissions,
            'auditHistory' => $formattedAuditHistory,
        ]);
    }

    /**
     * Create a new Reusable Role
     */
    public function storeRole(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'tier' => 'required|string|in:Institution,Entity,College,Program,Operational,Academic',
            'portal_type' => 'nullable|string|max:50',
            'risk_level' => 'required|string|in:Critical,High,Elevated,Standard,Restricted',
            'status' => 'nullable|string|in:Active,Inactive,Retired',
            'description' => 'nullable|string|max:500',
            'allowed_scopes' => 'nullable|array',
            'assignable_by' => 'nullable|array',
            'requires_mfa' => 'nullable|boolean',
            'requires_approval' => 'nullable|boolean',
            'icon_key' => 'nullable|string|max:50',
            'permission_ids' => 'nullable|array',
        ]);

        $actor = $request->user();
        if ($actor && ! $actor->isInstitutionSuperAdmin()) {
            if ($actor->hasRole('Dean') && ! in_array($validated['tier'], ['Program', 'Academic'])) {
                return back()->with('error', 'Deans may only create roles within Program or Academic tiers.');
            }
            if ($actor->isCollegeAdmin() && ! in_array($validated['tier'], ['College', 'Operational', 'Academic'])) {
                return back()->with('error', 'College Admins may only create roles within College, Operational, or Academic tiers.');
            }
        }

        $meta = PortalContextService::resolveRolePortalMeta($validated['name']);

        $role = Role::create([
            'name' => $validated['name'],
            'tier' => $validated['tier'],
            'portal_type' => $validated['portal_type'] ?? $meta['portal_type'],
            'risk_level' => $validated['risk_level'],
            'is_system_role' => false,
            'status' => $validated['status'] ?? 'Active',
            'description' => $validated['description'] ?? null,
            'allowed_scopes' => $validated['allowed_scopes'] ?? [$validated['tier']],
            'assignable_by' => $validated['assignable_by'] ?? ['Institution Super Admin', 'College Admin', 'Dean'],
            'requires_mfa' => $validated['requires_mfa'] ?? in_array($validated['risk_level'], ['Critical', 'High']),
            'requires_approval' => $validated['requires_approval'] ?? true,
            'icon_key' => $validated['icon_key'] ?? 'shield',
        ]);

        $permIds = $validated['permission_ids'] ?? [];
        if (! empty($permIds)) {
            $role->permissions()->sync($permIds);
        }

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: 'Created Reusable Role',
            targetName: "{$role->name} ({$role->tier} · {$role->risk_level} Risk)",
            actor: $request->user(),
            previousValue: null,
            newValue: [
                'name' => $role->name,
                'tier' => $role->tier,
                'risk_level' => $role->risk_level,
                'status' => $role->status,
                'allowed_scopes' => $role->allowed_scopes,
                'permissions_count' => count($permIds),
            ],
            reason: 'Custom reusable role created via Velora Role Editor.',
            severity: 'success',
        );

        return back()->with('success', "Role '{$role->name}' created with ".count($permIds).' permissions.');
    }

    /**
     * Update an existing Role (Basic Info, Module Access, Action Permissions, Scope Restrictions)
     */
    public function updateRole(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name,'.$role->id,
            'tier' => 'required|string|in:Institution,Entity,College,Program,Operational,Academic',
            'risk_level' => 'required|string|in:Critical,High,Elevated,Standard,Restricted',
            'status' => 'nullable|string|in:Active,Inactive,Retired',
            'description' => 'nullable|string|max:500',
            'allowed_scopes' => 'nullable|array',
            'requires_mfa' => 'nullable|boolean',
            'requires_approval' => 'nullable|boolean',
            'icon_key' => 'nullable|string|max:50',
            'permission_ids' => 'nullable|array',
            'reason' => 'nullable|string|max:500',
        ]);

        // Prevent deactivating/retiring the Institution Super Admin role
        if ($role->name === 'Institution Super Admin' && isset($validated['status']) && $validated['status'] !== 'Active') {
            return back()->withErrors([
                'status' => 'The Institution Super Admin role is the central governance authority and must remain Active.',
            ]);
        }

        $previousPerms = $role->permissions()->pluck('name', 'permissions.id')->toArray();
        $prevSnapshot = [
            'name' => $role->name,
            'tier' => $role->tier,
            'risk_level' => $role->risk_level,
            'status' => $role->status ?: 'Active',
            'allowed_scopes' => $role->allowed_scopes,
            'permissions_count' => count($previousPerms),
        ];

        $role->update([
            'name' => $role->is_system_role && $role->name === 'Institution Super Admin' ? $role->name : $validated['name'],
            'tier' => $validated['tier'],
            'risk_level' => $validated['risk_level'],
            'status' => $validated['status'] ?? ($role->status ?: 'Active'),
            'description' => $validated['description'] ?? $role->description,
            'allowed_scopes' => $validated['allowed_scopes'] ?? $role->allowed_scopes,
            'requires_mfa' => $validated['requires_mfa'] ?? $role->requires_mfa,
            'requires_approval' => $validated['requires_approval'] ?? $role->requires_approval,
            'icon_key' => $validated['icon_key'] ?? $role->icon_key,
        ]);

        $addedNames = [];
        $removedNames = [];

        if (array_key_exists('permission_ids', $validated)) {
            $newIds = array_map('intval', $validated['permission_ids'] ?? []);
            $oldIds = array_map('intval', array_keys($previousPerms));

            $addedIds = array_diff($newIds, $oldIds);
            $removedIds = array_diff($oldIds, $newIds);

            if (! empty($addedIds)) {
                $addedNames = Permission::whereIn('id', $addedIds)->pluck('name')->all();
            }
            if (! empty($removedIds)) {
                $removedNames = Permission::whereIn('id', $removedIds)->pluck('name')->all();
            }

            $role->permissions()->sync($newIds);
        }

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: 'Updated Role & Permission Bundle',
            targetName: "{$role->name} ({$role->tier})",
            actor: $request->user(),
            previousValue: $prevSnapshot,
            newValue: [
                'name' => $role->name,
                'tier' => $role->tier,
                'risk_level' => $role->risk_level,
                'status' => $role->status,
                'allowed_scopes' => $role->allowed_scopes,
                'added_permissions' => array_slice($addedNames, 0, 12),
                'removed_permissions' => array_slice($removedNames, 0, 12),
                'permissions_count' => $role->permissions()->count(),
            ],
            reason: $validated['reason'] ?? sprintf(
                'Modified role configuration (+%d granted, -%d revoked).',
                count($addedNames),
                count($removedNames),
            ),
            severity: in_array($role->risk_level, ['Critical', 'High']) ? 'warning' : 'info',
        );

        return back()->with('success', "Role '{$role->name}' updated successfully.");
    }

    /**
     * Duplicate an existing Role into a new Custom Role
     */
    public function duplicateRole(Request $request, Role $role): RedirectResponse
    {
        $baseName = trim((string) $request->input('name', "{$role->name} (Copy)"));
        $candidateName = $baseName;
        $counter = 2;
        while (Role::where('name', $candidateName)->exists()) {
            $candidateName = "{$baseName} {$counter}";
            $counter++;
        }

        $copy = Role::create([
            'name' => $candidateName,
            'tier' => $role->tier ?: 'College',
            'risk_level' => $role->risk_level ?: 'Standard',
            'is_system_role' => false,
            'status' => 'Active',
            'description' => $role->description ? "Cloned from {$role->name}: {$role->description}" : "Custom role duplicated from {$role->name}.",
            'allowed_scopes' => $role->allowed_scopes ?: [$role->tier ?: 'College'],
            'requires_mfa' => (bool) $role->requires_mfa,
            'requires_approval' => (bool) $role->requires_approval,
            'icon_key' => $role->icon_key ?: 'shield',
        ]);

        $permIds = $role->permissions()->pluck('permissions.id')->all();
        $copy->permissions()->sync($permIds);

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: 'Duplicated Role Definition',
            targetName: "{$copy->name} (from {$role->name})",
            actor: $request->user(),
            previousValue: ['source_role' => $role->name, 'permissions_count' => count($permIds)],
            newValue: ['new_role' => $copy->name, 'tier' => $copy->tier, 'permissions_count' => count($permIds)],
            reason: "Duplicated role '{$role->name}' as a customizable role template.",
            severity: 'success',
        );

        return back()->with('success', "Duplicated '{$role->name}' as '{$copy->name}'.");
    }

    /**
     * Activate, Deactivate, or Retire a Role while preserving historical assignments & audit trail
     */
    public function updateRoleStatus(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Active,Inactive,Retired',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($role->name === 'Institution Super Admin' && $validated['status'] !== 'Active') {
            return back()->with('error', 'Protection Policy: The Institution Super Admin role cannot be deactivated or retired.');
        }

        $prevStatus = $role->status ?: 'Active';
        $role->update(['status' => $validated['status']]);

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: $validated['status'] === 'Active' ? 'Activated Role' : "Marked Role as {$validated['status']}",
            targetName: "{$role->name} ({$role->tier})",
            actor: $request->user(),
            previousValue: ['status' => $prevStatus],
            newValue: ['status' => $validated['status']],
            reason: $validated['reason'] ?? "Role lifecycle status changed from {$prevStatus} to {$validated['status']} while preserving historical assignments.",
            severity: $validated['status'] === 'Active' ? 'success' : 'warning',
        );

        return back()->with('success', "Role '{$role->name}' status updated to {$validated['status']}.");
    }

    /**
     * Delete an eligible Custom Role (Blocks system roles and roles with assignments)
     */
    public function destroyRole(Request $request, Role $role): RedirectResponse
    {
        if ($role->is_system_role || $role->name === 'Institution Super Admin') {
            return back()->with(
                'error',
                "Protection Policy: '{$role->name}' is a protected core system role and cannot be permanently deleted. Use Deactivate / Retire Role instead.",
            );
        }

        $usersCount = $role->users()->count();
        $scopedCount = $role->scopedAssignments()->count();

        if ($usersCount > 0 || $scopedCount > 0) {
            return back()->with(
                'error',
                "Cannot permanently delete '{$role->name}' because it has {$usersCount} user(s) and {$scopedCount} scoped assignment(s). Deactivate / Retire Role to preserve historical audit records.",
            );
        }

        $roleName = $role->name;
        $roleTier = $role->tier;
        $permCount = $role->permissions()->count();

        $role->permissions()->detach();
        $role->delete();

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: 'Permanently Deleted Custom Role',
            targetName: "{$roleName} ({$roleTier})",
            actor: $request->user(),
            previousValue: ['name' => $roleName, 'tier' => $roleTier, 'permissions_count' => $permCount],
            newValue: null,
            reason: 'Deleted unassigned custom role with zero active or historical dependencies.',
            severity: 'warning',
        );

        return back()->with('success', "Custom role '{$roleName}' permanently deleted.");
    }

    /**
     * Toggle a single cell in the Role x Permission Matrix
     */
    public function toggleRolePermission(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        $permission = Permission::findOrFail($validated['permission_id']);
        $attached = $role->permissions()->where('permission_id', $permission->id)->exists();

        if ($attached) {
            $role->permissions()->detach($permission->id);
            $action = 'Revoked Permission from Role';
        } else {
            $role->permissions()->attach($permission->id);
            $action = 'Granted Permission to Role';
        }

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: $action,
            targetName: "{$role->name} ↔ {$permission->name}",
            actor: $request->user(),
            previousValue: ['permission' => $permission->name, 'module' => $permission->module, 'granted' => $attached],
            newValue: ['permission' => $permission->name, 'module' => $permission->module, 'granted' => ! $attached],
            reason: "Permission matrix updated for role '{$role->name}' ({$permission->module} · {$permission->capability}).",
            severity: 'info',
        );

        return back()->with('success', "Updated '{$permission->name}' on {$role->name}.");
    }

    /**
     * Bulk sync module or role permissions
     */
    public function syncRolePermissions(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'permission_ids' => 'present|array',
            'reason' => 'nullable|string|max:500',
        ]);

        $oldIds = $role->permissions()->pluck('permissions.id')->map(fn ($id) => (int) $id)->all();
        $newIds = array_map('intval', $validated['permission_ids']);

        $addedIds = array_diff($newIds, $oldIds);
        $removedIds = array_diff($oldIds, $newIds);

        $addedNames = ! empty($addedIds) ? Permission::whereIn('id', $addedIds)->pluck('name')->all() : [];
        $removedNames = ! empty($removedIds) ? Permission::whereIn('id', $removedIds)->pluck('name')->all() : [];

        $role->permissions()->sync($newIds);

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: 'Updated Role Permission Matrix',
            targetName: "{$role->name} ({$role->tier})",
            actor: $request->user(),
            previousValue: ['permissions_count' => count($oldIds), 'revoked' => array_slice($removedNames, 0, 10)],
            newValue: ['permissions_count' => count($newIds), 'granted' => array_slice($addedNames, 0, 10)],
            reason: $validated['reason'] ?? sprintf('Synced permissions (+%d added, -%d removed).', count($addedNames), count($removedNames)),
            severity: 'info',
        );

        return back()->with('success', "Saved permission changes for '{$role->name}'.");
    }

    /**
     * 6. Scoped Role Assignments & Access Requests / Delegation Workspace
     */
    public function scopedRoles(Request $request): Response
    {
        $assignments = ScopedRoleAssignment::with(['user', 'role', 'entity', 'college', 'program', 'facility', 'replacingUser', 'assignedBy'])->latest()->get();
        $accessRequests = InstitutionAccessRequest::with(['requester', 'targetUser', 'requestedRole', 'entity', 'college', 'program', 'reviewer'])->latest()->get();
        $users = User::select('id', 'name', 'email', 'institutional_id')->orderBy('name')->get();
        $roles = Role::orderBy('name')->get();
        $entities = College::where('type', 'Entity')->orderBy('code')->get();
        $colleges = College::where('type', '!=', 'Entity')->orderBy('code')->get();
        $programs = Program::orderBy('code')->get();
        $facilities = Room::select('id', 'room_name', 'type')->orderBy('room_name')->get();

        return Inertia::render('institution/users/scoped-roles', [
            'assignments' => $assignments,
            'accessRequests' => $accessRequests,
            'users' => $users,
            'roles' => $roles,
            'entities' => $entities,
            'colleges' => $colleges,
            'programs' => $programs,
            'facilities' => $facilities,
            'initialTab' => $request->query('tab', 'assignments'),
        ]);
    }

    /**
     * Bind User + Role + Scope + Effective Period + Designation Type
     */
    public function storeScopedRole(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_id' => 'required|exists:roles,id',
            'scope_level' => 'nullable|string|in:Institution,Entity,College,Program,Facility',
            'entity_id' => 'nullable|exists:colleges,id',
            'college_id' => 'nullable|exists:colleges,id',
            'program_id' => 'nullable|exists:programs,id',
            'facility_id' => 'nullable|exists:rooms,id',
            'designation_type' => 'nullable|string|in:Primary,Secondary,Acting,Replacement,Scheduled,Concurrent,Special Assignment',
            'appointment_reference' => 'nullable|string|max:255',
            'assignment_reason' => 'nullable|string|max:500',
            'replacing_user_id' => 'nullable|exists:users,id',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
            'notes' => 'nullable|string|max:500',
        ]);

        $scopeLevel = $validated['scope_level']
            ?? (! empty($validated['program_id']) ? 'Program' : (! empty($validated['college_id']) ? 'College' : (! empty($validated['entity_id']) ? 'Entity' : 'Institution')));

        $user = User::find($validated['user_id']);
        $role = Role::find($validated['role_id']);
        $actor = $request->user();

        // Enforce Assignable Roles Matrix
        if ($actor && ! app(PortalContextService::class)->canAssignRole($actor, $role, $scopeLevel, $validated['college_id'] ?? null)) {
            return back()->with('error', "Authority policy violation: You are not authorized to assign the role '{$role->name}' within this scope.");
        }

        $isFuture = ! empty($validated['effective_from']) && $validated['effective_from'] > now()->toDateString();

        $assignment = ScopedRoleAssignment::create([
            ...$validated,
            'institution' => 'Davao Del Sur State College',
            'scope_level' => $scopeLevel,
            'designation_type' => $validated['designation_type'] ?? ($isFuture ? 'Scheduled' : 'Primary'),
            'status' => $isFuture ? 'Scheduled' : 'Active',
            'assigned_by_user_id' => $actor?->id,
        ]);

        // Also attach role to user_role pivot so role checks recognize the capability
        $user = User::find($validated['user_id']);
        $role = Role::find($validated['role_id']);
        if ($user && $role && ! $user->roles()->where('role_id', $role->id)->exists()) {
            $user->roles()->attach($role->id);
        }

        InstitutionAuditLog::record(
            module: 'Scoped Assignments',
            action: "Granted {$assignment->designation_type} Scoped Role",
            targetName: "{$user?->name} → {$role?->name} ({$scopeLevel})",
            actor: $request->user(),
            previousValue: null,
            newValue: $assignment->only(['user_id', 'role_id', 'scope_level', 'entity_id', 'college_id', 'program_id', 'designation_type', 'effective_from', 'effective_until']),
            reason: $validated['notes'] ?? 'Scoped authority bound by Institution Super Admin.',
            severity: 'success',
        );

        return back()->with('success', 'Scoped role assignment bound and recorded in role history.');
    }

    /**
     * Revoke, Expire, or Reactivate a Scoped Role Assignment
     */
    public function updateScopedRoleStatus(Request $request, ScopedRoleAssignment $assignment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Active,Expired,Revoked,Scheduled',
            'reason' => 'nullable|string|max:500',
        ]);

        $prev = $assignment->status;
        $assignment->update(['status' => $validated['status']]);

        InstitutionAuditLog::record(
            module: 'Scoped Assignments',
            action: "Changed Scoped Assignment Status to {$validated['status']}",
            targetName: "{$assignment->user?->name} · {$assignment->role?->name}",
            actor: $request->user(),
            previousValue: ['status' => $prev],
            newValue: ['status' => $validated['status']],
            reason: $validated['reason'] ?? 'Scoped role lifecycle updated.',
            severity: $validated['status'] === 'Revoked' ? 'warning' : 'info',
        );

        return back()->with('success', "Scoped assignment marked as {$validated['status']}.");
    }

    /**
     * Submit an Access Request / Temporary Elevation Request
     */
    public function storeAccessRequest(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'target_user_id' => 'required|exists:users,id',
            'requested_role_id' => 'required|exists:roles,id',
            'scope_level' => 'required|string|in:Institution,Entity,College,Program,Facility',
            'entity_id' => 'nullable|exists:colleges,id',
            'college_id' => 'nullable|exists:colleges,id',
            'program_id' => 'nullable|exists:programs,id',
            'designation_type' => 'required|string|in:Primary,Secondary,Acting,Emergency Elevation',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
            'justification' => 'required|string|max:1000',
        ]);

        $req = InstitutionAccessRequest::create([
            ...$validated,
            'requester_user_id' => $request->user()?->id ?? $validated['target_user_id'],
            'status' => 'Pending',
        ]);

        InstitutionAuditLog::record(
            module: 'Access Requests',
            action: 'Submitted Access / Delegation Request',
            targetName: "Request #{$req->id} for User #{$req->target_user_id}",
            actor: $request->user(),
            previousValue: null,
            newValue: $validated,
            reason: $validated['justification'],
        );

        return back()->with('success', 'Access & delegation request submitted for Institution Super Admin review.');
    }

    /**
     * Approve or Deny an Access Request (Audited, Auto-creates ScopedRoleAssignment on Approval)
     */
    public function reviewAccessRequest(Request $request, InstitutionAccessRequest $accessRequest): RedirectResponse
    {
        abort_unless($request->user()?->isInstitutionSuperAdmin(), 403, 'Only the Institution Super Admin can approve or deny cross-entity or elevated access requests.');

        $validated = $request->validate([
            'decision' => 'required|string|in:Approved,Denied,Revoked',
            'decision_remarks' => 'nullable|string|max:500',
        ]);

        $accessRequest->update([
            'status' => $validated['decision'],
            'reviewed_by_user_id' => $request->user()?->id,
            'reviewed_at' => now(),
            'decision_remarks' => $validated['decision_remarks'] ?? null,
        ]);

        if ($validated['decision'] === 'Approved') {
            ScopedRoleAssignment::create([
                'user_id' => $accessRequest->target_user_id,
                'role_id' => $accessRequest->requested_role_id,
                'institution' => 'Davao Del Sur State College',
                'scope_level' => $accessRequest->scope_level,
                'entity_id' => $accessRequest->entity_id,
                'college_id' => $accessRequest->college_id,
                'program_id' => $accessRequest->program_id,
                'designation_type' => $accessRequest->designation_type,
                'effective_from' => $accessRequest->effective_from ?? now()->toDateString(),
                'effective_until' => $accessRequest->effective_until,
                'status' => 'Active',
                'notes' => "Approved Access Request #{$accessRequest->id}: {$accessRequest->justification}",
                'assigned_by_user_id' => $request->user()?->id,
            ]);

            $targetUser = User::find($accessRequest->target_user_id);
            if ($targetUser && ! $targetUser->roles()->where('role_id', $accessRequest->requested_role_id)->exists()) {
                $targetUser->roles()->attach($accessRequest->requested_role_id);
            }
        }

        InstitutionAuditLog::record(
            module: 'Access Requests',
            action: "{$validated['decision']} Access Request #{$accessRequest->id}",
            targetName: "{$accessRequest->targetUser?->name} → {$accessRequest->requestedRole?->name}",
            actor: $request->user(),
            previousValue: ['status' => 'Pending'],
            newValue: ['status' => $validated['decision'], 'remarks' => $validated['decision_remarks'] ?? null],
            reason: $validated['decision_remarks'] ?? $accessRequest->justification,
            severity: $validated['decision'] === 'Approved' ? 'success' : 'warning',
        );

        return back()->with('success', "Access request #{$accessRequest->id} {$validated['decision']}.");
    }

    /**
     * 7. Module Management & Feature Flags Rollout
     */
    public function modules(Request $request): Response
    {
        $allUnits = College::orderBy('type', 'desc')->orderBy('code')->get();
        $featureFlags = InstitutionSetting::getVal('feature_flags', []);

        return Inertia::render('institution/platform/modules', [
            'colleges' => $allUnits,
            'modulesCatalog' => $this->getModulesCatalog(),
            'featureFlags' => $featureFlags,
            'initialTab' => $request->query('tab', 'modules'),
        ]);
    }

    /**
     * Toggle a Feature Flag at the Institution level
     */
    public function toggleFeatureFlag(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'flag_key' => 'required|string|max:100',
        ]);

        $flags = InstitutionSetting::getVal('feature_flags', []);
        $prevVal = (bool) ($flags[$validated['flag_key']] ?? false);
        $flags[$validated['flag_key']] = ! $prevVal;

        InstitutionSetting::setVal('feature_flags', $flags, 'platform', 'Institutional Feature Flags');

        InstitutionAuditLog::record(
            module: 'Modules & Feature Flags',
            action: ($flags[$validated['flag_key']] ? 'Enabled' : 'Disabled').' Feature Flag',
            targetName: $validated['flag_key'],
            actor: $request->user(),
            previousValue: [$validated['flag_key'] => $prevVal],
            newValue: [$validated['flag_key'] => ! $prevVal],
            reason: 'Controlled rollout toggle by Institution Super Admin.',
        );

        return back()->with('success', "Feature flag '{$validated['flag_key']}' updated.");
    }

    /**
     * Toggle a Module for a specific Entity or College directly from the Matrix
     */
    public function toggleCollegeModule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'college_id' => 'required|exists:colleges,id',
            'module_key' => 'required|string|max:100',
        ]);

        $unit = College::findOrFail($validated['college_id']);
        $mods = $unit->enabled_modules ?? [];
        $current = (bool) ($mods[$validated['module_key']] ?? false);
        $mods[$validated['module_key']] = ! $current;
        $unit->update(['enabled_modules' => $mods]);

        InstitutionAuditLog::record(
            module: 'Modules & Feature Flags',
            action: ($mods[$validated['module_key']] ? 'Enabled' : 'Disabled')." Module '{$validated['module_key']}'",
            targetName: "{$unit->code} ({$unit->name})",
            actor: $request->user(),
            previousValue: [$validated['module_key'] => $current],
            newValue: [$validated['module_key'] => ! $current],
            reason: 'Module availability matrix updated.',
            collegeScope: $unit->code,
        );

        return back()->with('success', "Updated '{$validated['module_key']}' availability for {$unit->code}.");
    }

    /**
     * 8. Terminology Configuration (Entity, College, Program, Roles, Facilities)
     */
    public function terminology(): Response
    {
        $terminology = InstitutionSetting::getVal('terminology_overrides', []);
        $colleges = College::orderBy('type', 'desc')->orderBy('code')->get(['id', 'code', 'name', 'type']);

        return Inertia::render('institution/platform/terminology', [
            'terminology' => $terminology,
            'colleges' => $colleges,
        ]);
    }

    /**
     * Save Terminology Overrides
     */
    public function updateTerminology(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'terminology' => 'required|array',
        ]);

        $prev = InstitutionSetting::getVal('terminology_overrides', []);
        InstitutionSetting::setVal('terminology_overrides', $validated['terminology'], 'terminology', 'Configurable Terminology Mappings');

        InstitutionAuditLog::record(
            module: 'Terminology',
            action: 'Updated Institutional Terminology Overrides',
            targetName: 'Global & Scoped Label Dictionary',
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated['terminology'],
            reason: 'Customized organizational and role terminology across scopes.',
        );

        return back()->with('success', 'Institutional terminology mappings updated successfully.');
    }

    /**
     * 9. Policy & Standards Management (Institution Default -> Entity Override -> College Override)
     */
    public function policies(): Response
    {
        $policies = InstitutionPolicyTemplate::orderBy('code')->get();

        return Inertia::render('institution/platform/policies', [
            'policies' => $policies,
        ]);
    }

    /**
     * Create a new Policy Template
     */
    public function storePolicy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:institution_policy_templates,code',
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'version' => 'required|string|max:20',
            'status' => 'required|string|in:Draft,Active,Deprecated,Archived',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date',
            'inheritance_mode' => 'required|string|in:Mandatory Locked,Allow Entity Override,Allow College Override',
            'allow_entity_override' => 'boolean',
            'allow_college_override' => 'boolean',
            'parameters' => 'nullable|array',
            'description' => 'nullable|string|max:1000',
        ]);

        $policy = InstitutionPolicyTemplate::create([
            ...$validated,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        InstitutionAuditLog::record(
            module: 'Policies',
            action: 'Created Policy Template',
            targetName: "{$policy->code} · {$policy->title}",
            actor: $request->user(),
            previousValue: null,
            newValue: $validated,
            reason: 'Defined institutional policy standard.',
            severity: 'success',
        );

        return back()->with('success', "Policy template '{$policy->code}' created.");
    }

    /**
     * Update an existing Policy Template
     */
    public function updatePolicy(Request $request, InstitutionPolicyTemplate $policy): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'version' => 'required|string|max:20',
            'status' => 'required|string|in:Draft,Active,Deprecated,Archived',
            'inheritance_mode' => 'required|string|in:Mandatory Locked,Allow Entity Override,Allow College Override',
            'allow_entity_override' => 'boolean',
            'allow_college_override' => 'boolean',
            'parameters' => 'nullable|array',
            'description' => 'nullable|string|max:1000',
        ]);

        $prev = $policy->only(['version', 'status', 'inheritance_mode', 'parameters']);
        $policy->update([
            ...$validated,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        InstitutionAuditLog::record(
            module: 'Policies',
            action: 'Updated Policy Template',
            targetName: "{$policy->code} · {$policy->title}",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated,
            reason: "Updated policy version {$validated['version']} and inheritance rules.",
        );

        return back()->with('success', "Policy '{$policy->code}' updated.");
    }

    /**
     * 10. Workflow Builder (Reusable Approval & Verification Pipelines)
     */
    public function workflows(): Response
    {
        $workflows = InstitutionWorkflowDefinition::orderBy('code')->get();
        $roles = Role::orderBy('name')->get(['id', 'name', 'tier']);

        return Inertia::render('institution/platform/workflows', [
            'workflows' => $workflows,
            'roles' => $roles,
        ]);
    }

    /**
     * Create a new Reusable Workflow Definition
     */
    public function storeWorkflow(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:institution_workflow_definitions,code',
            'name' => 'required|string|max:255',
            'module' => 'required|string|max:100',
            'scope_level' => 'required|string|in:Institution,Entity,College',
            'version' => 'required|string|max:20',
            'status' => 'required|string|in:Draft,Active,Archived',
            'return_behavior' => 'required|string|in:Return to Previous Step,Return to Submitter',
            'allow_delegation' => 'boolean',
            'separation_of_duties_enforced' => 'boolean',
            'final_state' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'steps' => 'required|array|min:1',
        ]);

        $workflow = InstitutionWorkflowDefinition::create([
            ...$validated,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        InstitutionAuditLog::record(
            module: 'Workflows',
            action: 'Created Approval Workflow Pipeline',
            targetName: "{$workflow->code} · {$workflow->name}",
            actor: $request->user(),
            previousValue: null,
            newValue: $validated,
            reason: 'Registered reusable multi-step verification workflow.',
            severity: 'success',
        );

        return back()->with('success', "Workflow '{$workflow->code}' created.");
    }

    /**
     * Update a Workflow Definition
     */
    public function updateWorkflow(Request $request, InstitutionWorkflowDefinition $workflow): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'version' => 'required|string|max:20',
            'status' => 'required|string|in:Draft,Active,Archived',
            'return_behavior' => 'required|string|in:Return to Previous Step,Return to Submitter',
            'allow_delegation' => 'boolean',
            'separation_of_duties_enforced' => 'boolean',
            'final_state' => 'required|string|max:100',
            'steps' => 'required|array|min:1',
        ]);

        $prev = $workflow->only(['version', 'status', 'return_behavior', 'separation_of_duties_enforced', 'steps']);
        $workflow->update([
            ...$validated,
            'updated_by_user_id' => $request->user()?->id,
        ]);

        InstitutionAuditLog::record(
            module: 'Workflows',
            action: 'Updated Workflow Pipeline',
            targetName: "{$workflow->code} · {$workflow->name}",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated,
            reason: 'Modified approval workflow steps or separation-of-duties rules.',
        );

        return back()->with('success', "Workflow '{$workflow->code}' saved.");
    }

    /**
     * 11. Integrations, Data Sources & Sync/Reconciliation Configuration
     */
    public function integrations(Request $request): Response
    {
        $integrations = InstitutionSetting::getVal('integrations_status', []);
        $syncConfig = InstitutionSetting::getVal('sync_reconciliation_config', []);

        return Inertia::render('institution/integrations/index', [
            'integrations' => $integrations,
            'syncConfig' => $syncConfig,
            'initialTab' => $request->query('tab', 'connections'),
        ]);
    }

    /**
     * Update Sync & Reconciliation Standards
     */
    public function updateSyncConfig(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sync_config' => 'required|array',
        ]);

        $prev = InstitutionSetting::getVal('sync_reconciliation_config', []);
        InstitutionSetting::setVal('sync_reconciliation_config', $validated['sync_config'], 'integrations', 'Sync & Reconciliation Standards');

        InstitutionAuditLog::record(
            module: 'Integrations',
            action: 'Updated Sync & Reconciliation Thresholds',
            targetName: 'Institution Data Precedence & Confidence Rules',
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated['sync_config'],
            reason: 'Adjusted confidence thresholds and human-approval gates for imported data.',
        );

        return back()->with('success', 'Sync and reconciliation standards updated.');
    }

    /**
     * 10b. Global Defaults (Operating hours, time format, pagination, file naming, retention, notifications)
     */
    public function globalDefaults(): Response
    {
        $defaults = InstitutionSetting::getVal('global_platform_defaults', [
            'operating_hours_start' => '07:00',
            'operating_hours_end' => '21:00',
            'time_format' => '12-hour (AM/PM)',
            'default_pagination' => 25,
            'report_naming_convention' => '{INSTITUTION}_{ENTITY}_{COLLEGE}_{MODULE}_{AY}_{SEM}_{DATE}',
            'default_retention_years' => 5,
            'session_timeout_minutes' => 120,
            'notification_channels' => ['in_app' => true, 'email_digest' => true, 'tv_ticker_urgent' => true],
            'common_statuses' => ['Draft', 'Submitted', 'Under Review', 'Verified', 'Approved', 'Published', 'Archived'],
        ]);

        return Inertia::render('institution/platform/global-defaults', [
            'defaults' => $defaults,
        ]);
    }

    /**
     * Save Global Platform Defaults
     */
    public function updateGlobalDefaults(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'defaults' => 'required|array',
        ]);

        $prev = InstitutionSetting::getVal('global_platform_defaults', []);
        InstitutionSetting::setVal('global_platform_defaults', $validated['defaults'], 'platform', 'Global Platform Defaults');

        InstitutionAuditLog::record(
            module: 'Global Defaults',
            action: 'Updated Institutional Platform Defaults',
            targetName: 'Global Operating & UI Defaults',
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated['defaults'],
            reason: 'Updated global operating hours, pagination, file naming, or session defaults.',
        );

        return back()->with('success', 'Global platform defaults updated.');
    }

    /**
     * 10c. Academic Governance Oversight (Program Portfolio, Curriculum Oversight, Course Catalog Oversight, Scheduling Oversight)
     */
    public function academicGovernance(Request $request): Response
    {
        $programs = Program::with(['college.parent', 'curricula'])
            ->withCount('courses')
            ->orderBy('code')
            ->get();

        $curricula = Curriculum::with(['program.college'])
            ->withCount('courses')
            ->orderByDesc('effective_year')
            ->get();

        $courses = Course::with(['program.college', 'curriculum'])
            ->orderBy('code')
            ->limit(150)
            ->get();

        $colleges = College::where('type', '!=', 'Entity')
            ->with(['parent', 'programs'])
            ->orderBy('code')
            ->get()
            ->map(function (College $col) {
                $readinessState = match ($col->code) {
                    'CIDS' => 'Published',
                    'COE' => 'Dean Review',
                    'CBA' => '3 Blocking Conflicts',
                    'CED' => 'Faculty Loading Incomplete',
                    default => $col->setup_progress >= 80 ? 'Candidate Review' : 'Setup Incomplete',
                };

                return [
                    'id' => $col->id,
                    'code' => $col->code,
                    'name' => $col->name,
                    'entity_name' => $col->parent?->name ?? 'Main Campus',
                    'dean_name' => $col->dean_name ?? 'Unassigned',
                    'programs_count' => $col->programs->count(),
                    'setup_progress' => $col->setup_progress,
                    'scheduling_state' => $readinessState,
                ];
            });

        return Inertia::render('institution/academic/index', [
            'programs' => $programs,
            'curricula' => $curricula,
            'courses' => $courses,
            'collegesScheduling' => $colleges,
            'initialTab' => $request->query('tab', 'programs'),
        ]);
    }

    /**
     * 12. Data Quality & Configuration Health Module
     */
    public function dataQuality(Request $request): Response
    {
        $issues = $this->computeHealthIssues();
        $allUnits = College::with(['scopedRoles.role', 'entityScopedRoles.role'])
            ->withCount(['programs', 'scopedRoles'])
            ->get();

        return Inertia::render('institution/governance/data-quality', [
            'issues' => $issues,
            'units' => $allUnits,
            'score' => max(60, 100 - (count($issues) * 3)),
            'initialTab' => $request->query('tab', 'data-quality'),
        ]);
    }

    /**
     * 13. Audit Logs, Business-Readable Change History & Security/Privacy Settings
     */
    public function audit(Request $request): Response
    {
        $logs = InstitutionAuditLog::latest()->take(100)->get();
        $securitySettings = InstitutionSetting::getVal('security_privacy_settings', []);
        $roles = Role::orderBy('id')->get(['id', 'name', 'tier', 'risk_level']);

        return Inertia::render('institution/governance/audit-security', [
            'logs' => $logs,
            'securitySettings' => $securitySettings,
            'roles' => $roles,
            'initialTab' => $request->query('tab', 'audit'),
        ]);
    }

    /**
     * Update Security, Separation of Duties & Privacy Settings
     */
    public function updateSecuritySettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'security_settings' => 'required|array',
        ]);

        $prev = InstitutionSetting::getVal('security_privacy_settings', []);
        InstitutionSetting::setVal('security_privacy_settings', $validated['security_settings'], 'security', 'Security, Separation of Duties & Privacy Policy');

        InstitutionAuditLog::record(
            module: 'Security',
            action: 'Updated Institutional Security & Separation-of-Duties Policy',
            targetName: 'Platform Security & Privacy Controls',
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated['security_settings'],
            reason: 'Updated MFA, session, separation-of-duties, or retention controls.',
            severity: 'warning',
        );

        return back()->with('success', 'Security, separation-of-duties, and privacy policies updated.');
    }

    /**
     * 14. Institution-Level Structural & Governance Reports + Report Templates
     * (Distinct from VPAF Executive Analytics — focuses on structural completeness, onboarding, roles, modules, integrations, and security)
     */
    public function reports(Request $request): Response
    {
        $allUnits = College::with(['parent', 'programs', 'scopedRoles.role', 'scopedRoles.user', 'entityScopedRoles.role', 'entityScopedRoles.user'])->get();
        $roles = Role::withCount(['users', 'scopedAssignments', 'permissions'])->get();
        $modulesCatalog = $this->getModulesCatalog();
        $integrations = InstitutionSetting::getVal('integrations_status', []);
        $reportConfig = InstitutionSetting::getVal('global_report_config', []);
        $healthIssues = $this->computeHealthIssues();
        $auditCount = InstitutionAuditLog::count();

        return Inertia::render('institution/governance/reports', [
            'units' => $allUnits,
            'roles' => $roles,
            'modulesCatalog' => $modulesCatalog,
            'integrations' => $integrations,
            'reportConfig' => $reportConfig,
            'healthIssues' => $healthIssues,
            'auditCount' => $auditCount,
            'initialTab' => $request->query('tab', 'reports'),
        ]);
    }
}
