<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleSwapRequest extends Model
{
    protected $fillable = [
        'adjustment_window_id',
        'requester_faculty_id',
        'counterpart_faculty_id',
        'requester_offering_id',
        'counterpart_offering_id',
        'swap_type',
        'proposed_day',
        'proposed_start_time',
        'proposed_end_time',
        'proposed_room',
        'reason',
        'counterpart_consent',
        'counterpart_responded_at',
        'pre_validation_passed',
        'pre_validation_notes',
        'deep_validation_passed',
        'deep_validation_notes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'counterpart_responded_at' => 'datetime',
            'pre_validation_passed' => 'boolean',
            'deep_validation_passed' => 'boolean',
        ];
    }

    public function adjustmentWindow(): BelongsTo
    {
        return $this->belongsTo(ScheduleAdjustmentWindow::class, 'adjustment_window_id');
    }

    public function requesterFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'requester_faculty_id');
    }

    public function counterpartFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'counterpart_faculty_id');
    }

    public function requesterOffering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class, 'requester_offering_id');
    }

    public function counterpartOffering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class, 'counterpart_offering_id');
    }
}
