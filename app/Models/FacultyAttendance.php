<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class FacultyAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'room_schedule_id',
        'verified_schedule_id',
        'instructor_name',
        'session_date',
        'day_of_week',
        'time_slot',
        'scheduled_start_time',
        'scheduled_end_time',
        'scheduled_duration_minutes',
        'actual_arrival_time',
        'delivered_minutes',
        'section',
        'subject',
        'room',
        'week_label',
        'status',
        'primary_status',
        'attendance_status',
        'exception_type',
        'exception_reference',
        'exception_overlap_minutes',
        'observed_outcome',
        'observed_modality',
        'late_minutes',
        'make_up_required',
        'makeup_required_minutes',
        'makeup_completed_minutes',
        'make_up_request_id',
        'verification_status',
        'verification_source',
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
            'scheduled_duration_minutes' => 'integer',
            'delivered_minutes' => 'integer',
            'exception_overlap_minutes' => 'integer',
            'makeup_required_minutes' => 'integer',
            'makeup_completed_minutes' => 'integer',
            'make_up_required' => 'boolean',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function roomSchedule(): BelongsTo
    {
        return $this->belongsTo(RoomSchedule::class);
    }

    public function makeUpRequest(): BelongsTo
    {
        return $this->belongsTo(MakeUpClassRequest::class, 'make_up_request_id');
    }

    protected static ?Collection $cachedRoomSchedules = null;

    /**
     * Preload RoomSchedules into memory to prevent N+1 queries during bulk session serialization.
     */
    public static function getCachedRoomSchedules(): Collection
    {
        if (static::$cachedRoomSchedules === null) {
            static::$cachedRoomSchedules = RoomSchedule::all();
        }

        return static::$cachedRoomSchedules;
    }

    public static function flushScheduleCache(): void
    {
        static::$cachedRoomSchedules = null;
    }

    /**
     * Resolve matching RoomSchedule for this session using in-memory lookup (zero N+1 queries).
     */
    public function resolveSchedule(): ?RoomSchedule
    {
        if ($this->relationLoaded('roomSchedule') && $this->getRelation('roomSchedule')) {
            return $this->getRelation('roomSchedule');
        }

        $schedules = static::getCachedRoomSchedules();
        if ($schedules->isEmpty()) {
            return null;
        }

        $parts = explode('-', (string) ($this->time_slot ?? ''));
        $startRaw = trim($parts[0] ?? '');
        $startFormatted = $startRaw ? date('H:i', strtotime($startRaw)) : '';
        $instructorLower = strtolower(trim((string) $this->instructor_name));

        $schedule = $schedules->first(function (RoomSchedule $rs) use ($startFormatted, $instructorLower): bool {
            if ($this->faculty_id) {
                if ((int) $rs->faculty_id !== (int) $this->faculty_id) {
                    return false;
                }
            } elseif ($instructorLower !== '') {
                if (! str_contains(strtolower((string) $rs->instructor), $instructorLower)) {
                    return false;
                }
            }

            if ($this->day_of_week && strcasecmp((string) $rs->day_of_week, (string) $this->day_of_week) !== 0) {
                return false;
            }

            if ($startFormatted !== '' && ! str_starts_with((string) $rs->start_time, $startFormatted)) {
                return false;
            }

            return true;
        });

        // Fallback: match by faculty and day of week
        if (! $schedule && $this->faculty_id && $this->day_of_week) {
            $schedule = $schedules->first(function (RoomSchedule $rs): bool {
                return (int) $rs->faculty_id === (int) $this->faculty_id
                    && strcasecmp((string) $rs->day_of_week, (string) $this->day_of_week) === 0;
            });
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
