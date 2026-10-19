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
            default => 'present',
        };
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

            $primaryStatus = $session->primary_status ?: self::normalizePrimaryStatus($session->status);
            $lateMinutes = (int) ($session->late_minutes ?? 0);

            switch ($primaryStatus) {
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

        // Attendance Coverage: Attended Eligible Minutes / Eligible Scheduled Minutes * 100
        $attendanceCoverageRate = $eligibleScheduledMinutes > 0
            ? round(($attendedMinutes / $eligibleScheduledMinutes) * 100, 2)
            : 100.0;

        // On-Time Rate: On-time attended sessions / Total attended sessions * 100
        $totalAttendedSessions = $presentSessionsCount;
        $onTimeRate = $totalAttendedSessions > 0
            ? round(($onTimeSessionsCount / $totalAttendedSessions) * 100, 2)
            : 100.0;

        // Instructional Completion Rate: (Attended Mins + Verified Make-Up Mins) / Eligible Scheduled Mins * 100
        $instructionalCompletionRate = $eligibleScheduledMinutes > 0
            ? min(100.0, round((($attendedMinutes + $makeUpCompletedMinutes) / $eligibleScheduledMinutes) * 100, 2))
            : 100.0;

        // Check Minimum Teaching Load Threshold for Ranking Eligibility (>= 12 hrs/month or >= 3 hrs/week)
        $minHoursThreshold = ($periodType === 'weekly') ? 3.0 : 12.0;
        $eligibleHours = round($eligibleScheduledMinutes / 60, 2);
        $isRankEligible = ($eligibleHours >= $minHoursThreshold);

        return [
            'total_scheduled_hours' => round($totalScheduledMinutes / 60, 2),
            'eligible_scheduled_hours' => $eligibleHours,
            'attended_hours' => round($attendedMinutes / 60, 2),
            'approved_leave_hours' => round($approvedLeaveMinutes / 60, 2),
            'unexcused_absent_hours' => round($unexcusedAbsentMinutes / 60, 2),
            'make_up_required_hours' => round(($unexcusedAbsentMinutes + $approvedLeaveMinutes) / 60, 2),
            'make_up_completed_hours' => round($makeUpCompletedMinutes / 60, 2),
            'attendance_coverage_rate' => $attendanceCoverageRate,
            'on_time_rate' => $onTimeRate,
            'instructional_completion_rate' => $instructionalCompletionRate,
            'is_rank_eligible' => $isRankEligible,
            'scheduled_sessions' => count($sessions),
            'present_count' => $presentSessionsCount,
            'late_count' => $lateSessionsCount,
            'total_late_minutes' => $totalLateMinutes,
            'absent_count' => $unexcusedSessionsCount,
            'on_leave_count' => $approvedLeaveSessionsCount,
        ];
    }
}
