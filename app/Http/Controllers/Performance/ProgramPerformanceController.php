<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProgramPerformanceController extends Controller
{
    public function index(Request $request)
    {
        $programs = Program::with(['faculties.submissions.requirement'])->get()->map(function ($program) {
            $totalRequirements = 0;
            $complied = 0;
            $onTime = 0;
            $late = 0;
            $overdue = 0;
            $perfectComplianceCount = 0;

            foreach ($program->faculties as $faculty) {
                $facultyTotal = $faculty->submissions->count();
                $facultyComplied = 0;

                foreach ($faculty->submissions as $sub) {
                    $totalRequirements++;
                    $dueDate = Carbon::parse($sub->requirement->due_date);

                    if ($sub->submitted_at) {
                        $complied++;
                        $facultyComplied++;
                        $submittedAt = Carbon::parse($sub->submitted_at);
                        if ($submittedAt->greaterThan($dueDate)) {
                            $late++;
                        } else {
                            $onTime++;
                        }
                    } else {
                        if (now()->greaterThan($dueDate)) {
                            $overdue++;
                        }
                    }
                }

                if ($facultyTotal > 0 && $facultyComplied === $facultyTotal) {
                    $perfectComplianceCount++;
                }
            }

            $complianceRate = $totalRequirements > 0 ? round(($complied / $totalRequirements) * 100, 2) : 0;
            $onTimeRate = $totalRequirements > 0 ? round(($onTime / $totalRequirements) * 100, 2) : 0;

            return [
                'id' => $program->id,
                'name' => $program->name,
                'code' => $program->code,
                'total_faculty' => $program->faculties->count(),
                'perfect_faculty_count' => $perfectComplianceCount,
                'total_requirements' => $totalRequirements,
                'complied' => $complied,
                'on_time' => $onTime,
                'late' => $late,
                'overdue' => $overdue,
                'compliance_rate' => $complianceRate,
                'on_time_rate' => $onTimeRate,
            ];
        });

        // Rank primarily by on_time_rate, then compliance_rate, then least overdue
        $programs = $programs->sortByDesc(function ($p) {
            return $p['on_time_rate'] * 10000 + $p['compliance_rate'] * 100 - $p['overdue'];
        })->values();

        return Inertia::render('performance/program/index', [
            'performances' => $programs,
        ]);
    }
}
