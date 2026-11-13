<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyLoadAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'loading_version_id',
        'academic_period_id',
        'faculty_id',
        'room_schedule_id',
        'course_code',
        'course_title',
        'section',
        'units',
        'contact_hours',
        'is_lab',
        'assignment_source',
        'is_locked',
        'justification',
        'match_score',
    ];

    protected function casts(): array
    {
        return [
            'units' => 'float',
            'contact_hours' => 'float',
            'is_lab' => 'boolean',
            'is_locked' => 'boolean',
            'match_score' => 'integer',
        ];
    }

    public function loadingVersion(): BelongsTo
    {
        return $this->belongsTo(LoadingVersion::class);
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function roomSchedule(): BelongsTo
    {
        return $this->belongsTo(RoomSchedule::class);
    }
}
