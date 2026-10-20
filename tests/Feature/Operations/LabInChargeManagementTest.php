<?php

use App\Models\LabInChargeAssignment;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;

test('super admin can view operations lab in-charge management dashboard and kpis', function () {
    $admin = User::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'System Administrator']);
    $admin->roles()->syncWithoutDetaching([$adminRole->id]);

    $room = Room::firstOrCreate(
        ['room_name' => 'CLR 1'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );

    $monitor = User::factory()->create(['name' => 'Alice LabMonitor', 'email' => 'alice@cids.edu']);
    $labRole = Role::firstOrCreate(['name' => 'Lab In-Charge']);
    $monitor->roles()->syncWithoutDetaching([$labRole->id]);

    LabInChargeAssignment::firstOrCreate(
        ['user_id' => $monitor->id, 'room_id' => $room->id],
        [
            'role_type' => 'Primary',
            'shift_name' => 'Full Day Shift',
            'assigned_days' => 'Monday–Saturday',
            'is_active' => true,
            'status' => 'Active',
        ]
    );

    $response = $this->actingAs($admin)->get(route('operations.lab-in-charge.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('operations/lab-in-charge/index')
        ->has('kpis')
        ->has('assignments')
        ->has('laboratories')
        ->has('laboratoryProfiles')
        ->has('userProfiles')
        ->has('collegeWideSessions')
        ->has('collegeEodReports')
        ->has('recentAudits')
    );
});

test('super admin can assign a laboratory to a named user with audit trail', function () {
    $admin = User::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'System Administrator']);
    $admin->roles()->syncWithoutDetaching([$adminRole->id]);

    $room = Room::firstOrCreate(
        ['room_name' => 'CLR 2'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );

    $user = User::factory()->create(['name' => 'Bob Monitor', 'email' => 'bob@cids.edu']);

    $response = $this->actingAs($admin)->post(route('operations.lab-in-charge.assignments.store'), [
        'user_id' => $user->id,
        'room_ids' => [$room->id],
        'role_type' => 'Primary',
        'shift_name' => 'Morning Shift (07:30 AM – 12:30 PM)',
        'shift_start_time' => '07:30:00',
        'shift_end_time' => '12:30:00',
        'assigned_days' => 'Monday–Saturday',
        'effective_from' => '2026-08-10',
        'effective_until' => '2026-12-18',
        'notes' => 'Designated morning laboratory supervisor.',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('lab_in_charge_assignments', [
        'user_id' => $user->id,
        'room_id' => $room->id,
        'role_type' => 'Primary',
        'is_active' => true,
        'status' => 'Active',
    ]);

    $this->assertDatabaseHas('lab_in_charge_assignment_audits', [
        'room_id' => $room->id,
        'new_user_id' => $user->id,
        'action_type' => 'Assign Laboratory',
    ]);
});

test('super admin can add a temporary coverage reliever without deleting past records', function () {
    $admin = User::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'System Administrator']);
    $admin->roles()->syncWithoutDetaching([$adminRole->id]);

    $room = Room::firstOrCreate(
        ['room_name' => 'CLR 4'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );

    $primaryUser = User::factory()->create();
    $relieverUser = User::factory()->create();

    $assignment = LabInChargeAssignment::create([
        'user_id' => $primaryUser->id,
        'room_id' => $room->id,
        'role_type' => 'Primary',
        'shift_name' => 'Full Day Shift',
        'is_active' => true,
        'status' => 'Active',
    ]);

    $response = $this->actingAs($admin)->post(route('operations.lab-in-charge.assignments.temporary-coverage', $assignment), [
        'reliever_user_id' => $relieverUser->id,
        'effective_from' => '2026-10-20',
        'effective_until' => '2026-10-25',
        'reason' => 'Emergency medical leave',
    ]);

    $response->assertRedirect();

    $assignment->refresh();
    expect($assignment->status)->toBe('Temporarily Covered');
    expect($assignment->reliever_user_id)->toBe($relieverUser->id);

    $this->assertDatabaseHas('lab_in_charge_assignments', [
        'user_id' => $relieverUser->id,
        'room_id' => $room->id,
        'role_type' => 'Temporary',
        'is_active' => true,
    ]);

    $this->assertDatabaseHas('lab_in_charge_assignment_audits', [
        'room_id' => $room->id,
        'previous_user_id' => $primaryUser->id,
        'new_user_id' => $relieverUser->id,
        'action_type' => 'Add Temporary Coverage',
    ]);
});
