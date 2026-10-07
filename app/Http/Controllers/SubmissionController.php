<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Requirement;
use App\Models\Submission;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    public function store(Request $request, Requirement $requirement)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $path = $request->file('file')->store('submissions', 'public');

        // Check if there is an existing submission for this user and requirement
        // For MVP, we'll just update it or create a new one
        $submission = Submission::updateOrCreate(
            [
                'requirement_id' => $requirement->id,
                'user_id' => Auth::id(),
            ],
            [
                'status' => 'awaiting_review',
                'file_path' => $path,
                'submitted_at' => now(),
            ]
        );

        return back()->with('success', 'Document submitted successfully.');
    }

    public function update(Request $request, Submission $submission)
    {
        $validated = $request->validate([
            'status' => 'required|in:accepted,revision_requested,exemption_approved',
            'reviewer_comments' => 'nullable|string',
        ]);

        $submission->update($validated);

        return back()->with('success', 'Submission status updated successfully.');
    }
}
