<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacultyPerformanceController extends Controller
{
    public function index(Request $request)
    {
        $faculties = Faculty::with(['program', 'submissions.requirement'])->get()->map(function ($faculty) {
            $totalRequirements = $faculty->submissions->count();
            $complied = 0;
            $onTime = 0;
            $late = 0;
            $overdue = 0;

            foreach ($faculty->submissions as $sub) {
                $dueDate = Carbon::parse($sub->requirement->due_date);

                if ($sub->submitted_at) {
                    $complied++;
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

            $complianceRate = $totalRequirements > 0 ? round(($complied / $totalRequirements) * 100, 2) : 0;
            $onTimeRate = $totalRequirements > 0 ? round(($onTime / $totalRequirements) * 100, 2) : 0;

            return [
                'id' => $faculty->id,
                'name' => $faculty->first_name.' '.$faculty->last_name,
                'program' => $faculty->program ? $faculty->program->code : 'N/A',
                'total_requirements' => $totalRequirements,
                'complied' => $complied,
                'on_time' => $onTime,
                'late' => $late,
                'overdue' => $overdue,
                'compliance_rate' => $complianceRate,
                'on_time_rate' => $onTimeRate,
            ];
        });

        // Simple sorting by on-time rate descending
        $faculties = $faculties->sortByDesc('on_time_rate')->values();

        return Inertia::render('performance/faculty/index', [
            'performances' => $faculties,
        ]);
    }
}
