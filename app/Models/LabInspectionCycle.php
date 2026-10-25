<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabInspectionCycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'cycle_name',
        'created_by',
        'room_id',
        'assigned_inspector_id',
        'start_date',
        'due_date',
        'status',
        'total_expected_items',
        'total_counted_items',
        'discrepancies_count',
        'summary_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            'total_expected_items' => 'integer',
            'total_counted_items' => 'integer',
            'discrepancies_count' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
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
    public function assignedInspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_inspector_id');
    }

    /**
     * @return HasMany<LabInspectionFinding, $this>
     */
    public function findings(): HasMany
    {
        return $this->hasMany(LabInspectionFinding::class, 'inspection_cycle_id');
    }
}
