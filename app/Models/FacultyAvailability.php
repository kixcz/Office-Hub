<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'academic_year',
        'semester',
        'day_of_week',
        'preferred_start_time',
        'preferred_end_time',
        'status',
        'notes',
    ];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
