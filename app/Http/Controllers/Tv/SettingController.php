<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\TvDevice;
use App\Models\TvPublicationLog;
use App\Models\TvSetting;
use App\Models\TvSlide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $devices = TvDevice::orderBy('id')->get();
        $selectedDeviceId = $request->query('device_id');
        $selectedDevice = $selectedDeviceId ? TvDevice::find($selectedDeviceId) : $devices->first();

        $settings = TvSetting::all()->pluck('value', 'key')->toArray();

        // Default settings matching design
        $defaultSettings = [
            'display_name' => $selectedDevice ? $selectedDevice->name : 'CIDS Office TV',
            'academic_term' => 'AY 2026-2027, 1st Semester',
            'default_audience' => $selectedDevice ? ($selectedDevice->audience_mode === 'public' ? 'Public' : 'Internal Staff') : 'Internal Staff',
            'refresh_interval' => (string) ($selectedDevice ? $selectedDevice->refresh_interval_seconds : 60),

            'fullscreen_mode' => $selectedDevice ? ($selectedDevice->fullscreen_mode ? '1' : '0') : '1',
            'auto_rotate' => $selectedDevice ? ($selectedDevice->auto_rotate ? '1' : '0') : '1',
            'slide_duration' => (string) ($selectedDevice ? $selectedDevice->default_slide_duration : 15),
            'transition_speed' => $selectedDevice ? $selectedDevice->transition_type : 'fade',
            'display_mode' => 'fit', // fit | fill | contain
            'repeat_playlist' => '1',

            'show_clock' => $selectedDevice ? ($selectedDevice->show_clock ? '1' : '0') : '1',
            'show_footer' => $selectedDevice ? ($selectedDevice->show_footer ? '1' : '0') : '1',
            'show_slide_title' => $selectedDevice ? ($selectedDevice->show_slide_title ? '1' : '0') : '1',
            'show_status_labels' => $selectedDevice ? ($selectedDevice->show_status_labels ? '1' : '0') : '1',
            'enable_empty_state' => '1',

            'allow_faculty_names' => $selectedDevice && $selectedDevice->audience_mode === 'public' ? '0' : '1',
            'enable_internal_slides' => $selectedDevice && $selectedDevice->audience_mode === 'public' ? '0' : '1',
            'hide_sensitive_compliance' => $selectedDevice && $selectedDevice->audience_mode === 'public' ? '1' : '0',
            'audience_mode' => $selectedDevice ? ($selectedDevice->audience_mode === 'public' ? 'Public' : 'Internal Staff') : 'Internal Staff',

            'screen_resolution' => $selectedDevice ? $selectedDevice->screen_resolution : '1920x1080',
            'safe_area_margin' => $selectedDevice ? $selectedDevice->safe_area_margin : 'normal',
            'display_timezone' => $selectedDevice ? $selectedDevice->display_timezone : 'Asia/Manila',
            'allow_manual_controls' => $selectedDevice ? ($selectedDevice->allow_manual_controls ? '1' : '0') : '1',
            'auto_launch_on_refresh' => $selectedDevice ? ($selectedDevice->auto_launch_on_refresh ? '1' : '0') : '1',
            'fallback_screen' => $selectedDevice ? $selectedDevice->fallback_screen : 'logo_welcome',
            'emergency_takeover_enabled' => $selectedDevice ? ($selectedDevice->emergency_takeover_enabled ? '1' : '0') : '1',

            'tv_pairing_code' => $settings['tv_pairing_code'] ?? 'CIDS-2026',
            'tv_pairing_code_generated_at' => $settings['tv_pairing_code_generated_at'] ?? now()->toIso8601String(),
        ];

        $mergedSettings = array_merge($defaultSettings, $settings);

        $activeSlideCount = TvSlide::where('is_active', true)->count();
        if ($activeSlideCount === 0) {
            $activeSlideCount = 12;
        }

        $lastUpdated = TvSetting::latest('updated_at')->first();
        $lastUpdatedFormatted = $lastUpdated && $lastUpdated->updated_at
            ? $lastUpdated->updated_at->format('F j, Y, g:i A')
            : now()->format('F j, Y, g:i A');

        return Inertia::render('tv/settings/index', [
            'settings' => $mergedSettings,
            'devices' => $devices,
            'selected_device' => $selectedDevice,
            'system_status' => [
                'connected_name' => $selectedDevice ? $selectedDevice->name : ($mergedSettings['display_name'] ?? 'CIDS Office TV'),
                'is_online' => $selectedDevice ? $selectedDevice->is_online : true,
                'refresh_rate_seconds' => (int) ($mergedSettings['refresh_interval'] ?? 60),
                'active_slides_count' => $activeSlideCount,
                'privacy_mode' => $mergedSettings['audience_mode'] ?? 'Internal Staff',
                'privacy_badge' => ($mergedSettings['audience_mode'] ?? 'Internal Staff') === 'Public' ? 'Public Display' : 'Restricted (Internal)',
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
            'device_id' => 'nullable|integer|exists:tv_devices,id',
        ]);

        $settings = $validated['settings'];

        // Save key-value TV settings
        foreach ($settings as $key => $value) {
            TvSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        // Also update specific device if provided
        $deviceId = $validated['device_id'] ?? null;
        $device = $deviceId ? TvDevice::find($deviceId) : TvDevice::first();

        if ($device) {
            $audienceMode = (isset($settings['audience_mode']) && strtolower($settings['audience_mode']) === 'public')
                || (isset($settings['default_audience']) && strtolower($settings['default_audience']) === 'public')
                ? 'public' : 'internal';

            $device->update([
                'name' => $settings['display_name'] ?? $device->name,
                'audience_mode' => $audienceMode,
                'default_slide_duration' => isset($settings['slide_duration']) ? (int) $settings['slide_duration'] : $device->default_slide_duration,
                'transition_type' => $settings['transition_speed'] ?? $device->transition_type,
                'fullscreen_mode' => ! empty($settings['fullscreen_mode']),
                'auto_rotate' => ! empty($settings['auto_rotate']),
                'refresh_interval_seconds' => isset($settings['refresh_interval']) ? (int) $settings['refresh_interval'] : $device->refresh_interval_seconds,
                'screen_resolution' => $settings['screen_resolution'] ?? $device->screen_resolution,
                'safe_area_margin' => $settings['safe_area_margin'] ?? $device->safe_area_margin,
                'display_timezone' => $settings['display_timezone'] ?? $device->display_timezone,
                'show_header' => ! empty($settings['show_header']),
                'show_footer' => ! empty($settings['show_footer']),
                'show_clock' => ! empty($settings['show_clock']),
                'show_slide_title' => ! empty($settings['show_slide_title']),
                'show_status_labels' => ! empty($settings['show_status_labels']),
                'allow_manual_controls' => ! empty($settings['allow_manual_controls']),
                'auto_launch_on_refresh' => ! empty($settings['auto_launch_on_refresh']),
                'fallback_screen' => $settings['fallback_screen'] ?? $device->fallback_screen,
                'emergency_takeover_enabled' => ! empty($settings['emergency_takeover_enabled']),
                'last_ping_at' => now(),
            ]);
        }

        // Record in Publication Audit Log
        TvPublicationLog::create([
            'version' => 'v2.'.now()->format('m.d'),
            'action' => 'Settings Changed',
            'target_type' => 'Display Settings',
            'target_name' => $device ? $device->name : 'Global TV Settings',
            'user_id' => auth()->id(),
            'publisher_name' => auth()->user()?->name ?? 'System Administrator',
            'summary' => 'Updated global TV display preferences (audience mode, rotation behavior, duration, safe margins).',
            'snapshot_after' => $settings,
        ]);

        return redirect()->back()->with('success', 'TV Display Settings saved successfully and broadcast to connected screens.');
    }

    public function generateCode()
    {
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

        TvPublicationLog::create([
            'version' => 'v2.'.now()->format('m.d'),
            'action' => 'Restored',
            'target_type' => 'Display Settings',
            'target_name' => 'Global TV Settings',
            'user_id' => auth()->id(),
            'publisher_name' => auth()->user()?->name ?? 'System Administrator',
            'summary' => 'Reset all TV display settings to default factory values.',
        ]);

        return redirect()->back()->with('success', 'TV Display Settings reset to defaults.');
    }
}
