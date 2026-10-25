<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabInventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id',
        'room_name',
        'asset_number',
        'item_name',
        'tracking_type',
        'category',
        'brand_model',
        'serial_number',
        'college',
        'quantity',
        'unit',
        'condition',
        'operational_status',
        'custodian',
        'acquisition_batch',
        'acquisition_date',
        'unit_cost',
        'warranty_info',
        'last_inspected_at',
        'next_inspection_due',
        'specs_details',
        'remarks',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_cost' => 'decimal:2',
            'acquisition_date' => 'date',
            'last_inspected_at' => 'date',
            'next_inspection_due' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    /**
     * @return HasMany<LabInventoryAdjustment, $this>
     */
    public function adjustments(): HasMany
    {
        return $this->hasMany(LabInventoryAdjustment::class, 'item_id');
    }

    /**
     * @return HasMany<LabMaintenanceTicket, $this>
     */
    public function maintenanceTickets(): HasMany
    {
        return $this->hasMany(LabMaintenanceTicket::class, 'item_id');
    }

    /**
     * @return HasMany<LabInspectionFinding, $this>
     */
    public function inspectionFindings(): HasMany
    {
        return $this->hasMany(LabInspectionFinding::class, 'item_id');
    }

    /**
     * @return HasMany<LabInventoryAuditLog, $this>
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(LabInventoryAuditLog::class, 'item_id');
    }
}
