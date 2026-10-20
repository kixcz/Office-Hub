<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomSessionDisruption extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id',
        'verified_schedule_id',
        'faculty_id',
        'disruption_date',
        'time_slot',
        'scheduled_minutes',
        'room_condition',
        'session_outcome',
        'alternative_room_id',
        'instructional_minutes_delivered',
        'delivered_minutes',
        'make_up_required',
        'observed_by_user_id',
        'resolved_by_user_id',
        'resolved_at',
        'remarks',
        'resolution_status',
    ];

    protected function casts(): array
    {
        return [
            'disruption_date' => 'date',
            'scheduled_minutes' => 'integer',
            'delivered_minutes' => 'integer',
            'instructional_minutes_delivered' => 'boolean',
            'make_up_required' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function alternativeRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'alternative_room_id');
    }

    public function verifiedSchedule(): BelongsTo
    {
        return $this->belongsTo(VerifiedSchedule::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function observer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'observed_by_user_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
