<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchEngagement extends Model
{
    protected $fillable = [
        'user_id',
        'faculty_id',
        'title',
        'program',
        'role',
        'duration',
        'status',
        'description',
        'progress',
        'current_milestone',
        'milestone_progress',
        'milestone_due_date',
        'collaborators_count',
        'publications_summary',
        'next_action',
        'academic_period',
    ];

    protected function casts(): array
    {
        return [
            'milestone_due_date' => 'date',
            'progress' => 'integer',
            'milestone_progress' => 'integer',
            'collaborators_count' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }
}
