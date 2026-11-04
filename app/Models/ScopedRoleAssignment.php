<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScopedRoleAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'role_id',
        'institution',
        'scope_level',
        'entity_id',
        'college_id',
        'program_id',
        'facility_id',
        'designation_type',
        'replacing_user_id',
        'effective_from',
        'effective_until',
        'status',
        'notes',
        'assigned_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(College::class, 'entity_id');
    }

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class, 'college_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'facility_id');
    }

    public function replacingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replacing_user_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }
}
