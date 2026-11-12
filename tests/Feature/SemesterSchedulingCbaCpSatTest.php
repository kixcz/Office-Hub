<?php

use App\Models\College;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Role;
use App\Models\RoomSchedule;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use App\Services\Scheduling\FacultyLoadingOptimizationService;
use Database\Seeders\CbaSemesterScheduleSeeder;

test('cba college data is properly seeded and cp-sat solver generates candidates', function () {
    $this->seed(CbaSemesterScheduleSeeder::class);

    $college = College::where('code', 'CBA')->first();
    expect($college)->not->toBeNull();

    $faculties = Faculty::whereHas('program', fn ($q) => $q->where('college_id', $college->id))
        ->with(['program', 'specializations', 'preferences', 'availabilities'])
        ->get();

    expect($faculties->count())->toBeGreaterThanOrEqual(15);

    $facultyPool = $faculties->map(fn ($f) => [
        'id' => $f->id,
        'name' => $f->title_name ?? $f->full_name,
        'program_code' => $f->program?->code ?? 'CBA',
        'target_load' => (float) ($f->target_load_hours ?? 12.0),
        'min_load' => (float) ($f->min_load_hours ?? 9.0),
        'max_load' => (float) ($f->max_load_hours ?? 18.0),
        'max_preps' => 3,
        'specialization' => $f->specialization ?: 'Business Administration',
        'specialization_tags' => $f->specializations->pluck('expertise_area')->toArray(),
    ])->toArray();

    $programCodes = Program::where('college_id', $college->id)->pluck('code')->toArray();
    $offerings = RoomSchedule::where(function ($q) use ($programCodes) {
        foreach ($programCodes as $c) {
            $q->orWhere('section', 'like', '%'.$c.'%');
        }
    })->take(20)->get()->map(fn ($s) => [
        'id' => $s->id,
        'course_code' => $s->course_code,
        'course_title' => $s->course_title,
        'section' => $s->section,
        'units' => 3.0,
        'is_lab' => str_contains(strtolower($s->room_name ?? ''), 'lab'),
    ])->toArray();

    expect(count($offerings))->toBeGreaterThanOrEqual(10);

    $service = new FacultyLoadingOptimizationService;
    $matrixData = $service->buildSuitabilityMatrix($facultyPool, $offerings);

    expect($matrixData['matrix'])->not->toBeEmpty();

    $candidates = $service->generateCandidatesWithCpSat($facultyPool, $offerings, $matrixData['matrix']);

    expect($candidates)->toHaveCount(3);
    expect($candidates[0]['code'])->toBe('Candidate A');
    expect($candidates[0]['conflicts'])->toBe(0);
    expect($candidates[0]['assignments'])->not->toBeEmpty();
});

test('cba admin can request loading generator for cba and run solver endpoint', function () {
    $this->seed(CbaSemesterScheduleSeeder::class);

    $college = College::where('code', 'CBA')->first();
    $user = User::where('email', 'cba.admin@dssc.edu.ph')->first() ?? User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'College Admin'], ['hierarchy_level' => 4, 'portal_type' => 'college_admin']);
    $assignment = ScopedRoleAssignment::firstOrCreate(
        [
            'user_id' => $user->id,
            'role_id' => $role->id,
            'college_id' => $college->id,
        ],
        [
            'institution' => 'DSSC-MAIN',
            'scope_level' => 'College',
            'status' => 'Active',
        ]
    );
    $user->update(['default_role_assignment_id' => $assignment->id]);

    // Test GET /schedule/loading-generator with CBA scope
    $response = $this->actingAs($user)
        ->withSession(['active_scoped_role_assignment_id' => $assignment->id])
        ->get(route('schedule.loading-generator', ['college_id' => $college->id]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('schedule/loading/generator')
            ->has('facultyPool')
            ->has('offerings')
            ->has('initialCandidates')
        );

    // Test POST /schedule/loading-generator/run
    $runResponse = $this->actingAs($user)
        ->withSession(['active_scoped_role_assignment_id' => $assignment->id])
        ->postJson(route('schedule.loading-generator.run'), [
            'college_id' => $college->id,
            'weights' => [
                'specialization' => 40,
                'historical' => 20,
                'preferred' => 15,
                'department' => 15,
                'availability' => 10,
            ],
            'options' => [
                'balance_load' => true,
            ],
        ]);

    $runResponse->assertOk()
        ->assertJson([
            'status' => 'success',
        ])
        ->assertJsonStructure([
            'status',
            'candidates',
        ]);
});
