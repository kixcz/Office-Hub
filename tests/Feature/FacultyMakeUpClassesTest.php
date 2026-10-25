<?php

use App\Models\Role;
use App\Models\User;

test('faculty make-up classes page renders successfully', function () {
    $facultyUser = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Faculty']);
    $facultyUser->roles()->syncWithoutDetaching([$role->id]);

    $response = $this->actingAs($facultyUser)->get('/faculty/make-up-classes');

    $response->assertStatus(200);
});

test('lab in-charge alerts and incidents module renders successfully', function () {
    $labUser = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Lab In-Charge']);
    $labUser->roles()->syncWithoutDetaching([$role->id]);

    $response = $this->actingAs($labUser)->get('/monitoring/lab-in-charge?tab=alerts');

    $response->assertStatus(200);
});
