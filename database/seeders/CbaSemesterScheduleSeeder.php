<?php

namespace Database\Seeders;

use App\Models\AcademicPeriod;
use App\Models\College;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Curriculum;
use App\Models\Faculty;
use App\Models\FacultyAvailability;
use App\Models\FacultyCredit;
use App\Models\FacultyPreference;
use App\Models\FacultySpecialization;
use App\Models\Program;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomSchedule;
use App\Models\ScopedRoleAssignment;
use App\Models\Section;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CbaSemesterScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Current Academic Period
        $currentPeriod = AcademicPeriod::where('is_current', true)->first();
        if (! $currentPeriod) {
            $currentPeriod = AcademicPeriod::firstOrCreate(
                ['code' => 'AY2627-1S'],
                [
                    'academic_year' => '2026 – 2027',
                    'semester' => '1st Semester',
                    'start_date' => '2026-08-17',
                    'end_date' => '2026-12-18',
                    'class_start_date' => '2026-08-17',
                    'class_end_date' => '2026-12-18',
                    'status' => 'Active',
                    'is_current' => true,
                    'planning_rules_version' => 'Version 3',
                ]
            );
        }

        // 2. Ensure CBA College (ID 6)
        $cba = College::find(6);
        if (! $cba) {
            $cba = College::firstOrCreate(
                ['code' => 'CBA'],
                [
                    'id' => 6,
                    'name' => 'College of Business Administration',
                    'type' => 'college',
                ]
            );
        } else {
            $cba->update([
                'name' => 'College of Business Administration',
                'code' => 'CBA',
            ]);
        }

        // 3. Ensure Programs under CBA (BSBA & BSA)
        $bsba = Program::updateOrCreate(
            ['code' => 'BSBA'],
            [
                'college_id' => $cba->id,
                'name' => 'Bachelor of Science in Business Administration',
            ]
        );

        $bsa = Program::updateOrCreate(
            ['code' => 'BSA'],
            [
                'college_id' => $cba->id,
                'name' => 'Bachelor of Science in Accountancy',
            ]
        );

        // Curricula
        $curriculumBsba = Curriculum::firstOrCreate(
            ['program_id' => $bsba->id, 'version_name' => '2024 Revised BSBA CMO 17'],
            ['effective_year' => '2024', 'total_units' => 140, 'status' => 'Active', 'is_active' => true]
        );

        $curriculumBsa = Curriculum::firstOrCreate(
            ['program_id' => $bsa->id, 'version_name' => '2024 Revised BSA CMO 27'],
            ['effective_year' => '2024', 'total_units' => 156, 'status' => 'Active', 'is_active' => true]
        );

        // 4. Physical Rooms & Labs for CBA
        $roomsData = [
            ['room_code' => 'CBA-101', 'room_name' => 'CBA 101', 'building' => 'CBA Building', 'floor' => '1st Floor', 'type' => 'Lecture', 'capacity' => 45],
            ['room_code' => 'CBA-102', 'room_name' => 'CBA 102', 'building' => 'CBA Building', 'floor' => '1st Floor', 'type' => 'Lecture', 'capacity' => 45],
            ['room_code' => 'CBA-201', 'room_name' => 'CBA 201', 'building' => 'CBA Building', 'floor' => '2nd Floor', 'type' => 'Lecture', 'capacity' => 50],
            ['room_code' => 'CBA-202', 'room_name' => 'CBA 202', 'building' => 'CBA Building', 'floor' => '2nd Floor', 'type' => 'Lecture', 'capacity' => 50],
            ['room_code' => 'CBA-301', 'room_name' => 'CBA 301', 'building' => 'CBA Building', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 40],
            ['room_code' => 'CBA-LAB1', 'room_name' => 'CBA Lab 1', 'building' => 'CBA Building', 'floor' => '2nd Floor', 'type' => 'Computer Laboratory', 'custom_type' => 'Accounting Computer Lab', 'capacity' => 35],
            ['room_code' => 'CBA-LAB2', 'room_name' => 'CBA Lab 2', 'building' => 'CBA Building', 'floor' => '3rd Floor', 'type' => 'Computer Laboratory', 'custom_type' => 'Business Analytics Lab', 'capacity' => 35],
            ['room_code' => 'CBA-CASE', 'room_name' => 'CBA Case Room', 'building' => 'CBA Building', 'floor' => '3rd Floor', 'type' => 'Auditorium', 'capacity' => 40],
        ];

        foreach ($roomsData as $r) {
            Room::updateOrCreate(
                ['room_name' => $r['room_name']],
                array_merge($r, ['college_id' => $cba->id, 'status' => 'Active', 'setup_readiness' => 'Ready'])
            );
        }

        // 5. Courses Catalog for CBA
        $coursesData = [
            // BSBA Courses
            ['code' => 'BA 111', 'title' => 'Principles of Management', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 1, 'spec' => 'Management', 'room' => 'Lecture'],
            ['code' => 'BA 112', 'title' => 'Business Mathematics', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 1, 'spec' => 'Quantitative Business', 'room' => 'Lecture'],
            ['code' => 'BA 121', 'title' => 'Financial Management', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 2, 'spec' => 'Corporate Finance', 'room' => 'Lecture'],
            ['code' => 'BA 122', 'title' => 'Principles of Marketing', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 1, 'spec' => 'Marketing Management', 'room' => 'Lecture'],
            ['code' => 'BA 211', 'title' => 'Human Resource Management', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 2, 'spec' => 'Human Resources', 'room' => 'Lecture'],
            ['code' => 'BA 212', 'title' => 'Business Law & Obligations', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 2, 'spec' => 'Business Law', 'room' => 'Lecture'],
            ['code' => 'BA 221', 'title' => 'Strategic Management', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 3, 'spec' => 'Strategic Management', 'room' => 'Lecture'],
            ['code' => 'BA 222', 'title' => 'Operations & Production Management', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 3, 'spec' => 'Operations Management', 'room' => 'Lecture'],
            ['code' => 'BA 311', 'title' => 'Business Analytics & Big Data', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 3, 'spec' => 'Business Analytics', 'room' => 'Computer Laboratory'],
            ['code' => 'BA 312', 'title' => 'International Trade & Business', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 3, 'spec' => 'International Business', 'room' => 'Lecture'],
            ['code' => 'BA 321', 'title' => 'Digital Marketing & E-Commerce', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 4, 'spec' => 'Marketing Management', 'room' => 'Computer Laboratory'],
            ['code' => 'BA 411', 'title' => 'Business Research & Feasibility', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsba, 'curriculum' => $curriculumBsba, 'year' => 4, 'spec' => 'Strategic Management', 'room' => 'Lecture'],

            // BSA Courses
            ['code' => 'ACT 111', 'title' => 'Financial Accounting & Reporting I', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 1, 'spec' => 'Financial Accounting', 'room' => 'Lecture'],
            ['code' => 'ACT 112', 'title' => 'Conceptual Framework & Standards', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 1, 'spec' => 'Financial Accounting', 'room' => 'Lecture'],
            ['code' => 'ACT 121', 'title' => 'Intermediate Accounting I', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 2, 'spec' => 'Financial Accounting', 'room' => 'Lecture'],
            ['code' => 'ACT 122', 'title' => 'Cost Accounting & Control', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 2, 'spec' => 'Cost Accounting', 'room' => 'Lecture'],
            ['code' => 'ACT 211', 'title' => 'Financial Accounting & Reporting II', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 2, 'spec' => 'Financial Accounting', 'room' => 'Lecture'],
            ['code' => 'ACT 212', 'title' => 'Strategic Cost Management', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 3, 'spec' => 'Cost Accounting', 'room' => 'Lecture'],
            ['code' => 'ACT 221', 'title' => 'Accounting Information Systems', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 2, 'spec' => 'Accounting Information Systems', 'room' => 'Computer Laboratory'],
            ['code' => 'ACT 222', 'title' => 'Income Taxation', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 3, 'spec' => 'Taxation', 'room' => 'Lecture'],
            ['code' => 'ACT 311', 'title' => 'Business & Transfer Taxation', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 3, 'spec' => 'Taxation', 'room' => 'Lecture'],
            ['code' => 'ACT 312', 'title' => 'Auditing & Assurance Principles', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 3, 'spec' => 'Auditing', 'room' => 'Lecture'],
            ['code' => 'ACT 321', 'title' => 'Regulatory Framework in Business', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 4, 'spec' => 'Business Law', 'room' => 'Lecture'],
            ['code' => 'ACT 411', 'title' => 'Integrated Accounting Review', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'program' => $bsa, 'curriculum' => $curriculumBsa, 'year' => 4, 'spec' => 'Financial Accounting', 'room' => 'Lecture'],
        ];

        $courses = [];
        foreach ($coursesData as $c) {
            $courses[$c['code']] = Course::updateOrCreate(
                ['code' => $c['code']],
                [
                    'curriculum_id' => $c['curriculum']->id,
                    'program_id' => $c['program']->id,
                    'title' => $c['title'],
                    'units' => $c['units'],
                    'lecture_hours' => $c['lec'],
                    'lab_hours' => $c['lab'],
                    'room_type_required' => $c['room'],
                    'consecutive_lab_required' => $c['lab'] > 0,
                    'year_level' => $c['year'],
                    'semester_placement' => '1st Semester',
                    'category' => 'Major',
                    'specialization_tag' => $c['spec'],
                    'status' => 'Active',
                ]
            );
        }

        // 6. Student Sections for CBA
        $sectionsData = [
            ['program' => $bsba, 'curriculum' => $curriculumBsba, 'code' => 'BSBA 1A', 'year' => 1, 'pop' => 40],
            ['program' => $bsba, 'curriculum' => $curriculumBsba, 'code' => 'BSBA 1B', 'year' => 1, 'pop' => 38],
            ['program' => $bsba, 'curriculum' => $curriculumBsba, 'code' => 'BSBA 2A', 'year' => 2, 'pop' => 36],
            ['program' => $bsba, 'curriculum' => $curriculumBsba, 'code' => 'BSBA 2B', 'year' => 2, 'pop' => 35],
            ['program' => $bsba, 'curriculum' => $curriculumBsba, 'code' => 'BSBA 3A', 'year' => 3, 'pop' => 32],
            ['program' => $bsba, 'curriculum' => $curriculumBsba, 'code' => 'BSBA 4A', 'year' => 4, 'pop' => 30],

            ['program' => $bsa, 'curriculum' => $curriculumBsa, 'code' => 'BSA 1A', 'year' => 1, 'pop' => 35],
            ['program' => $bsa, 'curriculum' => $curriculumBsa, 'code' => 'BSA 1B', 'year' => 1, 'pop' => 34],
            ['program' => $bsa, 'curriculum' => $curriculumBsa, 'code' => 'BSA 2A', 'year' => 2, 'pop' => 30],
            ['program' => $bsa, 'curriculum' => $curriculumBsa, 'code' => 'BSA 2B', 'year' => 2, 'pop' => 29],
            ['program' => $bsa, 'curriculum' => $curriculumBsa, 'code' => 'BSA 3A', 'year' => 3, 'pop' => 28],
            ['program' => $bsa, 'curriculum' => $curriculumBsa, 'code' => 'BSA 4A', 'year' => 4, 'pop' => 26],
        ];

        foreach ($sectionsData as $s) {
            Section::updateOrCreate(
                ['code' => $s['code'], 'academic_period_id' => $currentPeriod->id],
                [
                    'program_id' => $s['program']->id,
                    'curriculum_id' => $s['curriculum']->id,
                    'year_level' => $s['year'],
                    'population' => $s['pop'],
                    'actual_count' => $s['pop'],
                    'status' => 'Active',
                ]
            );
        }

        // 7. Faculty Pool for CBA (Leadership + Flagship Faculty)
        $facultySeedList = [
            // Leadership
            [
                'first_name' => 'Alberto',
                'last_name' => 'Valenzuela',
                'faculty_id' => 'CBA-2026-001',
                'rank' => 'Professor VI',
                'program' => $bsba,
                'designation' => 'Dean',
                'target_load' => 6.0,
                'min_load' => 3.0,
                'max_load' => 9.0,
                'specialization' => 'Strategic Management',
                'specialization_tags' => ['Strategic Management', 'Management', 'Corporate Governance'],
                'credit_type' => 'Designation',
                'credit_hours' => 9.0,
                'credit_role' => 'College Dean (CBA)',
                'pref_courses' => ['BA 221', 'BA 411'],
            ],
            [
                'first_name' => 'Fernando',
                'last_name' => 'Gomez',
                'faculty_id' => 'CBA-2026-002',
                'rank' => 'Professor III',
                'program' => $bsba,
                'designation' => 'Program Chair',
                'target_load' => 9.0,
                'min_load' => 6.0,
                'max_load' => 12.0,
                'specialization' => 'Corporate Finance',
                'specialization_tags' => ['Corporate Finance', 'Quantitative Business', 'Financial Economics'],
                'credit_type' => 'Designation',
                'credit_hours' => 6.0,
                'credit_role' => 'Program Head (BSBA)',
                'pref_courses' => ['BA 121', 'BA 112'],
            ],
            [
                'first_name' => 'Dexter',
                'last_name' => 'Tan',
                'faculty_id' => 'CBA-2026-003',
                'rank' => 'Associate Professor III',
                'program' => $bsa,
                'designation' => 'Program Chair',
                'target_load' => 9.0,
                'min_load' => 6.0,
                'max_load' => 12.0,
                'specialization' => 'Auditing',
                'specialization_tags' => ['Auditing', 'Taxation', 'Financial Accounting'],
                'credit_type' => 'Designation',
                'credit_hours' => 6.0,
                'credit_role' => 'Program Head (BSA)',
                'pref_courses' => ['ACT 312', 'ACT 222'],
            ],
            [
                'first_name' => 'Teresa',
                'last_name' => 'Lim',
                'faculty_id' => 'CBA-2026-004',
                'rank' => 'Associate Professor II',
                'program' => $bsba,
                'designation' => 'Faculty',
                'target_load' => 9.0,
                'min_load' => 6.0,
                'max_load' => 15.0,
                'specialization' => 'Marketing Management',
                'specialization_tags' => ['Marketing Management', 'Digital Marketing', 'Consumer Behavior'],
                'credit_type' => 'Research',
                'credit_hours' => 3.0,
                'credit_role' => 'CBA Research Lead',
                'pref_courses' => ['BA 122', 'BA 321'],
            ],
            [
                'first_name' => 'Jocelyn',
                'last_name' => 'Morales',
                'faculty_id' => 'CBA-2026-005',
                'rank' => 'Assistant Professor II',
                'program' => $bsba,
                'designation' => 'Faculty',
                'target_load' => 9.0,
                'min_load' => 6.0,
                'max_load' => 15.0,
                'specialization' => 'Business Analytics',
                'specialization_tags' => ['Business Analytics', 'Operations Management'],
                'credit_type' => 'Extension',
                'credit_hours' => 3.0,
                'credit_role' => 'MSME Extension Coordinator',
                'pref_courses' => ['BA 311', 'BA 222'],
            ],
            [
                'first_name' => 'Patrick',
                'last_name' => 'Cruz',
                'faculty_id' => 'CBA-2026-006',
                'rank' => 'Instructor III',
                'program' => $bsa,
                'designation' => 'Faculty',
                'target_load' => 9.0,
                'min_load' => 6.0,
                'max_load' => 15.0,
                'specialization' => 'Accounting Information Systems',
                'specialization_tags' => ['Accounting Information Systems', 'Financial Accounting'],
                'credit_type' => 'Administrative',
                'credit_hours' => 3.0,
                'credit_role' => 'CBA Lab Coordinator',
                'pref_courses' => ['ACT 221', 'ACT 111'],
            ],

            // BSBA Teaching Faculty
            [
                'first_name' => 'Ricardo',
                'last_name' => 'Santos',
                'faculty_id' => 'CBA-2026-007',
                'rank' => 'Assistant Professor IV',
                'program' => $bsba,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Human Resources',
                'specialization_tags' => ['Human Resources', 'Management', 'Business Ethics'],
                'credit_type' => null,
                'pref_courses' => ['BA 211', 'BA 111'],
            ],
            [
                'first_name' => 'Gabriel',
                'last_name' => 'Dela Rosa',
                'faculty_id' => 'CBA-2026-008',
                'rank' => 'Assistant Professor I',
                'program' => $bsba,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Operations Management',
                'specialization_tags' => ['Operations Management', 'Management'],
                'credit_type' => null,
                'pref_courses' => ['BA 222', 'BA 111'],
            ],
            [
                'first_name' => 'Katrina',
                'last_name' => 'Villareal',
                'faculty_id' => 'CBA-2026-009',
                'rank' => 'Instructor III',
                'program' => $bsba,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Marketing Management',
                'specialization_tags' => ['Marketing Management', 'Digital Marketing'],
                'credit_type' => null,
                'pref_courses' => ['BA 122', 'BA 321'],
            ],
            [
                'first_name' => 'Marcus',
                'last_name' => 'Chen',
                'faculty_id' => 'CBA-2026-010',
                'rank' => 'Instructor II',
                'program' => $bsba,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Business Law',
                'specialization_tags' => ['Business Law', 'Regulatory Framework'],
                'credit_type' => null,
                'pref_courses' => ['BA 212', 'ACT 321'],
            ],
            [
                'first_name' => 'Angela',
                'last_name' => 'Bautista',
                'faculty_id' => 'CBA-2026-011',
                'rank' => 'Instructor I',
                'program' => $bsba,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'International Business',
                'specialization_tags' => ['International Business', 'Management'],
                'credit_type' => null,
                'pref_courses' => ['BA 312', 'BA 111'],
            ],

            // BSA Teaching Faculty
            [
                'first_name' => 'Elena',
                'last_name' => 'Soriano',
                'faculty_id' => 'CBA-2026-012',
                'rank' => 'Associate Professor I',
                'program' => $bsa,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Financial Accounting',
                'specialization_tags' => ['Financial Accounting', 'Intermediate Accounting'],
                'credit_type' => null,
                'pref_courses' => ['ACT 111', 'ACT 121', 'ACT 211'],
            ],
            [
                'first_name' => 'Carmela',
                'last_name' => 'Reyes',
                'faculty_id' => 'CBA-2026-013',
                'rank' => 'Assistant Professor III',
                'program' => $bsa,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Cost Accounting',
                'specialization_tags' => ['Cost Accounting', 'Managerial Accounting'],
                'credit_type' => null,
                'pref_courses' => ['ACT 122', 'ACT 212'],
            ],
            [
                'first_name' => 'Danilo',
                'last_name' => 'Navarro',
                'faculty_id' => 'CBA-2026-014',
                'rank' => 'Assistant Professor II',
                'program' => $bsa,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Auditing',
                'specialization_tags' => ['Auditing', 'Assurance Services'],
                'credit_type' => null,
                'pref_courses' => ['ACT 312', 'ACT 411'],
            ],
            [
                'first_name' => 'Bea',
                'last_name' => 'Mendoza',
                'faculty_id' => 'CBA-2026-015',
                'rank' => 'Assistant Professor I',
                'program' => $bsa,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Taxation',
                'specialization_tags' => ['Taxation', 'Income Taxation', 'Business Taxation'],
                'credit_type' => null,
                'pref_courses' => ['ACT 222', 'ACT 311'],
            ],
            [
                'first_name' => 'Sophia',
                'last_name' => 'Gutierrez',
                'faculty_id' => 'CBA-2026-016',
                'rank' => 'Instructor II',
                'program' => $bsa,
                'designation' => 'Faculty',
                'target_load' => 12.0,
                'min_load' => 9.0,
                'max_load' => 18.0,
                'specialization' => 'Financial Accounting',
                'specialization_tags' => ['Financial Accounting', 'Accounting Standards'],
                'credit_type' => null,
                'pref_courses' => ['ACT 112', 'ACT 111'],
            ],
        ];

        $facultyCreated = [];
        foreach ($facultySeedList as $fData) {
            $faculty = Faculty::updateOrCreate(
                ['faculty_id' => $fData['faculty_id']],
                [
                    'program_id' => $fData['program']->id,
                    'first_name' => $fData['first_name'],
                    'last_name' => $fData['last_name'],
                    'academic_rank' => $fData['rank'],
                    'employment_type' => 'Full-time',
                    'appointment_status' => 'Regular',
                    'status' => 'Active',
                    'specialization' => $fData['specialization'],
                    'min_load_hours' => $fData['min_load'],
                    'target_load_hours' => $fData['target_load'],
                    'max_load_hours' => $fData['max_load'],
                    'email' => strtolower($fData['first_name'][0].$fData['last_name']).'@cba.dssc.edu.ph',
                ]
            );

            $facultyCreated[$fData['faculty_id']] = $faculty;

            // Specialization tags
            foreach ($fData['specialization_tags'] as $idx => $tag) {
                FacultySpecialization::updateOrCreate(
                    ['faculty_id' => $faculty->id, 'expertise_area' => $tag],
                    [
                        'level' => 'Expert',
                        'qualification_level' => 'Masteral / Industry Certified',
                        'course_category_match' => $fData['specialization'],
                        'is_verified' => true,
                        'verification_status' => 'Verified',
                        'display_order' => $idx + 1,
                    ]
                );
            }

            // Preferences
            $prefCourseIds = Course::whereIn('code', $fData['pref_courses'])->pluck('id')->toArray();
            FacultyPreference::updateOrCreate(
                ['faculty_id' => $faculty->id, 'academic_period_id' => $currentPeriod->id],
                [
                    'preferred_course_ids' => $prefCourseIds,
                    'preferred_days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'preferred_min_load' => $fData['min_load'],
                    'preferred_max_load' => $fData['max_load'],
                    'preferred_max_preparations' => 3,
                    'avoid_early_morning' => false,
                    'avoid_late_evening' => true,
                ]
            );

            // Availabilities (Mon - Fri)
            foreach (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as $day) {
                FacultyAvailability::updateOrCreate(
                    [
                        'faculty_id' => $faculty->id,
                        'academic_year' => $currentPeriod->academic_year,
                        'semester' => $currentPeriod->semester,
                        'day_of_week' => $day,
                    ],
                    [
                        'preferred_start_time' => '08:00:00',
                        'preferred_end_time' => '17:00:00',
                        'status' => 'available',
                    ]
                );
            }

            // Workload Credits (for leaders and coordinators)
            if (! empty($fData['credit_type'])) {
                FacultyCredit::updateOrCreate(
                    [
                        'faculty_id' => $faculty->id,
                        'academic_period_id' => $currentPeriod->id,
                        'category' => $fData['credit_type'],
                    ],
                    [
                        'credited_units' => $fData['credit_hours'],
                        'reference_memo' => $fData['credit_role'],
                        'status' => 'Approved',
                    ]
                );
            }
        }

        // 8. Active Course Offerings (`RoomSchedule`) for CBA
        // Creating 26 active class offerings across BSBA and BSA sections in CBA rooms
        $cbaOfferings = [
            // BSBA 1A
            ['code' => 'BA 111', 'title' => 'Principles of Management', 'sec' => 'BSBA 1A', 'room' => 'CBA 101', 'day' => 'Monday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-007'],
            ['code' => 'BA 112', 'title' => 'Business Mathematics', 'sec' => 'BSBA 1A', 'room' => 'CBA 101', 'day' => 'Wednesday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-002'],
            ['code' => 'BA 122', 'title' => 'Principles of Marketing', 'sec' => 'BSBA 1A', 'room' => 'CBA 101', 'day' => 'Friday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-004'],

            // BSBA 1B
            ['code' => 'BA 111', 'title' => 'Principles of Management', 'sec' => 'BSBA 1B', 'room' => 'CBA 102', 'day' => 'Tuesday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => null],
            ['code' => 'BA 112', 'title' => 'Business Mathematics', 'sec' => 'BSBA 1B', 'room' => 'CBA 102', 'day' => 'Thursday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => null],
            ['code' => 'BA 122', 'title' => 'Principles of Marketing', 'sec' => 'BSBA 1B', 'room' => 'CBA 102', 'day' => 'Friday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => 'CBA-2026-009'],

            // BSBA 2A
            ['code' => 'BA 121', 'title' => 'Financial Management', 'sec' => 'BSBA 2A', 'room' => 'CBA 201', 'day' => 'Monday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => 'CBA-2026-002'],
            ['code' => 'BA 211', 'title' => 'Human Resource Management', 'sec' => 'BSBA 2A', 'room' => 'CBA 201', 'day' => 'Wednesday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => 'CBA-2026-007'],
            ['code' => 'BA 212', 'title' => 'Business Law & Obligations', 'sec' => 'BSBA 2A', 'room' => 'CBA 201', 'day' => 'Thursday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => 'CBA-2026-010'],

            // BSBA 2B
            ['code' => 'BA 121', 'title' => 'Financial Management', 'sec' => 'BSBA 2B', 'room' => 'CBA 202', 'day' => 'Tuesday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => null],
            ['code' => 'BA 211', 'title' => 'Human Resource Management', 'sec' => 'BSBA 2B', 'room' => 'CBA 202', 'day' => 'Thursday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => null],

            // BSBA 3A
            ['code' => 'BA 221', 'title' => 'Strategic Management', 'sec' => 'BSBA 3A', 'room' => 'CBA 301', 'day' => 'Monday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-001'],
            ['code' => 'BA 222', 'title' => 'Operations & Production Management', 'sec' => 'BSBA 3A', 'room' => 'CBA 301', 'day' => 'Wednesday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-008'],
            ['code' => 'BA 311', 'title' => 'Business Analytics & Big Data', 'sec' => 'BSBA 3A', 'room' => 'CBA Lab 2', 'day' => 'Friday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-005'],

            // BSBA 4A
            ['code' => 'BA 321', 'title' => 'Digital Marketing & E-Commerce', 'sec' => 'BSBA 4A', 'room' => 'CBA Lab 2', 'day' => 'Tuesday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => 'CBA-2026-004'],
            ['code' => 'BA 411', 'title' => 'Business Research & Feasibility', 'sec' => 'BSBA 4A', 'room' => 'CBA Case Room', 'day' => 'Thursday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => null],

            // BSA 1A
            ['code' => 'ACT 111', 'title' => 'Financial Accounting & Reporting I', 'sec' => 'BSA 1A', 'room' => 'CBA 101', 'day' => 'Tuesday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-012'],
            ['code' => 'ACT 112', 'title' => 'Conceptual Framework & Standards', 'sec' => 'BSA 1A', 'room' => 'CBA 101', 'day' => 'Thursday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-016'],

            // BSA 1B
            ['code' => 'ACT 111', 'title' => 'Financial Accounting & Reporting I', 'sec' => 'BSA 1B', 'room' => 'CBA 102', 'day' => 'Monday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => null],
            ['code' => 'ACT 112', 'title' => 'Conceptual Framework & Standards', 'sec' => 'BSA 1B', 'room' => 'CBA 102', 'day' => 'Wednesday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => null],

            // BSA 2A
            ['code' => 'ACT 121', 'title' => 'Intermediate Accounting I', 'sec' => 'BSA 2A', 'room' => 'CBA 201', 'day' => 'Tuesday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => 'CBA-2026-012'],
            ['code' => 'ACT 122', 'title' => 'Cost Accounting & Control', 'sec' => 'BSA 2A', 'room' => 'CBA 201', 'day' => 'Wednesday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-013'],
            ['code' => 'ACT 221', 'title' => 'Accounting Information Systems', 'sec' => 'BSA 2A', 'room' => 'CBA Lab 1', 'day' => 'Friday', 'start' => '13:00:00', 'end' => '16:00:00', 'fac' => 'CBA-2026-006'],

            // BSA 3A
            ['code' => 'ACT 222', 'title' => 'Income Taxation', 'sec' => 'BSA 3A', 'room' => 'CBA 202', 'day' => 'Monday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-015'],
            ['code' => 'ACT 312', 'title' => 'Auditing & Assurance Principles', 'sec' => 'BSA 3A', 'room' => 'CBA 202', 'day' => 'Wednesday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => 'CBA-2026-003'],

            // BSA 4A
            ['code' => 'ACT 311', 'title' => 'Business & Transfer Taxation', 'sec' => 'BSA 4A', 'room' => 'CBA 301', 'day' => 'Tuesday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => null],
            ['code' => 'ACT 411', 'title' => 'Integrated Accounting Review', 'sec' => 'BSA 4A', 'room' => 'CBA 301', 'day' => 'Thursday', 'start' => '08:30:00', 'end' => '11:30:00', 'fac' => null],
        ];

        foreach ($cbaOfferings as $off) {
            $assignedFac = ! empty($off['fac']) && isset($facultyCreated[$off['fac']]) ? $facultyCreated[$off['fac']] : null;

            RoomSchedule::updateOrCreate(
                [
                    'academic_period_id' => $currentPeriod->id,
                    'course_code' => $off['code'],
                    'section' => $off['sec'],
                ],
                [
                    'course_title' => $off['title'],
                    'room_name' => $off['room'],
                    'day_of_week' => $off['day'],
                    'start_time' => $off['start'],
                    'end_time' => $off['end'],
                    'faculty_id' => $assignedFac?->id,
                    'instructor' => $assignedFac ? ($assignedFac->title_name ?? $assignedFac->full_name) : null,
                    'raw_text' => "{$off['code']} - {$off['title']} ({$off['sec']}) in {$off['room']}",
                    'is_locked' => false,
                ]
            );

            // Also ensure CourseOffering record exists
            CourseOffering::updateOrCreate(
                [
                    'academic_period_id' => $currentPeriod->id,
                    'course_code' => $off['code'],
                    'section_name' => $off['sec'],
                ],
                [
                    'course_title' => $off['title'],
                    'units' => 3.0,
                    'lecture_hours' => str_contains(strtolower($off['room']), 'lab') ? 2.0 : 3.0,
                    'lab_hours' => str_contains(strtolower($off['room']), 'lab') ? 3.0 : 0.0,
                    'room_type_required' => str_contains(strtolower($off['room']), 'lab') ? 'Computer Laboratory' : 'Lecture',
                    'faculty_id' => $assignedFac?->id,
                    'status' => 'Active',
                    'loading_status' => $assignedFac ? 'Assigned' : 'Unassigned',
                    'timetable_status' => 'Draft',
                    'is_locked' => false,
                ]
            );
        }

        // 9. Assign CBA Scoped Roles to CBA Admin user
        // Ensure user 'dean.cba@dssc.edu.ph' or 'cba.admin@dssc.edu.ph' exists
        $cbaUser = User::firstOrCreate(
            ['email' => 'cba.admin@dssc.edu.ph'],
            [
                'name' => 'CBA Administrator',
                'password' => Hash::make('password'),
            ]
        );

        $adminRole = Role::firstOrCreate(['name' => 'College Admin'], ['hierarchy_level' => 4, 'portal_type' => 'college_admin']);
        $scopedAssignment = ScopedRoleAssignment::firstOrCreate(
            [
                'user_id' => $cbaUser->id,
                'role_id' => $adminRole->id,
                'college_id' => $cba->id,
            ],
            [
                'institution' => 'DSSC-MAIN',
                'scope_level' => 'College',
                'status' => 'Active',
            ]
        );

        $cbaUser->update(['default_role_assignment_id' => $scopedAssignment->id]);
    }
}
