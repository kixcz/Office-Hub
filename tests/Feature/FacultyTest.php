<?php

use App\Models\Faculty;
use App\Models\Program;
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
