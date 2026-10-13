<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Requirement;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RequirementController extends Controller
{
    public function index(Request $request): Response
    {
        $requirements = Requirement::with(['program', 'submissions'])->latest()->get();
        $programs = Program::all();

        // Calculate KPIs
        $totalRequirements = $requirements->count();
        $activeProgramsCount = $programs->count();
        $openDeadlines = $requirements->filter(function ($r) {
            return $r->due_date ? Carbon::parse($r->due_date)->isFuture() || Carbon::parse($r->due_date)->isToday() : false;
        })->count();
        $totalSubmissions = $requirements->reduce(function ($carry, $r) {
            return $carry + ($r->submissions ? $r->submissions->count() : 0);
        }, 0);

        return Inertia::render('compliance/requirements/index', [
            'requirements' => $requirements,
            'programs' => $programs,
            'kpis' => [
                'total_requirements' => $totalRequirements,
                'active_programs' => $activeProgramsCount,
                'open_deadlines' => $openDeadlines,
                'total_submissions' => $totalSubmissions,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'document_type' => 'required|string|max:255',
            'academic_year' => 'required|string|max:255',
            'semester' => 'required|string|max:255',
            'due_date' => 'required|date',
            'program_id' => 'nullable',
        ]);

        $programId = $validated['program_id'] === 'all' || empty($validated['program_id']) ? null : $validated['program_id'];
        $validated['program_id'] = $programId;
        $validated['reviewer_id'] = Auth::id();
        $requirement = Requirement::create($validated);

        if ($programId) {
            $faculties = Faculty::where('program_id', $programId)->get();
        } else {
            $faculties = Faculty::all();
        }

        foreach ($faculties as $faculty) {
            $requirement->submissions()->create([
                'faculty_id' => $faculty->id,
                'status' => 'pending',
            ]);
        }

        return redirect()->back()->with('success', 'Requirement created and distributed successfully.');
    }

    public function update(Request $request, Requirement $requirement): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'document_type' => 'required|string|max:255',
            'academic_year' => 'required|string|max:255',
            'semester' => 'required|string|max:255',
            'due_date' => 'required|date',
            'program_id' => 'required|exists:programs,id',
        ]);

        $oldProgramId = $requirement->program_id;
        $requirement->update($validated);

        // If the program was changed, ensure faculty in the new program have pending submission records
        if ((int) $oldProgramId !== (int) $validated['program_id']) {
            $faculties = Faculty::where('program_id', $validated['program_id'])->get();
            foreach ($faculties as $faculty) {
                $requirement->submissions()->firstOrCreate(
                    ['faculty_id' => $faculty->id],
                    ['status' => 'pending']
                );
            }
        }

        return redirect()->back()->with('success', 'Requirement updated successfully.');
    }

    public function destroy(Requirement $requirement): RedirectResponse
    {
        $requirement->delete();

        return redirect()->back()->with('success', 'Requirement deleted successfully.');
    }
}
