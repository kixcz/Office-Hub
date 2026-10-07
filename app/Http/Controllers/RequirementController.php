<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Requirement;

class RequirementController extends Controller
{
    /**
     * Faculty Workspace: List requirements assigned to the authenticated user.
     */
    public function facultyWorkspace()
    {
        $user = Auth::user();
        $requirements = Requirement::with(['submissions' => function($query) use ($user) {
            $query->where('user_id', $user->id)->latest();
        }])
        ->where('user_id', $user->id)
        ->orWhereNull('user_id') // Global requirements assigned to all
        ->orderBy('due_date', 'asc')
        ->paginate(10);

        return Inertia::render('faculty/workspace', [
            'requirements' => $requirements
        ]);
    }

    /**
     * Compliance Matrix: Overview for Dean/Chairs
     */
    public function complianceMatrix(Request $request)
    {
        // Simple list of all requirements with their latest submissions grouped by user
        $requirements = Requirement::with(['user', 'submissions.user'])
            ->orderBy('due_date', 'desc')
            ->paginate(15);

        return Inertia::render('compliance/matrix', [
            'requirements' => $requirements
        ]);
    }

    public function show(Requirement $requirement)
    {
        $requirement->load(['user', 'submissions.user']);
        
        return Inertia::render('compliance/show', [
            'requirement' => $requirement
        ]);
    }

    public function create()
    {
        $users = \App\Models\User::all(['id', 'name']); // To select who to assign to
        return Inertia::render('compliance/create', [
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_type' => 'required|string|max:255',
            'academic_year' => 'required|string|max:20',
            'semester' => 'required|string|max:50',
            'course_section' => 'nullable|string|max:100',
            'due_date' => 'required|date',
            'accepted_format' => 'nullable|string|max:50',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $validated['reviewer_id'] = Auth::id();

        Requirement::create($validated);

        return redirect()->route('compliance.matrix')->with('success', 'Requirement assigned successfully.');
    }
}
