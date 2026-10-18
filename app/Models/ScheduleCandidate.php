<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleCandidate extends Model
{
    protected $fillable = [
        'academic_period_id',
        'candidate_code',
        'hard_conflicts_count',
        'objective_score',
        'faculty_preference_satisfaction',
        'avg_faculty_gap_hours',
        'avg_section_gap_hours',
        'late_classes_count',
        'room_utilization_percent',
        'solver_metadata',
        'schedule_payload',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'hard_conflicts_count' => 'integer',
            'objective_score' => 'decimal:2',
            'faculty_preference_satisfaction' => 'decimal:2',
            'avg_faculty_gap_hours' => 'decimal:2',
            'avg_section_gap_hours' => 'decimal:2',
            'late_classes_count' => 'integer',
            'room_utilization_percent' => 'decimal:2',
            'solver_metadata' => 'array',
            'schedule_payload' => 'array',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function scheduleVersions(): HasMany
    {
        return $this->hasMany(ScheduleVersion::class, 'candidate_id');
    }
}
