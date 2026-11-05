<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'tier',
        'portal_type',
        'risk_level',
        'is_system_role',
        'status',
        'description',
        'allowed_scopes',
        'assignable_by',
        'requires_mfa',
        'requires_approval',
        'icon_key',
    ];

    protected function casts(): array
    {
        return [
            'is_system_role' => 'boolean',
            'allowed_scopes' => 'array',
            'assignable_by' => 'array',
            'requires_mfa' => 'boolean',
            'requires_approval' => 'boolean',
        ];
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function scopedAssignments(): HasMany
    {
        return $this->hasMany(ScopedRoleAssignment::class);
    }
}
