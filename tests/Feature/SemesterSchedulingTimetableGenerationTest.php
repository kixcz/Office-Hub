<?php

use App\Models\AcademicPeriod;
use App\Models\College;
use App\Models\Faculty;
use App\Models\FacultyCourseChangeRequest;
use App\Models\FacultyLoadingPublication;
use App\Models\Program;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('timetable constraints page renders readiness gate and loading lock status', function () {
    $college = College::create([
        'code' => 'CIDS',
        'name' => 'College of Information and Digital Sciences',
        'type' => 'college',
    ]);
    $program = Program::create([
        'college_id' => $college->id,
        'code' => 'BSIT',
        'name' => 'Bachelor of Science in Information Technology',
    ]);
    $period = AcademicPeriod::create([
        'academic_year' => '2026-2027',
        'semester' => '1st Semester',
        'code' => '2026-2027-1S',
        'start_date' => '2026-08-01',
        'end_date' => '2026-12-15',
        'class_start_date' => '2026-08-10',
        'class_end_date' => '2026-12-15',
        'is_current' => true,
        'status' => 'active',
    ]);

    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'College Admin'], ['hierarchy_level' => 4, 'portal_type' => 'college_admin']);
    $assignment = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $role->id,
        'scope_level' => 'College',
        'college_scope' => $college->code,
        'status' => 'Active',
    ]);

    $response = $this->actingAs($user)
        ->withSession(['active_role_assignment_id' => $assignment->id])
        ->get(route('schedule.timetable.constraints'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('schedule/timetable/constraints')
        ->has('loadingGate')
    );
});

test('faculty course swap request can be submitted and forwarded to counterpart', function () {
    $college = College::create([
        'code' => 'CIDS',
        'name' => 'College of Information and Digital Sciences',
        'type' => 'college',
    ]);
    $program = Program::create([
        'college_id' => $college->id,
        'code' => 'BSIT',
        'name' => 'Bachelor of Science in Information Technology',
    ]);
    $period = AcademicPeriod::create([
        'academic_year' => '2026-2027',
        'semester' => '1st Semester',
        'code' => '2026-2027-1S',
        'start_date' => '2026-08-01',
        'end_date' => '2026-12-15',
        'class_start_date' => '2026-08-10',
        'class_end_date' => '2026-12-15',
        'is_current' => true,
        'status' => 'active',
    ]);

    $facultyA = Faculty::create([
        'program_id' => $program->id,
        'first_name' => 'Alice',
        'last_name' => 'Smith',
        'employment_type' => 'Full-time',
        'status' => 'Active',
    ]);
    $facultyB = Faculty::create([
        'program_id' => $program->id,
        'first_name' => 'Bob',
        'last_name' => 'Jones',
        'employment_type' => 'Full-time',
        'status' => 'Active',
    ]);

    $pub = FacultyLoadingPublication::create([
        'academic_period_id' => $period->id,
        'college_id' => $college->id,
        'version' => 'v1',
        'title' => 'Faculty Loading v1',
        'status' => 'Published for Faculty Review',
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('schedule.timetable.course-change-request'), [
        'request_type' => 'Course Transfer',
        'target_faculty_id' => $facultyB->id,
        'reason' => 'Research conflict schedule.',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('faculty_course_change_requests', [
        'publication_id' => $pub->id,
        'target_faculty_id' => $facultyB->id,
        'status' => 'Pending Counterpart',
    ]);

    $req = FacultyCourseChangeRequest::first();

    // Counterpart responds Accept
    $resAccept = $this->actingAs($user)->post(route('schedule.timetable.course-change-respond'), [
        'request_id' => $req->id,
        'response' => 'Accept',
    ]);
    $resAccept->assertRedirect();
    $req->refresh();
    expect($req->status)->toBe('Under Program Head Review');

    // Program Head approves
    $resApprove = $this->actingAs($user)->post(route('schedule.timetable.course-change-decide'), [
        'request_id' => $req->id,
        'decision' => 'Approve',
        'notes' => 'Workload rules verified.',
    ]);
    $resApprove->assertRedirect();
    $req->refresh();
    expect($req->status)->toBe('Approved');
});
