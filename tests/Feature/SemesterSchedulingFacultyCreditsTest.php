<?php

use App\Models\AcademicPeriod;
use App\Models\College;
use App\Models\Faculty;
use App\Models\FacultyCredit;
use App\Models\Program;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('college admin can view faculty credits page and create, update, delete credit records', function () {
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
        'first_name' => 'Domingo',
        'last_name' => 'Origines',
        'faculty_id' => 'FAC-001',
        'academic_rank' => 'Assistant Professor I',
        'status' => 'Active',
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
    $user->update(['default_role_assignment_id' => $assignment->id]);

    // 1. Visit /schedule/credits
    $response = $this->actingAs($user)
        ->withSession(['active_scoped_role_assignment_id' => $assignment->id])
        ->get(route('schedule.credits'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('schedule/credits/index')
            ->has('credits')
            ->has('stats')
        );

    // 2. Store a new FacultyCredit
    $storeResponse = $this->actingAs($user)
        ->withSession(['active_scoped_role_assignment_id' => $assignment->id])
        ->post(route('schedule.credits.store'), [
            'faculty_id' => $faculty->id,
            'academic_period_id' => $period->id,
            'category' => 'Designation',
            'credited_units' => 6.0,
            'reference_memo' => 'Program Head (BSIT)',
            'status' => 'Approved',
        ]);

    $storeResponse->assertRedirect();
    $this->assertDatabaseHas('faculty_credits', [
        'faculty_id' => $faculty->id,
        'category' => 'Designation',
        'credited_units' => 6.0,
        'reference_memo' => 'Program Head (BSIT)',
    ]);

    $credit = FacultyCredit::where('faculty_id', $faculty->id)->first();

    // 3. Update the credit
    $updateResponse = $this->actingAs($user)
        ->withSession(['active_scoped_role_assignment_id' => $assignment->id])
        ->put(route('schedule.credits.update', $credit), [
            'category' => 'Designation',
            'credited_units' => 9.0,
            'reference_memo' => 'Dean Workload Credit',
            'status' => 'Approved',
        ]);

    $updateResponse->assertRedirect();
    $this->assertDatabaseHas('faculty_credits', [
        'id' => $credit->id,
        'credited_units' => 9.0,
        'reference_memo' => 'Dean Workload Credit',
    ]);

    // 4. Delete the credit
    $deleteResponse = $this->actingAs($user)
        ->withSession(['active_scoped_role_assignment_id' => $assignment->id])
        ->delete(route('schedule.credits.destroy', $credit));

    $deleteResponse->assertRedirect();
    $this->assertDatabaseMissing('faculty_credits', ['id' => $credit->id]);

    // 5. Update Load Policies
    $policyResponse = $this->actingAs($user)
        ->withSession(['active_scoped_role_assignment_id' => $assignment->id])
        ->post(route('schedule.policies.update'), [
            'standard_load' => 12.0,
            'min_load' => 9.0,
            'max_load' => 18.0,
            'enforce_min_max' => true,
            'consider_credits' => true,
            'check_specialization' => true,
            'version' => 'Version 3',
        ]);

    $policyResponse->assertRedirect();
    $period->refresh();
    expect($period->planning_rules_version)->toBe('Version 3');
});
