<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseOffering extends Model
{
    protected $fillable = [
        'academic_period_id',
        'course_id',
        'section_id',
        'faculty_id',
        'offering_code',
        'course_code',
        'course_title',
        'section_name',
        'units',
        'lecture_hours',
        'lab_hours',
        'room_type_required',
        'status',
        'is_locked',
    ];

    protected function casts(): array
    {
        return [
            'units' => 'decimal:1',
            'lecture_hours' => 'decimal:1',
            'lab_hours' => 'decimal:1',
            'is_locked' => 'boolean',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function roomSchedules(): HasMany
    {
        return $this->hasMany(RoomSchedule::class);
    }
}
