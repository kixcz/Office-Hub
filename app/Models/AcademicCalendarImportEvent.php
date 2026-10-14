<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicCalendarImportEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'title',
        'description',
        'category',
        'semester',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'source_text',
        'confidence_score',
        'ai_reasoning',
        'validation_status',
        'validation_notes',
        'proposed_scheduling_effect',
        'confirmed_scheduling_effect',
        'status',
        'is_manually_corrected',
        'approved_by',
        'approved_at',
        'destination_type',
        'destination_id',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'confidence_score' => 'float',
            'is_manually_corrected' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(AcademicCalendarImportBatch::class, 'batch_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
