<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScopedRoleAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'role_id',
        'institution',
        'college_id',
        'program_id',
        'facility_id',
        'effective_from',
        'effective_until',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function college()
    {
        return $this->belongsTo(College::class);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }
}
