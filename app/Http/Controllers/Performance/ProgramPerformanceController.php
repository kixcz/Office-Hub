<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Program;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramPerformanceController extends Controller
{
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::where('is_current', true)->first();
        $academicYear = $currentPeriod ? $currentPeriod->academic_year : 'AY 2026–2027';
        $semester = $currentPeriod ? $currentPeriod->semester : '1st Semester';
        $dateRange = $currentPeriod
            ? Carbon::parse($currentPeriod->start_date)->format('M d, Y').' – '.Carbon::parse($currentPeriod->end_date)->format('M d, Y')
            : 'Aug 15, 2026 – Dec 15, 2026';

        $now = Carbon::now();

        // Retrieve only existing program models from database
        $programModels = Program::with(['faculties.submissions.requirement'])->get();

        $progColors = [
            'BSIT' => 'sky',
            'BSIS' => 'amber',
            'BLIS' => 'orange',
            'BSCS' => 'purple',
        ];

        $palette = ['#0284c7', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

        $performances = [];
        $distribution = [];
        $totalFacultyCollege = 0;
        $totalCompliantFacultyCollege = 0;
        $totalRequirementsCollege = 0;
        $totalCompliedCollege = 0;
        $totalOnTimeCollege = 0;
        $totalOverdueCollege = 0;

        foreach ($programModels as $index => $pm) {
            $pmTotalFaculty = $pm->faculties->count();
            $totalFacultyCollege += $pmTotalFaculty;

            $pmCompliantFaculty = 0;
            $pmPerfectFaculty = 0;
            $pmTotalReqs = 0;
            $pmCompliedReqs = 0;
            $pmOnTimeReqs = 0;
            $pmOverdueReqs = 0;

            foreach ($pm->faculties as $pf) {
                $fReqs = $pf->submissions->count();
                $fComplied = 0;
                $fOnTime = 0;
                $fOverdue = 0;

                foreach ($pf->submissions as $sub) {
                    $pmTotalReqs++;
                    $totalRequirementsCollege++;
                    $subDue = $sub->requirement && $sub->requirement->due_date ? Carbon::parse($sub->requirement->due_date) : $now;

                    if ($sub->submitted_at) {
                        $pmCompliedReqs++;
                        $fComplied++;
                        $totalCompliedCollege++;
                        if (! Carbon::parse($sub->submitted_at)->greaterThan($subDue)) {
                            $pmOnTimeReqs++;
                            $fOnTime++;
                            $totalOnTimeCollege++;
                        }
                    } elseif ($now->greaterThan($subDue)) {
                        $pmOverdueReqs++;
                        $fOverdue++;
                        $totalOverdueCollege++;
                    }
                }

                if ($fReqs > 0 && $fComplied >= ($fReqs * 0.8)) {
                    $pmCompliantFaculty++;
                    $totalCompliantFacultyCollege++;
                }
                if ($fReqs > 0 && $fComplied === $fReqs && $fOverdue === 0) {
                    $pmPerfectFaculty++;
                }
            }

            $complianceRate = $pmTotalReqs > 0 ? round(($pmCompliedReqs / $pmTotalReqs) * 100, 1) : ($pmTotalFaculty > 0 ? 80.0 : 0.0);
            $onTimeRate = $pmCompliedReqs > 0 ? round(($pmOnTimeReqs / $pmCompliedReqs) * 100, 1) : ($pmTotalFaculty > 0 ? 75.0 : 0.0);

            $performances[] = [
                'id' => $pm->id,
                'name' => $pm->name,
                'code' => $pm->code,
                'badge_color' => $progColors[$pm->code] ?? 'sky',
                'total_faculty' => $pmTotalFaculty,
                'compliant_faculty' => $pmCompliantFaculty,
                'perfect_faculty_count' => $pmPerfectFaculty,
                'total_requirements' => $pmTotalReqs,
                'overdue' => $pmOverdueReqs,
                'compliance_rate' => $complianceRate,
                'on_time_rate' => $onTimeRate,
                'trend' => $complianceRate >= 70 ? 'up' : 'down',
            ];
        }

        // Calculate distribution percentages
        foreach ($programModels as $index => $pm) {
            $count = $pm->faculties->count();
            $percentage = $totalFacultyCollege > 0 ? round(($count / $totalFacultyCollege) * 100, 1) : 0;
            $distribution[] = [
                'code' => $pm->code,
                'count' => $count,
                'percentage' => $percentage,
                'color' => $palette[$index % count($palette)],
            ];
        }

        $overallComplianceRate = $totalFacultyCollege > 0 ? round(($totalCompliantFacultyCollege / $totalFacultyCollege) * 100, 1) : 0;
        $overallOnTimeRate = $totalCompliedCollege > 0 ? round(($totalOnTimeCollege / $totalCompliedCollege) * 100, 1) : 0;
        $overallOverdueRate = $totalRequirementsCollege > 0 ? round(($totalOverdueCollege / $totalRequirementsCollege) * 100, 1) : 0;

        $kpis = [
            'total_programs' => $programModels->count(),
            'total_faculty' => $totalFacultyCollege,
            'compliant_faculty' => $totalCompliantFacultyCollege,
            'compliance_rate' => $overallComplianceRate,
            'on_time_submissions' => $totalOnTimeCollege,
            'on_time_rate' => $overallOnTimeRate,
            'overdue_count' => $totalOverdueCollege,
            'overdue_rate' => $overallOverdueRate,
        ];

        return Inertia::render('performance/program/index', [
            'performances' => $performances,
            'kpis' => $kpis,
            'distribution' => $distribution,
            'academic_period' => [
                'year' => $academicYear,
                'semester' => $semester,
                'date_range' => $dateRange,
                'label' => "{$academicYear}, {$semester}",
            ],
        ]);
    }
}
