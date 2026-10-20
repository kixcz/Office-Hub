<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\MakeUpClassRequest;
use App\Models\RoomSchedule;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FacultyAttendanceComputationService
{
    /**
     * Compute and parse duration in minutes from time slot string (e.g. "7:00 AM - 8:30 AM", "09:00 - 10:30").
     */
    public static function parseDurationMinutes(?string $timeSlot, ?RoomSchedule $schedule = null): int
    {
        if ($schedule && $schedule->start_time && $schedule->end_time) {
            try {
                $start = Carbon::parse($schedule->start_time);
                $end = Carbon::parse($schedule->end_time);
                $diff = $end->diffInMinutes($start);
                if ($diff > 0 && $diff <= 600) {
                    return $diff;
                }
            } catch (\Exception) {
                // fall through
            }
        }

        if (empty($timeSlot)) {
            return 90; // Standard default contact block (1.5 hours)
        }

        $parts = preg_split('/[\s–—-]+/', $timeSlot);
        if (count($parts) >= 2) {
            try {
                $timeParts = explode('-', str_replace(['–', '—'], '-', $timeSlot));
                if (count($timeParts) === 2) {
                    $start = Carbon::parse(trim($timeParts[0]));
                    $end = Carbon::parse(trim($timeParts[1]));
                    $diff = $end->diffInMinutes($start);
                    if ($diff > 0 && $diff <= 600) {
                        return $diff;
                    }
                }
            } catch (\Exception) {
                // fallback
            }
        }

        return 90;
    }

    /**
     * Normalize status to a mutually exclusive primary status.
     */
    public static function normalizePrimaryStatus(?string $status): string
    {
        $statusLower = strtolower(trim((string) $status));

        return match ($statusLower) {
            'present', 'attended', 'online' => 'present',
            'absent', 'unexcused', 'unexcused_absence' => 'unexcused_absence',
            'on_leave', 'leave', 'approved_leave', 'sick_leave', 'vacation_leave' => 'approved_leave',
            'official_business', 'ob' => 'official_business',
            'class_suspended', 'suspended', 'suspension' => 'class_suspended',
            'holiday' => 'holiday',
            'cancelled_institution', 'cancelled' => 'cancelled_institution',
            'not_yet_employed', 'not_applicable' => 'not_yet_employed',
            default => 'present',
        };
    }

    /**
     * Check if a specific session date falls within the faculty member's
     * employment and course-section teaching assignment effective period.
     */
    public static function isSessionWithinEffectiveWindow(
        Carbon $sessionDate,
        int $facultyId,
        ?int $courseId = null,
        ?int $sectionId = null
    ): bool {
        static $facultyCache = [];

        if (! isset($facultyCache[$facultyId])) {
            $facultyCache[$facultyId] = Faculty::with(['teachingAssignments' => fn ($q) => $q->where('is_active', true)])->find($facultyId);
        }

        $faculty = $facultyCache[$facultyId];
        if (! $faculty) {
            return true;
        }

        // 1. General Employment Effective Period Check
        $empStart = $faculty->employment_start_date ? Carbon::parse($faculty->employment_start_date)->startOfDay() : null;
        $empEnd = $faculty->employment_end_date ? Carbon::parse($faculty->employment_end_date)->endOfDay() : null;

        if ($empStart && $sessionDate->lt($empStart)) {
            return false;
        }
        if ($empEnd && $sessionDate->gt($empEnd)) {
            return false;
        }

        // 2. General Teaching Assignment Effective Period Check
        $teachFrom = $faculty->teaching_assignment_effective_from ? Carbon::parse($faculty->teaching_assignment_effective_from)->startOfDay() : null;
        $teachUntil = $faculty->teaching_assignment_effective_until ? Carbon::parse($faculty->teaching_assignment_effective_until)->endOfDay() : null;

        if ($teachFrom && $sessionDate->lt($teachFrom)) {
            return false;
        }
        if ($teachUntil && $sessionDate->gt($teachUntil)) {
            return false;
        }

        // 3. Subject-Specific Assignment History Check (faculty_teaching_assignments)
        if ($courseId && $faculty->relationLoaded('teachingAssignments')) {
            $courseAssignments = $faculty->teachingAssignments->where('course_id', $courseId);
            if ($sectionId) {
                $sectionSpecific = $courseAssignments->where('section_id', $sectionId);
                if ($sectionSpecific->isNotEmpty()) {
                    $courseAssignments = $sectionSpecific;
                }
            }

            if ($courseAssignments->isNotEmpty()) {
                // Check if session date falls within any valid assignment record for this subject
                $matchesAnyAssignment = false;
                foreach ($courseAssignments as $assign) {
                    $start = $assign->effective_start_date ? Carbon::parse($assign->effective_start_date)->startOfDay() : null;
                    $end = $assign->effective_end_date ? Carbon::parse($assign->effective_end_date)->endOfDay() : null;

                    $inStart = ! $start || $sessionDate->gte($start);
                    $inEnd = ! $end || $sessionDate->lte($end);

                    if ($inStart && $inEnd) {
                        $matchesAnyAssignment = true;
                        break;
                    }
                }

                if (! $matchesAnyAssignment) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Recalculate metrics for a collection of attendance sessions and save/return the summary.
     *
     * @param  Collection<int, FacultyAttendance>  $sessions
     * @return array<string, mixed>
     */
    public static function calculateMetricsForFaculty(
        Collection $sessions,
        ?int $facultyId = null,
        ?string $instructorName = null,
        ?string $periodType = 'monthly',
        ?string $periodLabel = 'August 2026'
    ): array {
        $totalScheduledMinutes = 0;
        $excludedMinutes = 0;
        $attendedMinutes = 0;
        $unexcusedAbsentMinutes = 0;
        $approvedLeaveMinutes = 0;

        $presentSessionsCount = 0;
        $onTimeSessionsCount = 0;
        $lateSessionsCount = 0;
        $totalLateMinutes = 0;
        $unexcusedSessionsCount = 0;
        $approvedLeaveSessionsCount = 0;

        foreach ($sessions as $session) {
            $duration = $session->scheduled_duration_minutes ?: self::parseDurationMinutes($session->time_slot, $session->roomSchedule);
            $totalScheduledMinutes += $duration;

            // Strict status check: prioritize status field if primary_status was inaccurately set to present
            $rawStatus = strtolower(trim((string) $session->status));
            $primaryStatus = in_array($rawStatus, ['absent', 'unexcused'])
                ? 'unexcused_absence'
                : ($session->primary_status ?: self::normalizePrimaryStatus($session->status));

            // Check if session falls outside the faculty member's effective employment/teaching assignment window
            if ($facultyId && ! empty($session->session_date)) {
                $sessionCarbonDate = Carbon::parse($session->session_date);
                $isEffective = self::isSessionWithinEffectiveWindow($sessionCarbonDate, $facultyId, $session->course_id ?? null, $session->section_id ?? null);
                if (! $isEffective) {
                    $primaryStatus = 'not_yet_employed';
                }
            }

            $lateMinutes = (int) ($session->late_minutes ?? 0);

            switch ($primaryStatus) {
                case 'not_yet_employed':
                    // Do not count toward scheduled or eligible obligations
                    $duration = 0;
                    break;

                case 'present':
                    $presentSessionsCount++;
                    $attendedMinutes += $duration;
                    if ($lateMinutes > 0) {
                        $lateSessionsCount++;
                        $totalLateMinutes += $lateMinutes;
                    } else {
                        $onTimeSessionsCount++;
                    }
                    break;

                case 'unexcused_absence':
                    $unexcusedSessionsCount++;
                    $unexcusedAbsentMinutes += $duration;
                    break;

                case 'approved_leave':
                    $approvedLeaveSessionsCount++;
                    $approvedLeaveMinutes += $duration;
                    $excludedMinutes += $duration;
                    break;

                case 'official_business':
                case 'class_suspended':
                case 'holiday':
                case 'cancelled_institution':
                    $excludedMinutes += $duration;
                    break;

                default:
                    $presentSessionsCount++;
                    $attendedMinutes += $duration;
                    if ($lateMinutes > 0) {
                        $lateSessionsCount++;
                        $totalLateMinutes += $lateMinutes;
                    } else {
                        $onTimeSessionsCount++;
                    }
                    break;
            }
        }

        $eligibleScheduledMinutes = max(0, $totalScheduledMinutes - $excludedMinutes);

        // Fetch verified/conducted make-up classes for this faculty within the academic period
        $makeUpQuery = MakeUpClassRequest::query();
        if ($facultyId) {
            $makeUpQuery->where('faculty_id', $facultyId);
        }

        $makeUpCompletedMinutes = 0;
        $makeUpRequests = $makeUpQuery->get();
        foreach ($makeUpRequests as $mu) {
            if ($mu->conducted_at || strtolower($mu->status) === 'conducted' || strtolower($mu->status) === 'approved') {
                $makeUpCompletedMinutes += (int) (($mu->required_contact_hours ?? 1.5) * 60);
            }
        }

        $makeUpRequiredMinutes = $unexcusedAbsentMinutes + $approvedLeaveMinutes;

        // Zero-denominator safe rates:
        // Attendance Coverage: Attended Eligible Minutes / Eligible Scheduled Minutes * 100
        $attendanceCoverageRate = $eligibleScheduledMinutes > 0
            ? round(($attendedMinutes / $eligibleScheduledMinutes) * 100, 2)
            : null; // N/A if 0 eligible minutes

        // On-Time Rate: On-time attended sessions / Total attended sessions * 100
        $totalAttendedSessions = $presentSessionsCount;
        $onTimeRate = $totalAttendedSessions > 0
            ? round(($onTimeSessionsCount / $totalAttendedSessions) * 100, 2)
            : null; // N/A if 0 attended sessions

        // Make-Up Completion Rate: Completed Make-Up Minutes / Required Make-Up Minutes * 100
        $makeUpCompletionRate = $makeUpRequiredMinutes > 0
            ? min(100.0, round(($makeUpCompletedMinutes / $makeUpRequiredMinutes) * 100, 2))
            : null; // N/A if none required

        // Instructional Completion Rate: (Attended Mins + Verified Make-Up Mins) / Total Required Scheduled Mins * 100
        $instructionalCompletionRate = $totalScheduledMinutes > 0
            ? min(100.0, round((($attendedMinutes + $makeUpCompletedMinutes) / $totalScheduledMinutes) * 100, 2))
            : null;

        // Check Minimum Teaching Load Threshold for Ranking Eligibility (>= 12 hrs/month or >= 3 hrs/week)
        $minMinutesThreshold = ($periodType === 'weekly') ? 180 : 720;
        $isRankEligible = ($eligibleScheduledMinutes >= $minMinutesThreshold);

        return [
            // Integer Minutes as primary baseline
            'scheduled_minutes' => $totalScheduledMinutes,
            'excluded_minutes' => $excludedMinutes,
            'eligible_minutes' => $eligibleScheduledMinutes,
            'attended_minutes' => $attendedMinutes,
            'approved_leave_minutes' => $approvedLeaveMinutes,
            'unexcused_absent_minutes' => $unexcusedAbsentMinutes,
            'late_sessions' => $lateSessionsCount,
            'late_minutes' => $totalLateMinutes,
            'make_up_required_minutes' => $makeUpRequiredMinutes,
            'make_up_completed_minutes' => $makeUpCompletedMinutes,

            // Rates (null when zero denominator for explicit N/A display)
            'attendance_coverage_rate' => $attendanceCoverageRate,
            'on_time_rate' => $onTimeRate,
            'make_up_completion_rate' => $makeUpCompletionRate,
            'instructional_completion_rate' => $instructionalCompletionRate,
            'is_rank_eligible' => $isRankEligible,

            // Counts & legacy hours convenience
            'scheduled_sessions' => count($sessions),
            'present_count' => $presentSessionsCount,
            'late_count' => $lateSessionsCount,
            'total_late_minutes' => $totalLateMinutes,
            'absent_count' => $unexcusedSessionsCount,
            'on_leave_count' => $approvedLeaveSessionsCount,
            'total_scheduled_hours' => round($totalScheduledMinutes / 60, 2),
            'eligible_scheduled_hours' => round($eligibleScheduledMinutes / 60, 2),
            'attended_hours' => round($attendedMinutes / 60, 2),
            'approved_leave_hours' => round($approvedLeaveMinutes / 60, 2),
            'unexcused_absent_hours' => round($unexcusedAbsentMinutes / 60, 2),
            'make_up_required_hours' => round($makeUpRequiredMinutes / 60, 2),
            'make_up_completed_hours' => round($makeUpCompletedMinutes / 60, 2),
        ];
    }
}
