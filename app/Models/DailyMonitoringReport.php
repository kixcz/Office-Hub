<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyMonitoringReport extends Model
{
    protected $fillable = [
        'report_date',
        'user_id',
        'shift_name',
        'covered_room_ids',
        'academic_period_name',
        'schedule_version',
        'expected_sessions_count',
        'monitored_sessions_count',
        'completeness_rate',
        'discrepancies_count',
        'unmonitored_count',
        'summary_matrix',
        'sessions_matrix',
        'utilization_matrix',
        'exceptions_matrix',
        'reconciliation_checklist',
        'status',
        'has_exceptions',
        'submission_notes',
        'review_remarks',
        'submitted_at',
        'submitted_by_user_id',
        'reviewed_at',
        'reviewed_by_user_id',
        'finalized_at',
        'finalized_by_user_id',
        'correction_history',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'covered_room_ids' => 'array',
            'summary_matrix' => 'array',
            'sessions_matrix' => 'array',
            'utilization_matrix' => 'array',
            'exceptions_matrix' => 'array',
            'reconciliation_checklist' => 'array',
            'correction_history' => 'array',
            'has_exceptions' => 'boolean',
            'completeness_rate' => 'float',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'finalized_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by_user_id');
    }
}
