<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/dashboard')->assertOk();
});

test('authenticated users can visit the tv display', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/tv-display')->assertOk();
});
