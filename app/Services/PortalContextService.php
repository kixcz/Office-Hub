<?php

namespace App\Services;

use App\Models\College;
use App\Models\InstitutionAuditLog;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class PortalContextService
{
    /**
     * Map a role name to its architectural portal type and default landing URL.
     *
     * @return array{portal_type: string, landing_url: string, tier: string}
     */
    public static function resolveRolePortalMeta(string $roleName): array
    {
        $normalized = trim($roleName);

        if (str_contains($normalized, 'Institution Super Admin') || str_contains($normalized, 'Platform Administrator')) {
            return [
                'portal_type' => 'institution_super_admin',
                'landing_url' => '/institution/dashboard',
                'tier' => 'Institution',
            ];
        }

        if (str_contains($normalized, 'VPAA') || str_contains($normalized, 'Academic Executive')) {
            return [
                'portal_type' => 'vpaa',
                'landing_url' => '/vpaa/dashboard',
                'tier' => 'Institution',
            ];
        }

        if (str_contains($normalized, 'VPAF') || str_contains($normalized, 'Executive Oversight')) {
            return [
                'portal_type' => 'vpaf',
                'landing_url' => '/vpaf/dashboard',
                'tier' => 'Institution',
            ];
        }

        if (str_contains($normalized, 'Dean')) {
            return [
                'portal_type' => 'dean',
                'landing_url' => '/dashboard',
                'tier' => 'College',
            ];
        }

        if (str_contains($normalized, 'College Admin') || str_contains($normalized, 'College Secretary')) {
            return [
                'portal_type' => 'college_admin',
                'landing_url' => '/dashboard',
                'tier' => 'College',
            ];
        }

        if (str_contains($normalized, 'Program Head') || str_contains($normalized, 'Program Chair')) {
            return [
                'portal_type' => 'program_head',
                'landing_url' => '/dashboard',
                'tier' => 'Program',
            ];
        }

        if (str_contains($normalized, 'Entity Admin') || str_contains($normalized, 'Campus Administrator') || str_contains($normalized, 'Campus Director')) {
            return [
                'portal_type' => 'entity_admin',
                'landing_url' => '/dashboard',
                'tier' => 'Entity',
            ];
        }

        if (str_contains($normalized, 'Lab In-Charge') || str_contains($normalized, 'Facility In-Charge') || str_contains($normalized, 'Facility Observer')) {
            return [
                'portal_type' => 'lab_in_charge',
                'landing_url' => '/facilities/rooms',
                'tier' => 'Operational',
            ];
        }

        if (str_contains($normalized, 'Faculty') || str_contains($normalized, 'Instructor') || str_contains($normalized, 'Professor')) {
            return [
                'portal_type' => 'faculty',
                'landing_url' => '/faculty/dashboard',
                'tier' => 'Academic',
            ];
        }

        return [
            'portal_type' => 'general',
            'landing_url' => '/dashboard',
            'tier' => 'Operational',
        ];
    }

    /**
     * Retrieve all active, non-expired role assignments for a user.
     * Automatically ensures any direct role on the user has a backing ScopedRoleAssignment.
     */
    public function getUserAvailableAssignments(User $user): Collection
    {
        $today = Carbon::today();

        // 1. Sync legacy direct roles into scoped_role_assignments if missing
        $this->ensureDirectRolesHaveScopedAssignments($user);

        // 2. Fetch all valid assignments
        $assignments = ScopedRoleAssignment::where('user_id', $user->id)
            ->where('status', 'Active')
            ->where(function ($q) use ($today) {
                $q->whereNull('effective_from')->orWhere('effective_from', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('effective_until')->orWhere('effective_until', '>=', $today);
            })
            ->with(['role', 'college', 'program.college', 'entity', 'facility'])
            ->orderByRaw("CASE designation_type WHEN 'Primary' THEN 1 WHEN 'Concurrent' THEN 2 WHEN 'Acting' THEN 3 WHEN 'Secondary' THEN 4 WHEN 'Special Assignment' THEN 5 ELSE 6 END")
            ->orderBy('id', 'asc')
            ->get();

        $activeAssignmentId = session('active_role_assignment_id');

        return $assignments->map(function (ScopedRoleAssignment $assignment) use ($user, $activeAssignmentId) {
            $roleName = $assignment->role?->name ?? 'Faculty Member';
            $meta = self::resolveRolePortalMeta($roleName);

            // Compute human-readable labels
            $scopeInfo = $this->resolveScopeLabels($assignment);

            $isDefault = $user->default_role_assignment_id === $assignment->id;
            $isActive = $activeAssignmentId ? ($activeAssignmentId === $assignment->id) : false;

            return [
                'id' => $assignment->id,
                'role_id' => $assignment->role_id,
                'role_name' => $roleName,
                'portal_type' => $meta['portal_type'],
                'landing_url' => $meta['landing_url'],
                'tier' => $meta['tier'],
                'scope_level' => $assignment->scope_level,
                'scope_type' => $scopeInfo['scope_type'],
                'scope_id' => $scopeInfo['scope_id'],
                'scope_code' => $scopeInfo['scope_code'],
                'scope_name' => $scopeInfo['scope_name'],
                'display_label' => $scopeInfo['display_label'],
                'short_label' => $scopeInfo['short_label'],
                'designation_type' => $assignment->designation_type,
                'appointment_reference' => $assignment->appointment_reference,
                'assignment_reason' => $assignment->assignment_reason,
                'effective_from' => $assignment->effective_from?->format('Y-m-d'),
                'effective_until' => $assignment->effective_until?->format('Y-m-d'),
                'is_active' => $isActive,
                'is_default' => $isDefault,
            ];
        });
    }

    /**
     * Ensure any direct roles attached via role_user table have a ScopedRoleAssignment.
     */
    protected function ensureDirectRolesHaveScopedAssignments(User $user): void
    {
        $user->loadMissing(['roles', 'faculty.program.college']);
        $college = $user->resolveActiveCollege();

        foreach ($user->roles as $role) {
            $exists = ScopedRoleAssignment::where('user_id', $user->id)
                ->where('role_id', $role->id)
                ->exists();

            if (! $exists) {
                $scopeLevel = 'College';
                $collegeId = $college?->id;
                $programId = $user->faculty?->program_id;
                $entityId = $college?->parent_id ?? $college?->id;

                if (str_contains($role->name, 'Super Admin') || str_contains($role->name, 'VPAF')) {
                    $scopeLevel = 'Institution';
                    $collegeId = null;
                    $programId = null;
                } elseif (str_contains($role->name, 'Entity') || str_contains($role->name, 'Campus Admin')) {
                    $scopeLevel = 'Entity';
                    $collegeId = null;
                    $programId = null;
                } elseif (str_contains($role->name, 'Program Head') || str_contains($role->name, 'Program Chair')) {
                    $scopeLevel = 'Program';
                }

                ScopedRoleAssignment::create([
                    'user_id' => $user->id,
                    'role_id' => $role->id,
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => $scopeLevel,
                    'entity_id' => $entityId,
                    'college_id' => $collegeId,
                    'program_id' => $programId,
                    'designation_type' => 'Primary',
                    'status' => 'Active',
                    'effective_from' => $user->effective_from ?? Carbon::today(),
                    'appointment_reference' => 'Initial Canonical Alignment',
                ]);
            }
        }
    }

    /**
     * Compute clean human-readable scope labels and badge text.
     */
    protected function resolveScopeLabels(ScopedRoleAssignment $assignment): array
    {
        $roleName = $assignment->role?->name ?? 'Faculty Member';
        $collegeCode = $assignment->college?->code ?? $assignment->program?->college?->code ?? 'CIDS';
        $programCode = $assignment->program?->code ?? '';
        $entityCode = $assignment->entity?->code ?? 'DSSC-MAIN';

        // 1. Institution Level
        if ($assignment->scope_level === 'Institution' || str_contains($roleName, 'Super Admin') || str_contains($roleName, 'VPAF')) {
            return [
                'scope_type' => 'Institution',
                'scope_id' => null,
                'scope_code' => 'DSSC',
                'scope_name' => 'Davao Del Sur State College (Platform-Wide)',
                'display_label' => $roleName === 'VPAF / Executive Oversight' ? 'VPAF Executive (Institution)' : 'Institution Super Admin',
                'short_label' => $roleName === 'VPAF / Executive Oversight' ? 'VPAF Exec' : 'Super Admin',
            ];
        }

        // 2. Entity / Campus Level
        if ($assignment->scope_level === 'Entity' || str_contains($roleName, 'Entity Admin') || str_contains($roleName, 'Campus Admin')) {
            $name = $assignment->entity?->name ?? 'Campus Entity';

            return [
                'scope_type' => 'Entity',
                'scope_id' => $assignment->entity_id,
                'scope_code' => $entityCode,
                'scope_name' => $name,
                'display_label' => "{$entityCode} Campus Admin",
                'short_label' => "{$entityCode} Admin",
            ];
        }

        // 3. Dean (Always College Scope)
        if (str_contains($roleName, 'Dean')) {
            return [
                'scope_type' => 'College',
                'scope_id' => $assignment->college_id,
                'scope_code' => $collegeCode,
                'scope_name' => $assignment->college?->name ?? 'College',
                'display_label' => "{$collegeCode} Dean",
                'short_label' => "{$collegeCode} Dean",
            ];
        }

        // 4. Program Head / Chair
        if (str_contains($roleName, 'Program Head') || str_contains($roleName, 'Program Chair')) {
            $code = $programCode ?: 'Program';

            return [
                'scope_type' => 'Program',
                'scope_id' => $assignment->program_id,
                'scope_code' => $code,
                'scope_name' => $assignment->program?->name ?? 'Academic Program',
                'display_label' => "{$code} Program Head",
                'short_label' => "{$code} Head",
            ];
        }

        // 5. Lab In-Charge / Facility In-Charge
        if (str_contains($roleName, 'Lab In-Charge') || str_contains($roleName, 'Facility In-Charge') || str_contains($roleName, 'Facility Observer')) {
            $isHead = str_contains($roleName, 'Head');
            $short = $isHead ? "{$collegeCode} Head Lab" : "{$collegeCode} Lab In-Charge";
            $display = $isHead ? "{$collegeCode} Head Lab / Facility In-Charge" : "{$collegeCode} Lab In-Charge";

            return [
                'scope_type' => $assignment->scope_level ?: 'College',
                'scope_id' => $assignment->facility_id ?? $assignment->college_id,
                'scope_code' => $collegeCode,
                'scope_name' => $assignment->college?->name ?? 'Laboratory & Facilities',
                'display_label' => $display,
                'short_label' => $short,
            ];
        }

        // 6. Research & Extension Coordinators
        if (str_contains($roleName, 'Research') || str_contains($roleName, 'Extension')) {
            return [
                'scope_type' => 'College',
                'scope_id' => $assignment->college_id,
                'scope_code' => $collegeCode,
                'scope_name' => $assignment->college?->name ?? 'College',
                'display_label' => "{$collegeCode} Research Coordinator",
                'short_label' => "{$collegeCode} Research",
            ];
        }

        // 7. College Admin / Secretary
        if (str_contains($roleName, 'College Admin') || str_contains($roleName, 'College Secretary')) {
            return [
                'scope_type' => 'College',
                'scope_id' => $assignment->college_id,
                'scope_code' => $collegeCode,
                'scope_name' => $assignment->college?->name ?? 'College',
                'display_label' => "{$collegeCode} College Admin",
                'short_label' => "{$collegeCode} Admin",
            ];
        }

        // 8. Program Scope (Generic)
        if ($assignment->scope_level === 'Program') {
            $code = $programCode ?: 'Program';

            return [
                'scope_type' => 'Program',
                'scope_id' => $assignment->program_id,
                'scope_code' => $code,
                'scope_name' => $assignment->program?->name ?? 'Academic Program',
                'display_label' => "{$code} Program Head",
                'short_label' => "{$code} Head",
            ];
        }

        // 9. College Scope (Faculty default)
        if ($assignment->scope_level === 'College') {
            $detail = $programCode ? "{$collegeCode} Faculty ({$programCode})" : "{$collegeCode} Faculty";

            return [
                'scope_type' => 'College',
                'scope_id' => $assignment->college_id,
                'scope_code' => $collegeCode,
                'scope_name' => $assignment->college?->name ?? 'College',
                'display_label' => $detail,
                'short_label' => "{$collegeCode} Faculty",
            ];
        }

        return [
            'scope_type' => $assignment->scope_level,
            'scope_id' => $assignment->facility_id ?? $assignment->college_id,
            'scope_code' => $collegeCode,
            'scope_name' => $assignment->notes ?? 'Operational',
            'display_label' => "{$roleName} ({$collegeCode})",
            'short_label' => $roleName,
        ];
    }

    /**
     * Get or initialize the currently active assignment context for the user.
     */
    public function getActiveAssignment(User $user, ?Request $request = null): array
    {
        $available = $this->getUserAvailableAssignments($user);

        if ($available->isEmpty()) {
            return [
                'id' => null,
                'role_name' => 'Faculty Member',
                'portal_type' => 'faculty',
                'landing_url' => '/faculty/dashboard',
                'display_label' => 'Faculty Workspace',
                'short_label' => 'Faculty',
                'scope_type' => 'College',
                'scope_id' => null,
                'scope_code' => 'CIDS',
                'scope_name' => 'College of Information and Digital Sciences',
            ];
        }

        $activeId = session('active_role_assignment_id');
        $activeItem = null;

        if ($activeId) {
            $activeItem = $available->firstWhere('id', (int) $activeId);
        }

        if (! $activeItem && $user->default_role_assignment_id) {
            $activeItem = $available->firstWhere('id', $user->default_role_assignment_id);
        }

        if (! $activeItem) {
            // Priority order for initial workspace
            $priority = ['institution_super_admin', 'vpaf', 'dean', 'college_admin', 'program_head', 'faculty'];
            foreach ($priority as $pt) {
                $candidate = $available->firstWhere('portal_type', $pt);
                if ($candidate) {
                    $activeItem = $candidate;
                    break;
                }
            }
        }

        $activeItem = $activeItem ?? $available->first();

        // Ensure session has these exact keys
        session([
            'active_role_assignment_id' => $activeItem['id'],
            'active_role_name' => $activeItem['role_name'],
            'active_portal_type' => $activeItem['portal_type'],
            'active_scope_type' => $activeItem['scope_type'],
            'active_scope_id' => $activeItem['scope_id'],
            'active_scope_code' => $activeItem['scope_code'],
            'active_scope_name' => $activeItem['scope_name'],
        ]);

        return $activeItem;
    }

    /**
     * Switch context to a specific ScopedRoleAssignment.
     * Clears sensitive temporary session keys and records an audit log.
     */
    public function switchContext(User $user, int $assignmentId, Request $request): array
    {
        $available = $this->getUserAvailableAssignments($user);
        $target = $available->firstWhere('id', $assignmentId);

        if (! $target) {
            throw new \InvalidArgumentException('Unauthorized or invalid role assignment selected.');
        }

        $previousRole = session('active_role_name', 'Unknown');
        $previousScope = session('active_scope_name', 'Unknown');

        // Clear cross-role cached session keys
        $request->session()->forget([
            'officehub_active_college_id',
            'officehub_filters',
            'active_meeting_context',
            'current_review_candidate',
        ]);

        // Set new active context
        $request->session()->put([
            'active_role_assignment_id' => $target['id'],
            'active_role_name' => $target['role_name'],
            'active_portal_type' => $target['portal_type'],
            'active_scope_type' => $target['scope_type'],
            'active_scope_id' => $target['scope_id'],
            'active_scope_code' => $target['scope_code'],
            'active_scope_name' => $target['scope_name'],
        ]);

        // Record audit log
        InstitutionAuditLog::record(
            module: 'Identity & Access',
            action: 'Switched Active Portal Workspace',
            targetName: "{$target['display_label']} ({$target['portal_type']})",
            actor: $user,
            previousValue: ['role' => $previousRole, 'scope' => $previousScope],
            newValue: ['role' => $target['role_name'], 'scope' => $target['scope_name'], 'portal' => $target['portal_type']],
            reason: 'User switched portal workspace via Ascend Header Portal Switcher.',
            severity: 'info',
            scopeType: $target['scope_type'],
            scopeName: $target['scope_name'],
            actingRole: $target['role_name'],
        );

        return $target;
    }

    /**
     * Check whether an actor has authority to assign a target role within a given scope.
     */
    public function canAssignRole(User $actor, Role $targetRole, string $scopeLevel, ?int $scopeId = null): bool
    {
        if ($actor->isInstitutionSuperAdmin()) {
            return true;
        }

        $activePortal = session('active_portal_type');
        $activeCollegeId = session('active_scope_id');

        // VPAF: can assign leadership / academic roles at Institution / College level
        if ($actor->isVpaf() && $activePortal === 'vpaf') {
            return in_array($targetRole->name, [
                'Dean',
                'Program Head',
                'Research Coordinator',
                'Extension Coordinator',
                'College Admin',
                'Entity Admin',
            ]);
        }

        // Dean: can assign academic roles strictly within their own college
        if (($actor->hasRole('Dean') || $activePortal === 'dean')) {
            if ($scopeLevel !== 'College' && $scopeLevel !== 'Program') {
                return false;
            }
            if ($scopeId && $activeCollegeId && (int) $scopeId !== (int) $activeCollegeId) {
                return false;
            }

            return in_array($targetRole->name, [
                'Program Head',
                'Research Coordinator',
                'Extension Coordinator',
                'Faculty Member',
            ]);
        }

        // College Admin: can assign college operational roles within own college
        if (($actor->isCollegeAdmin() || $activePortal === 'college_admin')) {
            if ($scopeLevel !== 'College' && $scopeLevel !== 'Program' && $scopeLevel !== 'Facility') {
                return false;
            }
            if ($scopeId && $activeCollegeId && (int) $scopeId !== (int) $activeCollegeId) {
                return false;
            }

            return in_array($targetRole->name, [
                'Head Lab In-Charge',
                'Lab In-Charge',
                'College TV / Communications Manager',
                'Faculty Member',
            ]);
        }

        return false;
    }
}
