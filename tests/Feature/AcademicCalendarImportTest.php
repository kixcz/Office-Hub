<?php

use App\Models\AcademicCalendarImportBatch;
use App\Models\AcademicCalendarImportEvent;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('academic calendar import page renders with initial queue', function () {
    $response = $this->get(route('schedule.calendar.import'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('schedule/calendar/import')
        ->has('currentBatch')
        ->has('events')
        ->has('rules')
        ->has('stats')
    );
});

test('can upload an official academic calendar and extract events', function () {
    Storage::fake('local');

    $file = UploadedFile::fake()->createWithContent('Official_Calendar_AY2026.txt', "October 12–17 – Midterm Examinations\nSecond week of November – Research Week\nNovember 30 – Bonifacio Day (National Regular Holiday)");

    $response = $this->post(route('schedule.calendar.import.upload'), [
        'academic_year' => 'AY 2026–2027',
        'semester_scope' => 'Whole Academic Year',
        'institution' => 'CIDS - College of Information and Computing Sciences',
        'calendar_file' => $file,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('academic_calendar_import_batches', [
        'academic_year' => 'AY 2026–2027',
        'semester_scope' => 'Whole Academic Year',
    ]);

    $batch = AcademicCalendarImportBatch::latest()->first();
    expect($batch->events()->count())->toBeGreaterThan(0);
});

test('approving candidate event promotes it to official calendar', function () {
    $batch = AcademicCalendarImportBatch::create([
        'academic_year' => 'AY 2026–2027',
        'semester_scope' => '1st Semester',
        'institution' => 'CIDS',
        'original_filename' => 'sample.pdf',
        'file_path' => 'sample.pdf',
        'file_type' => 'pdf',
        'status' => 'pending_review',
        'created_by' => $this->user->id,
    ]);

    $event = AcademicCalendarImportEvent::create([
        'batch_id' => $batch->id,
        'title' => 'Midterm Examinations',
        'category' => 'examination',
        'semester' => '1st Semester',
        'start_date' => '2026-10-12',
        'end_date' => '2026-10-17',
        'confidence_score' => 98.0,
        'validation_status' => 'valid',
        'proposed_scheduling_effect' => 'CALENDAR_TV_RESTRICTION',
        'status' => 'pending',
    ]);

    $response = $this->post(route('schedule.calendar.import.approve', $event), [
        'confirmed_scheduling_effect' => 'CALENDAR_TV_RESTRICTION',
    ]);

    $response->assertRedirect();
    $event->refresh();

    expect($event->status)->toBe('approved');
    expect($event->destination_type)->toBe('Activity');
    $this->assertDatabaseHas('activities', [
        'id' => $event->destination_id,
        'title' => 'Midterm Examinations',
    ]);
});

test('faculty deadline event promotes to requirements compliance tracker', function () {
    $batch = AcademicCalendarImportBatch::create([
        'academic_year' => 'AY 2026–2027',
        'semester_scope' => '1st Semester',
        'institution' => 'CIDS',
        'original_filename' => 'sample.pdf',
        'file_path' => 'sample.pdf',
        'file_type' => 'pdf',
        'status' => 'pending_review',
        'created_by' => $this->user->id,
    ]);

    $event = AcademicCalendarImportEvent::create([
        'batch_id' => $batch->id,
        'title' => 'Deadline: Midterm Rubrics Submission',
        'category' => 'faculty_deadline',
        'semester' => '1st Semester',
        'start_date' => '2026-10-10',
        'confidence_score' => 95.0,
        'validation_status' => 'valid',
        'proposed_scheduling_effect' => 'CALENDAR_REMINDER',
        'status' => 'pending',
    ]);

    $response = $this->post(route('schedule.calendar.import.approve', $event));

    $response->assertRedirect();
    $event->refresh();

    expect($event->status)->toBe('approved');
    expect($event->destination_type)->toBe('Requirement');
    $this->assertDatabaseHas('requirements', [
        'id' => $event->destination_id,
        'title' => 'Deadline: Midterm Rubrics Submission',
    ]);
});

test('batch rollback cleans up promoted records from official calendar', function () {
    $batch = AcademicCalendarImportBatch::create([
        'academic_year' => 'AY 2026–2027',
        'semester_scope' => '1st Semester',
        'institution' => 'CIDS',
        'original_filename' => 'sample.pdf',
        'file_path' => 'sample.pdf',
        'file_type' => 'pdf',
        'status' => 'pending_review',
        'created_by' => $this->user->id,
    ]);

    $activity = Activity::create([
        'title' => 'Imported Temporary Event',
        'category' => 'holiday',
        'date' => '2026-11-30',
        'start_time' => '08:00:00',
        'end_time' => '17:00:00',
    ]);

    $event = AcademicCalendarImportEvent::create([
        'batch_id' => $batch->id,
        'title' => 'Imported Temporary Event',
        'category' => 'holiday',
        'semester' => '1st Semester',
        'start_date' => '2026-11-30',
        'confidence_score' => 99.0,
        'validation_status' => 'valid',
        'proposed_scheduling_effect' => 'BLOCK_ALL_CLASSES',
        'confirmed_scheduling_effect' => 'BLOCK_ALL_CLASSES',
        'status' => 'approved',
        'destination_type' => 'Activity',
        'destination_id' => $activity->id,
    ]);

    $response = $this->post(route('schedule.calendar.import.rollback', $batch));

    $response->assertRedirect();
    $this->assertDatabaseMissing('activities', [
        'id' => $activity->id,
    ]);

    $batch->refresh();
    expect($batch->status)->toBe('rolled_back');
});
