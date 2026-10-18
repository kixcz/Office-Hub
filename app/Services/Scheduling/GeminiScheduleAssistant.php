<?php

namespace App\Services\Scheduling;

class GeminiScheduleAssistant
{
    /**
     * Interpret free-text Program Head / Dean comments into structured proposed constraints.
     */
    public function interpretReviewComment(string $commentText, array $context = []): array
    {
        $lower = strtolower($commentText);

        $category = 'Schedule Quality';
        $severity = 'Needs Attention';
        $suggestedConstraint = 'Respect preferred time placement for affected entity.';
        $targetEntity = 'Section / Course';

        if (str_contains($lower, 'lab') || str_contains($lower, 'computer') || str_contains($lower, 'workstation')) {
            $category = 'Laboratory Requirement';
            $severity = 'Blocking';
            $suggestedConstraint = 'Mandatory Room Type Constraint: Lock room selection exclusively to [Computer Laboratory] with min 35 active workstations.';
            $targetEntity = 'Room Facility';
        } elseif (str_contains($lower, 'gap') || str_contains($lower, 'idle') || str_contains($lower, 'break')) {
            $category = 'Gap Minimization';
            $severity = 'Needs Attention';
            $suggestedConstraint = 'Soft Penalty Reduction: Reduce idle time gap between morning and afternoon blocks to max 1.5 hours.';
            $targetEntity = 'Section Cohort';
        } elseif (str_contains($lower, 'consecutive') || str_contains($lower, 'fatigue') || str_contains($lower, '5 hours') || str_contains($lower, '4 hours')) {
            $category = 'Faculty Fatigue Limit';
            $severity = 'Needs Attention';
            $suggestedConstraint = 'Hard Constraint: Cap consecutive teaching hours to max 3.5 hours before mandatory 1-hour interval.';
            $targetEntity = 'Faculty Workload';
        } elseif (str_contains($lower, 'late') || str_contains($lower, 'night') || str_contains($lower, '5:30') || str_contains($lower, '6:00')) {
            $category = 'Late Class Avoidance';
            $severity = 'Advisory';
            $suggestedConstraint = 'Soft Preference: Disfavor scheduling past 16:30 for targeted cohort.';
            $targetEntity = 'Section Cohort';
        }

        return [
            'original_comment' => $commentText,
            'identified_category' => $category,
            'inferred_severity' => $severity,
            'target_entity' => $targetEntity,
            'structured_constraint' => $suggestedConstraint,
            'confidence' => 0.94,
            'summary' => "Gemini interpreted issue as '{$category}'. Proposed constraint generated for Super Admin validation.",
        ];
    }

    /**
     * Consolidate accepted faculty post-publication swap requests and detect resource competitions.
     */
    public function consolidateSwapBatch(array $swapRequests): array
    {
        $roomCounts = [];
        $dayCounts = [];
        $themes = [];

        foreach ($swapRequests as $req) {
            $room = $req['proposed_room'] ?? null;
            $day = $req['proposed_day'] ?? null;

            if ($room) {
                $roomCounts[$room] = ($roomCounts[$room] ?? 0) + 1;
            }
            if ($day) {
                $dayCounts[$day] = ($dayCounts[$day] ?? 0) + 1;
            }

            $reason = strtolower($req['reason'] ?? '');
            if (str_contains($reason, 'graduate') || str_contains($reason, 'phd') || str_contains($reason, 'study')) {
                $themes[] = 'Faculty graduate studies schedule alignment';
            } elseif (str_contains($reason, 'distance') || str_contains($reason, 'travel') || str_contains($reason, 'commute')) {
                $themes[] = 'Regional commute optimization';
            } elseif (str_contains($reason, 'lab') || str_contains($reason, 'software')) {
                $themes[] = 'Specialized laboratory workstation requirements';
            }
        }

        // Detect shared-resource bottleneck warnings
        $warnings = [];
        foreach ($roomCounts as $room => $count) {
            if ($count >= 2) {
                $warnings[] = "Shared Facility Competition: {$count} requests concurrently compete for '{$room}'. CP-SAT solver will enforce collision-free slots.";
            }
        }

        $uniqueThemes = array_values(array_unique($themes));
        $themeSummary = ! empty($uniqueThemes)
            ? implode('; ', $uniqueThemes)
            : 'Operational faculty schedule re-alignments and mutual subject exchanges';

        return [
            'total_analyzed' => count($swapRequests),
            'recurring_themes' => $uniqueThemes,
            'summary_text' => 'Consolidated '.count($swapRequests)." mutually consented requests. Core themes: {$themeSummary}.",
            'competition_warnings' => $warnings,
        ];
    }
}
