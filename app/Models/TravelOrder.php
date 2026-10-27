<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TravelOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_number',
        'faculty_id',
        'faculty_name',
        'destination',
        'purpose',
        'start_date',
        'end_date',
        'status',
        'travel_type',
        'with_per_diem',
        'estimated_budget',
        'approver_name',
        'approver_role',
        'approved_at',
        'remarks',
        'ehris_id',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'approved_at' => 'datetime',
            'with_per_diem' => 'boolean',
            'estimated_budget' => 'decimal:2',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
