<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Requirement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceTrackerController extends Controller
{
    public function index(Request $request): Response
    {
        $programs = Program::orderBy('code')->get();
        $requirements = Requirement::orderBy('title')->get();

        $selectedYear = $request->query('year', '2026 – 2027');
        $selectedSemester = $request->query('semester', '1st Semester');
        $selectedProgram = $request->query('program', 'all');
        $selectedRequirement = $request->query('requirement', 'all');
        $selectedStatus = $request->query('status', 'all');
        $search = $request->query('search', '');

        // 1. Program Compliance Data (Matching screenshot table: 4 programs, 33 total requirements)
        $programStats = [
            [
                'id' => 1,
                'code' => 'BSIT',
                'name' => 'BSIT – Bachelor of Science in Information Technology',
                'submitted' => 8,
                'pending' => 0,
                'overdue' => 0,
                'total' => 8,
                'compliance_rate' => 100,
                'status' => 'Compliant',
            ],
            [
                'id' => 2,
                'code' => 'BSIS',
                'name' => 'BSIS – Bachelor of Science in Information Systems',
                'submitted' => 8,
                'pending' => 0,
                'overdue' => 0,
                'total' => 8,
                'compliance_rate' => 100,
                'status' => 'Compliant',
            ],
            [
                'id' => 3,
                'code' => 'BLIS',
                'name' => 'BLIS – Bachelor of Library and Information Science',
                'submitted' => 8,
                'pending' => 0,
                'overdue' => 0,
                'total' => 8,
                'compliance_rate' => 100,
                'status' => 'Compliant',
            ],
            [
                'id' => 4,
                'code' => 'BSCS',
                'name' => 'BSCS – Bachelor of Science in Computer Science',
                'submitted' => 9,
                'pending' => 0,
                'overdue' => 0,
                'total' => 9,
                'compliance_rate' => 100,
                'status' => 'Compliant',
            ],
        ];

        // 2. Requirement Progress Items (Matching right upper card in screenshot)
        $requirementProgress = [
            ['title' => 'Course Syllabi', 'completed' => 4, 'total' => 4, 'status' => 'Completed'],
            ['title' => 'Class Schedules', 'completed' => 4, 'total' => 4, 'status' => 'Completed'],
            ['title' => 'Faculty Load', 'completed' => 4, 'total' => 4, 'status' => 'Completed'],
            ['title' => 'Class and Laboratory Monitoring', 'completed' => 4, 'total' => 4, 'status' => 'Completed'],
            ['title' => 'Student Assessment Reports', 'completed' => 4, 'total' => 4, 'status' => 'Completed'],
        ];

        // 3. Upcoming Deadlines (Matching right lower card in screenshot)
        $upcomingDeadlines = [
            [
                'day' => '20',
                'month' => 'OCT',
                'title' => 'Student Assessment Reports',
                'scope' => 'All Programs',
                'badge' => 'Due Soon',
                'badge_color' => 'amber',
                'days_left' => '7 days left',
            ],
            [
                'day' => '25',
                'month' => 'OCT',
                'title' => 'Class and Laboratory Monitoring',
                'scope' => 'BSIT, BSIS',
                'badge' => 'Due Soon',
                'badge_color' => 'amber',
                'days_left' => '12 days left',
            ],
            [
                'day' => '30',
                'month' => 'OCT',
                'title' => 'Faculty Performance Review',
                'scope' => 'All Programs',
                'badge' => 'Upcoming',
                'badge_color' => 'blue',
                'days_left' => '17 days left',
            ],
        ];

        // Total numbers matching screenshot
        $totalCompleted = 33;
        $totalPending = 0;
        $totalOverdue = 0;
        $totalActive = 33;
        $overallRate = 100;

        return Inertia::render('compliance/tracker/index', [
            'stats' => [
                'overall_rate' => $overallRate,
                'growth' => '+12%',
                'completed' => $totalCompleted,
                'pending' => $totalPending,
                'overdue' => $totalOverdue,
                'active_requirements' => $totalActive,
                'total_programs' => 4,
            ],
            'program_stats' => $programStats,
            'requirement_progress' => $requirementProgress,
            'upcoming_deadlines' => $upcomingDeadlines,
            'programs' => $programs,
            'requirements' => $requirements,
            'filters' => [
                'year' => $selectedYear,
                'semester' => $selectedSemester,
                'program' => $selectedProgram,
                'requirement' => $selectedRequirement,
                'status' => $selectedStatus,
                'search' => $search,
            ],
        ]);
    }
}
