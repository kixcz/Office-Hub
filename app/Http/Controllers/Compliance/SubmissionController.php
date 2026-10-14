<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\Submission;
use App\Services\ComplianceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    /**
     * Display a listing of completed and pending submissions.
     */
    public function index(Request $request): Response
    {
        ComplianceService::syncPendingSubmissions();

        $submissions = Submission::with(['faculty.program', 'requirement.program'])
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->get();

        $pendingSubmissions = Submission::with(['faculty.program', 'requirement.program'])
            ->whereNull('submitted_at')
            ->get();

        $requirements = Requirement::with('program')
            ->latest()
            ->get();

        $programs = Program::orderBy('code')->get(['id', 'code', 'name']);

        $totalSubmissions = $submissions->count();
        $totalPending = $pendingSubmissions->count();
        $totalCombined = $totalSubmissions + $totalPending;
        $submissionRate = $totalCombined > 0 ? round(($totalSubmissions / $totalCombined) * 100) : 100;

        $kpis = [
            'pending_outputs' => $totalPending,
            'completed_records' => $totalSubmissions,
            'active_requirements' => $requirements->count(),
            'submission_rate' => $submissionRate,
        ];

        return Inertia::render('compliance/submissions/index', [
            'submissions' => $submissions,
            'pendingSubmissions' => $pendingSubmissions,
            'requirements' => $requirements,
            'programs' => $programs,
            'kpis' => $kpis,
        ]);
    }

    /**
     * Record submissions in bulk for multiple faculty members.
     */
    public function bulkRecord(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'submission_ids' => ['required', 'array', 'min:1'],
            'submission_ids.*' => ['required', 'integer', 'exists:submissions,id'],
            'submitted_at' => ['required', 'date'],
            'status' => ['required', 'string', 'max:50'],
            'reviewer_comments' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($validated): void {
            Submission::whereIn('id', $validated['submission_ids'])->update([
                'submitted_at' => $validated['submitted_at'],
                'status' => $validated['status'],
                'reviewer_comments' => $validated['reviewer_comments'] ?? null,
            ]);
        });

        $count = count($validated['submission_ids']);

        return redirect()->back()->with('success', "{$count} faculty submission(s) recorded successfully.");
    }

    /**
     * Update an individual submission.
     */
    public function update(Request $request, Submission $submission): RedirectResponse
    {
        $validated = $request->validate([
            'submitted_at' => ['required', 'date'],
            'reviewer_comments' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', 'string', 'max:50'],
        ]);

        $submission->update($validated);

        return redirect()->back()->with('success', 'Submission updated successfully.');
    }

    /**
     * Revert a submission back to pending.
     */
    public function destroy(Submission $submission): RedirectResponse
    {
        $submission->update([
            'submitted_at' => null,
            'status' => 'pending',
            'reviewer_comments' => null,
        ]);

        return redirect()->back()->with('success', 'Submission reverted to pending successfully.');
    }
}
