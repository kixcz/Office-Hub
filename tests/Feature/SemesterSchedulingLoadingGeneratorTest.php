<?php

use App\Models\AcademicPeriod;
use App\Models\College;
use App\Models\Program;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use App\Services\Scheduling\FacultyLoadingOptimizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('college admin can access loading generator page with scoped data', function () {
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
        ->get(route('schedule.loading-generator'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('schedule/loading/generator')
        ->has('currentPeriod')
        ->has('academicPeriods')
        ->has('facultyPool')
        ->has('offerings')
        ->has('readiness')
        ->has('initialCandidates')
    );
});

test('loading optimization service can build suitability matrix and run cp-sat solver', function () {
    $facultyPool = [
        [
            'id' => 1,
            'name' => 'Alice Smith',
            'specialization' => 'Artificial Intelligence, Software Engineering',
            'target_load' => 12.0,
            'max_load' => 18.0,
        ],
        [
            'id' => 2,
            'name' => 'Bob Jones',
            'specialization' => 'Database Systems, Networking',
            'target_load' => 12.0,
            'max_load' => 18.0,
        ],
    ];

    $offerings = [
        [
            'id' => 101,
            'course_code' => 'IT101',
            'course_title' => 'Intro to IT',
            'section' => 'BSIT 1A',
            'units' => 3.0,
        ],
        [
            'id' => 102,
            'course_code' => 'IT102',
            'course_title' => 'Programming 1',
            'section' => 'BSIT 1B',
            'units' => 3.0,
        ],
    ];

    $service = app(FacultyLoadingOptimizationService::class);
    $matrixData = $service->buildSuitabilityMatrix($facultyPool, $offerings);

    expect($matrixData['matrix'])->toHaveKeys([1, 2]);
    expect($matrixData['breakdown'])->toHaveKeys([1, 2]);

    $candidates = $service->generateCandidatesWithCpSat($facultyPool, $offerings, $matrixData['matrix']);

    expect($candidates)->toHaveCount(3);
    expect($candidates[0]['code'])->toBe('Candidate A');
    expect($candidates[1]['code'])->toBe('Candidate B');
    expect($candidates[2]['code'])->toBe('Candidate C');
    expect($candidates[0]['assignments'])->toHaveCount(2);
});
