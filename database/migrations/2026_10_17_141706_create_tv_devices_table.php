<?php

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
        Schema::create('tv_devices', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "CIDS Dean Office Display", "Hallway Public Display", "Computer Lab 1 TV"
            $table->string('device_code')->unique(); // e.g. "CIDS-MAIN", "HALL-01", "LAB1-TV"
            $table->string('location')->nullable(); // e.g. "Dean's Office", "Academic Hallway Ground Floor"
            $table->string('audience_mode')->default('internal'); // 'internal' | 'public'
            $table->string('default_playlist')->default('Official TV Rotation');
            $table->integer('default_slide_duration')->default(15);
            $table->string('transition_type')->default('fade'); // 'fade', 'slide', 'zoom', 'none'
            $table->integer('transition_duration_ms')->default(500);
            $table->boolean('fullscreen_mode')->default(true);
            $table->boolean('auto_rotate')->default(true);
            $table->integer('refresh_interval_seconds')->default(60);
            $table->string('screen_resolution')->default('1920x1080'); // 1920x1080, 3840x2160, 1366x768
            $table->string('safe_area_margin')->default('normal'); // 'none', 'compact', 'normal', 'spacious'
            $table->string('display_timezone')->default('Asia/Manila');
            $table->boolean('show_header')->default(true);
            $table->boolean('show_footer')->default(true);
            $table->boolean('show_clock')->default(true);
            $table->boolean('show_slide_title')->default(true);
            $table->boolean('show_status_labels')->default(true);
            $table->boolean('allow_manual_controls')->default(true);
            $table->boolean('auto_launch_on_refresh')->default(true);
            $table->string('fallback_screen')->default('logo_welcome'); // 'logo_welcome', 'black_screen', 'maintenance'
            $table->boolean('emergency_takeover_enabled')->default(true);
            $table->boolean('is_online')->default(true);
            $table->timestamp('last_ping_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tv_devices');
    }
};
