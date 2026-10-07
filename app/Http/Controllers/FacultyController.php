<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacultyController extends Controller
{
    public function index()
    {
        $faculties = Faculty::with('program')->latest()->get();
        $programs = Program::all();

        return Inertia::render('faculties/index', [
            'faculties' => $faculties,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|string|unique:faculties,employee_id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:faculties,email',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'program_id' => 'nullable|exists:programs,id',
        ]);

        Faculty::create($validated);

        return redirect()->back()->with('success', 'Faculty profile created successfully.');
    }

    public function update(Request $request, Faculty $faculty)
    {
        $validated = $request->validate([
            'employee_id' => 'required|string|unique:faculties,employee_id,'.$faculty->id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:faculties,email,'.$faculty->id,
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'program_id' => 'nullable|exists:programs,id',
        ]);

        $faculty->update($validated);

        return redirect()->back()->with('success', 'Faculty profile updated successfully.');
    }

    public function destroy(Faculty $faculty)
    {
        $faculty->delete();

        return redirect()->back()->with('success', 'Faculty profile deleted successfully.');
    }
}
