<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleAdjustmentWindow extends Model
{
    protected $fillable = [
        'academic_period_id',
        'base_published_version_id',
        'title',
        'opens_at',
        'closes_at',
        'allow_subject_swaps',
        'allow_section_swaps',
        'allow_time_swaps',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'opens_at' => 'datetime',
            'closes_at' => 'datetime',
            'allow_subject_swaps' => 'boolean',
            'allow_section_swaps' => 'boolean',
            'allow_time_swaps' => 'boolean',
        ];
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function basePublishedVersion(): BelongsTo
    {
        return $this->belongsTo(ScheduleVersion::class, 'base_published_version_id');
    }

    public function swapRequests(): HasMany
    {
        return $this->hasMany(ScheduleSwapRequest::class, 'adjustment_window_id');
    }

    public function adjustmentBatches(): HasMany
    {
        return $this->hasMany(ScheduleAdjustmentBatch::class, 'adjustment_window_id');
    }
}
