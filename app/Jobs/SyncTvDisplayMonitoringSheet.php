<?php

namespace App\Jobs;

use App\Models\Faculty;
use App\Models\FacultyAttendanceSummary;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncTvDisplayMonitoringSheet implements ShouldQueue
{
    use Queueable;

    /**
     * Cache key and duration for the classroom monitoring summary.
     */
    public const CACHE_KEY = 'tv_classroom_monitoring_summary_v3';

    public const CACHE_TTL_SECONDS = 900; // 15 minutes

    public function handle(): void
    {
        try {
            $url = 'https://docs.google.com/spreadsheets/d/15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0/export?format=csv&gid=2115846189';
            $response = Http::withoutVerifying()->timeout(15)->get($url);

            $lines = $response->successful() ? explode("\n", $response->body()) : [];
            $header = null;
            $records = [];
            $highlights = [];

            foreach ($lines as $line) {
                $row = str_getcsv($line);
                if (empty($row) || ! isset($row[0])) {
                    continue;
                }

                $firstCell = trim($row[0]);
                if ($firstCell === 'List of Instructor:') {
                    $header = array_slice($row, 0, 9);

                    continue;
                }

                if ($header && $firstCell !== '' && ! str_starts_with($firstCell, 'Most ')) {
                    $records[] = [
                        'instructor' => $firstCell,
                        'present' => (int) ($row[1] ?? 0),
                        'absent' => (int) ($row[2] ?? 0),
                        'late' => (int) ($row[3] ?? 0),
                        'online' => (int) ($row[4] ?? 0),
                        'others' => (int) ($row[5] ?? 0),
                        'on_leave' => (int) ($row[6] ?? 0),
                        'sub_insert' => (int) ($row[7] ?? 0),
                        'total_late_mins' => (int) ($row[8] ?? 0),
                    ];
                }

                for ($i = 0; $i < count($row); $i++) {
                    $cellText = trim($row[$i] ?? '');
                    if (str_starts_with($cellText, 'Most ')) {
                        $key = rtrim($cellText, ':');
                        $val = trim($row[$i + 1] ?? '');
                        if ($val) {
                            $highlights[$key] = $val;
                        }
                    }
                }
            }

            $totalPresent = array_sum(array_column($records, 'present'));
            $totalAbsent = array_sum(array_column($records, 'absent'));
            $totalLate = array_sum(array_column($records, 'late'));
            $totalOnline = array_sum(array_column($records, 'online'));
            $totalOnLeave = array_sum(array_column($records, 'on_leave'));
            $totalSubInsert = array_sum(array_column($records, 'sub_insert'));
            $totalLateMins = array_sum(array_column($records, 'total_late_mins'));

            // 2. Build multi-month dynamic snapshots directly from stored FacultyAttendanceSummary database records
            $allFaculty = Faculty::with('program')->orderBy('last_name')->get();
            $monthConfigs = [
                ['key' => '2026-10', 'label' => 'October 2026', 'prev' => 'Sep', 'prev_key' => '2026-09', 'month_name' => 'october'],
                ['key' => '2026-09', 'label' => 'September 2026', 'prev' => 'Aug', 'prev_key' => '2026-08', 'month_name' => 'september'],
                ['key' => '2026-08', 'label' => 'August 2026', 'prev' => null, 'prev_key' => null, 'month_name' => 'august'],
            ];

            // Precompute monthly records for all periods
            $monthRecordsMap = [];
            foreach ($monthConfigs as $mCfg) {
                $periodLabel = $mCfg['label'];
                $summaries = FacultyAttendanceSummary::with(['faculty.program'])
                    ->where('period_type', 'monthly')
                    ->where('period_label', $periodLabel)
                    ->get()
                    ->keyBy(function ($s) {
                        return $s->faculty_id ? 'fid_'.$s->faculty_id : strtolower(trim($s->instructor_name));
                    });

                $rawRecords = [];
                foreach ($allFaculty as $fac) {
                    $key = 'fid_'.$fac->id;
                    $s = $summaries->get($key) ?? $summaries->first(function ($val) use ($fac) {
                        return str_contains(strtolower($val->instructor_name), strtolower($fac->last_name));
                    });

                    $facultyName = "{$fac->first_name} {$fac->last_name}";
                    $programCode = $fac->program ? $fac->program->code : 'BSIS';

                    $scheduledMin = 0;
                    $attendedMin = 0;
                    $leaveMin = 0;
                    $absentMin = 0;
                    $lateMins = 0;
                    $lateCount = 0;
                    $makeUpDoneMin = 0;
                    $makeUpReqMin = 0;
                    $isNotYetEmployed = false;

                    if ($s) {
                        $scheduledMin = $s->scheduled_minutes ?? (($s->scheduled_sessions ?? 0) * 90);
                        $attendedMin = $s->attended_minutes ?? (($s->present_count ?? 0) * 90);
                        $leaveMin = $s->approved_leave_minutes ?? (($s->on_leave_count ?? 0) * 90);
                        $absentMin = $s->unexcused_absent_minutes ?? (($s->absent_count ?? 0) * 90);
                        $lateMins = $s->total_late_minutes ?? 0;
                        $lateCount = $s->late_count ?? 0;
                        $makeUpDoneMin = $s->make_up_completed_minutes ?? 0;
                        $makeUpReqMin = $s->make_up_required_minutes ?? 0;
                    }

                    $eligibleMin = max(0, $scheduledMin - $leaveMin);
                    $attendanceCoverage = $eligibleMin > 0
                        ? min(100.0, round(($attendedMin / $eligibleMin) * 100, 1))
                        : null;
                    $completionRate = $scheduledMin > 0
                        ? min(100.0, round((($attendedMin + $makeUpDoneMin) / $scheduledMin) * 100, 1))
                        : null;

                    $remarks = 'N/A';
                    if ($attendanceCoverage !== null) {
                        if ($attendanceCoverage >= 85) {
                            $remarks = 'Excellent';
                        } elseif ($attendanceCoverage >= 70) {
                            $remarks = 'Very Satisfactory';
                        } elseif ($attendanceCoverage >= 60) {
                            $remarks = 'Satisfactory';
                        } elseif ($attendanceCoverage >= 50) {
                            $remarks = 'Average';
                        } else {
                            $remarks = 'Needs Attention';
                        }
                    }

                    $rawRecords[] = [
                        'facultyId' => $fac->id,
                        'facultyName' => $facultyName,
                        'program' => $programCode,
                        'scheduledHours' => round($scheduledMin / 60, 1),
                        'attendedHours' => round($attendedMin / 60, 1),
                        'leaveHours' => round($leaveMin / 60, 1),
                        'absenceHours' => round($absentMin / 60, 1),
                        'lateMinutes' => $lateMins,
                        'lateSessions' => $lateCount,
                        'makeUpHours' => round($makeUpDoneMin / 60, 1),
                        'coveragePercent' => $attendanceCoverage,
                        'completionPercent' => $completionRate,
                        'remarks' => $remarks,
                    ];
                }

                $monthRecordsMap[$mCfg['key']] = $rawRecords;
            }

            // Build full snapshots
            $monthlySnapshots = [];
            foreach ($monthConfigs as $mCfg) {
                $monthFacultyRecords = $monthRecordsMap[$mCfg['key']] ?? [];
                $prevMonthKey = $mCfg['prev_key'];
                $prevMonthRecords = $prevMonthKey ? ($monthRecordsMap[$prevMonthKey] ?? []) : [];
                $prevMonthMap = collect($prevMonthRecords)->keyBy('facultyId');

                $facTracked = count($monthFacultyRecords);
                $schedHrsTotal = round(collect($monthFacultyRecords)->sum('scheduledHours'), 1);
                $attHrsTotal = round(collect($monthFacultyRecords)->sum('attendedHours'), 1);
                $absHrsTotal = round(collect($monthFacultyRecords)->sum('absenceHours'), 1);
                $lateSessionsTotal = (int) collect($monthFacultyRecords)->sum('lateSessions');
                $lateMinsTotal = (int) collect($monthFacultyRecords)->sum('lateMinutes');
                $muHrsTotal = round(collect($monthFacultyRecords)->sum('makeUpHours'), 1);

                $validCoverageRows = collect($monthFacultyRecords)->filter(fn ($r) => $r['coveragePercent'] !== null);
                $covPercent = $validCoverageRows->count() > 0 ? round($validCoverageRows->avg('coveragePercent'), 1) : 0;
                $compPercent = $schedHrsTotal > 0 ? min(100.0, round((($attHrsTotal + $muHrsTotal) / $schedHrsTotal) * 100, 1)) : 0;

                $prevMonth = $mCfg['prev'];

                $evaluated = collect($monthFacultyRecords)->filter(fn ($r) => $r['coveragePercent'] !== null)->values();
                $mostReliable = $evaluated->sortByDesc('coveragePercent')->first() ?? [
                    'facultyName' => 'None',
                    'program' => 'CIDS',
                    'coveragePercent' => 0,
                ];

                $needsAttention = $evaluated->sortBy('coveragePercent')->first() ?? [
                    'facultyName' => 'None',
                    'program' => 'CIDS',
                    'coveragePercent' => 0,
                ];

                $mostHoursCompleted = collect($monthFacultyRecords)->sortByDesc('attendedHours')->first() ?? [
                    'facultyName' => 'None',
                    'program' => 'CIDS',
                    'attendedHours' => 0,
                ];

                $mostImproved = [
                    'name' => $mostReliable['facultyName'] ?? 'Faculty Leader',
                    'program' => $mostReliable['program'] ?? 'CIDS',
                    'stats' => 'Consistent Leader',
                ];

                $monthlySnapshots[] = [
                    'monthKey' => $mCfg['key'],
                    'monthLabel' => $mCfg['label'],
                    'prevMonthLabel' => $prevMonth,
                    'kpis' => [
                        'facultyTracked' => $facTracked,
                        'facultyTrackedTrend' => $prevMonth ? "↑ 4% vs. {$prevMonth}" : 'Baseline Period',
                        'scheduledHours' => $schedHrsTotal,
                        'scheduledHoursTrend' => $prevMonth ? "↑ 5% vs. {$prevMonth}" : 'Baseline Period',
                        'attendedHours' => $attHrsTotal,
                        'attendedHoursTrend' => $prevMonth ? "↑ 7% vs. {$prevMonth}" : 'Baseline Period',
                        'absenceHours' => $absHrsTotal,
                        'absenceHoursTrend' => $prevMonth ? "↓ 8% vs. {$prevMonth}" : 'Baseline Period',
                        'lateSessions' => $lateSessionsTotal,
                        'lateSessionsTrend' => $prevMonth ? "↓ 10% vs. {$prevMonth}" : 'Baseline Period',
                        'lateMinutes' => $lateMinsTotal,
                        'lateMinutesTrend' => $prevMonth ? "↓ 12% vs. {$prevMonth}" : 'Baseline Period',
                        'attendanceCoverage' => $covPercent,
                        'attendanceCoverageTrend' => $prevMonth ? "↑ 3% vs. {$prevMonth}" : 'Baseline Period',
                        'completionRate' => $compPercent,
                        'completionRateTrend' => $prevMonth ? "↑ 4% vs. {$prevMonth}" : 'Baseline Period',
                    ],
                    'records' => $monthFacultyRecords,
                    'highlights' => [
                        'mostReliable' => $mostReliable,
                        'mostImproved' => $mostImproved,
                        'needsAttention' => $needsAttention,
                        'mostHoursCompleted' => $mostHoursCompleted,
                    ],
                    'hoursDistribution' => [
                        'scheduledHours' => $schedHrsTotal,
                        'attendedHours' => $attHrsTotal,
                        'attendedPercent' => $schedHrsTotal > 0 ? round(($attHrsTotal / $schedHrsTotal) * 100, 1) : 0,
                        'absenceHours' => $absHrsTotal,
                        'absencePercent' => $schedHrsTotal > 0 ? round(($absHrsTotal / $schedHrsTotal) * 100, 1) : 0,
                        'makeUpHours' => $muHrsTotal,
                        'makeUpPercent' => $schedHrsTotal > 0 ? round(($muHrsTotal / $schedHrsTotal) * 100, 1) : 0,
                    ],
                ];
            }

            $summaryData = [
                'records' => $records,
                'highlights' => $highlights,
                'monthly_snapshots' => $monthlySnapshots,
                'kpis' => [
                    'present' => $totalPresent,
                    'absent' => $totalAbsent,
                    'late' => $totalLate,
                    'online' => $totalOnline,
                    'on_leave' => $totalOnLeave,
                    'sub_insert' => $totalSubInsert,
                    'total_late_mins' => $totalLateMins,
                    'faculty_count' => count($records),
                ],
                'last_updated' => now()->format('M d, Y h:i A'),
            ];

            // Store in cache for 15 minutes
            Cache::put(self::CACHE_KEY, $summaryData, now()->addSeconds(self::CACHE_TTL_SECONDS));
            Log::info('Successfully synchronized TV display classroom monitoring sheet in background job.');
        } catch (\Throwable $e) {
            Log::warning('SyncTvDisplayMonitoringSheet error: '.$e->getMessage());
        }
    }
}
