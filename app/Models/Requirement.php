<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Requirement extends Model
{
    protected $fillable = [
        'title',
        'description',
        'document_type',
        'category',
        'academic_year',
        'semester',
        'course_section',
        'due_date',
        'open_date',
        'grace_period_days',
        'accepted_format',
        'required_file_types',
        'allow_multiple_files',
        'naming_convention',
        'late_policy',
        'status',
        'health_indicator',
        'applicable_programs',
        'reviewer_id',
        'program_id',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'open_date' => 'datetime',
        'allow_multiple_files' => 'boolean',
        'applicable_programs' => 'array',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
