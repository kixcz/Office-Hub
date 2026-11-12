<?php

use App\Models\College;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Role;
use App\Models\Room;
use App\Models\ScopedRoleAssignment;
use App\Models\User;

beforeEach(function () {
    // Ensure colleges exist
    $this->cids = College::firstOrCreate(
        ['code' => 'CIDS'],
        ['name' => 'College of Information and Digital Sciences', 'status' => 'Active']
    );

    $this->ced = College::firstOrCreate(
        ['code' => 'CED'],
        ['name' => 'College of Education', 'status' => 'Active']
    );

    // Programs
    $this->bsit = Program::firstOrCreate(
        ['code' => 'BSIT'],
        ['name' => 'Bachelor of Science in Information Technology', 'college_id' => $this->cids->id, 'status' => 'Active']
    );

    $this->bsed = Program::firstOrCreate(
        ['code' => 'BSED'],
        ['name' => 'Bachelor of Secondary Education', 'college_id' => $this->ced->id, 'status' => 'Active']
    );

    // Create Faculty in each college
    $this->facultyCids = Faculty::firstOrCreate(
        ['email' => 'fac.cids@test.edu'],
        [
            'first_name' => 'Alan',
            'last_name' => 'Turing',
            'program_id' => $this->bsit->id,
            'specialization' => 'Computer Science',
            'status' => 'Active',
        ]
    );

    $this->facultyCed = Faculty::firstOrCreate(
        ['email' => 'fac.ced@test.edu'],
        [
            'first_name' => 'John',
            'last_name' => 'Dewey',
            'program_id' => $this->bsed->id,
            'specialization' => 'Curriculum Studies',
            'status' => 'Active',
        ]
    );

    // Create Rooms in each college
    $this->roomCids = Room::firstOrCreate(
        ['room_code' => 'TEST-CIDS-101'],
        [
            'college_id' => $this->cids->id,
            'room_name' => 'CLR Test 1',
            'building' => 'CIDS Wing',
            'type' => 'Laboratory',
            'capacity' => 40,
            'status' => 'Available',
            'operational_status' => 'Available',
        ]
    );

    $this->roomCed = Room::firstOrCreate(
        ['room_code' => 'TEST-CED-101'],
        [
            'college_id' => $this->ced->id,
            'room_name' => 'Speech Lab Test',
            'building' => 'CED Hall',
            'type' => 'Laboratory',
            'capacity' => 35,
            'status' => 'Available',
            'operational_status' => 'Available',
        ]
    );

    // Create College Admin User for CIDS
    $this->collegeAdminRole = Role::firstOrCreate(
        ['name' => 'College Administrator / Secretary'],
        ['hierarchy_level' => 4, 'portal_type' => 'college']
    );

    $this->collegeAdminUser = User::factory()->create([
        'email' => 'test.collegeadmin@cids.edu',
    ]);

    ScopedRoleAssignment::create([
        'user_id' => $this->collegeAdminUser->id,
        'role_id' => $this->collegeAdminRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'College',
        'scope_type' => 'College',
        'scope_id' => $this->cids->id,
        'status' => 'Active',
    ]);

    // Create VPAA User
    $this->vpaaRole = Role::firstOrCreate(
        ['name' => 'VPAA / Academic Executive'],
        ['hierarchy_level' => 2, 'portal_type' => 'vpaa']
    );

    $this->vpaaUser = User::factory()->create([
        'email' => 'test.vpaa@dssc.edu.ph',
    ]);

    ScopedRoleAssignment::create([
        'user_id' => $this->vpaaUser->id,
        'role_id' => $this->vpaaRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'Institution',
        'scope_type' => 'Institution',
        'status' => 'Active',
    ]);
});

test('college admin only sees programs within their college in scheduling master data', function () {
    $response = $this->actingAs($this->collegeAdminUser)->get(route('schedule.master-data.programs'));
    $response->assertOk();

    $programs = $response->viewData('page')['props']['programs'];
    $programCodes = collect($programs)->pluck('code')->all();

    expect($programCodes)->toContain('BSIT');
    expect($programCodes)->not->toContain('BSED');
});

test('college admin only sees faculty within their college in master data', function () {
    $response = $this->actingAs($this->collegeAdminUser)->get(route('schedule.master-data.faculty'));
    $response->assertOk();

    $faculties = $response->viewData('page')['props']['faculties'];
    $emails = collect($faculties)->pluck('email')->all();

    expect($emails)->toContain('fac.cids@test.edu');
    expect($emails)->not->toContain('fac.ced@test.edu');
});

test('college admin only sees rooms within their college in room inventory', function () {
    $response = $this->actingAs($this->collegeAdminUser)->get(route('schedule.master-data.rooms'));
    $response->assertOk();

    $roomsProp = $response->viewData('page')['props']['rooms'];
    $rooms = isset($roomsProp['data']) ? $roomsProp['data'] : $roomsProp;
    $roomNames = collect($rooms)->pluck('room_name')->all();

    expect($roomNames)->toContain('CLR Test 1');
    expect($roomNames)->not->toContain('Speech Lab Test');
});

test('vpaa retains institution-wide visibility across all colleges', function () {
    $response = $this->actingAs($this->vpaaUser)->get(route('schedule.master-data.programs'));
    $response->assertOk();

    $programs = $response->viewData('page')['props']['programs'];
    $programCodes = collect($programs)->pluck('code')->all();

    expect($programCodes)->toContain('BSIT', 'BSED');
});
