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
        'description',
        'units',
        'lecture_hours',
        'lab_hours',
        'room_type_required',
        'required_facility_type',
        'required_equipment',
        'consecutive_lab_required',
        'can_split_lab_hours',
        'preferred_block_length',
        'year_level',
        'semester_placement',
        'category',
        'prerequisites',
        'corequisites',
        'specialization_tag',
        'status',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'units' => 'decimal:1',
            'lecture_hours' => 'decimal:1',
            'lab_hours' => 'decimal:1',
            'preferred_block_length' => 'decimal:1',
            'consecutive_lab_required' => 'boolean',
            'can_split_lab_hours' => 'boolean',
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

    public function curriculumCourses(): HasMany
    {
        return $this->hasMany(CurriculumCourse::class);
    }

    public function courseOfferings(): HasMany
    {
        return $this->hasMany(CourseOffering::class);
    }
}
