<?php

namespace App\Models;

use Database\Factories\FacultyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    /** @use HasFactory<FacultyFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'spreadsheet_name',
        'faculty_id',
        'academic_rank',
        'employment_type',
        'status',
        'highest_qualification',
        'specialization',
        'email',
        'phone',
        'office_room',
        'employment_date',
        'profile_picture',
        'program_id',
    ];

    protected $appends = [
        'photo_url',
        'full_name',
        'title_name',
        'employee_id',
    ];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getTitleNameAttribute(): string
    {
        $rank = $this->academic_rank ?? 'Assistant Professor';
        $prefix = str_contains($rank, 'Professor') ? 'Prof.' : 'Instr.';

        return "{$prefix} {$this->first_name} {$this->last_name}";
    }

    public function getEmployeeIdAttribute(): string
    {
        return $this->faculty_id ?: 'CIDS-2026-'.str_pad((string) $this->id, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get the accessible public URL of the faculty profile picture.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->profile_picture) {
            return null;
        }

        if (str_starts_with($this->profile_picture, 'http://') || str_starts_with($this->profile_picture, 'https://')) {
            return $this->profile_picture;
        }

        return asset('storage/'.$this->profile_picture);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function roomSchedules()
    {
        return $this->hasMany(RoomSchedule::class);
    }

    public function facilityMonitorings()
    {
        return $this->hasMany(FacilityMonitoring::class);
    }

    public function attendances()
    {
        return $this->hasMany(FacultyAttendance::class);
    }

    public function attendanceSummaries()
    {
        return $this->hasMany(FacultyAttendanceSummary::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function corrections()
    {
        return $this->hasMany(FacultyCorrection::class);
    }

    public function availabilities()
    {
        return $this->hasMany(FacultyAvailability::class);
    }

    public function tasks()
    {
        return $this->belongsToMany(Task::class, 'faculty_task')->withTimestamps();
    }
}
