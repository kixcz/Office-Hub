<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabInventoryAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'requested_by',
        'reviewed_by',
        'type',
        'previous_quantity',
        'new_quantity',
        'previous_condition',
        'new_condition',
        'reason',
        'reviewer_notes',
        'status',
        'reviewed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'previous_quantity' => 'integer',
            'new_quantity' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<LabInventoryItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(LabInventoryItem::class, 'item_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
