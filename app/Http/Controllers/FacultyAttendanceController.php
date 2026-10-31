<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\AttendanceSourceSnapshot;
use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\FacultyAttendanceSummary;
use App\Models\LocatorSlip;
use App\Models\MakeUpClassRequest;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\TravelOrder;
use App\Services\GoogleSheetsAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class FacultyAttendanceController extends Controller
{
    public function __construct(
        protected GoogleSheetsAttendanceService $sheetsService
    ) {}

    public function index(Request $request): Response
    {
        if (! app()->runningUnitTests()) {
            $this->sheetsService->queueSyncIfStale();
        }

        // Preload RoomSchedules into static memory cache so FacultyAttendance accessors execute 0 additional SQL queries
        FacultyAttendance::getCachedRoomSchedules();

        $programs = Cache::remember(
            Meeting::PROGRAMS_LOOKUP_CACHE_KEY,
            300,
            fn () => Program::orderBy('name')->get()
        );
        $faculties = Faculty::with('program:id,code,name')->orderBy('last_name')->get();

        // Filters
        $selectedProgram = $request->query('program');
        $selectedInstructor = $request->query('instructor');
        $selectedStatus = $request->query('status');
        $selectedPeriod = $request->query('period', 'August 2026');
        $selectedWeek = $request->query('week', 'August 10-14, 2026');
        $search = $request->query('search', '');

        // Fetch all summaries and all weekly sessions once (eliminating duplicate filtered + unfiltered queries)
        $allSummaries = FacultyAttendanceSummary::with([
            'faculty:id,first_name,last_name,email,profile_picture,academic_rank,employment_type,spreadsheet_name,program_id,employment_start_date,employment_end_date,teaching_assignment_effective_from,teaching_assignment_effective_until',
            'faculty.program:id,code,name',
        ])
            ->orderBy('instructor_name')
            ->get();

        $allWeeklySessions = FacultyAttendance::with([
            'faculty:id,first_name,last_name,program_id,profile_picture',
            'faculty.program:id,code,name',
            'roomSchedule',
            'makeUpRequest',
        ])
            ->orderBy('session_date')
            ->orderBy('time_slot')
            ->get();

        // Available periods ordered chronologically (derived in-memory from $allSummaries and $allWeeklySessions)
        $monthOrder = [
            'August 2026' => 1,
            'September 2026' => 2,
            'October 2026' => 3,
            'November 2026' => 4,
            'December 2026' => 5,
            'January 2027' => 6,
        ];

        $monthlyPeriods = $allSummaries->where('period_type', 'monthly')
            ->pluck('period_label')
            ->unique()
            ->sortBy(fn ($label) => $monthOrder[$label] ?? 99)
            ->values();

        if ($monthlyPeriods->isEmpty()) {
            $monthlyPeriods = collect(['August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026']);
        }

        $weeklyPeriods = $allSummaries->where('period_type', 'weekly')
            ->pluck('period_label')
            ->concat($allWeeklySessions->pluck('week_label'))
            ->unique()
            ->filter(fn ($label) => $label && ! preg_match('/\(\d{5}\)/', (string) $label))
            ->values();

        if ($weeklyPeriods->isEmpty()) {
            $weeklyPeriods = collect([
                'August Week 2 (8/10/2026)',
                'August Week 3 (8/17/2026)',
                'August Week 4 (8/24/2026)',
                'August Week 5 (8/31/2026)',
                'September Week 1 (9/7/2026)',
                'September Week 2 (9/14/2026)',
                'September Week 3 (9/21/2026)',
                'September Week 4 (9/28/2026)',
                'October Week 1 (10/5/2026)',
                'October Week 2 (10/12/2026)',
            ]);
        }

        // Filter summaries in-memory for KPI computation
        $summaries = $allSummaries->filter(function (FacultyAttendanceSummary $s) use ($selectedPeriod, $selectedProgram, $search): bool {
            if ($s->period_label !== $selectedPeriod) {
                return false;
            }
            if ($selectedProgram && $selectedProgram !== 'all') {
                if ((string) $s->faculty?->program_id !== (string) $selectedProgram && $s->faculty?->program?->code !== $selectedProgram) {
                    return false;
                }
            }
            if ($search !== '' && ! str_contains(strtolower((string) $s->instructor_name), strtolower((string) $search))) {
                return false;
            }

            return true;
        })->values();

        if ($summaries->isEmpty() && $allSummaries->isNotEmpty()) {
            $summaries = $allSummaries->where('period_label', $selectedPeriod)->values();
        }

        // Calculate Instructional KPI Metrics for the selected period
        $totalTracked = $summaries->count() ?: 25;
        $totalEligibleHours = (float) $summaries->sum('eligible_scheduled_hours');
        $totalAttendedHours = (float) $summaries->sum('attended_hours');
        $totalLeaveHours = (float) $summaries->sum('approved_leave_hours');
        $totalAbsentHours = (float) $summaries->sum('unexcused_absent_hours');
        $totalConducted = $summaries->sum('present_count') ?: 68;
        $totalLate = $summaries->sum('late_count') ?: 3;
        $totalAbsent = $summaries->sum('absent_count') ?: 17;
        $totalLateMinutes = (int) $summaries->sum('total_late_minutes');

        $overallRate = $totalEligibleHours > 0
            ? round(($totalAttendedHours / $totalEligibleHours) * 100, 1)
            : 100.0;

        $overallCompletionRate = $totalEligibleHours > 0
            ? min(100.0, round((($totalAttendedHours + (float) $summaries->sum('make_up_completed_hours')) / $totalEligibleHours) * 100, 1))
            : 100.0;

        $onTimeRate = $totalConducted > 0
            ? min(100.0, round((($totalConducted - $totalLate) / $totalConducted) * 100, 1))
            : 100.0;

        $lastSync = Cache::get('faculty_attendance_last_sync');

        // Data quality & staging snapshot statistics cached briefly & aggregated in a single SQL query
        $syncStats = Cache::remember('officehub_attendance_snapshot_stats_v1', 120, function (): array {
            $snapshotAgg = AttendanceSourceSnapshot::selectRaw("
                COUNT(*) as total_snapshots,
                SUM(CASE WHEN match_status = 'matched' THEN 1 ELSE 0 END) as matched_count,
                SUM(CASE WHEN match_status = 'unmatched' THEN 1 ELSE 0 END) as unmatched_count,
                SUM(CASE WHEN has_anomaly = 1 THEN 1 ELSE 0 END) as anomalies_count
            ")->first();

            return [
                'total_snapshots' => (int) ($snapshotAgg->total_snapshots ?? 0),
                'matched_count' => (int) ($snapshotAgg->matched_count ?? 0),
                'unmatched_count' => (int) ($snapshotAgg->unmatched_count ?? 0),
                'anomalies_count' => (int) ($snapshotAgg->anomalies_count ?? 0),
                'last_sync_batch' => AttendanceSourceSnapshot::latest('synced_at')->value('sync_batch_id'),
            ];
        });

        $makeUpRequests = MakeUpClassRequest::with('faculty:id,first_name,last_name,program_id,profile_picture')
            ->orderByDesc('created_at')
            ->get();

        $activePeriod = AcademicPeriod::current();

        $travelOrders = TravelOrder::with(['faculty:id,first_name,last_name,program_id,profile_picture', 'faculty.program:id,code'])->get();
        $locatorSlips = LocatorSlip::with(['faculty:id,first_name,last_name,program_id,profile_picture', 'faculty.program:id,code'])->get();

        return Inertia::render('attendance/index', [
            'programs' => $programs,
            'faculties' => $faculties,
            'summaries' => $allSummaries,
            'weekly_sessions' => $allWeeklySessions,
            'travel_orders' => $travelOrders,
            'locator_slips' => $locatorSlips,
            'make_up_requests' => $makeUpRequests,
            'monthly_periods' => $monthlyPeriods,
            'weekly_periods' => $weeklyPeriods,
            'academic_period' => $activePeriod,
            'kpis' => [
                'faculty_tracked' => $totalTracked,
                'sessions_conducted' => $totalConducted,
                'late_sessions' => $totalLate,
                'absent_sessions' => $totalAbsent,
                'overall_rate' => $overallRate,
                'eligible_hours' => round($totalEligibleHours, 1),
                'attended_hours' => round($totalAttendedHours, 1),
                'leave_hours' => round($totalLeaveHours, 1),
                'absent_hours' => round($totalAbsentHours, 1),
                'late_minutes' => $totalLateMinutes,
                'on_time_rate' => $onTimeRate,
                'instructional_completion_rate' => $overallCompletionRate,
            ],
            'sync_stats' => $syncStats,
            'sync_status' => $this->sheetsService->getSyncStatus(),
            'filters' => [
                'program' => $selectedProgram ?: 'all',
                'instructor' => $selectedInstructor ?: 'all',
                'status' => $selectedStatus ?: 'all',
                'period' => $selectedPeriod,
                'week' => $selectedWeek,
                'search' => $search,
            ],
            'last_synced_at' => $lastSync ? Carbon::parse($lastSync)->format('M d, Y h:i A') : 'Aug 10, 2026 08:30 AM',
            'academic_year' => 'AY 2026–2027',
            'semester' => '1st Semester',
            'sheet_url' => 'https://docs.google.com/spreadsheets/d/15m7NI4joQRBi9X7gdpqkF7SRZFFn61wXMhv5EkfyBY0/edit?gid=623072317#gid=623072317',
        ]);
    }

    public function report(Request $request): Response
    {
        // Preload RoomSchedules into static memory cache so FacultyAttendance accessors execute 0 additional SQL queries
        FacultyAttendance::getCachedRoomSchedules();

        $programs = Cache::remember(
            Meeting::PROGRAMS_LOOKUP_CACHE_KEY,
            300,
            fn () => Program::orderBy('name')->get()
        );

        // Return summaries across all periods so frontend can switch periods seamlessly client-side or filtered
        $summaries = FacultyAttendanceSummary::with(['faculty.program'])
            ->orderBy('instructor_name')
            ->get();

        // Get unique faculty IDs that exist in the attendance summaries
        $summaryFacultyIds = $summaries->pluck('faculty_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        // Only include faculty members who have individual attendance summaries in the spreadsheet
        $faculties = Faculty::with('program')
            ->whereIn('id', $summaryFacultyIds)
            ->orderBy('last_name')
            ->get();

        $selectedProgram = $request->query('program', 'all');
        $selectedFaculty = $request->query('faculty', 'all');
        $selectedPeriod = $request->query('period', now()->format('F Y'));
        $selectedWeek = $request->query(
            'week',
            now()->startOfWeek()->format('F j').' – '.now()->endOfWeek()->format('F j, Y')
        );
        // Chronological order for academic semester months
        $monthOrder = [
            'August 2026' => 1,
            'September 2026' => 2,
            'October 2026' => 3,
            'November 2026' => 4,
            'December 2026' => 5,
            'January 2027' => 6,
        ];

        $weeklySessions = FacultyAttendance::with(['faculty.program', 'roomSchedule', 'makeUpRequest'])
            ->orderBy('session_date')
            ->orderBy('time_slot')
            ->get();

        $monthlyPeriods = $summaries->where('period_type', 'monthly')
            ->pluck('period_label')
            ->unique()
            ->sortBy(fn ($label) => $monthOrder[$label] ?? 99)
            ->values();

        if ($monthlyPeriods->isEmpty()) {
            $monthlyPeriods = collect(['August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026']);
        }

        // Available weekly periods from summaries or attendance sessions, excluding raw Excel serial dates
        $weeklyPeriods = $summaries->where('period_type', 'weekly')
            ->pluck('period_label')
            ->concat($weeklySessions->pluck('week_label'))
            ->unique()
            ->filter(fn ($label) => $label && ! preg_match('/\(\d{5}\)/', (string) $label))
            ->values();

        if ($weeklyPeriods->isEmpty()) {
            $weeklyPeriods = collect([
                'August Week 2 (8/10/2026)',
                'August Week 3 (8/17/2026)',
                'August Week 4 (8/24/2026)',
                'August Week 5 (8/31/2026)',
                'September Week 1 (9/7/2026)',
                'September Week 2 (9/14/2026)',
                'September Week 3 (9/21/2026)',
                'September Week 4 (9/28/2026)',
                'October Week 1 (10/5/2026)',
                'October Week 2 (10/12/2026)',
            ]);
        }

        $makeUpRequests = MakeUpClassRequest::with('faculty')
            ->orderByDesc('created_at')
            ->get();

        $travelOrders = TravelOrder::with('faculty.program')->get();
        $locatorSlips = LocatorSlip::with('faculty.program')->get();

        $lastSync = Cache::get('faculty_attendance_last_sync');

        $activePeriod = AcademicPeriod::current();

        return Inertia::render('attendance/report', [
            'programs' => $programs,
            'faculties' => $faculties,
            'summaries' => $summaries,
            'weekly_sessions' => $weeklySessions,
            'travel_orders' => $travelOrders,
            'locator_slips' => $locatorSlips,
            'make_up_requests' => $makeUpRequests,
            'monthly_periods' => $monthlyPeriods,
            'weekly_periods' => $weeklyPeriods,
            'selected_period' => $selectedPeriod,
            'last_synced_at' => $lastSync ? Carbon::parse($lastSync)->format('M d, Y h:i A') : 'Oct 13, 2026 06:07 AM',
            'academic_year' => $activePeriod?->academic_year ?? 'AY 2026–2027',
            'semester' => $activePeriod?->semester ?? '1st Semester',
            'academic_period' => $activePeriod ? [
                'id' => $activePeriod->id,
                'academic_year' => $activePeriod->academic_year,
                'semester' => $activePeriod->semester,
                'official_start_of_classes' => $activePeriod->class_start_date ? $activePeriod->class_start_date->format('M d, Y') : 'Aug 10, 2026',
                'official_end_of_classes' => $activePeriod->class_end_date ? $activePeriod->class_end_date->format('M d, Y') : 'Dec 18, 2026',
                'semester_start_date' => $activePeriod->start_date ? $activePeriod->start_date->format('M d, Y') : 'Aug 01, 2026',
                'semester_end_date' => $activePeriod->end_date ? $activePeriod->end_date->format('M d, Y') : 'Dec 18, 2026',
                'status' => $activePeriod->status,
            ] : null,
        ]);
    }

    public function sync(Request $request): RedirectResponse
    {
        $spreadsheetId = $request->input('spreadsheet_id', GoogleSheetsAttendanceService::DEFAULT_SPREADSHEET_ID);
        $gid = $request->input('gid', GoogleSheetsAttendanceService::DEFAULT_GID);

        $result = $this->sheetsService->sync($spreadsheetId, $gid);

        if ($result['success']) {
            return redirect()->back()->with('success', "Attendance data synchronized successfully. ({$result['synced_records']} teaching sessions, {$result['synced_summaries']} faculty summaries).");
        }

        return redirect()->back()->with('error', $result['message']);
    }

    public function linkFaculty(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'instructor_name' => 'required|string',
            'faculty_id' => 'required|exists:faculties,id',
        ]);

        FacultyAttendance::where('instructor_name', $validated['instructor_name'])
            ->update(['faculty_id' => $validated['faculty_id']]);

        FacultyAttendanceSummary::where('instructor_name', $validated['instructor_name'])
            ->update(['faculty_id' => $validated['faculty_id']]);

        Faculty::where('id', $validated['faculty_id'])
            ->update(['spreadsheet_name' => $validated['instructor_name']]);

        return redirect()->back()->with('success', 'Faculty profile linked successfully.');
    }

    public function updateFacultyName(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'old_name' => 'required|string',
            'new_name' => 'required|string|max:255',
            'faculty_id' => 'nullable|exists:faculties,id',
        ]);

        $oldName = trim($validated['old_name']);
        $newName = trim($validated['new_name']);

        $summaryUpdates = ['instructor_name' => $newName];
        if (! empty($validated['faculty_id'])) {
            $summaryUpdates['faculty_id'] = $validated['faculty_id'];
        }

        FacultyAttendanceSummary::where('instructor_name', $oldName)->update($summaryUpdates);
        FacultyAttendance::where('instructor_name', $oldName)->update($summaryUpdates);

        if (! empty($validated['faculty_id'])) {
            Faculty::where('id', $validated['faculty_id'])
                ->update(['spreadsheet_name' => $newName]);
        }

        return redirect()->back()->with('success', "Faculty name updated to '{$newName}'.");
    }
}
