<?php

use App\Models\User;
use App\Services\PortalContextService;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $active = app(PortalContextService::class)->getActiveAssignment($user);
    $response->assertRedirect($active['landing_url']);
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});

test('authenticated user visiting home url is redirected to their workspace dashboard', function () {
    $user = User::factory()->create();
    $active = app(PortalContextService::class)->getActiveAssignment($user);

    $response = $this->actingAs($user)->get('/');

    $response->assertRedirect($active['landing_url']);
});

test('authenticated user visiting login url is redirected to their workspace dashboard', function () {
    $user = User::factory()->create();
    $active = app(PortalContextService::class)->getActiveAssignment($user);

    $response = $this->actingAs($user)->get('/login');

    $response->assertRedirect($active['landing_url']);
});
