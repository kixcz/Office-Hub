<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\Submission;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from submissions page', function () {
    $this->get('/compliance/submissions')->assertRedirect('/login');
});

test('authenticated user can view submissions page with pending and completed submissions', function () {
    $user = User::factory()->create();
    $program = Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);
    $faculty1 = Faculty::create(['first_name' => 'Alan', 'last_name' => 'Turing', 'program_id' => $program->id]);
    $faculty2 = Faculty::create(['first_name' => 'Grace', 'last_name' => 'Hopper', 'program_id' => $program->id]);

    $requirement = Requirement::create([
        'title' => 'Course Syllabus',
        'document_type' => 'syllabus',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'due_date' => now()->addDays(7),
        'program_id' => $program->id,
        'reviewer_id' => $user->id,
    ]);

    $completed = Submission::create([
        'requirement_id' => $requirement->id,
        'faculty_id' => $faculty1->id,
        'status' => 'approved',
        'submitted_at' => now(),
    ]);

    $pending = Submission::create([
        'requirement_id' => $requirement->id,
        'faculty_id' => $faculty2->id,
        'status' => 'pending',
        'submitted_at' => null,
    ]);

    $this->actingAs($user)
        ->get('/compliance/submissions')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('compliance/submissions/index')
            ->has('submissions', 1)
            ->has('pendingSubmissions', 1)
            ->has('requirements', 1)
        );
});

test('can bulk record submissions for multiple faculty members', function () {
    $user = User::factory()->create();
    $program = Program::create(['code' => 'BSIT', 'name' => 'Information Technology']);
    $faculty1 = Faculty::create(['first_name' => 'John', 'last_name' => 'Von Neumann', 'program_id' => $program->id]);
    $faculty2 = Faculty::create(['first_name' => 'Ada', 'last_name' => 'Lovelace', 'program_id' => $program->id]);
    $faculty3 = Faculty::create(['first_name' => 'Claude', 'last_name' => 'Shannon', 'program_id' => $program->id]);

    $requirement = Requirement::create([
        'title' => 'Midterm Exam Questions',
        'document_type' => 'exam',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'due_date' => now()->addDays(5),
        'program_id' => $program->id,
        'reviewer_id' => $user->id,
    ]);

    $sub1 = Submission::create([
        'requirement_id' => $requirement->id,
        'faculty_id' => $faculty1->id,
        'status' => 'pending',
        'submitted_at' => null,
    ]);

    $sub2 = Submission::create([
        'requirement_id' => $requirement->id,
        'faculty_id' => $faculty2->id,
        'status' => 'pending',
        'submitted_at' => null,
    ]);

    $sub3 = Submission::create([
        'requirement_id' => $requirement->id,
        'faculty_id' => $faculty3->id,
        'status' => 'pending',
        'submitted_at' => null,
    ]);

    $submittedTime = now()->format('Y-m-d H:i:s');

    $response = $this->actingAs($user)
        ->post('/compliance/submissions/bulk-record', [
            'submission_ids' => [$sub1->id, $sub2->id],
            'submitted_at' => $submittedTime,
            'status' => 'approved',
            'reviewer_comments' => 'Batch verified hardcopies',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $sub1->refresh();
    $sub2->refresh();
    $sub3->refresh();

    expect($sub1->submitted_at)->not->toBeNull()
        ->and($sub1->status)->toBe('approved')
        ->and($sub1->reviewer_comments)->toBe('Batch verified hardcopies')
        ->and($sub2->submitted_at)->not->toBeNull()
        ->and($sub2->status)->toBe('approved')
        ->and($sub2->reviewer_comments)->toBe('Batch verified hardcopies')
        ->and($sub3->submitted_at)->toBeNull()
        ->and($sub3->status)->toBe('pending');
});

test('bulk record validates submission ids and required fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/compliance/submissions/bulk-record', [
            'submission_ids' => [],
            'submitted_at' => '',
            'status' => '',
        ])
        ->assertSessionHasErrors(['submission_ids', 'submitted_at', 'status']);

    $this->actingAs($user)
        ->post('/compliance/submissions/bulk-record', [
            'submission_ids' => [999999],
            'submitted_at' => now()->toISOString(),
            'status' => 'approved',
        ])
        ->assertSessionHasErrors(['submission_ids.0']);
});

test('can update an individual submission', function () {
    $user = User::factory()->create();
    $program = Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);
    $faculty = Faculty::create(['first_name' => 'Katherine', 'last_name' => 'Johnson', 'program_id' => $program->id]);

    $requirement = Requirement::create([
        'title' => 'Grading Sheet',
        'document_type' => 'grades',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'due_date' => now()->addDays(3),
        'program_id' => $program->id,
        'reviewer_id' => $user->id,
    ]);

    $sub = Submission::create([
        'requirement_id' => $requirement->id,
        'faculty_id' => $faculty->id,
        'status' => 'pending',
        'submitted_at' => null,
    ]);

    $response = $this->actingAs($user)
        ->put("/compliance/submissions/{$sub->id}", [
            'submitted_at' => now()->format('Y-m-d H:i:s'),
            'status' => 'approved',
            'reviewer_comments' => 'Single record updated',
        ]);

    $response->assertRedirect();
    $sub->refresh();

    expect($sub->status)->toBe('approved')
        ->and($sub->reviewer_comments)->toBe('Single record updated');
});

test('can revert a completed submission to pending via destroy', function () {
    $user = User::factory()->create();
    $program = Program::create(['code' => 'BSCS', 'name' => 'Computer Science']);
    $faculty = Faculty::create(['first_name' => 'Tim', 'last_name' => 'Berners-Lee', 'program_id' => $program->id]);

    $requirement = Requirement::create([
        'title' => 'Table of Specifications',
        'document_type' => 'tos',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'due_date' => now()->addDays(2),
        'program_id' => $program->id,
        'reviewer_id' => $user->id,
    ]);

    $sub = Submission::create([
        'requirement_id' => $requirement->id,
        'faculty_id' => $faculty->id,
        'status' => 'approved',
        'submitted_at' => now(),
        'reviewer_comments' => 'Initial comment',
    ]);

    $response = $this->actingAs($user)
        ->delete("/compliance/submissions/{$sub->id}");

    $response->assertRedirect();
    $sub->refresh();

    expect($sub->submitted_at)->toBeNull()
        ->and($sub->status)->toBe('pending')
        ->and($sub->reviewer_comments)->toBeNull();
});
