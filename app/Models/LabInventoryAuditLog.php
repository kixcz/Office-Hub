<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabInventoryAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'user_id',
        'action',
        'previous_state',
        'new_state',
        'justification',
        'ip_address',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'previous_state' => 'array',
            'new_state' => 'array',
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
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
