<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Requirement extends Model
{
    protected $fillable = [
        'title',
        'description',
        'document_type',
        'academic_year',
        'semester',
        'course_section',
        'due_date',
        'accepted_format',
        'reviewer_id',
        'user_id',
    ];

    protected $casts = [
        'due_date' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }}
