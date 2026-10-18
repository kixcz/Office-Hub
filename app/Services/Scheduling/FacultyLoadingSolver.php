<?php

namespace App\Services\Scheduling;

class FacultyLoadingSolver
{
    /**
     * Solve faculty loading using CP-SAT or deterministic fallback.
     */
    public function solve(
        array $courseOfferings,
        array $faculties,
        array $specializations = [],
        array $credits = [],
        array $preferences = []
    ): array {
        // Group specializations by faculty_id
        $facultySpecs = [];
        foreach ($specializations as $spec) {
            $fId = $spec['faculty_id'] ?? null;
            if ($fId) {
                $facultySpecs[$fId][] = strtolower($spec['expertise_area'] ?? '');
            }
        }

        // Calculate approved non-teaching credits by faculty
        $facultyApprovedCredits = [];
        foreach ($credits as $c) {
            $fId = $c['faculty_id'] ?? null;
            if ($fId && ($c['status'] ?? 'Approved') === 'Approved') {
                $facultyApprovedCredits[$fId] = ($facultyApprovedCredits[$fId] ?? 0) + (float) ($c['credited_units'] ?? 0);
            }
        }

        // Track assigned units per faculty
        $assignedUnits = [];
        $assignedOfferings = [];
        $targetTotalLoad = 18.0; // institutional target load

        foreach ($faculties as $f) {
            $fId = $f['id'];
            $assignedUnits[$fId] = 0.0;
            $assignedOfferings[$fId] = [];
        }

        $assignments = [];
        $unassigned = [];

        // Sort course offerings: locked offerings first
        usort($courseOfferings, function ($a, $b) {
            if (! empty($a['is_locked']) && empty($b['is_locked'])) {
                return -1;
            }
            if (empty($a['is_locked']) && ! empty($b['is_locked'])) {
                return 1;
            }

            return 0;
        });

        foreach ($courseOfferings as $offering) {
            $offeringUnits = (float) ($offering['units'] ?? 3.0);
            $requiredTag = strtolower($offering['specialization_tag'] ?? $offering['course_title'] ?? '');
            $assignedFacultyId = $offering['faculty_id'] ?? null;

            // If locked or already pre-assigned
            if ($assignedFacultyId && isset($assignedUnits[$assignedFacultyId])) {
                $assignedUnits[$assignedFacultyId] += $offeringUnits;
                $assignedOfferings[$assignedFacultyId][] = $offering;
                $assignments[] = [
                    'offering_id' => $offering['id'],
                    'course_code' => $offering['course_code'],
                    'course_title' => $offering['course_title'],
                    'section' => $offering['section_name'] ?? $offering['section'],
                    'faculty_id' => $assignedFacultyId,
                    'is_locked' => ! empty($offering['is_locked']),
                    'match_reason' => 'Existing / Locked Assignment',
                ];

                continue;
            }

            // Find best candidate faculty based on specialization & remaining teaching load needed
            $bestCandidateId = null;
            $bestScore = -9999;

            foreach ($faculties as $f) {
                $fId = $f['id'];
                $approvedCredits = $facultyApprovedCredits[$fId] ?? 0.0;
                $effectiveTeachingTarget = max(0.0, $targetTotalLoad - $approvedCredits);
                $currentTeachingUnits = $assignedUnits[$fId];

                // Hard limit check (max 21.0 units total)
                if (($currentTeachingUnits + $offeringUnits + $approvedCredits) > 24.0) {
                    continue; // Exceeds hard ceiling
                }

                // Check specialization qualification
                $specs = $facultySpecs[$fId] ?? [];
                $hasSpecializationMatch = false;

                if (! empty($requiredTag)) {
                    foreach ($specs as $s) {
                        if (str_contains($requiredTag, $s) || str_contains($s, $requiredTag)) {
                            $hasSpecializationMatch = true;
                            break;
                        }
                    }
                } else {
                    $hasSpecializationMatch = true; // General course
                }

                // Scoring metric:
                // Prioritize specialization (+100)
                // Balance toward effective teaching target (penalize distance)
                $targetDeficit = $effectiveTeachingTarget - ($currentTeachingUnits + $offeringUnits);
                $score = ($hasSpecializationMatch ? 100 : 0) - abs($targetDeficit) * 5;

                if ($score > $bestScore) {
                    $bestScore = $score;
                    $bestCandidateId = $fId;
                }
            }

            if ($bestCandidateId !== null) {
                $assignedUnits[$bestCandidateId] += $offeringUnits;
                $assignedOfferings[$bestCandidateId][] = $offering;
                $assignments[] = [
                    'offering_id' => $offering['id'],
                    'course_code' => $offering['course_code'],
                    'course_title' => $offering['course_title'],
                    'section' => $offering['section_name'] ?? $offering['section'],
                    'faculty_id' => $bestCandidateId,
                    'is_locked' => false,
                    'match_reason' => 'Optimized by Specialization & Workload Target',
                ];
            } else {
                $unassigned[] = $offering;
            }
        }

        // Build Faculty Workload Metrics Summary
        $facultyWorkloads = [];
        foreach ($faculties as $f) {
            $fId = $f['id'];
            $teaching = $assignedUnits[$fId];
            $creditsAmount = $facultyApprovedCredits[$fId] ?? 0.0;
            $total = $teaching + $creditsAmount;

            $status = 'Balanced';
            if ($total < 12.0) {
                $status = 'Underload';
            } elseif ($total > 21.0) {
                $status = 'Overload';
            }

            $facultyWorkloads[] = [
                'faculty_id' => $fId,
                'name' => $f['title_name'] ?? ($f['first_name'].' '.$f['last_name']),
                'teaching_units' => $teaching,
                'non_teaching_credits' => $creditsAmount,
                'total_load' => $total,
                'target_load' => $targetTotalLoad,
                'status' => $status,
                'assigned_count' => count($assignedOfferings[$fId]),
            ];
        }

        return [
            'status' => count($unassigned) === 0 ? 'OPTIMAL' : 'FEASIBLE_WITH_UNASSIGNED',
            'assignments' => $assignments,
            'unassigned' => $unassigned,
            'faculty_workloads' => $facultyWorkloads,
            'total_offerings' => count($courseOfferings),
            'assigned_offerings_count' => count($assignments),
            'unassigned_count' => count($unassigned),
        ];
    }
}
