<?php

use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create VPAA / Academic Executive Role
        $vpaaRole = Role::firstOrCreate([
            'name' => 'VPAA / Academic Executive',
        ]);

        // 2. Create dedicated VPAA user account
        $vpaaUser = User::firstOrCreate(
            ['email' => 'vpaa@dssc.edu.ph'],
            [
                'name' => 'Dr. Carmencita Robles (VPAA / Academic Executive)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $vpaaUser->roles()->syncWithoutDetaching([$vpaaRole->id]);

        // 3. Create Scoped Role Assignment at Institution Scope
        $scopedAssignment = ScopedRoleAssignment::updateOrCreate(
            [
                'user_id' => $vpaaUser->id,
                'role_id' => $vpaaRole->id,
                'scope_level' => 'Institution',
            ],
            [
                'institution' => 'Davao Del Sur State College',
                'entity_id' => null,
                'college_id' => null,
                'program_id' => null,
                'designation_type' => 'Primary',
                'appointment_reference' => 'BOR-RES-2026-VPAA-001',
                'assignment_reason' => 'Institution-wide Academic Oversight & Curriculum Delivery Supervision',
                'status' => 'Active',
                'effective_from' => '2026-01-01',
            ]
        );

        $vpaaUser->update([
            'default_role_assignment_id' => $scopedAssignment->id,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $vpaaUser = User::where('email', 'vpaa@dssc.edu.ph')->first();
        if ($vpaaUser) {
            ScopedRoleAssignment::where('user_id', $vpaaUser->id)->delete();
            $vpaaUser->delete();
        }

        Role::where('name', 'VPAA / Academic Executive')->delete();
    }
};
