<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Program;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacultyPerformanceController extends Controller
{
    public function index(Request $request)
    {
        $programs = Program::orderBy('code')->get(['id', 'code', 'name']);

        $selectedAY = $request->query('ay', 'AY 2026-2027');
        $selectedSemester = $request->query('semester', '1st Semester');
        $selectedProgram = $request->query('program', 'all');
        $selectedStatus = $request->query('status', 'all');
        $search = $request->query('search', '');

        $faculties = Faculty::with(['program', 'submissions.requirement'])
            ->get()
            ->map(function ($faculty) {
                $totalRequirements = $faculty->submissions->count();
                $complied = 0;
                $onTime = 0;
                $late = 0;
                $overdue = 0;
                $pending = 0;

                foreach ($faculty->submissions as $sub) {
                    $dueDate = $sub->requirement ? Carbon::parse($sub->requirement->due_date) : null;

                    if ($sub->submitted_at) {
                        $complied++;
                        $submittedAt = Carbon::parse($sub->submitted_at);
                        if ($dueDate && $submittedAt->greaterThan($dueDate)) {
                            $late++;
                        } else {
                            $onTime++;
                        }
                    } else {
                        if ($dueDate && now()->greaterThan($dueDate)) {
                            $overdue++;
                        } else {
                            $pending++;
                        }
                    }
                }

                // Compliance Rate: Complied submissions divided by Total Assigned Requirements
                $complianceRate = $totalRequirements > 0 ? round(($complied / $totalRequirements) * 100, 2) : 0;

                // On-Time Submission Rate: On-Time submissions divided by total eligible submissions (Complied: On-Time + Late)
                // When 0 items have been complied/submitted yet, on_time_rate is null/0.0 with clear indicator
                $onTimeRate = $complied > 0 ? round(($onTime / $complied) * 100, 2) : 0;

                // Status derivation based on compliance and overdue items
                $status = 'Good Standing';
                if ($overdue > 0) {
                    $status = 'Overdue';
                } elseif ($complianceRate >= 80.0) {
                    $status = 'Excellent';
                } elseif ($complianceRate >= 50.0 || $pending > 0) {
                    $status = 'On Track';
                } elseif ($complianceRate < 30.0) {
                    $status = 'Needs Attention';
                }

                return [
                    'id' => $faculty->id,
                    'name' => $faculty->first_name.' '.$faculty->last_name,
                    'first_name' => $faculty->first_name,
                    'last_name' => $faculty->last_name,
                    'academic_rank' => $faculty->academic_rank ?? 'Instructor',
                    'program_id' => $faculty->program_id,
                    'program' => $faculty->program ? $faculty->program->code : 'N/A',
                    'program_name' => $faculty->program ? $faculty->program->name : 'N/A',
                    'total_requirements' => $totalRequirements,
                    'complied' => $complied,
                    'on_time' => $onTime,
                    'late' => $late,
                    'overdue' => $overdue,
                    'pending' => $pending,
                    'compliance_rate' => $complianceRate,
                    'on_time_rate' => $onTimeRate,
                    'has_submitted' => $complied > 0,
                    'status' => $status,
                ];
            });

        // Calculate KPI values
        $totalFaculty = $faculties->count();
        $avgComplianceRate = $totalFaculty > 0 ? round($faculties->avg('compliance_rate'), 1) : 0;

        // Average On-Time Rate across faculties who have complied submissions
        $facultiesWithSubmissions = $faculties->filter(fn ($f) => $f['has_submitted']);
        $avgOnTimeRate = $facultiesWithSubmissions->count() > 0 ? round($facultiesWithSubmissions->avg('on_time_rate'), 1) : 0;
        $totalOverdue = $faculties->sum('overdue');

        $kpis = [
            'total_faculty' => $totalFaculty,
            'compliance_rate' => $avgComplianceRate,
            'on_time_rate' => $avgOnTimeRate,
            'overdue_cases' => $totalOverdue,
        ];

        return Inertia::render('performance/faculty/index', [
            'performances' => $faculties->values(),
            'programs' => $programs,
            'kpis' => $kpis,
            'filters' => [
                'ay' => $selectedAY,
                'semester' => $selectedSemester,
                'program' => $selectedProgram,
                'status' => $selectedStatus,
                'search' => $search,
            ],
            'academic_year' => 'AY 2026-2027',
            'semester' => '1st Semester',
        ]);
    }

    public function report(Request $request)
    {
        $programs = Program::orderBy('code')->get(['id', 'code', 'name']);

        $faculties = Faculty::with(['program', 'submissions.requirement'])
            ->get()
            ->map(function ($faculty) {
                $totalRequirements = $faculty->submissions->count();
                $complied = 0;
                $onTime = 0;
                $late = 0;
                $overdue = 0;
                $pending = 0;

                foreach ($faculty->submissions as $sub) {
                    $dueDate = $sub->requirement ? Carbon::parse($sub->requirement->due_date) : null;

                    if ($sub->submitted_at) {
                        $complied++;
                        $submittedAt = Carbon::parse($sub->submitted_at);
                        if ($dueDate && $submittedAt->greaterThan($dueDate)) {
                            $late++;
                        } else {
                            $onTime++;
                        }
                    } else {
                        if ($dueDate && now()->greaterThan($dueDate)) {
                            $overdue++;
                        } else {
                            $pending++;
                        }
                    }
                }

                $complianceRate = $totalRequirements > 0 ? round(($complied / $totalRequirements) * 100, 2) : 0;
                $onTimeRate = $complied > 0 ? round(($onTime / $complied) * 100, 2) : 0;

                return [
                    'id' => $faculty->id,
                    'name' => $faculty->first_name.' '.$faculty->last_name,
                    'first_name' => $faculty->first_name,
                    'last_name' => $faculty->last_name,
                    'academic_rank' => $faculty->academic_rank ?? 'Instructor',
                    'program_id' => $faculty->program_id,
                    'program' => $faculty->program ? $faculty->program->code : 'N/A',
                    'program_name' => $faculty->program ? $faculty->program->name : 'N/A',
                    'total_requirements' => $totalRequirements,
                    'complied' => $complied,
                    'on_time' => $onTime,
                    'late' => $late,
                    'overdue' => $overdue,
                    'pending' => $pending,
                    'compliance_rate' => $complianceRate,
                    'on_time_rate' => $onTimeRate,
                    'has_submitted' => $complied > 0,
                ];
            });

        return Inertia::render('performance/faculty/report', [
            'faculties' => $faculties->values(),
            'programs' => $programs,
            'academic_year' => '2026 - 2027',
            'semester' => '1st Semester',
        ]);
    }
}
