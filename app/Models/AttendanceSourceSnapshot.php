<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceSourceSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_sheet_id',
        'source_tab',
        'source_row_number',
        'row_hash',
        'raw_instructor_name',
        'matched_faculty_id',
        'match_status',
        'raw_date',
        'raw_time_slot',
        'raw_room',
        'raw_status',
        'raw_late_minutes',
        'raw_scheduled_count',
        'raw_present_count',
        'raw_late_count',
        'raw_absent_count',
        'raw_payload',
        'sync_batch_id',
        'has_anomaly',
        'anomaly_reason',
        'synced_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'raw_payload' => 'array',
            'raw_date' => 'date',
            'has_anomaly' => 'boolean',
            'synced_at' => 'datetime',
        ];
    }

    /**
     * Get the faculty associated with this staging record.
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'matched_faculty_id');
    }
}
