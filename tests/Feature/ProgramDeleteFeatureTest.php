<?php

use App\Models\Course;
use App\Models\Curriculum;
use App\Models\CurriculumCourse;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

test('super admin can successfully delete a program and its associated curricula', function () {
    $admin = User::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'System Administrator']);
    $admin->roles()->attach($adminRole);

    $program = Program::create([
        'code' => 'BSDELETE',
        'name' => 'Program to be deleted',
        'degree_level' => "Bachelor's Degree",
        'department' => 'College of Information and Digital Sciences',
        'duration_years' => 4,
        'status' => 'Active',
    ]);

    $curriculum = Curriculum::create([
        'program_id' => $program->id,
        'version_name' => '2026 Test Curriculum',
        'effective_year' => '2026',
        'total_units' => 140,
        'status' => 'Active',
        'is_active' => true,
    ]);

    $course = Course::create([
        'code' => 'TEST 101',
        'title' => 'Test Course',
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
    ]);

    $curriculumCourse = CurriculumCourse::create([
        'curriculum_id' => $curriculum->id,
        'course_id' => $course->id,
        'year_level' => 1,
        'semester_placement' => '1st Semester',
        'requirement_type' => 'Required',
    ]);

    $faculty = Faculty::factory()->create([
        'program_id' => $program->id,
    ]);

    $section = Section::create([
        'code' => 'BSDEL-1A',
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'population' => 30,
        'status' => 'Active',
    ]);

    $response = $this->withoutMiddleware(ValidateCsrfToken::class)
        ->actingAs($admin)
        ->delete(route('programs.destroy', $program));

    $response->assertRedirect(route('programs.index'));
    $response->assertSessionHas('success');

    // Verify program was deleted
    expect(Program::find($program->id))->toBeNull();

    // Verify curricula and curriculum courses were deleted
    expect(Curriculum::find($curriculum->id))->toBeNull();
    expect(CurriculumCourse::find($curriculumCourse->id))->toBeNull();

    // Verify related courses, sections, and faculties have their program_id dissociated cleanly
    $course->refresh();
    expect($course->program_id)->toBeNull();

    $faculty->refresh();
    expect($faculty->program_id)->toBeNull();

    $section->refresh();
    expect($section->program_id)->toBeNull();
});
