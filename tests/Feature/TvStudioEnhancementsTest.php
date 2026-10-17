<?php

use App\Models\CustomContentSlide;
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

test('authenticated user can view custom manual slides index', function () {
    $response = $this->actingAs($this->user)->get(route('tv-config.custom.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('tv/custom/index')
        ->has('slides')
        ->has('stats')
        ->has('filters')
    );
});

test('authenticated user can store and duplicate custom manual slide', function () {
    $payload = [
        'title' => 'WEEKLY CLEANING ROSTER',
        'subtitle' => 'Faculty & Staff Office',
        'badge' => 'Daily Duties',
        'layout' => 'title_table',
        'theme' => 'slate-clean',
        'header_alignment' => 'left',
        'duration_seconds' => 20,
        'playlist' => 'Main Entrance Displays',
        'priority' => 1,
        'status' => 'published',
        'content_blocks' => [
            [
                'id' => 'b1',
                'type' => 'table',
                'title' => 'Assigned Schedule',
                'tableData' => [
                    'columns' => [
                        ['id' => 'day', 'label' => 'Day'],
                        ['id' => 'area', 'label' => 'Work Area'],
                        ['id' => 'person', 'label' => 'Personnel'],
                    ],
                    'rows' => [
                        ['id' => 'r1', 'cells' => ['day' => 'Monday', 'area' => 'Pantry', 'person' => 'Staff A'], 'isHighlighted' => true],
                    ],
                ],
            ],
        ],
    ];

    $response = $this->actingAs($this->user)->post(route('tv-config.custom.store'), $payload);

    $response->assertRedirect(route('tv-config.custom.index'));
    $this->assertDatabaseHas('custom_content_slides', [
        'title' => 'WEEKLY CLEANING ROSTER',
        'layout' => 'title_table',
        'status' => 'published',
    ]);

    $slide = CustomContentSlide::where('title', 'WEEKLY CLEANING ROSTER')->first();
    $dupResponse = $this->actingAs($this->user)->post(route('tv-config.custom.duplicate', $slide->id));
    $dupResponse->assertRedirect();
    $this->assertDatabaseHas('custom_content_slides', [
        'title' => 'Copy of WEEKLY CLEANING ROSTER',
        'status' => 'draft',
    ]);
});

test('active custom slides are correctly included in tv display playlist rotation', function () {
    CustomContentSlide::create([
        'title' => 'FACULTY MEETING AGENDA',
        'layout' => 'bulletin',
        'theme' => 'emerald-accent',
        'header_alignment' => 'left',
        'duration_seconds' => 18,
        'playlist' => 'Main Entrance Displays',
        'status' => 'published',
        'created_by' => $this->user->id,
    ]);

    $response = $this->get('/tv-display');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('tv/display')
        ->where('slides', fn ($slides) => collect($slides)->contains(fn ($s) => ($s['custom_data']['title'] ?? null) === 'FACULTY MEETING AGENDA'))
    );
});
