<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleReviewFlag extends Model
{
    protected $fillable = [
        'schedule_version_id',
        'user_id',
        'program_id',
        'reviewer_role',
        'target_entity_type',
        'target_entity_id',
        'category',
        'severity',
        'comment',
        'suggested_correction',
        'status',
        'llm_structured_constraint',
        'is_confirmed_by_admin',
    ];

    protected function casts(): array
    {
        return [
            'llm_structured_constraint' => 'array',
            'is_confirmed_by_admin' => 'boolean',
        ];
    }

    public function scheduleVersion(): BelongsTo
    {
        return $this->belongsTo(ScheduleVersion::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
