<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'requirement_id',
        'user_id',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }}
