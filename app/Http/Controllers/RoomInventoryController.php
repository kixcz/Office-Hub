<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Faculty;
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
     * Display the Rooms & Laboratories inventory page.
     */
    public function index(Request $request): Response
    {
        $currentPeriod = AcademicPeriod::current();

        // Ensure baseline rooms are seeded if database is empty
        if (Room::count() === 0) {
            $rawRooms = RoomSchedule::select('room_name')
                ->distinct()
                ->whereNotNull('room_name')
                ->where('room_name', '!=', '')
                ->pluck('room_name');

            foreach ($rawRooms as $name) {
                $isLab = str_contains(strtolower($name), 'lab') || str_contains(strtolower($name), 'clr') || str_contains(strtolower($name), 'chs');
                Room::firstOrCreate(
                    ['room_name' => $name],
                    [
                        'building' => 'CIDS Main',
                        'floor' => '2nd Floor',
                        'type' => $isLab ? 'Laboratory' : 'Lecture',
                        'capacity' => $isLab ? 40 : 50,
                        'status' => 'Available',
                        'equipment_details' => $isLab ? '40 Desktop PCs, 2 Split AC units, 1 Projector, 1 Whiteboard' : '50 Armchairs, 2 Split AC units, 1 Smart TV / Projector',
                        'notes' => 'Synchronized from schedule master data',
                    ]
                );
            }
        }

        $rooms = Room::withCount([
            'complaints as active_complaints_count' => function ($q) {
                $q->whereIn('status', ['Submitted to Dean', 'Under Review', 'In Progress']);
            },
        ])->orderBy('room_name')->get()->map(function ($room) {
            $scheduledCount = RoomSchedule::where('room_name', $room->room_name)->count();

            return [
                'id' => $room->id,
                'room_name' => $room->room_name,
                'building' => $room->building,
                'floor' => $room->floor,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'status' => $room->status,
                'equipment_details' => $room->equipment_details,
                'notes' => $room->notes,
                'scheduled_count' => $scheduledCount,
                'active_complaints_count' => $room->active_complaints_count,
            ];
        });

        // Faculty list for complaint attribution if user is logged in
        $faculties = Faculty::orderBy('name')->get(['id', 'name', 'email']);

        // Recent complaints for modal/quick reference
        $recentComplaints = RoomComplaint::latest()->take(10)->get();

        return Inertia::render('schedule/master-data/rooms/index', [
            'currentPeriod' => $currentPeriod,
            'rooms' => $rooms,
            'faculties' => $faculties,
            'recentComplaints' => $recentComplaints,
        ]);
    }

    /**
     * Store a newly created room.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_name' => 'required|string|max:100|unique:rooms,room_name',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'type' => 'required|in:Laboratory,Lecture,Conference,Office,Other',
            'capacity' => 'required|integer|min:1|max:500',
            'status' => 'required|in:Available,In Use,Maintenance,Under Repair,Reserved',
            'equipment_details' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        Room::create($validated);

        return redirect()->back()->with('success', "Room '{$validated['room_name']}' created successfully.");
    }

    /**
     * Update an existing room.
     */
    public function update(Request $request, Room $room): RedirectResponse
    {
        $validated = $request->validate([
            'room_name' => 'required|string|max:100|unique:rooms,room_name,'.$room->id,
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'type' => 'required|in:Laboratory,Lecture,Conference,Office,Other',
            'capacity' => 'required|integer|min:1|max:500',
            'status' => 'required|in:Available,In Use,Maintenance,Under Repair,Reserved',
            'equipment_details' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $oldName = $room->room_name;
        $room->update($validated);

        // Update corresponding schedule references if name changed
        if ($oldName !== $validated['room_name']) {
            RoomSchedule::where('room_name', $oldName)->update(['room_name' => $validated['room_name']]);
            RoomComplaint::where('room_name', $oldName)->update(['room_name' => $validated['room_name']]);
        }

        return redirect()->back()->with('success', "Room '{$room->room_name}' updated successfully.");
    }

    /**
     * Delete a room.
     */
    public function destroy(Room $room): RedirectResponse
    {
        $name = $room->room_name;
        $room->delete();

        return redirect()->back()->with('success', "Room '{$name}' deleted successfully from inventory.");
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

        // Auto-link room_id if missing
        if (empty($validated['room_id'])) {
            $matchedRoom = Room::where('room_name', $validated['room_name'])->first();
            if ($matchedRoom) {
                $validated['room_id'] = $matchedRoom->id;
            }
        }

        // If urgency is critical or high, optionally update room status to Under Repair / Maintenance
        if (in_array($validated['urgency'], ['Critical', 'High']) && ! empty($validated['room_id'])) {
            $room = Room::find($validated['room_id']);
            if ($room && $room->status === 'Available') {
                $room->update(['status' => 'Under Repair']);
            }
        }

        RoomComplaint::create($validated);

        return redirect()->back()->with('success', 'Problem report submitted successfully and forwarded to the Dean.');
    }
}
