<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Announcement;
use App\Models\Faculty;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\Requirement;
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
        $facultyNames = [
            ['first' => 'Arnel', 'last' => 'Reyes'],
            ['first' => 'Cristina', 'last' => 'Lopez'],
            ['first' => 'Juan', 'last' => 'Dela Cruz'],
            ['first' => 'Maria', 'last' => 'Santos'],
            ['first' => 'Peter', 'last' => 'Parker'],
            ['first' => 'Tony', 'last' => 'Stark'],
            ['first' => 'Bruce', 'last' => 'Wayne'],
            ['first' => 'Clark', 'last' => 'Kent'],
            ['first' => 'Diana', 'last' => 'Prince'],
            ['first' => 'Barry', 'last' => 'Allen'],
        ];

        $faculties = [];
        foreach ($facultyNames as $i => $name) {
            $program = $programs[$i % count($programs)];
            $faculties[] = Faculty::updateOrCreate(
                ['employee_id' => 'EMP-'.str_pad($i + 1, 4, '0', STR_PAD_LEFT)],
                [
                    'first_name' => $name['first'],
                    'last_name' => $name['last'],
                    'email' => strtolower($name['first'].'.'.$name['last']).'@cids.edu.ph',
                    'program_id' => $program->id,
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
        ];

        foreach ($slidesData as $slide) {
            TvSlide::updateOrCreate(['type' => $slide['type']], $slide);
        }

        $settingsData = [
            ['key' => 'display_name', 'value' => 'CIDS Office TV'],
            ['key' => 'auto_rotation', 'value' => 'Enabled'],
            ['key' => 'refresh_interval', 'value' => '60'],
        ];

        foreach ($settingsData as $setting) {
            TvSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

    }
}
