<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleAdjustmentBatch extends Model
{
    protected $fillable = [
        'adjustment_window_id',
        'batch_number',
        'total_requests_count',
        'accepted_requests_count',
        'affected_faculty_ids',
        'affected_sections',
        'affected_rooms',
        'gemini_consolidation_summary',
        'gemini_competition_warnings',
        'solver_status',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'total_requests_count' => 'integer',
            'accepted_requests_count' => 'integer',
            'affected_faculty_ids' => 'array',
            'affected_sections' => 'array',
            'affected_rooms' => 'array',
            'gemini_competition_warnings' => 'array',
        ];
    }

    public function adjustmentWindow(): BelongsTo
    {
        return $this->belongsTo(ScheduleAdjustmentWindow::class, 'adjustment_window_id');
    }
}
