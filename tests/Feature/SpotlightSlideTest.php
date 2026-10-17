<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\SpotlightSlide;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('authenticated user can view spotlight slides index', function () {
    $response = $this->actingAs($this->user)->get(route('tv-config.spotlight.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('tv/spotlight/index')
        ->has('spotlights')
        ->has('stats')
        ->has('suggested_birthdays')
    );
});

test('authenticated user can view spotlight create page with prefilled data', function () {
    $program = Program::first() ?? Program::create(['name' => 'Computer Science', 'code' => 'BSCS']);
    $faculty = Faculty::first() ?? Faculty::create([
        'first_name' => 'Alan',
        'last_name' => 'Turing',
        'program_id' => $program->id,
        'academic_rank' => 'Professor',
    ]);

    $response = $this->actingAs($this->user)->get(route('tv-config.spotlight.create', [
        'type' => 'birthday',
        'faculty_id' => $faculty->id,
    ]));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('tv/spotlight/create')
        ->has('faculties')
        ->where('prefill.type', 'birthday')
        ->where('prefill.honoree_name', $faculty->full_name)
    );
});

test('user can store a new spotlight slide', function () {
    $payload = [
        'type' => 'achievement',
        'headline' => 'OUTSTANDING EXTENSION LEADERSHIP',
        'message' => 'Recognizing successful community outreach and digital literacy programs.',
        'honoree_name' => 'Dr. Grace Hopper',
        'honoree_title' => 'Professor I',
        'program_or_department' => 'Information Technology',
        'template' => 'achievement',
        'background_style' => 'royal-gold',
        'accent_style' => 'gold',
        'headline_alignment' => 'left',
        'text_size' => 'normal',
        'display_duration' => 20,
        'transition' => 'zoom-fade',
        'layout_mode' => 'hero-split',
        'fullscreen_takeover' => false,
        'playlist' => 'Main TV Rotation',
        'priority' => 2,
        'status' => 'published',
    ];

    $response = $this->actingAs($this->user)->post(route('tv-config.spotlight.store'), $payload);

    $response->assertRedirect(route('tv-config.spotlight.index'));
    $this->assertDatabaseHas('spotlight_slides', [
        'headline' => 'OUTSTANDING EXTENSION LEADERSHIP',
        'honoree_name' => 'Dr. Grace Hopper',
        'status' => 'published',
        'priority' => 2,
    ]);
});

test('user can toggle publish status of a spotlight slide', function () {
    $slide = SpotlightSlide::create([
        'type' => 'award',
        'headline' => 'CHED RESEARCH FELLOW',
        'message' => 'Commending prestigious research grant award.',
        'honoree_name' => 'Prof. Ada Lovelace',
        'template' => 'award',
        'background_style' => 'royal-gold',
        'accent_style' => 'gold',
        'headline_alignment' => 'left',
        'text_size' => 'normal',
        'display_duration' => 20,
        'transition' => 'zoom-fade',
        'layout_mode' => 'hero-split',
        'fullscreen_takeover' => false,
        'playlist' => 'Main TV Rotation',
        'priority' => 1,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($this->user)->post(route('tv-config.spotlight.toggle-publish', $slide->id));

    $response->assertRedirect();
    $slide->refresh();
    expect($slide->status)->toBe('published');
});

test('tv display endpoint interleaves active spotlight slides into playlist rotation', function () {
    $slide = SpotlightSlide::create([
        'type' => 'award',
        'headline' => 'NATIONAL ICT CHAMPION',
        'message' => 'Winner of national coding challenge.',
        'honoree_name' => 'Prof. John Von Neumann',
        'template' => 'award',
        'background_style' => 'royal-gold',
        'accent_style' => 'gold',
        'headline_alignment' => 'left',
        'text_size' => 'normal',
        'display_duration' => 25,
        'transition' => 'zoom-fade',
        'layout_mode' => 'hero-split',
        'fullscreen_takeover' => false,
        'playlist' => 'Main TV Rotation',
        'priority' => 2,
        'status' => 'published',
        'start_at' => now()->subDay(),
        'end_at' => now()->addDays(5),
    ]);

    $response = $this->get(route('tv-display'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('tv/display')
        ->has('slides')
    );
});

test('user can store a multiple honorees spotlight slide with custom animation effect', function () {
    $payload = [
        'type' => 'publication',
        'subject_type' => 'multiple',
        'honoree_name' => 'Dr. Oriente, Dr. Reyes, Dr. Santos',
        'honorees' => [
            ['name' => 'Dr. Jerry Oriente', 'title' => 'Assoc. Professor', 'program' => 'BSIT'],
            ['name' => 'Dr. Maria Reyes', 'title' => 'Professor', 'program' => 'BSIS'],
        ],
        'headline' => 'IEEE BEST PAPER CONGRATULATIONS',
        'message' => 'Prestigious international conference award received by our department faculty.',
        'template' => 'dual-portrait',
        'background_style' => 'midnight-prestige',
        'accent_style' => 'blue',
        'headline_alignment' => 'center',
        'text_size' => 'normal',
        'display_duration' => 25,
        'transition' => 'zoom-fade',
        'animation_effect' => 'floating_trophies',
        'layout_mode' => 'hero-split',
        'fullscreen_takeover' => true,
        'playlist' => 'Main TV Rotation',
        'priority' => 3,
        'status' => 'published',
    ];

    $response = $this->actingAs($this->user)->post(route('tv-config.spotlight.store'), $payload);

    $response->assertRedirect(route('tv-config.spotlight.index'));
    $this->assertDatabaseHas('spotlight_slides', [
        'subject_type' => 'multiple',
        'headline' => 'IEEE BEST PAPER CONGRATULATIONS',
        'animation_effect' => 'floating_trophies',
        'fullscreen_takeover' => true,
    ]);
});

test('user can store a team spotlight slide with custom group photo settings', function () {
    $payload = [
        'type' => 'achievement',
        'subject_type' => 'team',
        'honoree_name' => 'CIDS Cyber Security Research Lab',
        'program_or_department' => 'College of Information and Communications Studies',
        'group_photo_fit' => 'cover',
        'group_photo_focal' => 'center',
        'group_photo_overlay' => true,
        'headline' => 'NATIONAL HACKATHON GRAND CHAMPION',
        'message' => 'Commending our students and faculty coaches for bringing immense honor to the university.',
        'template' => 'group-banner',
        'background_style' => 'royal-gold',
        'accent_style' => 'gold',
        'headline_alignment' => 'left',
        'text_size' => 'large',
        'display_duration' => 30,
        'transition' => 'slide-up',
        'animation_effect' => 'confetti',
        'layout_mode' => 'banner-card',
        'fullscreen_takeover' => false,
        'playlist' => 'Main TV Rotation',
        'priority' => 2,
        'status' => 'published',
    ];

    $response = $this->actingAs($this->user)->post(route('tv-config.spotlight.store'), $payload);

    $response->assertRedirect(route('tv-config.spotlight.index'));
    $this->assertDatabaseHas('spotlight_slides', [
        'subject_type' => 'team',
        'honoree_name' => 'CIDS Cyber Security Research Lab',
        'animation_effect' => 'confetti',
        'group_photo_fit' => 'cover',
    ]);
});
