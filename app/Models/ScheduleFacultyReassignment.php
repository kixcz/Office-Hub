<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleFacultyReassignment extends Model
{
    protected $fillable = [
        'verified_schedule_id',
        'previous_faculty_id',
        'new_faculty_id',
        'changed_by_user_id',
        'changed_by_role',
        'reassignment_type',
        'effective_date',
        'reason',
        'notified_roles',
        'notified_user_ids',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
            'notified_roles' => 'array',
            'notified_user_ids' => 'array',
        ];
    }

    public function verifiedSchedule(): BelongsTo
    {
        return $this->belongsTo(VerifiedSchedule::class);
    }

    public function previousFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'previous_faculty_id');
    }

    public function newFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'new_faculty_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
