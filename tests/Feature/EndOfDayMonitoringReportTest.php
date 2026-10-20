<?php

use App\Models\DailyMonitoringReport;
use App\Models\LabInChargeAssignment;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;

test('lab in-charge can access end-of-day report view with compiled matrices', function () {
    $user = User::factory()->create(['email' => 'test-eod@cids.edu']);

    $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
    $user->roles()->syncWithoutDetaching([$role->id]);

    $room = Room::firstOrCreate(
        ['room_name' => 'CLR 1'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 45, 'status' => 'Available']
    );

    LabInChargeAssignment::firstOrCreate(
        ['user_id' => $user->id, 'room_id' => $room->id],
        ['shift_name' => 'Morning Shift', 'role_type' => 'Primary', 'assigned_days' => 'Monday–Saturday', 'is_active' => true]
    );

    $response = $this->actingAs($user)->get(route('lab-in-charge.end-of-day'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('monitoring/lab-in-charge/end-of-day')
        ->has('report')
        ->where('report.shift_name', 'Morning Shift')
        ->has('report.summary_matrix')
        ->has('report.sessions_matrix')
        ->has('report.utilization_matrix')
        ->has('report.exceptions_matrix')
        ->has('report.reconciliation_checklist')
    );
});

test('lab in-charge can submit end-of-day report and freeze monitoring records', function () {
    $user = User::factory()->create(['email' => 'test-sub-eod@cids.edu']);

    $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
    $user->roles()->syncWithoutDetaching([$role->id]);

    $room = Room::firstOrCreate(
        ['room_name' => 'CLR 2'],
        ['building' => 'CIDS Main', 'type' => 'Laboratory', 'capacity' => 40, 'status' => 'Available']
    );

    LabInChargeAssignment::firstOrCreate(
        ['user_id' => $user->id, 'room_id' => $room->id],
        ['shift_name' => 'Full Day Shift', 'role_type' => 'Primary', 'assigned_days' => 'Monday–Saturday', 'is_active' => true]
    );

    $today = Carbon::now(config('services.room_schedule.timezone', 'Asia/Manila'))->toDateString();

    $response = $this->actingAs($user)->post(route('lab-in-charge.end-of-day.submit'), [
        'report_date' => $today,
        'shift_name' => 'Full Day Shift',
        'submission_notes' => 'All morning and afternoon sessions verified cleanly.',
        'close_mode' => 'clean',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('daily_monitoring_reports', [
        'user_id' => $user->id,
        'status' => 'Submitted',
    ]);
    expect(DailyMonitoringReport::where('user_id', $user->id)->first()->report_date->toDateString())->toBe($today);
});

test('admin can review, finalize, and reopen daily report through auditable history', function () {
    $inCharge = User::factory()->create(['name' => 'In-Charge Juan']);
    $admin = User::factory()->create(['name' => 'Coordinator Admin']);

    $adminRole = Role::firstOrCreate(['name' => 'Super Admin']);
    $admin->roles()->syncWithoutDetaching([$adminRole->id]);

    $report = DailyMonitoringReport::create([
        'report_date' => now()->toDateString(),
        'user_id' => $inCharge->id,
        'shift_name' => 'Day Shift',
        'status' => 'Submitted',
        'covered_room_ids' => [1],
        'academic_period_name' => '1st Semester 2026-2027',
        'schedule_version' => 'v1.0',
        'expected_sessions_count' => 5,
        'monitored_sessions_count' => 5,
        'completeness_rate' => 100.0,
        'discrepancies_count' => 0,
        'unmonitored_count' => 0,
        'summary_matrix' => [],
        'sessions_matrix' => [],
        'utilization_matrix' => [],
        'exceptions_matrix' => [],
        'reconciliation_checklist' => [],
        'submitted_at' => now(),
        'submitted_by_user_id' => $inCharge->id,
    ]);

    // 1. Review
    $responseReview = $this->actingAs($admin)->post(route('lab-in-charge.end-of-day.review', $report), [
        'action' => 'approve_review',
        'review_remarks' => 'All verified with physical walk-through log.',
    ]);
    $responseReview->assertRedirect();
    $this->assertDatabaseHas('daily_monitoring_reports', [
        'id' => $report->id,
        'status' => 'Reviewed',
        'reviewed_by_user_id' => $admin->id,
    ]);

    // 2. Finalize
    $responseFinalize = $this->actingAs($admin)->post(route('lab-in-charge.end-of-day.finalize', $report));
    $responseFinalize->assertRedirect();
    $this->assertDatabaseHas('daily_monitoring_reports', [
        'id' => $report->id,
        'status' => 'Finalized',
        'finalized_by_user_id' => $admin->id,
    ]);

    // 3. Reopen for auditable correction
    $responseReopen = $this->actingAs($admin)->post(route('lab-in-charge.end-of-day.reopen', $report), [
        'reopen_reason' => 'Faculty submitted signed excuse slip amending observed late start.',
    ]);
    $responseReopen->assertRedirect();
    $report->refresh();
    expect($report->status)->toBe('Draft');
    expect($report->correction_history)->toHaveCount(1);
    expect($report->correction_history[0]['reopened_by'])->toBe('Coordinator Admin');
    expect($report->correction_history[0]['previous_status'])->toBe('Finalized');
});
