<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TvDevice extends Model
{
    protected $fillable = [
        'name',
        'device_code',
        'location',
        'audience_mode',
        'default_playlist',
        'default_slide_duration',
        'transition_type',
        'transition_duration_ms',
        'fullscreen_mode',
        'auto_rotate',
        'refresh_interval_seconds',
        'screen_resolution',
        'safe_area_margin',
        'display_timezone',
        'show_header',
        'show_footer',
        'show_clock',
        'show_slide_title',
        'show_status_labels',
        'allow_manual_controls',
        'auto_launch_on_refresh',
        'fallback_screen',
        'emergency_takeover_enabled',
        'is_online',
        'last_ping_at',
    ];

    protected $casts = [
        'fullscreen_mode' => 'boolean',
        'auto_rotate' => 'boolean',
        'show_header' => 'boolean',
        'show_footer' => 'boolean',
        'show_clock' => 'boolean',
        'show_slide_title' => 'boolean',
        'show_status_labels' => 'boolean',
        'allow_manual_controls' => 'boolean',
        'auto_launch_on_refresh' => 'boolean',
        'emergency_takeover_enabled' => 'boolean',
        'is_online' => 'boolean',
        'last_ping_at' => 'datetime',
        'default_slide_duration' => 'integer',
        'transition_duration_ms' => 'integer',
        'refresh_interval_seconds' => 'integer',
    ];
}
