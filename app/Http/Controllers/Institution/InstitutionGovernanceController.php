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

        return Inertia::render('institution/colleges/setup', [
            'colleges' => $allColleges,
            'currentCollege' => $targetCollege,
            'modulesCatalog' => $this->getModulesCatalog(),
        ]);
    }

    /**
     * Update Setup Stage / Progress for a College
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
        ]);

        $prev = $college->only(['setup_stage', 'setup_progress', 'status', 'enabled_modules']);
        $college->update($validated);

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Updated Guided College Onboarding',
            targetName: "{$college->code} ({$validated['setup_stage']} · {$validated['setup_progress']}%)",
            actor: $request->user(),
            previousValue: $prev,
            newValue: $validated,
            reason: "Guided onboarding progressed to {$validated['setup_stage']}.",
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'College',
        );

        return back()->with('success', "Setup updated for {$college->code}.");
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

        $profile = [
            'name' => InstitutionSetting::getVal('institution_name', 'Davao Del Sur State College'),
            'acronym' => InstitutionSetting::getVal('institution_acronym', 'DSSC'),
            'address' => InstitutionSetting::getVal('institution_address', 'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002'),
            'timezone' => InstitutionSetting::getVal('institution_timezone', 'Asia/Manila (UTC+08:00)'),
            'email' => 'president@dssc.edu.ph',
            'website' => 'https://www.dssc.edu.ph',
            'logo_url' => '/DSSC.jpg',
            'report_header' => $reportConfig['header_line_1'].' · '.$reportConfig['header_line_2'],
            'report_footer' => $reportConfig['footer_notice'],
            'report_config' => $reportConfig,
        ];

        return Inertia::render('institution/profile/index', [
            'profile' => $profile,
        ]);
    }

    /**
     * Save Institution Profile & Global Report Configuration
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'acronym' => 'required|string|max:50',
            'address' => 'required|string|max:500',
            'timezone' => 'required|string|max:100',
            'report_config' => 'nullable|array',
        ]);

        InstitutionSetting::setVal('institution_name', $validated['name'], 'profile', 'Institution Full Name');
        InstitutionSetting::setVal('institution_acronym', $validated['acronym'], 'profile', 'Institution Acronym');
        InstitutionSetting::setVal('institution_address', $validated['address'], 'profile', 'Official Campus Address');
        InstitutionSetting::setVal('institution_timezone', $validated['timezone'], 'profile', 'System Timezone');

        if (! empty($validated['report_config'])) {
            InstitutionSetting::setVal('global_report_config', $validated['report_config'], 'profile', 'Global Report Templates & Signatory Standards');
        }

        InstitutionAuditLog::record(
            module: 'Organization',
            action: 'Updated Institution Profile & Report Standards',
            targetName: $validated['name'].' ('.$validated['acronym'].')',
            actor: $request->user(),
            previousValue: null,
            newValue: $validated,
            reason: 'Updated global institutional identity and report header/signatory defaults.',
        );

        return back()->with('success', 'Institution profile and global report standards saved successfully.');
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

            return $u;
        });

        $roles = Role::orderBy('name')->get();
        $entities = College::where('type', 'Entity')->orderBy('code')->get();
        $colleges = College::where('type', '!=', 'Entity')->orderBy('code')->get();
        $programs = Program::orderBy('code')->get();

        $summaryStats = [
            'total_users' => User::count(),
            'active_users' => User::where('account_status', 'Active')->count(),
            'mfa_enforced' => User::where('mfa_required', true)->count(),
            'multi_role_users' => User::has('scopedRoleAssignments', '>=', 2)->count(),
            'entities_covered' => $entities->count(),
            'colleges_covered' => $colleges->count(),
        ];

        return Inertia::render('institution/users/index', [
            'usersPaginator' => $paginator,
            'users' => $paginator->items(),
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
     * 5. Role Management & Granular Permission Matrix UI
     */
    public function roles(): Response
    {
        $roles = Role::with('permissions:id,name,module,capability')->withCount(['users', 'scopedAssignments'])->orderBy('id')->get();
        $permissions = Permission::orderBy('module')->orderBy('name')->get();

        return Inertia::render('institution/users/roles-permissions', [
            'roles' => $roles,
            'permissions' => $permissions,
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
            'risk_level' => 'required|string|in:Critical,High,Elevated,Standard,Restricted',
            'description' => 'nullable|string|max:500',
            'permission_ids' => 'nullable|array',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'tier' => $validated['tier'],
            'risk_level' => $validated['risk_level'],
            'is_system_role' => false,
            'description' => $validated['description'] ?? null,
        ]);

        if (! empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        InstitutionAuditLog::record(
            module: 'Roles & Permissions',
            action: 'Created Reusable Role',
            targetName: "{$role->name} ({$role->tier} · {$role->risk_level} Risk)",
            actor: $request->user(),
            previousValue: null,
            newValue: $validated,
            reason: 'Custom role added to Velora Role Catalog.',
            severity: 'success',
        );

        return back()->with('success', "Role '{$role->name}' created successfully.");
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
            previousValue: ['granted' => $attached],
            newValue: ['granted' => ! $attached],
            reason: "Permission matrix updated for role '{$role->name}'.",
            severity: 'info',
        );

        return back()->with('success', "Updated '{$permission->name}' on {$role->name}.");
    }

    /**
     * 6. Scoped Role Assignments & Access Requests / Delegation Workspace
     */
    public function scopedRoles(Request $request): Response
    {
        $assignments = ScopedRoleAssignment::with(['user', 'role', 'entity', 'college', 'program', 'facility', 'replacingUser'])->latest()->get();
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
            'designation_type' => 'nullable|string|in:Primary,Secondary,Acting,Replacement,Scheduled',
            'replacing_user_id' => 'nullable|exists:users,id',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
            'notes' => 'nullable|string|max:500',
        ]);

        $scopeLevel = $validated['scope_level']
            ?? (! empty($validated['program_id']) ? 'Program' : (! empty($validated['college_id']) ? 'College' : (! empty($validated['entity_id']) ? 'Entity' : 'Institution')));

        $isFuture = ! empty($validated['effective_from']) && $validated['effective_from'] > now()->toDateString();

        $assignment = ScopedRoleAssignment::create([
            ...$validated,
            'institution' => 'Davao Del Sur State College',
            'scope_level' => $scopeLevel,
            'designation_type' => $validated['designation_type'] ?? ($isFuture ? 'Scheduled' : 'Primary'),
            'status' => $isFuture ? 'Scheduled' : 'Active',
            'assigned_by_user_id' => $request->user()?->id,
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
