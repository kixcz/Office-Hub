<?php

use App\Models\AcademicPeriod;
use App\Models\College;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('college admin can access master data programs and curriculum module', function () {
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
        ->get(route('schedule.master-data.programs'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('schedule/master-data/programs/index')
        ->has('programs')
    );
});

test('college admin can access master data courses catalog and sections cohorts', function () {
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

    // Courses route
    $resCourses = $this->actingAs($user)
        ->withSession(['active_role_assignment_id' => $assignment->id])
        ->get(route('schedule.master-data.courses'));

    $resCourses->assertOk();
    $resCourses->assertInertia(fn ($page) => $page->component('schedule/master-data/courses/index')->has('courses'));

    // Sections route
    $resSections = $this->actingAs($user)
        ->withSession(['active_role_assignment_id' => $assignment->id])
        ->get(route('schedule.master-data.sections'));

    $resSections->assertOk();
    $resSections->assertInertia(fn ($page) => $page->component('schedule/master-data/sections/index')->has('sections'));
});

test('faculty workload targets and preferences can be updated for scheduling optimization', function () {
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

    $faculty = Faculty::create([
        'program_id' => $program->id,
        'first_name' => 'Kaye',
        'last_name' => 'Panaligan',
        'employment_type' => 'Full-time',
        'status' => 'Active',
    ]);

    $user = User::factory()->create();

    // Update workload targets
    $res = $this->actingAs($user)->post(route('schedule.master-data.faculty.load-targets'), [
        'faculty_id' => $faculty->id,
        'min_load_hours' => 9.0,
        'target_load_hours' => 12.0,
        'max_load_hours' => 16.0,
    ]);

    $res->assertRedirect();
    $faculty->refresh();
    expect((float) $faculty->min_load_hours)->toBe(9.0);
    expect((float) $faculty->target_load_hours)->toBe(12.0);
    expect((float) $faculty->max_load_hours)->toBe(16.0);
});
