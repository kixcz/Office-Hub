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
        'subject_type', // individual, multiple, team, program, group_photo
        'faculty_id',
        'honoree_name',
        'honoree_title',
        'program_or_department',
        'honorees', // json list of honorees
        'photo_path',
        'group_photo_path',
        'group_photo_fit',
        'group_photo_focal',
        'group_photo_overlay',
        'collage_style',
        'collage_photos',
        'supporting_media', // json list of supporting context media
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
        'animation_effect',
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
        'effective_group_photo_url',
        'effective_honorees_list',
        'effective_collage_photos',
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
        if ($this->subject_type === 'multiple' && ! empty($this->honorees) && is_array($this->honorees)) {
            $names = array_filter(array_column($this->honorees, 'name'));
            if (count($names) > 0) {
                return implode(', ', $names);
            }
        }

        if ($this->subject_type === 'team' || $this->subject_type === 'program' || $this->subject_type === 'group_photo') {
            if ($this->honoree_name) {
                return $this->honoree_name;
            }
            if ($this->program_or_department) {
                return $this->program_or_department;
            }
        }

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

    public function getEffectiveGroupPhotoUrlAttribute(): ?string
    {
        if ($this->group_photo_path) {
            if (str_starts_with($this->group_photo_path, 'http://') || str_starts_with($this->group_photo_path, 'https://') || str_starts_with($this->group_photo_path, '/')) {
                return $this->group_photo_path;
            }

            return asset('storage/'.$this->group_photo_path);
        }

        return null;
    }

    public function getEffectiveHonoreesListAttribute(): array
    {
        if (! empty($this->honorees) && is_array($this->honorees)) {
            return array_map(function ($h) {
                $photo = $h['photo_url'] ?? null;
                if ($photo && ! str_starts_with($photo, 'http://') && ! str_starts_with($photo, 'https://') && ! str_starts_with($photo, '/')) {
                    $photo = asset('storage/'.$photo);
                }

                return [
                    'faculty_id' => $h['faculty_id'] ?? null,
                    'name' => $h['name'] ?? 'Honoree',
                    'title' => $h['title'] ?? '',
                    'program' => $h['program'] ?? '',
                    'photo_url' => $photo,
                ];
            }, $this->honorees);
        }

        if ($this->faculty || $this->honoree_name) {
            return [[
                'faculty_id' => $this->faculty_id,
                'name' => $this->effective_honoree_name,
                'title' => $this->honoree_title ?: ($this->faculty?->academic_rank ?? 'Faculty Member'),
                'program' => $this->program_or_department ?: ($this->faculty?->program?->name ?? ''),
                'photo_url' => $this->effective_photo_url,
            ]];
        }

        return [];
    }

    public function getEffectiveCollagePhotosAttribute(): array
    {
        if (! empty($this->collage_photos) && is_array($this->collage_photos)) {
            return array_map(function ($cp) {
                $path = $cp['path'] ?? $cp['url'] ?? null;
                $url = $path;
                if ($path && ! str_starts_with($path, 'http://') && ! str_starts_with($path, 'https://') && ! str_starts_with($path, '/')) {
                    $url = asset('storage/'.$path);
                }

                return [
                    'id' => $cp['id'] ?? uniqid(),
                    'path' => $path,
                    'url' => $url,
                    'caption' => $cp['caption'] ?? '',
                    'fit' => $cp['fit'] ?? 'cover',
                    'is_primary' => ! empty($cp['is_primary']),
                ];
            }, $this->collage_photos);
        }

        return [];
    }

    protected function casts(): array
    {
        return [
            'honorees' => 'array',
            'collage_photos' => 'array',
            'supporting_media' => 'array',
            'group_photo_overlay' => 'boolean',
            'event_date' => 'date',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'fullscreen_takeover' => 'boolean',
            'display_duration' => 'integer',
            'priority' => 'integer',
        ];
    }
}
