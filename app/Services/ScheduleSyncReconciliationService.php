<?php

namespace App\Services;

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\Faculty;
use App\Models\FacultyTeachingAssignment;
use App\Models\Room;
use App\Models\RoomSchedule;
use App\Models\ScheduleSourceAlias;
use App\Models\ScheduleStagingRecord;
use App\Models\ScheduleSyncBatch;
use App\Models\Section;
use App\Models\VerifiedSchedule;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ScheduleSyncReconciliationService
{
    /**
     * Normalize a day string into canonical full day name or dual days.
     */
    public function normalizeDay(?string $rawDay): string
    {
        if (! $rawDay) {
            return 'Monday';
        }

        $upper = strtoupper(trim($rawDay));
        $upper = str_replace([' ', '/', '-'], '', $upper);

        return match ($upper) {
            'M', 'MON', 'MONDAY' => 'Monday',
            'T', 'TUE', 'TUES', 'TUESDAY' => 'Tuesday',
            'W', 'WED', 'WEDNESDAY' => 'Wednesday',
            'TH', 'THU', 'THUR', 'THURS', 'THURSDAY' => 'Thursday',
            'F', 'FRI', 'FRIDAY' => 'Friday',
            'S', 'SAT', 'SATURDAY' => 'Saturday',
            'TTH', 'TUETHU', 'TUETHURS' => 'Tuesday/Thursday',
            'MW', 'MONWED' => 'Monday/Wednesday',
            'MWF' => 'Monday/Wednesday/Friday',
            default => trim($rawDay),
        };
    }

    /**
     * Standardize time range string into HH:mm:ss start and end.
     *
     * @return array{start: string, end: string, minutes: int}
     */
    public function normalizeTimeRange(?string $rawTime): array
    {
        $default = ['start' => '09:00:00', 'end' => '10:30:00', 'minutes' => 90];

        if (! $rawTime) {
            return $default;
        }

        $parts = preg_split('/[\–—\-]/u', $rawTime);
        if (count($parts) < 2) {
            return $default;
        }

        try {
            $startStr = trim($parts[0]);
            $endStr = trim($parts[1]);

            // If start doesn't have AM/PM but end does, inherit
            if (! preg_match('/[a-zA-Z]/', $startStr) && preg_match('/(AM|PM)/i', $endStr, $m)) {
                $startStr .= ' '.$m[1];
            }

            $cStart = Carbon::parse($startStr);
            $cEnd = Carbon::parse($endStr);

            if ($cEnd->lessThanOrEqualTo($cStart)) {
                $cEnd->addHours(12);
            }

            $diffMinutes = max(30, $cStart->diffInMinutes($cEnd));

            return [
                'start' => $cStart->format('H:i:s'),
                'end' => $cEnd->format('H:i:s'),
                'minutes' => $diffMinutes,
            ];
        } catch (\Throwable $e) {
            return $default;
        }
    }

    /**
     * Clean and normalize raw strings for lookup.
     */
    public function normalizeString(?string $text): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', (string) $text)));
    }

    /**
     * Perform initial spreadsheet staging ingestion.
     */
    public function stageSpreadsheetRows(int $academicPeriodId, array $rows, ?int $userId = null): ScheduleSyncBatch
    {
        $batchNumber = 'SYNC-'.date('Ymd').'-'.Str::upper(Str::random(4));

        $batch = ScheduleSyncBatch::create([
            'academic_period_id' => $academicPeriodId,
            'batch_number' => $batchNumber,
            'source_name' => 'Published Master Timetable Google Sheet',
            'raw_rows_count' => count($rows),
            'status' => 'Staged',
            'created_by_user_id' => $userId,
        ]);

        $courses = Course::all();
        $faculties = Faculty::all();
        $sections = Section::all();
        $rooms = Room::all();
        $aliases = ScheduleSourceAlias::where('is_active', true)->get();

        $autoMatchedCount = 0;
        $needsReviewCount = 0;

        foreach ($rows as $index => $row) {
            $staging = $this->processAndScoreRow($batch->id, $index + 1, $row, $courses, $faculties, $sections, $rooms, $aliases);

            if ($staging->overall_confidence >= 95.0) {
                $autoMatchedCount++;
            } else {
                $needsReviewCount++;
            }
        }

        $batch->update([
            'auto_matched_count' => $autoMatchedCount,
            'needs_review_count' => $needsReviewCount,
        ]);

        return $batch;
    }

    /**
     * Map, normalize, and score a single staging row.
     */
    public function processAndScoreRow(
        int $batchId,
        int $rowNumber,
        array $row,
        Collection $courses,
        Collection $faculties,
        Collection $sections,
        Collection $rooms,
        Collection $aliases
    ): ScheduleStagingRecord {
        $rawSubject = trim($row['subject'] ?? $row['course'] ?? '');
        $rawFaculty = trim($row['faculty'] ?? $row['instructor'] ?? '');
        $rawSection = trim($row['section'] ?? '');
        $rawRoom = trim($row['room'] ?? '');
        $rawDay = trim($row['day'] ?? '');
        $rawTime = trim($row['time'] ?? '');

        // 1. Normalization
        $normDay = $this->normalizeDay($rawDay);
        $timeData = $this->normalizeTimeRange($rawTime);

        $evidence = [];

        // 2. Course Mapping
        $courseMatch = $this->resolveCourse($rawSubject, $courses, $aliases);
        $mappedCourseId = $courseMatch['id'];
        $courseConf = $courseMatch['confidence'];
        $evidence['course'] = $courseMatch['evidence'];

        // 3. Faculty Mapping
        $facultyMatch = $this->resolveFaculty($rawFaculty, $faculties, $aliases);
        $mappedFacultyId = $facultyMatch['id'];
        $facultyConf = $facultyMatch['confidence'];
        $evidence['faculty'] = $facultyMatch['evidence'];

        // 4. Section Mapping
        $sectionMatch = $this->resolveSection($rawSection, $sections, $aliases);
        $mappedSectionId = $sectionMatch['id'];
        $sectionConf = $sectionMatch['confidence'];
        $evidence['section'] = $sectionMatch['evidence'];

        // 5. Room Mapping
        $roomMatch = $this->resolveRoom($rawRoom, $rooms, $aliases);
        $mappedRoomId = $roomMatch['id'];
        $roomConf = $roomMatch['confidence'];
        $evidence['room'] = $roomMatch['evidence'];

        // Overall confidence computation (weighted)
        $overallConf = round(($courseConf * 0.35) + ($facultyConf * 0.30) + ($sectionConf * 0.20) + ($roomConf * 0.15), 2);

        // 6. Check Faculty Employment & Teaching Assignment Effective Date Conflict
        $hasDateConflict = false;
        $conflictReason = null;
        if ($mappedFacultyId) {
            $faculty = $faculties->firstWhere('id', $mappedFacultyId);
            if ($faculty) {
                // If row date exists or academic period starts before employment/assignment start
                $empStart = $faculty->employment_start_date ? Carbon::parse($faculty->employment_start_date) : null;
                $teachStart = $faculty->teaching_assignment_effective_from ? Carbon::parse($faculty->teaching_assignment_effective_from) : null;
                $activePeriod = AcademicPeriod::find(ScheduleSyncBatch::find($batchId)?->academic_period_id);
                $officialClassStart = $activePeriod?->class_start_date ? Carbon::parse($activePeriod->class_start_date) : Carbon::parse('2026-08-10');

                // If faculty was employed/assigned significantly after official start of classes (e.g. Sep 15 vs Aug 10)
                $effectiveStart = $teachStart ?? $empStart;
                if ($effectiveStart && $effectiveStart->gt($officialClassStart)) {
                    $hasDateConflict = true;
                    $conflictReason = "Employment-Date Conflict / Requires Mapping Review: Faculty {$faculty->first_name} {$faculty->last_name} effective date ({$effectiveStart->format('M d, Y')}) is after class start ({$officialClassStart->format('M d, Y')}). Earlier sessions require former faculty mapping or 'Not Yet Employed' classification.";
                    $evidence['effective_date_warning'] = $conflictReason;
                }
            }
        }

        $decision = ($overallConf >= 95.0 && ! $hasDateConflict) ? 'Approved' : 'Pending';
        $classification = $hasDateConflict ? 'Mapping Conflict' : 'New';

        return ScheduleStagingRecord::create([
            'sync_batch_id' => $batchId,
            'source_row_number' => $rowNumber,
            'sheet_tab' => $row['tab'] ?? '1st Semester Master',
            'raw_subject' => $rawSubject,
            'raw_faculty' => $rawFaculty,
            'raw_section' => $rawSection,
            'raw_room' => $rawRoom,
            'raw_day' => $rawDay,
            'raw_time' => $rawTime,
            'norm_subject' => $courseMatch['label'] ?? $rawSubject,
            'norm_faculty' => $facultyMatch['label'] ?? $rawFaculty,
            'norm_section' => $sectionMatch['label'] ?? $rawSection,
            'norm_room' => $roomMatch['label'] ?? $rawRoom,
            'norm_day' => $normDay,
            'norm_start_time' => $timeData['start'],
            'norm_end_time' => $timeData['end'],
            'scheduled_minutes' => $timeData['minutes'],
            'mapped_course_id' => $mappedCourseId,
            'mapped_faculty_id' => $mappedFacultyId,
            'mapped_section_id' => $mappedSectionId,
            'mapped_room_id' => $mappedRoomId,
            'course_confidence' => $courseConf,
            'faculty_confidence' => $facultyConf,
            'section_confidence' => $sectionConf,
            'room_confidence' => $roomConf,
            'overall_confidence' => $overallConf,
            'mapping_evidence' => $evidence,
            'has_date_conflict' => $hasDateConflict,
            'conflict_reason' => $conflictReason,
            'change_classification' => $classification,
            'review_decision' => $decision,
        ]);
    }

    /**
     * Resolve Course by alias or fuzzy pattern.
     */
    protected function resolveCourse(string $raw, Collection $courses, Collection $aliases): array
    {
        $norm = $this->normalizeString($raw);
        if (empty($norm)) {
            return ['id' => null, 'confidence' => 0.0, 'label' => null, 'evidence' => 'No course specified'];
        }

        // Check alias table first
        $alias = $aliases->where('entity_type', 'course')->firstWhere('normalized_alias_text', $norm);
        if ($alias) {
            $course = $courses->firstWhere('id', $alias->canonical_id);
            if ($course) {
                return ['id' => $course->id, 'confidence' => 100.0, 'label' => "{$course->code} – {$course->title}", 'evidence' => "Verified Alias Rule #{$alias->id} matched"];
            }
        }

        // Exact Course Code match
        $exactCode = $courses->first(fn ($c) => strtolower($c->code) === $norm || str_replace(' ', '', strtolower($c->code)) === str_replace(' ', '', $norm));
        if ($exactCode) {
            return ['id' => $exactCode->id, 'confidence' => 98.0, 'label' => "{$exactCode->code} – {$exactCode->title}", 'evidence' => 'Exact course code match'];
        }

        // Code in string match (e.g. "ISEL601 Data Analytics" contains "ISEL 601")
        foreach ($courses as $c) {
            $codeNoSpace = str_replace(' ', '', strtolower($c->code));
            if (str_contains(str_replace(' ', '', $norm), $codeNoSpace)) {
                return ['id' => $c->id, 'confidence' => 92.0, 'label' => "{$c->code} – {$c->title}", 'evidence' => "Substring match on {$c->code}"];
            }
        }

        // Fuzzy course title match
        foreach ($courses as $c) {
            similar_text(strtolower($c->title), $norm, $percent);
            if ($percent >= 80) {
                return ['id' => $c->id, 'confidence' => round($percent, 1), 'label' => "{$c->code} – {$c->title}", 'evidence' => "Fuzzy title match ({$percent}%)"];
            }
        }

        return ['id' => null, 'confidence' => 30.0, 'label' => $raw, 'evidence' => 'Ambiguous or unmapped subject'];
    }

    /**
     * Resolve Faculty by alias or name matching.
     */
    protected function resolveFaculty(string $raw, Collection $faculties, Collection $aliases): array
    {
        $norm = $this->normalizeString($raw);
        if (empty($norm) || in_array($norm, ['tba', 'tbd', 'unassigned', 'none'])) {
            return ['id' => null, 'confidence' => 100.0, 'label' => 'TBA (Unassigned)', 'evidence' => 'Explicit TBA / Open slot'];
        }

        // Check alias table first
        $alias = $aliases->where('entity_type', 'faculty')->firstWhere('normalized_alias_text', $norm);
        if ($alias) {
            $faculty = $faculties->firstWhere('id', $alias->canonical_id);
            if ($faculty) {
                return ['id' => $faculty->id, 'confidence' => 100.0, 'label' => "{$faculty->first_name} {$faculty->last_name}", 'evidence' => "Verified Alias Rule #{$alias->id} matched"];
            }
        }

        // Check spreadsheet_name field
        $bySpreadsheet = $faculties->first(fn ($f) => $this->normalizeString($f->spreadsheet_name) === $norm);
        if ($bySpreadsheet) {
            return ['id' => $bySpreadsheet->id, 'confidence' => 99.0, 'label' => "{$bySpreadsheet->first_name} {$bySpreadsheet->last_name}", 'evidence' => 'Matched saved faculty spreadsheet name'];
        }

        // Match by full name or last name
        foreach ($faculties as $f) {
            $fullName = strtolower("{$f->first_name} {$f->last_name}");
            $revName = strtolower("{$f->last_name}, {$f->first_name}");
            $lastName = strtolower($f->last_name);

            if ($fullName === $norm || $revName === $norm) {
                return ['id' => $f->id, 'confidence' => 98.0, 'label' => "{$f->first_name} {$f->last_name}", 'evidence' => 'Exact name match'];
            }

            if (str_contains($norm, $lastName) && strlen($lastName) > 3) {
                return ['id' => $f->id, 'confidence' => 88.0, 'label' => "{$f->first_name} {$f->last_name}", 'evidence' => "Last name match ({$f->last_name})"];
            }
        }

        return ['id' => null, 'confidence' => 40.0, 'label' => $raw, 'evidence' => 'Unrecognized faculty member'];
    }

    /**
     * Resolve Section by alias or code pattern.
     */
    protected function resolveSection(string $raw, Collection $sections, Collection $aliases): array
    {
        $norm = $this->normalizeString($raw);
        if (empty($norm)) {
            return ['id' => null, 'confidence' => 0.0, 'label' => null, 'evidence' => 'No section specified'];
        }

        $alias = $aliases->where('entity_type', 'section')->firstWhere('normalized_alias_text', $norm);
        if ($alias) {
            $section = $sections->firstWhere('id', $alias->canonical_id);
            if ($section) {
                return ['id' => $section->id, 'confidence' => 100.0, 'label' => $section->code, 'evidence' => "Verified Alias Rule #{$alias->id} matched"];
            }
        }

        // Normalize variations: e.g. "3 BSIS" or "BSIS 3" -> "BSIS-3A" or "BSIS-3"
        $cleaned = strtoupper(str_replace([' ', '-'], '', $norm));

        foreach ($sections as $s) {
            $sCleaned = strtoupper(str_replace([' ', '-'], '', $s->code));
            if ($sCleaned === $cleaned) {
                return ['id' => $s->id, 'confidence' => 98.0, 'label' => $s->code, 'evidence' => 'Exact section code match'];
            }
            if (str_contains($cleaned, $sCleaned) || str_contains($sCleaned, $cleaned)) {
                return ['id' => $s->id, 'confidence' => 85.0, 'label' => $s->code, 'evidence' => "Partial cohort match ({$s->code})"];
            }
        }

        return ['id' => null, 'confidence' => 45.0, 'label' => $raw, 'evidence' => 'Unmatched cohort section'];
    }

    /**
     * Resolve Room by alias or code pattern.
     */
    protected function resolveRoom(string $raw, Collection $rooms, Collection $aliases): array
    {
        $norm = $this->normalizeString($raw);
        if (empty($norm)) {
            return ['id' => null, 'confidence' => 0.0, 'label' => null, 'evidence' => 'No room specified'];
        }

        $alias = $aliases->where('entity_type', 'room')->firstWhere('normalized_alias_text', $norm);
        if ($alias) {
            $room = $rooms->firstWhere('id', $alias->canonical_id);
            if ($room) {
                return ['id' => $room->id, 'confidence' => 100.0, 'label' => $room->name, 'evidence' => "Verified Alias Rule #{$alias->id} matched"];
            }
        }

        $cleaned = strtoupper(str_replace([' ', '-'], '', $norm));

        foreach ($rooms as $r) {
            $rCleaned = strtoupper(str_replace([' ', '-'], '', $r->name));
            if ($rCleaned === $cleaned) {
                return ['id' => $r->id, 'confidence' => 98.0, 'label' => $r->name, 'evidence' => 'Exact room name match'];
            }
        }

        return ['id' => null, 'confidence' => 50.0, 'label' => $raw, 'evidence' => 'Unmatched facility'];
    }

    /**
     * Commit approved staging records into VerifiedSchedule production layer.
     */
    public function commitBatchVerification(ScheduleSyncBatch $batch, ?int $userId = null): int
    {
        $stagingRecords = $batch->stagingRecords()
            ->where('review_decision', 'Approved')
            ->whereNotNull('mapped_course_id')
            ->whereNotNull('mapped_faculty_id')
            ->whereNotNull('mapped_section_id')
            ->whereNotNull('mapped_room_id')
            ->get();

        $verifiedCount = 0;

        foreach ($stagingRecords as $stg) {
            $faculty = Faculty::find($stg->mapped_faculty_id);
            $activePeriod = AcademicPeriod::find($batch->academic_period_id);
            $classStart = $activePeriod?->class_start_date ?? Carbon::parse('2026-08-10');
            $classEnd = $activePeriod?->class_end_date ?? Carbon::parse('2026-12-18');

            $effStart = $faculty?->teaching_assignment_effective_from
                ?? $faculty?->employment_start_date
                ?? $classStart;

            $effEnd = $faculty?->teaching_assignment_effective_until
                ?? $faculty?->employment_end_date
                ?? $classEnd;

            $verifiedRecord = VerifiedSchedule::updateOrCreate(
                [
                    'academic_period_id' => $batch->academic_period_id,
                    'faculty_id' => $stg->mapped_faculty_id,
                    'course_id' => $stg->mapped_course_id,
                    'section_id' => $stg->mapped_section_id,
                    'day_of_week' => $stg->norm_day,
                    'scheduled_start_time' => $stg->norm_start_time,
                ],
                [
                    'staging_record_id' => $stg->id,
                    'sync_batch_id' => $batch->id,
                    'room_id' => $stg->mapped_room_id,
                    'session_type' => str_contains(strtolower($stg->norm_room), 'lab') || str_contains(strtolower($stg->raw_room), 'lab') || str_contains(strtolower($stg->norm_room), 'clr') ? 'Laboratory' : 'Lecture',
                    'scheduled_end_time' => $stg->norm_end_time,
                    'scheduled_minutes' => $stg->scheduled_minutes,
                    'effective_start_date' => $effStart,
                    'effective_end_date' => $effEnd,
                    'assignment_source' => 'Verified Reconciliation Batch '.$batch->batch_number,
                    'original_raw_values' => [
                        'subject' => $stg->raw_subject,
                        'faculty' => $stg->raw_faculty,
                        'section' => $stg->raw_section,
                        'room' => $stg->raw_room,
                        'day' => $stg->raw_day,
                        'time' => $stg->raw_time,
                    ],
                    'mapping_confidence' => $stg->overall_confidence,
                    'status' => 'Active',
                    'verified_by_user_id' => $userId,
                    'verified_at' => now(),
                ]
            );

            // Record faculty teaching assignment history record
            if ($stg->mapped_faculty_id && $stg->mapped_course_id) {
                FacultyTeachingAssignment::updateOrCreate(
                    [
                        'faculty_id' => $stg->mapped_faculty_id,
                        'course_id' => $stg->mapped_course_id,
                        'section_id' => $stg->mapped_section_id,
                        'academic_period_id' => $batch->academic_period_id,
                        'effective_start_date' => $effStart,
                    ],
                    [
                        'room_id' => $stg->mapped_room_id,
                        'effective_end_date' => $effEnd,
                        'assignment_role' => 'Primary Instructor',
                        'approval_reference' => 'Batch '.$batch->batch_number,
                        'is_active' => true,
                    ]
                );
            }

            // Also keep RoomSchedule in sync so existing displays show verified metadata
            RoomSchedule::updateOrCreate(
                [
                    'room_name' => $stg->norm_room,
                    'day_of_week' => $stg->norm_day,
                    'start_time' => $stg->norm_start_time,
                ],
                [
                    'academic_period_id' => $batch->academic_period_id,
                    'end_time' => $stg->norm_end_time,
                    'course_code' => $stg->mappedCourse?->code ?? $stg->norm_subject,
                    'course_title' => $stg->mappedCourse?->title ?? $stg->norm_subject,
                    'instructor' => $stg->mappedFaculty ? "{$stg->mappedFaculty->first_name} {$stg->mappedFaculty->last_name}" : $stg->norm_faculty,
                    'faculty_id' => $stg->mapped_faculty_id,
                    'section' => $stg->norm_section,
                    'raw_text' => "{$stg->raw_subject} - {$stg->raw_section} ({$stg->raw_faculty})",
                ]
            );

            $verifiedCount++;
        }

        $batch->update([
            'status' => 'Verified',
            'verified_count' => $verifiedCount,
        ]);

        return $verifiedCount;
    }
}
