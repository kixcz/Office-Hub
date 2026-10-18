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
     * Known faculty tab mapping for individual attendance pages.
     * Can also be dynamically discovered from sheet metadata.
     */
    public const FACULTY_TABS = [
        'Aguilar' => '2068465106',
        'Alba' => '636868907',
        'Arendain' => '2066902311',
        'Bacalso' => '1853306129',
        'Bahaya' => '1421370742',
        'Caniban' => '1212819527',
        'Estrebello' => '1360255923',
        'Menoza' => '1400613471',
        'Millan' => '673730953',
        'Montoya' => '1627176077',
        'Noval' => '1171254892',
        'Oriente' => '1211507713',
        'Origines' => '550505925',
        'Panaligan H.' => '807326386',
        'Panaligan K.' => '1571286000',
        'Pansacala' => '1079694552',
        'Perito' => '1697293234',
        'Rehang' => '64647300',
        'Restauro' => '595293812',
        'Robinos' => '1856665457',
        'Roxas' => '1540174239',
        'Surdella' => '1463653870',
        'Villegas' => '1653393116',
        'Sumandig' => '1445365301',
        'Tangob' => '604990796',
        'Vicente' => '888142096',
        'Sayadi' => '1520736945',
    ];

    /**
     * Synchronize faculty attendance from Google Sheets.
     *
     * @return array{success: bool, message: string, synced_records: int, synced_summaries: int}
     */
    public function sync(string $spreadsheetId = self::DEFAULT_SPREADSHEET_ID, string $gid = self::DEFAULT_GID): array
    {
        try {
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

            // 1. Fetch Primary Lab Sheet (sessions across rooms and schedules)
            $labUrl = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/export?format=csv&gid={$gid}";
            $labResponse = Http::withoutVerifying()->timeout(25)->get($labUrl);

            if ($labResponse->successful()) {
                $lines = explode("\n", $labResponse->body());
                $currentWeekLabel = 'August 10-14, 2026';

                foreach ($lines as $line) {
                    $row = str_getcsv($line);
                    if (empty($row)) {
                        continue;
                    }

                    $cell1 = trim($row[1] ?? '');
                    if (preg_match('/(August|September|October|November|December|January|February)\s+\d+-\d+/i', $cell1)) {
                        $currentWeekLabel = $cell1.', 2026';
                    }

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
                                'room' => 'CHS',
                                'week_label' => $currentWeekLabel,
                                'status' => $cleanStatus,
                                'late_minutes' => $lateMins,
                                'academic_year' => 'AY 2026–2027',
                                'semester' => '1st Semester',
                                'source' => 'Google Sheets',
                            ];
                        }
                    }
                }
            }

            // 2. Discover faculty tabs if possible from workbook HTML or fall back to known tabs
            $facultyTabs = $this->discoverFacultyTabs($spreadsheetId);

            // 3. Parallel fetch all individual faculty tabs to extract all months (August, September, October, November, etc.)
            $tabContents = $this->fetchTabsInParallel($spreadsheetId, $facultyTabs);

            // Canonical tab-to-faculty fallback mapping
            $tabToFacultyId = [
                'Aguilar' => 35,
                'Alba' => 14,
                'Arendain' => 18,
                'Bacalso' => null,
                'Bahaya' => 36,
                'Caniban' => 9,
                'Estrebello' => 15,
                'Menoza' => 11,
                'Millan' => 6,
                'Montoya' => 23,
                'Noval' => 38,
                'Oriente' => 10,
                'Origines' => 1,
                'Panaligan H.' => 13,
                'Panaligan K.' => 12,
                'Pansacala' => 16,
                'Perito' => 3,
                'Rehang' => 22,
                'Restauro' => 37,
                'Robinos' => null,
                'Roxas' => 2,
                'Surdella' => 24,
                'Villegas' => 17,
                'Sumandig' => 20,
                'Tangob' => 5,
                'Vicente' => 46,
                'Sayadi' => 19,
            ];

            $allFacultyModels = Faculty::with('program')->get()->keyBy('id');

            foreach ($tabContents as $tabName => $csvContent) {
                if (empty($csvContent)) {
                    continue;
                }

                $tabLines = explode("\n", $csvContent);
                $row0 = str_getcsv($tabLines[0] ?? '');
                $rawInstructor = trim($row0[0] ?? '');

                // Resolve Faculty Model
                $facultyId = $tabToFacultyId[$tabName] ?? ($this->resolveFacultyId($rawInstructor, $facultyMap) ?? $this->resolveFacultyId($tabName, $facultyMap));
                $facultyModel = $facultyId && isset($allFacultyModels[$facultyId]) ? $allFacultyModels[$facultyId] : null;

                // Canonical instructor name: "Firstname Lastname" from Faculty table if linked, else rawInstructor or tabName
                if ($facultyModel) {
                    $instructorName = "{$facultyModel->first_name} {$facultyModel->last_name}";
                } elseif ($rawInstructor !== '' && ! str_contains(strtolower($rawInstructor), 'history') && ! str_contains(strtolower($rawInstructor), 'laboratory')) {
                    $instructorName = $rawInstructor;
                } else {
                    $instructorName = $tabName;
                }

                // Parse Statistics by Month (columns 17 - 26)
                // Rows 1-12 typically list: August, September, October, November, December, etc.
                for ($r = 1; $r < min(14, count($tabLines)); $r++) {
                    $row = str_getcsv($tabLines[$r]);
                    $monthName = trim($row[17] ?? '');

                    if (in_array(strtolower($monthName), ['august', 'september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'may'])) {
                        $periodLabel = ucfirst(strtolower($monthName)).' 2026';

                        $present = (int) ($row[18] ?? 0);
                        $absent = (int) ($row[19] ?? 0);
                        $late = (int) ($row[20] ?? 0);
                        $online = (int) ($row[21] ?? 0);
                        $others = (int) ($row[22] ?? 0);
                        $onLeave = (int) ($row[23] ?? 0);
                        $subInsert = (int) ($row[24] ?? 0);
                        $totalLateMins = (int) ($row[26] ?? 0);

                        $totalScheduled = $present + $absent + $online + $others + $onLeave;
                        $rate = $totalScheduled > 0 ? round(($present / $totalScheduled) * 100, 2) : 100.0;

                        // Key by tabName and periodLabel to avoid duplicates across months
                        $key = $tabName.'_'.$periodLabel;
                        $parsedMonthlySummaries[$key] = [
                            'faculty_id' => $facultyId,
                            'instructor_name' => $instructorName,
                            'period_type' => 'monthly',
                            'period_label' => $periodLabel,
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
                    }

                    // Also check Weekly Breakdown on this tab (columns 31-41)
                    $weekName = trim($row[31] ?? '');
                    if ($weekName !== '' && ! in_array(strtolower($weekName), ['week', 'present'])) {
                        $wDate = trim($row[32] ?? '');
                        $weekLabel = $weekName;
                        if ($wDate !== '') {
                            $weekLabel = "{$weekName} ({$wDate})";
                        }

                        $wPresent = (int) ($row[33] ?? 0);
                        $wAbsent = (int) ($row[34] ?? 0);
                        $wLate = (int) ($row[35] ?? 0);
                        $wOnline = (int) ($row[36] ?? 0);
                        $wOthers = (int) ($row[37] ?? 0);
                        $wOnLeave = (int) ($row[38] ?? 0);
                        $wSubInsert = (int) ($row[39] ?? 0);
                        $wLateMins = (int) ($row[41] ?? 0);

                        $wScheduled = $wPresent + $wAbsent + $wOnline + $wOthers + $wOnLeave;
                        $wRate = $wScheduled > 0 ? round(($wPresent / $wScheduled) * 100, 2) : 100.0;

                        $wKey = $tabName.'_'.$weekLabel;
                        $parsedMonthlySummaries[$wKey] = [
                            'faculty_id' => $facultyId,
                            'instructor_name' => $instructorName,
                            'period_type' => 'weekly',
                            'period_label' => $weekLabel,
                            'present_count' => $wPresent,
                            'absent_count' => $wAbsent,
                            'late_count' => $wLate,
                            'online_count' => $wOnline,
                            'others_count' => $wOthers,
                            'on_leave_count' => $wOnLeave,
                            'sub_insert_count' => $wSubInsert,
                            'total_late_minutes' => $wLateMins,
                            'scheduled_sessions' => $wScheduled,
                            'attendance_rate' => $wRate,
                            'academic_year' => 'AY 2026–2027',
                            'semester' => '1st Semester',
                        ];
                    }
                }

                // 4. Parse History sessions from individual faculty tab (columns 3-9)
                // Col 3: Laboratory, Col 4: Date, Col 5: Time, Col 6: Status, Col 7: Sub in Lab, Col 8: Late, Col 9: Day
                for ($r = 2; $r < count($tabLines); $r++) {
                    $row = str_getcsv($tabLines[$r]);
                    $hRoom = trim($row[3] ?? '');
                    $hDateStr = trim($row[4] ?? '');
                    $hTime = trim($row[5] ?? '');
                    $hStatus = trim($row[6] ?? '');
                    $hSub = trim($row[7] ?? '');
                    $hLate = trim($row[8] ?? '');
                    $hDay = trim($row[9] ?? '');

                    if ($hDateStr !== '' && $hTime !== '' && preg_match('/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/', $hDateStr)) {
                        try {
                            $hDate = Carbon::parse(str_replace('-', '/', $hDateStr))->format('Y-m-d');
                        } catch (\Exception) {
                            continue;
                        }

                        $cleanStatus = ucfirst(strtolower($hStatus ?: 'Present'));
                        $lateM = is_numeric($hLate) ? (int) $hLate : 0;
                        if ($lateM > 0 && $cleanStatus === 'Present') {
                            $cleanStatus = 'Late';
                        }

                        // Determine week label
                        $carbonDate = Carbon::parse($hDate);
                        $weekNumber = $carbonDate->weekOfMonth;
                        $monthName = $carbonDate->format('F');
                        $hWeekLabel = "{$monthName} Week {$weekNumber}";

                        $parsedSessions[] = [
                            'faculty_id' => $facultyId,
                            'instructor_name' => $instructorName,
                            'session_date' => $hDate,
                            'day_of_week' => $hDay ?: $carbonDate->format('l'),
                            'time_slot' => $hTime,
                            'room' => $hRoom,
                            'week_label' => $hWeekLabel,
                            'status' => $cleanStatus,
                            'late_minutes' => $lateM,
                            'substitute_faculty' => $hSub,
                            'academic_year' => 'AY 2026–2027',
                            'semester' => '1st Semester',
                            'source' => "Google Sheets ({$tabName})",
                        ];
                    }
                }
            }

            // Database Upsert Transaction
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

                // Clean existing summaries so outdated/duplicate names (like 'Aguilar' vs 'Aguilar, Razel Ann') are cleanly removed
                FacultyAttendanceSummary::query()->delete();

                // Insert normalized monthly & weekly summaries
                foreach ($parsedMonthlySummaries as $summary) {
                    FacultyAttendanceSummary::create($summary);
                }
            });

            Cache::put('faculty_attendance_last_sync', Carbon::now()->toIso8601String(), 86400);

            return [
                'success' => true,
                'message' => 'Faculty attendance synchronized successfully across all months and tabs.',
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

    /**
     * Discover faculty tab names and GIDs from Google Sheets HTML.
     *
     * @return array<string, string>
     */
    private function discoverFacultyTabs(string $spreadsheetId): array
    {
        try {
            $url = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/edit";
            $response = Http::withoutVerifying()->timeout(15)->get($url);

            if ($response->successful()) {
                $html = $response->body();
                $pos = strpos($html, '"topsnapshot"');
                if ($pos !== false) {
                    $snippet = substr($html, $pos, 45000);
                    preg_match_all('/\\\\\"(\d+)\\\\\",\[\{\\\\\"1\\\\\":\[\[\d+,\d+,\\\\\"([^\\\\\"]+)\\\\\"\]/', $snippet, $matches, PREG_SET_ORDER);

                    $tabs = [];
                    foreach ($matches as $m) {
                        $gid = $m[1];
                        $title = $m[2];

                        // Exclude summary and lab sheets, keep individual faculty sheets
                        if (! in_array(strtolower($title), ['summary', 'lab-chs', 'lab-com1', 'clr_1', 'clr_2', 'clr_3', 'clr_4', 'clr_5'])) {
                            $tabs[$title] = $gid;
                        }
                    }

                    if (! empty($tabs)) {
                        return $tabs;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Could not dynamically discover Google Sheets tabs: '.$e->getMessage());
        }

        return self::FACULTY_TABS;
    }

    /**
     * Fetch multiple CSV tabs reliably with redirection handling.
     *
     * @param  array<string, string>  $tabs
     * @return array<string, string>
     */
    private function fetchTabsInParallel(string $spreadsheetId, array $tabs): array
    {
        $results = [];

        foreach ($tabs as $name => $gid) {
            $url = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/export?format=csv&gid={$gid}";
            $csv = '';

            for ($attempt = 0; $attempt < 3; $attempt++) {
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_TIMEOUT, 20);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200 && strlen($response) > 100) {
                    $csv = $response;
                    break;
                }
                usleep(150000);
            }

            $results[$name] = $csv;
        }

        return $results;
    }

    private function resolveFacultyId(string $name, array $map): ?int
    {
        $clean = strtolower(trim($name));
        if (isset($map[$clean])) {
            return $map[$clean];
        }

        // Try extracting last name if "Lastname, Firstname" format
        if (str_contains($clean, ',')) {
            $parts = explode(',', $clean);
            $lastName = trim($parts[0]);
            if (isset($map[$lastName])) {
                return $map[$lastName];
            }
        }

        foreach ($map as $key => $id) {
            if (str_contains($key, $clean) || str_contains($clean, $key)) {
                return $id;
            }
        }

        return null;
    }
}
