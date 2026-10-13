<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\FacultyAttendanceSummary;
use App\Models\Program;
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
        // Auto-seed if table is empty
        if (FacultyAttendanceSummary::count() === 0 && FacultyAttendance::count() === 0) {
            $this->sheetsService->sync();
        }

        $programs = Program::orderBy('name')->get();
        $faculties = Faculty::with('program')->orderBy('last_name')->get();

        // Filters
        $selectedProgram = $request->query('program');
        $selectedPeriod = $request->query('period', 'August 2026');
        $selectedWeek = $request->query('week', 'August 10-14, 2026');
        $search = $request->query('search', '');

        // Available periods
        $monthlyPeriods = FacultyAttendanceSummary::where('period_type', 'monthly')
            ->pluck('period_label')
            ->unique()
            ->values();

        if ($monthlyPeriods->isEmpty()) {
            $monthlyPeriods = collect(['August 2026', 'September 2026']);
        }

        $weeklyPeriods = FacultyAttendance::pluck('week_label')
            ->unique()
            ->values();

        if ($weeklyPeriods->isEmpty()) {
            $weeklyPeriods = collect(['August 10-14, 2026', 'August 17-21, 2026', 'August 24-28, 2026', 'Aug 31 - Sept 4, 2026']);
        }

        // Monthly Summaries Query
        $summariesQuery = FacultyAttendanceSummary::with(['faculty.program'])
            ->where('period_label', $selectedPeriod);

        if ($selectedProgram && $selectedProgram !== 'all') {
            $summariesQuery->whereHas('faculty', function ($q) use ($selectedProgram) {
                $q->where('program_id', $selectedProgram);
            });
        }

        if ($search) {
            $summariesQuery->where('instructor_name', 'like', "%{$search}%");
        }

        $summaries = $summariesQuery->orderBy('instructor_name')->get();

        // Weekly Session Records Query
        $sessionsQuery = FacultyAttendance::with(['faculty.program'])
            ->where('week_label', $selectedWeek);

        if ($selectedProgram && $selectedProgram !== 'all') {
            $sessionsQuery->whereHas('faculty', function ($q) use ($selectedProgram) {
                $q->where('program_id', $selectedProgram);
            });
        }

        if ($search) {
            $sessionsQuery->where('instructor_name', 'like', "%{$search}%");
        }

        $weeklySessions = $sessionsQuery->orderBy('session_date')
            ->orderBy('time_slot')
            ->get();

        // Calculate KPI Metrics
        $totalTracked = $summaries->count();
        $totalConducted = $summaries->sum('present_count');
        $totalLate = $summaries->sum('late_count');
        $totalAbsent = $summaries->sum('absent_count');
        $totalScheduled = $summaries->sum('scheduled_sessions');
        $overallRate = $totalScheduled > 0 ? round(($totalConducted / $totalScheduled) * 100, 1) : 0;

        $lastSync = Cache::get('faculty_attendance_last_sync');

        return Inertia::render('attendance/index', [
            'programs' => $programs,
            'faculties' => $faculties,
            'summaries' => $summaries,
            'weekly_sessions' => $weeklySessions,
            'monthly_periods' => $monthlyPeriods,
            'weekly_periods' => $weeklyPeriods,
            'kpis' => [
                'faculty_tracked' => $totalTracked,
                'sessions_conducted' => $totalConducted,
                'late_sessions' => $totalLate,
                'absent_sessions' => $totalAbsent,
                'overall_rate' => $overallRate,
            ],
            'filters' => [
                'program' => $selectedProgram ?: 'all',
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
}
