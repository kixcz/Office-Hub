<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomComplaint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoomComplaintReportController extends Controller
{
    /**
     * Display the Room & Laboratory Facility Reports for Dean / Super Admin.
     */
    public function index(Request $request): Response
    {
        $statusFilter = $request->query('status', 'all');
        $urgencyFilter = $request->query('urgency', 'all');
        $categoryFilter = $request->query('category', 'all');
        $search = $request->query('search', '');

        $query = RoomComplaint::with(['room', 'faculty'])
            ->latest();

        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        if ($urgencyFilter !== 'all') {
            $query->where('urgency', $urgencyFilter);
        }

        if ($categoryFilter !== 'all') {
            $query->where('issue_category', $categoryFilter);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('room_name', 'like', "%{$search}%")
                    ->orWhere('complainant_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $complaints = $query->paginate(15)->withQueryString();

        // High-level analytics
        $stats = [
            'total_reports' => RoomComplaint::count(),
            'pending_dean_review' => RoomComplaint::where('status', 'Submitted to Dean')->count(),
            'in_progress' => RoomComplaint::whereIn('status', ['Under Review', 'In Progress'])->count(),
            'resolved' => RoomComplaint::where('status', 'Resolved')->count(),
            'critical_unresolved' => RoomComplaint::where('urgency', 'Critical')->where('status', '!=', 'Resolved')->count(),
        ];

        // Unique rooms for filter
        $rooms = Room::orderBy('room_name')->pluck('room_name');

        return Inertia::render('operations/facility-reports/index', [
            'complaints' => $complaints,
            'stats' => $stats,
            'filters' => [
                'status' => $statusFilter,
                'urgency' => $urgencyFilter,
                'category' => $categoryFilter,
                'search' => $search,
            ],
            'rooms' => $rooms,
        ]);
    }

    /**
     * Update complaint status or add Dean notes / resolution details.
     */
    public function update(Request $request, RoomComplaint $report): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Submitted to Dean,Under Review,In Progress,Resolved,Dismissed',
            'action_taken' => 'nullable|string|max:2000',
            'dean_notes' => 'nullable|string|max:2000',
            'room_status' => 'nullable|string|in:Available,In Use,Maintenance,Under Repair,Reserved',
        ]);

        $report->status = $validated['status'];
        $report->action_taken = $validated['action_taken'] ?? $report->action_taken;
        $report->dean_notes = $validated['dean_notes'] ?? $report->dean_notes;

        if ($validated['status'] === 'Resolved') {
            $report->resolved_by = auth()->user()?->name ?? 'Dean Office';
            $report->resolved_at = now();
        }

        $report->save();

        // Optionally update the associated room status
        if (! empty($validated['room_status']) && $report->room_id) {
            $room = Room::find($report->room_id);
            if ($room) {
                $room->update(['status' => $validated['room_status']]);
            }
        } elseif ($validated['status'] === 'Resolved' && $report->room_id) {
            $room = Room::find($report->room_id);
            if ($room && in_array($room->status, ['Under Repair', 'Maintenance'])) {
                $room->update(['status' => 'Available']);
            }
        }

        return redirect()->back()->with('success', 'Report status updated successfully.');
    }

    /**
     * Remove a complaint record.
     */
    public function destroy(RoomComplaint $report): RedirectResponse
    {
        $report->delete();

        return redirect()->back()->with('success', 'Facility problem report removed.');
    }
}
