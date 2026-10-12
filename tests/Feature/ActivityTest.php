<?php

use App\Models\Activity;
use App\Models\Program;
use App\Models\User;

test('authenticated user can view activities list', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/schedule/activities')
        ->assertOk();
});

test('authenticated user can create an activity', function () {
    $user = User::factory()->create();
    $program = Program::first() ?? Program::create(['code' => 'BSIT', 'name' => 'IT']);

    $response = $this->actingAs($user)
        ->post('/schedule/activities', [
            'title' => 'Test Tech Workshop',
            'category' => 'Workshop',
            'date' => '2026-10-15',
            'start_time' => '09:00',
            'end_time' => '12:00',
            'venue' => 'Room 301',
            'description' => 'Hands-on programming session',
            'visibility' => 'public',
            'status' => 'Scheduled',
            'program_id' => $program->id,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('activities', [
        'title' => 'Test Tech Workshop',
        'category' => 'Workshop',
    ]);
});

test('authenticated user can edit and update an activity', function () {
    $user = User::factory()->create();
    $activity = Activity::first() ?? Activity::create([
        'title' => 'Initial Title',
        'category' => 'General',
        'date' => '2026-10-16',
        'start_time' => '10:00',
        'end_time' => '11:00',
        'venue' => 'AVR',
        'visibility' => 'public',
        'status' => 'Scheduled',
    ]);

    $response = $this->actingAs($user)
        ->put("/schedule/activities/{$activity->id}", [
            'title' => 'Updated Hackathon Event',
            'category' => 'Competition',
            'date' => '2026-10-17',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'venue' => 'University Gymnasium',
            'description' => 'Annual college hackathon',
            'visibility' => 'public',
            'status' => 'Ongoing',
            'program_id' => null,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('activities', [
        'id' => $activity->id,
        'title' => 'Updated Hackathon Event',
        'category' => 'Competition',
        'status' => 'Ongoing',
    ]);
});
