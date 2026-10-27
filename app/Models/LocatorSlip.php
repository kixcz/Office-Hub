<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocatorSlip extends Model
{
    use HasFactory;

    protected $fillable = [
        'slip_number',
        'faculty_id',
        'faculty_name',
        'destination',
        'purpose',
        'date',
        'time_out',
        'time_in',
        'actual_time_out',
        'actual_time_in',
        'slip_type',
        'status',
        'approver_name',
        'guard_on_duty',
        'guard_remarks',
        'remarks',
        'ehris_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
