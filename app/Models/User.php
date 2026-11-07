<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'institutional_id',
        'name',
        'email',
        'phone',
        'password',
        'account_status',
        'default_role_assignment_id',
        'mfa_required',
        'force_password_reset',
        'last_login_at',
        'effective_from',
        'effective_until',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mfa_required' => 'boolean',
            'force_password_reset' => 'boolean',
            'last_login_at' => 'datetime',
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    /**
     * Scoped role assignments for this canonical user identity.
     */
    public function scopedRoleAssignments()
    {
        return $this->hasMany(ScopedRoleAssignment::class);
    }

    public function defaultRoleAssignment(): BelongsTo
    {
        return $this->belongsTo(ScopedRoleAssignment::class, 'default_role_assignment_id');
    }

    /**
     * The roles that belong to the user.
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    /**
     * Check if the user has a specific role.
     * Uses the loaded roles collection to avoid N+1 database queries.
     */
    public function hasRole(string $role): bool
    {
        if (! $this->relationLoaded('roles')) {
            $this->load('roles');
        }

        if ($this->roles->contains('name', $role)) {
            return true;
        }

        if (session('active_role_name') === $role) {
            return true;
        }

        return $this->scopedRoleAssignments()
            ->where('status', 'Active')
            ->whereHas('role', fn ($q) => $q->where('name', $role))
            ->exists();
    }

    /**
     * Check if the user has any of the given roles.
     *
     * @param  array<int, string>  $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        if (! $this->relationLoaded('roles')) {
            $this->load('roles');
        }

        if ($this->roles->whereIn('name', $roles)->isNotEmpty()) {
            return true;
        }

        $activeRoleName = session('active_role_name');
        if ($activeRoleName && in_array($activeRoleName, $roles, true)) {
            return true;
        }

        return $this->scopedRoleAssignments()
            ->where('status', 'Active')
            ->whereHas('role', fn ($q) => $q->whereIn('name', $roles))
            ->exists();
    }

    /**
     * Check if the user has a specific permission through their roles.
     */
    public function hasPermissionTo(string $permission): bool
    {
        if ($this->relationLoaded('roles') && $this->roles->every(fn ($role) => $role->relationLoaded('permissions'))) {
            return $this->roles->contains(fn ($role) => $role->permissions->contains('name', $permission));
        }

        return $this->roles()->whereHas('permissions', function ($query) use ($permission) {
            $query->where('name', $permission);
        })->exists();
    }

    /**
     * The faculty profile associated with the user.
     */
    public function faculty()
    {
        return $this->hasOne(Faculty::class);
    }

    /**
     * Check if user is a faculty member.
     */
    public function isFaculty(): bool
    {
        if ($this->hasRole('Faculty Member')) {
            return true;
        }

        if ($this->relationLoaded('faculty')) {
            return $this->faculty !== null;
        }

        return $this->faculty()->exists();
    }

    /**
     * Check if user is an Institution Super Admin (platform-level).
     */
    public function isInstitutionSuperAdmin(): bool
    {
        return $this->hasRole('Institution Super Admin');
    }

    /**
     * Check if user is VPAF / Executive Oversight.
     */
    public function isVpaf(): bool
    {
        return $this->hasRole('VPAF / Executive Oversight');
    }

    /**
     * Check if user is an Entity Admin (Campus / Entity coordinator).
     */
    public function isEntityAdmin(): bool
    {
        return $this->hasRole('Entity Admin');
    }

    /**
     * Check if user is a College Admin (operational administrator for a college).
     * Includes backward-compatible aliases 'System Administrator' and 'Super Admin'.
     */
    public function isCollegeAdmin(): bool
    {
        return $this->hasAnyRole([
            'College Admin',
            'Entity Admin',
            'System Administrator',
            'Super Admin',
            'Institution Super Admin',
        ]);
    }

    /**
     * Check if user can switch TV channels (Institution Super Admin, VPAF, or College Admin).
     */
    public function canSwitchTvChannels(): bool
    {
        return $this->hasAnyRole([
            'Institution Super Admin',
            'VPAF / Executive Oversight',
            'College Admin',
            'System Administrator',
            'Super Admin',
            'Institution TV / Communications Manager',
            'Dean',
        ]);
    }

    /**
     * Resolve the active College associated with this user (for faculty, deans, program heads, or college admins).
     */
    public function resolveActiveCollege(): ?College
    {
        if ($this->isInstitutionSuperAdmin()) {
            return null;
        }

        // 1. Check Faculty -> Program -> College
        if ($this->relationLoaded('faculty') && $this->faculty?->program?->college) {
            return $this->faculty->program->college;
        }

        $faculty = $this->faculty()->with('program.college')->first();
        if ($faculty?->program?->college) {
            return $faculty->program->college;
        }

        // 2. Check active ScopedRoleAssignment with college_id or program_id
        // Filter out assignments pointing to top-level Entity (parent_id is null / type is Entity)
        $scopedAssignment = $this->scopedRoleAssignments()
            ->with(['college', 'program.college'])
            ->where('status', 'Active')
            ->where(function ($q) {
                $q->whereNotNull('college_id')->orWhereNotNull('program_id');
            })
            ->whereHas('college', function ($q) {
                $q->where('type', '!=', 'Entity');
            })
            ->latest('id')
            ->first();

        if (! $scopedAssignment) {
            // Fallback to any assignment with program or college if no non-entity college found
            $scopedAssignment = $this->scopedRoleAssignments()
                ->with(['college', 'program.college'])
                ->where('status', 'Active')
                ->where(function ($q) {
                    $q->whereNotNull('college_id')->orWhereNotNull('program_id');
                })
                ->latest('id')
                ->first();
        }

        if ($scopedAssignment?->college && $scopedAssignment->college->type !== 'Entity') {
            return $scopedAssignment->college;
        }

        if ($scopedAssignment?->program?->college) {
            return $scopedAssignment->program->college;
        }

        // 3. Fallback by email hint (e.g., dean.cas@dssc.edu.ph, dean.cids@dssc.edu.ph)
        if ($this->email) {
            $byEmail = College::where('contact_email', $this->email)->first();
            if ($byEmail && $byEmail->type !== 'Entity') {
                return $byEmail;
            }
        }

        // 4. Default to CIDS for general operational/faculty accounts if not Institution Super Admin
        return College::where('code', 'CIDS')->first()
            ?? College::where('type', '!=', 'Entity')->first();
    }
}
