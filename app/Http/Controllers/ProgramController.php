<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Curriculum;
use App\Models\CurriculumCourse;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        $query = Program::with([
            'curricula' => function ($q) {
                $q->withCount(['curriculumCourses', 'courses'])->orderBy('created_at', 'desc');
            },
            'curricula.curriculumCourses.course',
        ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('degree_level') && $request->input('degree_level') !== 'all') {
            $query->where('degree_level', $request->input('degree_level'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $programs = $query->orderBy('id', 'asc')->get();

        $allCourses = Course::where('status', 'Active')->orderBy('code')->get();

        $totalPrograms = Program::count();
        $activePrograms = Program::where('status', 'Active')->count();
        $totalCurricula = Curriculum::count();
        $activeCurricula = Curriculum::where('status', 'Active')->count();

        return Inertia::render('programs/index', [
            'programs' => $programs,
            'coursesCatalog' => $allCourses,
            'stats' => [
                'total_programs' => $totalPrograms,
                'active_programs' => $activePrograms,
                'total_curricula' => $totalCurricula,
                'active_curricula' => $activeCurricula,
                'degree_levels' => Program::distinct()->pluck('degree_level')->filter()->values(),
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'department' => $request->input('department', 'all'),
                'degree_level' => $request->input('degree_level', 'all'),
                'status' => $request->input('status', 'all'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:programs,code',
            'name' => 'required|string|max:255',
            'degree_level' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'duration_years' => 'required|integer|min:1|max:8',
            'status' => 'required|string|in:Active,Inactive,Phased Out',
            'description' => 'nullable|string',
            'initial_curriculum_name' => 'nullable|string|max:255',
            'effective_year' => 'nullable|string|max:255',
        ]);

        $program = Program::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'degree_level' => $validated['degree_level'],
            'department' => $validated['department'],
            'duration_years' => $validated['duration_years'],
            'status' => $validated['status'],
            'description' => $validated['description'] ?? null,
        ]);

        // Automatically create baseline curriculum version if requested
        $curriculumName = $validated['initial_curriculum_name'] ?? ($program->code.' Curriculum '.date('Y'));
        Curriculum::create([
            'program_id' => $program->id,
            'version_name' => $curriculumName,
            'effective_year' => $validated['effective_year'] ?? date('Y'),
            'total_units' => 140,
            'status' => 'Active',
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Academic Program and initial Curriculum version created successfully.');
    }

    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:programs,code,'.$program->id,
            'name' => 'required|string|max:255',
            'degree_level' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'duration_years' => 'required|integer|min:1|max:8',
            'status' => 'required|string|in:Active,Inactive,Phased Out',
            'description' => 'nullable|string',
        ]);

        $program->update($validated);

        return redirect()->back()->with('success', 'Program blueprint updated successfully.');
    }

    public function destroy(Program $program)
    {
        DB::transaction(function () use ($program) {
            // 1. Cleanly delete associated curricula and their curriculum courses
            foreach ($program->curricula as $curric) {
                $curric->curriculumCourses()->delete();
                $curric->delete();
            }

            // 2. Remove or dissociate canonical courses owned by this program
            $program->courses()->update(['program_id' => null]);

            // 3. Clear program references from sections and course offerings
            $program->sections()->update(['program_id' => null]);
            $program->courseOfferings()->update(['program_id' => null]);

            // 4. Detach faculties assigned to this program
            $program->faculties()->update(['program_id' => null]);

            // 5. Delete program
            $program->delete();
        });

        return redirect()->route('programs.index')->with('success', 'Program and its curricula deleted successfully.');
    }

    // --- Curriculum Management Actions ---

    public function storeCurriculum(Request $request, Program $program)
    {
        $validated = $request->validate([
            'version_name' => 'required|string|max:255',
            'effective_year' => 'required|string|max:255',
            'total_units' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|string|in:Active,Draft,Archived',
        ]);

        $curriculum = $program->curricula()->create([
            'version_name' => $validated['version_name'],
            'effective_year' => $validated['effective_year'],
            'total_units' => $validated['total_units'] ?? 140,
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'is_active' => $validated['status'] === 'Active',
        ]);

        return redirect()->back()->with('success', 'Curriculum version created successfully.');
    }

    public function copyCurriculum(Request $request, Curriculum $curriculum)
    {
        $validated = $request->validate([
            'new_version_name' => 'required|string|max:255',
            'effective_year' => 'required|string|max:255',
        ]);

        $newCurriculum = Curriculum::create([
            'program_id' => $curriculum->program_id,
            'version_name' => $validated['new_version_name'],
            'effective_year' => $validated['effective_year'],
            'total_units' => $curriculum->total_units,
            'description' => 'Cloned from '.$curriculum->version_name,
            'status' => 'Draft',
            'is_active' => false,
        ]);

        // Copy all curriculum course sequence placements
        $oldCourses = CurriculumCourse::where('curriculum_id', $curriculum->id)->get();
        foreach ($oldCourses as $oc) {
            CurriculumCourse::create([
                'curriculum_id' => $newCurriculum->id,
                'course_id' => $oc->course_id,
                'year_level' => $oc->year_level,
                'semester_placement' => $oc->semester_placement,
                'requirement_type' => $oc->requirement_type,
                'prerequisite_override' => $oc->prerequisite_override,
                'corequisite_override' => $oc->corequisite_override,
                'sequence_order' => $oc->sequence_order,
            ]);
        }

        return redirect()->back()->with('success', 'Curriculum copied successfully with all course sequence rules.');
    }

    public function toggleCurriculumStatus(Request $request, Curriculum $curriculum)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Active,Draft,Archived',
        ]);

        $curriculum->update([
            'status' => $validated['status'],
            'is_active' => $validated['status'] === 'Active',
        ]);

        return redirect()->back()->with('success', 'Curriculum status updated.');
    }

    public function addCourseToCurriculum(Request $request, Curriculum $curriculum)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'year_level' => 'required|integer|min:1|max:6',
            'semester_placement' => 'required|string|in:1st Semester,2nd Semester,Summer',
            'requirement_type' => 'required|string|in:Required,Major,Elective,Specialization,General Education,Institutional',
            'prerequisite_override' => 'nullable|string',
            'corequisite_override' => 'nullable|string',
        ]);

        CurriculumCourse::updateOrCreate(
            [
                'curriculum_id' => $curriculum->id,
                'course_id' => $validated['course_id'],
                'year_level' => $validated['year_level'],
                'semester_placement' => $validated['semester_placement'],
            ],
            [
                'requirement_type' => $validated['requirement_type'],
                'prerequisite_override' => $validated['prerequisite_override'] ?? null,
                'corequisite_override' => $validated['corequisite_override'] ?? null,
                'sequence_order' => 10,
            ]
        );

        // Recalculate total units of curriculum
        $totalUnits = CurriculumCourse::where('curriculum_id', $curriculum->id)
            ->join('courses', 'curriculum_courses.course_id', '=', 'courses.id')
            ->sum('courses.units');

        if ($totalUnits > 0) {
            $curriculum->update(['total_units' => (int) $totalUnits]);
        }

        return redirect()->back()->with('success', 'Course added to curriculum sequence matrix.');
    }

    public function removeCourseFromCurriculum(Curriculum $curriculum, Course $course)
    {
        CurriculumCourse::where('curriculum_id', $curriculum->id)
            ->where('course_id', $course->id)
            ->delete();

        // Recalculate total units
        $totalUnits = CurriculumCourse::where('curriculum_id', $curriculum->id)
            ->join('courses', 'curriculum_courses.course_id', '=', 'courses.id')
            ->sum('courses.units');

        $curriculum->update(['total_units' => (int) $totalUnits]);

        return redirect()->back()->with('success', 'Course removed from curriculum sequence matrix.');
    }

    public function updateCurriculumCourse(Request $request, Curriculum $curriculum, CurriculumCourse $curriculumCourse)
    {
        $validated = $request->validate([
            'year_level' => 'required|integer|min:1|max:8',
            'semester_placement' => 'required|string|in:1st Semester,2nd Semester,Summer',
            'requirement_type' => 'required|string|in:Required,Major,Elective,Specialization,General Education,Institutional',
            'prerequisite_override' => 'nullable|string',
            'corequisite_override' => 'nullable|string',
        ]);

        $curriculumCourse->update([
            'year_level' => $validated['year_level'],
            'semester_placement' => $validated['semester_placement'],
            'requirement_type' => $validated['requirement_type'],
            'prerequisite_override' => $validated['prerequisite_override'] ?? null,
            'corequisite_override' => $validated['corequisite_override'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Curriculum subject placement updated successfully.');
    }
}
