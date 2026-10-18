<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\ExamSchedule;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\RoomSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamMonitoringController extends Controller
{
    /**
     * Display the Exam Monitoring Hub.
     */
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::first();
        $academicPeriods = AcademicPeriod::orderBy('start_date', 'desc')->get();
        $user = auth()->user();

        // Auto-flag passed scheduled exams as Awaiting Confirmation
        ExamSchedule::where('status', 'Scheduled')
            ->whereDate('exam_date', '<', now()->toDateString())
            ->update(['status' => 'Awaiting Confirmation']);

        // Base query with relationships
        $query = ExamSchedule::with(['faculty', 'program', 'academicPeriod'])
            ->orderBy('exam_date')
            ->orderBy('start_time');

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('program_id')) {
            $query->where('program_id', $request->input('program_id'));
        }
        if ($request->filled('exam_type')) {
            $query->where('exam_type', $request->input('exam_type'));
        }
        if ($request->filled('faculty_id')) {
            $query->where('faculty_id', $request->input('faculty_id'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('course_code', 'like', "%{$search}%")
                    ->orWhere('course_title', 'like', "%{$search}%")
                    ->orWhere('section', 'like', "%{$search}%")
                    ->orWhere('room_name', 'like', "%{$search}%");
            });
        }

        $allExams = $query->get();

        // Operational metrics
        $metrics = [
            'total_exams' => ExamSchedule::count(),
            'scheduled_today' => ExamSchedule::whereDate('exam_date', now()->toDateString())->count(),
            'awaiting_confirmation' => ExamSchedule::where('status', 'Awaiting Confirmation')->count(),
            'conducted' => ExamSchedule::where('status', 'Conducted')->count(),
            'rescheduled' => ExamSchedule::where('status', 'Rescheduled')->count(),
            'not_conducted' => ExamSchedule::where('status', 'Not Conducted')->count(),
        ];

        $conductedPercentage = $metrics['total_exams'] > 0
            ? round(($metrics['conducted'] / $metrics['total_exams']) * 100, 1)
            : 0;
        $metrics['conducted_percentage'] = $conductedPercentage;

        // Context data for creating new exam schedule
        $faculties = Faculty::orderBy('last_name')->get();
        $programs = Program::all();
        $existingOfferings = RoomSchedule::select('id', 'course_code', 'course_title', 'section', 'room_name', 'faculty_id', 'instructor')
            ->distinct()
            ->get();
        $rooms = RoomSchedule::select('room_name')->distinct()->whereNotNull('room_name')->pluck('room_name');

        return Inertia::render('operations/exam-monitoring/index', [
            'currentPeriod' => $currentPeriod,
            'academicPeriods' => $academicPeriods,
            'exams' => $allExams,
            'metrics' => $metrics,
            'faculties' => $faculties,
            'programs' => $programs,
            'existingOfferings' => $existingOfferings,
            'rooms' => $rooms,
            'filters' => $request->only(['status', 'program_id', 'exam_type', 'faculty_id', 'search']),
        ]);
    }

    /**
     * Store a newly created Exam Schedule.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_period_id' => 'nullable|exists:academic_periods,id',
            'program_id' => 'nullable|exists:programs,id',
            'faculty_id' => 'required|exists:faculties,id',
            'room_schedule_id' => 'nullable|exists:room_schedules,id',
            'course_code' => 'required|string',
            'course_title' => 'required|string',
            'section' => 'required|string',
            'year_level' => 'nullable|string',
            'exam_type' => 'required|string',
            'custom_exam_title' => 'nullable|string',
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'room_name' => 'required|string',
            'modality' => 'nullable|string',
            'proctor_name' => 'nullable|string',
            'is_confirmed' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::first();

        // Obvious overlap check for room or faculty
        $roomConflict = ExamSchedule::where('room_name', $validated['room_name'])
            ->whereDate('exam_date', $validated['exam_date'])
            ->where('status', '!=', 'Cancelled')
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']]);
            })
            ->first();

        if ($roomConflict) {
            return redirect()->back()->withErrors([
                'room_name' => "Room {$validated['room_name']} is already scheduled for {$roomConflict->course_code} ({$roomConflict->start_time} - {$roomConflict->end_time}) on this date.",
            ]);
        }

        ExamSchedule::create([
            'academic_period_id' => $validated['academic_period_id'] ?? ($currentPeriod ? $currentPeriod->id : null),
            'program_id' => $validated['program_id'] ?? null,
            'faculty_id' => $validated['faculty_id'],
            'room_schedule_id' => $validated['room_schedule_id'] ?? null,
            'course_code' => $validated['course_code'],
            'course_title' => $validated['course_title'],
            'section' => $validated['section'],
            'year_level' => $validated['year_level'] ?? null,
            'exam_type' => $validated['exam_type'],
            'custom_exam_title' => $validated['custom_exam_title'] ?? null,
            'exam_date' => $validated['exam_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'room_name' => $validated['room_name'],
            'modality' => $validated['modality'] ?? 'Face-to-Face',
            'proctor_name' => $validated['proctor_name'] ?? null,
            'is_confirmed' => $validated['is_confirmed'] ?? true,
            'notes' => $validated['notes'] ?? null,
            'status' => 'Scheduled',
        ]);

        return redirect()->back()->with('success', 'Examination schedule created successfully.');
    }

    /**
     * Mark an examination as Conducted.
     */
    public function markConducted(Request $request, ExamSchedule $examSchedule)
    {
        $validated = $request->validate([
            'actual_start_time' => 'nullable|string',
            'actual_end_time' => 'nullable|string',
            'attendance_count' => 'nullable|integer',
            'remarks' => 'nullable|string',
            'irregularities_reported' => 'nullable|string',
            'evidence_attachment' => 'nullable|file|mimes:jpeg,png,pdf|max:10240',
        ]);

        $evidencePath = $examSchedule->evidence_attachment_path;
        if ($request->hasFile('evidence_attachment')) {
            $evidencePath = $request->file('evidence_attachment')->store('exam_evidence', 'public');
        }

        $examSchedule->update([
            'status' => 'Conducted',
            'conducted_at' => now(),
            'confirmed_by_user_id' => auth()->id(),
            'actual_start_time' => $validated['actual_start_time'] ?? $examSchedule->start_time,
            'actual_end_time' => $validated['actual_end_time'] ?? $examSchedule->end_time,
            'attendance_count' => $validated['attendance_count'] ?? null,
            'remarks' => $validated['remarks'] ?? 'Examination conducted smoothly as scheduled.',
            'irregularities_reported' => $validated['irregularities_reported'] ?? null,
            'evidence_attachment_path' => $evidencePath,
        ]);

        return redirect()->back()->with('success', "Exam for {$examSchedule->course_code} marked as Conducted.");
    }

    /**
     * Mark an examination as Not Conducted.
     */
    public function markNotConducted(Request $request, ExamSchedule $examSchedule)
    {
        $validated = $request->validate([
            'non_conducted_reason' => 'required|string',
            'non_conducted_remarks' => 'nullable|string',
            'rescheduled_target_date' => 'nullable|date',
        ]);

        $examSchedule->update([
            'status' => 'Not Conducted',
            'confirmed_by_user_id' => auth()->id(),
            'non_conducted_reason' => $validated['non_conducted_reason'],
            'non_conducted_remarks' => $validated['non_conducted_remarks'] ?? null,
            'rescheduled_target_date' => $validated['rescheduled_target_date'] ?? null,
        ]);

        return redirect()->back()->with('success', "Exam for {$examSchedule->course_code} marked as Not Conducted ({$validated['non_conducted_reason']}).");
    }

    /**
     * Reschedule an examination.
     */
    public function reschedule(Request $request, ExamSchedule $examSchedule)
    {
        $validated = $request->validate([
            'exam_date' => 'required|date',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'room_name' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $examSchedule->update([
            'exam_date' => $validated['exam_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'room_name' => $validated['room_name'],
            'status' => 'Rescheduled',
            'notes' => ($examSchedule->notes ? $examSchedule->notes."\n" : '').'Rescheduled on '.now()->toFormattedDateString().': '.($validated['notes'] ?? 'Updated timetable.'),
        ]);

        return redirect()->back()->with('success', "Exam for {$examSchedule->course_code} successfully rescheduled to {$validated['exam_date']}.");
    }

    /**
     * TV Spotlight / Display Widget Data Endpoint.
     */
    public function tvWidgetData()
    {
        $today = now()->toDateString();

        $todayExams = ExamSchedule::whereDate('exam_date', $today)
            ->whereIn('status', ['Scheduled', 'Conducted', 'Awaiting Confirmation'])
            ->orderBy('start_time')
            ->get(['id', 'course_code', 'course_title', 'section', 'room_name', 'start_time', 'end_time', 'exam_type', 'modality', 'status']);

        $upcomingExams = ExamSchedule::whereDate('exam_date', '>', $today)
            ->where('status', 'Scheduled')
            ->orderBy('exam_date')
            ->orderBy('start_time')
            ->take(8)
            ->get(['id', 'course_code', 'course_title', 'section', 'room_name', 'exam_date', 'start_time', 'exam_type']);

        $roomsInUse = ExamSchedule::whereDate('exam_date', $today)
            ->where('status', 'Scheduled')
            ->distinct()
            ->pluck('room_name');

        return response()->json([
            'today_exams' => $todayExams,
            'upcoming_exams' => $upcomingExams,
            'rooms_in_use' => $roomsInUse,
            'conducted_today_count' => ExamSchedule::whereDate('exam_date', $today)->where('status', 'Conducted')->count(),
            'total_today_count' => $todayExams->count(),
        ]);
    }
}
