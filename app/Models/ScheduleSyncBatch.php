<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleSyncBatch extends Model
{
    protected $fillable = [
        'academic_period_id',
        'batch_number',
        'source_name',
        'sheet_url',
        'sheet_tab',
        'raw_rows_count',
        'auto_matched_count',
        'needs_review_count',
        'verified_count',
        'status',
        'created_by_user_id',
    ];

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class);
    }

    public function stagingRecords(): HasMany
    {
        return $this->hasMany(ScheduleStagingRecord::class, 'sync_batch_id');
    }

    public function verifiedSchedules(): HasMany
    {
        return $this->hasMany(VerifiedSchedule::class, 'sync_batch_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
