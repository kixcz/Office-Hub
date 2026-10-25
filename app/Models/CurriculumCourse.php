<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CurriculumCourse extends Model
{
    protected $table = 'curriculum_courses';

    protected $fillable = [
        'curriculum_id',
        'course_id',
        'year_level',
        'semester_placement',
        'requirement_type',
        'prerequisite_override',
        'corequisite_override',
        'sequence_order',
    ];

    protected function casts(): array
    {
        return [
            'year_level' => 'integer',
            'sequence_order' => 'integer',
        ];
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
