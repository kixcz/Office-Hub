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
        'section',
        'subject',
        'room',
        'week_label',
        'status',
        'late_minutes',
        'remarks',
        'substitute_faculty',
        'academic_year',
        'semester',
        'source',
    ];

    protected $appends = [
        'subject',
        'room',
        'section',
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

    /**
     * Resolve matching RoomSchedule for this session.
     */
    public function resolveSchedule(): ?RoomSchedule
    {
        $parts = explode('-', $this->time_slot);
        $startRaw = trim($parts[0] ?? '');
        $startFormatted = $startRaw ? date('H:i', strtotime($startRaw)) : '';

        $query = RoomSchedule::query();

        if ($this->faculty_id) {
            $query->where('faculty_id', $this->faculty_id);
        } elseif ($this->instructor_name) {
            $query->where('instructor', 'like', "%{$this->instructor_name}%");
        }

        if ($this->day_of_week) {
            $query->where('day_of_week', $this->day_of_week);
        }

        if ($startFormatted) {
            $query->where('start_time', 'like', $startFormatted.'%');
        }

        $schedule = $query->first();

        // Fallback: match by faculty and day of week
        if (! $schedule && $this->faculty_id && $this->day_of_week) {
            $schedule = RoomSchedule::where('faculty_id', $this->faculty_id)
                ->where('day_of_week', $this->day_of_week)
                ->first();
        }

        return $schedule;
    }

    public function getSubjectAttribute($value): ?string
    {
        if (! empty($value)) {
            return $value;
        }

        $schedule = $this->resolveSchedule();

        return $schedule ? "{$schedule->course_code} - {$schedule->course_title}" : null;
    }

    public function getRoomAttribute($value): ?string
    {
        if (! empty($value)) {
            return $value;
        }

        $schedule = $this->resolveSchedule();

        return $schedule ? $schedule->room_name : 'CLR-1';
    }

    public function getSectionAttribute($value): ?string
    {
        if (! empty($value)) {
            return $value;
        }

        $schedule = $this->resolveSchedule();

        return $schedule ? $schedule->section : null;
    }
}
