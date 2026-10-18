<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyPreference extends Model
{
    protected $fillable = [
        'faculty_id',
        'academic_period_id',
        'preferred_course_ids',
        'preferred_days',
        'preferred_time_windows',
        'max_days_per_week',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'preferred_course_ids' => 'array',
            'preferred_days' => 'array',
            'preferred_time_windows' => 'array',
            'max_days_per_week' => 'integer',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }
}
