<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
        'name',
        'email',
        'password',
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
        ];
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
     */
    public function hasRole(string $role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    /**
     * Check if the user has a specific permission through their roles.
     */
    public function hasPermissionTo(string $permission): bool
    {
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
        return $this->hasRole('Faculty Member') || $this->faculty()->exists();
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
     * Check if user is a College Admin (operational administrator for a college).
     * Includes backward-compatible aliases 'System Administrator' and 'Super Admin'.
     */
    public function isCollegeAdmin(): bool
    {
        return $this->hasRole('College Admin')
            || $this->hasRole('System Administrator')
            || $this->hasRole('Super Admin')
            || $this->isInstitutionSuperAdmin();
    }

    /**
     * Check if user can switch TV channels (Institution Super Admin, VPAF, or College Admin).
     */
    public function canSwitchTvChannels(): bool
    {
        return $this->isInstitutionSuperAdmin()
            || $this->isVpaf()
            || $this->isCollegeAdmin()
            || $this->hasRole('Institution TV / Communications Manager')
            || $this->hasRole('Dean');
    }
}
