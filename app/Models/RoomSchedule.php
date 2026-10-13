<?php

namespace App\Models;

use Database\Factories\RoomScheduleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomSchedule extends Model
{
    /** @use HasFactory<RoomScheduleFactory> */
    use HasFactory;

    protected $fillable = [
        'room_name',
        'day_of_week',
        'start_time',
        'end_time',
        'course_code',
        'course_title',
        'instructor',
        'faculty_id',
        'section',
        'raw_text',
    ];

    protected $appends = [
        'display_instructor',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function getDisplayInstructorAttribute(): string
    {
        if ($this->faculty) {
            return $this->faculty->title_name ?? $this->faculty->full_name;
        }

        return $this->instructor ?: 'TBA';
    }
}
