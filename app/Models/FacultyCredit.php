<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyCredit extends Model
{
    protected $fillable = [
        'faculty_id',
        'academic_period_id',
        'category',
        'credited_units',
        'reference_memo',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'credited_units' => 'decimal:1',
        ];
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }
}
