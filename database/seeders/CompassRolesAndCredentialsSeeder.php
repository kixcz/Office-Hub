<?php

namespace Database\Seeders;

use App\Models\College;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Role;
use App\Models\ScopedRoleAssignment;
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
        }

        // Configure multi-role profile for Institution Super Admin Dr. Arthur Pendelton (superadmin@dssc.edu.ph)
        // Arthur holds:
        // 1. Institution Super Admin @ Institution scope
        // 2. Faculty Member @ CIDS (BSIT) scope
        // 3. Program Head @ BSIT scope
        $arthur = User::where('email', 'superadmin@dssc.edu.ph')->first();
        if ($arthur) {
            $cids = College::where('code', 'CIDS')->first();
            $bsit = Program::where('code', 'BSIT')->first() ?? Program::first();
            $superRole = Role::firstOrCreate(['name' => 'Institution Super Admin']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);
            $progHeadRole = Role::firstOrCreate(['name' => 'Program Head']);

            $arthur->roles()->syncWithoutDetaching([$superRole->id, $facultyRole->id, $progHeadRole->id]);

            // Ensure faculty profile exists
            Faculty::firstOrCreate(
                ['user_id' => $arthur->id],
                [
                    'first_name' => 'Arthur',
                    'last_name' => 'Pendelton',
                    'spreadsheet_name' => 'PENDELTON, A.',
                    'faculty_id' => 'FAC-2022-001',
                    'academic_rank' => 'Professor VI',
                    'employment_type' => 'Permanent / Full-Time',
                    'status' => 'Active',
                    'appointment_status' => 'Regular Permanent',
                    'highest_qualification' => 'Ph.D. in Computer Science',
                    'specialization' => 'Distributed Systems & Platform Governance',
                    'email' => 'superadmin@dssc.edu.ph',
                    'program_id' => $bsit?->id,
                ]
            );

            // 1. Primary Institution Super Admin assignment
            $superAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $arthur->id,
                    'role_id' => $superRole->id,
                    'scope_level' => 'Institution',
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'entity_id' => null,
                    'college_id' => null,
                    'program_id' => null,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'BOR-GOV-2024-001',
                    'assignment_reason' => 'Designation as Chief Platform Governor & Institution Super Admin',
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            // 2. Faculty Member @ CIDS
            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $arthur->id,
                    'role_id' => $facultyRole->id,
                    'scope_level' => 'College',
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsit?->id,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'FAC-2022-CIDS-003',
                    'assignment_reason' => 'Substantive Faculty Rank in College of Information and Digital Sciences',
                    'status' => 'Active',
                    'effective_from' => '2022-08-01',
                ]
            );

            // 3. Program Head @ BSIT
            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $arthur->id,
                    'role_id' => $progHeadRole->id,
                    'scope_level' => 'Program',
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsit?->id,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'SO-2025-PH-009',
                    'assignment_reason' => 'Designation as BSIT Program Head',
                    'status' => 'Active',
                    'effective_from' => '2025-01-01',
                ]
            );

            $arthur->update(['default_role_assignment_id' => $superAss->id]);
        }

        // Configure multi-role profile for Kaye Panaligan (kaye@institution.edu.ph)
        $kaye = User::where('email', 'kaye@institution.edu.ph')->first();
        if ($kaye) {
            $cids = College::where('code', 'CIDS')->first();
            $bsis = Program::where('code', 'BSIS')->first() ?? Program::first();

            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);
            $programHeadRole = Role::firstOrCreate(['name' => 'Program Head']);
            $vpafRole = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight']);

            $kaye->roles()->syncWithoutDetaching([
                $facultyRole->id,
                $programHeadRole->id,
                $vpafRole->id,
            ]);

            // Create Faculty profile if missing
            Faculty::firstOrCreate(
                ['user_id' => $kaye->id],
                [
                    'first_name' => 'Kaye',
                    'last_name' => 'Panaligan',
                    'spreadsheet_name' => 'PANALIGAN, K.',
                    'faculty_id' => 'FAC-2026-089',
                    'academic_rank' => 'Associate Professor V',
                    'employment_type' => 'Permanent / Full-Time',
                    'status' => 'Active',
                    'appointment_status' => 'Regular Permanent',
                    'highest_qualification' => 'Ph.D. in Information Systems',
                    'specialization' => 'Enterprise Architecture & Governance',
                    'email' => 'kaye@institution.edu.ph',
                    'program_id' => $bsis?->id,
                ]
            );

            // 1. Faculty Assignment in CIDS (BSIS)
            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $kaye->id,
                    'role_id' => $facultyRole->id,
                    'scope_level' => 'College',
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsis?->id,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'FAC-2024-CIDS-042',
                    'assignment_reason' => 'Substantive Faculty Appointment',
                    'status' => 'Active',
                    'effective_from' => '2024-08-01',
                ]
            );

            // 2. Program Head Assignment in BSIS
            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $kaye->id,
                    'role_id' => $programHeadRole->id,
                    'scope_level' => 'Program',
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsis?->id,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'SO-2025-PH-018',
                    'assignment_reason' => 'Designation as BSIS Program Head',
                    'status' => 'Active',
                    'effective_from' => '2025-01-15',
                ]
            );

            // 3. VPAF Assignment at Institution Scope
            $vpafAssignment = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $kaye->id,
                    'role_id' => $vpafRole->id,
                    'scope_level' => 'Institution',
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'entity_id' => null,
                    'college_id' => null,
                    'program_id' => null,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'BOR-RES-2026-004',
                    'assignment_reason' => 'Executive Oversight as Vice President for Academic & Financial Affairs',
                    'status' => 'Active',
                    'effective_from' => '2026-01-01',
                ]
            );

            $kaye->update(['default_role_assignment_id' => $vpafAssignment->id]);
        }

        // Configure dual role for Raymond Cruz (vpaf@dssc.edu.ph)
        $raymond = User::where('email', 'vpaf@dssc.edu.ph')->first();
        if ($raymond) {
            $cids = College::where('code', 'CIDS')->first();
            $bsit = Program::where('code', 'BSIT')->first() ?? Program::first();
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);
            $vpafRole = Role::firstOrCreate(['name' => 'VPAF / Executive Oversight']);

            $raymond->roles()->syncWithoutDetaching([$vpafRole->id, $facultyRole->id]);

            // Update VPAF assignment to Institution scope
            $vpafAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $raymond->id,
                    'role_id' => $vpafRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'Institution',
                    'entity_id' => null,
                    'college_id' => null,
                    'program_id' => null,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'BOR-RES-2025-012',
                    'status' => 'Active',
                    'effective_from' => '2025-06-01',
                ]
            );

            // Add Faculty assignment in CIDS
            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $raymond->id,
                    'role_id' => $facultyRole->id,
                    'scope_level' => 'College',
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsit?->id,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'FAC-2023-CIDS-015',
                    'status' => 'Active',
                    'effective_from' => '2023-08-01',
                ]
            );

            $raymond->update(['default_role_assignment_id' => $vpafAss->id]);
        }

        // Clean up accidental Dean role on Felomino Alba (alba@cids.edu) if present
        $alba = User::where('email', 'alba@cids.edu')->first();
        if ($alba) {
            $deanRole = Role::where('name', 'Dean')->first();
            if ($deanRole) {
                $alba->roles()->detach($deanRole->id);
                ScopedRoleAssignment::where('user_id', $alba->id)->where('role_id', $deanRole->id)->delete();
            }
        }

        // Ensure Eleanor Vance (dean@cids.edu) has Dean as Primary assignment in CIDS
        $eleanor = User::where('email', 'dean@cids.edu')->first();
        if ($eleanor) {
            $cids = College::where('code', 'CIDS')->first();
            $deanRole = Role::firstOrCreate(['name' => 'Dean']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $eleanor->roles()->syncWithoutDetaching([$deanRole->id, $facultyRole->id]);

            $deanAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $eleanor->id,
                    'role_id' => $deanRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => null,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'BOR-DEAN-2024-CIDS',
                    'assignment_reason' => 'Designation as Dean, College of Information and Digital Sciences',
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $eleanor->id,
                    'role_id' => $facultyRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => null,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'FAC-2020-CIDS-001',
                    'assignment_reason' => 'Substantive Faculty Rank (University Professor)',
                    'status' => 'Active',
                    'effective_from' => '2020-01-01',
                ]
            );

            $eleanor->update(['default_role_assignment_id' => $deanAss->id]);
        }

        // Ensure Evelyn Santos (programhead@cids.edu) has Program Head in BSIT
        $evelyn = User::where('email', 'programhead@cids.edu')->first();
        if ($evelyn) {
            $cids = College::where('code', 'CIDS')->first();
            $bsit = Program::where('code', 'BSIT')->first() ?? Program::first();
            $progHeadRole = Role::firstOrCreate(['name' => 'Program Head']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $evelyn->roles()->syncWithoutDetaching([$progHeadRole->id, $facultyRole->id]);

            $phAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $evelyn->id,
                    'role_id' => $progHeadRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'Program',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsit?->id,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'SO-2024-PH-BSIT',
                    'assignment_reason' => 'Designation as BSIT Program Head',
                    'status' => 'Active',
                    'effective_from' => '2024-01-15',
                ]
            );

            $evelyn->update(['default_role_assignment_id' => $phAss->id]);
        }

        // Ensure Engr. Marco Torres (headlab@cids.edu) and Ace Fuentes (labincharge@cids.edu) have correct Lab In-Charge scoped assignments
        $marco = User::where('email', 'headlab@cids.edu')->first();
        if ($marco) {
            $cids = College::where('code', 'CIDS')->first();
            $headLabRole = Role::firstOrCreate(['name' => 'Head Lab / Facility In-Charge']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $marco->roles()->syncWithoutDetaching([$headLabRole->id, $facultyRole->id]);

            $labAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $marco->id,
                    'role_id' => $headLabRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'SO-2024-LAB-HEAD',
                    'assignment_reason' => 'Designation as Head Laboratory & Facility In-Charge',
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            $marco->update(['default_role_assignment_id' => $labAss->id]);
        }

        $ace = User::where('email', 'labincharge@cids.edu')->first();
        if ($ace) {
            $cids = College::where('code', 'CIDS')->first();
            $labRole = Role::firstOrCreate(['name' => 'Lab In-Charge']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $ace->roles()->syncWithoutDetaching([$labRole->id, $facultyRole->id]);

            $labAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $ace->id,
                    'role_id' => $labRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'SO-2024-LAB-IC',
                    'assignment_reason' => 'Designation as Computer Laboratory In-Charge',
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            $ace->update(['default_role_assignment_id' => $labAss->id]);
        }

        // =========================================================================
        // SEED FACULTY AND PROGRAMS ACROSS OTHER COLLEGES (CED, CBA, COE, CAS)
        // =========================================================================
        $otherCollegesData = [
            'CED' => [
                'programs' => [
                    ['code' => 'BSED', 'name' => 'Bachelor of Secondary Education'],
                    ['code' => 'BEED', 'name' => 'Bachelor of Elementary Education'],
                ],
                'dean' => [
                    'name' => 'Dr. Carmela Bautista',
                    'email' => 'dean.ced@dssc.edu.ph',
                    'rank' => 'Professor IV',
                    'spec' => 'Educational Leadership & Curriculum Development',
                    'qual' => 'Ph.D. in Educational Management',
                ],
                'faculty' => [
                    [
                        'name' => 'Prof. Jonathan Cruz',
                        'first' => 'Jonathan',
                        'last' => 'Cruz',
                        'email' => 'jcruz@ced.dssc.edu.ph',
                        'program_code' => 'BSED',
                        'rank' => 'Associate Professor I',
                        'spec' => 'Science Education & Pedagogy',
                        'qual' => 'Master of Arts in Education',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Prof. Anna Reyes',
                        'first' => 'Anna',
                        'last' => 'Reyes',
                        'email' => 'areyes@ced.dssc.edu.ph',
                        'program_code' => 'BEED',
                        'rank' => 'Assistant Professor II',
                        'spec' => 'Early Childhood & Elementary Pedagogy',
                        'qual' => 'Master of Education',
                        'is_head' => false,
                    ],
                ],
            ],
            'CBA' => [
                'programs' => [
                    ['code' => 'BSBA', 'name' => 'Bachelor of Science in Business Administration'],
                    ['code' => 'BSA', 'name' => 'Bachelor of Science in Accountancy'],
                ],
                'dean' => [
                    'name' => 'Dr. Fernando Gomez',
                    'email' => 'dean.cba@dssc.edu.ph',
                    'rank' => 'Professor III',
                    'spec' => 'Financial Economics & Corporate Governance',
                    'qual' => 'Doctor of Business Administration',
                ],
                'faculty' => [
                    [
                        'name' => 'Prof. Teresa Lim',
                        'first' => 'Teresa',
                        'last' => 'Lim',
                        'email' => 'tlim@cba.dssc.edu.ph',
                        'program_code' => 'BSBA',
                        'rank' => 'Associate Professor II',
                        'spec' => 'Marketing Management & Strategic Planning',
                        'qual' => 'Master in Business Administration',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Prof. Dexter Tan',
                        'first' => 'Dexter',
                        'last' => 'Tan',
                        'email' => 'dtan@cba.dssc.edu.ph',
                        'program_code' => 'BSA',
                        'rank' => 'Assistant Professor III',
                        'spec' => 'Auditing & Taxation Systems',
                        'qual' => 'Master of Science in Accountancy',
                        'is_head' => false,
                    ],
                ],
            ],
            'COE' => [
                'programs' => [
                    ['code' => 'BSCE', 'name' => 'Bachelor of Science in Civil Engineering'],
                    ['code' => 'BSEE', 'name' => 'Bachelor of Science in Electrical Engineering'],
                ],
                'dean' => [
                    'name' => 'Engr. Victor Salcedo',
                    'email' => 'dean.coe@dssc.edu.ph',
                    'rank' => 'Professor II',
                    'spec' => 'Structural Dynamics & Earthquake Engineering',
                    'qual' => 'Ph.D. in Civil Engineering',
                ],
                'faculty' => [
                    [
                        'name' => 'Engr. Paolo Mendoza',
                        'first' => 'Paolo',
                        'last' => 'Mendoza',
                        'email' => 'pmendoza@coe.dssc.edu.ph',
                        'program_code' => 'BSCE',
                        'rank' => 'Associate Professor I',
                        'spec' => 'Geotechnical Engineering & Mechanics',
                        'qual' => 'Master of Science in Civil Engineering',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Engr. Grace Ramos',
                        'first' => 'Grace',
                        'last' => 'Ramos',
                        'email' => 'gramos@coe.dssc.edu.ph',
                        'program_code' => 'BSEE',
                        'rank' => 'Assistant Professor I',
                        'spec' => 'Power Systems & Renewable Energy',
                        'qual' => 'Master of Engineering in Electrical',
                        'is_head' => false,
                    ],
                ],
            ],
            'CAS' => [
                'programs' => [
                    ['code' => 'BACOMM', 'name' => 'Bachelor of Arts in Communication'],
                    ['code' => 'BSBIO', 'name' => 'Bachelor of Science in Biology'],
                ],
                'dean' => [
                    'name' => 'Dr. Rebecca Miranda',
                    'email' => 'dean.cas@dssc.edu.ph',
                    'rank' => 'Professor I',
                    'spec' => 'Applied Linguistics & Media Studies',
                    'qual' => 'Ph.D. in Applied Linguistics',
                ],
                'faculty' => [
                    [
                        'name' => 'Prof. Sarah David',
                        'first' => 'Sarah',
                        'last' => 'David',
                        'email' => 'sdavid@cas.dssc.edu.ph',
                        'program_code' => 'BACOMM',
                        'rank' => 'Associate Professor I',
                        'spec' => 'Development Communication & Journalism',
                        'qual' => 'Master of Arts in Communication',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Prof. Michael Chang',
                        'first' => 'Michael',
                        'last' => 'Chang',
                        'email' => 'mchang@cas.dssc.edu.ph',
                        'program_code' => 'BSBIO',
                        'rank' => 'Assistant Professor II',
                        'spec' => 'Molecular Biology & Genetics',
                        'qual' => 'Master of Science in Biology',
                        'is_head' => false,
                    ],
                ],
            ],
        ];

        $deanRole = Role::firstOrCreate(['name' => 'Dean']);
        $progHeadRole = Role::firstOrCreate(['name' => 'Program Head']);
        $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

        foreach ($otherCollegesData as $colCode => $colData) {
            $college = College::where('code', $colCode)->first();
            if (! $college) {
                continue;
            }

            // 1. Programs
            $programModels = [];
            foreach ($colData['programs'] as $progInfo) {
                $programModels[$progInfo['code']] = Program::firstOrCreate(
                    ['code' => $progInfo['code']],
                    [
                        'college_id' => $college->id,
                        'name' => $progInfo['name'],
                    ]
                );
                // Ensure correct college_id
                if ($programModels[$progInfo['code']]->college_id !== $college->id) {
                    $programModels[$progInfo['code']]->update(['college_id' => $college->id]);
                }
            }

            // 2. Dean User & Profile
            $deanInfo = $colData['dean'];
            $deanUser = User::firstOrCreate(
                ['email' => $deanInfo['email']],
                [
                    'name' => $deanInfo['name'],
                    'password' => $defaultPassword,
                ]
            );
            $deanUser->roles()->syncWithoutDetaching([$deanRole->id, $facultyRole->id]);

            Faculty::firstOrCreate(
                ['user_id' => $deanUser->id],
                [
                    'first_name' => explode(' ', $deanInfo['name'])[1] ?? 'Dean',
                    'last_name' => explode(' ', $deanInfo['name'])[2] ?? $colCode,
                    'spreadsheet_name' => strtoupper(explode(' ', $deanInfo['name'])[2] ?? $colCode).', '.substr(explode(' ', $deanInfo['name'])[1] ?? 'D', 0, 1).'.',
                    'faculty_id' => 'FAC-'.$colCode.'-001',
                    'academic_rank' => $deanInfo['rank'],
                    'employment_type' => 'Permanent / Full-Time',
                    'status' => 'Active',
                    'appointment_status' => 'Regular Permanent',
                    'highest_qualification' => $deanInfo['qual'],
                    'specialization' => $deanInfo['spec'],
                    'email' => $deanInfo['email'],
                    'program_id' => ! empty($programModels) ? reset($programModels)->id : null,
                ]
            );

            $colDeanAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $deanUser->id,
                    'role_id' => $deanRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $college->parent_id ?? $college->id,
                    'college_id' => $college->id,
                    'program_id' => null,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'BOR-DEAN-'.$colCode,
                    'assignment_reason' => "Designation as Dean of {$college->name}",
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $deanUser->id,
                    'role_id' => $facultyRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $college->parent_id ?? $college->id,
                    'college_id' => $college->id,
                    'program_id' => null,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'FAC-SUBSTANTIVE-'.$colCode,
                    'assignment_reason' => 'Substantive Faculty Rank',
                    'status' => 'Active',
                    'effective_from' => '2022-08-01',
                ]
            );

            $deanUser->update(['default_role_assignment_id' => $colDeanAss->id]);

            // 3. Faculty Members and Program Heads
            foreach ($colData['faculty'] as $facInfo) {
                $facUser = User::firstOrCreate(
                    ['email' => $facInfo['email']],
                    [
                        'name' => $facInfo['name'],
                        'password' => $defaultPassword,
                    ]
                );

                $program = $programModels[$facInfo['program_code']] ?? reset($programModels);

                Faculty::firstOrCreate(
                    ['user_id' => $facUser->id],
                    [
                        'first_name' => $facInfo['first'],
                        'last_name' => $facInfo['last'],
                        'spreadsheet_name' => strtoupper($facInfo['last']).', '.substr($facInfo['first'], 0, 1).'.',
                        'faculty_id' => 'FAC-'.$colCode.'-'.rand(100, 999),
                        'academic_rank' => $facInfo['rank'],
                        'employment_type' => 'Permanent / Full-Time',
                        'status' => 'Active',
                        'appointment_status' => 'Regular Permanent',
                        'highest_qualification' => $facInfo['qual'],
                        'specialization' => $facInfo['spec'],
                        'email' => $facInfo['email'],
                        'program_id' => $program?->id,
                    ]
                );

                if ($facInfo['is_head']) {
                    $facUser->roles()->syncWithoutDetaching([$progHeadRole->id, $facultyRole->id]);

                    $phAss = ScopedRoleAssignment::updateOrCreate(
                        [
                            'user_id' => $facUser->id,
                            'role_id' => $progHeadRole->id,
                        ],
                        [
                            'institution' => 'Davao Del Sur State College',
                            'scope_level' => 'Program',
                            'entity_id' => $college->parent_id ?? $college->id,
                            'college_id' => $college->id,
                            'program_id' => $program?->id,
                            'designation_type' => 'Primary',
                            'appointment_reference' => 'SO-'.$facInfo['program_code'].'-PH',
                            'assignment_reason' => "Designation as Program Head for {$facInfo['program_code']}",
                            'status' => 'Active',
                            'effective_from' => '2024-08-01',
                        ]
                    );

                    ScopedRoleAssignment::updateOrCreate(
                        [
                            'user_id' => $facUser->id,
                            'role_id' => $facultyRole->id,
                        ],
                        [
                            'institution' => 'Davao Del Sur State College',
                            'scope_level' => 'College',
                            'entity_id' => $college->parent_id ?? $college->id,
                            'college_id' => $college->id,
                            'program_id' => $program?->id,
                            'designation_type' => 'Concurrent',
                            'appointment_reference' => 'FAC-'.$colCode.'-REG',
                            'assignment_reason' => 'Substantive Faculty Appointment',
                            'status' => 'Active',
                            'effective_from' => '2023-08-01',
                        ]
                    );

                    $facUser->update(['default_role_assignment_id' => $phAss->id]);
                } else {
                    $facUser->roles()->syncWithoutDetaching([$facultyRole->id]);

                    $facAss = ScopedRoleAssignment::updateOrCreate(
                        [
                            'user_id' => $facUser->id,
                            'role_id' => $facultyRole->id,
                        ],
                        [
                            'institution' => 'Davao Del Sur State College',
                            'scope_level' => 'College',
                            'entity_id' => $college->parent_id ?? $college->id,
                            'college_id' => $college->id,
                            'program_id' => $program?->id,
                            'designation_type' => 'Primary',
                            'appointment_reference' => 'FAC-'.$colCode.'-REG',
                            'assignment_reason' => 'Substantive Faculty Appointment',
                            'status' => 'Active',
                            'effective_from' => '2023-08-01',
                        ]
                    );

                    $facUser->update(['default_role_assignment_id' => $facAss->id]);
                }
            }
        }

        // Clean up accidental Dean role on Felomino Alba (alba@cids.edu) if present
        $alba = User::where('email', 'alba@cids.edu')->first();
        if ($alba) {
            $deanRole = Role::where('name', 'Dean')->first();
            if ($deanRole) {
                $alba->roles()->detach($deanRole->id);
                ScopedRoleAssignment::where('user_id', $alba->id)->where('role_id', $deanRole->id)->delete();
            }
        }

        // Ensure Eleanor Vance (dean@cids.edu) has Dean as Primary assignment in CIDS
        $eleanor = User::where('email', 'dean@cids.edu')->first();
        if ($eleanor) {
            $cids = College::where('code', 'CIDS')->first();
            $deanRole = Role::firstOrCreate(['name' => 'Dean']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $eleanor->roles()->syncWithoutDetaching([$deanRole->id, $facultyRole->id]);

            $deanAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $eleanor->id,
                    'role_id' => $deanRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => null,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'BOR-DEAN-2024-CIDS',
                    'assignment_reason' => 'Designation as Dean, College of Information and Digital Sciences',
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $eleanor->id,
                    'role_id' => $facultyRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => null,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'FAC-2020-CIDS-001',
                    'assignment_reason' => 'Substantive Faculty Rank (University Professor)',
                    'status' => 'Active',
                    'effective_from' => '2020-01-01',
                ]
            );

            $eleanor->update(['default_role_assignment_id' => $deanAss->id]);
        }

        // Ensure Evelyn Santos (programhead@cids.edu) has Program Head in BSIT
        $evelyn = User::where('email', 'programhead@cids.edu')->first();
        if ($evelyn) {
            $cids = College::where('code', 'CIDS')->first();
            $bsit = Program::where('code', 'BSIT')->first() ?? Program::first();
            $progHeadRole = Role::firstOrCreate(['name' => 'Program Head']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $evelyn->roles()->syncWithoutDetaching([$progHeadRole->id, $facultyRole->id]);

            $phAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $evelyn->id,
                    'role_id' => $progHeadRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'Program',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'program_id' => $bsit?->id,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'SO-2024-PH-BSIT',
                    'assignment_reason' => 'Designation as BSIT Program Head',
                    'status' => 'Active',
                    'effective_from' => '2024-01-15',
                ]
            );

            $evelyn->update(['default_role_assignment_id' => $phAss->id]);
        }

        // Ensure Engr. Marco Torres (headlab@cids.edu) and Ace Fuentes (labincharge@cids.edu) have correct Lab In-Charge scoped assignments
        $marco = User::where('email', 'headlab@cids.edu')->first();
        if ($marco) {
            $cids = College::where('code', 'CIDS')->first();
            $headLabRole = Role::firstOrCreate(['name' => 'Head Lab / Facility In-Charge']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $marco->roles()->syncWithoutDetaching([$headLabRole->id, $facultyRole->id]);

            $labAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $marco->id,
                    'role_id' => $headLabRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'SO-2024-LAB-HEAD',
                    'assignment_reason' => 'Designation as Head Laboratory & Facility In-Charge',
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            $marco->update(['default_role_assignment_id' => $labAss->id]);
        }

        $ace = User::where('email', 'labincharge@cids.edu')->first();
        if ($ace) {
            $cids = College::where('code', 'CIDS')->first();
            $labRole = Role::firstOrCreate(['name' => 'Lab In-Charge']);
            $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

            $ace->roles()->syncWithoutDetaching([$labRole->id, $facultyRole->id]);

            $labAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $ace->id,
                    'role_id' => $labRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $cids?->parent_id ?? $cids?->id,
                    'college_id' => $cids?->id,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'SO-2024-LAB-IC',
                    'assignment_reason' => 'Designation as Computer Laboratory In-Charge',
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            $ace->update(['default_role_assignment_id' => $labAss->id]);
        }

        // =========================================================================
        // SEED FACULTY AND PROGRAMS ACROSS OTHER COLLEGES (CED, CBA, COE, CAS)
        // =========================================================================
        $otherCollegesData = [
            'CED' => [
                'programs' => [
                    ['code' => 'BSED', 'name' => 'Bachelor of Secondary Education'],
                    ['code' => 'BEED', 'name' => 'Bachelor of Elementary Education'],
                ],
                'dean' => [
                    'name' => 'Dr. Carmela Bautista',
                    'email' => 'dean.ced@dssc.edu.ph',
                    'rank' => 'Professor IV',
                    'spec' => 'Educational Leadership & Curriculum Development',
                    'qual' => 'Ph.D. in Educational Management',
                ],
                'faculty' => [
                    [
                        'name' => 'Prof. Jonathan Cruz',
                        'first' => 'Jonathan',
                        'last' => 'Cruz',
                        'email' => 'jcruz@ced.dssc.edu.ph',
                        'program_code' => 'BSED',
                        'rank' => 'Associate Professor I',
                        'spec' => 'Science Education & Pedagogy',
                        'qual' => 'Master of Arts in Education',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Prof. Anna Reyes',
                        'first' => 'Anna',
                        'last' => 'Reyes',
                        'email' => 'areyes@ced.dssc.edu.ph',
                        'program_code' => 'BEED',
                        'rank' => 'Assistant Professor II',
                        'spec' => 'Early Childhood & Elementary Pedagogy',
                        'qual' => 'Master of Education',
                        'is_head' => false,
                    ],
                ],
            ],
            'CBA' => [
                'programs' => [
                    ['code' => 'BSBA', 'name' => 'Bachelor of Science in Business Administration'],
                    ['code' => 'BSA', 'name' => 'Bachelor of Science in Accountancy'],
                ],
                'dean' => [
                    'name' => 'Dr. Fernando Gomez',
                    'email' => 'dean.cba@dssc.edu.ph',
                    'rank' => 'Professor III',
                    'spec' => 'Financial Economics & Corporate Governance',
                    'qual' => 'Doctor of Business Administration',
                ],
                'faculty' => [
                    [
                        'name' => 'Prof. Teresa Lim',
                        'first' => 'Teresa',
                        'last' => 'Lim',
                        'email' => 'tlim@cba.dssc.edu.ph',
                        'program_code' => 'BSBA',
                        'rank' => 'Associate Professor II',
                        'spec' => 'Marketing Management & Strategic Planning',
                        'qual' => 'Master in Business Administration',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Prof. Dexter Tan',
                        'first' => 'Dexter',
                        'last' => 'Tan',
                        'email' => 'dtan@cba.dssc.edu.ph',
                        'program_code' => 'BSA',
                        'rank' => 'Assistant Professor III',
                        'spec' => 'Auditing & Taxation Systems',
                        'qual' => 'Master of Science in Accountancy',
                        'is_head' => false,
                    ],
                ],
            ],
            'COE' => [
                'programs' => [
                    ['code' => 'BSCE', 'name' => 'Bachelor of Science in Civil Engineering'],
                    ['code' => 'BSEE', 'name' => 'Bachelor of Science in Electrical Engineering'],
                ],
                'dean' => [
                    'name' => 'Engr. Victor Salcedo',
                    'email' => 'dean.coe@dssc.edu.ph',
                    'rank' => 'Professor II',
                    'spec' => 'Structural Dynamics & Earthquake Engineering',
                    'qual' => 'Ph.D. in Civil Engineering',
                ],
                'faculty' => [
                    [
                        'name' => 'Engr. Paolo Mendoza',
                        'first' => 'Paolo',
                        'last' => 'Mendoza',
                        'email' => 'pmendoza@coe.dssc.edu.ph',
                        'program_code' => 'BSCE',
                        'rank' => 'Associate Professor I',
                        'spec' => 'Geotechnical Engineering & Mechanics',
                        'qual' => 'Master of Science in Civil Engineering',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Engr. Grace Ramos',
                        'first' => 'Grace',
                        'last' => 'Ramos',
                        'email' => 'gramos@coe.dssc.edu.ph',
                        'program_code' => 'BSEE',
                        'rank' => 'Assistant Professor I',
                        'spec' => 'Power Systems & Renewable Energy',
                        'qual' => 'Master of Engineering in Electrical',
                        'is_head' => false,
                    ],
                ],
            ],
            'CAS' => [
                'programs' => [
                    ['code' => 'BACOMM', 'name' => 'Bachelor of Arts in Communication'],
                    ['code' => 'BSBIO', 'name' => 'Bachelor of Science in Biology'],
                ],
                'dean' => [
                    'name' => 'Dr. Rebecca Miranda',
                    'email' => 'dean.cas@dssc.edu.ph',
                    'rank' => 'Professor I',
                    'spec' => 'Applied Linguistics & Media Studies',
                    'qual' => 'Ph.D. in Applied Linguistics',
                ],
                'faculty' => [
                    [
                        'name' => 'Prof. Sarah David',
                        'first' => 'Sarah',
                        'last' => 'David',
                        'email' => 'sdavid@cas.dssc.edu.ph',
                        'program_code' => 'BACOMM',
                        'rank' => 'Associate Professor I',
                        'spec' => 'Development Communication & Journalism',
                        'qual' => 'Master of Arts in Communication',
                        'is_head' => true,
                    ],
                    [
                        'name' => 'Prof. Michael Chang',
                        'first' => 'Michael',
                        'last' => 'Chang',
                        'email' => 'mchang@cas.dssc.edu.ph',
                        'program_code' => 'BSBIO',
                        'rank' => 'Assistant Professor II',
                        'spec' => 'Molecular Biology & Genetics',
                        'qual' => 'Master of Science in Biology',
                        'is_head' => false,
                    ],
                ],
            ],
        ];

        $deanRole = Role::firstOrCreate(['name' => 'Dean']);
        $progHeadRole = Role::firstOrCreate(['name' => 'Program Head']);
        $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);

        foreach ($otherCollegesData as $colCode => $colData) {
            $college = College::where('code', $colCode)->first();
            if (! $college) {
                continue;
            }

            // 1. Programs
            $programModels = [];
            foreach ($colData['programs'] as $progInfo) {
                $programModels[$progInfo['code']] = Program::firstOrCreate(
                    ['code' => $progInfo['code']],
                    [
                        'college_id' => $college->id,
                        'name' => $progInfo['name'],
                    ]
                );
                // Ensure correct college_id
                if ($programModels[$progInfo['code']]->college_id !== $college->id) {
                    $programModels[$progInfo['code']]->update(['college_id' => $college->id]);
                }
            }

            // 2. Dean User & Profile
            $deanInfo = $colData['dean'];
            $deanUser = User::firstOrCreate(
                ['email' => $deanInfo['email']],
                [
                    'name' => $deanInfo['name'],
                    'password' => $defaultPassword,
                ]
            );
            $deanUser->roles()->syncWithoutDetaching([$deanRole->id, $facultyRole->id]);

            Faculty::firstOrCreate(
                ['user_id' => $deanUser->id],
                [
                    'first_name' => explode(' ', $deanInfo['name'])[1] ?? 'Dean',
                    'last_name' => explode(' ', $deanInfo['name'])[2] ?? $colCode,
                    'spreadsheet_name' => strtoupper(explode(' ', $deanInfo['name'])[2] ?? $colCode).', '.substr(explode(' ', $deanInfo['name'])[1] ?? 'D', 0, 1).'.',
                    'faculty_id' => 'FAC-'.$colCode.'-001',
                    'academic_rank' => $deanInfo['rank'],
                    'employment_type' => 'Permanent / Full-Time',
                    'status' => 'Active',
                    'appointment_status' => 'Regular Permanent',
                    'highest_qualification' => $deanInfo['qual'],
                    'specialization' => $deanInfo['spec'],
                    'email' => $deanInfo['email'],
                    'program_id' => ! empty($programModels) ? reset($programModels)->id : null,
                ]
            );

            $colDeanAss = ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $deanUser->id,
                    'role_id' => $deanRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $college->parent_id ?? $college->id,
                    'college_id' => $college->id,
                    'program_id' => null,
                    'designation_type' => 'Primary',
                    'appointment_reference' => 'BOR-DEAN-'.$colCode,
                    'assignment_reason' => "Designation as Dean of {$college->name}",
                    'status' => 'Active',
                    'effective_from' => '2024-01-01',
                ]
            );

            ScopedRoleAssignment::updateOrCreate(
                [
                    'user_id' => $deanUser->id,
                    'role_id' => $facultyRole->id,
                ],
                [
                    'institution' => 'Davao Del Sur State College',
                    'scope_level' => 'College',
                    'entity_id' => $college->parent_id ?? $college->id,
                    'college_id' => $college->id,
                    'program_id' => null,
                    'designation_type' => 'Concurrent',
                    'appointment_reference' => 'FAC-SUBSTANTIVE-'.$colCode,
                    'assignment_reason' => 'Substantive Faculty Rank',
                    'status' => 'Active',
                    'effective_from' => '2022-08-01',
                ]
            );

            $deanUser->update(['default_role_assignment_id' => $colDeanAss->id]);

            // 3. Faculty Members and Program Heads
            foreach ($colData['faculty'] as $facInfo) {
                $facUser = User::firstOrCreate(
                    ['email' => $facInfo['email']],
                    [
                        'name' => $facInfo['name'],
                        'password' => $defaultPassword,
                    ]
                );

                $program = $programModels[$facInfo['program_code']] ?? reset($programModels);

                Faculty::firstOrCreate(
                    ['user_id' => $facUser->id],
                    [
                        'first_name' => $facInfo['first'],
                        'last_name' => $facInfo['last'],
                        'spreadsheet_name' => strtoupper($facInfo['last']).', '.substr($facInfo['first'], 0, 1).'.',
                        'faculty_id' => 'FAC-'.$colCode.'-'.rand(100, 999),
                        'academic_rank' => $facInfo['rank'],
                        'employment_type' => 'Permanent / Full-Time',
                        'status' => 'Active',
                        'appointment_status' => 'Regular Permanent',
                        'highest_qualification' => $facInfo['qual'],
                        'specialization' => $facInfo['spec'],
                        'email' => $facInfo['email'],
                        'program_id' => $program?->id,
                    ]
                );

                if ($facInfo['is_head']) {
                    $facUser->roles()->syncWithoutDetaching([$progHeadRole->id, $facultyRole->id]);

                    $phAss = ScopedRoleAssignment::updateOrCreate(
                        [
                            'user_id' => $facUser->id,
                            'role_id' => $progHeadRole->id,
                        ],
                        [
                            'institution' => 'Davao Del Sur State College',
                            'scope_level' => 'Program',
                            'entity_id' => $college->parent_id ?? $college->id,
                            'college_id' => $college->id,
                            'program_id' => $program?->id,
                            'designation_type' => 'Primary',
                            'appointment_reference' => 'SO-'.$facInfo['program_code'].'-PH',
                            'assignment_reason' => "Designation as Program Head for {$facInfo['program_code']}",
                            'status' => 'Active',
                            'effective_from' => '2024-08-01',
                        ]
                    );

                    ScopedRoleAssignment::updateOrCreate(
                        [
                            'user_id' => $facUser->id,
                            'role_id' => $facultyRole->id,
                        ],
                        [
                            'institution' => 'Davao Del Sur State College',
                            'scope_level' => 'College',
                            'entity_id' => $college->parent_id ?? $college->id,
                            'college_id' => $college->id,
                            'program_id' => $program?->id,
                            'designation_type' => 'Concurrent',
                            'appointment_reference' => 'FAC-'.$colCode.'-REG',
                            'assignment_reason' => 'Substantive Faculty Appointment',
                            'status' => 'Active',
                            'effective_from' => '2023-08-01',
                        ]
                    );

                    $facUser->update(['default_role_assignment_id' => $phAss->id]);
                } else {
                    $facUser->roles()->syncWithoutDetaching([$facultyRole->id]);

                    $facAss = ScopedRoleAssignment::updateOrCreate(
                        [
                            'user_id' => $facUser->id,
                            'role_id' => $facultyRole->id,
                        ],
                        [
                            'institution' => 'Davao Del Sur State College',
                            'scope_level' => 'College',
                            'entity_id' => $college->parent_id ?? $college->id,
                            'college_id' => $college->id,
                            'program_id' => $program?->id,
                            'designation_type' => 'Primary',
                            'appointment_reference' => 'FAC-'.$colCode.'-REG',
                            'assignment_reason' => 'Substantive Faculty Appointment',
                            'status' => 'Active',
                            'effective_from' => '2023-08-01',
                        ]
                    );

                    $facUser->update(['default_role_assignment_id' => $facAss->id]);
                }
            }
        }
    }
}
