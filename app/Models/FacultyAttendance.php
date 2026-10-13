<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'instructor_name',
        'session_date',
        'day_of_week',
        'time_slot',
        'week_label',
        'status',
        'late_minutes',
        'remarks',
        'substitute_faculty',
        'academic_year',
        'semester',
        'source',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'late_minutes' => 'integer',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
