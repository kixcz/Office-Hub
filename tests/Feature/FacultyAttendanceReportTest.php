<?php

use App\Models\User;

test('authenticated user can load faculty attendance report page', function () {
    $user = User::first() ?? User::factory()->create();
    $response = $this->actingAs($user)->get('/faculty-attendance/report');
    $response->assertStatus(200);
});
