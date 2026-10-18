<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Faculty;
use App\Models\FacultyWorkload;
use App\Models\Program;
use App\Models\RoomSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultyWorkloadManagementController extends Controller
{
    /**
     * Display College-wide Faculty Workload Dashboard & Records.
     */
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::first();
        $academicPeriods = AcademicPeriod::orderBy('start_date', 'desc')->get();

        $query = Faculty::with(['program', 'facultyCredits'])
            ->orderBy('last_name');

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->input('program_id'));
        }
        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->input('employment_type'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $faculties = $query->get();

        // Compute or fetch workloads for each faculty member
        $workloadRecords = $faculties->map(function ($faculty) use ($currentPeriod) {
            $workload = FacultyWorkload::where('faculty_id', $faculty->id)
                ->where('academic_period_id', $currentPeriod ? $currentPeriod->id : null)
                ->first();

            // Find current semester teaching assignments from RoomSchedule
            $assignments = RoomSchedule::where('faculty_id', $faculty->id)
                ->orWhere('instructor', 'like', "%{$faculty->last_name}%")
                ->get();

            $teachingUnits = $assignments->count() * 3.0; // 3 units per standard subject
            $teachingHours = $assignments->sum(function ($s) {
                return 3.0; // standard contact hours per class block
            });

            // Credits
            $designationCredits = (float) ($faculty->facultyCredits->filter(fn ($c) => stripos($c->category, 'Designation') !== false || stripos($c->category, 'Head') !== false)->sum('credited_units') ?: ($faculty->designation ? 3.0 : 0.0));
            $researchCredits = (float) $faculty->facultyCredits->filter(fn ($c) => stripos($c->category, 'Research') !== false)->sum('credited_units');
            $extensionCredits = (float) $faculty->facultyCredits->filter(fn ($c) => stripos($c->category, 'Extension') !== false)->sum('credited_units');
            $administrativeCredits = (float) $faculty->facultyCredits->filter(fn ($c) => stripos($c->category, 'Admin') !== false || stripos($c->category, 'Coordinator') !== false)->sum('credited_units');

            $totalWorkload = $teachingUnits + $designationCredits + $researchCredits + $extensionCredits + $administrativeCredits;

            $status = 'Balanced';
            if ($totalWorkload < 18.0) {
                $status = 'Underload';
            } elseif ($totalWorkload > 21.0) {
                $status = 'Overload';
            }

            return [
                'faculty_id' => $faculty->id,
                'faculty' => [
                    'id' => $faculty->id,
                    'name' => "{$faculty->first_name} {$faculty->last_name}",
                    'last_name' => $faculty->last_name,
                    'first_name' => $faculty->first_name,
                    'academic_rank' => $faculty->academic_rank ?? 'Instructor I',
                    'employment_type' => $faculty->employment_type ?? 'Full-time',
                    'highest_qualification' => $faculty->highest_qualification ?? '',
                    'designation' => $faculty->designation ?? ($designationCredits > 0 ? 'Designation' : null),
                    'program' => $faculty->program ? $faculty->program->code : 'General',
                    'program_name' => $faculty->program ? $faculty->program->name : 'Information Technology Department',
                ],
                'teaching_units' => $teachingUnits,
                'teaching_hours' => $teachingHours,
                'assigned_sections_count' => $assignments->count(),
                'designation_credits' => $designationCredits,
                'research_credits' => $researchCredits,
                'extension_credits' => $extensionCredits,
                'administrative_credits' => $administrativeCredits,
                'total_workload' => $totalWorkload,
                'workload_status' => $status,
                'is_locked' => $workload ? $workload->is_locked : false,
                'document_version' => $workload ? $workload->document_version : 'v1.0',
                'assignments' => $assignments->map(fn ($a) => [
                    'id' => $a->id,
                    'course_code' => $a->course_code,
                    'course_title' => $a->course_title,
                    'section' => $a->section,
                    'room_name' => $a->room_name,
                    'day_of_week' => $a->day_of_week,
                    'start_time' => $a->start_time,
                    'end_time' => $a->end_time,
                ]),
            ];
        });

        $metrics = [
            'total_faculty' => $faculties->count(),
            'balanced_count' => $workloadRecords->where('workload_status', 'Balanced')->count(),
            'underload_count' => $workloadRecords->where('workload_status', 'Underload')->count(),
            'overload_count' => $workloadRecords->where('workload_status', 'Overload')->count(),
            'locked_documents_count' => $workloadRecords->where('is_locked', true)->count(),
        ];

        $programs = Program::all();

        return Inertia::render('operations/faculty-workload/index', [
            'currentPeriod' => $currentPeriod,
            'academicPeriods' => $academicPeriods,
            'workloads' => $workloadRecords,
            'metrics' => $metrics,
            'programs' => $programs,
            'filters' => $request->only(['program_id', 'employment_type', 'search']),
        ]);
    }

    /**
     * Lock/Validate Faculty Workload Form to freeze official document version.
     */
    public function lockWorkload(Request $request, Faculty $faculty)
    {
        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::first();

        $workload = FacultyWorkload::firstOrNew([
            'faculty_id' => $faculty->id,
            'academic_period_id' => $currentPeriod ? $currentPeriod->id : null,
        ]);

        $workload->is_locked = true;
        $workload->locked_at = now();
        $workload->locked_by_user_id = auth()->id();
        $workload->document_version = 'v'.date('Y.m').'-Official';
        $workload->save();

        return redirect()->back()->with('success', "Workload for {$faculty->first_name} {$faculty->last_name} officially validated and locked.");
    }

    /**
     * Unlock Faculty Workload for revision.
     */
    public function unlockWorkload(Request $request, Faculty $faculty)
    {
        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::first();

        FacultyWorkload::where('faculty_id', $faculty->id)
            ->where('academic_period_id', $currentPeriod ? $currentPeriod->id : null)
            ->update([
                'is_locked' => false,
                'admin_remarks' => 'Unlocked by Administrator for schedule revision on '.now()->toFormattedDateString(),
            ]);

        return redirect()->back()->with('success', 'Workload unlocked. Revisions permitted.');
    }
}
