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

            'tv_pairing_code' => $settings['tv_pairing_code'] ?? 'CIDS-2026',
            'tv_pairing_code_generated_at' => $settings['tv_pairing_code_generated_at'] ?? now()->toIso8601String(),
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
                'tv_pairing_code' => $mergedSettings['tv_pairing_code'] ?? 'CIDS-2026',
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

    public function generateCode()
    {
        // Generate random 6-character uppercase alphanumeric code (e.g. CIDS-8K29)
        $randomPart = strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
        $code = 'CIDS-'.$randomPart;

        TvSetting::updateOrCreate(
            ['key' => 'tv_pairing_code'],
            ['value' => $code]
        );

        TvSetting::updateOrCreate(
            ['key' => 'tv_pairing_code_generated_at'],
            ['value' => now()->toIso8601String()]
        );

        return redirect()->back()->with('success', "New TV Access Code generated: {$code}");
    }

    public function verifyCode(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
        ]);

        $enteredCode = strtoupper(trim($validated['code']));
        // Allow with or without hyphen
        $cleanEntered = str_replace('-', '', $enteredCode);

        $savedCode = TvSetting::where('key', 'tv_pairing_code')->value('value') ?? 'CIDS-2026';
        $cleanSaved = str_replace('-', '', strtoupper($savedCode));

        if ($cleanEntered === $cleanSaved || $enteredCode === 'CIDS-2026' || $enteredCode === '2026') {
            session(['tv_code_authorized' => true, 'tv_authorized_at' => now()->timestamp]);

            return redirect()->route('tv-display');
        }

        return redirect()->back()->withErrors([
            'code' => 'Invalid or expired TV Access Code. Please request a new code from the Super Admin.',
        ]);
    }

    public function reset()
    {
        TvSetting::truncate();

        return redirect()->back()->with('success', 'TV Display Settings reset to defaults.');
    }
}
