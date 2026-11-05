<?php

use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use App\Services\PortalContextService;

test('multi-role user can view choose workspace screen', function () {
    $user = User::factory()->create();
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member'], ['hierarchy_level' => 10, 'portal_type' => 'faculty']);
    $vpafRole = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight'], ['hierarchy_level' => 2, 'portal_type' => 'vpaf']);

    $asgn1 = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $facultyRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'College',
        'status' => 'Active',
    ]);

    $asgn2 = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $vpafRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'Institution',
        'status' => 'Active',
    ]);

    $response = $this->actingAs($user)->get(route('context.choose-workspace'));
    $response->assertOk();
});

test('user can switch active portal context', function () {
    $user = User::factory()->create();
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member'], ['hierarchy_level' => 10, 'portal_type' => 'faculty']);
    $vpafRole = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight'], ['hierarchy_level' => 2, 'portal_type' => 'vpaf']);

    $asgnFaculty = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $facultyRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'College',
        'status' => 'Active',
    ]);

    $asgnVpaf = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $vpafRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'Institution',
        'status' => 'Active',
    ]);

    // Switch to VPAF
    $response = $this->actingAs($user)->post(route('context.switch'), [
        'scoped_role_assignment_id' => $asgnVpaf->id,
    ]);

    $response->assertRedirect('/vpaf/dashboard');
    expect(session('active_portal_type'))->toBe('vpaf');
    expect(session('active_role_assignment_id'))->toBe($asgnVpaf->id);

    // Switch to Faculty
    $responseFaculty = $this->actingAs($user)->post(route('context.switch'), [
        'scoped_role_assignment_id' => $asgnFaculty->id,
    ]);

    $responseFaculty->assertRedirect();
    expect(session('active_portal_type'))->toBe('faculty');
    expect(session('active_role_assignment_id'))->toBe($asgnFaculty->id);
});

test('cross-portal isolation prevents faculty context from accessing vpaf workspace', function () {
    $user = User::factory()->create();
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member'], ['hierarchy_level' => 10, 'portal_type' => 'faculty']);
    $vpafRole = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight'], ['hierarchy_level' => 2, 'portal_type' => 'vpaf']);

    $asgnFaculty = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $facultyRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'College',
        'status' => 'Active',
    ]);

    $asgnVpaf = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $vpafRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'Institution',
        'status' => 'Active',
    ]);

    // Active context set to faculty
    session([
        'active_role_assignment_id' => $asgnFaculty->id,
        'active_portal_type' => 'faculty',
        'active_role_name' => 'Faculty Member',
    ]);

    $response = $this->actingAs($user)->get('/vpaf/dashboard');
    $response->assertForbidden();

    // Now switch active context to VPAF
    session([
        'active_role_assignment_id' => $asgnVpaf->id,
        'active_portal_type' => 'vpaf',
        'active_role_name' => 'VPAF / Executive Oversight',
    ]);

    $responseAfterSwitch = $this->actingAs($user)->get('/vpaf/dashboard');
    $responseAfterSwitch->assertOk();
});

test('user can designate a default role assignment', function () {
    $user = User::factory()->create();
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member'], ['hierarchy_level' => 10, 'portal_type' => 'faculty']);

    $asgn = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $facultyRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'College',
        'status' => 'Active',
    ]);

    $response = $this->actingAs($user)->post(route('context.default'), [
        'scoped_role_assignment_id' => $asgn->id,
    ]);

    $response->assertRedirect();
    $user->refresh();
    expect($user->default_role_assignment_id)->toBe($asgn->id);
});

test('assignable roles matrix enforces role assignment authority', function () {
    $contextService = app(PortalContextService::class);

    $superAdmin = User::factory()->create();
    $superRole = Role::firstOrCreate(['name' => 'Institution Super Admin'], ['hierarchy_level' => 1]);
    $superAdmin->roles()->attach($superRole);

    $deanUser = User::factory()->create();
    $deanRole = Role::firstOrCreate(['name' => 'Dean'], ['hierarchy_level' => 4]);
    $deanUser->roles()->attach($deanRole);

    $vpafRole = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight'], ['hierarchy_level' => 2]);
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member'], ['hierarchy_level' => 10]);

    // Super Admin can assign VPAF and Faculty
    expect($contextService->canAssignRole($superAdmin, $vpafRole, 'Institution'))->toBeTrue();
    expect($contextService->canAssignRole($superAdmin, $facultyRole, 'College'))->toBeTrue();

    // Dean CANNOT assign VPAF or Super Admin
    expect($contextService->canAssignRole($deanUser, $vpafRole, 'Institution'))->toBeFalse();
    expect($contextService->canAssignRole($deanUser, $superRole, 'Institution'))->toBeFalse();
});

test('institution super admin acting in faculty context is constrained by faculty permissions and cannot access governance', function () {
    $user = User::factory()->create();
    $superRole = Role::firstOrCreate(['name' => 'Institution Super Admin'], ['hierarchy_level' => 1, 'portal_type' => 'institution_super_admin']);
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member'], ['hierarchy_level' => 10, 'portal_type' => 'faculty']);

    $asgnSuper = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $superRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'Institution',
        'status' => 'Active',
    ]);

    $asgnFaculty = ScopedRoleAssignment::create([
        'user_id' => $user->id,
        'role_id' => $facultyRole->id,
        'institution' => 'DSSC',
        'scope_level' => 'College',
        'status' => 'Active',
    ]);

    // When acting as Faculty, central governance routes (/institution/*) must be blocked
    session([
        'active_role_assignment_id' => $asgnFaculty->id,
        'active_portal_type' => 'faculty',
        'active_role_name' => 'Faculty Member',
    ]);

    $response = $this->actingAs($user)->get('/institution/dashboard');
    $response->assertForbidden();

    // When switching back to Institution Super Admin, governance is restored
    session([
        'active_role_assignment_id' => $asgnSuper->id,
        'active_portal_type' => 'institution_super_admin',
        'active_role_name' => 'Institution Super Admin',
    ]);

    $responseAllowed = $this->actingAs($user)->get('/institution/dashboard');
    $responseAllowed->assertOk();
});
