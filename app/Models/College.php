<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class College extends Model
{
    protected $fillable = [
        'code',
        'name',
        'acronym',
        'type',
        'parent_id',
        'dean_name',
        'contact_email',
        'status',
        'setup_stage',
        'setup_progress',
        'enabled_modules',
        'logo_url',
        'color_theme',
    ];

    protected function casts(): array
    {
        return [
            'enabled_modules' => 'array',
            'setup_progress' => 'integer',
        ];
    }

    public function parent()
    {
        return $this->belongsTo(College::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(College::class, 'parent_id');
    }

    public function scopedRoles()
    {
        return $this->hasMany(ScopedRoleAssignment::class);
    }
}
