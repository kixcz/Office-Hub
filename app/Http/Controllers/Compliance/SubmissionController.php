<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubmissionController extends Controller
{
    public function index(Request $request)
    {
        $submissions = Submission::with(['faculty', 'requirement.program'])
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->get();

        // For the manual entry form, we might need all pending submissions
        $pendingSubmissions = Submission::with(['faculty', 'requirement.program'])
            ->whereNull('submitted_at')
            ->get();

        return Inertia::render('compliance/submissions/index', [
            'submissions' => $submissions,
            'pendingSubmissions' => $pendingSubmissions,
        ]);
    }

    public function update(Request $request, Submission $submission)
    {
        $validated = $request->validate([
            'submitted_at' => 'required|date',
            'reviewer_comments' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $submission->update($validated);

        return redirect()->back()->with('success', 'Submission recorded successfully.');
    }
}
