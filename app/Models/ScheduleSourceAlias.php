<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleSourceAlias extends Model
{
    protected $fillable = [
        'entity_type',
        'raw_alias_text',
        'normalized_alias_text',
        'canonical_id',
        'canonical_label',
        'confidence_boost',
        'is_active',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'confidence_boost' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
