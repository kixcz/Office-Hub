<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'curriculum_id',
        'program_id',
        'code',
        'title',
        'units',
        'lecture_hours',
        'lab_hours',
        'room_type_required',
        'consecutive_lab_required',
        'year_level',
        'semester_placement',
        'category',
        'specialization_tag',
    ];

    protected function casts(): array
    {
        return [
            'units' => 'decimal:1',
            'lecture_hours' => 'decimal:1',
            'lab_hours' => 'decimal:1',
            'consecutive_lab_required' => 'boolean',
            'year_level' => 'integer',
        ];
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function courseOfferings(): HasMany
    {
        return $this->hasMany(CourseOffering::class);
    }
}
