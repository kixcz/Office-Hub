<?php

namespace App\Http\Controllers\Tv;

use App\Http\Controllers\Controller;
use App\Models\TvSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = TvSetting::all()->pluck('value', 'key')->toArray();
        
        // Default settings
        $defaultSettings = [
            'display_name' => 'Internal Staff Display',
            'fullscreen_mode' => '1',
            'refresh_interval' => '60',
            'show_clock' => '1',
            'show_footer' => '1',
            'show_faculty_names' => '1',
            'academic_term' => 'AY 2026-2027, 1st Semester'
        ];

        return Inertia::render('tv/settings/index', [
            'settings' => array_merge($defaultSettings, $settings)
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array'
        ]);

        foreach ($validated['settings'] as $key => $value) {
            TvSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return redirect()->back();
    }
}
