<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\LabInChargeAssignment;
use App\Models\Program;
use App\Models\Role;
use App\Models\Room;
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
            'Program Head',
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
                    'name' => 'Dr. Eleanor Vance (Dean)',
                    'password' => Hash::make('password'),
                ]
            );

            if (! $dean->roles()->where('role_id', $deanRole->id)->exists()) {
                $dean->roles()->attach($deanRole->id);
            }

            // Dual identity: Link to Faculty profile
            $facRole = Role::firstOrCreate(['name' => 'Faculty Member']);
            if (! $dean->roles()->where('role_id', $facRole->id)->exists()) {
                $dean->roles()->attach($facRole->id);
            }
            Faculty::firstOrCreate(
                ['email' => 'dean@cids.edu'],
                [
                    'user_id' => $dean->id,
                    'first_name' => 'Eleanor',
                    'last_name' => 'Vance',
                    'academic_rank' => 'University Professor',
                    'specialization' => 'Information Systems, Strategic Management',
                    'highest_qualification' => 'Ph.D. in Information Systems',
                    'status' => 'Active',
                ]
            );
        }

        // Create Program Head User
        $programHeadRole = Role::where('name', 'Program Head')->first();
        if ($programHeadRole) {
            $head = User::firstOrCreate(
                ['email' => 'programhead@cids.edu'],
                [
                    'name' => 'Dr. Evelyn Santos (Program Head - BSIT)',
                    'password' => Hash::make('password'),
                ]
            );

            if (! $head->roles()->where('role_id', $programHeadRole->id)->exists()) {
                $head->roles()->attach($programHeadRole->id);
            }

            // Dual identity: Link to Faculty profile with BSIT program
            $facRole = Role::firstOrCreate(['name' => 'Faculty Member']);
            if (! $head->roles()->where('role_id', $facRole->id)->exists()) {
                $head->roles()->attach($facRole->id);
            }
            $bsit = Program::where('code', 'BSIT')->first();
            Faculty::firstOrCreate(
                ['email' => 'programhead@cids.edu'],
                [
                    'user_id' => $head->id,
                    'first_name' => 'Evelyn',
                    'last_name' => 'Santos',
                    'program_id' => $bsit?->id,
                    'academic_rank' => 'Associate Professor',
                    'specialization' => 'Information Technology, Software Engineering',
                    'highest_qualification' => 'Ph.D. in Computer Science',
                    'status' => 'Active',
                ]
            );
        }

        // Create Lab In-Charge User
        $labRole = Role::firstOrCreate(['name' => 'Lab In-Charge']);
        $labUser = User::firstOrCreate(
            ['email' => 'labincharge@cids.edu'],
            [
                'name' => 'Engr. Marco Torres (Lab In-Charge)',
                'password' => Hash::make('password'),
            ]
        );

        if (! $labUser->roles()->where('role_id', $labRole->id)->exists()) {
            $labUser->roles()->attach($labRole->id);
        }

        // Attach default Computer Laboratories to this Lab In-Charge if assignments exist
        if (class_exists(LabInChargeAssignment::class) && class_exists(Room::class)) {
            $labs = Room::where('room_name', 'like', '%CLR%')
                ->orWhere('room_name', 'like', '%Lab%')
                ->orWhere('room_name', 'like', '%COM%')
                ->get();

            foreach ($labs as $lab) {
                LabInChargeAssignment::firstOrCreate(
                    [
                        'user_id' => $labUser->id,
                        'room_id' => $lab->id,
                    ],
                    [
                        'shift_name' => 'Full Day Shift',
                        'shift_start_time' => '07:30:00',
                        'shift_end_time' => '17:30:00',
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
