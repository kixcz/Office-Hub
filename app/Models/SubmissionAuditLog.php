<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubmissionAuditLog extends Model
{
    protected $fillable = [
        'submission_id',
        'requirement_id',
        'user_id',
        'actor_name',
        'actor_role',
        'action',
        'title',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
