<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesAndUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'System Administrator',
            'Dean',
            'Program Chair',
            'Office Secretary',
            'Coordinator',
            'Faculty Member',
            'Display Screen',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        // Create Default Admin User
        $adminRole = Role::where('name', 'System Administrator')->first();
        if ($adminRole) {
            $admin = User::firstOrCreate(
                ['email' => 'admin@cids.edu'],
                [
                    'name' => 'System Admin',
                    'password' => Hash::make('password'),
                ]
            );

            if (! $admin->roles()->where('role_id', $adminRole->id)->exists()) {
                $admin->roles()->attach($adminRole->id);
            }
        }

        // Create Default TV Display User
        $tvRole = Role::where('name', 'Display Screen')->first();
        if ($tvRole) {
            $tvUser = User::firstOrCreate(
                ['email' => 'tv@cids.edu'],
                [
                    'name' => 'TV Display Screen',
                    'password' => Hash::make('password'),
                ]
            );

            if (! $tvUser->roles()->where('role_id', $tvRole->id)->exists()) {
                $tvUser->roles()->attach($tvRole->id);
            }
        }

        // Create Dean User
        $deanRole = Role::where('name', 'Dean')->first();
        if ($deanRole) {
            $dean = User::firstOrCreate(
                ['email' => 'dean@cids.edu'],
                [
                    'name' => 'Dr. Dean Office',
                    'password' => Hash::make('password'),
                ]
            );

            if (! $dean->roles()->where('role_id', $deanRole->id)->exists()) {
                $dean->roles()->attach($deanRole->id);
            }
        }
    }
}
