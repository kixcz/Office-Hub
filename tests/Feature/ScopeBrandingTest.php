<?php

use App\Models\College;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use App\Services\ScopeBrandingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('scope branding resolves college override over entity and institution', function () {
    $parent = College::create([
        'code' => 'MAIN',
        'name' => 'Main Campus',
        'type' => 'campus',
        'color_theme' => 'blue',
    ]);

    $college = College::create([
        'parent_id' => $parent->id,
        'code' => 'CIDS',
        'name' => 'College of Information and Computing Sciences',
        'color_theme' => 'amber',
        'report_defaults' => [
            'branding' => [
                'primary_color' => '#d97706',
                'secondary_color' => '#4338ca',
                'accent_color' => '#f59e0b',
                'slogan' => 'Innovate, Compute, Lead',
            ],
        ],
    ]);

    $brandingService = app(ScopeBrandingService::class);
    $branding = $brandingService->resolveCollegeBranding($college);

    expect($branding['scope_type'])->toBe('college')
        ->and($branding['scope_code'])->toBe('CIDS')
        ->and($branding['primary_color'])->toBe('#d97706')
        ->and($branding['secondary_color'])->toBe('#4338ca')
        ->and($branding['tagline'])->toBe('Innovate, Compute, Lead');
});

test('scope branding falls back to institution defaults when college has no custom palette', function () {
    $college = College::create([
        'code' => 'CED',
        'name' => 'College of Education',
        'color_theme' => 'indigo',
        'report_defaults' => null,
    ]);

    $brandingService = app(ScopeBrandingService::class);
    $branding = $brandingService->resolveCollegeBranding($college);

    $institution = $brandingService->getInstitutionBranding();

    expect($branding['primary_color'])->toBe($institution['primary_color'])
        ->and($branding['secondary_color'])->toBe($institution['secondary_color']);
});

test('brand colors do not override semantic status colors', function () {
    $brandingService = app(ScopeBrandingService::class);
    $cssVars = $brandingService->generateCssVariables([
        'primary_color' => '#4f46e5',
        'secondary_color' => '#06b6d4',
        'accent_color' => '#f59e0b',
        'surface_color' => '#ffffff',
        'dark_color' => '#0f172a',
    ]);

    // Check that semantic status colors are strictly preserved in the generated CSS vars
    expect($cssVars['--brand-success'])->toBe('#10B981')
        ->and($cssVars['--brand-warning'])->toBe('#F59E0B')
        ->and($cssVars['--brand-danger'])->toBe('#EF4444')
        ->and($cssVars['--brand-info'])->toBe('#3B82F6')
        ->and($cssVars['--brand-primary'])->toBe('#4f46e5');
});

test('college admin can view branding workspace', function () {
    $college = College::create([
        'code' => 'CIDS',
        'name' => 'College of Information and Computing Sciences',
        'color_theme' => 'amber',
    ]);

    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'College Admin'], ['hierarchy_level' => 4, 'portal_type' => 'college_admin']);

    $assignment = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $role->id,
        'scope_level' => 'College',
        'college_scope' => $college->code,
        'status' => 'Active',
    ]);

    $response = $this->actingAs($user)
        ->withSession(['active_role_assignment_id' => $assignment->id])
        ->get(route('college.settings.branding'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('college/settings/branding')
        ->has('college')
        ->has('institutionBranding')
    );
});

test('college admin can update college branding palette and details', function () {
    $college = College::create([
        'code' => 'CIDS',
        'name' => 'College of Information and Computing Sciences',
        'color_theme' => 'amber',
    ]);

    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'College Admin'], ['hierarchy_level' => 4, 'portal_type' => 'college_admin']);

    $assignment = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $role->id,
        'scope_level' => 'College',
        'college_scope' => $college->code,
        'status' => 'Active',
    ]);

    $payload = [
        'primary_color' => '#1E40AF',
        'secondary_color' => '#0284C7',
        'accent_color' => '#E0E7FF',
        'preset_key' => 'blue',
        'slogan' => 'Excellence in Digital Systems',
        'sidebar_style' => 'dark',
        'header_style' => 'glass',
    ];

    $response = $this->actingAs($user)
        ->withSession(['active_role_assignment_id' => $assignment->id])
        ->post(route('college.settings.branding.update'), $payload);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $college->refresh();
    expect($college->color_theme)->toBe('blue')
        ->and($college->report_defaults['branding']['slogan'])->toBe('Excellence in Digital Systems');
});

test('college admin can reset branding to institution defaults', function () {
    $college = College::create([
        'code' => 'CIDS',
        'name' => 'College of Information and Computing Sciences',
        'color_theme' => 'rose',
        'report_defaults' => [
            'branding' => [
                'primary_color' => '#E11D48',
                'secondary_color' => '#9333EA',
                'slogan' => 'Custom Slogan',
            ],
        ],
    ]);

    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'College Admin'], ['hierarchy_level' => 4, 'portal_type' => 'college_admin']);

    $assignment = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $role->id,
        'scope_level' => 'College',
        'college_scope' => $college->code,
        'status' => 'Active',
    ]);

    $response = $this->actingAs($user)
        ->withSession(['active_role_assignment_id' => $assignment->id])
        ->post(route('college.settings.branding.reset'));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $college->refresh();
    expect($college->color_theme)->toBe('indigo')
        ->and($college->report_defaults['branding'] ?? null)->toBeNull();
});
