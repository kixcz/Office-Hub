<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TvSlide extends Model
{
    protected $fillable = [
        'title',
        'type',
        'order',
        'is_active',
        'duration_seconds',
        'config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array',
    ];
}
