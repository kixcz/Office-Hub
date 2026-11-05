<?php

use App\Models\Role;
use App\Models\User;

test('guests are redirected from vpaf executive workspace', function () {
    $response = $this->get('/vpaf/dashboard');
    $response->assertRedirect('/login');
});

test('non-vpaf users cannot access vpaf executive workspace', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Faculty Member'], ['hierarchy_level' => 10]);
    $user->roles()->attach($role);

    $response = $this->actingAs($user)->get('/vpaf/dashboard');
    $response->assertForbidden();
});

test('vpaf user can access all executive workspace pages', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight'], ['hierarchy_level' => 2]);
    $user->roles()->attach($role);

    $routes = [
        '/vpaf/dashboard',
        '/vpaf/analytics',
        '/vpaf/academic-operations',
        '/vpaf/compliance-quality',
        '/vpaf/facilities-resources',
        '/vpaf/research-extension',
        '/vpaf/projects-initiatives',
        '/vpaf/reports',
        '/vpaf/tv-communications',
    ];

    foreach ($routes as $route) {
        $response = $this->actingAs($user)->get($route);
        $response->assertOk();
    }
});

test('vpaf user can trigger emergency broadcast takeover', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight'], ['hierarchy_level' => 2]);
    $user->roles()->attach($role);

    $response = $this->actingAs($user)->post('/vpaf/tv-communications/takeover', [
        'title' => 'Test Emergency Alert',
        'message' => 'This is a test broadcast alert message for all screens.',
        'duration_minutes' => 30,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');
});
