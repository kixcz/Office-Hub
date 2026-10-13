<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\FacultyAttendanceSummary;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleSheetsAttendanceService
{
    public const DEFAULT_SPREADSHEET_ID = '15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0';

    public const DEFAULT_GID = '623072317';

    /**
     * Synchronize faculty attendance from Google Sheets.
     *
     * @return array{success: bool, message: string, synced_records: int, synced_summaries: int}
     */
    public function sync(string $spreadsheetId = self::DEFAULT_SPREADSHEET_ID, string $gid = self::DEFAULT_GID): array
    {
        $url = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/export?format=csv&gid={$gid}";

        try {
            $response = Http::withoutVerifying()->timeout(20)->get($url);

            if (! $response->successful()) {
                throw new \Exception("HTTP request to Google Sheets returned status {$response->status()}");
            }

            $csv = $response->body();
            $lines = explode("\n", $csv);

            $facultyMap = Faculty::all()->mapWithKeys(function (Faculty $faculty) {
                $keys = [
                    strtolower(trim($faculty->last_name)) => $faculty->id,
                    strtolower(trim($faculty->first_name.' '.$faculty->last_name)) => $faculty->id,
                ];
                if ($faculty->spreadsheet_name) {
                    $keys[strtolower(trim($faculty->spreadsheet_name))] = $faculty->id;
                }

                return $keys;
            })->all();

            $parsedSessions = [];
            $parsedMonthlySummaries = [];
            $currentWeekLabel = 'August 10-14, 2026';

            // Iterate lines to parse sessions and monthly summary table
            foreach ($lines as $lineIndex => $line) {
                $row = str_getcsv($line);
                if (empty($row)) {
                    continue;
                }

                // Look for week label row e.g. Line 5: ,August 10-14, ... or Line 15: ,August 17-21, ...
                $cell1 = trim($row[1] ?? '');
                if (preg_match('/(August|September|October|November|December|January|February)\s+\d+-\d+/i', $cell1)) {
                    $year = trim($row[1] ?? '');
                    $currentWeekLabel = $cell1.', 2026';
                }

                // 1. Parse Daily Session Blocks across columns
                // Monday: date row[2], time row[3], instructor row[4], status row[5], late row[6]
                // Tuesday: date row[10], time row[11], instructor row[12], status row[13], late row[14]
                // Wednesday: date row[18], time row[19], instructor row[20], status row[21], late row[22]
                // Thursday: date row[26], time row[27], instructor row[28], status row[29], late row[30]
                // Friday: date row[34], time row[35], instructor row[36], status row[37], late row[38]
                $dayOffsets = [
                    ['day' => 'Monday', 'date' => 2, 'time' => 3, 'instructor' => 4, 'status' => 5, 'late' => 6],
                    ['day' => 'Tuesday', 'date' => 10, 'time' => 11, 'instructor' => 12, 'status' => 13, 'late' => 14],
                    ['day' => 'Wednesday', 'date' => 18, 'time' => 19, 'instructor' => 20, 'status' => 21, 'late' => 22],
                    ['day' => 'Thursday', 'date' => 26, 'time' => 27, 'instructor' => 28, 'status' => 29, 'late' => 30],
                    ['day' => 'Friday', 'date' => 34, 'time' => 35, 'instructor' => 36, 'status' => 37, 'late' => 38],
                ];

                foreach ($dayOffsets as $offset) {
                    $dateStr = trim($row[$offset['date']] ?? '');
                    $timeStr = trim($row[$offset['time']] ?? '');
                    $instructorStr = trim($row[$offset['instructor']] ?? '');
                    $statusStr = trim($row[$offset['status']] ?? '');
                    $lateStr = trim($row[$offset['late']] ?? '');

                    // Check if row has a valid date MM/DD/YY
                    if (preg_match('/^\d{1,2}\/\d{1,2}\/\d{2,4}$/', $dateStr) && $timeStr !== '' && $instructorStr !== '') {
                        try {
                            $parsedDate = Carbon::createFromFormat('m/d/y', $dateStr)->format('Y-m-d');
                        } catch (\Exception $e) {
                            try {
                                $parsedDate = Carbon::parse($dateStr)->format('Y-m-d');
                            } catch (\Exception) {
                                $parsedDate = '2026-08-10';
                            }
                        }

                        $cleanStatus = ucfirst(strtolower($statusStr ?: 'Present'));
                        if ($cleanStatus === 'Break' || $instructorStr === 'Break') {
                            continue;
                        }

                        $lateMins = is_numeric($lateStr) ? (int) $lateStr : 0;
                        if ($lateMins > 0 && $cleanStatus === 'Present') {
                            $cleanStatus = 'Late';
                        }

                        $facultyId = $this->resolveFacultyId($instructorStr, $facultyMap);

                        $parsedSessions[] = [
                            'faculty_id' => $facultyId,
                            'instructor_name' => $instructorStr,
                            'session_date' => $parsedDate,
                            'day_of_week' => $offset['day'],
                            'time_slot' => $timeStr,
                            'week_label' => $currentWeekLabel,
                            'status' => $cleanStatus,
                            'late_minutes' => $lateMins,
                            'academic_year' => 'AY 2026–2027',
                            'semester' => '1st Semester',
                            'source' => 'Google Sheets',
                        ];
                    }
                }

                // 2. Parse Faculty Monthly Summary Table (columns around index 42 onwards)
                // e.g. Line 4: Bacalso, 0, 0, 0, 0, 0, 0, 0, 0, 0
                // Line 8: Menoza, 46, 8, 1, 0, 0, 0, 0, 50, 0
                for ($col = 38; $col < count($row) - 8; $col++) {
                    $candName = trim($row[$col] ?? '');
                    if ($candName !== '' && ! is_numeric($candName) && ! in_array(strtolower($candName), ['date', 'time', 'status', 'chs', 'instructor', 'list of instructor:'])) {
                        // Check if next 8 columns are numbers
                        $c1 = trim($row[$col + 1] ?? '');
                        $c2 = trim($row[$col + 2] ?? '');
                        $c3 = trim($row[$col + 3] ?? '');
                        if (is_numeric($c1) && is_numeric($c2) && is_numeric($c3)) {
                            $present = (int) $c1;
                            $absent = (int) $c2;
                            $late = (int) $c3;
                            $online = (int) ($row[$col + 4] ?? 0);
                            $others = (int) ($row[$col + 5] ?? 0);
                            $onLeave = (int) ($row[$col + 6] ?? 0);
                            $subInsert = (int) ($row[$col + 7] ?? 0);
                            $totalLateMins = (int) ($row[$col + 8] ?? 0);

                            $totalScheduled = $present + $absent + $online + $others + $onLeave;
                            $rate = $totalScheduled > 0 ? round(($present / $totalScheduled) * 100, 2) : 100.0;

                            $facultyId = $this->resolveFacultyId($candName, $facultyMap);

                            $parsedMonthlySummaries[$candName] = [
                                'faculty_id' => $facultyId,
                                'instructor_name' => $candName,
                                'period_type' => 'monthly',
                                'period_label' => 'August 2026',
                                'present_count' => $present,
                                'absent_count' => $absent,
                                'late_count' => $late,
                                'online_count' => $online,
                                'others_count' => $others,
                                'on_leave_count' => $onLeave,
                                'sub_insert_count' => $subInsert,
                                'total_late_minutes' => $totalLateMins,
                                'scheduled_sessions' => $totalScheduled,
                                'attendance_rate' => $rate,
                                'academic_year' => 'AY 2026–2027',
                                'semester' => '1st Semester',
                            ];
                            break;
                        }
                    }
                }
            }

            DB::transaction(function () use ($parsedSessions, $parsedMonthlySummaries) {
                // Upsert daily session records
                foreach ($parsedSessions as $session) {
                    FacultyAttendance::updateOrCreate(
                        [
                            'instructor_name' => $session['instructor_name'],
                            'session_date' => $session['session_date'],
                            'time_slot' => $session['time_slot'],
                        ],
                        $session
                    );
                }

                // Upsert monthly summaries
                foreach ($parsedMonthlySummaries as $summary) {
                    FacultyAttendanceSummary::updateOrCreate(
                        [
                            'instructor_name' => $summary['instructor_name'],
                            'period_type' => $summary['period_type'],
                            'period_label' => $summary['period_label'],
                        ],
                        $summary
                    );
                }
            });

            Cache::put('faculty_attendance_last_sync', Carbon::now()->toIso8601String(), 86400);

            return [
                'success' => true,
                'message' => 'Faculty attendance synchronized successfully.',
                'synced_records' => count($parsedSessions),
                'synced_summaries' => count($parsedMonthlySummaries),
            ];
        } catch (\Throwable $e) {
            Log::error('GoogleSheetsAttendanceService sync error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Sync failed: '.$e->getMessage(),
                'synced_records' => 0,
                'synced_summaries' => 0,
            ];
        }
    }

    private function resolveFacultyId(string $name, array $map): ?int
    {
        $clean = strtolower(trim($name));
        if (isset($map[$clean])) {
            return $map[$clean];
        }

        foreach ($map as $key => $id) {
            if (str_contains($key, $clean) || str_contains($clean, $key)) {
                return $id;
            }
        }

        return null;
    }
}
