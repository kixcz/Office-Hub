<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabInChargeAssignmentAudit extends Model
{
    protected $fillable = [
        'assignment_id',
        'room_id',
        'previous_user_id',
        'new_user_id',
        'action_type',
        'role_type',
        'reason',
        'details',
        'performed_by_user_id',
        'effective_at',
    ];

    protected function casts(): array
    {
        return [
            'effective_at' => 'datetime',
            'details' => 'array',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(LabInChargeAssignment::class, 'assignment_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function previousUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'previous_user_id');
    }

    public function newUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'new_user_id');
    }

    public function performedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }
}
