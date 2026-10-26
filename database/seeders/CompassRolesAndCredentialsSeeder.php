<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CompassRolesAndCredentialsSeeder extends Seeder
{
    /**
     * Seed dedicated sample credentials for every role in the COMPASS institution and college hierarchy.
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('password');

        // Define all standard role accounts
        $accounts = [
            // 1. Institution Level
            [
                'name' => 'Dr. Arthur Pendelton (Institution Super Admin)',
                'email' => 'superadmin@dssc.edu.ph',
                'role' => 'Institution Super Admin',
                'is_faculty' => false,
            ],
            [
                'name' => 'Prof. Raymond Cruz (VPAF / Executive Oversight)',
                'email' => 'vpaf@dssc.edu.ph',
                'role' => 'VPAF / Executive Oversight',
                'is_faculty' => false,
            ],
            [
                'name' => 'Claire Del Rosario (Institution TV & Media Manager)',
                'email' => 'institution.tv@dssc.edu.ph',
                'role' => 'Institution TV / Communications Manager',
                'is_faculty' => false,
            ],

            // 2. College Level
            [
                'name' => 'Admin Maria Clara (College Secretary / College Admin)',
                'email' => 'collegeadmin@cids.edu',
                'role' => 'College Admin',
                'is_faculty' => true,
            ],
            [
                'name' => 'System Admin (Legacy CIDS Super Admin)',
                'email' => 'admin@cids.edu',
                'role' => 'College Admin',
                'is_faculty' => false,
            ],
            [
                'name' => 'Dr. Eleanor Vance (Dean - CIDS)',
                'email' => 'dean@cids.edu',
                'role' => 'Dean',
                'is_faculty' => true,
            ],
            [
                'name' => 'Dr. Evelyn Santos (Program Head - BSIT)',
                'email' => 'programhead@cids.edu',
                'role' => 'Program Head',
                'is_faculty' => true,
            ],
            [
                'name' => 'Engr. Marco Torres (Head Lab / Facility In-Charge)',
                'email' => 'headlab@cids.edu',
                'role' => 'Head Lab / Facility In-Charge',
                'is_faculty' => true,
            ],
            [
                'name' => 'Engr. Marco Torres (Lab In-Charge)',
                'email' => 'labincharge@cids.edu',
                'role' => 'Head Lab / Facility In-Charge',
                'is_faculty' => true,
            ],
            [
                'name' => 'Rodel Navarro (Non-Teaching Lab / Facility Observer)',
                'email' => 'facility.monitor@cids.edu',
                'role' => 'Non-Teaching Lab / Facility In-Charge',
                'is_faculty' => false,
            ],
            [
                'name' => 'Prof. Maria Santos (Faculty Member)',
                'email' => 'msantos@cids.edu',
                'role' => 'Faculty Member',
                'is_faculty' => true,
            ],
            [
                'name' => 'CIDS TV Studio Display',
                'email' => 'tv@cids.edu',
                'role' => 'College TV Display / TV Manager',
                'is_faculty' => false,
            ],
        ];

        foreach ($accounts as $acc) {
            $user = User::firstOrCreate(
                ['email' => $acc['email']],
                [
                    'name' => $acc['name'],
                    'password' => $defaultPassword,
                ]
            );

            // Ensure correct role is attached
            $role = Role::firstOrCreate(['name' => $acc['role']]);
            if (! $user->roles()->where('role_id', $role->id)->exists()) {
                $user->roles()->attach($role->id);
            }

            // Also attach secondary Faculty Member role if dual role
            if ($acc['is_faculty']) {
                $facRole = Role::firstOrCreate(['name' => 'Faculty Member']);
                if (! $user->roles()->where('role_id', $facRole->id)->exists()) {
                    $user->roles()->attach($facRole->id);
                }
            }
        }
    }
}
