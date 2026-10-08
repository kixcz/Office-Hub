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
    }
}
