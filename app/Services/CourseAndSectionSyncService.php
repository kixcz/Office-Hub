<?php

namespace App\Services;

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Curriculum;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Section;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class CourseAndSectionSyncService
{
    protected string $defaultSpreadsheetId = '13LtlK6wopWwYf-7Q8rgmfOwEDo6gUMMJT32-xwEeVN8';

    /**
     * Recognized sheets config:
     * gid => sheet label
     */
    protected array $sheetsConfig = [
        '1905905992' => [
            'label' => 'Google Sheets (BSIT Class)',
            'program_code' => 'BSIT',
        ],
        '468505916' => [
            'label' => 'Google Sheets (BSIS Class)',
            'program_code' => 'BSIS',
        ],
    ];

    /**
     * Synchronize courses and sections from the configured or provided Google Sheets.
     */
    public function syncFromGoogleSheets(?string $spreadsheetId = null, ?array $gids = null): array
    {
        $sheetId = $spreadsheetId ?: $this->defaultSpreadsheetId;
        $targets = $gids ?: array_keys($this->sheetsConfig);

        $client = new Client([
            'verify' => false,
            'timeout' => 30,
        ]);

        $summary = [
            'sections_created' => 0,
            'sections_updated' => 0,
            'courses_created' => 0,
            'courses_updated' => 0,
            'offerings_created' => 0,
            'errors' => [],
        ];

        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::orderBy('id', 'desc')->first();
        if (! $currentPeriod) {
            $summary['errors'][] = 'No active or current Academic Period found in database.';

            return $summary;
        }

        foreach ($targets as $gid) {
            $config = $this->sheetsConfig[$gid] ?? [
                'label' => 'Google Sheets',
                'program_code' => 'BSIT',
            ];

            $exportUrl = "https://docs.google.com/spreadsheets/d/{$sheetId}/export?format=csv&gid={$gid}";

            try {
                $response = $client->get($exportUrl);
                $csvContent = $response->getBody()->getContents();

                $this->parseAndImportCsv(
                    $csvContent,
                    $config['label'],
                    $config['program_code'],
                    $currentPeriod,
                    $summary
                );
            } catch (\Throwable $e) {
                Log::error("Failed to sync sheet GID {$gid}: ".$e->getMessage());
                $summary['errors'][] = "Error syncing tab ({$config['label']}): ".$e->getMessage();
            }
        }

        return $summary;
    }

    /**
     * Import directly from an uploaded CSV string or file content.
     */
    public function importCustomCsv(string $csvContent, string $sourceLabel, string $defaultProgramCode = 'BSIT'): array
    {
        $summary = [
            'sections_created' => 0,
            'sections_updated' => 0,
            'courses_created' => 0,
            'courses_updated' => 0,
            'offerings_created' => 0,
            'errors' => [],
        ];

        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::orderBy('id', 'desc')->first();
        if (! $currentPeriod) {
            $summary['errors'][] = 'No active Academic Period found in database.';

            return $summary;
        }

        $this->parseAndImportCsv(
            $csvContent,
            $sourceLabel,
            $defaultProgramCode,
            $currentPeriod,
            $summary
        );

        return $summary;
    }

    /**
     * Parse Google Sheets CSV layout with Section blocks and Courses.
     */
    protected function parseAndImportCsv(
        string $csvContent,
        string $sourceLabel,
        string $defaultProgramCode,
        AcademicPeriod $period,
        array &$summary
    ): void {
        $lines = explode("\n", $csvContent);
        $currentSection = null;
        $inCoursesTable = false;

        $programs = Program::all()->keyBy('code');

        foreach ($lines as $line) {
            $row = str_getcsv($line);
            if (empty($row) || ! isset($row[0])) {
                continue;
            }

            $firstCol = trim($row[0]);

            // Skip empty rows
            if ($firstCol === '' && (! isset($row[1]) || trim($row[1]) === '')) {
                continue;
            }

            // Check if this row is a section header (e.g., "1 BSIT -A", "1 BSIS A", "2 BSIT -B", "3 BSAIS -A")
            if (preg_match('/^(\d)\s*([A-Za-z]+)\s*[-]?\s*([A-Za-z0-9]+)?/i', $firstCol, $matches)) {
                $yearLevel = (int) $matches[1];
                $rawProg = strtoupper($matches[2]);
                $sectionSuffix = isset($matches[3]) ? strtoupper(trim($matches[3])) : 'A';

                // Map program code
                $progCode = $programs->has($rawProg) ? $rawProg : $defaultProgramCode;
                $program = $programs->get($progCode) ?? $programs->first();

                // Standard section code: e.g. "BSIT-1A" or "1 BSIT -A" normalized
                $canonicalCode = "{$progCode}-{$yearLevel}{$sectionSuffix}";

                // Find or create Section
                $activeCurriculum = $program?->curricula()->where('status', 'Active')->first()
                    ?? $program?->curricula()->first()
                    ?? Curriculum::first();

                $section = Section::where('academic_period_id', $period->id)
                    ->where(function ($q) use ($canonicalCode, $firstCol) {
                        $q->where('code', $canonicalCode)
                            ->orWhere('code', $firstCol);
                    })->first();

                if (! $section) {
                    $section = Section::create([
                        'academic_period_id' => $period->id,
                        'program_id' => $program?->id,
                        'curriculum_id' => $activeCurriculum?->id,
                        'code' => $canonicalCode,
                        'year_level' => $yearLevel,
                        'population' => 40,
                        'actual_count' => 40,
                        'status' => 'Active',
                        'remarks' => "Synced from {$sourceLabel} (Original: {$firstCol})",
                        'source' => $sourceLabel,
                    ]);
                    $summary['sections_created']++;
                } else {
                    $section->update([
                        'program_id' => $program?->id ?? $section->program_id,
                        'curriculum_id' => $activeCurriculum?->id ?? $section->curriculum_id,
                        'year_level' => $yearLevel,
                        'status' => 'Active',
                        'source' => $sourceLabel,
                    ]);
                    $summary['sections_updated']++;
                }

                $currentSection = $section;
                $inCoursesTable = false;

                continue;
            }

            // Check if this row is the table header: "Course No.", "Descriptive Title", ...
            if (stripos($firstCol, 'Course No') !== false) {
                $inCoursesTable = true;

                continue;
            }

            // Skip subheaders like "Lecture / Laboratory"
            if (isset($row[7]) && stripos($row[7], 'Lecture') !== false) {
                continue;
            }

            // Skip Total Units rows
            if (stripos($firstCol, 'Total') !== false || (isset($row[1]) && stripos($row[1], 'Total Units') !== false)) {
                $inCoursesTable = false;

                continue;
            }

            // If we are reading course rows
            if ($inCoursesTable && $firstCol !== '') {
                $courseNo = strtoupper(trim($firstCol));
                // Ignore empty or non-course codes
                if (strlen($courseNo) < 2 || stripos($courseNo, 'Total') !== false) {
                    continue;
                }

                $title = isset($row[1]) ? trim($row[1]) : '';
                if ($title === '') {
                    $title = $courseNo;
                }

                $creditsRaw = isset($row[2]) ? trim($row[2]) : '3';
                $lecRaw = isset($row[3]) ? trim($row[3]) : '3';
                $labRaw = isset($row[4]) ? trim($row[4]) : '0';
                $prereq = isset($row[5]) ? trim($row[5]) : null;
                $facultyName = isset($row[6]) ? trim($row[6]) : null;
                $schedules = isset($row[8]) ? trim($row[8]) : (isset($row[7]) ? trim($row[7]) : null);
                $roomName = isset($row[9]) ? trim($row[9]) : null;

                // Clean numeric values
                $credits = (float) preg_replace('/[^0-9.]/', '', $creditsRaw) ?: 3.0;
                $lecHours = (float) preg_replace('/[^0-9.]/', '', $lecRaw) ?: 3.0;
                $labHours = (float) preg_replace('/[^0-9.]/', '', $labRaw) ?: 0.0;

                // Determine facility requirement and category
                $isLab = $labHours > 0 || (
                    $roomName && preg_match('/CLR|COM|LAB|CHS/i', $roomName)
                );

                $facilityType = $isLab ? 'Computer Laboratory' : 'Lecture Room';
                $category = 'Major / Specialization';
                if (str_starts_with($courseNo, 'GEC') || str_starts_with($courseNo, 'PE') || str_starts_with($courseNo, 'NSTP')) {
                    $category = 'General Education';
                }

                // Check or create program reference for course
                $courseProgram = $currentSection ? $currentSection->program : ($programs->get($defaultProgramCode) ?? $programs->first());

                // Create or update Course
                $course = Course::where('code', $courseNo)->first();
                if (! $course) {
                    $course = Course::create([
                        'program_id' => $courseProgram?->id,
                        'curriculum_id' => $currentSection?->curriculum_id,
                        'code' => $courseNo,
                        'title' => $title,
                        'units' => $credits,
                        'lecture_hours' => $lecHours,
                        'lab_hours' => $labHours,
                        'required_facility_type' => $facilityType,
                        'room_type_required' => $facilityType,
                        'category' => $category,
                        'prerequisites' => $prereq,
                        'status' => 'Active',
                        'source' => $sourceLabel,
                    ]);
                    $summary['courses_created']++;
                } else {
                    $course->update([
                        'title' => $title,
                        'units' => $credits,
                        'lecture_hours' => $lecHours,
                        'lab_hours' => $labHours,
                        'required_facility_type' => $facilityType,
                        'room_type_required' => $facilityType,
                        'status' => 'Active',
                        'source' => $sourceLabel,
                    ]);
                    $summary['courses_updated']++;
                }

                // If section is present, also attach or link course offering
                if ($currentSection) {
                    $facultyId = null;
                    if ($facultyName && stripos($facultyName, 'c/o') === false && stripos($facultyName, 'PT') === false) {
                        $faculty = Faculty::where('last_name', 'like', "%{$facultyName}%")
                            ->orWhere('first_name', 'like', "%{$facultyName}%")
                            ->first();
                        $facultyId = $faculty?->id;
                    }

                    $offering = CourseOffering::where('section_id', $currentSection->id)
                        ->where('course_id', $course->id)
                        ->where('academic_period_id', $period->id)
                        ->first();

                    if (! $offering) {
                        $offeringCode = $course->code.'-'.$currentSection->code.'-'.$period->id;
                        CourseOffering::create([
                            'academic_period_id' => $period->id,
                            'section_id' => $currentSection->id,
                            'course_id' => $course->id,
                            'program_id' => $currentSection->program_id,
                            'curriculum_id' => $currentSection->curriculum_id,
                            'faculty_id' => $facultyId,
                            'offering_code' => $offeringCode,
                            'course_code' => $course->code,
                            'course_title' => $course->title,
                            'section_name' => $currentSection->code,
                            'year_level' => $currentSection->year_level,
                            'expected_enrollment' => $currentSection->actual_count ?: $currentSection->population,
                            'offering_type' => 'Regular',
                            'units' => $course->units,
                            'lecture_hours' => $course->lecture_hours,
                            'lab_hours' => $course->lab_hours,
                            'room_type_required' => $course->required_facility_type ?? 'Lecture Room',
                            'status' => 'Active',
                            'loading_status' => $facultyId ? 'Assigned' : 'Unassigned',
                            'timetable_status' => 'Pending',
                            'publication_status' => 'Draft',
                        ]);
                        $summary['offerings_created']++;
                    } elseif ($facultyId && ! $offering->faculty_id) {
                        $offering->update([
                            'faculty_id' => $facultyId,
                            'loading_status' => 'Assigned',
                        ]);
                    }
                }
            }
        }
    }
}
