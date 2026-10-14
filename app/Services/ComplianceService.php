<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\Submission;
use Carbon\Carbon;

class ComplianceService
{
    /**
     * Ensure every eligible faculty member has a submission record for every active requirement.
     * Missing submission records are created with status = 'pending' and submitted_at = null.
     */
    public static function syncPendingSubmissions(): void
    {
        $requirements = Requirement::all();
        $faculties = Faculty::all();

        if ($requirements->isEmpty() || $faculties->isEmpty()) {
            return;
        }

        // Group faculties by program_id
        $facultiesByProgram = $faculties->groupBy('program_id');

        foreach ($requirements as $requirement) {
            // If requirement has a specific program_id, only target faculty in that program
            if ($requirement->program_id) {
                $targetFaculties = $facultiesByProgram->get($requirement->program_id, collect());
            } else {
                $targetFaculties = $faculties;
            }

            foreach ($targetFaculties as $faculty) {
                Submission::firstOrCreate(
                    [
                        'requirement_id' => $requirement->id,
                        'faculty_id' => $faculty->id,
                    ],
                    [
                        'status' => 'pending',
                        'submitted_at' => null,
                        'file_path' => null,
                        'reviewer_comments' => null,
                    ]
                );
            }
        }
    }

    /**
     * Compute comprehensive, live compliance summary metrics for all modules.
     */
    public static function getMetrics(): array
    {
        self::syncPendingSubmissions();

        $now = Carbon::now();
        $submissions = Submission::with(['faculty.program', 'requirement.program'])->get();

        $completed = 0;
        $pending = 0;
        $overdue = 0;
        $onTime = 0;
        $late = 0;

        foreach ($submissions as $sub) {
            $dueDate = $sub->requirement ? Carbon::parse($sub->requirement->due_date) : $now;

            if ($sub->submitted_at) {
                $completed++;
                if (Carbon::parse($sub->submitted_at)->greaterThan($dueDate)) {
                    $late++;
                } else {
                    $onTime++;
                }
            } else {
                if ($now->greaterThan($dueDate)) {
                    $overdue++;
                } else {
                    $pending++;
                }
            }
        }

        $total = $submissions->count();
        $complianceRate = $total > 0 ? round(($completed / $total) * 100, 1) : 0;
        $onTimeRate = $total > 0 ? round(($onTime / $total) * 100, 1) : 0;

        return [
            'total' => $total,
            'completed' => $completed,
            'pending' => $pending,
            'overdue' => $overdue,
            'on_time' => $onTime,
            'late' => $late,
            'compliance_rate' => $complianceRate,
            'on_time_rate' => $onTimeRate,
        ];
    }
}
