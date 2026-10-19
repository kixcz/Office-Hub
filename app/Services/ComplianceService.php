<?php

namespace App\Services;

use App\Models\Faculty;
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
        $requirements = Requirement::select(['id', 'program_id'])->get();
        $faculties = Faculty::select(['id', 'program_id'])->get();

        if ($requirements->isEmpty() || $faculties->isEmpty()) {
            return;
        }

        // Fetch all existing pairs as a lookup hash set: "reqId_facultyId" => true
        $existingSubmissions = Submission::select(['requirement_id', 'faculty_id'])
            ->get()
            ->mapWithKeys(fn ($sub) => [$sub->requirement_id.'_'.$sub->faculty_id => true]);

        // Group faculties by program_id
        $facultiesByProgram = $faculties->groupBy('program_id');

        $toInsert = [];
        $now = now();

        foreach ($requirements as $requirement) {
            $targetFaculties = $requirement->program_id
                ? $facultiesByProgram->get($requirement->program_id, collect())
                : $faculties;

            foreach ($targetFaculties as $faculty) {
                $key = $requirement->id.'_'.$faculty->id;
                if (! isset($existingSubmissions[$key])) {
                    $toInsert[] = [
                        'requirement_id' => $requirement->id,
                        'faculty_id' => $faculty->id,
                        'status' => 'pending',
                        'submitted_at' => null,
                        'file_path' => null,
                        'reviewer_comments' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $existingSubmissions[$key] = true;
                }
            }
        }

        if (! empty($toInsert)) {
            // Bulk insert in chunks of 500 records
            foreach (array_chunk($toInsert, 500) as $chunk) {
                Submission::insertOrIgnore($chunk);
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
