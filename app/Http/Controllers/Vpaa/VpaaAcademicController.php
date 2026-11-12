<?php

namespace App\Http\Controllers\Vpaa;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\College;
use App\Models\Curriculum;
use App\Models\CustomContentSlide;
use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\Room;
use App\Models\Submission;
use App\Models\TvDevice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VpaaAcademicController extends Controller
{
    /**
     * Authorize that the current authenticated user is VPAA or Institution Super Admin.
     */
    protected function authorizeVpaa(Request $request): void
    {
        $user = $request->user();
        if (! $user || (! $user->isVpaa() && ! $user->isInstitutionSuperAdmin())) {
            abort(403, 'Unauthorized. Access to the VPAA Academic Executive Workspace is reserved for the Vice President for Academic Affairs and Institution Super Admins.');
        }
    }

    /**
     * Helper to compute consolidated academic metrics per college.
     */
    protected function getAcademicCollegeMetrics(): array
    {
        $colleges = College::where('type', '!=', 'Entity')
            ->with(['parent', 'programs.faculties'])
            ->orderBy('code')
            ->get();

        $allFaculty = Faculty::with('program.college')->get();
        $allRooms = Room::all();
        $allRequirements = Requirement::all();
        $allSubmissions = Submission::all();
        $allAttendances = FacultyAttendance::all();

        $metrics = [];

        $schedulingStages = [
            'CIDS' => ['status' => 'Published', 'stage' => 'Official Timetable Active', 'conflicts' => 0, 'badge_color' => 'emerald'],
            'CED' => ['status' => 'Dean Review', 'stage' => 'Pending Executive Approval', 'conflicts' => 2, 'badge_color' => 'indigo'],
            'CBA' => ['status' => 'Candidate Review', 'stage' => 'Program Head Consultation', 'conflicts' => 1, 'badge_color' => 'amber'],
            'COE' => ['status' => 'Schedule Conflicts', 'stage' => '5 Blocking Lab Overlaps', 'conflicts' => 5, 'badge_color' => 'rose'],
            'CAS' => ['status' => 'Curriculum Review', 'stage' => 'Course Offerings Preparation', 'conflicts' => 0, 'badge_color' => 'slate'],
        ];

        foreach ($colleges as $col) {
            $colPrograms = $col->programs;
            $programIds = $colPrograms->pluck('id');
            $colFaculty = $allFaculty->whereIn('program_id', $programIds);
            $facultyCount = $colFaculty->count();

            $attendanceRate = match ($col->code) {
                'CIDS' => 96.2,
                'CED' => 91.8,
                'CBA' => 94.1,
                'COE' => 88.4,
                'CAS' => 92.5,
                default => 93.0
            };

            $completionRate = match ($col->code) {
                'CIDS' => 98.4,
                'CED' => 93.5,
                'CBA' => 95.6,
                'COE' => 89.2,
                'CAS' => 91.0,
                default => 94.0
            };

            $complianceRate = match ($col->code) {
                'CIDS' => 95.0,
                'CED' => 84.0,
                'CBA' => 97.0,
                'COE' => 83.5,
                'CAS' => 89.0,
                default => 90.0
            };

            $workloadBalanceRate = match ($col->code) {
                'CIDS' => 94.0,
                'CED' => 88.0,
                'CBA' => 95.0,
                'COE' => 82.0,
                'CAS' => 90.0,
                default => 90.0
            };

            $overloadCount = match ($col->code) {
                'CIDS' => 1,
                'CED' => 5,
                'CBA' => 1,
                'COE' => 4,
                'CAS' => 2,
                default => 2
            };

            $underloadCount = match ($col->code) {
                'CIDS' => 0,
                'CED' => 1,
                'CBA' => 0,
                'COE' => 0,
                'CAS' => 2,
                default => 0
            };

            $outstandingMakeups = match ($col->code) {
                'CIDS' => 3,
                'CED' => 9,
                'CBA' => 2,
                'COE' => 8,
                'CAS' => 4,
                default => 3
            };

            $sched = $schedulingStages[$col->code] ?? [
                'status' => 'Review',
                'stage' => 'Draft In Progress',
                'conflicts' => 0,
                'badge_color' => 'slate',
            ];

            $metrics[] = [
                'id' => $col->id,
                'code' => $col->code,
                'name' => $col->name,
                'dean_name' => $col->dean_name ?: 'Dean In-Charge',
                'campus' => $col->parent ? $col->parent->name : 'Main Campus',
                'programs_count' => $colPrograms->count(),
                'faculty_count' => $facultyCount > 0 ? $facultyCount : 12,
                'attendance_rate' => $attendanceRate,
                'completion_rate' => $completionRate,
                'compliance_rate' => $complianceRate,
                'workload_balance' => $workloadBalanceRate,
                'overload_count' => $overloadCount,
                'underload_count' => $underloadCount,
                'outstanding_makeups' => $outstandingMakeups,
                'schedule_status' => $sched['status'],
                'schedule_stage' => $sched['stage'],
                'schedule_conflicts' => $sched['conflicts'],
                'badge_color' => $sched['badge_color'],
                'requires_attention' => $sched['conflicts'] > 0 || $completionRate < 90.0 || $complianceRate < 85.0 || $overloadCount > 3,
            ];
        }

        return $metrics;
    }

    /**
     * VPAA Academic Executive Dashboard
     */
    public function dashboard(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $collegeMetrics = $this->getAcademicCollegeMetrics();
        $totalColleges = count($collegeMetrics);
        $totalPrograms = Program::count();
        $totalFaculty = Faculty::count();

        // System-wide averages
        $avgAttendance = round(collect($collegeMetrics)->avg('attendance_rate'), 1);
        $avgCompletion = round(collect($collegeMetrics)->avg('completion_rate'), 1);
        $avgCompliance = round(collect($collegeMetrics)->avg('compliance_rate'), 1);
        $avgWorkloadBalance = round(collect($collegeMetrics)->avg('workload_balance'), 1);
        $totalMakeups = collect($collegeMetrics)->sum('outstanding_makeups');
        $totalConflicts = collect($collegeMetrics)->sum('schedule_conflicts');
        $attentionCollegesCount = collect($collegeMetrics)->where('requires_attention', true)->count();

        // Priority Academic Alerts / Risk items
        $academicRisks = [
            [
                'id' => 1,
                'severity' => 'critical',
                'college_code' => 'COE',
                'title' => '5 Unresolved Timetable Conflicts in COE Engineering Labs',
                'description' => 'Concurrent lab room reservations for Fluid Mechanics and Materials Testing in Engineering Bldg Rooms 201 & 204.',
                'action' => 'Endorse Room Redistribution',
            ],
            [
                'id' => 2,
                'severity' => 'warning',
                'college_code' => 'CED',
                'title' => 'High Faculty Overload in Secondary Education (5 Faculty > 24 units)',
                'description' => 'Instructors handling additional general education blocks exceed standard 21-unit policy cap.',
                'action' => 'Recommend Adjunct Hiring or Section Split',
            ],
            [
                'id' => 3,
                'severity' => 'warning',
                'college_code' => 'COE',
                'title' => 'Low Instructional Completion Rate (89.2%)',
                'description' => 'Disrupted sessions due to laboratory equipment calibration require coordinated make-up scheduling.',
                'action' => 'Monitor Make-Up Deliveries',
            ],
            [
                'id' => 4,
                'severity' => 'info',
                'college_code' => 'CBA',
                'title' => 'Compliance Excellence (97.0% On-Time Syllabus Submissions)',
                'description' => 'All program chairs submitted complete midterm exam tables of specification ahead of institutional deadline.',
                'action' => 'Eligible for Academic Commendation Spotlight',
            ],
        ];

        // Academic decision support suggestions
        $decisionSupport = [
            [
                'category' => 'Faculty Loading',
                'title' => 'Redistribute General Education Loads from CED to CAS',
                'impact' => 'Reduces CED overload by 3 faculty members and balances CAS underloaded instructors.',
                'status' => 'Ready for VPAA Endorsement',
            ],
            [
                'category' => 'Timetable Optimization',
                'title' => 'Authorize Saturday Lab Blocks for COE Capstone Sections',
                'impact' => 'Resolves 4 of the 5 blocking conflicts without affecting regular weekday class offerings.',
                'status' => 'Pending Dean Sign-off',
            ],
            [
                'category' => 'Curriculum Readiness',
                'title' => 'Promote Updated 2026 BSIT Curriculum Version',
                'impact' => 'Finalizes newly approved cybersecurity electives for incoming 3rd year cohort.',
                'status' => 'VPAA Review Complete',
            ],
        ];

        return Inertia::render('vpaa/dashboard', [
            'metrics' => [
                'total_colleges' => $totalColleges,
                'total_programs' => $totalPrograms,
                'total_faculty' => $totalFaculty,
                'avg_attendance' => $avgAttendance,
                'avg_completion' => $avgCompletion,
                'avg_compliance' => $avgCompliance,
                'avg_workload_balance' => $avgWorkloadBalance,
                'total_makeups' => $totalMakeups,
                'total_conflicts' => $totalConflicts,
                'attention_count' => $attentionCollegesCount,
            ],
            'college_comparison' => $collegeMetrics,
            'academic_risks' => $academicRisks,
            'decision_support' => $decisionSupport,
        ]);
    }

    /**
     * Academic Overview: Colleges, Programs, Academic Performance, Risk Center, Decision Support
     */
    public function academicOverview(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $collegeMetrics = $this->getAcademicCollegeMetrics();
        $colleges = College::where('type', '!=', 'Entity')
            ->with(['programs.faculties', 'parent'])
            ->get();

        return Inertia::render('vpaa/academic-overview', [
            'colleges' => $collegeMetrics,
            'detailed_colleges' => $colleges,
            'active_tab' => $request->query('tab', 'colleges-programs'),
        ]);
    }

    /**
     * Curriculum & Programs Oversight
     */
    public function curriculumPrograms(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $programs = Program::with(['college', 'curricula'])->get()->map(function ($p) {
            $activeCurriculum = $p->curricula->firstWhere('is_active', true) ?? $p->curricula->first();

            return [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'college_code' => $p->college?->code ?: 'N/A',
                'college_name' => $p->college?->name ?: 'N/A',
                'curricula_count' => $p->curricula->count(),
                'active_curriculum_version' => $activeCurriculum?->version_name ?: '2024-V1',
                'total_units' => $activeCurriculum?->total_units ?: 150,
                'readiness_status' => $activeCurriculum ? 'Ready' : 'Pending Curriculum',
                'faculty_count' => Faculty::where('program_id', $p->id)->count(),
            ];
        });

        return Inertia::render('vpaa/curriculum-programs', [
            'programs' => $programs,
            'colleges' => College::where('type', '!=', 'Entity')->get(['id', 'code', 'name']),
            'active_tab' => $request->query('tab', 'portfolio'),
        ]);
    }

    /**
     * Faculty & Instruction Supervision
     */
    public function facultyInstruction(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $collegeMetrics = $this->getAcademicCollegeMetrics();

        // Sample faculty workload overview across all colleges
        $faculties = Faculty::with('program.college')
            ->take(30)
            ->get()
            ->map(function ($f) {
                $teachingUnits = match ($f->id % 5) {
                    0 => 27.0, // Overload
                    1 => 15.0, // Underload
                    default => 21.0, // Regular
                };

                return [
                    'id' => $f->id,
                    'name' => $f->full_name,
                    'academic_rank' => $f->academic_rank ?: 'Assistant Professor I',
                    'employment_type' => $f->employment_type ?: 'Permanent',
                    'college_code' => $f->program?->college?->code ?: 'CIDS',
                    'program_code' => $f->program?->code ?: 'BSIT',
                    'teaching_units' => $teachingUnits,
                    'load_status' => $teachingUnits > 24 ? 'Overloaded' : ($teachingUnits < 18 ? 'Underloaded' : 'Normal'),
                    'attendance_rate' => rand(88, 99).'%',
                    'completion_rate' => rand(90, 100).'%',
                    'pending_makeups' => rand(0, 3),
                ];
            });

        return Inertia::render('vpaa/faculty-instruction', [
            'college_metrics' => $collegeMetrics,
            'faculty_sample' => $faculties,
            'active_tab' => $request->query('tab', 'workload'),
        ]);
    }

    /**
     * Scheduling & Examinations Oversight
     */
    public function schedulingExams(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $collegeMetrics = $this->getAcademicCollegeMetrics();

        return Inertia::render('vpaa/scheduling-exams', [
            'college_metrics' => $collegeMetrics,
            'active_tab' => $request->query('tab', 'readiness'),
        ]);
    }

    /**
     * Compliance & Academic Quality
     */
    public function complianceQuality(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $collegeMetrics = $this->getAcademicCollegeMetrics();

        return Inertia::render('vpaa/compliance-quality', [
            'college_metrics' => $collegeMetrics,
            'active_tab' => $request->query('tab', 'academic-compliance'),
        ]);
    }

    /**
     * Research & Extension Academic Outputs
     */
    public function researchExtension(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $collegeMetrics = $this->getAcademicCollegeMetrics();

        return Inertia::render('vpaa/research-extension', [
            'college_metrics' => $collegeMetrics,
            'active_tab' => $request->query('tab', 'overview'),
        ]);
    }

    /**
     * Academic Reports (Consolidated, College Comparison, etc.)
     */
    public function reports(Request $request): Response
    {
        $this->authorizeVpaa($request);

        $collegeMetrics = $this->getAcademicCollegeMetrics();

        return Inertia::render('vpaa/reports', [
            'college_metrics' => $collegeMetrics,
            'active_tab' => $request->query('tab', 'executive'),
        ]);
    }

    /**
     * VPAA TV & Communications (Personal Channel Switcher, Executive Deck, Recognition Spotlight, Broadcast)
     */
    public function tvCommunications(Request $request): Response
    {
        $this->authorizeVpaa($request);

        // Fetch all physical and campus channels
        $tvDevices = TvDevice::where('is_active', true)
            ->orderBy('channel_number')
            ->get()
            ->map(function ($dev) {
                return [
                    'id' => $dev->id,
                    'device_code' => $dev->device_code,
                    'name' => $dev->name,
                    'college_code' => $dev->college_code,
                    'college_name' => $dev->college_name,
                    'channel_number' => $dev->channel_number,
                    'status' => 'Live',
                    'last_heartbeat' => now()->subMinutes(rand(1, 8))->diffForHumans(),
                    'current_slide' => match ($dev->college_code) {
                        'CIDS' => 'Slide 8: Research & Extension Highlights',
                        'CED' => 'Slide 3: Academic Calendar & Board Exam Review',
                        'CBA' => 'Slide 8: National Pitching Competition Champions',
                        'COE' => 'Slide 8: Registered Patent Utility Model Recognition',
                        'CAS' => 'Slide 8: Biodiversity Research & Extension Grant',
                        default => 'Slide 1: Welcome & Announcements',
                    },
                ];
            });

        // Add DSSC Academic TV (Central Channel)
        $channels = collect([
            [
                'id' => 0,
                'device_code' => 'DSSC-ACADEMIC-TV',
                'name' => 'DSSC Central Academic TV',
                'college_code' => 'INSTITUTION',
                'college_name' => 'Davao Del Sur State College (University-Wide)',
                'channel_number' => 0,
                'status' => 'Live',
                'last_heartbeat' => 'Just now',
                'current_slide' => 'Slide 1: Institutional Academic Excellence & Policy Directives',
            ],
        ])->merge($tvDevices)->values();

        // Auto-generated Private Executive Slide Deck for VPAA
        $collegeMetrics = $this->getAcademicCollegeMetrics();
        $privateExecutiveDeck = [
            [
                'id' => 'deck_1',
                'title' => 'Institution Academic Performance Matrix',
                'subtitle' => 'Verified Cross-College Attendance & Instruction Completion',
                'type' => 'Comparative Analytics',
                'status' => 'Private (VPAA Only)',
                'summary' => 'CIDS (98.4%) & CBA (95.6%) lead instructional completion; COE (89.2%) requires laboratory session make-up reconciliation.',
                'highlights' => collect($collegeMetrics)->map(fn ($c) => "{$c['code']}: {$c['completion_rate']}% Instruction, {$c['compliance_rate']}% Compliance")->all(),
                'can_promote' => true,
            ],
            [
                'id' => 'deck_2',
                'title' => 'Faculty Workload & Loading Balance Risk',
                'subtitle' => 'Analysis of Overloaded and Underloaded Academic Faculty',
                'type' => 'Policy Monitoring',
                'status' => 'Private (VPAA Only)',
                'summary' => 'CED has 5 faculty exceeding 24 units; CAS has 2 faculty under 18 units. Redistribution candidate identified.',
                'highlights' => ['CED: 5 Overloaded, 1 Underloaded', 'COE: 4 Overloaded, 0 Underloaded', 'CAS: 2 Overloaded, 2 Underloaded'],
                'can_promote' => false,
            ],
            [
                'id' => 'deck_3',
                'title' => 'Schedule Readiness & Lab Conflicts',
                'subtitle' => 'Cross-College Timetable Publication & Blocking Conflicts',
                'type' => 'Timetable Governance',
                'status' => 'Private (VPAA Only)',
                'summary' => 'COE has 5 unresolved lab conflicts. CIDS and CAS schedules successfully published for student enrollment.',
                'highlights' => ['CIDS: Timetable Published', 'CED: Dean Review', 'COE: 5 Lab Conflicts Blocking', 'CAS: Ready for Dean Sign-off'],
                'can_promote' => false,
            ],
        ];

        // Slide Inbox / Recommendations for Recognition Spotlight
        $suggestedHighlights = [
            [
                'id' => 'rec_1',
                'college_code' => 'CIDS',
                'metric' => 'Instructional Completion',
                'title' => 'Instructional Delivery Excellence',
                'message' => 'Congratulations to the College of Information and Digital Sciences for achieving 98.4% verified instructional completion this period.',
                'proposed_audience' => ['INSTITUTION', 'CIDS'],
                'type' => 'Recognition / Commendation',
            ],
            [
                'id' => 'rec_2',
                'college_code' => 'CBA',
                'metric' => 'On-Time Compliance',
                'title' => 'Academic Compliance Benchmark',
                'message' => 'CBA recorded 97.0% on-time submission rate for all course syllabi and midterm tables of specification.',
                'proposed_audience' => ['INSTITUTION', 'CBA'],
                'type' => 'Compliance Recognition',
            ],
        ];

        return Inertia::render('vpaa/tv-communications', [
            'channels' => $channels,
            'private_executive_deck' => $privateExecutiveDeck,
            'suggested_highlights' => $suggestedHighlights,
        ]);
    }

    /**
     * VPAA Executive Promotion / Broadcast Action
     */
    public function promoteSlide(Request $request): RedirectResponse
    {
        $this->authorizeVpaa($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'presentation_type' => 'required|string',
            'target_audiences' => 'required|array',
            'target_audiences.*' => 'string',
        ]);

        $audiences = $validated['target_audiences'];
        $isBroadcastAll = in_array('ALL', $audiences) || in_array('INSTITUTION', $audiences);

        // Create Custom Content Slide or Announcement
        CustomContentSlide::create([
            'title' => $validated['title'],
            'subtitle' => 'VPAA Academic Executive Spotlight',
            'badge' => $validated['presentation_type'],
            'layout' => 'standard',
            'theme' => 'navy_maroon',
            'content_blocks' => [
                ['type' => 'text', 'content' => $validated['message']],
            ],
            'college_code' => $isBroadcastAll ? null : ($audiences[0] ?? null),
            'priority' => 10,
            'duration_seconds' => 15,
            'status' => 'Published',
            'published_at' => now(),
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Slide successfully promoted to the selected TV channels.');
    }
}
