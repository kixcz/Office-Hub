<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseAssignmentRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_period_id',
        'college_id',
        'program_id',
        'course_code',
        'course_title',
        'section',
        'designated_faculty_id',
        'rule_type',
        'is_locked',
        'justification',
        'status',
        'proposed_by',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'is_locked' => 'boolean',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function designatedFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'designated_faculty_id');
    }

    public function proposer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proposed_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
