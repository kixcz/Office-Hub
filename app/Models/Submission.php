<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'requirement_id',
        'faculty_id',
        'status',
        'submission_state',
        'file_path',
        'files_count',
        'submitted_at',
        'days_late',
        'days_overdue',
        'days_early',
        'reviewer_status',
        'remarks',
        'excuse_reason',
        'reviewer_comments',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'days_late' => 'integer',
        'days_overdue' => 'integer',
        'days_early' => 'integer',
        'files_count' => 'integer',
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
        if (! $this->submitted_at) {
            return now()->greaterThan($this->requirement->due_date);
        }

        return clone $this->submitted_at->greaterThan($this->requirement->due_date);
    }
}
