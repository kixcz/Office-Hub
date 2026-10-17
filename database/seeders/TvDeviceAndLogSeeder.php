<?php

namespace Database\Seeders;

use App\Models\TvDevice;
use App\Models\TvPublicationLog;
use Illuminate\Database\Seeder;

class TvDeviceAndLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Initial TV Devices
        if (TvDevice::count() === 0) {
            TvDevice::create([
                'name' => "CIDS Dean's Office Main Display",
                'device_code' => 'CIDS-MAIN',
                'location' => "Dean's Executive Suite, 3rd Floor",
                'audience_mode' => 'internal',
                'default_playlist' => 'Official TV Rotation',
                'default_slide_duration' => 15,
                'transition_type' => 'fade',
                'transition_duration_ms' => 500,
                'fullscreen_mode' => true,
                'auto_rotate' => true,
                'refresh_interval_seconds' => 60,
                'screen_resolution' => '3840x2160',
                'safe_area_margin' => 'normal',
                'display_timezone' => 'Asia/Manila',
                'show_header' => true,
                'show_footer' => true,
                'show_clock' => true,
                'show_slide_title' => true,
                'show_status_labels' => true,
                'allow_manual_controls' => true,
                'auto_launch_on_refresh' => true,
                'fallback_screen' => 'logo_welcome',
                'emergency_takeover_enabled' => true,
                'is_online' => true,
                'last_ping_at' => now(),
            ]);

            TvDevice::create([
                'name' => 'CIDS Academic Hallway Display',
                'device_code' => 'HALL-01',
                'location' => 'Main Ground Floor Atrium & Student Hallway',
                'audience_mode' => 'public',
                'default_playlist' => 'Official TV Rotation',
                'default_slide_duration' => 12,
                'transition_type' => 'slide',
                'transition_duration_ms' => 400,
                'fullscreen_mode' => true,
                'auto_rotate' => true,
                'refresh_interval_seconds' => 45,
                'screen_resolution' => '1920x1080',
                'safe_area_margin' => 'compact',
                'display_timezone' => 'Asia/Manila',
                'show_header' => true,
                'show_footer' => true,
                'show_clock' => true,
                'show_slide_title' => true,
                'show_status_labels' => false,
                'allow_manual_controls' => false,
                'auto_launch_on_refresh' => true,
                'fallback_screen' => 'logo_welcome',
                'emergency_takeover_enabled' => true,
                'is_online' => true,
                'last_ping_at' => now(),
            ]);

            TvDevice::create([
                'name' => 'Computer Science Lab 1 Screen',
                'device_code' => 'CS-LAB1',
                'location' => 'Building B, Room 204 (Advanced Computing Lab)',
                'audience_mode' => 'public',
                'default_playlist' => 'Official TV Rotation',
                'default_slide_duration' => 15,
                'transition_type' => 'fade',
                'transition_duration_ms' => 500,
                'fullscreen_mode' => true,
                'auto_rotate' => true,
                'refresh_interval_seconds' => 60,
                'screen_resolution' => '1920x1080',
                'safe_area_margin' => 'normal',
                'display_timezone' => 'Asia/Manila',
                'show_header' => true,
                'show_footer' => true,
                'show_clock' => true,
                'show_slide_title' => true,
                'show_status_labels' => true,
                'allow_manual_controls' => true,
                'auto_launch_on_refresh' => true,
                'fallback_screen' => 'logo_welcome',
                'emergency_takeover_enabled' => false,
                'is_online' => false,
                'last_ping_at' => now()->subHours(2),
            ]);
        }

        // 2. Publication Logs
        if (TvPublicationLog::count() === 0) {
            TvPublicationLog::create([
                'version' => 'v2.5.1',
                'action' => 'Published',
                'target_type' => 'Spotlight',
                'target_name' => 'Recognition: Dr. Aris Thorne Best Paper Award',
                'publisher_name' => 'Dr. Eleanor Vance (Super Admin)',
                'summary' => 'Published celebratory Spotlight slide for Best Paper Award at 2026 ICT Conference with 20s duration.',
                'snapshot_before' => null,
                'snapshot_after' => ['headline' => 'CONGRATULATIONS!', 'type' => 'award', 'priority' => 'high'],
                'created_at' => now()->subMinutes(15),
            ]);

            TvPublicationLog::create([
                'version' => 'v2.5.0',
                'action' => 'Activated',
                'target_type' => 'Playlist',
                'target_name' => 'Official TV Rotation',
                'publisher_name' => 'Dr. Eleanor Vance (Super Admin)',
                'summary' => 'Interleaved Recognition & Celebrations spotlight slides into core display rotation every 2-3 slides.',
                'snapshot_before' => ['active_slides' => 11],
                'snapshot_after' => ['active_slides' => 12, 'spotlight_slides' => 2],
                'created_at' => now()->subHours(2),
            ]);

            TvPublicationLog::create([
                'version' => 'v2.4.9',
                'action' => 'Settings Changed',
                'target_type' => 'Display Settings',
                'target_name' => "CIDS Dean's Office Main Display",
                'publisher_name' => 'Super Administrator',
                'summary' => 'Configured safe-area margins to normal and updated refresh interval to 60s.',
                'snapshot_before' => ['refresh_interval' => 30],
                'snapshot_after' => ['refresh_interval' => 60],
                'created_at' => now()->subDays(1),
            ]);

            TvPublicationLog::create([
                'version' => 'v2.4.8',
                'action' => 'Reordered',
                'target_type' => 'Playlist',
                'target_name' => 'Official TV Rotation',
                'publisher_name' => 'Dean Office Admin',
                'summary' => 'Moved Classroom Monitoring ahead of Faculty Attendance for prelim exams review.',
                'created_at' => now()->subDays(2),
            ]);
        }
    }
}
