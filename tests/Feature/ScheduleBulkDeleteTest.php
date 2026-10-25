<?php

use App\Models\Activity;
use App\Models\Meeting;
use App\Models\User;

test('super admin can multiple select and bulk delete meetings', function () {
    $user = User::factory()->create();

    $meeting1 = Meeting::create([
        'title' => 'Meeting 1',
        'date' => '2026-10-26',
        'start_time' => '09:00:00',
        'end_time' => '10:00:00',
        'venue' => 'Room A',
        'status' => 'Scheduled',
        'organizer_id' => $user->id,
    ]);

    $meeting2 = Meeting::create([
        'title' => 'Meeting 2',
        'date' => '2026-10-27',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'venue' => 'Room B',
        'status' => 'Scheduled',
        'organizer_id' => $user->id,
    ]);

    $meeting3 = Meeting::create([
        'title' => 'Meeting 3 to keep',
        'date' => '2026-10-28',
        'start_time' => '14:00:00',
        'end_time' => '15:00:00',
        'venue' => 'Room C',
        'status' => 'Scheduled',
        'organizer_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->post(route('schedule.meetings.bulk-delete'), [
            'ids' => [$meeting1->id, $meeting2->id],
        ]);

    $response->assertSessionHas('success');
    expect(Meeting::find($meeting1->id))->toBeNull();
    expect(Meeting::find($meeting2->id))->toBeNull();
    expect(Meeting::find($meeting3->id))->not->toBeNull();
});

test('super admin can multiple select and bulk delete activities', function () {
    $user = User::factory()->create();

    $activity1 = Activity::create([
        'title' => 'Activity 1',
        'category' => 'Event',
        'date' => '2026-10-26',
        'start_time' => '08:00:00',
        'end_time' => '12:00:00',
        'venue' => 'Gym',
        'visibility' => 'public',
        'status' => 'Scheduled',
    ]);

    $activity2 = Activity::create([
        'title' => 'Activity 2',
        'category' => 'Workshop',
        'date' => '2026-10-27',
        'start_time' => '13:00:00',
        'end_time' => '17:00:00',
        'venue' => 'Lab 1',
        'visibility' => 'public',
        'status' => 'Scheduled',
    ]);

    $activity3 = Activity::create([
        'title' => 'Activity 3 to keep',
        'category' => 'Seminar',
        'date' => '2026-10-28',
        'start_time' => '09:00:00',
        'end_time' => '11:00:00',
        'venue' => 'AVR',
        'visibility' => 'public',
        'status' => 'Scheduled',
    ]);

    $response = $this->actingAs($user)
        ->post(route('schedule.activities.bulk-delete'), [
            'ids' => [$activity1->id, $activity2->id],
        ]);

    $response->assertSessionHas('success');
    expect(Activity::find($activity1->id))->toBeNull();
    expect(Activity::find($activity2->id))->toBeNull();
    expect(Activity::find($activity3->id))->not->toBeNull();
});
