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
        'attendance_rate',
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
            'attendance_rate' => 'float',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
