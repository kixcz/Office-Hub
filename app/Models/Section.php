<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    protected $fillable = [
        'academic_period_id',
        'program_id',
        'curriculum_id',
        'adviser_id',
        'code',
        'year_level',
        'population',
        'actual_count',
        'status',
        'effective_from',
        'effective_until',
        'remarks',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'year_level' => 'integer',
            'population' => 'integer',
            'actual_count' => 'integer',
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'adviser_id');
    }

    public function getNameAttribute(): string
    {
        return $this->code ?? '';
    }

    public function courseOfferings(): HasMany
    {
        return $this->hasMany(CourseOffering::class);
    }

    public function roomSchedules(): HasMany
    {
        return $this->hasMany(RoomSchedule::class, 'section', 'code');
    }

    public function examSchedules(): HasMany
    {
        return $this->hasMany(ExamSchedule::class, 'section', 'code');
    }
}
