<?php

namespace App\Http\Controllers\Institution;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\InstitutionSetting;
use App\Models\Program;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionGovernanceController extends Controller
{
    /**
     * Institution Super Admin Dashboard: Platform Health, Setup & Governance Oversight
     */
    public function dashboard(Request $request): Response
    {
        $colleges = College::with('parent')->get();
        $totalColleges = $colleges->count();
        $activeColleges = $colleges->where('status', 'Active')->count();
        $inSetupColleges = $colleges->where('status', 'In Setup')->count();
        $notConfiguredColleges = $colleges->where('status', 'Not Configured')->count();
        $readyColleges = $colleges->where('status', 'Ready')->count();

        $totalUsers = User::count();
        $totalRoles = Role::count();
        $scopedRolesCount = ScopedRoleAssignment::where('status', 'Active')->count();

        $featureFlags = InstitutionSetting::getVal('feature_flags', []);
        $integrations = InstitutionSetting::getVal('integrations_status', []);
        $terminology = InstitutionSetting::getVal('terminology_overrides', []);

        // Platform Metrics Summary
        $platformHealth = [
            'uptime' => '99.98%',
            'api_gateway' => 'Operational',
            'llm_status' => 'Google Gemini 2.5 Flash Online',
            'storage_used' => '14.2 GB / 100 GB (Shared Drive)',
            'unresolved_syncs' => 0,
            'audit_alerts' => 2,
            'data_quality_score' => 96,
        ];

        // Recent Audit / Change History Items
        $recentChanges = [
            [
                'id' => 1,
                'action' => 'Enabled TV Cross-Channel Capability',
                'target' => 'Global Platform Config',
                'actor' => 'Dr. Arthur Pendelton',
                'timestamp' => '10 mins ago',
                'severity' => 'info',
            ],
            [
                'id' => 2,
                'action' => 'Onboarded College of Engineering (COE)',
                'target' => 'Colleges & Organizational Units',
                'actor' => 'Dr. Arthur Pendelton',
                'timestamp' => '2 hours ago',
                'severity' => 'success',
            ],
            [
                'id' => 3,
                'action' => 'Assigned Scoped Role: College Admin to CIDS',
                'target' => 'Maria Clara (Admin)',
                'actor' => 'Dr. Arthur Pendelton',
                'timestamp' => '1 day ago',
                'severity' => 'info',
            ],
            [
                'id' => 4,
                'action' => 'Google Sheets Reconciliation Sync Completed',
                'target' => 'CIDS Master Schedules',
                'actor' => 'Automated Engine',
                'timestamp' => '1 day ago',
                'severity' => 'info',
            ],
        ];

        return Inertia::render('institution/dashboard', [
            'colleges' => $colleges,
            'stats' => [
                'total_colleges' => $totalColleges,
                'active_colleges' => $activeColleges,
                'in_setup_colleges' => $inSetupColleges,
                'not_configured_colleges' => $notConfiguredColleges,
                'ready_colleges' => $readyColleges,
                'total_users' => $totalUsers,
                'total_roles' => $totalRoles,
                'scoped_assignments' => $scopedRolesCount,
            ],
            'platform_health' => $platformHealth,
            'feature_flags' => $featureFlags,
            'integrations' => $integrations,
            'terminology' => $terminology,
            'recent_changes' => $recentChanges,
        ]);
    }

    /**
     * Colleges & Organizational Units Module
     */
    public function colleges(Request $request): Response
    {
        $colleges = College::with(['parent', 'scopedRoles.user', 'scopedRoles.role'])->get();

        return Inertia::render('institution/colleges/index', [
            'colleges' => $colleges,
        ]);
    }

    /**
     * Store new College / Unit
     */
    public function storeCollege(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:colleges,code',
            'name' => 'required|string|max:255',
            'acronym' => 'nullable|string|max:20',
            'type' => 'required|string|in:College,Campus,School,Institute,Department',
            'dean_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'color_theme' => 'nullable|string|in:amber,blue,emerald,indigo,purple,rose',
        ]);

        College::create([
            ...$validated,
            'status' => 'In Setup',
            'setup_stage' => 'Identity',
            'setup_progress' => 20,
            'enabled_modules' => [
                'scheduling' => true,
                'compliance' => true,
            ],
        ]);

        return back()->with('success', "College unit '{$validated['code']}' created successfully.");
    }

    /**
     * College Setup & Guided Configuration Workspace
     */
    public function collegeSetup(Request $request, ?College $college = null): Response
    {
        $allColleges = College::orderBy('code')->get();
        $targetCollege = $college ?? $allColleges->first();

        return Inertia::render('institution/colleges/setup', [
            'colleges' => $allColleges,
            'currentCollege' => $targetCollege,
        ]);
    }

    /**
     * Update Setup Stage / Progress for a College
     */
    public function updateCollegeSetup(Request $request, College $college)
    {
        $validated = $request->validate([
            'setup_stage' => 'required|string',
            'setup_progress' => 'required|integer|min:0|max:100',
            'status' => 'required|string|in:Not Configured,In Setup,Ready,Active,Suspended,Archived',
            'enabled_modules' => 'nullable|array',
        ]);

        $college->update($validated);

        return back()->with('success', "Setup updated for {$college->code}.");
    }

    /**
     * Institution Profile & Identity
     */
    public function profile(): Response
    {
        $profile = [
            'name' => InstitutionSetting::getVal('institution_name', 'Davao Del Sur State College'),
            'acronym' => InstitutionSetting::getVal('institution_acronym', 'DSSC'),
            'address' => InstitutionSetting::getVal('institution_address', 'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002'),
            'timezone' => InstitutionSetting::getVal('institution_timezone', 'Asia/Manila (UTC+08:00)'),
            'email' => 'president@dssc.edu.ph',
            'website' => 'https://www.dssc.edu.ph',
            'logo_url' => '/DSSC.jpg',
            'report_header' => 'Republic of the Philippines · Davao Del Sur State College',
            'report_footer' => 'ISO 9001:2015 Certified · COMPASS Institutional Management System',
        ];

        return Inertia::render('institution/profile/index', [
            'profile' => $profile,
        ]);
    }

    /**
     * Save Institution Profile
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'acronym' => 'required|string|max:50',
            'address' => 'required|string|max:500',
            'timezone' => 'required|string|max:100',
        ]);

        InstitutionSetting::setVal('institution_name', $validated['name'], 'profile', 'Institution Full Name');
        InstitutionSetting::setVal('institution_acronym', $validated['acronym'], 'profile', 'Institution Acronym');
        InstitutionSetting::setVal('institution_address', $validated['address'], 'profile', 'Official Campus Address');
        InstitutionSetting::setVal('institution_timezone', $validated['timezone'], 'profile', 'System Timezone');

        return back()->with('success', 'Institution profile settings saved successfully.');
    }

    /**
     * Scoped Role Assignments Workspace
     */
    public function scopedRoles(Request $request): Response
    {
        $assignments = ScopedRoleAssignment::with(['user', 'role', 'college', 'program'])->latest()->get();
        $users = User::select('id', 'name', 'email')->orderBy('name')->get();
        $roles = Role::orderBy('name')->get();
        $colleges = College::orderBy('code')->get();
        $programs = Program::orderBy('code')->get();

        return Inertia::render('institution/users/scoped-roles', [
            'assignments' => $assignments,
            'users' => $users,
            'roles' => $roles,
            'colleges' => $colleges,
            'programs' => $programs,
        ]);
    }

    /**
     * Create Scoped Role Assignment
     */
    public function storeScopedRole(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_id' => 'required|exists:roles,id',
            'college_id' => 'nullable|exists:colleges,id',
            'program_id' => 'nullable|exists:programs,id',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
            'notes' => 'nullable|string|max:500',
        ]);

        ScopedRoleAssignment::create([
            ...$validated,
            'institution' => 'Davao Del Sur State College',
            'status' => 'Active',
        ]);

        return back()->with('success', 'Scoped role assignment granted successfully.');
    }

    /**
     * Platform Configuration & Module Management
     */
    public function modules(): Response
    {
        $colleges = College::all();
        $modulesCatalog = [
            ['id' => 'scheduling', 'name' => 'Semester Scheduling & Generator', 'category' => 'Academic Operations', 'icon' => 'CalendarDays', 'global_enabled' => true],
            ['id' => 'faculty_attendance', 'name' => 'Faculty Attendance & Compliance', 'category' => 'Faculty Governance', 'icon' => 'ClipboardCheck', 'global_enabled' => true],
            ['id' => 'lab_monitoring', 'name' => 'Facility & Lab Monitoring', 'category' => 'Facilities', 'icon' => 'SquareActivity', 'global_enabled' => true],
            ['id' => 'lab_inventory', 'name' => 'Laboratory Inventory & Assets', 'category' => 'Facilities', 'icon' => 'Monitor', 'global_enabled' => true],
            ['id' => 'research_extension', 'name' => 'Research & Extension Tracking', 'category' => 'Evidence', 'icon' => 'BookOpen', 'global_enabled' => true],
            ['id' => 'compliance', 'name' => 'Compliance Submissions & Tracker', 'category' => 'Compliance', 'icon' => 'FileCheck', 'global_enabled' => true],
            ['id' => 'tv_studio', 'name' => 'Campus TV Studio & Digital Signage', 'category' => 'Communications', 'icon' => 'Tv', 'global_enabled' => true],
            ['id' => 'performance', 'name' => 'Faculty & Program Performance', 'category' => 'Analytics', 'icon' => 'Trophy', 'global_enabled' => true],
        ];

        return Inertia::render('institution/platform/modules', [
            'colleges' => $colleges,
            'modulesCatalog' => $modulesCatalog,
        ]);
    }

    /**
     * Terminology Configuration
     */
    public function terminology(): Response
    {
        $terminology = InstitutionSetting::getVal('terminology_overrides', [
            'facility_monitor' => [
                'default' => 'Facility In-Charge',
                'cids' => 'Lab In-Charge',
                'coe' => 'Laboratory Technician',
                'ced' => 'Classroom Coordinator',
            ],
            'college_unit' => [
                'default' => 'College',
                'cids' => 'College',
            ],
            'academic_leader' => [
                'default' => 'Program Head',
                'cids' => 'Program Head',
            ],
        ]);

        return Inertia::render('institution/platform/terminology', [
            'terminology' => $terminology,
        ]);
    }

    /**
     * Save Terminology Overrides
     */
    public function updateTerminology(Request $request)
    {
        $validated = $request->validate([
            'terminology' => 'required|array',
        ]);

        InstitutionSetting::setVal('terminology_overrides', $validated['terminology'], 'terminology', 'Configurable Terminology Mappings');

        return back()->with('success', 'Institutional terminology mappings updated successfully.');
    }
}
