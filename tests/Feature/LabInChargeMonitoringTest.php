<?php

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\Faculty;
use App\Models\LabInChargeAssignment;
use App\Models\Role;
use App\Models\Room;
use App\Models\Section;
use App\Models\User;
use App\Models\VerifiedSchedule;

test('lab in-charge workspace loads with operational data and without admin controls', function () {
    $user = User::factory()->create(['email' => 'test-labincharge@cids.edu']);

    $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
    $user->roles()->syncWithoutDetaching([$role->id]);

    $room = Room::firstOrCreate(
        ['room_name' => 'CLR 3'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );

    LabInChargeAssignment::firstOrCreate(
        ['user_id' => $user->id, 'room_id' => $room->id],
        ['shift_name' => 'Day Shift', 'role_type' => 'Primary', 'assigned_days' => 'Monday–Saturday', 'is_active' => true]
    );

    $response = $this->actingAs($user)->get(route('lab-in-charge.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('monitoring/lab-in-charge/index')
        ->has('roomStatusBoard', 1)
        ->where('roomStatusBoard.0.room_name', 'CLR 3')
        ->has('actionRequired')
        ->has('kpi')
        ->has('sessionsList')
        ->has('timetablesByRoom')
        ->has('myAssignedLabs', 1)
    );
});

test('lab in-charge only sees schedules and timetables for assigned labs', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
    $user->roles()->syncWithoutDetaching([$role->id]);

    $room1 = Room::firstOrCreate(
        ['room_name' => 'CLR 1'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );
    $room2 = Room::firstOrCreate(
        ['room_name' => 'CLR 2'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );

    // Only assign room1 to user
    LabInChargeAssignment::create([
        'user_id' => $user->id,
        'room_id' => $room1->id,
        'shift_name' => 'Day Shift',
        'role_type' => 'Primary',
        'assigned_days' => 'Monday–Saturday',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->get(route('lab-in-charge.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('monitoring/lab-in-charge/index')
        ->has('assignedRooms', 1)
        ->where('assignedRooms.0.id', $room1->id)
        ->has('roomStatusBoard', 1)
        ->where('roomStatusBoard.0.room_name', 'CLR 1')
    );
});

test('lab in-charge can record actual live observation with auto-calculated late minutes', function () {
    $user = User::factory()->create();
    $period = AcademicPeriod::first() ?? AcademicPeriod::create([
        'academic_year' => '2026 – 2027',
        'semester' => '1st Semester',
        'code' => 'AY2627-1S',
        'start_date' => '2026-08-01',
        'end_date' => '2026-12-18',
        'class_start_date' => '2026-08-10',
        'class_end_date' => '2026-12-18',
        'is_current' => true,
    ]);

    $faculty = Faculty::first() ?? Faculty::create([
        'first_name' => 'Kaye',
        'last_name' => 'Panaligan',
        'employment_type' => 'Full-time',
    ]);

    $course = Course::firstOrCreate(
        ['code' => 'ISEL 601'],
        ['title' => 'Information Systems', 'academic_period_id' => $period->id, 'units' => 3]
    );

    $section = Section::firstOrCreate(
        ['code' => 'BSIS-3A'],
        ['name' => 'BSIS-3A', 'academic_period_id' => $period->id]
    );

    $room = Room::firstOrCreate(
        ['room_name' => 'CLR 3'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );

    $verified = VerifiedSchedule::create([
        'academic_period_id' => $period->id,
        'faculty_id' => $faculty->id,
        'course_id' => $course->id,
        'section_id' => $section->id,
        'room_id' => $room->id,
        'session_type' => 'Laboratory',
        'day_of_week' => 'Monday',
        'scheduled_start_time' => '09:00:00',
        'scheduled_end_time' => '10:30:00',
        'scheduled_minutes' => 90,
        'status' => 'Active',
    ]);

    $postData = [
        'verified_schedule_id' => $verified->id,
        'room_id' => $room->id,
        'actual_start_time' => '09:12',
        'actual_end_time' => '10:30',
        'observation_status' => 'Late Start',
        'room_condition' => 'In Use as Scheduled',
        'session_outcome' => 'Late Start',
        'student_headcount' => 38,
        'remarks' => 'Students arrived on time; class started 12m late due to projector connection setup.',
    ];

    $response = $this->actingAs($user)->post(route('lab-in-charge.observation'), $postData);

    $response->assertRedirect();

    $this->assertDatabaseHas('lab_monitoring_sessions', [
        'verified_schedule_id' => $verified->id,
        'room_id' => $room->id,
        'late_minutes' => 12,
        'student_headcount' => 38,
        'room_condition' => 'In Use as Scheduled',
        'session_outcome' => 'Late Start',
    ]);
});
