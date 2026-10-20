<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabMonitoringSession extends Model
{
    protected $fillable = [
        'verified_schedule_id',
        'room_id',
        'monitored_by_user_id',
        'monitoring_date',
        'scheduled_start_time',
        'scheduled_end_time',
        'scheduled_minutes',
        'actual_start_time',
        'actual_end_time',
        'late_minutes',
        'observed_minutes',
        'variance_minutes',
        'student_headcount',
        'observation_status',
        'room_condition',
        'session_outcome',
        'alternative_room_id',
        'is_historical_reconciliation',
        'correction_requested',
        'correction_notes',
        'observed_faculty_id',
        'observed_course_code',
        'observed_section_name',
        'remarks',
        'has_discrepancy',
        'is_locked',
    ];

    protected function casts(): array
    {
        return [
            'monitoring_date' => 'date',
            'has_discrepancy' => 'boolean',
            'is_locked' => 'boolean',
            'is_historical_reconciliation' => 'boolean',
            'correction_requested' => 'boolean',
        ];
    }

    public function verifiedSchedule(): BelongsTo
    {
        return $this->belongsTo(VerifiedSchedule::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function monitor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'monitored_by_user_id');
    }

    public function observedFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'observed_faculty_id');
    }

    public function discrepancies(): HasMany
    {
        return $this->hasMany(LabMonitoringDiscrepancy::class, 'monitoring_session_id');
    }
}
