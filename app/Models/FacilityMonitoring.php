<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacilityMonitoring extends Model
{
    protected $fillable = [
        'room_name',
        'room_type',
        'current_class',
        'program',
        'instructor',
        'faculty_id',
        'start_time',
        'end_time',
        'status',
        'remarks',
        'next_schedule',
    ];

    protected $appends = [
        'display_instructor',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function getDisplayInstructorAttribute(): ?string
    {
        if ($this->faculty) {
            return $this->faculty->title_name ?? $this->faculty->full_name;
        }

        return $this->instructor;
    }
}
