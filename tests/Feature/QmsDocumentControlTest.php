<?php

use App\Models\User;

test('super admin can access qms document control dashboard', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/qms');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('qms/index')
        ->has('metrics')
        ->has('documents')
        ->has('pendingRequests')
        ->has('documentTypes')
        ->has('codeRules')
    );
});

test('faculty can access my documents portal with controlled templates', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/faculty/documents');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('faculty/documents')
        ->has('metrics')
        ->has('templates')
        ->has('instances')
    );
});
