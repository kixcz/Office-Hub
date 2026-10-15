<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    //
    protected $fillable = [
        'title',
        'description',
        'priority',
        'task_type',
        'category',
        'status',
        'progress',
        'comments_count',
        'subtasks_completed',
        'subtasks_total',
        'attachments_count',
        'due_date',
        'creator_id',
        'assigned_to',
        'assignee_initials',
        'extra_assignees_count',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'progress' => 'integer',
            'comments_count' => 'integer',
            'subtasks_completed' => 'integer',
            'subtasks_total' => 'integer',
            'attachments_count' => 'integer',
            'extra_assignees_count' => 'integer',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function faculties()
    {
        return $this->belongsToMany(Faculty::class, 'faculty_task')->withTimestamps();
    }
}
