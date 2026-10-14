<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_name',
        'building',
        'floor',
        'type',
        'capacity',
        'status',
        'equipment_details',
        'notes',
    ];

    /**
     * @return HasMany<RoomComplaint, $this>
     */
    public function complaints(): HasMany
    {
        return $this->hasMany(RoomComplaint::class, 'room_id');
    }
}
