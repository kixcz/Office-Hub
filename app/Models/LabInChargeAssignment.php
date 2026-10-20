<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabInChargeAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'room_id',
        'academic_period_id',
        'shift_name',
        'role_type',
        'assigned_days',
        'effective_from',
        'effective_until',
        'shift_start_time',
        'shift_end_time',
        'is_active',
        'status',
        'reliever_user_id',
        'notes',
        'assigned_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function relieverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reliever_user_id');
    }

    public function assignedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function audits()
    {
        return $this->hasMany(LabInChargeAssignmentAudit::class, 'assignment_id');
    }
}
