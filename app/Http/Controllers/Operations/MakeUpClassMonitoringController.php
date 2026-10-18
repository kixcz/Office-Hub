<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Faculty;
use App\Models\MakeUpClassRequest;
use App\Models\Program;
use App\Models\RoomSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MakeUpClassMonitoringController extends Controller
{
    /**
     * Display Make-Up Class Monitoring Hub.
     */
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::current() ?? AcademicPeriod::first();
        $academicPeriods = AcademicPeriod::orderBy('start_date', 'desc')->get();

        $query = MakeUpClassRequest::with(['faculty', 'academicPeriod'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('faculty_id')) {
            $query->where('faculty_id', $request->input('faculty_id'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('course_code', 'like', "%{$search}%")
                    ->orWhere('course_title', 'like', "%{$search}%")
                    ->orWhere('section', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        $requests = $query->get();

        $metrics = [
            'total_requests' => MakeUpClassRequest::count(),
            'pending_reviews' => MakeUpClassRequest::whereIn('status', ['Submitted', 'Program Head Review'])->count(),
            'approved_count' => MakeUpClassRequest::where('status', 'Approved')->count(),
            'completed_count' => MakeUpClassRequest::where('status', 'Completed')->count(),
            'overdue_count' => MakeUpClassRequest::where('status', 'Approved')->whereDate('proposed_date', '<', now()->toDateString())->count(),
        ];

        $faculties = Faculty::orderBy('last_name')->get();
        $rooms = RoomSchedule::select('room_name')->distinct()->whereNotNull('room_name')->pluck('room_name');

        return Inertia::render('operations/make-up-classes/index', [
            'currentPeriod' => $currentPeriod,
            'academicPeriods' => $academicPeriods,
            'requests' => $requests,
            'metrics' => $metrics,
            'faculties' => $faculties,
            'rooms' => $rooms,
            'filters' => $request->only(['status', 'faculty_id', 'search']),
        ]);
    }

    /**
     * Program Head or Dean Review of Make-Up Class Request.
     */
    public function review(Request $request, MakeUpClassRequest $makeUpClassRequest)
    {
        $validated = $request->validate([
            'action' => 'required|in:endorse,approve,return,reject',
            'remarks' => 'nullable|string',
        ]);

        $user = auth()->user();

        if ($validated['action'] === 'endorse') {
            $makeUpClassRequest->update([
                'status' => 'Dean Approval',
                'program_head_reviewed_at' => now(),
                'program_head_reviewed_by_id' => $user->id,
                'program_head_remarks' => $validated['remarks'] ?? 'Academic appropriateness verified.',
            ]);
            $msg = 'Make-up request endorsed to Dean for final approval.';
        } elseif ($validated['action'] === 'approve') {
            $makeUpClassRequest->update([
                'status' => 'Approved',
                'dean_approved_at' => now(),
                'dean_approved_by_id' => $user->id,
                'dean_remarks' => $validated['remarks'] ?? 'Approved for execution. Schedule posted.',
            ]);
            $msg = 'Make-up class officially approved and posted to timetable.';
        } elseif ($validated['action'] === 'return') {
            $makeUpClassRequest->update([
                'status' => 'Returned',
                'dean_remarks' => $validated['remarks'] ?? 'Returned for schedule adjustment.',
            ]);
            $msg = 'Make-up request returned to faculty for modification.';
        } else {
            $makeUpClassRequest->update([
                'status' => 'Rejected',
                'dean_remarks' => $validated['remarks'] ?? 'Declined per departmental policy.',
            ]);
            $msg = 'Make-up request rejected.';
        }

        return redirect()->back()->with('success', $msg);
    }
}
