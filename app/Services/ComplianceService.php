<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\Requirement;
use App\Models\Submission;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class ComplianceService
{
    public const SYNC_CACHE_KEY = 'officehub_compliance_submissions_synced_v1';

    /**
     * Ensure every eligible faculty member has a submission record for every active requirement.
     * Missing submission records are created with status = 'pending' and submitted_at = null.
     * Gated behind a cache signature so it only runs when Requirement or Faculty counts/timestamps change.
     */
    public static function syncPendingSubmissions(bool $force = false): void
    {
        $signature = sprintf(
            'req:%d:%s|fac:%d:%s',
            Requirement::count(),
            (string) Requirement::max('updated_at'),
            Faculty::count(),
            (string) Faculty::max('updated_at')
        );

        if (! $force && Cache::get(self::SYNC_CACHE_KEY) === $signature) {
            return;
        }

        $requirements = Requirement::select(['id', 'program_id', 'college_id', 'applicable_programs'])->get();
        $faculties = Faculty::with('program')->select(['id', 'program_id'])->get();

        if ($requirements->isEmpty() || $faculties->isEmpty()) {
            Cache::put(self::SYNC_CACHE_KEY, $signature, 900);

            return;
        }

        // Fetch all existing pairs as a lookup hash set: "reqId_facultyId" => true
        $existingSubmissions = Submission::select(['requirement_id', 'faculty_id'])
            ->get()
            ->mapWithKeys(fn ($sub) => [$sub->requirement_id.'_'.$sub->faculty_id => true]);

        // Group faculties by program_id and college_id
        $facultiesByProgram = $faculties->groupBy('program_id');
        $facultiesByCollege = $faculties->groupBy(fn ($f) => $f->program?->college_id);

        $toInsert = [];
        $now = now();

        foreach ($requirements as $requirement) {
            $applicablePrograms = is_array($requirement->applicable_programs)
                ? array_filter($requirement->applicable_programs)
                : [];

            if (! empty($applicablePrograms)) {
                // If specific applicable programs are specified
                $targetFaculties = $faculties->filter(function ($faculty) use ($applicablePrograms) {
                    return in_array($faculty->program_id, $applicablePrograms)
                        || in_array((string) $faculty->program_id, $applicablePrograms);
                });
            } elseif ($requirement->program_id) {
                // Specific single program
                $targetFaculties = $facultiesByProgram->get($requirement->program_id, collect());
            } elseif ($requirement->college_id) {
                // All programs within the college
                $targetFaculties = $facultiesByCollege->get($requirement->college_id, collect());
            } else {
                // General requirement across all faculties
                $targetFaculties = $faculties;
            }

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

        Cache::put(self::SYNC_CACHE_KEY, $signature, 900);
    }

    /**
     * Flush the compliance sync cache signature so the next check re-evaluates.
     */
    public static function flushSyncCache(): void
    {
        Cache::forget(self::SYNC_CACHE_KEY);
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
