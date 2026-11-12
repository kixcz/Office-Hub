<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacultyLoadingPublication extends Model
{
    protected $fillable = [
        'academic_period_id',
        'college_id',
        'version',
        'title',
        'status',
        'review_window_opens_at',
        'review_window_closes_at',
        'published_by_id',
        'published_at',
        'locked_by_id',
        'locked_at',
        'lock_notes',
    ];

    protected function casts(): array
    {
        return [
            'review_window_opens_at' => 'datetime',
            'review_window_closes_at' => 'datetime',
            'published_at' => 'datetime',
            'locked_at' => 'datetime',
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

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by_id');
    }

    public function lockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by_id');
    }

    public function courseChangeRequests(): HasMany
    {
        return $this->hasMany(FacultyCourseChangeRequest::class, 'publication_id');
    }

    public function isLocked(): bool
    {
        return $this->status === 'Locked for Scheduling';
    }
}

