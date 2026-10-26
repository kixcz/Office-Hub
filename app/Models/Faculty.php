<?php

namespace App\Models;

use Database\Factories\FacultyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

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
        'employment_start_date',
        'employment_end_date',
        'teaching_assignment_effective_from',
        'teaching_assignment_effective_until',
        'appointment_status',
        'birth_date',
        'profile_picture',
        'bio',
        'quote',
        'program_id',
    ];

    protected function casts(): array
    {
        return [
            'employment_date' => 'date',
            'employment_start_date' => 'date',
            'employment_end_date' => 'date',
            'teaching_assignment_effective_from' => 'date',
            'teaching_assignment_effective_until' => 'date',
            'birth_date' => 'date',
        ];
    }

    protected $appends = [
        'photo_url',
        'full_name',
        'title_name',
        'employee_id',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::saved(function (Faculty $faculty): void {
            $faculty->syncUserAccount();
        });
    }

    /**
     * Automatically ensure a User account exists for this faculty member if they have an email.
     */
    public function syncUserAccount(): ?User
    {
        $email = trim($this->email ?? '');
        if (empty($email)) {
            return null;
        }

        $fullName = trim("{$this->first_name} {$this->last_name}");
        $user = User::where('email', $email)->first();

        if (! $user) {
            $user = User::create([
                'name' => $fullName ?: 'Faculty Member',
                'email' => $email,
                'password' => Hash::make('password'),
            ]);
        } else {
            // Update user name if blank or changed
            if ($fullName && $user->name !== $fullName) {
                $user->name = $fullName;
                $user->save();
            }
        }

        // Assign Faculty Member role
        $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);
        if ($facultyRole && ! $user->roles()->where('role_id', $facultyRole->id)->exists()) {
            $user->roles()->attach($facultyRole->id);
        }

        // Link faculty to user without triggering recursion
        if ($this->user_id !== $user->id) {
            $this->newQuery()->where('id', $this->id)->update(['user_id' => $user->id]);
            $this->user_id = $user->id;
        }

        return $user;
    }

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

        // Return root-relative URL to prevent mixed content blocking (http vs https)
        return '/storage/'.ltrim($this->profile_picture, '/');
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

    public function spotlightSlides()
    {
        return $this->hasMany(SpotlightSlide::class);
    }

    public function credits()
    {
        return $this->hasMany(FacultyCredit::class);
    }

    public function facultyCredits()
    {
        return $this->hasMany(FacultyCredit::class);
    }

    public function workloads()
    {
        return $this->hasMany(FacultyWorkload::class);
    }

    public function teachingAssignments()
    {
        return $this->hasMany(FacultyTeachingAssignment::class);
    }

    public function approvedLeaves()
    {
        return $this->hasMany(FacultyApprovedLeave::class);
    }
}
