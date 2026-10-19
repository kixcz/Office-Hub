<?php

namespace Database\Seeders;

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Curriculum;
use App\Models\Faculty;
use App\Models\FacultyCredit;
use App\Models\FacultyPreference;
use App\Models\FacultySpecialization;
use App\Models\FacultyWorkload;
use App\Models\Program;
use App\Models\Room;
use App\Models\RoomSchedule;
use App\Models\ScheduleAdjustmentBatch;
use App\Models\ScheduleAdjustmentWindow;
use App\Models\ScheduleCandidate;
use App\Models\ScheduleReviewFlag;
use App\Models\ScheduleSwapRequest;
use App\Models\ScheduleVersion;
use App\Models\Section;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SemesterSchedulingSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Ensure current and upcoming Academic Periods exist
        $currentPeriod = AcademicPeriod::where('is_current', true)->first();
        if (! $currentPeriod) {
            $currentPeriod = AcademicPeriod::create([
                'academic_year' => '2026 – 2027',
                'semester' => '1st Semester',
                'code' => 'AY2627-1S',
                'start_date' => '2026-08-17',
                'end_date' => '2026-12-18',
                'class_start_date' => '2026-08-17',
                'class_end_date' => '2026-12-18',
                'midterm_start_date' => '2026-10-12',
                'midterm_end_date' => '2026-10-16',
                'final_start_date' => '2026-12-14',
                'final_end_date' => '2026-12-18',
                'status' => 'Active',
                'is_current' => true,
                'planning_rules_version' => 'Default Rules v2',
                'notes' => 'Current operating semester for CIDS OfficeHub.',
            ]);
        }

        // 2. Fetch Programs & Curricula
        $bsit = Program::where('code', 'BSIT')->first() ?? Program::create(['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology']);
        $bsis = Program::where('code', 'BSIS')->first() ?? Program::create(['code' => 'BSIS', 'name' => 'Bachelor of Science in Information Systems']);
        $blis = Program::where('code', 'BLIS')->first() ?? Program::create(['code' => 'BLIS', 'name' => 'Bachelor of Library and Information Science']);
        $bscs = Program::where('code', 'BSCS')->first() ?? Program::create(['code' => 'BSCS', 'name' => 'Bachelor of Science in Computer Science']);

        $curricula = [
            'BSIT' => Curriculum::firstOrCreate(
                ['program_id' => $bsit->id, 'version_name' => '2024 Revised BSIT CMO 25'],
                ['effective_year' => '2024', 'total_units' => 146, 'status' => 'Active']
            ),
            'BSIS' => Curriculum::firstOrCreate(
                ['program_id' => $bsis->id, 'version_name' => '2024 Revised BSIS CMO 25'],
                ['effective_year' => '2024', 'total_units' => 142, 'status' => 'Active']
            ),
            'BLIS' => Curriculum::firstOrCreate(
                ['program_id' => $blis->id, 'version_name' => '2023 BLIS Curriculum'],
                ['effective_year' => '2023', 'total_units' => 138, 'status' => 'Active']
            ),
            'BSCS' => Curriculum::firstOrCreate(
                ['program_id' => $bscs->id, 'version_name' => '2024 Revised BSCS CMO 25'],
                ['effective_year' => '2024', 'total_units' => 148, 'status' => 'Active']
            ),
        ];

        // 3. Populate Courses
        $coursesCatalog = [
            ['program' => 'BSIT', 'code' => 'IT 111', 'title' => 'Introduction to Computing', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 1, 'spec' => 'Fundamentals'],
            ['program' => 'BSIT', 'code' => 'IT 112', 'title' => 'Computer Programming I', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 1, 'spec' => 'Programming'],
            ['program' => 'BSIT', 'code' => 'IT 211', 'title' => 'Data Structures & Algorithms', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 2, 'spec' => 'Algorithms'],
            ['program' => 'BSIT', 'code' => 'IT 212', 'title' => 'Object-Oriented Programming', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 2, 'spec' => 'Programming'],
            ['program' => 'BSIT', 'code' => 'IT 213', 'title' => 'Web Systems & Technologies', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 2, 'spec' => 'Web Systems'],
            ['program' => 'BSIT', 'code' => 'IT 311', 'title' => 'Information Assurance & Security', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 3, 'spec' => 'Cybersecurity'],
            ['program' => 'BSIT', 'code' => 'IT 312', 'title' => 'Mobile Application Development', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 3, 'spec' => 'Mobile Development'],
            ['program' => 'BSIT', 'code' => 'IT 313', 'title' => 'Database Administration', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 3, 'spec' => 'Databases'],
            ['program' => 'BSIT', 'code' => 'IT 411', 'title' => 'Capstone Project I', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'room' => 'Lecture', 'year' => 4, 'spec' => 'Systems Development'],
            ['program' => 'BSIT', 'code' => 'IT 412', 'title' => 'Systems Integration & Architecture', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 4, 'spec' => 'Enterprise Architecture'],

            ['program' => 'BSIS', 'code' => 'IS 111', 'title' => 'Fundamentals of Information Systems', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'room' => 'Lecture', 'year' => 1, 'spec' => 'Information Systems'],
            ['program' => 'BSIS', 'code' => 'IS 211', 'title' => 'Enterprise Architecture', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 2, 'spec' => 'Enterprise Architecture'],
            ['program' => 'BSIS', 'code' => 'IS 311', 'title' => 'Business Process Management', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'room' => 'Lecture', 'year' => 3, 'spec' => 'Process Management'],
            ['program' => 'BSIS', 'code' => 'IS 312', 'title' => 'IT Audit and Controls', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'room' => 'Lecture', 'year' => 3, 'spec' => 'IT Audit'],

            ['program' => 'BSCS', 'code' => 'CS 111', 'title' => 'Discrete Structures', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'room' => 'Lecture', 'year' => 1, 'spec' => 'Mathematics & Logic'],
            ['program' => 'BSCS', 'code' => 'CS 211', 'title' => 'Automata Theory & Formal Languages', 'units' => 3.0, 'lec' => 3.0, 'lab' => 0.0, 'room' => 'Lecture', 'year' => 2, 'spec' => 'Theoretical CS'],
            ['program' => 'BSCS', 'code' => 'CS 311', 'title' => 'Artificial Intelligence & Machine Learning', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Computer Laboratory', 'year' => 3, 'spec' => 'Artificial Intelligence'],
            ['program' => 'BSCS', 'code' => 'CS 312', 'title' => 'Computer Networks & Distributed Systems', 'units' => 3.0, 'lec' => 2.0, 'lab' => 3.0, 'room' => 'Networking Laboratory', 'year' => 3, 'spec' => 'Networking'],
        ];

        $courses = [];
        foreach ($coursesCatalog as $c) {
            $prog = match ($c['program']) {
                'BSIT' => $bsit,
                'BSIS' => $bsis,
                'BSCS' => $bscs,
                default => $blis,
            };
            $curriculum = $curricula[$c['program']];

            $courses[$c['code']] = Course::updateOrCreate(
                ['code' => $c['code']],
                [
                    'curriculum_id' => $curriculum->id,
                    'program_id' => $prog->id,
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
                ]
            );
        }

        // 4. Create Student Sections
        $sectionsData = [
            ['program' => $bsit, 'curriculum' => $curricula['BSIT'], 'code' => 'BSIT 1A', 'year' => 1, 'pop' => 35],
            ['program' => $bsit, 'curriculum' => $curricula['BSIT'], 'code' => 'BSIT 1B', 'year' => 1, 'pop' => 34],
            ['program' => $bsit, 'curriculum' => $curricula['BSIT'], 'code' => 'BSIT 2A', 'year' => 2, 'pop' => 32],
            ['program' => $bsit, 'curriculum' => $curricula['BSIT'], 'code' => 'BSIT 2B', 'year' => 2, 'pop' => 30],
            ['program' => $bsit, 'curriculum' => $curricula['BSIT'], 'code' => 'BSIT 3A', 'year' => 3, 'pop' => 28],
            ['program' => $bsit, 'curriculum' => $curricula['BSIT'], 'code' => 'BSIT 4A', 'year' => 4, 'pop' => 25],

            ['program' => $bsis, 'curriculum' => $curricula['BSIS'], 'code' => 'BSIS 1A', 'year' => 1, 'pop' => 32],
            ['program' => $bsis, 'curriculum' => $curricula['BSIS'], 'code' => 'BSIS 2A', 'year' => 2, 'pop' => 28],
            ['program' => $bsis, 'curriculum' => $curricula['BSIS'], 'code' => 'BSIS 3A', 'year' => 3, 'pop' => 26],

            ['program' => $bscs, 'curriculum' => $curricula['BSCS'], 'code' => 'BSCS 1A', 'year' => 1, 'pop' => 30],
            ['program' => $bscs, 'curriculum' => $curricula['BSCS'], 'code' => 'BSCS 2A', 'year' => 2, 'pop' => 27],
            ['program' => $bscs, 'curriculum' => $curricula['BSCS'], 'code' => 'BSCS 3A', 'year' => 3, 'pop' => 25],
        ];

        $sections = [];
        foreach ($sectionsData as $s) {
            $sections[$s['code']] = Section::updateOrCreate(
                ['code' => $s['code'], 'academic_period_id' => $currentPeriod->id],
                [
                    'program_id' => $s['program']->id,
                    'curriculum_id' => $s['curriculum']->id,
                    'year_level' => $s['year'],
                    'population' => $s['pop'],
                    'status' => 'Active',
                ]
            );
        }

        // 5. Update/Ensure Physical Rooms with Types
        $roomsData = [
            ['room_name' => 'Room 301', 'building' => 'CIDS Building', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 45],
            ['room_name' => 'Room 302', 'building' => 'CIDS Building', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 45],
            ['room_name' => 'Room 303', 'building' => 'CIDS Building', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 40],
            ['room_name' => 'Room 304', 'building' => 'CIDS Building', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 40],
            ['room_name' => 'Room 305', 'building' => 'CIDS Building', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 40],
            ['room_name' => 'COM 1', 'building' => 'CIDS Building', 'floor' => '2nd Floor', 'type' => 'Computer Laboratory', 'capacity' => 35],
            ['room_name' => 'COM 2', 'building' => 'CIDS Building', 'floor' => '2nd Floor', 'type' => 'Computer Laboratory', 'capacity' => 35],
            ['room_name' => 'COM 3', 'building' => 'CIDS Building', 'floor' => '2nd Floor', 'type' => 'Computer Laboratory', 'capacity' => 35],
            ['room_name' => 'COM 4', 'building' => 'CIDS Building', 'floor' => '2nd Floor', 'type' => 'Computer Laboratory', 'capacity' => 35],
            ['room_name' => 'NET LAB', 'building' => 'CIDS Building', 'floor' => '4th Floor', 'type' => 'Networking Laboratory', 'capacity' => 30],
            ['room_name' => 'MAC LAB', 'building' => 'CIDS Building', 'floor' => '4th Floor', 'type' => 'Multimedia Laboratory', 'capacity' => 30],
            ['room_name' => 'AVR 1', 'building' => 'CIDS Building', 'floor' => '5th Floor', 'type' => 'Auditorium', 'capacity' => 120],
        ];

        foreach ($roomsData as $r) {
            Room::updateOrCreate(['room_name' => $r['room_name']], $r);
        }

        // 6. Connect Existing RoomSchedules to Academic Period & create CourseOfferings
        $faculties = Faculty::all();
        $roomSchedules = RoomSchedule::all();

        foreach ($roomSchedules as $rs) {
            // Set academic period
            $rs->academic_period_id = $currentPeriod->id;

            // Normalize course_code if empty
            $courseCode = trim($rs->course_code ?? '');
            if (empty($courseCode)) {
                $courseCode = 'CC '.strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $rs->course_title ?: 'GEN'), 0, 4)).' 101';
                $rs->course_code = $courseCode;
            }

            // Associate with matching course if not present
            $matchedCourse = Course::where('code', $courseCode)->first();
            if (! $matchedCourse) {
                // Auto create course to keep data relational
                $matchedCourse = Course::create([
                    'program_id' => $bsit->id,
                    'curriculum_id' => $curricula['BSIT']->id,
                    'code' => $courseCode,
                    'title' => $rs->course_title ?: $courseCode,
                    'units' => 3.0,
                    'lecture_hours' => 2.0,
                    'lab_hours' => 3.0,
                    'room_type_required' => str_contains(strtolower($rs->room_name ?? ''), 'com') ? 'Computer Laboratory' : 'Lecture',
                ]);
            }

            // Associate with matching section
            $cleanSecName = trim($rs->section ?? '');
            $matchedSection = Section::where('code', $cleanSecName)->first();
            if (! $matchedSection && ! empty($cleanSecName)) {
                $matchedSection = Section::create([
                    'academic_period_id' => $currentPeriod->id,
                    'program_id' => str_contains($cleanSecName, 'IS') ? $bsis->id : $bsit->id,
                    'curriculum_id' => str_contains($cleanSecName, 'IS') ? $curricula['BSIS']->id : $curricula['BSIT']->id,
                    'code' => $cleanSecName,
                    'year_level' => 2,
                    'population' => 35,
                    'status' => 'Active',
                ]);
            }

            // Create CourseOffering record
            $offering = CourseOffering::firstOrCreate(
                [
                    'academic_period_id' => $currentPeriod->id,
                    'course_code' => $rs->course_code,
                    'section_name' => $rs->section ?: 'TBA',
                ],
                [
                    'course_id' => $matchedCourse->id,
                    'section_id' => $matchedSection?->id,
                    'faculty_id' => $rs->faculty_id,
                    'offering_code' => 'OFFER-'.Str::slug($rs->course_code).'-'.Str::slug($rs->section ?: 'TBA'),
                    'course_title' => $rs->course_title ?: $matchedCourse->title,
                    'units' => 3.0,
                    'lecture_hours' => 2.0,
                    'lab_hours' => 3.0,
                    'room_type_required' => str_contains(strtolower($rs->room_name), 'com') ? 'Computer Laboratory' : 'Lecture',
                    'status' => $rs->faculty_id ? 'Loaded' : 'Unassigned',
                ]
            );

            $rs->course_offering_id = $offering->id;
            $rs->save();
        }

        // 7. Seed Faculty Specializations, Preferences, and Non-Teaching Credits
        $specializationMatrix = [
            'Maria Santos' => ['Web Systems', 'Software Engineering', 'Programming'],
            'Arnel Reyes' => ['Database Systems', 'Data Engineering', 'Algorithms'],
            'Cristina Lopez' => ['Algorithms', 'Machine Learning', 'Artificial Intelligence'],
            'Juan Dela Cruz' => ['Enterprise Architecture', 'Cloud Computing', 'Systems Integration'],
            'Peter Parker' => ['Mobile Applications', 'UI/UX Design', 'Multimedia Systems'],
            'Tony Stark' => ['Cybersecurity', 'Embedded Systems', 'Computer Networks'],
            'Bruce Wayne' => ['Digital Forensics', 'IT Security Audit', 'Information Assurance'],
            'Clark Kent' => ['Information Systems', 'IT Ethics', 'Process Management'],
            'Diana Prince' => ['Distributed Systems', 'Web Tech', 'Object-Oriented Programming'],
            'Barry Allen' => ['Computer Networks', 'High-Performance Computing', 'Operating Systems'],
            'Jerick Erie Vicente' => ['Web Systems', 'Data Structures', 'Application Architecture'],
        ];

        foreach ($faculties as $faculty) {
            $fullName = "{$faculty->first_name} {$faculty->last_name}";

            // Specializations
            $specs = $specializationMatrix[$fullName] ?? ['Computer Science', 'Information Technology'];
            foreach ($specs as $index => $area) {
                FacultySpecialization::updateOrCreate(
                    ['faculty_id' => $faculty->id, 'expertise_area' => $area],
                    [
                        'qualification_level' => $index === 0 ? 'Primary Expertise' : 'Approved',
                        'course_category_match' => 'Major',
                        'is_verified' => true,
                    ]
                );
            }

            // Preferences
            FacultyPreference::updateOrCreate(
                ['faculty_id' => $faculty->id, 'academic_period_id' => $currentPeriod->id],
                [
                    'preferred_days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'preferred_time_windows' => ['08:00 - 12:00', '13:00 - 17:00'],
                    'max_days_per_week' => 4,
                    'notes' => 'Prefers morning blocks for major laboratory classes.',
                ]
            );

            // Credits (Non-teaching workload)
            $isHead = str_contains(strtolower($faculty->academic_rank ?? ''), 'head') ||
                      str_contains(strtolower($faculty->specialization ?? ''), 'head') ||
                      str_contains(strtolower($faculty->last_name ?? ''), 'origines') ||
                      str_contains(strtolower($faculty->last_name ?? ''), 'roxas') ||
                      $faculty->id <= 4; // Designate first 4 faculty as Program Heads/Coordinators

            if ($isHead) {
                FacultyCredit::updateOrCreate(
                    [
                        'faculty_id' => $faculty->id,
                        'academic_period_id' => $currentPeriod->id,
                        'category' => 'Program Head Designation',
                    ],
                    [
                        'credited_units' => 6.0,
                        'reference_memo' => 'CIDS-MEMO-2026-081',
                        'status' => 'Approved',
                    ]
                );
            }

            // Calculate & Seed Workload Summary in faculty_workloads table
            $assignedClasses = RoomSchedule::where('faculty_id', $faculty->id)->get();
            $teachingUnits = $assignedClasses->count() * 3.0;
            $teachingHours = $assignedClasses->count() * 3.0;
            $adminCredits = $isHead ? 6.0 : 0.0;
            $researchCredits = 3.0; // standard institutional research commitment
            $extensionCredits = 0.0;
            $totalWorkload = $teachingUnits + $adminCredits + $researchCredits + $extensionCredits;

            $status = 'normal';
            if ($totalWorkload < 12.0) {
                $status = 'underloaded';
            } elseif ($totalWorkload > 21.0) {
                $status = 'overloaded';
            }

            FacultyWorkload::updateOrCreate(
                [
                    'academic_period_id' => $currentPeriod->id,
                    'faculty_id' => $faculty->id,
                ],
                [
                    'teaching_units' => $teachingUnits,
                    'teaching_hours' => $teachingHours,
                    'designation_credits' => $adminCredits,
                    'research_credits' => $researchCredits,
                    'extension_credits' => $extensionCredits,
                    'administrative_credits' => 0.0,
                    'total_workload' => $totalWorkload,
                    'workload_status' => $status,
                    'is_locked' => false,
                    'document_version' => 1,
                    'workload_snapshot_data' => [
                        'classes_count' => $assignedClasses->count(),
                        'sections' => $assignedClasses->pluck('section')->unique()->values()->all(),
                        'rooms' => $assignedClasses->pluck('room_name')->unique()->values()->all(),
                    ],
                ]
            );
        }

        // 8. Seed OR-Tools Solver Schedule Candidates (A, B, C)
        $candidateA = ScheduleCandidate::updateOrCreate(
            ['academic_period_id' => $currentPeriod->id, 'candidate_code' => 'Candidate A'],
            [
                'hard_conflicts_count' => 0,
                'objective_score' => 96.4,
                'faculty_preference_satisfaction' => 94.2,
                'avg_faculty_gap_hours' => 0.8,
                'avg_section_gap_hours' => 0.5,
                'late_classes_count' => 2,
                'room_utilization_percent' => 88.5,
                'status' => 'Selected',
                'solver_metadata' => [
                    'solver' => 'Google OR-Tools CP-SAT v9.8',
                    'solve_time_sec' => 3.82,
                    'iterations' => 14820,
                    'profile' => 'Balanced Optimization (Faculty Preferences & Minimum Student Gaps)',
                ],
            ]
        );

        $candidateB = ScheduleCandidate::updateOrCreate(
            ['academic_period_id' => $currentPeriod->id, 'candidate_code' => 'Candidate B'],
            [
                'hard_conflicts_count' => 0,
                'objective_score' => 92.1,
                'faculty_preference_satisfaction' => 98.0,
                'avg_faculty_gap_hours' => 1.4,
                'avg_section_gap_hours' => 0.9,
                'late_classes_count' => 0,
                'room_utilization_percent' => 82.0,
                'status' => 'Generated',
                'solver_metadata' => [
                    'solver' => 'Google OR-Tools CP-SAT v9.8',
                    'solve_time_sec' => 4.15,
                    'profile' => 'Maximum Faculty Satisfaction Priority',
                ],
            ]
        );

        $candidateC = ScheduleCandidate::updateOrCreate(
            ['academic_period_id' => $currentPeriod->id, 'candidate_code' => 'Candidate C'],
            [
                'hard_conflicts_count' => 0,
                'objective_score' => 90.5,
                'faculty_preference_satisfaction' => 86.5,
                'avg_faculty_gap_hours' => 0.4,
                'avg_section_gap_hours' => 0.2,
                'late_classes_count' => 5,
                'room_utilization_percent' => 94.2,
                'status' => 'Generated',
                'solver_metadata' => [
                    'solver' => 'Google OR-Tools CP-SAT v9.8',
                    'solve_time_sec' => 3.65,
                    'profile' => 'High-Density Room Utilization & Compact Student Timetables',
                ],
            ]
        );

        // 9. Seed Schedule Versions (Working Draft v1 & Official Published Master)
        $adminUser = User::first();
        $deanUser = User::where('email', 'dean@cids.edu')->first() ?? $adminUser;
        $phUser = User::where('email', 'programhead@cids.edu')->first() ?? $adminUser;

        $officialVersion = ScheduleVersion::updateOrCreate(
            [
                'academic_period_id' => $currentPeriod->id,
                'version_tag' => 'Published v1.0',
            ],
            [
                'candidate_id' => $candidateA->id,
                'stage' => 'Published',
                'is_official_master' => true,
                'approved_by_user_id' => $deanUser->id,
                'approved_at' => $now->copy()->subDays(5),
                'published_at' => $now->copy()->subDays(5),
                'change_summary' => 'Official Semester Master Timetable approved by Academic Dean and published for faculty and students.',
                'metrics_snapshot' => [
                    'total_offerings' => $roomSchedules->count(),
                    'faculty_assigned_pct' => 100,
                    'room_conflicts' => 0,
                    'faculty_conflicts' => 0,
                ],
            ]
        );

        // Link room schedules to official version
        RoomSchedule::whereNull('schedule_version_id')->update([
            'schedule_version_id' => $officialVersion->id,
            'academic_period_id' => $currentPeriod->id,
        ]);

        // 10. Seed Departmental Review Flags & Advisory Feedback
        ScheduleReviewFlag::updateOrCreate(
            [
                'schedule_version_id' => $officialVersion->id,
                'category' => 'Laboratory Requirement',
                'reviewer_role' => 'program_head',
            ],
            [
                'user_id' => $phUser->id,
                'program_id' => $bsit->id,
                'target_entity_type' => 'room',
                'severity' => 'Needs Attention',
                'comment' => 'BSIT 3A Mobile Development requires Mac/iOS simulation tools. Please ensure Friday afternoon block is assigned to MAC LAB rather than COM 1.',
                'suggested_correction' => 'Relocate offering IT 312 from COM 1 to MAC LAB.',
                'status' => 'Resolved',
                'is_confirmed_by_admin' => true,
            ]
        );

        ScheduleReviewFlag::updateOrCreate(
            [
                'schedule_version_id' => $officialVersion->id,
                'category' => 'Consecutive Hours',
                'reviewer_role' => 'dean',
            ],
            [
                'user_id' => $deanUser->id,
                'program_id' => $bsis->id,
                'target_entity_type' => 'faculty',
                'severity' => 'Advisory',
                'comment' => 'Ensure faculty members teaching evening graduate-level classes do not have consecutive 7:30 AM morning classes the following day.',
                'suggested_correction' => 'Adjust start time to 09:00 AM on Tuesdays.',
                'status' => 'Acknowledged',
                'is_confirmed_by_admin' => true,
            ]
        );

        // 11. Seed Post-Publication Adjustment Window & Faculty Swap Requests
        $adjustmentWindow = ScheduleAdjustmentWindow::updateOrCreate(
            [
                'academic_period_id' => $currentPeriod->id,
                'title' => 'AY 2026-2027 1st Semester Post-Publication Schedule Adjustment Window',
            ],
            [
                'base_published_version_id' => $officialVersion->id,
                'opens_at' => $now->copy()->subDays(3),
                'closes_at' => $now->copy()->addDays(10),
                'allow_subject_swaps' => true,
                'allow_section_swaps' => true,
                'allow_time_swaps' => true,
                'status' => 'Open',
            ]
        );

        $facultyWithClasses = Faculty::whereHas('roomSchedules')->get();
        $requesterFaculty = $facultyWithClasses->first() ?? $faculties->first();
        $counterpartFaculty = $facultyWithClasses->skip(1)->first() ?? $faculties->skip(1)->first();

        $reqOffering = RoomSchedule::where('faculty_id', $requesterFaculty->id)->first();
        $counterOffering = RoomSchedule::where('faculty_id', $counterpartFaculty->id)->first();

        if ($reqOffering && $counterOffering) {
            ScheduleSwapRequest::updateOrCreate(
                [
                    'adjustment_window_id' => $adjustmentWindow->id,
                    'requester_faculty_id' => $requesterFaculty->id,
                    'counterpart_faculty_id' => $counterpartFaculty->id,
                ],
                [
                    'requester_offering_id' => $reqOffering->course_offering_id,
                    'counterpart_offering_id' => $counterOffering->course_offering_id,
                    'swap_type' => 'time_slot_swap',
                    'proposed_day' => 'Wednesday',
                    'proposed_start_time' => '13:00:00',
                    'proposed_end_time' => '16:00:00',
                    'proposed_room' => 'COM 2',
                    'reason' => 'Avoid conflict with faculty research extension seminar at the regional technology center.',
                    'counterpart_consent' => 'Accepted',
                    'counterpart_responded_at' => $now->copy()->subDay(),
                    'pre_validation_passed' => true,
                    'pre_validation_notes' => 'Zero room conflicts detected. Both faculty members meet curriculum specialization criteria.',
                    'deep_validation_passed' => true,
                    'status' => 'Included in Batch',
                ]
            );
        }

        // 12. Seed Consolidated Adjustment Batch
        ScheduleAdjustmentBatch::updateOrCreate(
            ['adjustment_window_id' => $adjustmentWindow->id, 'batch_number' => 'ADJ-BATCH-2026-001'],
            [
                'total_requests_count' => 3,
                'accepted_requests_count' => 3,
                'affected_faculty_ids' => [$requesterFaculty->id, $counterpartFaculty->id],
                'affected_sections' => ['BSIT 2A', 'BSIS 2A'],
                'affected_rooms' => ['COM 1', 'COM 2', 'Room 302'],
                'gemini_consolidation_summary' => 'Batch #1 consolidates 3 faculty mutual swap requests. Zero student section overlaps and zero room conflicts. Feasible solution found by solver.',
                'gemini_competition_warnings' => null,
                'solver_status' => 'Solved Feasible',
                'status' => 'Program Review',
            ]
        );
    }
}
