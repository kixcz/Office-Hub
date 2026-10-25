<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\CurriculumCourse;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseOfferingController extends Controller
{
    public function index(Request $request)
    {
        $activePeriod = AcademicPeriod::current()
            ?? AcademicPeriod::orderBy('id', 'desc')->first();

        $selectedPeriodId = $request->input('academic_period_id', $activePeriod?->id);

        $query = CourseOffering::with([
            'academicPeriod',
            'course',
            'program',
            'curriculum',
            'section',
            'faculty',
        ]);

        if ($selectedPeriodId && $selectedPeriodId !== 'all') {
            $query->where('academic_period_id', $selectedPeriodId);
        }

        if ($request->filled('program_id') && $request->input('program_id') !== 'all') {
            $query->where('program_id', $request->input('program_id'));
        }

        if ($request->filled('year_level') && $request->input('year_level') !== 'all') {
            $query->where('year_level', $request->input('year_level'));
        }

        if ($request->filled('section_id') && $request->input('section_id') !== 'all') {
            $query->where('section_id', $request->input('section_id'));
        }

        if ($request->filled('loading_status') && $request->input('loading_status') !== 'all') {
            $query->where('loading_status', $request->input('loading_status'));
        }

        if ($request->filled('publication_status') && $request->input('publication_status') !== 'all') {
            $query->where('publication_status', $request->input('publication_status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('course_code', 'like', "%{$search}%")
                    ->orWhere('course_title', 'like', "%{$search}%")
                    ->orWhere('section_name', 'like', "%{$search}%")
                    ->orWhere('offering_code', 'like', "%{$search}%");
            });
        }

        $offerings = $query->orderBy('program_id')
            ->orderBy('year_level')
            ->orderBy('section_name')
            ->orderBy('course_code')
            ->get();

        // Dropdown selection data
        $academicPeriods = AcademicPeriod::orderBy('id', 'desc')->get();
        $programs = Program::with('curricula')->orderBy('code')->get();
        $sections = Section::orderBy('code')->get();
        $courses = Course::where('status', 'Active')->orderBy('code')->get();
        $facultyMembers = Faculty::where('status', 'Active')
            ->orderBy('first_name', 'asc')
            ->orderBy('last_name', 'asc')
            ->get();

        // Stats calculation
        $periodOfferings = CourseOffering::where('academic_period_id', $selectedPeriodId);
        $totalCount = (clone $periodOfferings)->count();
        $assignedCount = (clone $periodOfferings)->whereNotNull('faculty_id')->count();
        $scheduledCount = (clone $periodOfferings)->where('timetable_status', 'Scheduled')->count();
        $publishedCount = (clone $periodOfferings)->where('publication_status', 'Published')->count();

        return Inertia::render('course-offerings/index', [
            'offerings' => $offerings,
            'academicPeriods' => $academicPeriods,
            'currentPeriod' => $activePeriod,
            'programs' => $programs,
            'sections' => $sections,
            'courses' => $courses,
            'facultyMembers' => $facultyMembers,
            'stats' => [
                'total_offerings' => $totalCount,
                'faculty_assigned' => $assignedCount,
                'scheduled' => $scheduledCount,
                'published' => $publishedCount,
            ],
            'filters' => [
                'academic_period_id' => (string) $selectedPeriodId,
                'program_id' => $request->input('program_id', 'all'),
                'year_level' => $request->input('year_level', 'all'),
                'section_id' => $request->input('section_id', 'all'),
                'loading_status' => $request->input('loading_status', 'all'),
                'publication_status' => $request->input('publication_status', 'all'),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_period_id' => 'required|exists:academic_periods,id',
            'course_id' => 'required|exists:courses,id',
            'program_id' => 'required|exists:programs,id',
            'section_id' => 'required|exists:sections,id',
            'curriculum_id' => 'nullable|exists:curricula,id',
            'faculty_id' => 'nullable|exists:faculties,id',
            'expected_enrollment' => 'required|integer|min:1|max:100',
            'offering_type' => 'required|string|in:Regular,Elective,Retake,Merged,Special',
            'publication_status' => 'required|string|in:Draft,Ready,Published,Completed',
            'special_notes' => 'nullable|string',
        ]);

        $course = Course::findOrFail($validated['course_id']);
        $section = Section::findOrFail($validated['section_id']);
        $period = AcademicPeriod::findOrFail($validated['academic_period_id']);

        $offeringCode = $course->code.'-'.$section->name.'-'.$period->id;

        CourseOffering::create([
            'academic_period_id' => $validated['academic_period_id'],
            'course_id' => $course->id,
            'program_id' => $validated['program_id'],
            'curriculum_id' => $validated['curriculum_id'] ?? $course->curriculum_id,
            'section_id' => $section->id,
            'faculty_id' => $validated['faculty_id'] ?? null,
            'offering_code' => $offeringCode,
            'course_code' => $course->code,
            'course_title' => $course->title,
            'section_name' => $section->name,
            'year_level' => $section->year_level ?? $course->year_level ?? 1,
            'expected_enrollment' => $validated['expected_enrollment'],
            'offering_type' => $validated['offering_type'],
            'units' => $course->units,
            'lecture_hours' => $course->lecture_hours,
            'lab_hours' => $course->lab_hours,
            'room_type_required' => $course->required_facility_type ?? 'Lecture Room',
            'loading_status' => ! empty($validated['faculty_id']) ? 'Assigned' : 'Unassigned',
            'timetable_status' => 'Pending',
            'publication_status' => $validated['publication_status'],
            'special_notes' => $validated['special_notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Course offering created for section.');
    }

    public function update(Request $request, CourseOffering $courseOffering)
    {
        $validated = $request->validate([
            'faculty_id' => 'nullable|exists:faculties,id',
            'expected_enrollment' => 'required|integer|min:1|max:100',
            'offering_type' => 'required|string|in:Regular,Elective,Retake,Merged,Special',
            'loading_status' => 'required|string|in:Unassigned,Assigned,Overloaded',
            'timetable_status' => 'required|string|in:Pending,Drafted,Scheduled,Conflict',
            'publication_status' => 'required|string|in:Draft,Ready,Published,Completed',
            'special_notes' => 'nullable|string',
        ]);

        $courseOffering->update($validated);

        return redirect()->back()->with('success', 'Course offering updated successfully.');
    }

    public function destroy(CourseOffering $courseOffering)
    {
        $courseOffering->delete();

        return redirect()->back()->with('success', 'Course offering removed.');
    }

    public function generateFromCurriculum(Request $request)
    {
        $validated = $request->validate([
            'academic_period_id' => 'required|exists:academic_periods,id',
            'program_id' => 'required|exists:programs,id',
        ]);

        $period = AcademicPeriod::findOrFail($validated['academic_period_id']);
        $program = Program::with('curricula.curriculumCourses.course')->findOrFail($validated['program_id']);

        // Determine active curriculum
        $curriculum = $program->curricula()->where('status', 'Active')->first()
            ?? $program->curricula()->first();

        if (! $curriculum) {
            return redirect()->back()->with('error', "No curriculum version found for {$program->code}. Please define one first.");
        }

        // Determine current semester string from academic period
        // e.g. "1st Semester" or "2nd Semester"
        $semPlacement = '1st Semester';
        if (stripos($period->name, '2nd') !== false || stripos($period->semester ?? '', '2') !== false) {
            $semPlacement = '2nd Semester';
        }

        // Get sections for this program
        $sections = Section::where('program_id', $program->id)
            ->where('academic_period_id', $period->id)
            ->get();

        if ($sections->isEmpty()) {
            // Fallback: look for general sections with program code in code
            $sections = Section::where('code', 'like', $program->code.'-%')->get();
        }

        if ($sections->isEmpty()) {
            return redirect()->back()->with('error', "No active sections found for {$program->code} in {$period->name}.");
        }

        $created = 0;

        foreach ($sections as $section) {
            $yearLevel = $section->year_level ?? 1;

            // Get courses for this year level and semester in curriculum
            $curriculumCourses = CurriculumCourse::where('curriculum_id', $curriculum->id)
                ->where('year_level', $yearLevel)
                ->where('semester_placement', $semPlacement)
                ->with('course')
                ->get();

            foreach ($curriculumCourses as $cc) {
                $course = $cc->course;
                if (! $course) {
                    continue;
                }

                $offeringCode = $course->code.'-'.$section->name.'-'.$period->id;

                // Check if already created
                $existing = CourseOffering::where('academic_period_id', $period->id)
                    ->where('course_id', $course->id)
                    ->where('section_id', $section->id)
                    ->first();

                if (! $existing) {
                    CourseOffering::create([
                        'academic_period_id' => $period->id,
                        'course_id' => $course->id,
                        'program_id' => $program->id,
                        'curriculum_id' => $curriculum->id,
                        'section_id' => $section->id,
                        'offering_code' => $offeringCode,
                        'course_code' => $course->code,
                        'course_title' => $course->title,
                        'section_name' => $section->name,
                        'year_level' => $yearLevel,
                        'expected_enrollment' => 40,
                        'offering_type' => $cc->requirement_type === 'Elective' ? 'Elective' : 'Regular',
                        'units' => $course->units,
                        'lecture_hours' => $course->lecture_hours,
                        'lab_hours' => $course->lab_hours,
                        'room_type_required' => $course->required_facility_type ?? 'Lecture Room',
                        'loading_status' => 'Unassigned',
                        'timetable_status' => 'Pending',
                        'publication_status' => 'Draft',
                    ]);
                    $created++;
                }
            }
        }

        return redirect()->back()->with('success', "Instantiated {$created} course offerings for {$program->code} ({$curriculum->version_name}).");
    }

    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'offering_ids' => 'required|array',
            'offering_ids.*' => 'exists:course_offerings,id',
            'publication_status' => 'required|string|in:Draft,Ready,Published,Completed',
        ]);

        CourseOffering::whereIn('id', $validated['offering_ids'])
            ->update(['publication_status' => $validated['publication_status']]);

        return redirect()->back()->with('success', 'Selected offerings publication status updated.');
    }
}
