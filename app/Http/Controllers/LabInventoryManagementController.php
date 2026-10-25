<?php

namespace App\Http\Controllers;

use App\Models\LabInspectionCycle;
use App\Models\LabInventoryAdjustment;
use App\Models\LabInventoryAuditLog;
use App\Models\LabInventoryItem;
use App\Models\LabMaintenanceTicket;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LabInventoryManagementController extends Controller
{
    /**
     * Display the authoritative Lab Inventory Management module.
     */
    public function index(Request $request): Response
    {
        $query = LabInventoryItem::with(['room']);

        if ($request->filled('room_id') && $request->room_id !== 'all') {
            $query->where('room_id', $request->room_id);
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('tracking_type') && $request->tracking_type !== 'all') {
            $query->where('tracking_type', $request->tracking_type);
        }

        if ($request->filled('condition') && $request->condition !== 'all') {
            $query->where('condition', $request->condition);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('operational_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(item_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(asset_number) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(serial_number) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(brand_model) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(room_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(custodian) LIKE ?', ["%{$search}%"]);
            });
        }

        // Summary Dashboard Metrics
        $allItems = LabInventoryItem::all();
        $totalAssets = $allItems->count();
        $operationalAssets = $allItems->where('condition', 'Operational')->count();
        $forRepair = $allItems->where('condition', 'For Repair')->count();
        $damaged = $allItems->where('condition', 'Damaged')->count();
        $missing = $allItems->where('condition', 'Missing')->count();
        $lowStockConsumables = $allItems->where('tracking_type', 'consumable')->where('quantity', '<=', 20)->count();
        $pendingAdjustments = LabInventoryAdjustment::where('status', 'Pending Verification')->count();
        $inspectionsDue = $allItems->filter(fn ($i) => $i->next_inspection_due && $i->next_inspection_due->isPast())->count();
        $openMaintenanceRequests = LabMaintenanceTicket::whereIn('repair_status', ['Reported', 'Triaged', 'In Progress'])->count();

        // Paginate items with relationships
        $items = $query->orderBy('room_name')
            ->orderBy('item_name')
            ->paginate(15)
            ->withQueryString();

        // Reference lists
        $rooms = Room::orderBy('room_name')->get(['id', 'room_name', 'type', 'custom_type', 'building']);
        $categories = LabInventoryItem::select('category')->distinct()->pluck('category')->toArray();
        $custodians = LabInventoryItem::select('custodian')->whereNotNull('custodian')->distinct()->pluck('custodian')->toArray();
        $batches = LabInventoryItem::select('acquisition_batch')->whereNotNull('acquisition_batch')->distinct()->pluck('acquisition_batch')->toArray();

        // Active maintenance tickets & pending adjustments for tabs
        $recentTickets = LabMaintenanceTicket::with(['item', 'room', 'reporter'])
            ->latest()
            ->take(8)
            ->get();

        $recentAdjustments = LabInventoryAdjustment::with(['item', 'requester', 'reviewer'])
            ->latest()
            ->take(8)
            ->get();

        $activeInspectionCycles = LabInspectionCycle::with(['room', 'assignedInspector'])
            ->whereIn('status', ['Scheduled', 'In Progress'])
            ->latest()
            ->get();

        return Inertia::render('facilities/lab-inventory/index', [
            'items' => $items,
            'rooms' => $rooms,
            'categories' => $categories,
            'custodians' => $custodians,
            'batches' => $batches,
            'stats' => [
                'totalAssets' => $totalAssets,
                'operationalAssets' => $operationalAssets,
                'forRepair' => $forRepair,
                'damaged' => $damaged,
                'missing' => $missing,
                'lowStockConsumables' => $lowStockConsumables,
                'pendingAdjustments' => $pendingAdjustments,
                'inspectionsDue' => $inspectionsDue,
                'openMaintenanceRequests' => $openMaintenanceRequests,
            ],
            'recentTickets' => $recentTickets,
            'recentAdjustments' => $recentAdjustments,
            'activeInspectionCycles' => $activeInspectionCycles,
            'filters' => $request->only(['search', 'room_id', 'category', 'tracking_type', 'condition', 'status']),
        ]);
    }

    /**
     * Store a newly created inventory item.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'asset_number' => 'nullable|string|max:100|unique:lab_inventory_items,asset_number',
            'item_name' => 'required|string|max:255',
            'tracking_type' => 'required|in:serialized,non_serialized,consumable',
            'category' => 'required|string|max:100',
            'brand_model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:100',
            'college' => 'nullable|string|max:255',
            'quantity' => 'required|integer|min:1',
            'unit' => 'required|string|max:50',
            'condition' => 'required|in:Operational,Operational with Minor Issue,For Inspection,For Repair,Under Maintenance,Damaged,Missing,Transferred,Condemned,Disposed',
            'operational_status' => 'required|string|max:50',
            'custodian' => 'nullable|string|max:255',
            'acquisition_batch' => 'nullable|string|max:100',
            'acquisition_date' => 'nullable|date',
            'unit_cost' => 'nullable|numeric|min:0',
            'warranty_info' => 'nullable|string|max:255',
            'last_inspected_at' => 'nullable|date',
            'next_inspection_due' => 'nullable|date',
            'specs_details' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $room = Room::find($validated['room_id']);
        $validated['room_name'] = $room?->room_name;

        if (empty($validated['asset_number'])) {
            $prefix = $validated['tracking_type'] === 'serialized' ? 'AST' : ($validated['tracking_type'] === 'consumable' ? 'CSM' : 'EQP');
            $roomCode = $room?->room_code ?: 'FAC';
            $validated['asset_number'] = "{$prefix}-{$roomCode}-".strtoupper(substr(uniqid(), -6));
        }

        $item = LabInventoryItem::create($validated);

        // Audit Log
        LabInventoryAuditLog::create([
            'item_id' => $item->id,
            'user_id' => $request->user()?->id,
            'action' => 'Created',
            'new_state' => $item->toArray(),
            'justification' => 'New asset registered into facility inventory',
            'ip_address' => $request->ip(),
        ]);

        return redirect()->back()->with('success', "Asset '{$item->item_name}' registered successfully.");
    }

    /**
     * Update an inventory item.
     */
    public function update(Request $request, LabInventoryItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'asset_number' => 'nullable|string|max:100|unique:lab_inventory_items,asset_number,'.$item->id,
            'item_name' => 'required|string|max:255',
            'tracking_type' => 'required|in:serialized,non_serialized,consumable',
            'category' => 'required|string|max:100',
            'brand_model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:100',
            'quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'condition' => 'required|in:Operational,Operational with Minor Issue,For Inspection,For Repair,Under Maintenance,Damaged,Missing,Transferred,Condemned,Disposed',
            'operational_status' => 'required|string|max:50',
            'custodian' => 'nullable|string|max:255',
            'acquisition_batch' => 'nullable|string|max:100',
            'acquisition_date' => 'nullable|date',
            'unit_cost' => 'nullable|numeric|min:0',
            'warranty_info' => 'nullable|string|max:255',
            'last_inspected_at' => 'nullable|date',
            'next_inspection_due' => 'nullable|date',
            'specs_details' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $room = Room::find($validated['room_id']);
        $validated['room_name'] = $room?->room_name;

        $previousState = $item->toArray();
        $item->update($validated);

        // Auto create maintenance ticket if item was moved to For Repair or Damaged
        if (in_array($validated['condition'], ['For Repair', 'Damaged']) && ! in_array($previousState['condition'], ['For Repair', 'Damaged'])) {
            LabMaintenanceTicket::create([
                'item_id' => $item->id,
                'room_id' => $item->room_id,
                'reported_by' => $request->user()?->id,
                'ticket_number' => 'TCK-'.date('Y').'-'.strtoupper(substr(uniqid(), -6)),
                'title' => "Maintenance required for {$item->item_name}",
                'reported_problem' => $validated['remarks'] ?: "Item marked as {$validated['condition']}.",
                'severity' => $validated['condition'] === 'Damaged' ? 'High' : 'Medium',
                'repair_status' => 'Reported',
                'start_date' => now()->toDateString(),
            ]);
        }

        // Audit Log
        LabInventoryAuditLog::create([
            'item_id' => $item->id,
            'user_id' => $request->user()?->id,
            'action' => 'Updated',
            'previous_state' => $previousState,
            'new_state' => $item->toArray(),
            'justification' => 'Asset information updated via Inventory Management Workspace',
            'ip_address' => $request->ip(),
        ]);

        return redirect()->back()->with('success', "Asset '{$item->item_name}' updated successfully.");
    }

    /**
     * Delete an inventory item.
     */
    public function destroy(Request $request, LabInventoryItem $item): RedirectResponse
    {
        $name = $item->item_name;
        $prev = $item->toArray();

        // Audit Log before deletion
        LabInventoryAuditLog::create([
            'item_id' => null,
            'user_id' => $request->user()?->id,
            'action' => 'Disposed / Deleted',
            'previous_state' => $prev,
            'new_state' => null,
            'justification' => $request->input('reason', 'Removed by authorized Administrator'),
            'ip_address' => $request->ip(),
        ]);

        $item->delete();

        return redirect()->back()->with('success', "Asset '{$name}' permanently removed from inventory.");
    }

    /**
     * Request or verify an inventory quantity adjustment.
     */
    public function storeAdjustment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:lab_inventory_items,id',
            'type' => 'required|in:Count Discrepancy,Damage Report,Missing Report,Surplus Found,Disposal,Transfer',
            'new_quantity' => 'required|integer|min:0',
            'new_condition' => 'nullable|string',
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $item = LabInventoryItem::findOrFail($validated['item_id']);

        $user = $request->user();
        $isSuperAdminOrHead = $user && ($user->roles->pluck('name')->contains('Super Admin') || $user->roles->pluck('name')->contains('Head Lab In-Charge'));

        $status = $isSuperAdminOrHead ? 'Approved' : 'Pending Verification';

        $adjustment = LabInventoryAdjustment::create([
            'item_id' => $item->id,
            'requested_by' => $user?->id ?: 1,
            'reviewed_by' => $isSuperAdminOrHead ? $user?->id : null,
            'type' => $validated['type'],
            'previous_quantity' => $item->quantity,
            'new_quantity' => $validated['new_quantity'],
            'previous_condition' => $item->condition,
            'new_condition' => $validated['new_condition'] ?: $item->condition,
            'reason' => $validated['reason'],
            'status' => $status,
            'reviewed_at' => $isSuperAdminOrHead ? now() : null,
        ]);

        // If auto-approved by Super Admin or Head, update the inventory item immediately
        if ($isSuperAdminOrHead) {
            $item->update([
                'quantity' => $validated['new_quantity'],
                'condition' => $validated['new_condition'] ?: $item->condition,
            ]);

            LabInventoryAuditLog::create([
                'item_id' => $item->id,
                'user_id' => $user?->id,
                'action' => 'Quantity Adjusted',
                'previous_state' => ['quantity' => $adjustment->previous_quantity, 'condition' => $adjustment->previous_condition],
                'new_state' => ['quantity' => $adjustment->new_quantity, 'condition' => $adjustment->new_condition],
                'justification' => $adjustment->reason,
                'ip_address' => $request->ip(),
            ]);
        }

        return redirect()->back()->with('success', $isSuperAdminOrHead ? 'Inventory ledger updated and approved.' : 'Adjustment request submitted for Head Lab In-Charge verification.');
    }

    /**
     * Create or update maintenance tickets.
     */
    public function storeMaintenanceTicket(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => 'nullable|exists:lab_inventory_items,id',
            'room_id' => 'required|exists:rooms,id',
            'title' => 'required|string|max:255',
            'reported_problem' => 'required|string|min:5',
            'severity' => 'required|in:Low,Medium,High,Critical',
            'assigned_technician' => 'nullable|string|max:255',
            'repair_status' => 'required|in:Reported,Triaged,In Progress,Awaiting Parts,Completed,Cancelled',
            'cost' => 'nullable|numeric|min:0',
        ]);

        $room = Room::find($validated['room_id']);
        $validated['ticket_number'] = 'TCK-'.date('Y').'-'.($room?->room_code ?: 'FAC').'-'.strtoupper(substr(uniqid(), -4));
        $validated['reported_by'] = $request->user()?->id;
        $validated['start_date'] = now()->toDateString();

        $ticket = LabMaintenanceTicket::create($validated);

        if (! empty($validated['item_id'])) {
            $item = LabInventoryItem::find($validated['item_id']);
            if ($item && $validated['repair_status'] !== 'Completed') {
                $item->update([
                    'condition' => 'Under Maintenance',
                    'operational_status' => 'In Repair',
                ]);
            }
        }

        return redirect()->back()->with('success', "Maintenance ticket '{$ticket->ticket_number}' created successfully.");
    }
}
