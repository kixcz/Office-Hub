<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Carbon\Carbon;
use Inertia\Inertia;

class PendingOutputController extends Controller
{
    public function index()
    {
        $pendingSubmissions = Submission::with(['faculty.program', 'requirement'])
            ->whereNull('submitted_at')
            ->get()
            ->map(function ($submission) {
                $dueDate = Carbon::parse($submission->requirement->due_date);
                $now = now();

                if ($now->greaterThan($dueDate)) {
                    $urgency = 'Overdue';
                } elseif ($now->diffInDays($dueDate, false) === 0) {
                    $urgency = 'Due Today';
                } elseif ($now->diffInDays($dueDate, false) <= 3) {
                    $urgency = 'Due Soon';
                } else {
                    $urgency = 'Pending';
                }

                $submission->urgency = $urgency;

                return $submission;
            });

        return Inertia::render('compliance/pending-outputs/index', [
            'pendingSubmissions' => $pendingSubmissions,
        ]);
    }
}
