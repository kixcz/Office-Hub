<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MakeUpClassRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_no',
        'academic_period_id',
        'faculty_id',
        'room_schedule_id',
        'missed_date',
        'course_code',
        'course_title',
        'section',
        'original_day_of_week',
        'original_start_time',
        'original_end_time',
        'original_room_name',
        'required_contact_hours',
        'absence_reason',
        'absence_remarks',
        'proposed_date',
        'proposed_start_time',
        'proposed_end_time',
        'proposed_room_name',
        'modality',
        'proposed_remarks',
        'status',
        'program_head_reviewed_at',
        'program_head_reviewed_by_id',
        'program_head_remarks',
        'dean_approved_at',
        'dean_approved_by_id',
        'dean_remarks',
        'conducted_at',
        'actual_start_time',
        'actual_end_time',
        'actual_attendance_count',
        'completion_remarks',
        'evidence_path',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'missed_date' => 'date',
            'proposed_date' => 'date',
            'required_contact_hours' => 'decimal:2',
            'program_head_reviewed_at' => 'datetime',
            'dean_approved_at' => 'datetime',
            'conducted_at' => 'datetime',
            'actual_attendance_count' => 'integer',
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

    public function roomSchedule(): BelongsTo
    {
        return $this->belongsTo(RoomSchedule::class);
    }

    public function programHeadReviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'program_head_reviewed_by_id');
    }

    public function deanApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dean_approved_by_id');
    }
}
