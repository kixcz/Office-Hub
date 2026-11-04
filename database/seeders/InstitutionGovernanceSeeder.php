<?php

namespace Database\Seeders;

use App\Models\College;
use App\Models\InstitutionAccessRequest;
use App\Models\InstitutionAuditLog;
use App\Models\InstitutionPolicyTemplate;
use App\Models\InstitutionSetting;
use App\Models\InstitutionWorkflowDefinition;
use App\Models\Permission;
use App\Models\Program;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InstitutionGovernanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Entities (Campuses) and Colleges in a true Hierarchical Tree
        $entities = [
            [
                'code' => 'DSSC-MAIN',
                'name' => 'DSSC Main Campus (Matti, Digos City)',
                'acronym' => 'MAIN',
                'type' => 'Entity',
                'entity_type' => 'Main Campus',
                'dean_name' => 'Dr. Eduardo M. Aquino (Campus Director)',
                'contact_email' => 'maincampus@dssc.edu.ph',
                'address' => 'Brgy. Matti, Digos City, Davao del Sur',
                'contact_phone' => '(082) 553-8894',
                'status' => 'Active',
                'effective_from' => '2020-01-01',
                'setup_stage' => 'Active',
                'setup_progress' => 100,
                'color_theme' => 'amber',
                'entity_tv_enabled' => true,
                'allow_local_overrides' => true,
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'lab_monitoring' => true,
                    'lab_inventory' => true,
                    'research_extension' => true,
                    'projects_tasks' => true,
                    'accomplishments' => true,
                    'exam_monitoring' => true,
                    'make_up_classes' => true,
                    'compliance' => true,
                    'tv_studio' => true,
                    'performance' => true,
                ],
            ],
            [
                'code' => 'DSSC-SULOP',
                'name' => 'DSSC Sulop Satellite Campus',
                'acronym' => 'SULOP',
                'type' => 'Entity',
                'entity_type' => 'Satellite Campus',
                'dean_name' => 'Prof. Lourdes V. Mercado (Campus Administrator)',
                'contact_email' => 'sulop.campus@dssc.edu.ph',
                'address' => 'Poblacion, Sulop, Davao del Sur',
                'contact_phone' => '(082) 272-1140',
                'status' => 'Active',
                'effective_from' => '2022-08-01',
                'setup_stage' => 'Active',
                'setup_progress' => 95,
                'color_theme' => 'emerald',
                'entity_tv_enabled' => true,
                'allow_local_overrides' => true,
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'compliance' => true,
                    'exam_monitoring' => true,
                    'make_up_classes' => true,
                    'performance' => true,
                    'tv_studio' => true,
                ],
            ],
            [
                'code' => 'DSSC-KAPATAGAN',
                'name' => 'DSSC Kapatagan Extension Campus',
                'acronym' => 'KAPATAGAN',
                'type' => 'Entity',
                'entity_type' => 'Extension Campus',
                'dean_name' => 'Engr. Rolando T. Dizon (Extension Coordinator)',
                'contact_email' => 'kapatagan.ext@dssc.edu.ph',
                'address' => 'Brgy. Kapatagan, Digos City, Davao del Sur',
                'contact_phone' => '(082) 553-9012',
                'status' => 'Ready',
                'effective_from' => '2024-06-01',
                'setup_stage' => 'Activation',
                'setup_progress' => 85,
                'color_theme' => 'blue',
                'entity_tv_enabled' => false,
                'allow_local_overrides' => false,
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'compliance' => true,
                ],
            ],
        ];

        $entityMap = [];
        foreach ($entities as $eData) {
            $entityMap[$eData['code']] = College::updateOrCreate(['code' => $eData['code']], $eData);
        }

        $mainCampusId = $entityMap['DSSC-MAIN']->id;
        $sulopCampusId = $entityMap['DSSC-SULOP']->id;

        $colleges = [
            [
                'code' => 'CIDS',
                'name' => 'College of Information and Digital Sciences',
                'acronym' => 'CIDS',
                'type' => 'College',
                'parent_id' => $mainCampusId,
                'dean_name' => 'Dr. Eleanor Vance',
                'contact_email' => 'dean.cids@dssc.edu.ph',
                'address' => 'IT Building, DSSC Main Campus, Matti, Digos City',
                'status' => 'Active',
                'effective_from' => '2020-08-01',
                'setup_stage' => 'Active',
                'setup_progress' => 100,
                'color_theme' => 'amber',
                'entity_tv_enabled' => true,
                'allow_local_overrides' => true,
                'inheritance_settings' => [
                    'academic_periods' => 'Inherit Institution Default',
                    'workload_policy' => 'Allow Local Override',
                    'attendance_policy' => 'Inherit Institution Default',
                    'report_header' => 'Inherit Institution Default',
                ],
                'report_defaults' => [
                    'signatory_prepared_by' => 'College Secretary / Admin',
                    'signatory_noted_by' => 'Program Head',
                    'signatory_approved_by' => 'College Dean',
                    'export_format' => 'PDF & XLSX',
                ],
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'lab_monitoring' => true,
                    'lab_inventory' => true,
                    'research_extension' => true,
                    'projects_tasks' => true,
                    'accomplishments' => true,
                    'exam_monitoring' => true,
                    'make_up_classes' => true,
                    'compliance' => true,
                    'tv_studio' => true,
                    'performance' => true,
                ],
            ],
            [
                'code' => 'CED',
                'name' => 'College of Teacher Education',
                'acronym' => 'CED',
                'type' => 'College',
                'parent_id' => $mainCampusId,
                'dean_name' => 'Dr. Carmela Bautista',
                'contact_email' => 'dean.ced@dssc.edu.ph',
                'address' => 'Education Hall, DSSC Main Campus',
                'status' => 'Active',
                'effective_from' => '2020-08-01',
                'setup_stage' => 'Active',
                'setup_progress' => 95,
                'color_theme' => 'blue',
                'entity_tv_enabled' => true,
                'allow_local_overrides' => true,
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'compliance' => true,
                    'projects_tasks' => true,
                    'accomplishments' => true,
                    'exam_monitoring' => true,
                    'make_up_classes' => true,
                    'performance' => true,
                    'tv_studio' => false,
                ],
            ],
            [
                'code' => 'CBA',
                'name' => 'College of Business Administration',
                'acronym' => 'CBA',
                'type' => 'College',
                'parent_id' => $mainCampusId,
                'dean_name' => 'Dr. Fernando Gomez',
                'contact_email' => 'dean.cba@dssc.edu.ph',
                'address' => 'Business & Governance Wing, DSSC Main Campus',
                'status' => 'Ready',
                'effective_from' => '2021-08-01',
                'setup_stage' => 'Activation',
                'setup_progress' => 90,
                'color_theme' => 'emerald',
                'entity_tv_enabled' => false,
                'allow_local_overrides' => true,
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'compliance' => true,
                    'exam_monitoring' => true,
                    'performance' => true,
                ],
            ],
            [
                'code' => 'COE',
                'name' => 'College of Engineering',
                'acronym' => 'COE',
                'type' => 'College',
                'parent_id' => $mainCampusId,
                'dean_name' => 'Engr. Victor Salcedo',
                'contact_email' => 'dean.coe@dssc.edu.ph',
                'address' => 'Engineering Complex, DSSC Main Campus',
                'status' => 'In Setup',
                'effective_from' => '2023-08-01',
                'setup_stage' => 'Facilities',
                'setup_progress' => 60,
                'color_theme' => 'indigo',
                'entity_tv_enabled' => true,
                'allow_local_overrides' => true,
                'enabled_modules' => [
                    'scheduling' => true,
                    'lab_monitoring' => true,
                    'lab_inventory' => true,
                    'compliance' => true,
                ],
            ],
            [
                'code' => 'CAS',
                'name' => 'College of Arts and Sciences',
                'acronym' => 'CAS',
                'type' => 'College',
                'parent_id' => $sulopCampusId,
                'dean_name' => 'Dr. Rebecca Miranda',
                'contact_email' => 'dean.cas@dssc.edu.ph',
                'address' => 'Academic Block A, Sulop Satellite Campus',
                'status' => 'Not Configured',
                'effective_from' => '2025-08-01',
                'setup_stage' => 'Identity',
                'setup_progress' => 15,
                'color_theme' => 'purple',
                'entity_tv_enabled' => false,
                'allow_local_overrides' => false,
                'enabled_modules' => [],
            ],
        ];

        foreach ($colleges as $cData) {
            College::updateOrCreate(['code' => $cData['code']], $cData);
        }

        // Link existing CIDS programs to CIDS College
        $cidsCollege = College::where('code', 'CIDS')->first();
        if ($cidsCollege) {
            Program::whereNull('college_id')->update(['college_id' => $cidsCollege->id]);
        }

        // 2. Seed Standard Reusable Roles with Tier & Risk Classification
        $roleCatalog = [
            ['name' => 'Institution Super Admin', 'tier' => 'Institution', 'risk_level' => 'Critical', 'is_system_role' => true, 'description' => 'Platform governor and organizational architect of Velora across all entities and colleges.'],
            ['name' => 'VPAF / Executive Oversight', 'tier' => 'Institution', 'risk_level' => 'High', 'is_system_role' => true, 'description' => 'Consumes verified institution-wide performance and decision-support analytics without editing raw operational evidence.'],
            ['name' => 'Institution TV / Communications Manager', 'tier' => 'Institution', 'risk_level' => 'Elevated', 'is_system_role' => true, 'description' => 'Manages institutional digital signage playlists, broadcasts, and cross-college highlight escalations.'],
            ['name' => 'Entity Admin', 'tier' => 'Entity', 'risk_level' => 'High', 'is_system_role' => true, 'description' => 'Coordinates and oversees all Colleges under a campus/entity without redefining institution structure.'],
            ['name' => 'College Admin', 'tier' => 'College', 'risk_level' => 'High', 'is_system_role' => true, 'description' => 'Runs college operations and configures Programs, Courses, Sections, Faculty, Facilities, Scheduling, Compliance, and College reporting.'],
            ['name' => 'Dean', 'tier' => 'College', 'risk_level' => 'Elevated', 'is_system_role' => true, 'description' => 'Governs and reviews college-wide academic decisions, schedules, workloads, and approvals.'],
            ['name' => 'Program Head', 'tier' => 'Program', 'risk_level' => 'Elevated', 'is_system_role' => true, 'description' => 'Governs assigned degree program operations, faculty loading, schedule review, and compliance monitoring.'],
            ['name' => 'Research / Extension Coordinator', 'tier' => 'College', 'risk_level' => 'Standard', 'is_system_role' => true, 'description' => 'Reviews and coordinates faculty research, extension projects, and evidence verification within a scope.'],
            ['name' => 'Head Lab / Facility In-Charge', 'tier' => 'Operational', 'risk_level' => 'Elevated', 'is_system_role' => true, 'description' => 'Verifies facility monitoring sessions, inventory adjustments, maintenance incidents, and daily EOD reports.'],
            ['name' => 'Faculty Member', 'tier' => 'Academic', 'risk_level' => 'Standard', 'is_system_role' => true, 'description' => 'Performs teaching, compliance submissions, availability preferences, accomplishments, and self-service workflows.'],
            ['name' => 'Non-Teaching Lab / Facility In-Charge', 'tier' => 'Operational', 'risk_level' => 'Standard', 'is_system_role' => true, 'description' => 'Performs operational room/laboratory observation, attendance capture, and daily monitoring submissions.'],
            ['name' => 'College TV Display / TV Manager', 'tier' => 'Operational', 'risk_level' => 'Standard', 'is_system_role' => true, 'description' => 'Manages college-scoped digital signage slides, spotlights, and local display playlists.'],
            ['name' => 'Display Screen', 'tier' => 'Operational', 'risk_level' => 'Restricted', 'is_system_role' => true, 'description' => 'Read-only kiosk display account for physical smart TVs.'],
        ];

        foreach ($roleCatalog as $rItem) {
            Role::updateOrCreate(['name' => $rItem['name']], $rItem);
        }

        // Ensure sample Entity Admin & Research Coordinator users exist
        $defaultPassword = Hash::make('password');
        $extraUsers = [
            [
                'institutional_id' => 'DSSC-ADM-001',
                'name' => 'Dr. Arthur Pendelton (Institution Super Admin)',
                'email' => 'superadmin@dssc.edu.ph',
                'phone' => '+63 917 100 0001',
                'account_status' => 'Active',
                'mfa_required' => true,
                'effective_from' => '2020-01-01',
                'role' => 'Institution Super Admin',
            ],
            [
                'institutional_id' => 'DSSC-EXEC-002',
                'name' => 'Prof. Raymond Cruz (VPAF / Executive Oversight)',
                'email' => 'vpaf@dssc.edu.ph',
                'phone' => '+63 917 100 0002',
                'account_status' => 'Active',
                'mfa_required' => true,
                'effective_from' => '2021-01-01',
                'role' => 'VPAF / Executive Oversight',
            ],
            [
                'institutional_id' => 'DSSC-ENT-003',
                'name' => 'Prof. Lourdes Mercado (Sulop Entity Admin)',
                'email' => 'entityadmin.sulop@dssc.edu.ph',
                'phone' => '+63 917 200 0010',
                'account_status' => 'Active',
                'mfa_required' => false,
                'effective_from' => '2024-08-01',
                'role' => 'Entity Admin',
            ],
            [
                'institutional_id' => 'DSSC-RES-004',
                'name' => 'Dr. Ramon Villanueva (Research Coordinator)',
                'email' => 'research.cids@dssc.edu.ph',
                'phone' => '+63 917 300 0022',
                'account_status' => 'Active',
                'mfa_required' => false,
                'effective_from' => '2025-01-15',
                'role' => 'Research / Extension Coordinator',
            ],
        ];

        foreach ($extraUsers as $uData) {
            $roleName = $uData['role'];
            unset($uData['role']);
            $user = User::updateOrCreate(
                ['email' => $uData['email']],
                array_merge($uData, ['password' => $defaultPassword])
            );
            $role = Role::where('name', $roleName)->first();
            if ($role && ! $user->roles()->where('role_id', $role->id)->exists()) {
                $user->roles()->attach($role->id);
            }
        }

        // Backfill institutional_id on any existing users missing it
        $allUsers = User::whereNull('institutional_id')->get();
        foreach ($allUsers as $idx => $u) {
            $u->update([
                'institutional_id' => sprintf('DSSC-USR-%03d', $u->id),
                'account_status' => $u->account_status ?: 'Active',
                'effective_from' => $u->effective_from ?: '2024-08-01',
            ]);
        }

        // Ensure every User has at least one ScopedRoleAssignment so their Campus Entity & College affiliations appear in the global directory
        $facRoleForSync = Role::where('name', 'Faculty Member')->first();
        $allUsersWithRelations = User::with(['roles', 'faculty.program.college', 'scopedRoleAssignments'])->get();
        foreach ($allUsersWithRelations as $u) {
            if ($u->scopedRoleAssignments->isEmpty()) {
                $primaryRole = $u->roles->first() ?? $facRoleForSync;
                if ($primaryRole) {
                    $prog = $u->faculty?->program;
                    $colId = $prog?->college_id ?? $cidsCollege?->id;
                    $colModel = $colId ? College::find($colId) : $cidsCollege;
                    $entId = $colModel?->parent_id ?? $mainCampusId;

                    ScopedRoleAssignment::firstOrCreate([
                        'user_id' => $u->id,
                        'role_id' => $primaryRole->id,
                        'college_id' => $colId,
                    ], [
                        'institution' => 'Davao Del Sur State College',
                        'scope_level' => $prog ? 'Program' : 'College',
                        'entity_id' => $entId,
                        'program_id' => $prog?->id,
                        'designation_type' => 'Primary',
                        'effective_from' => $u->effective_from ?? '2024-08-01',
                        'status' => 'Active',
                        'notes' => 'Canonical identity affiliation synchronized across Entity & College hierarchy',
                    ]);
                }
            }
        }

        // 3. Seed Granular Action-Based Permissions & Attach to Roles
        $permissionsCatalog = [
            // Organization
            ['name' => 'organization.entity.create', 'module' => 'Organization Management', 'capability' => 'Create', 'description' => 'Create, archive, or reorganize campus entities'],
            ['name' => 'organization.college.create', 'module' => 'Organization Management', 'capability' => 'Create', 'description' => 'Create, move, or archive colleges under entities'],
            ['name' => 'organization.college.configure', 'module' => 'Organization Management', 'capability' => 'Configure', 'description' => 'Configure college onboarding, branding, and module inheritance'],
            ['name' => 'organization.program.manage', 'module' => 'Organization Management', 'capability' => 'Edit', 'description' => 'Create and manage degree programs and curricula'],

            // Users & Identity
            ['name' => 'users.manage', 'module' => 'Users & Identity', 'capability' => 'Edit', 'description' => 'Create, invite, suspend, lock, and manage canonical user accounts'],
            ['name' => 'roles.manage', 'module' => 'Roles & Permissions', 'capability' => 'Configure', 'description' => 'Create roles and modify the granular permission matrix'],
            ['name' => 'roles.assign', 'module' => 'Scoped Assignments', 'capability' => 'Assign', 'description' => 'Bind User + Role + Scope + Effective Period'],
            ['name' => 'access_requests.approve', 'module' => 'Scoped Assignments', 'capability' => 'Approve', 'description' => 'Approve or deny cross-entity or elevated access requests'],

            // Academic Periods & Scheduling
            ['name' => 'academic_period.view', 'module' => 'Academic Governance', 'capability' => 'View', 'description' => 'View active and historical academic periods'],
            ['name' => 'academic_period.configure', 'module' => 'Academic Governance', 'capability' => 'Configure', 'description' => 'Define institution-wide academic years, terms, and exam windows'],
            ['name' => 'schedule.generate', 'module' => 'Semester Scheduling', 'capability' => 'Create', 'description' => 'Run OR-Tools solver and generate schedule drafts'],
            ['name' => 'schedule.review', 'module' => 'Semester Scheduling', 'capability' => 'Review', 'description' => 'Review schedule candidates and flag conflicts'],
            ['name' => 'schedule.approve', 'module' => 'Semester Scheduling', 'capability' => 'Approve', 'description' => 'Executive approval of college master timetable'],
            ['name' => 'schedule.publish', 'module' => 'Semester Scheduling', 'capability' => 'Publish', 'description' => 'Publish official semester schedule version'],

            // Attendance & Operations
            ['name' => 'attendance.view', 'module' => 'Faculty Attendance', 'capability' => 'View', 'description' => 'View faculty attendance logs and reconciliation status'],
            ['name' => 'attendance.observe', 'module' => 'Facility Monitoring', 'capability' => 'Create', 'description' => 'Capture room/laboratory observation and evidence'],
            ['name' => 'attendance.verify', 'module' => 'Facility Monitoring', 'capability' => 'Verify', 'description' => 'Verify daily monitoring observations and discrepancies'],
            ['name' => 'attendance.finalize', 'module' => 'Facility Monitoring', 'capability' => 'Approve', 'description' => 'Finalize end-of-day monitoring reports'],
            ['name' => 'attendance.reopen', 'module' => 'Facility Monitoring', 'capability' => 'Reopen', 'description' => 'Reopen locked monitoring sessions with audit reason'],

            // Inventory & Facilities
            ['name' => 'inventory.view', 'module' => 'Inventory & Facilities', 'capability' => 'View', 'description' => 'Inspect room and laboratory equipment registry'],
            ['name' => 'inventory.adjust', 'module' => 'Inventory & Facilities', 'capability' => 'Edit', 'description' => 'Submit inventory count or condition adjustment requests'],
            ['name' => 'inventory.verify', 'module' => 'Inventory & Facilities', 'capability' => 'Verify', 'description' => 'Authorize and reconcile laboratory inventory adjustments'],

            // Research, Compliance & Reports
            ['name' => 'compliance.submit', 'module' => 'Compliance & Research', 'capability' => 'Create', 'description' => 'Upload syllabus and faculty deliverable submissions'],
            ['name' => 'compliance.verify', 'module' => 'Compliance & Research', 'capability' => 'Verify', 'description' => 'Verify or return faculty compliance submissions'],
            ['name' => 'research.verify', 'module' => 'Compliance & Research', 'capability' => 'Verify', 'description' => 'Verify faculty research, extension, and accomplishment portfolios'],
            ['name' => 'reports.generate', 'module' => 'Reports & Analytics', 'capability' => 'Export', 'description' => 'Generate and export verified operational or executive reports'],

            // Platform, TV & Governance
            ['name' => 'tv.publish', 'module' => 'TV Studio & Signage', 'capability' => 'Publish', 'description' => 'Publish playlists, custom slides, and spotlights to TV displays'],
            ['name' => 'platform.policies.configure', 'module' => 'Platform Governance', 'capability' => 'Configure', 'description' => 'Manage institution policy templates, workflows, and terminology'],
            ['name' => 'platform.integrations.configure', 'module' => 'Platform Governance', 'capability' => 'Configure', 'description' => 'Configure Google Workspace, Sheets, EHRIS, and Gemini AI integrations'],
            ['name' => 'platform.security.audit', 'module' => 'Platform Governance', 'capability' => 'Audit', 'description' => 'Inspect immutable audit logs, security policies, and data quality health'],
        ];

        $permModels = [];
        foreach ($permissionsCatalog as $pData) {
            $permModels[$pData['name']] = Permission::updateOrCreate(['name' => $pData['name']], $pData);
        }

        $rolePermissionsMap = [
            'Institution Super Admin' => [
                'organization.entity.create', 'organization.college.create', 'organization.college.configure',
                'users.manage', 'roles.manage', 'roles.assign', 'access_requests.approve',
                'academic_period.view', 'academic_period.configure',
                'reports.generate', 'tv.publish',
                'platform.policies.configure', 'platform.integrations.configure', 'platform.security.audit',
            ],
            'VPAF / Executive Oversight' => [
                'academic_period.view', 'attendance.view', 'inventory.view', 'reports.generate',
            ],
            'Institution TV / Communications Manager' => [
                'academic_period.view', 'tv.publish', 'reports.generate',
            ],
            'Entity Admin' => [
                'organization.college.configure', 'academic_period.view',
                'attendance.view', 'inventory.view', 'reports.generate', 'tv.publish',
            ],
            'College Admin' => [
                'organization.program.manage', 'academic_period.view',
                'schedule.generate', 'schedule.review', 'schedule.publish',
                'attendance.view', 'attendance.reopen',
                'inventory.view', 'inventory.verify',
                'compliance.verify', 'research.verify', 'reports.generate', 'tv.publish',
            ],
            'Dean' => [
                'academic_period.view', 'schedule.review', 'schedule.approve',
                'attendance.view', 'attendance.finalize',
                'inventory.view', 'compliance.verify', 'research.verify', 'reports.generate',
            ],
            'Program Head' => [
                'academic_period.view', 'schedule.review',
                'attendance.view', 'compliance.verify', 'reports.generate',
            ],
            'Research / Extension Coordinator' => [
                'academic_period.view', 'research.verify', 'reports.generate',
            ],
            'Head Lab / Facility In-Charge' => [
                'academic_period.view', 'attendance.observe', 'attendance.verify', 'attendance.finalize',
                'inventory.view', 'inventory.adjust', 'inventory.verify', 'reports.generate',
            ],
            'Non-Teaching Lab / Facility In-Charge' => [
                'academic_period.view', 'attendance.observe', 'inventory.view', 'inventory.adjust',
            ],
            'Faculty Member' => [
                'academic_period.view', 'attendance.view', 'compliance.submit',
            ],
            'College TV Display / TV Manager' => [
                'academic_period.view', 'tv.publish',
            ],
        ];

        foreach ($rolePermissionsMap as $rName => $permNames) {
            $role = Role::where('name', $rName)->first();
            if ($role) {
                $ids = collect($permNames)->map(fn ($n) => $permModels[$n]->id ?? null)->filter()->all();
                $role->permissions()->sync($ids);
            }
        }

        // 4. Seed Multi-Scope Role Assignments (Demonstrating Canonical Identity across Scopes)
        $superAdminUser = User::where('email', 'superadmin@dssc.edu.ph')->first();
        $isaRole = Role::where('name', 'Institution Super Admin')->first();
        if ($superAdminUser && $isaRole) {
            ScopedRoleAssignment::updateOrCreate([
                'user_id' => $superAdminUser->id,
                'role_id' => $isaRole->id,
            ], [
                'institution' => 'Davao Del Sur State College',
                'scope_level' => 'Institution',
                'designation_type' => 'Primary',
                'effective_from' => '2020-01-01',
                'status' => 'Active',
                'notes' => 'Central Platform Governor & Organizational Architect (Permanent)',
            ]);
        }

        $sulopAdminUser = User::where('email', 'entityadmin.sulop@dssc.edu.ph')->first();
        $entityAdminRole = Role::where('name', 'Entity Admin')->first();
        if ($sulopAdminUser && $entityAdminRole) {
            ScopedRoleAssignment::updateOrCreate([
                'user_id' => $sulopAdminUser->id,
                'role_id' => $entityAdminRole->id,
                'entity_id' => $sulopCampusId,
            ], [
                'institution' => 'Davao Del Sur State College',
                'scope_level' => 'Entity',
                'designation_type' => 'Primary',
                'effective_from' => '2026-08-01',
                'status' => 'Active',
                'notes' => 'Campus Entity Administrator for Sulop Satellite Campus',
            ]);
        }

        $collegeAdminUser = User::where('email', 'collegeadmin@cids.edu')->first();
        $caRole = Role::where('name', 'College Admin')->first();
        if ($collegeAdminUser && $caRole && $cidsCollege) {
            ScopedRoleAssignment::updateOrCreate([
                'user_id' => $collegeAdminUser->id,
                'role_id' => $caRole->id,
                'college_id' => $cidsCollege->id,
            ], [
                'institution' => 'Davao Del Sur State College',
                'scope_level' => 'College',
                'entity_id' => $mainCampusId,
                'designation_type' => 'Primary',
                'effective_from' => '2025-08-01',
                'status' => 'Active',
                'notes' => 'Primary College Administrator for CIDS.',
            ]);
        }

        // Demonstrate one canonical user (Dr. Evelyn Santos) holding Faculty in CIDS + Program Head in BSIT + Acting Research Coordinator
        $phUser = User::where('email', 'programhead@cids.edu')->first();
        $phRole = Role::where('name', 'Program Head')->first();
        $facRole = Role::where('name', 'Faculty Member')->first();
        $resRole = Role::where('name', 'Research / Extension Coordinator')->first();
        $bsitProgram = Program::where('code', 'BSIT')->first();

        if ($phUser && $cidsCollege) {
            if ($facRole) {
                ScopedRoleAssignment::updateOrCreate([
                    'user_id' => $phUser->id,
                    'role_id' => $facRole->id,
                    'college_id' => $cidsCollege->id,
                ], [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $mainCampusId,
                    'designation_type' => 'Primary',
                    'effective_from' => '2021-08-01',
                    'status' => 'Active',
                    'notes' => 'Tenured Associate Professor in CIDS',
                ]);
            }
            if ($phRole && $bsitProgram) {
                ScopedRoleAssignment::updateOrCreate([
                    'user_id' => $phUser->id,
                    'role_id' => $phRole->id,
                    'college_id' => $cidsCollege->id,
                    'program_id' => $bsitProgram->id,
                ], [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'Program',
                    'entity_id' => $mainCampusId,
                    'designation_type' => 'Primary',
                    'effective_from' => '2026-08-01',
                    'effective_until' => '2028-07-31',
                    'status' => 'Active',
                    'notes' => 'Special Order No. 2026-081 · BSIT Program Head',
                ]);
            }
            if ($resRole) {
                ScopedRoleAssignment::updateOrCreate([
                    'user_id' => $phUser->id,
                    'role_id' => $resRole->id,
                    'college_id' => $cidsCollege->id,
                ], [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $mainCampusId,
                    'designation_type' => 'Acting',
                    'effective_from' => '2026-09-01',
                    'effective_until' => '2026-12-31',
                    'status' => 'Active',
                    'notes' => 'Acting Research Coordinator during maternity leave coverage',
                ]);
            }
        }

        // 5. Seed Access Requests & Delegation Queue
        $deanUser = User::where('email', 'dean@cids.edu')->first();
        $msantosUser = User::where('email', 'msantos@cids.edu')->first();
        $cedCollege = College::where('code', 'CED')->first();
        $coeCollege = College::where('code', 'COE')->first();

        if ($deanUser && $msantosUser && $caRole && $cidsCollege) {
            InstitutionAccessRequest::updateOrCreate([
                'requester_user_id' => $deanUser->id,
                'target_user_id' => $msantosUser->id,
                'requested_role_id' => $caRole->id,
            ], [
                'scope_level' => 'College',
                'entity_id' => $mainCampusId,
                'college_id' => $cidsCollege->id,
                'designation_type' => 'Secondary',
                'effective_from' => '2026-11-01',
                'effective_until' => '2027-03-31',
                'justification' => 'Secondary College Admin coverage during accreditation document preparation.',
                'status' => 'Pending',
            ]);
        }

        if ($sulopAdminUser && $caRole && $coeCollege) {
            InstitutionAccessRequest::updateOrCreate([
                'requester_user_id' => $sulopAdminUser->id,
                'target_user_id' => $sulopAdminUser->id,
                'requested_role_id' => $caRole->id,
            ], [
                'scope_level' => 'College',
                'entity_id' => $mainCampusId,
                'college_id' => $coeCollege->id,
                'designation_type' => 'Acting',
                'effective_from' => '2026-11-05',
                'effective_until' => '2026-12-20',
                'justification' => 'Temporary acting College Admin to assist COE laboratory onboarding.',
                'status' => 'Pending',
            ]);
        }

        // 6. Seed Institution Policy Templates (Institution Default -> Entity Override -> College Override)
        $policies = [
            [
                'code' => 'POL-WL-001',
                'title' => 'Standard Faculty Workload & Overload Policy',
                'category' => 'Workload',
                'version' => 'v2.1',
                'status' => 'Active',
                'effective_from' => '2026-08-01',
                'inheritance_mode' => 'Allow College Override',
                'allow_entity_override' => true,
                'allow_college_override' => true,
                'parameters' => [
                    'regular_load_units' => 18,
                    'max_overload_units' => 6,
                    'program_head_deloading_units' => 6,
                    'dean_deloading_units' => 12,
                    'lab_hour_weight' => 0.75,
                ],
                'description' => 'Defines regular teaching load (18 units), administrative deloading credits, and maximum allowable overload.',
            ],
            [
                'code' => 'POL-ATT-002',
                'title' => 'Three-Way Attendance & Official Business Reconciliation Standard',
                'category' => 'Attendance',
                'version' => 'v3.0',
                'status' => 'Active',
                'effective_from' => '2026-08-01',
                'inheritance_mode' => 'Mandatory Locked',
                'allow_entity_override' => false,
                'allow_college_override' => false,
                'parameters' => [
                    'grace_period_minutes' => 15,
                    'auto_excuse_approved_travel_orders' => true,
                    'auto_excuse_approved_locator_slips' => true,
                    'require_makeup_for_personal_leave' => true,
                    'minimum_rank_eligibility_attendance_rate' => 90,
                ],
                'description' => 'Institution-locked rule governing how EHRIS Travel Orders, Locator Slips, and Lab Observations reconcile against scheduled minutes.',
            ],
            [
                'code' => 'POL-MKP-003',
                'title' => 'Make-Up Class Recovery & Verification Policy',
                'category' => 'Make-Up Classes',
                'version' => 'v1.4',
                'status' => 'Active',
                'effective_from' => '2026-08-01',
                'inheritance_mode' => 'Allow College Override',
                'allow_entity_override' => true,
                'allow_college_override' => true,
                'parameters' => [
                    'filing_deadline_days_after_absence' => 5,
                    'require_program_head_endorsement' => true,
                    'require_dean_approval' => true,
                    'require_lab_in_charge_conduct_verification' => true,
                ],
                'description' => 'Requires make-up classes for missed instructional sessions with multi-tier approval and physical verification.',
            ],
            [
                'code' => 'POL-MON-004',
                'title' => 'Laboratory Monitoring & Separation-of-Duties Standard',
                'category' => 'Facility Monitoring',
                'version' => 'v2.0',
                'status' => 'Active',
                'effective_from' => '2026-08-01',
                'inheritance_mode' => 'Mandatory Locked',
                'allow_entity_override' => false,
                'allow_college_override' => false,
                'parameters' => [
                    'prevent_self_verification' => true,
                    'require_photo_evidence_on_discrepancy' => true,
                    'eod_cutoff_time' => '18:30',
                ],
                'description' => 'Enforces separation of duties: operational observers cannot verify their own monitoring submissions without logged emergency override.',
            ],
            [
                'code' => 'POL-INV-005',
                'title' => 'Laboratory Asset & Inventory Adjustment Governance',
                'category' => 'Inventory',
                'version' => 'v1.2',
                'status' => 'Active',
                'effective_from' => '2026-08-01',
                'inheritance_mode' => 'Allow Entity Override',
                'allow_entity_override' => true,
                'allow_college_override' => false,
                'parameters' => [
                    'mandatory_cycle_count_per_semester' => 1,
                    'require_head_lab_verification' => true,
                    'condemnation_requires_vpaf_export' => true,
                ],
                'description' => 'Standardizes serialized asset tracking, discrepancy reporting, and disposal/transfer verification.',
            ],
            [
                'code' => 'POL-RES-006',
                'title' => 'Research, Extension & Accomplishment Evidence Standard',
                'category' => 'Research & Extension',
                'version' => 'v1.5',
                'status' => 'Active',
                'effective_from' => '2026-08-01',
                'inheritance_mode' => 'Allow College Override',
                'allow_entity_override' => true,
                'allow_college_override' => true,
                'parameters' => [
                    'require_google_drive_archival' => true,
                    'enable_gemini_metadata_extraction' => true,
                    'require_coordinator_review' => true,
                ],
                'description' => 'Requires verifiable documentary evidence backed up to institutional Google Drive before accomplishments count toward recognition.',
            ],
        ];

        foreach ($policies as $pItem) {
            InstitutionPolicyTemplate::updateOrCreate(['code' => $pItem['code']], $pItem);
        }

        // 7. Seed Reusable Workflow Definitions
        $workflows = [
            [
                'code' => 'WF-SCHED-01',
                'name' => 'Semester Timetable Publication Workflow',
                'module' => 'Semester Scheduling',
                'scope_level' => 'College',
                'version' => 'v2.0',
                'status' => 'Active',
                'return_behavior' => 'Return to Previous Step',
                'allow_delegation' => true,
                'separation_of_duties_enforced' => true,
                'final_state' => 'Published Official Master Schedule',
                'description' => 'Standard 3-step academic schedule review and publication pipeline.',
                'steps' => [
                    ['order' => 1, 'step_name' => 'Program Schedule Review', 'role_name' => 'Program Head', 'scope' => 'Program', 'action' => 'Review & Endorse', 'required' => true, 'escalation_hours' => 48],
                    ['order' => 2, 'step_name' => 'College Executive Approval', 'role_name' => 'Dean', 'scope' => 'College', 'action' => 'Approve Candidate', 'required' => true, 'escalation_hours' => 72],
                    ['order' => 3, 'step_name' => 'Official Master Publication', 'role_name' => 'College Admin', 'scope' => 'College', 'action' => 'Publish Master Timetable', 'required' => true, 'escalation_hours' => 24],
                ],
            ],
            [
                'code' => 'WF-LAB-02',
                'name' => 'Daily Laboratory Monitoring & EOD Verification',
                'module' => 'Lab Monitoring',
                'scope_level' => 'College',
                'version' => 'v1.8',
                'status' => 'Active',
                'return_behavior' => 'Return to Submitter',
                'allow_delegation' => true,
                'separation_of_duties_enforced' => true,
                'final_state' => 'Finalized & Locked Session',
                'description' => 'Prevents self-verification between room observation and supervisory sign-off.',
                'steps' => [
                    ['order' => 1, 'step_name' => 'Session Observation & EOD Submission', 'role_name' => 'Non-Teaching Lab / Facility In-Charge', 'scope' => 'Facility', 'action' => 'Submit Observation', 'required' => true, 'escalation_hours' => 12],
                    ['order' => 2, 'step_name' => 'Supervisory Discrepancy Verification', 'role_name' => 'Head Lab / Facility In-Charge', 'scope' => 'College', 'action' => 'Verify & Reconcile', 'required' => true, 'escalation_hours' => 24],
                    ['order' => 3, 'step_name' => 'Executive Finalization', 'role_name' => 'Dean', 'scope' => 'College', 'action' => 'Finalize Report', 'required' => false, 'escalation_hours' => 48],
                ],
            ],
            [
                'code' => 'WF-COMP-03',
                'name' => 'Faculty Deliverable & Syllabus Compliance Verification',
                'module' => 'Compliance',
                'scope_level' => 'College',
                'version' => 'v1.2',
                'status' => 'Active',
                'return_behavior' => 'Return to Submitter',
                'allow_delegation' => true,
                'separation_of_duties_enforced' => true,
                'final_state' => 'Verified Compliant',
                'description' => 'Routes faculty syllabus and TOS uploads through Program Head and College Admin verification.',
                'steps' => [
                    ['order' => 1, 'step_name' => 'Faculty Deliverable Upload', 'role_name' => 'Faculty Member', 'scope' => 'Program', 'action' => 'Submit Document', 'required' => true, 'escalation_hours' => 0],
                    ['order' => 2, 'step_name' => 'Program Quality Review', 'role_name' => 'Program Head', 'scope' => 'Program', 'action' => 'Review Content', 'required' => true, 'escalation_hours' => 72],
                    ['order' => 3, 'step_name' => 'College Compliance Recording', 'role_name' => 'College Admin', 'scope' => 'College', 'action' => 'Verify & Lock', 'required' => true, 'escalation_hours' => 48],
                ],
            ],
            [
                'code' => 'WF-INV-04',
                'name' => 'Laboratory Inventory Adjustment & Disposal Workflow',
                'module' => 'Inventory Adjustment',
                'scope_level' => 'College',
                'version' => 'v1.1',
                'status' => 'Active',
                'return_behavior' => 'Return to Submitter',
                'allow_delegation' => false,
                'separation_of_duties_enforced' => true,
                'final_state' => 'Authorized Adjustment',
                'description' => 'Two-tier verification for damaged, missing, or transferred laboratory assets.',
                'steps' => [
                    ['order' => 1, 'step_name' => 'Discrepancy / Damage Report', 'role_name' => 'Non-Teaching Lab / Facility In-Charge', 'scope' => 'Facility', 'action' => 'Log Adjustment Request', 'required' => true, 'escalation_hours' => 24],
                    ['order' => 2, 'step_name' => 'Physical Inspection & Verification', 'role_name' => 'Head Lab / Facility In-Charge', 'scope' => 'College', 'action' => 'Verify Asset Condition', 'required' => true, 'escalation_hours' => 48],
                    ['order' => 3, 'step_name' => 'Registry Authorization', 'role_name' => 'College Admin', 'scope' => 'College', 'action' => 'Authorize Ledger Update', 'required' => true, 'escalation_hours' => 48],
                ],
            ],
            [
                'code' => 'WF-RES-05',
                'name' => 'Research & Accomplishment Evidence Verification',
                'module' => 'Research Activity',
                'scope_level' => 'College',
                'version' => 'v1.0',
                'status' => 'Active',
                'return_behavior' => 'Return to Previous Step',
                'allow_delegation' => true,
                'separation_of_duties_enforced' => true,
                'final_state' => 'Verified Institutional Evidence',
                'description' => 'Validates faculty research publications, extension engagements, and awards.',
                'steps' => [
                    ['order' => 1, 'step_name' => 'Evidence & AI Metadata Submission', 'role_name' => 'Faculty Member', 'scope' => 'Program', 'action' => 'Submit Portfolio Item', 'required' => true, 'escalation_hours' => 0],
                    ['order' => 2, 'step_name' => 'Coordinator Technical Review', 'role_name' => 'Research / Extension Coordinator', 'scope' => 'College', 'action' => 'Review Evidence', 'required' => true, 'escalation_hours' => 72],
                    ['order' => 3, 'step_name' => 'Dean Executive Attestation', 'role_name' => 'Dean', 'scope' => 'College', 'action' => 'Verify & Award Points', 'required' => true, 'escalation_hours' => 72],
                ],
            ],
            [
                'code' => 'WF-TV-06',
                'name' => 'College Spotlight & Institutional TV Broadcast Escalation',
                'module' => 'College Spotlight',
                'scope_level' => 'Institution',
                'version' => 'v1.0',
                'status' => 'Active',
                'return_behavior' => 'Return to Submitter',
                'allow_delegation' => true,
                'separation_of_duties_enforced' => false,
                'final_state' => 'Broadcasting on Campus Signage',
                'description' => 'Governs how college spotlights are approved locally and escalated to Institution TV channels.',
                'steps' => [
                    ['order' => 1, 'step_name' => 'Slide Creation', 'role_name' => 'College TV Display / TV Manager', 'scope' => 'College', 'action' => 'Draft Spotlight Slide', 'required' => true, 'escalation_hours' => 24],
                    ['order' => 2, 'step_name' => 'College Publication Approval', 'role_name' => 'Dean', 'scope' => 'College', 'action' => 'Approve Local Broadcast', 'required' => true, 'escalation_hours' => 24],
                    ['order' => 3, 'step_name' => 'Institutional Channel Escalation', 'role_name' => 'Institution TV / Communications Manager', 'scope' => 'Institution', 'action' => 'Publish to Institution Playlist', 'required' => false, 'escalation_hours' => 48],
                ],
            ],
        ];

        foreach ($workflows as $wItem) {
            InstitutionWorkflowDefinition::updateOrCreate(['code' => $wItem['code']], $wItem);
        }

        // 8. Seed Core Institution Settings (Profile, Terminology, Feature Flags, Integrations, Sync Rules, Security, Report Config)
        $settings = [
            [
                'key' => 'institution_name',
                'group' => 'profile',
                'value' => 'Davao Del Sur State College',
                'label' => 'Institution Full Name',
            ],
            [
                'key' => 'institution_acronym',
                'group' => 'profile',
                'value' => 'DSSC',
                'label' => 'Institution Acronym',
            ],
            [
                'key' => 'institution_address',
                'group' => 'profile',
                'value' => 'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002',
                'label' => 'Official Campus Address',
            ],
            [
                'key' => 'institution_timezone',
                'group' => 'profile',
                'value' => 'Asia/Manila (UTC+08:00)',
                'label' => 'System Timezone',
            ],
            [
                'key' => 'terminology_overrides',
                'group' => 'terminology',
                'value' => [
                    'entity_unit' => [
                        'default' => 'Campus / Entity',
                        'dssc-main' => 'Main Campus',
                        'dssc-sulop' => 'Satellite Campus',
                    ],
                    'college_unit' => [
                        'default' => 'College',
                        'cids' => 'College',
                        'coe' => 'College',
                        'ced' => 'College',
                    ],
                    'program_unit' => [
                        'default' => 'Program',
                        'cids' => 'Degree Program',
                        'coe' => 'Engineering Department',
                        'ced' => 'Teacher Education Program',
                    ],
                    'academic_leader' => [
                        'default' => 'Program Head',
                        'cids' => 'Program Head',
                        'coe' => 'Department Chair',
                        'ced' => 'Program Coordinator',
                    ],
                    'faculty_member' => [
                        'default' => 'Faculty Member',
                        'cids' => 'Faculty Member',
                        'coe' => 'Engineering Instructor',
                        'ced' => 'Academic Mentor',
                    ],
                    'facility_monitor' => [
                        'default' => 'Facility In-Charge',
                        'cids' => 'Lab In-Charge',
                        'coe' => 'Laboratory Technician',
                        'ced' => 'Classroom Coordinator',
                    ],
                    'facility_space' => [
                        'default' => 'Laboratory / Room',
                        'cids' => 'Computer Laboratory',
                        'coe' => 'Engineering Workshop',
                        'ced' => 'Demonstration Studio',
                    ],
                ],
                'label' => 'Configurable Terminology Mappings',
            ],
            [
                'key' => 'feature_flags',
                'group' => 'platform',
                'value' => [
                    'gemini_ai_schedule_assistant' => true,
                    'gemini_ai_document_understanding' => true,
                    'llm_comment_summarization' => true,
                    'cross_college_tv_channel_switching' => true,
                    'google_sheets_live_sync' => true,
                    'ehris_token_reconciliation' => true,
                    'qr_inventory_audit' => true,
                    'biometric_attendance_bridge' => false,
                    'auto_conflict_resolution' => false,
                ],
                'label' => 'Institutional Feature Flags',
            ],
            [
                'key' => 'integrations_status',
                'group' => 'integrations',
                'value' => [
                    'google_workspace' => [
                        'name' => 'Google Workspace & Shared Drive',
                        'provider' => 'Google Cloud OAuth 2.0',
                        'connected' => true,
                        'domain' => 'dssc.edu.ph',
                        'scopes' => 'drive.file, userinfo.email, calendar.events',
                        'last_sync' => now()->subMinutes(18)->format('Y-m-d H:i'),
                        'owner' => 'Institution IT & Governance Office',
                        'masked_credential' => 'GWS-OAUTH-••••••••••••••••89A2',
                    ],
                    'google_sheets' => [
                        'name' => 'Google Sheets Master Timetable & Attendance Engine',
                        'provider' => 'Google Sheets API v4',
                        'connected' => true,
                        'active_syncs' => 4,
                        'scopes' => 'spreadsheets.readonly',
                        'last_sync' => now()->subMinutes(5)->format('Y-m-d H:i'),
                        'owner' => 'Academic Scheduling & Attendance Service',
                        'masked_credential' => 'AIzaSyDR••••••••••••••••••••LXI',
                    ],
                    'ehris_api' => [
                        'name' => 'DSSC e-HRIS Official Business Bridge (Travel Orders & Locator Slips)',
                        'provider' => 'e-HRIS REST API v1 (Bearer Token)',
                        'connected' => true,
                        'endpoint' => 'http://hris2.dssc.edu.ph:1952/api/v1',
                        'scopes' => 'locator-slips.read, travel-orders.read',
                        'last_sync' => now()->subMinutes(12)->format('Y-m-d H:i'),
                        'owner' => 'HRMO / Institution Super Admin',
                        'masked_credential' => 'SbKZPf9i••••••••••••••••••••La5',
                    ],
                    'gemini_llm' => [
                        'name' => 'Google Gemini 2.5 Flash Document & Schedule Intelligence',
                        'provider' => 'Google GenAI SDK',
                        'connected' => true,
                        'model' => 'gemini-2.5-flash',
                        'quota_healthy' => true,
                        'last_sync' => now()->subMinutes(3)->format('Y-m-d H:i'),
                        'owner' => 'Velora AI Governance Service',
                        'masked_credential' => 'AQ.Ab8RN••••••••••••••••••••8HA',
                    ],
                ],
                'label' => 'Institutional Integration Health',
            ],
            [
                'key' => 'sync_reconciliation_config',
                'group' => 'integrations',
                'value' => [
                    'auto_match_confidence_threshold' => 92,
                    'needs_review_threshold' => 75,
                    'duplicate_detection_mode' => 'Strict Checksum + Normalized Alias',
                    'source_precedence' => 'Official Published Schedule > EHRIS Approved OB > Google Sheets Snapshot',
                    'require_human_approval_for_schedule_import' => true,
                    'require_human_approval_for_calendar_ai' => true,
                    'auto_link_faculty_aliases' => true,
                    'sync_freshness_interval_minutes' => 15,
                ],
                'label' => 'Sync & Reconciliation Standards',
            ],
            [
                'key' => 'security_privacy_settings',
                'group' => 'security',
                'value' => [
                    'session_timeout_minutes' => 120,
                    'enforce_mfa_for_critical_roles' => true,
                    'password_min_length' => 10,
                    'password_rotation_days' => 180,
                    'lockout_max_attempts' => 5,
                    'enforce_separation_of_duties' => true,
                    'prevent_self_verification_monitoring' => true,
                    'prevent_self_approval_makeup' => true,
                    'mask_api_credentials_for_non_super_admin' => true,
                    'audit_log_retention_years' => 7,
                    'report_archive_retention_years' => 5,
                    'restrict_cross_college_raw_exports' => true,
                ],
                'label' => 'Security, Separation of Duties & Privacy Policy',
            ],
            [
                'key' => 'global_report_config',
                'group' => 'profile',
                'value' => [
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
                ],
                'label' => 'Global Report Templates & Signatory Standards',
            ],
        ];

        foreach ($settings as $sData) {
            InstitutionSetting::updateOrCreate(['key' => $sData['key']], $sData);
        }

        // 9. Seed Immutable Audit Logs & Business-Readable Change History
        if (InstitutionAuditLog::count() === 0) {
            $auditEntries = [
                [
                    'actor_user_id' => $superAdminUser?->id,
                    'actor_name' => 'Dr. Arthur Pendelton',
                    'actor_role' => 'Institution Super Admin',
                    'module' => 'Organization',
                    'action' => 'Created Entity Hierarchy',
                    'target_type' => 'Entity',
                    'target_name' => 'DSSC Sulop Satellite Campus (DSSC-SULOP)',
                    'entity_scope' => 'DSSC-SULOP',
                    'college_scope' => null,
                    'severity' => 'success',
                    'previous_value' => ['status' => 'Unregistered'],
                    'new_value' => ['status' => 'Active', 'entity_type' => 'Satellite Campus', 'parent' => 'DSSC'],
                    'reason' => 'Board of Trustees Resolution No. 2026-14 establishing Sulop Satellite Campus scope in Velora.',
                    'ip_address' => '10.10.1.12',
                ],
                [
                    'actor_user_id' => $superAdminUser?->id,
                    'actor_name' => 'Dr. Arthur Pendelton',
                    'actor_role' => 'Institution Super Admin',
                    'module' => 'Scoped Assignments',
                    'action' => 'Granted Scoped Role',
                    'target_type' => 'ScopedRoleAssignment',
                    'target_name' => 'Prof. Lourdes Mercado → Entity Admin (DSSC-SULOP)',
                    'entity_scope' => 'DSSC-SULOP',
                    'college_scope' => null,
                    'severity' => 'info',
                    'previous_value' => ['role' => 'None'],
                    'new_value' => ['role' => 'Entity Admin', 'scope' => 'DSSC-SULOP', 'effective_from' => '2026-08-01'],
                    'reason' => 'Appointed as Primary Entity Admin for Sulop Satellite Campus.',
                    'ip_address' => '10.10.1.12',
                ],
                [
                    'actor_user_id' => $superAdminUser?->id,
                    'actor_name' => 'Dr. Arthur Pendelton',
                    'actor_role' => 'Institution Super Admin',
                    'module' => 'Policies',
                    'action' => 'Locked Institutional Policy',
                    'target_type' => 'InstitutionPolicyTemplate',
                    'target_name' => 'POL-MON-004 · Laboratory Monitoring Separation-of-Duties',
                    'entity_scope' => 'All Entities',
                    'college_scope' => 'All Colleges',
                    'severity' => 'warning',
                    'previous_value' => ['inheritance_mode' => 'Allow College Override', 'prevent_self_verification' => false],
                    'new_value' => ['inheritance_mode' => 'Mandatory Locked', 'prevent_self_verification' => true],
                    'reason' => 'Internal Audit recommendation to prevent operational observers from self-verifying their own monitoring reports.',
                    'ip_address' => '10.10.1.12',
                ],
                [
                    'actor_user_id' => $superAdminUser?->id,
                    'actor_name' => 'Dr. Arthur Pendelton',
                    'actor_role' => 'Institution Super Admin',
                    'module' => 'Integrations',
                    'action' => 'Configured Background Sync & Token Guard',
                    'target_type' => 'Integration',
                    'target_name' => 'e-HRIS Travel Order & Locator Slip Bridge',
                    'entity_scope' => 'All Entities',
                    'college_scope' => 'CIDS',
                    'severity' => 'info',
                    'previous_value' => ['sync_mode' => 'Synchronous Page Load'],
                    'new_value' => ['sync_mode' => 'Queued Snapshot + 15m Freshness Guard', 'timeout_sec' => 15],
                    'reason' => 'Decoupled external e-HRIS API latency from normal page navigation.',
                    'ip_address' => '10.10.1.12',
                ],
            ];

            foreach ($auditEntries as $entry) {
                InstitutionAuditLog::create($entry);
            }
        }
    }
}
