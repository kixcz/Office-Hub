<?php

namespace App\Models;

use Database\Factories\SpotlightSlideFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpotlightSlide extends Model
{
    /** @use HasFactory<SpotlightSlideFactory> */
    use HasFactory;

    protected $fillable = [
        'type',
        'faculty_id',
        'honoree_name',
        'honoree_title',
        'program_or_department',
        'photo_path',
        'headline',
        'message',
        'event_title',
        'awarding_organization',
        'event_date',
        'template',
        'background_style',
        'accent_style',
        'headline_alignment',
        'text_size',
        'display_duration',
        'transition',
        'layout_mode',
        'fullscreen_takeover',
        'playlist',
        'priority',
        'start_at',
        'end_at',
        'status',
        'evidence_path',
        'evidence_name',
        'created_by',
    ];

    protected $appends = [
        'is_currently_active',
        'effective_honoree_name',
        'effective_photo_url',
    ];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActiveAt($query, $timestamp = null)
    {
        $time = $timestamp ?: now();

        return $query->where('status', 'published')
            ->where(function ($q) use ($time) {
                $q->whereNull('start_at')->orWhere('start_at', '<=', $time);
            })
            ->where(function ($q) use ($time) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', $time);
            });
    }

    public function getIsCurrentlyActiveAttribute(): bool
    {
        if ($this->status !== 'published') {
            return false;
        }

        $now = now();
        if ($this->start_at && $now->lt($this->start_at)) {
            return false;
        }
        if ($this->end_at && $now->gt($this->end_at)) {
            return false;
        }

        return true;
    }

    public function getEffectiveHonoreeNameAttribute(): string
    {
        if ($this->faculty) {
            return $this->faculty->full_name;
        }

        return $this->honoree_name ?: 'Distinguished Honoree';
    }

    public function getEffectivePhotoUrlAttribute(): ?string
    {
        if ($this->photo_path) {
            if (str_starts_with($this->photo_path, 'http://') || str_starts_with($this->photo_path, 'https://') || str_starts_with($this->photo_path, '/')) {
                return $this->photo_path;
            }

            return asset('storage/'.$this->photo_path);
        }

        if ($this->faculty && $this->faculty->photo_url) {
            return $this->faculty->photo_url;
        }

        return null;
    }

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'fullscreen_takeover' => 'boolean',
            'display_duration' => 'integer',
            'priority' => 'integer',
        ];
    }
}
