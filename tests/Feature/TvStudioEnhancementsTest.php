<?php

use App\Models\TvDevice;
use App\Models\TvPublicationLog;
use App\Models\TvSlide;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('authenticated user can view templates index with approved structures', function () {
    $response = $this->actingAs($this->user)->get(route('tv-config.templates.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tv/templates/index')
        ->has('templates')
    );
});

test('authenticated user can view widgets library with domain catalog', function () {
    $response = $this->actingAs($this->user)->get(route('tv-config.widgets.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tv/widgets/index')
        ->has('categories')
    );
});

test('authenticated user can access slide composer with layout presets', function () {
    $slide = TvSlide::first() ?? TvSlide::create([
        'title' => 'Test Slide Composer',
        'type' => 'Daily Overview',
        'duration_seconds' => 15,
        'order' => 1,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)->get(route('tv-config.slides.builder'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tv/slides/builder')
        ->has('slides')
    );
});

test('authenticated user can save tv display settings and create audit log', function () {
    $response = $this->actingAs($this->user)->post(route('tv-config.settings.store'), [
        'settings' => [
            'display_name' => 'Dean Hallway OLED TV',
            'audience_mode' => 'Public',
            'slide_duration' => '18',
            'screen_resolution' => '3840x2160',
            'safe_area_margin' => 'normal',
            'refresh_interval' => '45',
        ],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('tv_settings', [
        'key' => 'display_name',
        'value' => 'Dean Hallway OLED TV',
    ]);

    $this->assertDatabaseHas('tv_publication_logs', [
        'target_type' => 'Display Settings',
    ]);
});

test('authenticated user can view publication history and rollback snapshot', function () {
    $log = TvPublicationLog::create([
        'version' => 'v2.9.0',
        'action' => 'Settings Changed',
        'target_type' => 'Display Settings',
        'target_name' => 'Hallway Screen',
        'user_id' => $this->user->id,
        'publisher_name' => $this->user->name,
        'summary' => 'Configured safe margin',
        'snapshot_after' => ['display_name' => 'Previous Restored TV'],
    ]);

    $response = $this->actingAs($this->user)->get(route('tv-config.history.index'));
    $response->assertOk();

    // Test rollback action
    $rollbackResponse = $this->actingAs($this->user)->post(route('tv-config.history.rollback', $log->id));
    $rollbackResponse->assertRedirect();

    $this->assertDatabaseHas('tv_settings', [
        'key' => 'display_name',
        'value' => 'Previous Restored TV',
    ]);
});

test('tv display endpoint supports per-device route and device codes', function () {
    $device = TvDevice::first() ?? TvDevice::create([
        'name' => 'Executive Test TV',
        'device_code' => 'EXEC-TEST',
        'audience_mode' => 'internal',
    ]);

    $response = $this->get('/tv-display/'.$device->device_code);
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tv/display')
        ->has('settings')
        ->has('slides')
    );
});
