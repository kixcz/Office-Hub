<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Requirement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RequirementController extends Controller
{
    public function index()
    {
        $requirements = Requirement::with('program')->latest()->get();
        $programs = Program::all();

        return Inertia::render('compliance/requirements/index', [
            'requirements' => $requirements,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'document_type' => 'required|string|max:255',
            'academic_year' => 'required|string|max:255',
            'semester' => 'required|string|max:255',
            'due_date' => 'required|date',
            'program_id' => 'required|exists:programs,id',
        ]);

        $validated['reviewer_id'] = Auth::id();
        $requirement = Requirement::create($validated);

        $faculties = Faculty::where('program_id', $validated['program_id'])->get();

        foreach ($faculties as $faculty) {
            $requirement->submissions()->create([
                'faculty_id' => $faculty->id,
                'status' => 'pending',
            ]);
        }

        return redirect()->back()->with('success', 'Requirement created and distributed successfully.');
    }
}
