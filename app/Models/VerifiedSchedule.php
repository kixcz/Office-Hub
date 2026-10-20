<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VerifiedSchedule extends Model
{
    protected $fillable = [
        'academic_period_id',
        'staging_record_id',
        'sync_batch_id',
        'faculty_id',
        'course_id',
        'section_id',
        'room_id',
        'session_type',
        'day_of_week',
        'scheduled_start_time',
        'scheduled_end_time',
        'scheduled_minutes',
        'effective_start_date',
        'effective_end_date',
        'assignment_source',
        'original_raw_values',
        'mapping_confidence',
        'status',
        'verified_by_user_id',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'effective_start_date' => 'date',
            'effective_end_date' => 'date',
            'original_raw_values' => 'array',
            'mapping_confidence' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }

    public function monitoringSessions(): HasMany
    {
        return $this->hasMany(LabMonitoringSession::class, 'verified_schedule_id');
    }
}
