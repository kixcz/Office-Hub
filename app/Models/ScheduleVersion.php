<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleVersion extends Model
{
    protected $fillable = [
        'academic_period_id',
        'candidate_id',
        'version_tag',
        'stage',
        'is_official_master',
        'approved_by_user_id',
        'approved_at',
        'published_at',
        'change_summary',
        'metrics_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'is_official_master' => 'boolean',
            'approved_at' => 'datetime',
            'published_at' => 'datetime',
            'metrics_snapshot' => 'array',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(ScheduleCandidate::class, 'candidate_id');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function reviewFlags(): HasMany
    {
        return $this->hasMany(ScheduleReviewFlag::class);
    }

    public function roomSchedules(): HasMany
    {
        return $this->hasMany(RoomSchedule::class);
    }
}
