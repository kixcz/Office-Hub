<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabInspectionFinding extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_cycle_id',
        'item_id',
        'expected_quantity',
        'actual_counted_quantity',
        'expected_condition',
        'actual_condition',
        'finding_status',
        'inspector_notes',
        'inspected_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expected_quantity' => 'integer',
            'actual_counted_quantity' => 'integer',
            'inspected_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<LabInspectionCycle, $this>
     */
    public function cycle(): BelongsTo
    {
        return $this->belongsTo(LabInspectionCycle::class, 'inspection_cycle_id');
    }

    /**
     * @return BelongsTo<LabInventoryItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(LabInventoryItem::class, 'item_id');
    }
}
