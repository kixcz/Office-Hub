<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'college_id',
        'room_code',
        'room_name',
        'building',
        'floor',
        'type',
        'custom_type',
        'capacity',
        'is_shared',
        'status',
        'condition',
        'operational_status',
        'setup_readiness',
        'operating_hours',
        'supported_activities',
        'capabilities',
        'availability_rules',
        'effective_from',
        'effective_until',
        'is_accessible',
        'equipment_details',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'supported_activities' => 'array',
            'capabilities' => 'array',
            'availability_rules' => 'array',
            'effective_from' => 'date',
            'effective_until' => 'date',
            'is_accessible' => 'boolean',
            'is_shared' => 'boolean',
            'capacity' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<College, $this>
     */
    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class, 'college_id');
    }

    /**
     * @return HasMany<RoomComplaint, $this>
     */
    public function complaints(): HasMany
    {
        return $this->hasMany(RoomComplaint::class, 'room_id');
    }

    /**
     * @return HasMany<LabInventoryItem, $this>
     */
    public function inventoryItems(): HasMany
    {
        return $this->hasMany(LabInventoryItem::class, 'room_id');
    }

    /**
     * @return HasMany<LabMaintenanceTicket, $this>
     */
    public function maintenanceTickets(): HasMany
    {
        return $this->hasMany(LabMaintenanceTicket::class, 'room_id');
    }
}
