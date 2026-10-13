<?php

use App\Models\FacilityMonitoring;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\RoomSchedule;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('authenticated user can view faculty list with photo_url', function () {
    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);

    Faculty::create([
        'first_name' => 'Alan',
        'last_name' => 'Turing',
        'program_id' => $program->id,
        'profile_picture' => 'faculty-photos/sample.jpg',
    ]);

    $response = $this->actingAs($user)
        ->get('/faculties')
        ->assertOk();

    $faculties = $response->viewData('page')['props']['faculties'];
    $alan = collect($faculties)->firstWhere('last_name', 'Turing');

    expect($alan)->not->toBeNull()
        ->and($alan['photo_url'])->toContain('/storage/faculty-photos/sample.jpg');
});

test('faculty member can be created with an uploaded profile picture', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);
    $photo = UploadedFile::fake()->image('prof_face.jpg', 400, 400);

    $response = $this->actingAs($user)
        ->post('/faculties', [
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'program_id' => $program->id,
            'profile_picture' => $photo,
        ]);

    $response->assertRedirect();

    $faculty = Faculty::where('last_name', 'Lovelace')->first();
    expect($faculty)->not->toBeNull()
        ->and($faculty->profile_picture)->not->toBeNull();

    Storage::disk('public')->assertExists($faculty->profile_picture);
    expect($faculty->photo_url)->toContain('/storage/'.$faculty->profile_picture);
});

test('faculty profile picture can be replaced on update', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);

    $oldPhoto = UploadedFile::fake()->image('old_face.jpg');
    $oldPath = $oldPhoto->store('faculty-photos', 'public');

    $faculty = Faculty::create([
        'first_name' => 'Grace',
        'last_name' => 'Hopper',
        'program_id' => $program->id,
        'profile_picture' => $oldPath,
    ]);

    Storage::disk('public')->assertExists($oldPath);

    $newPhoto = UploadedFile::fake()->image('new_face.png');

    $response = $this->actingAs($user)
        ->put("/faculties/{$faculty->id}", [
            'first_name' => 'Grace',
            'last_name' => 'Hopper',
            'program_id' => $program->id,
            'profile_picture' => $newPhoto,
        ]);

    $response->assertRedirect();
    $faculty->refresh();

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($faculty->profile_picture);
});

test('faculty profile picture can be removed without uploading a new one', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);

    $photo = UploadedFile::fake()->image('avatar.jpg');
    $path = $photo->store('faculty-photos', 'public');

    $faculty = Faculty::create([
        'first_name' => 'Katherine',
        'last_name' => 'Johnson',
        'program_id' => $program->id,
        'profile_picture' => $path,
    ]);

    Storage::disk('public')->assertExists($path);

    $response = $this->actingAs($user)
        ->put("/faculties/{$faculty->id}", [
            'first_name' => 'Katherine',
            'last_name' => 'Johnson',
            'program_id' => $program->id,
            'remove_photo' => true,
        ]);

    $response->assertRedirect();
    $faculty->refresh();

    Storage::disk('public')->assertMissing($path);
    expect($faculty->profile_picture)->toBeNull()
        ->and($faculty->photo_url)->toBeNull();
});

test('deleting faculty removes their profile picture file', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);

    $photo = UploadedFile::fake()->image('avatar.jpg');
    $path = $photo->store('faculty-photos', 'public');

    $faculty = Faculty::create([
        'first_name' => 'Margaret',
        'last_name' => 'Hamilton',
        'program_id' => $program->id,
        'profile_picture' => $path,
    ]);

    Storage::disk('public')->assertExists($path);

    $response = $this->actingAs($user)
        ->delete("/faculties/{$faculty->id}");

    $response->assertRedirect();
    Storage::disk('public')->assertMissing($path);
    $this->assertDatabaseMissing('faculties', ['id' => $faculty->id]);
});

test('tv display endpoint passes faculty photos for display slides', function () {
    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);

    $faculty = Faculty::create([
        'first_name' => 'Linus',
        'last_name' => 'Torvalds',
        'program_id' => $program->id,
        'profile_picture' => 'faculty-photos/linus.jpg',
    ]);

    $response = $this->actingAs($user)
        ->get('/tv-display')
        ->assertOk();

    $data = $response->viewData('page')['props']['data'];
    expect($data)->toHaveKey('slide4');

    $linus = collect($data['slide4']['top_faculty'])->firstWhere('name', 'Linus Torvalds');
    expect($linus)->not->toBeNull()
        ->and($linus['photo_url'])->toContain('/storage/faculty-photos/linus.jpg');
});

test('authenticated user can view faculty profile page with compliance metrics and workload', function () {
    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSIT', 'name' => 'Information Technology']);

    $faculty = Faculty::create([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'faculty_id' => 'CIDS-2026-001',
        'academic_rank' => 'Assistant Professor I',
        'employment_type' => 'Full-time',
        'status' => 'Active',
        'highest_qualification' => 'Master of Information Technology',
        'specialization' => 'Software Engineering',
        'email' => 'maria.santos@cids.edu.ph',
        'program_id' => $program->id,
    ]);

    $response = $this->actingAs($user)
        ->get("/faculties/{$faculty->id}")
        ->assertOk();

    $page = $response->viewData('page');
    expect($page['component'])->toBe('faculties/show');

    $props = $page['props'];
    expect($props)->toHaveKeys([
        'faculty',
        'current_period',
        'available_periods',
        'kpis',
        'workload',
        'requirements',
        'monitoring',
        'activity_log',
        'user_permissions',
    ]);

    expect($props['faculty']['id'])->toBe($faculty->id)
        ->and($props['faculty']['faculty_id'])->toBe('CIDS-2026-001')
        ->and($props['faculty']['academic_rank'])->toBe('Assistant Professor I')
        ->and($props['kpis'])->toHaveKeys([
            'compliance_rate',
            'teaching_units',
            'pending_requirements',
            'overdue_requirements',
            'submitted_requirements',
            'verified_requirements',
            'on_time_rate',
        ]);
});

test('faculty profile reflects custom academic period query filters', function () {
    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSIT', 'name' => 'Information Technology']);

    $faculty = Faculty::create([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'program_id' => $program->id,
    ]);

    $response = $this->actingAs($user)
        ->get("/faculties/{$faculty->id}?academic_year=2025-2026&semester=2nd+Semester")
        ->assertOk();

    $props = $response->viewData('page')['props'];
    expect($props['current_period']['academic_year'])->toBe('2025-2026')
        ->and($props['current_period']['semester'])->toBe('2nd Semester');
});

test('editing faculty name updates display without modifying spreadsheet instructor string', function () {
    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSIT', 'name' => 'Information Technology']);

    $faculty = Faculty::create([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'spreadsheet_name' => 'SANTOS, M',
        'program_id' => $program->id,
        'academic_rank' => 'Assistant Professor I',
    ]);

    $schedule = RoomSchedule::factory()->create([
        'room_name' => 'CLR 3',
        'day_of_week' => 'Wednesday',
        'start_time' => '10:00:00',
        'end_time' => '12:00:00',
        'instructor' => 'SANTOS, M',
        'faculty_id' => $faculty->id,
    ]);

    $facility = FacilityMonitoring::create([
        'room_name' => 'CLR 3',
        'room_type' => 'Laboratory',
        'current_class' => 'Web Development',
        'instructor' => 'SANTOS, M',
        'status' => 'In Use',
        'faculty_id' => $faculty->id,
    ]);

    // Update faculty name in Faculty Management
    $response = $this->actingAs($user)
        ->put("/faculties/{$faculty->id}", [
            'first_name' => 'Dr. Maria Clara',
            'last_name' => 'Santos-Roxas',
            'spreadsheet_name' => 'SANTOS, M',
            'program_id' => $program->id,
            'academic_rank' => 'Associate Professor I',
        ]);

    $response->assertRedirect();
    $faculty->refresh();
    $schedule->refresh();
    $facility->refresh();

    // The faculty object is renamed
    expect($faculty->first_name)->toBe('Dr. Maria Clara')
        ->and($faculty->last_name)->toBe('Santos-Roxas')
        ->and($faculty->academic_rank)->toBe('Associate Professor I');

    // Room schedule raw spreadsheet instructor remains intact
    expect($schedule->instructor)->toBe('SANTOS, M')
        ->and($schedule->display_instructor)->toBe('Prof. Dr. Maria Clara Santos-Roxas');

    // Real-time facility monitoring reflects the updated title/name
    expect($facility->instructor)->toBe('Prof. Dr. Maria Clara Santos-Roxas');
});
