<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Faculty;
use App\Models\LabInventoryItem;
use App\Models\Room;
use App\Models\RoomComplaint;
use App\Models\RoomSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoomInventoryController extends Controller
{
    /**
     * Display the authoritative Rooms & Laboratories registry page.
     */
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::current();

        $query = Room::withCount([
            'complaints as active_complaints_count' => function ($q) {
                $q->whereIn('status', ['Submitted to Dean', 'Under Review', 'In Progress']);
            },
            'inventoryItems as total_inventory_count',
            'inventoryItems as operational_inventory_count' => function ($q) {
                $q->where('condition', 'Operational');
            },
            'inventoryItems as repair_inventory_count' => function ($q) {
                $q->whereIn('condition', ['For Repair', 'Under Maintenance']);
            },
            'maintenanceTickets as active_maintenance_count' => function ($q) {
                $q->whereIn('repair_status', ['Reported', 'Triaged', 'In Progress', 'Awaiting Parts']);
            },
        ]);

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('type', $request->type)
                    ->orWhere('custom_type', $request->type);
            });
        }

        if ($request->filled('building') && $request->building !== 'all') {
            $query->where('building', $request->building);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('status', $request->status)
                    ->orWhere('operational_status', $request->status);
            });
        }

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(room_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(room_code) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(building) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(custom_type) LIKE ?', ["%{$search}%"]);
            });
        }

        $allRooms = Room::all();
        $buildings = Room::select('building')->whereNotNull('building')->distinct()->pluck('building')->toArray();
        $configuredTypes = Room::select('custom_type')->whereNotNull('custom_type')->distinct()->pluck('custom_type')->toArray();

        // Calculate System Summary KPIs
        $totalFacilities = $allRooms->count();
        $availableToday = $allRooms->where('operational_status', 'Available')->where('status', 'Available')->count();
        $inUse = $allRooms->where('status', 'In Use')->count();
        $underMaintenance = $allRooms->filter(fn ($r) => in_array($r->status, ['Maintenance', 'Under Repair']) || $r->operational_status === 'Maintenance')->count();
        $tempUnavailable = $allRooms->filter(fn ($r) => in_array($r->operational_status, ['Utility Failure', 'Closed', 'Reserved']))->count();
        $capacityIssues = $allRooms->filter(fn ($r) => $r->capacity < 25)->count();

        // Paginate results with query string
        $rooms = $query->orderBy('room_name')->paginate(12)->withQueryString()->through(function ($room) {
            $scheduledCount = RoomSchedule::where('room_name', $room->room_name)->count();

            // Next schedule lookup
            $nextSchedule = RoomSchedule::where('room_name', $room->room_name)
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->first();

            return [
                'id' => $room->id,
                'room_code' => $room->room_code ?: strtoupper(str_replace(' ', '-', $room->room_name)),
                'room_name' => $room->room_name,
                'building' => $room->building,
                'floor' => $room->floor,
                'type' => $room->type,
                'custom_type' => $room->custom_type ?: ($room->type === 'Laboratory' ? 'Computer Laboratory' : 'Lecture Room'),
                'capacity' => $room->capacity,
                'status' => $room->status,
                'operational_status' => $room->operational_status ?: 'Available',
                'operating_hours' => $room->operating_hours ?: '7:00 AM - 7:00 PM',
                'supported_activities' => $room->supported_activities ?: ['Lecture', 'Exam'],
                'capabilities' => $room->capabilities ?: [
                    'has_projector' => true,
                    'num_workstations' => $room->type === 'Laboratory' ? $room->capacity : 0,
                    'internet_type' => 'High-Speed Wi-Fi',
                    'has_aircon' => true,
                ],
                'availability_rules' => $room->availability_rules ?: [
                    'regular_hours' => '7:00 AM - 7:00 PM',
                    'recurring_maintenance' => [],
                ],
                'effective_from' => $room->effective_from?->format('Y-m-d'),
                'effective_until' => $room->effective_until?->format('Y-m-d'),
                'is_accessible' => (bool) $room->is_accessible,
                'equipment_details' => $room->equipment_details,
                'notes' => $room->notes,
                'scheduled_count' => $scheduledCount,
                'active_complaints_count' => $room->active_complaints_count,
                'inventory_summary' => [
                    'total' => $room->total_inventory_count,
                    'operational' => $room->operational_inventory_count,
                    'for_repair' => $room->repair_inventory_count,
                ],
                'active_maintenance_count' => $room->active_maintenance_count,
                'current_activity' => $room->status === 'In Use' ? 'Class in session' : 'Free / Available',
                'next_schedule' => $nextSchedule ? [
                    'subject' => $nextSchedule->course_code,
                    'time' => "{$nextSchedule->day_of_week} {$nextSchedule->start_time} - {$nextSchedule->end_time}",
                    'faculty' => $nextSchedule->faculty?->full_name ?? 'Assigned Faculty',
                ] : null,
            ];
        });

        // Faculty list for complaint / management
        $faculties = Faculty::orderBy('last_name')->get()->map(fn ($f) => [
            'id' => $f->id,
            'name' => $f->full_name,
            'email' => $f->email ?? '',
        ]);

        $recentComplaints = RoomComplaint::latest()->take(10)->get();

        return Inertia::render('facilities/rooms/index', [
            'currentPeriod' => $currentPeriod,
            'rooms' => $rooms,
            'faculties' => $faculties,
            'buildings' => $buildings,
            'configuredTypes' => $configuredTypes,
            'stats' => [
                'totalFacilities' => $totalFacilities,
                'availableToday' => $availableToday,
                'inUse' => $inUse,
                'underMaintenance' => $underMaintenance,
                'temporarilyUnavailable' => $tempUnavailable,
                'capacityIssues' => $capacityIssues,
            ],
            'filters' => $request->only(['search', 'type', 'building', 'status']),
            'recentComplaints' => $recentComplaints,
        ]);
    }

    /**
     * Store a newly created facility.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_name' => 'required|string|max:100|unique:rooms,room_name',
            'room_code' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'type' => 'required|string|max:50',
            'custom_type' => 'nullable|string|max:100',
            'capacity' => 'required|integer|min:1|max:500',
            'status' => 'required|string|max:50',
            'operational_status' => 'nullable|string|max:50',
            'operating_hours' => 'nullable|string|max:100',
            'supported_activities' => 'nullable|array',
            'capabilities' => 'nullable|array',
            'availability_rules' => 'nullable|array',
            'is_accessible' => 'nullable|boolean',
            'equipment_details' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['room_code'])) {
            $validated['room_code'] = strtoupper(str_replace(' ', '-', $validated['room_name']));
        }
        if (empty($validated['operational_status'])) {
            $validated['operational_status'] = $validated['status'] === 'Available' ? 'Available' : 'Maintenance';
        }
        if (empty($validated['operating_hours'])) {
            $validated['operating_hours'] = '7:00 AM - 7:00 PM';
        }

        Room::create($validated);

        return redirect()->back()->with('success', "Facility '{$validated['room_name']}' created successfully.");
    }

    /**
     * Update an existing facility.
     */
    public function update(Request $request, Room $room): RedirectResponse
    {
        $validated = $request->validate([
            'room_name' => 'required|string|max:100|unique:rooms,room_name,'.$room->id,
            'room_code' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'type' => 'required|string|max:50',
            'custom_type' => 'nullable|string|max:100',
            'capacity' => 'required|integer|min:1|max:500',
            'status' => 'required|string|max:50',
            'operational_status' => 'nullable|string|max:50',
            'operating_hours' => 'nullable|string|max:100',
            'supported_activities' => 'nullable|array',
            'capabilities' => 'nullable|array',
            'availability_rules' => 'nullable|array',
            'is_accessible' => 'nullable|boolean',
            'equipment_details' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $oldName = $room->room_name;
        $room->update($validated);

        // Update corresponding schedule references if name changed
        if ($oldName !== $validated['room_name']) {
            RoomSchedule::where('room_name', $oldName)->update(['room_name' => $validated['room_name']]);
            RoomComplaint::where('room_name', $oldName)->update(['room_name' => $validated['room_name']]);
            LabInventoryItem::where('room_id', $room->id)->update(['room_name' => $validated['room_name']]);
        }

        return redirect()->back()->with('success', "Facility '{$room->room_name}' updated successfully.");
    }

    /**
     * Delete a room.
     */
    public function destroy(Room $room): RedirectResponse
    {
        $name = $room->room_name;
        $room->delete();

        return redirect()->back()->with('success', "Facility '{$name}' deleted successfully from registry.");
    }

    /**
     * Find available room API / query.
     */
    public function findAvailable(Request $request)
    {
        $request->validate([
            'capacity' => 'nullable|integer',
            'facility_type' => 'nullable|string',
            'day_of_week' => 'nullable|string',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'require_workstations' => 'nullable|boolean',
            'require_projector' => 'nullable|boolean',
        ]);

        $query = Room::where('operational_status', 'Available')
            ->where('status', 'Available');

        if ($request->filled('capacity')) {
            $query->where('capacity', '>=', (int) $request->capacity);
        }

        if ($request->filled('facility_type') && $request->facility_type !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('type', $request->facility_type)
                    ->orWhere('custom_type', $request->facility_type);
            });
        }

        $results = $query->get()->filter(function ($r) use ($request) {
            $caps = $r->capabilities ?? [];
            if ($request->boolean('require_workstations') && empty($caps['num_workstations'])) {
                return false;
            }
            if ($request->boolean('require_projector') && empty($caps['has_projector'])) {
                return false;
            }

            // Check timetable conflicts if day and time specified
            if ($request->filled('day_of_week') && $request->filled('start_time') && $request->filled('end_time')) {
                $hasConflict = RoomSchedule::where('room_name', $r->room_name)
                    ->where('day_of_week', $request->day_of_week)
                    ->where(function ($q) use ($request) {
                        $q->whereBetween('start_time', [$request->start_time, $request->end_time])
                            ->orWhereBetween('end_time', [$request->start_time, $request->end_time]);
                    })
                    ->exists();

                if ($hasConflict) {
                    return false;
                }
            }

            return true;
        });

        return response()->json([
            'available_count' => $results->count(),
            'facilities' => $results->values(),
        ]);
    }

    /**
     * Submit a faculty complaint/problem report regarding a room.
     */
    public function reportProblem(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_name' => 'required|string',
            'room_id' => 'nullable|exists:rooms,id',
            'faculty_id' => 'nullable|exists:faculties,id',
            'complainant_name' => 'required|string|max:255',
            'complainant_email' => 'nullable|email|max:255',
            'issue_category' => 'required|string|in:Air Conditioning,Computers / Peripherals,Projector / Audio Visual,Electrical / Lighting,Furniture / Seating,Internet / LAN Connectivity,Cleanliness / Facilities,Other',
            'urgency' => 'required|in:Low,Medium,High,Critical',
            'description' => 'required|string|min:5|max:2000',
        ]);

        $validated['status'] = 'Submitted to Dean';

        if (empty($validated['room_id'])) {
            $matchedRoom = Room::where('room_name', $validated['room_name'])->first();
            if ($matchedRoom) {
                $validated['room_id'] = $matchedRoom->id;
            }
        }

        if (in_array($validated['urgency'], ['Critical', 'High']) && ! empty($validated['room_id'])) {
            $room = Room::find($validated['room_id']);
            if ($room && $room->status === 'Available') {
                $room->update(['status' => 'Under Repair', 'operational_status' => 'Maintenance']);
            }
        }

        RoomComplaint::create($validated);

        return redirect()->back()->with('success', 'Problem report submitted successfully and forwarded to the Dean.');
    }
}
