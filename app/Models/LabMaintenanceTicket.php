<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabMaintenanceTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'room_id',
        'reported_by',
        'ticket_number',
        'title',
        'reported_problem',
        'severity',
        'assigned_technician',
        'repair_status',
        'cost',
        'start_date',
        'completion_date',
        'resolution_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cost' => 'decimal:2',
            'start_date' => 'date',
            'completion_date' => 'date',
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
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
