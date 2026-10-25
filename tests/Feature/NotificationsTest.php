<?php

use App\Models\User;

test('authenticated user can view faculty notifications page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('faculty.notifications'));

    $response->assertStatus(200);
});

test('authenticated user can mark all notifications as read', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('faculty.notifications.read-all'));

    $response->assertRedirect();
});
