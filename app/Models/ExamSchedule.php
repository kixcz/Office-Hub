<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_period_id',
        'program_id',
        'faculty_id',
        'room_schedule_id',
        'course_code',
        'course_title',
        'section',
        'year_level',
        'exam_type',
        'custom_exam_title',
        'exam_date',
        'start_time',
        'end_time',
        'room_name',
        'modality',
        'proctor_name',
        'is_confirmed',
        'notes',
        'status',
        'conducted_at',
        'confirmed_by_user_id',
        'actual_start_time',
        'actual_end_time',
        'attendance_count',
        'remarks',
        'irregularities_reported',
        'evidence_attachment_path',
        'non_conducted_reason',
        'non_conducted_remarks',
        'rescheduled_target_date',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'rescheduled_target_date' => 'date',
            'is_confirmed' => 'boolean',
            'conducted_at' => 'datetime',
            'attendance_count' => 'integer',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function roomSchedule(): BelongsTo
    {
        return $this->belongsTo(RoomSchedule::class);
    }

    public function confirmedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_user_id');
    }

    /**
     * Check if exam has passed scheduled time and needs confirmation.
     */
    public function shouldBeAwaitingConfirmation(): bool
    {
        if ($this->status !== 'Scheduled') {
            return false;
        }

        $scheduledDateTime = Carbon::parse($this->exam_date->format('Y-m-d').' '.$this->end_time);

        return now()->greaterThan($scheduledDateTime);
    }
}
