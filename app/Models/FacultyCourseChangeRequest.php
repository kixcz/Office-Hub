<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyCourseChangeRequest extends Model
{
    protected $fillable = [
        'publication_id',
        'academic_period_id',
        'college_id',
        'request_type',
        'requester_faculty_id',
        'target_faculty_id',
        'requester_schedule_id',
        'target_schedule_id',
        'reason',
        'counterpart_status',
        'counterpart_responded_at',
        'validation_passed',
        'validation_notes',
        'status',
        'program_head_id',
        'program_head_decided_at',
        'program_head_notes',
        'dean_id',
        'dean_decided_at',
        'dean_notes',
    ];

    protected function casts(): array
    {
        return [
            'counterpart_responded_at' => 'datetime',
            'program_head_decided_at' => 'datetime',
            'dean_decided_at' => 'datetime',
            'validation_passed' => 'boolean',
        ];
    }

    public function publication(): BelongsTo
    {
        return $this->belongsTo(FacultyLoadingPublication::class, 'publication_id');
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class);
    }

    public function requesterFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'requester_faculty_id');
    }

    public function targetFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'target_faculty_id');
    }

    public function requesterSchedule(): BelongsTo
    {
        return $this->belongsTo(RoomSchedule::class, 'requester_schedule_id');
    }

    public function targetSchedule(): BelongsTo
    {
        return $this->belongsTo(RoomSchedule::class, 'target_schedule_id');
    }

    public function programHead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'program_head_id');
    }

    public function dean(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dean_id');
    }
}

