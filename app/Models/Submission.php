<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'requirement_id',
        'faculty_id',
        'status',
        'file_path',
        'submitted_at',
        'reviewer_comments',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function getIsLateAttribute()
    {
        if (!$this->submitted_at) {
            return now()->greaterThan($this->requirement->due_date);
        }
        return clone $this->submitted_at->greaterThan($this->requirement->due_date);
    }
}
