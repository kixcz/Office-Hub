<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class College extends Model
{
    protected $fillable = [
        'code',
        'name',
        'acronym',
        'type',
        'entity_type',
        'parent_id',
        'dean_name',
        'contact_email',
        'address',
        'contact_phone',
        'status',
        'effective_from',
        'effective_until',
        'setup_stage',
        'setup_progress',
        'enabled_modules',
        'entity_tv_enabled',
        'allow_local_overrides',
        'inheritance_settings',
        'report_defaults',
        'logo_url',
        'color_theme',
    ];

    protected function casts(): array
    {
        return [
            'enabled_modules' => 'array',
            'inheritance_settings' => 'array',
            'report_defaults' => 'array',
            'setup_progress' => 'integer',
            'entity_tv_enabled' => 'boolean',
            'allow_local_overrides' => 'boolean',
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(College::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(College::class, 'parent_id');
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class, 'college_id');
    }

    public function scopedRoles(): HasMany
    {
        return $this->hasMany(ScopedRoleAssignment::class, 'college_id');
    }

    public function entityScopedRoles(): HasMany
    {
        return $this->hasMany(ScopedRoleAssignment::class, 'entity_id');
    }
}
