<?php

namespace App\Services;

use App\Models\AcademicCalendarImportEvent;
use App\Models\Faculty;
use App\Models\FacultyApprovedLeave;
use App\Models\FacultyAttendance;
use App\Models\LabMonitoringSession;
use App\Models\LocatorSlip;
use App\Models\MakeUpClassRequest;
use App\Models\TravelOrder;
use App\Models\VerifiedSchedule;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ThreeWayAttendanceReconciliationService
{
    /**
     * Check if a session falls within the faculty member's active employment and assignment window.
     */
    public function isFacultyEffectiveOnDate(?Faculty $faculty, Carbon $date): bool
    {
        if (! $faculty) {
            return true;
        }

        $sessionDateStr = $date->format('Y-m-d');

        if ($faculty->employment_start_date && $sessionDateStr < $faculty->employment_start_date->format('Y-m-d')) {
            return false;
        }
        if ($faculty->employment_end_date && $sessionDateStr > $faculty->employment_end_date->format('Y-m-d')) {
            return false;
        }
        if ($faculty->teaching_assignment_effective_from && $sessionDateStr < $faculty->teaching_assignment_effective_from->format('Y-m-d')) {
            return false;
        }
        if ($faculty->teaching_assignment_effective_until && $sessionDateStr > $faculty->teaching_assignment_effective_until->format('Y-m-d')) {
            return false;
        }

        return true;
    }

    /**
     * Detect any approved administrative exceptions overlapping the scheduled teaching session.
     * Calculates exact overlap minutes.
     *
     * @return array{
     *     has_exception: bool,
     *     exception_type: ?string,
     *     exception_reference: ?string,
     *     exception_overlap_minutes: int,
     *     banner_text: ?string,
     *     details: ?array
     * }
     */
    public function detectAdministrativeExceptions(VerifiedSchedule $schedule, Carbon $date): array
    {
        $sessionDateStr = $date->format('Y-m-d');
        $sessionStart = Carbon::parse($sessionDateStr.' '.substr($schedule->scheduled_start_time, 0, 5));
        $sessionEnd = Carbon::parse($sessionDateStr.' '.substr($schedule->scheduled_end_time, 0, 5));
        $scheduledMinutes = max(1, (int) round($sessionEnd->diffInMinutes($sessionStart)));

        // 1. Check Institutional Suspensions or Holidays
        $calendarEvent = AcademicCalendarImportEvent::query()
            ->where('status', 'Confirmed')
            ->whereDate('start_date', '<=', $sessionDateStr)
            ->whereDate('end_date', '>=', $sessionDateStr)
            ->where(function ($q) {
                $q->where('category', 'like', '%Holiday%')
                    ->orWhere('category', 'like', '%Suspension%')
                    ->orWhere('title', 'like', '%Holiday%')
                    ->orWhere('title', 'like', '%Suspension%')
                    ->orWhere('confirmed_scheduling_effect', 'no_classes');
            })
            ->first();

        if ($calendarEvent) {
            $isSuspension = str_contains(strtolower($calendarEvent->title.$calendarEvent->category), 'suspension');
            $type = $isSuspension ? 'Institutional Suspension' : 'Holiday';

            return [
                'has_exception' => true,
                'exception_type' => $type,
                'exception_reference' => $calendarEvent->title,
                'exception_overlap_minutes' => $scheduledMinutes,
                'banner_text' => "{$type} Active – {$calendarEvent->title} ({$scheduledMinutes}m)",
                'details' => [
                    'source' => 'calendar',
                    'title' => $calendarEvent->title,
                    'category' => $calendarEvent->category,
                ],
            ];
        }

        $facultyId = $schedule->faculty_id;
        if (! $facultyId) {
            return [
                'has_exception' => false,
                'exception_type' => null,
                'exception_reference' => null,
                'exception_overlap_minutes' => 0,
                'banner_text' => null,
                'details' => null,
            ];
        }

        // 2. Check Approved Faculty Leave
        $approvedLeave = FacultyApprovedLeave::query()
            ->where('faculty_id', $facultyId)
            ->whereIn('status', ['Approved', 'approved'])
            ->whereDate('start_date', '<=', $sessionDateStr)
            ->whereDate('end_date', '>=', $sessionDateStr)
            ->first();

        if ($approvedLeave) {
            $ref = $approvedLeave->approval_reference ?: ($approvedLeave->leave_type ?? 'Approved Leave');

            return [
                'has_exception' => true,
                'exception_type' => 'Approved Leave',
                'exception_reference' => $ref,
                'exception_overlap_minutes' => $scheduledMinutes,
                'banner_text' => "Approved Leave – {$ref} covers full session ({$scheduledMinutes}m)",
                'details' => [
                    'source' => 'leave',
                    'leave_type' => $approvedLeave->leave_type,
                    'approval_reference' => $approvedLeave->approval_reference,
                    'requires_make_up' => $approvedLeave->requires_make_up,
                ],
            ];
        }

        // 3. Check Approved Travel Orders
        $travelOrder = TravelOrder::query()
            ->where('faculty_id', $facultyId)
            ->whereIn('status', ['Approved', 'approved', 'Traveling Now', 'traveling now', 'In Progress', 'in progress'])
            ->whereDate('start_date', '<=', $sessionDateStr)
            ->whereDate('end_date', '>=', $sessionDateStr)
            ->first();

        if ($travelOrder) {
            $tracking = $travelOrder->tracking_number ?: "TO-{$travelOrder->id}";

            return [
                'has_exception' => true,
                'exception_type' => 'Travel Order',
                'exception_reference' => $tracking,
                'exception_overlap_minutes' => $scheduledMinutes,
                'banner_text' => "Official Business Detected – Travel Order {$tracking} overlaps this session ({$scheduledMinutes}m)",
                'details' => [
                    'source' => 'travel_order',
                    'tracking_number' => $tracking,
                    'destination' => $travelOrder->destination,
                    'purpose' => $travelOrder->purpose,
                ],
            ];
        }

        // 4. Check Approved Locator Slips
        $locatorSlip = LocatorSlip::query()
            ->where('faculty_id', $facultyId)
            ->whereIn('status', ['Approved', 'approved'])
            ->whereDate('date', $sessionDateStr)
            ->first();

        if ($locatorSlip && $locatorSlip->time_out && $locatorSlip->time_in) {
            $slipStart = Carbon::parse($sessionDateStr.' '.substr($locatorSlip->time_out, 0, 5));
            $slipEnd = Carbon::parse($sessionDateStr.' '.substr($locatorSlip->time_in, 0, 5));

            // Calculate overlap window
            $overlapStart = $sessionStart->max($slipStart);
            $overlapEnd = $sessionEnd->min($slipEnd);

            if ($overlapStart < $overlapEnd) {
                $overlapMinutes = (int) round($overlapEnd->diffInMinutes($overlapStart));
                $slipNum = $locatorSlip->slip_number ?: "LS-{$locatorSlip->id}";

                return [
                    'has_exception' => true,
                    'exception_type' => 'Locator Slip',
                    'exception_reference' => $slipNum,
                    'exception_overlap_minutes' => $overlapMinutes,
                    'banner_text' => "Official Business Detected – Locator Slip {$slipNum} overlaps {$overlapMinutes} of {$scheduledMinutes} scheduled minutes",
                    'details' => [
                        'source' => 'locator_slip',
                        'slip_number' => $slipNum,
                        'time_out' => $locatorSlip->time_out,
                        'time_in' => $locatorSlip->time_in,
                        'purpose' => $locatorSlip->purpose,
                    ],
                ];
            }
        }

        return [
            'has_exception' => false,
            'exception_type' => null,
            'exception_reference' => null,
            'exception_overlap_minutes' => 0,
            'banner_text' => null,
            'details' => null,
        ];
    }

    /**
     * Reconciles scheduled expectation, administrative exception, and observed outcome.
     * Sets independent attendance status & instructional delivery status,
     * logs contradiction flags, and triggers linked Make-Up Class Request if needed.
     *
     * @param  array<string, mixed>  $observationData
     */
    public function reconcileSession(
        VerifiedSchedule $schedule,
        Carbon $date,
        array $observationData,
        ?LabMonitoringSession $existingSession = null
    ): array {
        $exception = $this->detectAdministrativeExceptions($schedule, $date);

        $sessionDateStr = $date->format('Y-m-d');
        $sessionStart = Carbon::parse($sessionDateStr.' '.substr($schedule->scheduled_start_time, 0, 5));
        $sessionEnd = Carbon::parse($sessionDateStr.' '.substr($schedule->scheduled_end_time, 0, 5));
        $scheduledMinutes = max(1, (int) round($sessionEnd->diffInMinutes($sessionStart)));

        $outcome = $observationData['observed_outcome'] ?? 'Class Conducted by Scheduled Faculty';
        $actualStartStr = $observationData['actual_start_time'] ?? null;
        $actualEndStr = $observationData['actual_end_time'] ?? null;
        $observedFacultyId = $observationData['observed_faculty_id'] ?? null;
        $observedRoomId = $observationData['observed_room_id'] ?? null;
        $observedModality = $observationData['observed_modality'] ?? 'Face-to-Face';
        $remarks = $observationData['remarks'] ?? null;

        // Calculate Delivered Minutes & Late Minutes
        $deliveredMinutes = 0;
        $lateMinutes = 0;

        if ($actualStartStr && $actualEndStr) {
            $actStart = Carbon::parse($sessionDateStr.' '.substr($actualStartStr, 0, 5));
            $actEnd = Carbon::parse($sessionDateStr.' '.substr($actualEndStr, 0, 5));
            if ($actEnd > $actStart) {
                $deliveredMinutes = min($scheduledMinutes, (int) abs(round($actEnd->diffInMinutes($actStart))));
            }
            if ($actStart > $sessionStart) {
                $lateMinutes = (int) abs(round($actStart->diffInMinutes($sessionStart)));
            }
        } elseif (in_array($outcome, ['Class Conducted by Scheduled Faculty', 'Class Conducted by Substitute Faculty', 'Transferred to Another Room', 'Switched to Online Modality'])) {
            // If conducted fully without specific minute overrides, default delivered to scheduled
            $deliveredMinutes = $scheduledMinutes;
        }

        // Check Contradictions
        $contradictionFlags = [];
        if ($exception['has_exception'] && in_array($exception['exception_type'], ['Travel Order', 'Approved Leave']) && $outcome === 'Class Conducted by Scheduled Faculty' && $observedModality === 'Face-to-Face') {
            $contradictionFlags[] = "Contradiction: Faculty has approved {$exception['exception_type']} ({$exception['exception_reference']}) but was observed teaching physically in room.";
        }
        if (in_array($outcome, ['Class Conducted by Scheduled Faculty', 'Class Conducted by Substitute Faculty']) && empty($actualStartStr) && empty($actualEndStr) && empty($remarks)) {
            $contradictionFlags[] = 'Observation recorded as Conducted but lacks actual start/end time and descriptive remarks.';
        }

        // Determine Independent Attendance Status
        $attendanceStatus = 'Present';
        $hasObOverlap = $exception['has_exception'] && in_array($exception['exception_type'], ['Travel Order', 'Locator Slip']);

        if ($exception['has_exception'] && $exception['exception_type'] === 'Approved Leave') {
            $attendanceStatus = 'Excused – Leave';
        } elseif ($hasObOverlap) {
            $attendanceStatus = 'Excused – Official Business';
        } elseif (in_array($outcome, ['Not Conducted – Faculty Absent'])) {
            $attendanceStatus = 'Unexcused Absence';
        } elseif ($lateMinutes > 15) {
            $attendanceStatus = 'Late';
        } elseif (in_array($outcome, ['Cancelled', 'Institutionally Suspended'])) {
            $attendanceStatus = 'Excused – Suspended';
        } else {
            $attendanceStatus = 'Present';
        }

        // Determine Independent Instructional Delivery Status & Make-Up Requirement
        $makeupRequiredMinutes = 0;
        $instructionalStatus = 'Fully Delivered';

        if (in_array($outcome, ['Not Conducted – Official Business', 'Not Conducted – Faculty Absent', 'Cancelled', 'Rescheduled'])) {
            $makeupRequiredMinutes = $scheduledMinutes;
            $instructionalStatus = "Make-Up Required – {$makeupRequiredMinutes}m";
        } elseif ($outcome === 'Partially Conducted') {
            $makeupRequiredMinutes = max(0, $scheduledMinutes - $deliveredMinutes);
            $instructionalStatus = $makeupRequiredMinutes > 0 ? "Make-Up Required – {$makeupRequiredMinutes}m" : 'Fully Delivered';
        } elseif ($outcome === 'Class Conducted by Substitute Faculty') {
            $instructionalStatus = 'Delivered by Substitute';
            $makeupRequiredMinutes = max(0, $scheduledMinutes - $deliveredMinutes);
        } elseif ($outcome === 'Switched to Online Modality') {
            $instructionalStatus = 'Delivered Online';
            $makeupRequiredMinutes = max(0, $scheduledMinutes - $deliveredMinutes);
        } elseif ($deliveredMinutes < $scheduledMinutes && $deliveredMinutes > 0) {
            $makeupRequiredMinutes = max(0, $scheduledMinutes - $deliveredMinutes);
            $instructionalStatus = "Make-Up Required – {$makeupRequiredMinutes}m";
        }

        // Save / Update LabMonitoringSession
        $labSession = $existingSession ?? new LabMonitoringSession;
        $labSession->room_id = $schedule->room_id;
        $labSession->verified_schedule_id = $schedule->id;
        $labSession->monitoring_date = $sessionDateStr;
        $labSession->scheduled_start_time = $schedule->scheduled_start_time;
        $labSession->scheduled_end_time = $schedule->scheduled_end_time;
        $labSession->scheduled_minutes = $schedule->scheduled_minutes ?? $scheduledMinutes;
        $labSession->observation_status = $observationData['observation_status'] ?? $this->mapOutcomeToLabSessionStatus($outcome);
        $labSession->room_condition = $observationData['room_condition'] ?? 'In Use as Scheduled';
        $labSession->session_outcome = $outcome;
        $labSession->observed_outcome = $outcome;
        $labSession->observed_modality = $observedModality;
        $labSession->observed_room_id = $observedRoomId;
        $labSession->delivered_minutes = $deliveredMinutes;
        $labSession->actual_start_time = $actualStartStr ? substr($actualStartStr, 0, 5) : null;
        $labSession->actual_end_time = $actualEndStr ? substr($actualEndStr, 0, 5) : null;
        $labSession->late_minutes = $lateMinutes;
        $labSession->exception_type = $exception['exception_type'];
        $labSession->exception_reference = $exception['exception_reference'];
        $labSession->exception_overlap_minutes = $exception['exception_overlap_minutes'];
        $labSession->makeup_required_minutes = $makeupRequiredMinutes;
        $labSession->contradiction_flags = $contradictionFlags;
        $labSession->remarks = $remarks;
        $labSession->verification_status = $observationData['verification_status'] ?? 'Observed';
        $labSession->monitored_by_user_id = $observationData['monitored_by_id'] ?? auth()->id() ?? 1;
        $labSession->photo_path = $observationData['evidence_image_path'] ?? $labSession->photo_path;
        $labSession->student_headcount = $observationData['students_count'] ?? $labSession->student_headcount;
        $labSession->save();

        // Save / Update FacultyAttendance record
        if ($schedule->faculty_id) {
            $faculty = $schedule->faculty;
            $instructorName = $faculty ? "{$faculty->first_name} {$faculty->last_name}" : 'Faculty #'.$schedule->faculty_id;
            $timeSlot = Carbon::parse($schedule->scheduled_start_time)->format('g:ia').'-'.Carbon::parse($schedule->scheduled_end_time)->format('g:ia');
            $startOfWeek = $date->copy()->startOfWeek(Carbon::MONDAY);
            $endOfWeek = $date->copy()->endOfWeek(Carbon::FRIDAY);
            $weekLabel = $startOfWeek->format('F d').'-'.$endOfWeek->format('d, Y');

            $attendance = FacultyAttendance::updateOrCreate(
                [
                    'faculty_id' => $schedule->faculty_id,
                    'session_date' => $sessionDateStr,
                    'verified_schedule_id' => $schedule->id,
                ],
                [
                    'instructor_name' => $instructorName,
                    'day_of_week' => $date->format('l'),
                    'time_slot' => $timeSlot,
                    'week_label' => $weekLabel,
                    'room_schedule_id' => null,
                    'scheduled_start_time' => $schedule->scheduled_start_time,
                    'scheduled_end_time' => $schedule->scheduled_end_time,
                    'scheduled_duration_minutes' => $scheduledMinutes,
                    'attendance_status' => $attendanceStatus,
                    'status' => $this->mapAttendanceStatusToLegacy($attendanceStatus),
                    'exception_type' => $exception['exception_type'],
                    'exception_reference' => $exception['exception_reference'],
                    'exception_overlap_minutes' => $exception['exception_overlap_minutes'],
                    'observed_outcome' => $outcome,
                    'observed_modality' => $observedModality,
                    'actual_arrival_time' => $actualStartStr,
                    'time_in' => $actualStartStr,
                    'time_out' => $actualEndStr,
                    'late_minutes' => $lateMinutes,
                    'delivered_minutes' => $deliveredMinutes,
                    'makeup_required_minutes' => $makeupRequiredMinutes,
                    'verification_status' => $labSession->verification_status,
                    'verification_source' => 'Lab In-Charge Monitoring',
                    'remarks' => $remarks,
                ]
            );
        }

        // Automatic Make-Up Class Obligation Creation
        $makeupRequest = null;
        if ($makeupRequiredMinutes > 0 && $schedule->faculty_id) {
            $makeupRequest = MakeUpClassRequest::updateOrCreate(
                [
                    'verified_schedule_id' => $schedule->id,
                    'missed_date' => $sessionDateStr,
                ],
                [
                    'reference_no' => 'MCR-'.strtoupper(Str::random(6)),
                    'academic_period_id' => $schedule->academic_period_id,
                    'faculty_id' => $schedule->faculty_id,
                    'room_schedule_id' => $schedule->id,
                    'course_code' => $schedule->course?->code ?? 'N/A',
                    'course_title' => $schedule->course?->title ?? 'Course Offering',
                    'section' => $schedule->section?->name ?? 'N/A',
                    'original_day_of_week' => $schedule->day_of_week,
                    'original_start_time' => $schedule->scheduled_start_time,
                    'original_end_time' => $schedule->scheduled_end_time,
                    'original_room_name' => $schedule->room?->name ?? 'Unassigned',
                    'required_contact_hours' => round($makeupRequiredMinutes / 60, 2),
                    'required_recovery_minutes' => $makeupRequiredMinutes,
                    'source_reason' => $exception['has_exception'] ? ($exception['exception_type'].' - '.$exception['exception_reference']) : $outcome,
                    'absence_reason' => $exception['has_exception'] ? $exception['exception_type'] : $outcome,
                    'absence_remarks' => $remarks,
                    'status' => 'Pending Proposal',
                    'lab_monitoring_session_id' => $labSession->id,
                ]
            );
        }

        return [
            'lab_monitoring_session' => $labSession,
            'attendance_status' => $attendanceStatus,
            'instructional_status' => $instructionalStatus,
            'delivered_minutes' => $deliveredMinutes,
            'makeup_required_minutes' => $makeupRequiredMinutes,
            'contradiction_flags' => $contradictionFlags,
            'make_up_request' => $makeupRequest,
        ];
    }

    protected function mapOutcomeToLabSessionStatus(string $outcome): string
    {
        return match ($outcome) {
            'Class Conducted by Scheduled Faculty', 'Transferred to Another Room' => 'Ongoing',
            'Class Conducted by Substitute Faculty', 'Switched to Online Modality' => 'Substitute/Online',
            'Partially Conducted' => 'Early Dismissal',
            'Not Conducted – Official Business', 'Not Conducted – Faculty Absent', 'Cancelled' => 'No Class',
            'Institutionally Suspended' => 'Suspended',
            default => 'Pending Verification',
        };
    }

    protected function mapAttendanceStatusToLegacy(string $attendanceStatus): string
    {
        if (str_starts_with($attendanceStatus, 'Excused')) {
            return 'Excused';
        }
        if ($attendanceStatus === 'Late') {
            return 'Late';
        }
        if ($attendanceStatus === 'Unexcused Absence') {
            return 'Absent';
        }

        return 'Present';
    }
}
