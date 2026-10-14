<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
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
     * Get all programs involved in this meeting
     */
    public function getProgramsAttribute()
    {
        $ids = $this->program_ids ?: ($this->program_id ? [$this->program_id] : []);
        if (empty($ids)) {
            return collect();
        }

        return Program::whereIn('id', $ids)->get();
    }
}
