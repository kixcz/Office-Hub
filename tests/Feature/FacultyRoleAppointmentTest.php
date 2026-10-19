<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Role;
use App\Models\User;

test('super admin can appoint a faculty member as program head', function () {
    $admin = User::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'System Administrator']);
    $admin->roles()->attach($adminRole);

    $program = Program::firstOrCreate(
        ['code' => 'BSIT'],
        ['name' => 'Bachelor of Science in Information Technology']
    );

    $faculty = Faculty::factory()->create([
        'program_id' => $program->id,
        'email' => 'juan.delacruz@cids.edu',
    ]);

    $response = $this->actingAs($admin)->post(route('faculties.assign-role', $faculty), [
        'role' => 'Program Head',
        'action' => 'assign',
        'program_id' => $program->id,
    ]);

    $response->assertSessionHas('success');

    $faculty->refresh();
    expect($faculty->user)->not->toBeNull();
    expect($faculty->user->roles->pluck('name')->contains('Program Head'))->toBeTrue();
    expect($faculty->program_id)->toBe($program->id);
});

test('dean can appoint a faculty member as college dean or program head', function () {
    $deanUser = User::factory()->create();
    $deanRole = Role::firstOrCreate(['name' => 'Dean']);
    $deanUser->roles()->attach($deanRole);

    $program = Program::firstOrCreate(
        ['code' => 'BSIS'],
        ['name' => 'Bachelor of Science in Information Systems']
    );

    $faculty = Faculty::factory()->create([
        'program_id' => $program->id,
        'email' => 'maria.clara@cids.edu',
    ]);

    $response = $this->actingAs($deanUser)->post(route('faculties.assign-role', $faculty), [
        'role' => 'Program Head',
        'action' => 'assign',
        'program_id' => $program->id,
    ]);

    $response->assertSessionHas('success');

    $faculty->refresh();
    expect($faculty->user->roles->pluck('name')->contains('Program Head'))->toBeTrue();

    // Now test revoking
    $revokeResponse = $this->actingAs($deanUser)->post(route('faculties.assign-role', $faculty), [
        'role' => 'Program Head',
        'action' => 'revoke',
    ]);

    $revokeResponse->assertSessionHas('success');
    $faculty->refresh();
    expect($faculty->user->roles->pluck('name')->contains('Program Head'))->toBeFalse();
});

test('regular faculty cannot appoint roles', function () {
    $facultyUser = User::factory()->create();
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);
    $facultyUser->roles()->attach($facultyRole);

    $targetFaculty = Faculty::factory()->create();

    $response = $this->actingAs($facultyUser)->post(route('faculties.assign-role', $targetFaculty), [
        'role' => 'Program Head',
        'action' => 'assign',
    ]);

    $response->assertForbidden();
});
