<?php

namespace Database\Seeders;

use App\Jobs\SyncFacilityMonitoring;
use App\Models\Activity;
use App\Models\Announcement;
use App\Models\FacilityMonitoring;
use App\Models\Faculty;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\RoomSchedule;
use App\Models\Submission;
use App\Models\TvSetting;
use App\Models\TvSlide;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Programs
        $programsData = [
            ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology'],
            ['code' => 'BSIS', 'name' => 'Bachelor of Science in Information Systems'],
            ['code' => 'BLIS', 'name' => 'Bachelor of Library and Information Science'],
            ['code' => 'BSCS', 'name' => 'Bachelor of Science in Computer Science'],
        ];

        $programs = [];
        foreach ($programsData as $p) {
            $programs[] = Program::updateOrCreate(['code' => $p['code']], $p);
        }

        // 2. Faculty
        $facultyData = [
            ['first' => 'Maria', 'last' => 'Santos', 'id' => 'CIDS-2026-001', 'rank' => 'Assistant Professor I', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Master of Information Technology', 'spec' => 'Software Engineering', 'email' => 'msantos@cids.edu', 'phone' => '+63 917 555 0192', 'room' => 'Room 304, CIDS Building', 'date' => '2022-08-15'],
            ['first' => 'Arnel', 'last' => 'Reyes', 'id' => 'CIDS-2026-002', 'rank' => 'Associate Professor II', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Ph.D. in Computer Science', 'spec' => 'Database Systems & Data Engineering', 'email' => 'areyes@cids.edu', 'phone' => '+63 918 555 0110', 'room' => 'Room 305, CIDS Building', 'date' => '2019-06-01'],
            ['first' => 'Cristina', 'last' => 'Lopez', 'id' => 'CIDS-2026-003', 'rank' => 'Assistant Professor III', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Master of Science in Computer Science', 'spec' => 'Algorithms & Machine Learning', 'email' => 'clopez@cids.edu', 'phone' => '+63 920 555 0145', 'room' => 'Room 302, CIDS Building', 'date' => '2021-01-10'],
            ['first' => 'Juan', 'last' => 'Dela Cruz', 'id' => 'CIDS-2026-004', 'rank' => 'Instructor II', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Master in Information Systems', 'spec' => 'Enterprise Architecture & Cloud', 'email' => 'jdelacruz@cids.edu', 'phone' => '+63 919 555 0167', 'room' => 'Room 301, CIDS Building', 'date' => '2023-08-01'],
            ['first' => 'Peter', 'last' => 'Parker', 'id' => 'CIDS-2026-005', 'rank' => 'Assistant Professor I', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Master of Science in Information Technology', 'spec' => 'Mobile Applications & UI/UX', 'email' => 'pparker@cids.edu', 'phone' => '+63 921 555 0134', 'room' => 'Mac Lab, 4th Floor', 'date' => '2023-01-15'],
            ['first' => 'Tony', 'last' => 'Stark', 'id' => 'CIDS-2026-006', 'rank' => 'Professor I', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Ph.D. in Computer Engineering', 'spec' => 'Cybersecurity & Embedded Systems', 'email' => 'tstark@cids.edu', 'phone' => '+63 917 555 0999', 'room' => 'Network Lab 5, CIDS', 'date' => '2018-09-01'],
            ['first' => 'Bruce', 'last' => 'Wayne', 'id' => 'CIDS-2026-007', 'rank' => 'Associate Professor I', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Ph.D. in Information Assurance', 'spec' => 'Digital Forensics & Security Audit', 'email' => 'bwayne@cids.edu', 'phone' => '+63 917 555 0777', 'room' => 'Security Operations Center', 'date' => '2020-02-15'],
            ['first' => 'Clark', 'last' => 'Kent', 'id' => 'CIDS-2026-008', 'rank' => 'Instructor III', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Master in Information Systems', 'spec' => 'Information Management & Ethics', 'email' => 'ckent@cids.edu', 'phone' => '+63 918 555 0333', 'room' => 'Room 208, CIDS Building', 'date' => '2022-01-20'],
            ['first' => 'Diana', 'last' => 'Prince', 'id' => 'CIDS-2026-009', 'rank' => 'Associate Professor II', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Ph.D. in Computer Science', 'spec' => 'Distributed Systems & Web Tech', 'email' => 'dprince@cids.edu', 'phone' => '+63 919 555 0444', 'room' => 'Room 310, CIDS Building', 'date' => '2019-11-10'],
            ['first' => 'Barry', 'last' => 'Allen', 'id' => 'CIDS-2026-010', 'rank' => 'Assistant Professor II', 'type' => 'Full-time', 'status' => 'Active', 'qual' => 'Master of Science in Information Technology', 'spec' => 'High-Performance Computing & Networks', 'email' => 'ballen@cids.edu', 'phone' => '+63 920 555 0888', 'room' => 'Room 205, CIDS Building', 'date' => '2021-07-01'],
        ];

        $faculties = [];
        foreach ($facultyData as $i => $item) {
            $program = $programs[$i % count($programs)];
            $faculties[] = Faculty::updateOrCreate(
                [
                    'first_name' => $item['first'],
                    'last_name' => $item['last'],
                ],
                [
                    'program_id' => $program->id,
                    'faculty_id' => $item['id'],
                    'academic_rank' => $item['rank'],
                    'employment_type' => $item['type'],
                    'status' => $item['status'],
                    'highest_qualification' => $item['qual'],
                    'specialization' => $item['spec'],
                    'email' => $item['email'],
                    'phone' => $item['phone'],
                    'office_room' => $item['room'],
                    'employment_date' => $item['date'],
                ]
            );
        }

        // 3. Announcements
        $admin = User::first();
        Announcement::updateOrCreate(['title' => 'Midterm Examination Schedule'], [
            'message' => 'Please be guided that the Midterm Examination will be from Oct 20 to Oct 25.',
            'status' => 'active',
            'category' => 'General',
            'priority' => 'High',
            'destination' => 'All',
            'author_id' => $admin->id ?? 1,
        ]);
        Announcement::updateOrCreate(['title' => 'Submission of TOS and TQ'], [
            'message' => 'Urgent reminder to all faculty to submit your TOS and Test Questions for the upcoming exams.',
            'status' => 'active',
            'category' => 'Requirement',
            'priority' => 'High',
            'destination' => 'All',
            'author_id' => $admin->id ?? 1,
        ]);
        Announcement::updateOrCreate(['title' => 'General Faculty Assembly'], [
            'message' => 'There will be a general assembly for all college faculty this coming Friday at the AVR.',
            'status' => 'active',
            'category' => 'General',
            'priority' => 'Normal',
            'destination' => 'All',
            'author_id' => $admin->id ?? 1,
        ]);

        // 4. Meetings
        Meeting::updateOrCreate(['title' => 'Curriculum Review'], [
            'date' => $now->format('Y-m-d'),
            'start_time' => '13:00',
            'end_time' => '15:00',
            'venue' => 'Conference Room A',
            'organizer_id' => $admin->id ?? 1,
        ]);
        Meeting::updateOrCreate(['title' => 'Department Heads Sync'], [
            'date' => $now->format('Y-m-d'),
            'start_time' => '09:00',
            'end_time' => '10:30',
            'venue' => 'Dean\'s Office',
            'organizer_id' => $admin->id ?? 1,
        ]);
        Meeting::updateOrCreate(['title' => 'BSIT Faculty Meeting'], [
            'date' => $now->copy()->addDays(2)->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'venue' => 'Room 402',
            'organizer_id' => $admin->id ?? 1,
        ]);

        // 5. Activities
        Activity::updateOrCreate(['title' => 'Foundation Week Celebration'], [
            'date' => $now->copy()->subDays(1)->format('Y-m-d'),
            'start_time' => '08:00',
            'end_time' => '17:00',
            'venue' => 'University Campus',
            'category' => 'Event',
            'status' => 'Scheduled',
            'visibility' => 'Public',
        ]);
        Activity::updateOrCreate(['title' => 'IT Olympiad'], [
            'date' => $now->copy()->addDays(5)->format('Y-m-d'),
            'start_time' => '09:00',
            'end_time' => '16:00',
            'venue' => 'Main Gym',
            'category' => 'Event',
            'status' => 'Scheduled',
            'visibility' => 'Internal',
        ]);

        // 6. Requirements
        $req1 = Requirement::updateOrCreate(['title' => 'Midterm TOS and TQ'], [
            'description' => 'Table of Specifications and Test Questions for Midterms.',
            'document_type' => 'TOS',
            'due_date' => $now->copy()->addDays(3)->format('Y-m-d'),
            'academic_year' => '2026-2027',
            'semester' => '1st Semester',
            'reviewer_id' => $admin->id ?? 1,
        ]);
        $req2 = Requirement::updateOrCreate(['title' => 'Course Syllabus'], [
            'description' => 'Updated syllabus for all handled subjects.',
            'document_type' => 'Syllabus',
            'due_date' => $now->copy()->subDays(10)->format('Y-m-d'), // Past due
            'academic_year' => '2026-2027',
            'semester' => '1st Semester',
            'reviewer_id' => $admin->id ?? 1,
        ]);
        $req3 = Requirement::updateOrCreate(['title' => 'Faculty Workload Confirmation'], [
            'description' => 'Signed workload confirmation forms.',
            'document_type' => 'Workload',
            'due_date' => $now->copy()->addDays(15)->format('Y-m-d'),
            'academic_year' => '2026-2027',
            'semester' => '1st Semester',
            'reviewer_id' => $admin->id ?? 1,
        ]);

        // 7. Submissions
        $requirements = [$req1, $req2, $req3];
        foreach ($faculties as $index => $faculty) {
            foreach ($requirements as $req) {
                // Some are submitted, some are pending, some are late
                $submittedAt = null;
                $status = 'pending';

                // Randomly decide submission state based on index to create variety
                if (($index + $req->id) % 3 !== 0) {
                    // Submitted
                    $status = 'submitted';
                    if (($index + $req->id) % 5 === 0) {
                        // Late submission
                        $submittedAt = Carbon::parse($req->due_date)->addDays(1);
                    } else {
                        // On-time submission
                        $submittedAt = Carbon::parse($req->due_date)->subDays(2);
                    }
                }

                Submission::updateOrCreate(
                    [
                        'requirement_id' => $req->id,
                        'faculty_id' => $faculty->id,
                    ],
                    [
                        'status' => $status,
                        'submitted_at' => $submittedAt,
                        'file_path' => $submittedAt ? 'uploads/dummy-file.pdf' : null,
                    ]
                );
            }
        }

        // 8. TV Display Configuration
        $slidesData = [
            [
                'title' => 'Slide 1 - Daily Overview',
                'type' => 'Slide 1 - Daily Overview',
                'order' => 1,
                'is_active' => true,
                'duration_seconds' => 15,
                'config' => [],
            ],
            [
                'title' => 'Slide 2 - Schedule & Meetings',
                'type' => 'Slide 2 - Schedule & Meetings',
                'order' => 2,
                'is_active' => true,
                'duration_seconds' => 15,
                'config' => [],
            ],
            [
                'title' => 'Slide 3 - Compliance Monitoring',
                'type' => 'Slide 3 - Compliance Monitoring',
                'order' => 3,
                'is_active' => true,
                'duration_seconds' => 20,
                'config' => [],
            ],
            [
                'title' => 'Slide 4 - Performance & Recognition',
                'type' => 'Slide 4 - Performance & Recognition',
                'order' => 4,
                'is_active' => true,
                'duration_seconds' => 15,
                'config' => [],
            ],
            [
                'title' => 'Slide 5 - Classroom Monitoring',
                'type' => 'Slide 5 - Classroom Monitoring',
                'order' => 5,
                'is_active' => true,
                'duration_seconds' => 15,
                'config' => [],
            ],
            [
                'title' => 'Slide 6 - Class Monitoring',
                'type' => 'Slide 6 - Class Monitoring',
                'order' => 6,
                'is_active' => true,
                'duration_seconds' => 20,
                'config' => [],
            ],
            [
                'title' => 'Slide 7 - Faculty Schedule',
                'type' => 'Slide 7 - Faculty Schedule',
                'order' => 7,
                'is_active' => true,
                'duration_seconds' => 25,
                'config' => [],
            ],
        ];

        foreach ($slidesData as $slide) {
            TvSlide::updateOrCreate(['type' => $slide['type']], $slide);
        }

        $settingsData = [
            ['key' => 'display_name', 'value' => 'CIDS Office TV'],
            ['key' => 'auto_rotation', 'value' => 'Enabled'],
            ['key' => 'refresh_interval', 'value' => '60'],
            ['key' => 'academic_term', 'value' => 'AY 2026-2027, 1st Semester'],
        ];

        foreach ($settingsData as $setting) {
            TvSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // 9. Facility Monitoring Fake Data
        $facilities = [
            [
                'room_name' => 'CLR 1',
                'room_type' => 'Computer Lab',
                'current_class' => 'IT 311 - Advanced Database Systems',
                'program' => 'BSIT',
                'instructor' => 'Arnel Reyes',
                'start_time' => '08:00',
                'end_time' => '11:00',
                'status' => 'In Use',
                'remarks' => 'Lab session in progress',
                'next_schedule' => 'IT 212 - Object Oriented Programming (11:00 AM)',
            ],
            [
                'room_name' => 'CLR 2',
                'room_type' => 'Computer Lab',
                'current_class' => 'CS 221 - Data Structures & Algorithms',
                'program' => 'BSCS',
                'instructor' => 'Cristina Lopez',
                'start_time' => '09:00',
                'end_time' => '12:00',
                'status' => 'In Use',
                'remarks' => 'Practical programming exam',
                'next_schedule' => 'IS 101 - Intro to Computing (01:00 PM)',
            ],
            [
                'room_name' => 'CLR 3',
                'room_type' => 'Computer Lab',
                'current_class' => null,
                'program' => null,
                'instructor' => null,
                'start_time' => null,
                'end_time' => null,
                'status' => 'Available',
                'remarks' => 'Open for faculty consultation or prep',
                'next_schedule' => 'IT 415 - Systems Integration (01:30 PM)',
            ],
            [
                'room_name' => 'CLR 4 (Mac Lab)',
                'room_type' => 'Macintosh Lab',
                'current_class' => 'IT 324 - Mobile Application Development',
                'program' => 'BSIT',
                'instructor' => 'Peter Parker',
                'start_time' => '10:00',
                'end_time' => '13:00',
                'status' => 'In Use',
                'remarks' => 'iOS Swift workshop',
                'next_schedule' => 'CS 320 - Web Systems and Technologies (02:00 PM)',
            ],
            [
                'room_name' => 'CLR 5 (Network Lab)',
                'room_type' => 'Specialized Lab',
                'current_class' => 'IT 223 - Networking 2 (Cisco CCNA)',
                'program' => 'BSIT',
                'instructor' => 'Tony Stark',
                'start_time' => '08:30',
                'end_time' => '11:30',
                'status' => 'In Use',
                'remarks' => 'Router and Switch configuration rack testing',
                'next_schedule' => 'Maintenance check scheduled at 01:00 PM',
            ],
            [
                'room_name' => 'Multimedia Studio',
                'room_type' => 'Studio',
                'current_class' => null,
                'program' => null,
                'instructor' => null,
                'start_time' => null,
                'end_time' => null,
                'status' => 'Maintenance',
                'remarks' => 'Projector bulb replacement & audio recalibration',
                'next_schedule' => 'Available tomorrow 08:00 AM',
            ],
        ];

        foreach ($facilities as $fac) {
            FacilityMonitoring::updateOrCreate(
                ['room_name' => $fac['room_name']],
                $fac
            );
        }

        // 10. Room Schedules Fake Data (across all weekdays)
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $scheduleTemplates = [
            [
                'room_name' => 'CLR 1',
                'start_time' => '08:00:00',
                'end_time' => '11:00:00',
                'course_code' => 'IT 311',
                'course_title' => 'Advanced Database Systems',
                'instructor' => 'Arnel Reyes',
                'section' => 'BSIT 3-A',
            ],
            [
                'room_name' => 'CLR 1',
                'start_time' => '11:00:00',
                'end_time' => '14:00:00',
                'course_code' => 'IT 212',
                'course_title' => 'Object Oriented Programming',
                'instructor' => 'Maria Santos',
                'section' => 'BSIT 2-B',
            ],
            [
                'room_name' => 'CLR 1',
                'start_time' => '14:00:00',
                'end_time' => '17:00:00',
                'course_code' => 'IT 415',
                'course_title' => 'Systems Integration & Architecture',
                'instructor' => 'Juan Dela Cruz',
                'section' => 'BSIT 4-A',
            ],
            [
                'room_name' => 'CLR 2',
                'start_time' => '09:00:00',
                'end_time' => '12:00:00',
                'course_code' => 'CS 221',
                'course_title' => 'Data Structures and Algorithms',
                'instructor' => 'Cristina Lopez',
                'section' => 'BSCS 2-A',
            ],
            [
                'room_name' => 'CLR 2',
                'start_time' => '13:00:00',
                'end_time' => '16:00:00',
                'course_code' => 'IS 101',
                'course_title' => 'Introduction to Computing',
                'instructor' => 'Clark Kent',
                'section' => 'BSIS 1-A',
            ],
            [
                'room_name' => 'CLR 4 (Mac Lab)',
                'start_time' => '10:00:00',
                'end_time' => '13:00:00',
                'course_code' => 'IT 324',
                'course_title' => 'Mobile Application Development',
                'instructor' => 'Peter Parker',
                'section' => 'BSIT 3-B',
            ],
            [
                'room_name' => 'CLR 4 (Mac Lab)',
                'start_time' => '14:00:00',
                'end_time' => '17:00:00',
                'course_code' => 'CS 320',
                'course_title' => 'Web Systems and Technologies',
                'instructor' => 'Diana Prince',
                'section' => 'BSCS 3-A',
            ],
            [
                'room_name' => 'CLR 5 (Network Lab)',
                'start_time' => '08:30:00',
                'end_time' => '11:30:00',
                'course_code' => 'IT 223',
                'course_title' => 'Computer Networks & Security',
                'instructor' => 'Tony Stark',
                'section' => 'BSIT 2-A',
            ],
            [
                'room_name' => 'CLR 5 (Network Lab)',
                'start_time' => '13:00:00',
                'end_time' => '16:00:00',
                'course_code' => 'IT 412',
                'course_title' => 'Cybersecurity & Ethical Hacking',
                'instructor' => 'Bruce Wayne',
                'section' => 'BSIT 4-B',
            ],
        ];

        $faculties = Faculty::all();

        foreach ($days as $day) {
            foreach ($scheduleTemplates as $sched) {
                $faculty = SyncFacilityMonitoring::resolveFaculty($sched['instructor'], $faculties);

                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => $sched['room_name'],
                        'day_of_week' => $day,
                        'start_time' => $sched['start_time'],
                    ],
                    array_merge($sched, [
                        'day_of_week' => $day,
                        'faculty_id' => $faculty?->id,
                        'raw_text' => "{$sched['course_code']} - {$sched['course_title']} ({$sched['section']}) / {$sched['instructor']}",
                    ])
                );
            }
        }

    }
}
