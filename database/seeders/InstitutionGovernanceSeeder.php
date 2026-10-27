<?php

namespace Database\Seeders;

use App\Models\College;
use App\Models\InstitutionSetting;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;

class InstitutionGovernanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Standard Colleges
        $colleges = [
            [
                'code' => 'CIDS',
                'name' => 'College of Information and Digital Sciences',
                'acronym' => 'CIDS',
                'type' => 'College',
                'dean_name' => 'Dr. Eleanor Vance',
                'contact_email' => 'dean.cids@dssc.edu.ph',
                'status' => 'Active',
                'setup_stage' => 'Active',
                'setup_progress' => 100,
                'color_theme' => 'amber',
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'lab_monitoring' => true,
                    'lab_inventory' => true,
                    'research_extension' => true,
                    'compliance' => true,
                    'tv_studio' => true,
                    'performance' => true,
                ],
            ],
            [
                'code' => 'CED',
                'name' => 'College of Teacher Education',
                'acronym' => 'CED',
                'type' => 'College',
                'dean_name' => 'Dr. Carmela Bautista',
                'contact_email' => 'dean.ced@dssc.edu.ph',
                'status' => 'Active',
                'setup_stage' => 'Active',
                'setup_progress' => 95,
                'color_theme' => 'blue',
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'compliance' => true,
                    'performance' => true,
                    'tv_studio' => false,
                ],
            ],
            [
                'code' => 'CBA',
                'name' => 'College of Business Administration',
                'acronym' => 'CBA',
                'type' => 'College',
                'dean_name' => 'Dr. Fernando Gomez',
                'contact_email' => 'dean.cba@dssc.edu.ph',
                'status' => 'Ready',
                'setup_stage' => 'Activation',
                'setup_progress' => 90,
                'color_theme' => 'emerald',
                'enabled_modules' => [
                    'scheduling' => true,
                    'faculty_attendance' => true,
                    'compliance' => true,
                ],
            ],
            [
                'code' => 'COE',
                'name' => 'College of Engineering',
                'acronym' => 'COE',
                'type' => 'College',
                'dean_name' => 'Engr. Victor Salcedo',
                'contact_email' => 'dean.coe@dssc.edu.ph',
                'status' => 'In Setup',
                'setup_stage' => 'Facilities',
                'setup_progress' => 60,
                'color_theme' => 'indigo',
                'enabled_modules' => [
                    'scheduling' => true,
                    'lab_monitoring' => true,
                    'lab_inventory' => true,
                ],
            ],
            [
                'code' => 'CAS',
                'name' => 'College of Arts and Sciences',
                'acronym' => 'CAS',
                'type' => 'College',
                'dean_name' => 'Dr. Rebecca Miranda',
                'contact_email' => 'dean.cas@dssc.edu.ph',
                'status' => 'Not Configured',
                'setup_stage' => 'Identity',
                'setup_progress' => 15,
                'color_theme' => 'purple',
                'enabled_modules' => [],
            ],
        ];

        foreach ($colleges as $cData) {
            College::firstOrCreate(['code' => $cData['code']], $cData);
        }

        // 2. Seed Core Institution Settings
        $settings = [
            // Institution Profile
            [
                'key' => 'institution_name',
                'group' => 'profile',
                'value' => 'Davao Del Sur State College',
                'label' => 'Institution Full Name',
            ],
            [
                'key' => 'institution_acronym',
                'group' => 'profile',
                'value' => 'DSSC',
                'label' => 'Institution Acronym',
            ],
            [
                'key' => 'institution_address',
                'group' => 'profile',
                'value' => 'Brgy. Matti, Digos City, Davao del Sur, Philippines 8002',
                'label' => 'Official Campus Address',
            ],
            [
                'key' => 'institution_timezone',
                'group' => 'profile',
                'value' => 'Asia/Manila (UTC+08:00)',
                'label' => 'System Timezone',
            ],
            // Terminology Defaults
            [
                'key' => 'terminology_overrides',
                'group' => 'terminology',
                'value' => [
                    'facility_monitor' => [
                        'default' => 'Facility In-Charge',
                        'cids' => 'Lab In-Charge',
                        'coe' => 'Laboratory Technician',
                        'ced' => 'Classroom Coordinator',
                    ],
                    'college_unit' => [
                        'default' => 'College',
                        'cids' => 'College',
                    ],
                    'academic_leader' => [
                        'default' => 'Program Head',
                        'cids' => 'Program Head',
                    ],
                ],
                'label' => 'Configurable Terminology Mappings',
            ],
            // Feature Flags
            [
                'key' => 'feature_flags',
                'group' => 'platform',
                'value' => [
                    'gemini_ai_schedule_assistant' => true,
                    'gemini_ai_document_understanding' => true,
                    'cross_college_tv_channel_switching' => true,
                    'google_sheets_live_sync' => true,
                    'biometric_attendance_bridge' => false,
                    'qr_inventory_audit' => true,
                    'auto_conflict_resolution' => false,
                ],
                'label' => 'Institutional Feature Flags',
            ],
            // Integrations
            [
                'key' => 'integrations_status',
                'group' => 'integrations',
                'value' => [
                    'google_workspace' => ['connected' => true, 'domain' => 'dssc.edu.ph', 'last_sync' => '2026-10-27 10:30'],
                    'google_sheets' => ['connected' => true, 'active_syncs' => 4, 'last_sync' => '2026-10-27 11:15'],
                    'gemini_llm' => ['connected' => true, 'provider' => 'Google Gemini 2.5 Flash', 'quota_healthy' => true],
                    'hris_api' => ['connected' => false, 'endpoint' => 'https://hris.dssc.edu.ph/api/v1', 'note' => 'Awaiting API token clearance'],
                ],
                'label' => 'Institutional Integration Health',
            ],
        ];

        foreach ($settings as $sData) {
            InstitutionSetting::updateOrCreate(
                ['key' => $sData['key']],
                $sData
            );
        }

        // 3. Seed Sample Scoped Role Assignments
        $cidsCollege = College::where('code', 'CIDS')->first();
        $superAdminUser = User::where('email', 'superadmin@dssc.edu.ph')->first();
        $isaRole = Role::where('name', 'Institution Super Admin')->first();

        if ($superAdminUser && $isaRole) {
            ScopedRoleAssignment::firstOrCreate([
                'user_id' => $superAdminUser->id,
                'role_id' => $isaRole->id,
                'institution' => 'Davao Del Sur State College',
            ], [
                'status' => 'Active',
                'notes' => 'Permanent institution-wide platform administration.',
            ]);
        }

        $collegeAdminUser = User::where('email', 'collegeadmin@cids.edu')->first();
        $caRole = Role::where('name', 'College Admin')->first();
        if ($collegeAdminUser && $caRole && $cidsCollege) {
            ScopedRoleAssignment::firstOrCreate([
                'user_id' => $collegeAdminUser->id,
                'role_id' => $caRole->id,
                'college_id' => $cidsCollege->id,
            ], [
                'institution' => 'Davao Del Sur State College',
                'status' => 'Active',
                'notes' => 'Primary College Administrator for CIDS.',
            ]);
        }
    }
}
