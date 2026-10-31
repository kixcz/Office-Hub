<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Meeting extends Model
{
    public const PROGRAMS_LOOKUP_CACHE_KEY = 'officehub_programs_lookup_by_id_v1';

    protected $fillable = [
        'title',
        'date',
        'start_time',
        'end_time',
        'venue',
        'agenda',
        'notes',
        'status',
        'program_id',
        'program_ids',
        'organizer_id',
    ];

    protected function casts(): array
    {
        return [
            'program_ids' => 'array',
        ];
    }

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    /**
     * Get all programs involved in this meeting without N+1 queries.
     */
    public function getProgramsAttribute()
    {
        $ids = $this->program_ids ?: ($this->program_id ? [$this->program_id] : []);
        if (empty($ids)) {
            return collect();
        }

        if (count($ids) === 1 && $this->relationLoaded('program') && $this->program && (int) $this->program->id === (int) $ids[0]) {
            return collect([$this->program]);
        }

        $programsById = Cache::remember(self::PROGRAMS_LOOKUP_CACHE_KEY, 600, function () {
            return Program::select(['id', 'code', 'name'])->get()->keyBy('id');
        });

        return collect($ids)->map(fn ($id) => $programsById->get((int) $id))->filter()->values();
    }
}
