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

    protected $appends = [
        'branding',
    ];

    public function getBrandingAttribute(): array
    {
        $presets = [
            'amber' => [
                'primary_color' => '#F9C400',
                'secondary_color' => '#1E293B',
                'accent_color' => '#FEF3C7',
                'surface_color' => '#FFFFFF',
                'preset_key' => 'amber',
            ],
            'blue' => [
                'primary_color' => '#2563EB',
                'secondary_color' => '#1E3A8A',
                'accent_color' => '#DBEAFE',
                'surface_color' => '#FFFFFF',
                'preset_key' => 'blue',
            ],
            'emerald' => [
                'primary_color' => '#10B981',
                'secondary_color' => '#064E3B',
                'accent_color' => '#D1FAE5',
                'surface_color' => '#FFFFFF',
                'preset_key' => 'emerald',
            ],
            'rose' => [
                'primary_color' => '#E11D48',
                'secondary_color' => '#881337',
                'accent_color' => '#FFE4E6',
                'surface_color' => '#FFFFFF',
                'preset_key' => 'rose',
            ],
            'teal' => [
                'primary_color' => '#0D9488',
                'secondary_color' => '#134E4A',
                'accent_color' => '#CCFBF1',
                'surface_color' => '#FFFFFF',
                'preset_key' => 'teal',
            ],
            'purple' => [
                'primary_color' => '#7C3AED',
                'secondary_color' => '#4C1D95',
                'accent_color' => '#EDE9FE',
                'surface_color' => '#FFFFFF',
                'preset_key' => 'purple',
            ],
            'indigo' => [
                'primary_color' => '#4F46E5',
                'secondary_color' => '#312E81',
                'accent_color' => '#E0E7FF',
                'surface_color' => '#FFFFFF',
                'preset_key' => 'indigo',
            ],
        ];

        $defaultslogans = [
            'CAS' => 'Knowledge. Creativity. Service to Society.',
            'CIDS' => 'Educating today, innovating tomorrow.',
            'CED' => 'Empowering educators, shaping future generations.',
            'CBA' => 'Leading with integrity, innovating for enterprise.',
            'COE' => 'Engineering sustainable solutions for the future.',
        ];

        $themeKey = $this->color_theme ?: ($this->code === 'CAS' ? 'amber' : 'purple');
        $basePreset = $presets[$themeKey] ?? $presets['purple'];

        $stored = is_array($this->report_defaults) ? ($this->report_defaults['branding'] ?? []) : [];

        return [
            'primary_color' => $stored['primary_color'] ?? $basePreset['primary_color'],
            'secondary_color' => $stored['secondary_color'] ?? $basePreset['secondary_color'],
            'accent_color' => $stored['accent_color'] ?? $basePreset['accent_color'],
            'surface_color' => $stored['surface_color'] ?? $basePreset['surface_color'],
            'preset_key' => $stored['preset_key'] ?? $basePreset['preset_key'],
            'slogan' => $stored['slogan'] ?? ($defaultslogans[$this->code] ?? 'Excellence, Integrity, and Innovation in Academic Governance.'),
            'logo_url' => $this->logo_url,
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

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'college_id');
    }

    public function facilities(): HasMany
    {
        return $this->hasMany(Room::class, 'college_id');
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
