<?php

use App\Models\AcademicPeriod;
use App\Models\College;
use App\Models\Faculty;
use App\Models\LoadingReviewFlag;
use App\Models\Program;
use App\Models\ProgramLoadingReview;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('college admin can view loading review workspace with programs and governance metrics', function () {
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
        ->get(route('schedule.loading-review'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('schedule/loading/review')
        ->has('currentPeriod')
        ->has('summary')
        ->has('programs')
        ->has('facultyLoads')
        ->has('flags')
        ->has('auditHistory')
    );
});

test('program head can endorse program loading to dean', function () {
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

    ProgramLoadingReview::create([
        'academic_period_id' => $period->id,
        'college_id' => $college->id,
        'program_id' => $program->id,
        'status' => 'Pending',
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('schedule.loading-review.endorse-program'), [
            'program_id' => $program->id,
            'notes' => 'Faculty load verified and balanced.',
        ]);

    $response->assertRedirect();

    $review = ProgramLoadingReview::where('program_id', $program->id)->first();
    expect($review->status)->toBe('Completed');
    expect($review->endorsement_notes)->toBe('Faculty load verified and balanced.');
});

test('reviewer can flag an issue and subsequently resolve it', function () {
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
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'employment_type' => 'Full-time',
        'status' => 'Active',
    ]);

    $user = User::factory()->create();

    // 1. Post flag
    $response = $this->actingAs($user)
        ->post(route('schedule.loading-review.flag'), [
            'program_id' => $program->id,
            'faculty_id' => $faculty->id,
            'flag_type' => 'Overload',
            'severity' => 'Needs Attention',
            'comment' => 'Assigned 18 units exceeding standard 15 hrs limit.',
            'suggested_action' => 'Reassign 1 lab section.',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('loading_review_flags', [
        'program_id' => $program->id,
        'faculty_id' => $faculty->id,
        'flag_type' => 'Overload',
        'status' => 'Open',
    ]);

    $flag = LoadingReviewFlag::first();

    // 2. Resolve flag
    $resolveResponse = $this->actingAs($user)
        ->post(route('schedule.loading-review.resolve-flag'), [
            'flag_id' => $flag->id,
            'status' => 'Resolved',
            'resolution_notes' => 'Excess lab section reassigned to junior faculty.',
        ]);

    $resolveResponse->assertRedirect();
    $flag->refresh();
    expect($flag->status)->toBe('Resolved');
    expect($flag->resolution_notes)->toBe('Excess lab section reassigned to junior faculty.');
});
