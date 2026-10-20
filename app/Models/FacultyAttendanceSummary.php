<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyAttendanceSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'instructor_name',
        'period_type',
        'period_label',
        'present_count',
        'absent_count',
        'late_count',
        'online_count',
        'others_count',
        'on_leave_count',
        'sub_insert_count',
        'total_late_minutes',
        'scheduled_sessions',
        'scheduled_minutes',
        'excluded_minutes',
        'eligible_minutes',
        'attended_minutes',
        'approved_leave_minutes',
        'unexcused_absent_minutes',
        'late_sessions_count',
        'make_up_required_minutes',
        'make_up_completed_minutes',
        'total_scheduled_hours',
        'eligible_scheduled_hours',
        'attended_hours',
        'approved_leave_hours',
        'unexcused_absent_hours',
        'make_up_required_hours',
        'make_up_completed_hours',
        'attendance_rate',
        'attendance_coverage_rate',
        'on_time_rate',
        'make_up_completion_rate',
        'instructional_completion_rate',
        'is_rank_eligible',
        'academic_year',
        'semester',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'present_count' => 'integer',
            'absent_count' => 'integer',
            'late_count' => 'integer',
            'online_count' => 'integer',
            'others_count' => 'integer',
            'on_leave_count' => 'integer',
            'sub_insert_count' => 'integer',
            'total_late_minutes' => 'integer',
            'scheduled_sessions' => 'integer',
            'scheduled_minutes' => 'integer',
            'excluded_minutes' => 'integer',
            'eligible_minutes' => 'integer',
            'attended_minutes' => 'integer',
            'approved_leave_minutes' => 'integer',
            'unexcused_absent_minutes' => 'integer',
            'late_sessions_count' => 'integer',
            'make_up_required_minutes' => 'integer',
            'make_up_completed_minutes' => 'integer',
            'total_scheduled_hours' => 'float',
            'eligible_scheduled_hours' => 'float',
            'attended_hours' => 'float',
            'approved_leave_hours' => 'float',
            'unexcused_absent_hours' => 'float',
            'make_up_required_hours' => 'float',
            'make_up_completed_hours' => 'float',
            'attendance_rate' => 'float',
            'attendance_coverage_rate' => 'float',
            'on_time_rate' => 'float',
            'make_up_completion_rate' => 'float',
            'instructional_completion_rate' => 'float',
            'is_rank_eligible' => 'boolean',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
