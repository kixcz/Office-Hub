<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from requirements index', function () {
    $this->get('/compliance/requirements')->assertRedirect('/login');
});

test('authenticated user can view requirements list', function () {
    $user = User::factory()->create();
    $program = Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);

    Requirement::create([
        'title' => 'Syllabus',
        'document_type' => 'syllabus',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'due_date' => now()->addDays(7),
        'program_id' => $program->id,
        'reviewer_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get('/compliance/requirements')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('compliance/requirements/index')
            ->has('requirements', 1)
            ->has('programs', 1)
        );
});

test('user can create a requirement and distributions are created', function () {
    $user = User::factory()->create();
    $program = Program::create(['code' => 'BSIT', 'name' => 'Information Technology']);
    $faculty = Faculty::create(['first_name' => 'John', 'last_name' => 'Doe', 'program_id' => $program->id]);

    $response = $this->actingAs($user)
        ->post('/compliance/requirements', [
            'title' => 'Final Exam TOS',
            'document_type' => 'tos',
            'academic_year' => '2026-2027',
            'semester' => '1st',
            'due_date' => now()->addDays(14)->format('Y-m-d H:i:s'),
            'program_id' => $program->id,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('requirements', [
        'title' => 'Final Exam TOS',
        'program_id' => $program->id,
    ]);

    $req = Requirement::where('title', 'Final Exam TOS')->first();
    expect($req->submissions)->toHaveCount(1)
        ->and($req->submissions->first()->faculty_id)->toBe($faculty->id);
});

test('user can update a requirement', function () {
    $user = User::factory()->create();
    $program1 = Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);
    $program2 = Program::create(['code' => 'BSIS', 'name' => 'Information Systems']);

    $requirement = Requirement::create([
        'title' => 'Draft Syllabus',
        'document_type' => 'syllabus',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'due_date' => now()->addDays(5),
        'program_id' => $program1->id,
        'reviewer_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->put("/compliance/requirements/{$requirement->id}", [
            'title' => 'Updated Final Syllabus',
            'document_type' => 'syllabus',
            'academic_year' => '2026-2027',
            'semester' => '2nd',
            'due_date' => now()->addDays(10)->format('Y-m-d H:i:s'),
            'program_id' => $program2->id,
        ]);

    $response->assertRedirect();
    $requirement->refresh();

    expect($requirement->title)->toBe('Updated Final Syllabus')
        ->and($requirement->semester)->toBe('2nd')
        ->and($requirement->program_id)->toBe($program2->id);
});

test('user can delete a requirement', function () {
    $user = User::factory()->create();
    $program = Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);

    $requirement = Requirement::create([
        'title' => 'Temporary Req',
        'document_type' => 'other',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'due_date' => now()->addDays(2),
        'program_id' => $program->id,
        'reviewer_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->delete("/compliance/requirements/{$requirement->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('requirements', ['id' => $requirement->id]);
});
