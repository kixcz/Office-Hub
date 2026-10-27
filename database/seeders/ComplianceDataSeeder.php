<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\Role;
use App\Models\Submission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ComplianceDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        $adminId = $admin ? $admin->id : 1;

        // Ensure Programs: BSIT, BSIS, BLIS, BSCS
        $programs = [
            'BSIT' => Program::firstOrCreate(['code' => 'BSIT'], ['name' => 'Bachelor of Science in Information Technology']),
            'BSIS' => Program::firstOrCreate(['code' => 'BSIS'], ['name' => 'Bachelor of Science in Information Systems']),
            'BLIS' => Program::firstOrCreate(['code' => 'BLIS'], ['name' => 'Bachelor of Library and Information Science']),
            'BSCS' => Program::firstOrCreate(['code' => 'BSCS'], ['name' => 'Bachelor of Science in Computer Science']),
        ];

        // Specific Faculty members matching the screenshot matrix:
        // Jerry Oriente (BSIT), Kaye A. Panaligan (BSIS), Rhea Mae Perlito (BSIS), Christal Sumandig (BSIS), Mark Julius Noval (BSIS), etc.
        $facultyDefinitions = [
            ['first' => 'Jerry', 'last' => 'Oriente', 'prog' => 'BSIT', 'email' => 'joriente@cids.edu', 'spec' => 'Web Technologies'],
            ['first' => 'Kaye A.', 'last' => 'Panaligan', 'prog' => 'BSIS', 'email' => 'kpanaligan@dsac.edu.ph', 'spec' => 'Information Systems'],
            ['first' => 'Rhea Mae', 'last' => 'Perlito', 'prog' => 'BSIS', 'email' => 'rperlito@cids.edu', 'spec' => 'Database Systems'],
            ['first' => 'Christal', 'last' => 'Sumandig', 'prog' => 'BSIS', 'email' => 'csumandig@cids.edu', 'spec' => 'Data Science'],
            ['first' => 'Mark Julius', 'last' => 'Noval', 'prog' => 'BSIS', 'email' => 'mnoval@cids.edu', 'spec' => 'Computer Networks'],
            ['first' => 'Arbeah', 'last' => 'Suyadi', 'prog' => 'BSIS', 'email' => 'asuyadi@cids.edu', 'spec' => 'Cybersecurity'],
            ['first' => 'Maria', 'last' => 'Santos', 'prog' => 'BSIT', 'email' => 'msantos@cids.edu', 'spec' => 'Software Engineering'],
            ['first' => 'Arnel', 'last' => 'Reyes', 'prog' => 'BSIT', 'email' => 'areyes@cids.edu', 'spec' => 'Data Structures'],
            ['first' => 'Cristina', 'last' => 'Lopez', 'prog' => 'BSIT', 'email' => 'clopez@cids.edu', 'spec' => 'Algorithms'],
            ['first' => 'Juan', 'last' => 'Dela Cruz', 'prog' => 'BLIS', 'email' => 'jdelacruz@cids.edu', 'spec' => 'Library Informatics'],
            ['first' => 'Diana', 'last' => 'Prince', 'prog' => 'BLIS', 'email' => 'dprince@cids.edu', 'spec' => 'Information Architecture'],
            ['first' => 'Clark', 'last' => 'Kent', 'prog' => 'BSCS', 'email' => 'ckent@cids.edu', 'spec' => 'Artificial Intelligence'],
        ];

        $facultyRole = Role::firstOrCreate(['name' => 'Faculty Member']);
        $facultyModels = [];

        foreach ($facultyDefinitions as $idx => $f) {
            $user = User::firstOrCreate(
                ['email' => $f['email']],
                [
                    'name' => "{$f['first']} {$f['last']}",
                    'password' => Hash::make('password'),
                ]
            );

            if ($facultyRole && ! $user->roles()->where('role_id', $facultyRole->id)->exists()) {
                $user->roles()->attach($facultyRole->id);
            }

            $prog = $programs[$f['prog']];
            $faculty = Faculty::updateOrCreate(
                ['email' => $f['email']],
                [
                    'user_id' => $user->id,
                    'first_name' => $f['first'],
                    'last_name' => $f['last'],
                    'program_id' => $prog->id,
                    'faculty_id' => 'CIDS-2026-'.str_pad($idx + 1, 3, '0', STR_PAD_LEFT),
                    'academic_rank' => 'Instructor II',
                    'employment_type' => 'Full-time',
                    'status' => 'Active',
                    'highest_qualification' => 'Master of Information Technology',
                    'specialization' => $f['spec'],
                    'phone' => '+63 967 657 9568',
                    'office_room' => 'CIDS Faculty Room 302',
                    'employment_date' => '2022-08-15',
                ]
            );

            $facultyModels[] = $faculty;
        }

        // 6 Canonical Requirement Folders exactly matching screenshot:
        // 1. TOS/TQ | Teaching and Learning Requirements | On Track | Due Aug 30, 2026
        // 2. Faculty Workload | Workload and Assignments | Needs Attention | Due Aug 30, 2026
        // 3. Syllabi | Course Documents | On Track | Due Sep 15, 2026
        // 4. Grades | Grading and Assessment | Critical | Due Oct 15, 2026
        // 5. IPCR | Performance Evaluation | Needs Attention | Due Oct 30, 2026
        // 6. Research Output | Research and Extension | On Track | Due Oct 30, 2026
        $reqDefs = [
            [
                'title' => 'TOS/TQ',
                'description' => 'Table of Specifications and Test Questions for Midterms and Finals.',
                'document_type' => 'TOS/TQ',
                'category' => 'Teaching and Learning Requirements',
                'academic_year' => 'AY 2026–2027',
                'semester' => '1st Semester',
                'due_date' => '2026-08-30 23:59:59',
                'open_date' => '2026-08-01 08:00:00',
                'grace_period_days' => 2,
                'required_file_types' => 'pdf,docx',
                'allow_multiple_files' => true,
                'naming_convention' => 'TOS_TQ_[Course]_[LastName]',
                'late_policy' => 'allowed_with_flag',
                'status' => 'Open',
                'health_indicator' => 'On Track',
            ],
            [
                'title' => 'Faculty Workload',
                'description' => 'Official teaching load assignments and departmental schedules.',
                'document_type' => 'Workload',
                'category' => 'Workload and Assignments',
                'academic_year' => 'AY 2026–2027',
                'semester' => '1st Semester',
                'due_date' => '2026-08-30 23:59:59',
                'open_date' => '2026-08-01 08:00:00',
                'grace_period_days' => 0,
                'required_file_types' => 'pdf',
                'allow_multiple_files' => false,
                'naming_convention' => 'WORKLOAD_[LastName]',
                'late_policy' => 'allowed_with_flag',
                'status' => 'Open',
                'health_indicator' => 'Needs Attention',
            ],
            [
                'title' => 'Syllabi',
                'description' => 'OBE compliant course syllabi and learning plans for 1st Semester.',
                'document_type' => 'Syllabus',
                'category' => 'Course Documents',
                'academic_year' => 'AY 2026–2027',
                'semester' => '1st Semester',
                'due_date' => '2026-09-15 23:59:59',
                'open_date' => '2026-08-15 08:00:00',
                'grace_period_days' => 3,
                'required_file_types' => 'pdf,docx',
                'allow_multiple_files' => true,
                'naming_convention' => 'SYLLABUS_[CourseCode]',
                'late_policy' => 'allowed_with_flag',
                'status' => 'Open',
                'health_indicator' => 'On Track',
            ],
            [
                'title' => 'Grades',
                'description' => 'Midterm and final grade sheets verified by department chairs.',
                'document_type' => 'Grades',
                'category' => 'Grading and Assessment',
                'academic_year' => 'AY 2026–2027',
                'semester' => '1st Semester',
                'due_date' => '2026-10-15 23:59:59',
                'open_date' => '2026-09-20 08:00:00',
                'grace_period_days' => 0,
                'required_file_types' => 'xlsx,pdf',
                'allow_multiple_files' => true,
                'naming_convention' => 'GRADES_[CourseCode]_[Section]',
                'late_policy' => 'requires_approval',
                'status' => 'Open',
                'health_indicator' => 'Critical',
            ],
            [
                'title' => 'IPCR',
                'description' => 'Individual Performance Commitment and Review target and accomplishment ratings.',
                'document_type' => 'IPCR',
                'category' => 'Performance Evaluation',
                'academic_year' => 'AY 2026–2027',
                'semester' => '1st Semester',
                'due_date' => '2026-10-30 23:59:59',
                'open_date' => '2026-10-01 08:00:00',
                'grace_period_days' => 5,
                'required_file_types' => 'pdf,xlsx',
                'allow_multiple_files' => false,
                'naming_convention' => 'IPCR_[LastName]_[Year]',
                'late_policy' => 'allowed_with_flag',
                'status' => 'Open',
                'health_indicator' => 'Needs Attention',
            ],
            [
                'title' => 'Research Output',
                'description' => 'Published research papers, conference presentations, and extension outputs.',
                'document_type' => 'Research',
                'category' => 'Research and Extension',
                'academic_year' => 'AY 2026–2027',
                'semester' => '1st Semester',
                'due_date' => '2026-10-30 23:59:59',
                'open_date' => '2026-08-01 08:00:00',
                'grace_period_days' => 7,
                'required_file_types' => 'pdf',
                'allow_multiple_files' => true,
                'naming_convention' => 'RESEARCH_[LastName]_[Title]',
                'late_policy' => 'allowed_with_flag',
                'status' => 'Open',
                'health_indicator' => 'On Track',
            ],
        ];

        $reqModels = [];
        foreach ($reqDefs as $rd) {
            $rd['reviewer_id'] = $adminId;
            $req = Requirement::updateOrCreate(['title' => $rd['title']], $rd);
            $reqModels[$rd['title']] = $req;
        }

        // Explicit matrix data mapping matching screenshot rows:
        // Row 1: Jerry Oriente (BSIT)
        //   TOS/TQ: Submitted Aug 28 (On Time)
        //   Workload: Submitted Aug 29 (On Time)
        //   Syllabi: Late +2d Sep 17
        //   Grades: Submitted Oct 10 (On Time)
        //   IPCR: Pending
        //   Research Output: Not Required
        // Row 2: Kaye A. Panaligan (BSIS)
        //   TOS/TQ: Submitted Aug 27 (On Time)
        //   Workload: Submitted Aug 30 (On Time)
        //   Syllabi: Submitted Sep 14 (On Time)
        //   Grades: Submitted Oct 12 (On Time)
        //   IPCR: Late +3d Nov 02
        //   Research Output: Overdue 5d
        // Row 3: Rhea Mae Perlito (BSIS)
        //   TOS/TQ: Submitted Aug 25
        //   Workload: Late +1d Aug 31
        //   Syllabi: Submitted Sep 13
        //   Grades: Overdue 3d
        //   IPCR: Pending
        //   Research Output: Submitted Oct 28
        // Row 4: Christal Sumandig (BSIS)
        //   TOS/TQ: Submitted Aug 26
        //   Workload: Submitted Aug 28
        //   Syllabi: Pending
        //   Grades: Pending
        //   IPCR: Not Required
        //   Research Output: Not Required
        // Row 5: Mark Julius Noval (BSIS)
        //   TOS/TQ: Submitted Aug 27
        //   Workload: Submitted Aug 28
        //   Syllabi: Submitted Sep 15
        //   Grades: Submitted Oct 14
        //   IPCR: Submitted Oct 29
        //   Research Output: Late +1d Oct 31

        $matrixRows = [
            'Jerry Oriente' => [
                'TOS/TQ' => ['state' => 'submitted_on_time', 'date' => '2026-08-28 09:12:00', 'early' => 2, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Faculty Workload' => ['state' => 'submitted_on_time', 'date' => '2026-08-29 14:20:00', 'early' => 1, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Syllabi' => ['state' => 'submitted_late', 'date' => '2026-09-17 11:05:00', 'early' => 0, 'late' => 2, 'files' => 2, 'rev' => 'For Review'],
                'Grades' => ['state' => 'submitted_on_time', 'date' => '2026-10-10 16:45:00', 'early' => 5, 'late' => 0, 'files' => 3, 'rev' => 'Verified'],
                'IPCR' => ['state' => 'pending', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null],
                'Research Output' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'Non-research track'],
            ],
            'Kaye A. Panaligan' => [
                'TOS/TQ' => ['state' => 'submitted_on_time', 'date' => '2026-08-27 10:30:00', 'early' => 3, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Faculty Workload' => ['state' => 'submitted_on_time', 'date' => '2026-08-30 16:30:00', 'early' => 0, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Syllabi' => ['state' => 'submitted_on_time', 'date' => '2026-09-14 15:10:00', 'early' => 1, 'late' => 0, 'files' => 2, 'rev' => 'For Review'],
                'Grades' => ['state' => 'submitted_on_time', 'date' => '2026-10-12 11:25:00', 'early' => 3, 'late' => 0, 'files' => 2, 'rev' => 'Verified'],
                'IPCR' => ['state' => 'submitted_late', 'date' => '2026-11-02 08:45:00', 'early' => 0, 'late' => 3, 'files' => 1, 'rev' => 'For Review'],
                'Research Output' => ['state' => 'overdue', 'date' => null, 'early' => 0, 'late' => 0, 'overdue' => 5, 'files' => 0, 'rev' => null],
            ],
            'Rhea Mae Perlito' => [
                'TOS/TQ' => ['state' => 'submitted_on_time', 'date' => '2026-08-25 14:15:00', 'early' => 5, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Faculty Workload' => ['state' => 'submitted_late', 'date' => '2026-08-31 09:00:00', 'early' => 0, 'late' => 1, 'files' => 1, 'rev' => 'Verified'],
                'Syllabi' => ['state' => 'submitted_on_time', 'date' => '2026-09-13 13:40:00', 'early' => 2, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Grades' => ['state' => 'overdue', 'date' => null, 'early' => 0, 'late' => 0, 'overdue' => 3, 'files' => 0, 'rev' => null],
                'IPCR' => ['state' => 'pending', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null],
                'Research Output' => ['state' => 'submitted_on_time', 'date' => '2026-10-28 17:00:00', 'early' => 2, 'late' => 0, 'files' => 2, 'rev' => 'Verified'],
            ],
            'Christal Sumandig' => [
                'TOS/TQ' => ['state' => 'submitted_on_time', 'date' => '2026-08-26 11:20:00', 'early' => 4, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Faculty Workload' => ['state' => 'submitted_on_time', 'date' => '2026-08-28 15:50:00', 'early' => 2, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Syllabi' => ['state' => 'pending', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null],
                'Grades' => ['state' => 'pending', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null],
                'IPCR' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'On Study Leave'],
                'Research Output' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'On Study Leave'],
            ],
            'Mark Julius Noval' => [
                'TOS/TQ' => ['state' => 'submitted_on_time', 'date' => '2026-08-27 16:30:00', 'early' => 3, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Faculty Workload' => ['state' => 'submitted_on_time', 'date' => '2026-08-28 10:15:00', 'early' => 2, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Syllabi' => ['state' => 'submitted_on_time', 'date' => '2026-09-15 14:00:00', 'early' => 0, 'late' => 0, 'files' => 2, 'rev' => 'Verified'],
                'Grades' => ['state' => 'submitted_on_time', 'date' => '2026-10-14 16:20:00', 'early' => 1, 'late' => 0, 'files' => 2, 'rev' => 'Verified'],
                'IPCR' => ['state' => 'submitted_on_time', 'date' => '2026-10-29 11:30:00', 'early' => 1, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Research Output' => ['state' => 'submitted_late', 'date' => '2026-10-31 09:15:00', 'early' => 0, 'late' => 1, 'files' => 1, 'rev' => 'For Review'],
            ],
            'Arbeah Suyadi' => [
                'TOS/TQ' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'On Maternity Leave'],
                'Faculty Workload' => ['state' => 'submitted_on_time', 'date' => '2026-08-26 14:00:00', 'early' => 4, 'late' => 0, 'files' => 1, 'rev' => 'Verified'],
                'Syllabi' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'On Maternity Leave'],
                'Grades' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'On Maternity Leave'],
                'IPCR' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'On Maternity Leave'],
                'Research Output' => ['state' => 'excused', 'date' => null, 'early' => 0, 'late' => 0, 'files' => 0, 'rev' => null, 'reason' => 'On Maternity Leave'],
            ],
        ];

        foreach ($facultyModels as $fac) {
            $fullName = "{$fac->first_name} {$fac->last_name}";
            foreach ($reqModels as $title => $req) {
                $rowConf = $matrixRows[$fullName][$title] ?? null;

                if ($rowConf) {
                    $state = $rowConf['state'];
                    $submittedAt = $rowConf['date'];
                    $daysLate = $rowConf['late'] ?? 0;
                    $daysEarly = $rowConf['early'] ?? 0;
                    $daysOverdue = $rowConf['overdue'] ?? 0;
                    $filesCount = $rowConf['files'] ?? 0;
                    $reviewerStatus = $rowConf['rev'] ?? null;
                    $reason = $rowConf['reason'] ?? null;
                } else {
                    // Default fallback distribution for other faculty
                    $rnd = ($fac->id + $req->id) % 5;
                    if ($rnd === 0) {
                        $state = 'submitted_late';
                        $daysLate = 2;
                        $daysEarly = 0;
                        $daysOverdue = 0;
                        $submittedAt = Carbon::parse($req->due_date)->addDays(2);
                        $filesCount = 1;
                        $reviewerStatus = 'For Review';
                        $reason = null;
                    } elseif ($rnd === 1) {
                        $state = 'overdue';
                        $daysLate = 0;
                        $daysEarly = 0;
                        $daysOverdue = 4;
                        $submittedAt = null;
                        $filesCount = 0;
                        $reviewerStatus = null;
                        $reason = null;
                    } elseif ($rnd === 2) {
                        $state = 'pending';
                        $daysLate = 0;
                        $daysEarly = 0;
                        $daysOverdue = 0;
                        $submittedAt = null;
                        $filesCount = 0;
                        $reviewerStatus = null;
                        $reason = null;
                    } else {
                        $state = 'submitted_on_time';
                        $daysLate = 0;
                        $daysEarly = 3;
                        $daysOverdue = 0;
                        $submittedAt = Carbon::parse($req->due_date)->subDays(3);
                        $filesCount = 1;
                        $reviewerStatus = 'Verified';
                        $reason = null;
                    }
                }

                $status = ($state === 'submitted_on_time' || $state === 'submitted_late') ? 'submitted' : ($state === 'excused' ? 'excused' : 'pending');

                Submission::updateOrCreate(
                    [
                        'requirement_id' => $req->id,
                        'faculty_id' => $fac->id,
                    ],
                    [
                        'status' => $status,
                        'submission_state' => $state,
                        'submitted_at' => $submittedAt,
                        'file_path' => $submittedAt ? 'uploads/sample_compliance.pdf' : null,
                        'files_count' => $filesCount,
                        'days_late' => $daysLate,
                        'days_early' => $daysEarly,
                        'days_overdue' => $daysOverdue,
                        'reviewer_status' => $reviewerStatus,
                        'remarks' => $reason,
                        'excuse_reason' => $reason,
                        'reviewer_comments' => $reviewerStatus === 'Verified' ? 'Complied with university format.' : null,
                    ]
                );
            }
        }
    }
}
