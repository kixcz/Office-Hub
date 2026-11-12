<?php

use App\Models\College;
use App\Models\TvDevice;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add college_code and college_id to tv_slides if not present
        Schema::table('tv_slides', function (Blueprint $table) {
            if (! Schema::hasColumn('tv_slides', 'college_code')) {
                $table->string('college_code')->nullable()->after('type')->index();
            }
        });

        // 2. Add college_id to tv_devices if not present
        Schema::table('tv_devices', function (Blueprint $table) {
            if (! Schema::hasColumn('tv_devices', 'college_id')) {
                $table->unsignedBigInteger('college_id')->nullable()->after('id')->index();
            }
        });

        // 3. Ensure CIDS-MAIN, HALL-01, and CS-LAB1 have correct college info
        $cids = College::where('code', 'CIDS')->first();
        if ($cids) {
            TvDevice::whereIn('device_code', ['CIDS-MAIN', 'HALL-01', 'CS-LAB1'])->update([
                'college_id' => $cids->id,
                'college_code' => 'CIDS',
                'college_name' => $cids->name,
            ]);
            TvDevice::where('device_code', 'CIDS-MAIN')->update(['channel_number' => 1]);
        }

        // 4. Ensure each college has its designated TV device and channel
        $collegeDeviceDefinitions = [
            [
                'college_code' => 'CED',
                'device_code' => 'CED-MAIN',
                'name' => "CED Dean's Office & Lobby TV Display",
                'location' => 'Education Hall, Ground Floor Atrium',
                'channel_number' => 2,
            ],
            [
                'college_code' => 'CBA',
                'device_code' => 'CBA-MAIN',
                'name' => 'CBA Executive & Student Display',
                'location' => 'Business & Governance Wing, 2nd Floor',
                'channel_number' => 3,
            ],
            [
                'college_code' => 'COE',
                'device_code' => 'COE-MAIN',
                'name' => 'COE Engineering Complex Display',
                'location' => 'Engineering Complex Main Foyer',
                'channel_number' => 4,
            ],
            [
                'college_code' => 'CAS',
                'device_code' => 'CAS-MAIN',
                'name' => 'CAS Academic Block Display',
                'location' => 'Academic Block A, Ground Floor',
                'channel_number' => 5,
            ],
            [
                'college_code' => 'DSSC-SULOP',
                'device_code' => 'SULOP-MAIN',
                'name' => 'Sulop Satellite Campus Central TV',
                'location' => 'Administration Building Lobby, Sulop Campus',
                'channel_number' => 6,
            ],
        ];

        foreach ($collegeDeviceDefinitions as $def) {
            $col = College::where('code', $def['college_code'])->first();
            $colName = $col ? $col->name : $def['college_code'];

            TvDevice::firstOrCreate(
                ['device_code' => $def['device_code']],
                [
                    'name' => $def['name'],
                    'location' => $def['location'],
                    'college_id' => $col?->id,
                    'college_code' => $def['college_code'],
                    'college_name' => $colName,
                    'channel_number' => $def['channel_number'],
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
                    'emergency_takeover_enabled' => true,
                    'is_online' => true,
                    'last_ping_at' => now(),
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        TvDevice::whereIn('device_code', ['CED-MAIN', 'CBA-MAIN', 'COE-MAIN', 'CAS-MAIN', 'SULOP-MAIN'])->delete();

        Schema::table('tv_devices', function (Blueprint $table) {
            if (Schema::hasColumn('tv_devices', 'college_id')) {
                $table->dropColumn('college_id');
            }
        });

        Schema::table('tv_slides', function (Blueprint $table) {
            if (Schema::hasColumn('tv_slides', 'college_code')) {
                $table->dropColumn('college_code');
            }
        });
    }
};
