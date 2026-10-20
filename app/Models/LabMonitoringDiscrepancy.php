<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class LabMonitoringDiscrepancy extends Model
{
    protected $fillable = [
        'monitoring_session_id',
        'verified_schedule_id',
        'room_id',
        'reported_by_user_id',
        'discrepancy_type',
        'severity',
        'expected_state',
        'observed_state',
        'remarks',
        'evidence_details',
        'photo_path',
        'resolution_status',
        'resolution_notes',
        'resolved_by_user_id',
        'resolved_at',
    ];

    protected $appends = [
        'photo_url',
    ];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? Storage::url($this->photo_path) : null;
    }

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function monitoringSession(): BelongsTo
    {
        return $this->belongsTo(LabMonitoringSession::class, 'monitoring_session_id');
    }

    public function verifiedSchedule(): BelongsTo
    {
        return $this->belongsTo(VerifiedSchedule::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_user_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
