<?php

use App\Models\Faculty;
use App\Models\User;

test('authenticated user can load faculty attendance report page', function () {
    $user = User::first() ?? User::factory()->create();
    $response = $this->actingAs($user)->get('/faculty-attendance/report');
    $response->assertStatus(200);
});

test('faculty user can load my attendance module without duplicate months in monthly matrix', function () {
    $facultyUser = User::where('email', 'kpanaligan@cids.edu')->first()
        ?? User::first()
        ?? User::factory()->create(['name' => 'Kaye Antoinette Panaligan', 'email' => 'kpanaligan@cids.edu']);

    $faculty = Faculty::where('user_id', $facultyUser->id)->first()
        ?? Faculty::factory()->create([
            'user_id' => $facultyUser->id,
            'first_name' => 'Kaye Antoinette',
            'last_name' => 'Panaligan',
            'email' => $facultyUser->email,
        ]);

    $response = $this->actingAs($facultyUser)->get('/faculty/attendance');
    $response->assertStatus(200);

    $props = $response->original->getData()['page']['props'];

    expect($props['monthlyPeriods'])->toBeArray();
    // Verify each month is unique (no redundant August, September, October, November, December)
    $monthLabels = collect($props['monthlyPeriods']);
    expect($monthLabels->count())->toBe($monthLabels->unique()->count());

    // Verify monthly summaries are clean and unique per month
    $matrixLabels = collect($props['monthlySummaries'])->pluck('period_label');
    expect($matrixLabels->count())->toBe($matrixLabels->unique()->count());
});

test('my attendance filters work for weekly, monthly, and status views', function () {
    $facultyUser = User::where('email', 'kpanaligan@cids.edu')->first()
        ?? User::first()
        ?? User::factory()->create(['name' => 'Kaye Antoinette Panaligan', 'email' => 'kpanaligan@cids.edu']);

    $faculty = Faculty::where('user_id', $facultyUser->id)->first()
        ?? Faculty::factory()->create([
            'user_id' => $facultyUser->id,
            'first_name' => 'Kaye Antoinette',
            'last_name' => 'Panaligan',
            'email' => $facultyUser->email,
        ]);

    // Test monthly view with specific month filter
    $responseMonth = $this->actingAs($facultyUser)->get('/faculty/attendance?view_type=monthly&month=September+2026');
    $responseMonth->assertStatus(200);
    $propsMonth = $responseMonth->original->getData()['page']['props'];
    expect($propsMonth['filters']['view_type'])->toBe('monthly');
    expect($propsMonth['filters']['month'])->toBe('September 2026');

    // Test status filter
    $responseStatus = $this->actingAs($facultyUser)->get('/faculty/attendance?status=present');
    $responseStatus->assertStatus(200);
    $propsStatus = $responseStatus->original->getData()['page']['props'];
    expect($propsStatus['filters']['status'])->toBe('present');
});
