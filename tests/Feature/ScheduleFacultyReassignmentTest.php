<?php

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\Faculty;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomSchedule;
use App\Models\Section;
use App\Models\User;
use App\Models\VerifiedSchedule;
use App\Notifications\ScheduleFacultyReassignedNotification;
use Illuminate\Support\Facades\Notification;

test('super admin and lab in-charge can remap faculty on a verified schedule and notify leaders', function () {
    Notification::fake();

    $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
    $deanRole = Role::firstOrCreate(['name' => 'Dean']);
    $programHeadRole = Role::firstOrCreate(['name' => 'Program Head']);
    $labInChargeRole = Role::firstOrCreate(['name' => 'Lab In-Charge']);

    $superAdmin = User::factory()->create(['name' => 'Admin User']);
    $superAdmin->roles()->attach($superAdminRole->id);

    $dean = User::factory()->create(['name' => 'College Dean']);
    $dean->roles()->attach($deanRole->id);

    $programHead = User::factory()->create(['name' => 'BSIS Program Head']);
    $programHead->roles()->attach($programHeadRole->id);

    $labInCharge = User::factory()->create(['name' => 'Lab In-Charge Officer']);
    $labInCharge->roles()->attach($labInChargeRole->id);

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

    $facultyOriginal = Faculty::create([
        'first_name' => 'Domingo',
        'last_name' => 'Origines',
        'employment_type' => 'Full-time',
    ]);

    $facultyReplacement = Faculty::create([
        'first_name' => 'Kaye',
        'last_name' => 'Panaligan',
        'employment_type' => 'Full-time',
    ]);

    $course = Course::create([
        'code' => 'ISSA 611',
        'title' => 'Information Assurance and Security',
        'units' => 3,
    ]);

    $section = Section::create([
        'code' => '1 BSIS B',
        'academic_period_id' => $period->id,
        'year_level' => 1,
    ]);

    $room = Room::create([
        'room_name' => 'COM 1',
        'building' => 'CIDS Main',
        'type' => 'Laboratory',
        'capacity' => 45,
    ]);

    $verifiedSchedule = VerifiedSchedule::create([
        'academic_period_id' => $period->id,
        'faculty_id' => $facultyOriginal->id,
        'course_id' => $course->id,
        'section_id' => $section->id,
        'room_id' => $room->id,
        'day_of_week' => 'Monday',
        'scheduled_start_time' => '07:30:00',
        'scheduled_end_time' => '09:00:00',
        'scheduled_minutes' => 90,
        'status' => 'Active',
    ]);

    $roomSchedule = RoomSchedule::create([
        'room_name' => 'COM 1',
        'day_of_week' => 'Monday',
        'start_time' => '07:30:00',
        'end_time' => '09:00:00',
        'course_code' => 'ISSA 611',
        'course_title' => 'Information Assurance and Security',
        'instructor' => 'Domingo Origines',
        'faculty_id' => $facultyOriginal->id,
        'section' => '1 BSIS B',
    ]);

    // Perform remapping as Lab In-Charge
    $response = $this->actingAs($labInCharge)->post(
        route('lab-in-charge.schedules.reassign-faculty', $verifiedSchedule->id),
        [
            'new_faculty_id' => $facultyReplacement->id,
            'reassignment_type' => 'Substitute / Temporary',
            'reason' => 'Official faculty approved teaching coverage for Domingo V. Origines',
            'effective_date' => '2026-10-20',
        ]
    );

    $response->assertSessionHas('success');

    // 1. Verify VerifiedSchedule is updated
    $verifiedSchedule->refresh();
    expect($verifiedSchedule->faculty_id)->toBe($facultyReplacement->id);

    // 2. Verify RoomSchedule is synced
    $roomSchedule->refresh();
    expect($roomSchedule->faculty_id)->toBe($facultyReplacement->id);
    expect($roomSchedule->instructor)->toContain('Kaye Panaligan');

    // 3. Verify audit record is stored
    $this->assertDatabaseHas('schedule_faculty_reassignments', [
        'verified_schedule_id' => $verifiedSchedule->id,
        'previous_faculty_id' => $facultyOriginal->id,
        'new_faculty_id' => $facultyReplacement->id,
        'changed_by_user_id' => $labInCharge->id,
        'reassignment_type' => 'Substitute / Temporary',
    ]);

    // 4. Verify notifications sent to Super Admin, Dean, and Program Head
    Notification::assertSentTo(
        [$superAdmin, $dean, $programHead],
        ScheduleFacultyReassignedNotification::class,
        function ($notification) use ($verifiedSchedule) {
            $data = $notification->toArray($verifiedSchedule);

            return $data['course_code'] === 'ISSA 611' &&
                   $data['previous_faculty'] === 'Domingo Origines' &&
                   $data['new_faculty'] === 'Kaye Panaligan';
        }
    );
});
