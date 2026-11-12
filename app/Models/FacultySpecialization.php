<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultySpecialization extends Model
{
    protected $fillable = [
        'faculty_id',
        'expertise_area',
        'level',
        'display_order',
        'qualification_level',
        'course_category_match',
        'is_verified',
        'verification_status',
        'verified_by_id',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
