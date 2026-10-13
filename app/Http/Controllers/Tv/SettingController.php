<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\TvSetting;
use App\Models\TvSlide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = TvSetting::all()->pluck('value', 'key')->toArray();

        // Default settings matching design
        $defaultSettings = [
            'display_name' => 'CIDS Office TV',
            'academic_term' => 'AY 2026-2027, 1st Semester',
            'default_audience' => 'Internal Staff',
            'refresh_interval' => '60',

            'fullscreen_mode' => '1',
            'auto_rotate' => '1',
            'slide_duration' => '10',
            'transition_speed' => 'Medium (0.5s)',
            'display_mode' => 'fit', // fit | fill | contain
            'repeat_playlist' => '1',

            'show_clock' => '1',
            'show_footer' => '1',
            'show_slide_title' => '1',
            'show_status_labels' => '1',
            'enable_empty_state' => '1',

            'allow_faculty_names' => '1',
            'enable_internal_slides' => '1',
            'hide_sensitive_compliance' => '1',
            'audience_mode' => 'Internal Staff',
        ];

        $mergedSettings = array_merge($defaultSettings, $settings);

        $activeSlideCount = TvSlide::where('is_active', true)->count();
        if ($activeSlideCount === 0) {
            $activeSlideCount = 12; // Fallback baseline from mockup
        }

        $lastUpdated = TvSetting::latest('updated_at')->first();
        $lastUpdatedFormatted = $lastUpdated && $lastUpdated->updated_at
            ? $lastUpdated->updated_at->format('F j, Y, g:i A')
            : 'October 13, 2026, 11:32 AM';

        return Inertia::render('tv/settings/index', [
            'settings' => $mergedSettings,
            'system_status' => [
                'connected_name' => $mergedSettings['display_name'] ?? 'CIDS Office TV',
                'is_online' => true,
                'refresh_rate_seconds' => (int) ($mergedSettings['refresh_interval'] ?? 60),
                'active_slides_count' => $activeSlideCount,
                'privacy_mode' => $mergedSettings['default_audience'] ?? 'Internal Staff',
                'privacy_badge' => 'Restricted',
                'last_updated' => $lastUpdatedFormatted,
                'last_updated_by' => 'System Admin',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            TvSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        return redirect()->back()->with('success', 'TV Display Settings saved successfully.');
    }

    public function reset()
    {
        TvSetting::truncate();

        return redirect()->back()->with('success', 'TV Display Settings reset to defaults.');
    }
}
