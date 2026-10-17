<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CustomContentSlide extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'badge',
        'layout',
        'theme',
        'header_alignment',
        'content_blocks',
        'primary_image_path',
        'primary_image_fit',
        'qr_url',
        'qr_label',
        'duration_seconds',
        'playlist',
        'target_display_id',
        'priority',
        'fullscreen_takeover',
        'start_at',
        'end_at',
        'auto_expire',
        'status',
        'created_by',
        'updated_by',
        'published_at',
    ];

    protected $casts = [
        'content_blocks' => 'array',
        'fullscreen_takeover' => 'boolean',
        'auto_expire' => 'boolean',
        'duration_seconds' => 'integer',
        'priority' => 'integer',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    protected $appends = [
        'is_currently_active',
        'primary_image_url',
        'effective_status',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getPrimaryImageUrlAttribute(): ?string
    {
        if (! $this->primary_image_path) {
            return null;
        }

        if (str_starts_with($this->primary_image_path, 'http://') || str_starts_with($this->primary_image_path, 'https://')) {
            return $this->primary_image_path;
        }

        return Storage::url($this->primary_image_path);
    }

    /**
     * Compute effective status considering schedule & auto-expire
     */
    public function getEffectiveStatusAttribute(): string
    {
        if ($this->status === 'archived') {
            return 'archived';
        }

        if ($this->status === 'draft') {
            return 'draft';
        }

        $now = Carbon::now();

        if ($this->end_at && $this->auto_expire && $now->greaterThan($this->end_at)) {
            return 'expired';
        }

        if ($this->start_at && $now->lessThan($this->start_at)) {
            return 'scheduled';
        }

        return $this->status ?: 'published';
    }

    public function getIsCurrentlyActiveAttribute(): bool
    {
        if ($this->status !== 'published') {
            return false;
        }

        $now = Carbon::now();

        if ($this->start_at && $now->lessThan($this->start_at)) {
            return false;
        }

        if ($this->end_at && $this->auto_expire && $now->greaterThan($this->end_at)) {
            return false;
        }

        return true;
    }

    /**
     * Scope query to only slides active at a given timestamp
     */
    public function scopeActiveAt(Builder $query, ?Carbon $date = null): Builder
    {
        $checkDate = $date ?? Carbon::now();

        return $query->where('status', 'published')
            ->where(function (Builder $q) use ($checkDate) {
                $q->whereNull('start_at')
                    ->orWhere('start_at', '<=', $checkDate);
            })
            ->where(function (Builder $q) use ($checkDate) {
                $q->whereNull('end_at')
                    ->orWhere('auto_expire', false)
                    ->orWhere('end_at', '>=', $checkDate);
            });
    }
}
