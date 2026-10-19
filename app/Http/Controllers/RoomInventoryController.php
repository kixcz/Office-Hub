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

        // Ensure comprehensive baseline rooms and laboratories are populated
        $allExpectedRooms = [
            'CLR 1' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Laboratory', 'capacity' => 40, 'equipment_details' => '40 Desktop PCs, 2 Split AC, 1 Projector, 1 Whiteboard'],
            'CLR 2' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Laboratory', 'capacity' => 40, 'equipment_details' => '40 Desktop PCs, 2 Split AC, 1 Projector, 1 Whiteboard'],
            'CLR 3' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Laboratory', 'capacity' => 40, 'equipment_details' => '40 Desktop PCs, 2 Split AC, 1 Projector, 1 Whiteboard'],
            'CLR 4' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Laboratory', 'capacity' => 40, 'equipment_details' => '40 Desktop PCs, 2 Split AC, 1 Projector, 1 Whiteboard'],
            'CLR 4 (Mac Lab)' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Laboratory', 'capacity' => 35, 'equipment_details' => '35 Apple iMacs, 2 Split AC, 1 Interactive Display, Sound System'],
            'CLR 5' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Laboratory', 'capacity' => 40, 'equipment_details' => '40 Desktop PCs, 2 Split AC, 1 Projector, 1 Whiteboard'],
            'CLR 5 (Network Lab)' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Laboratory', 'capacity' => 35, 'equipment_details' => 'Cisco Routers, Switches, Patch Panels, 35 Workstations, 2 Split AC'],
            'Multimedia Studio' => ['building' => 'CIDS Annex', 'floor' => '3rd Floor', 'type' => 'Laboratory', 'capacity' => 30, 'equipment_details' => 'Green Screen, Professional Audio/Lighting, 4K Cameras, Editing Suite'],
            'CHS' => ['building' => 'CIDS Main', 'floor' => '1st Floor', 'type' => 'Lecture', 'capacity' => 60, 'equipment_details' => '60 Armchairs, 2 Split AC, 1 Smart TV, 1 Sound System'],
            'COM 1' => ['building' => 'CIDS Main', 'floor' => '1st Floor', 'type' => 'Laboratory', 'capacity' => 45, 'equipment_details' => '45 Desktop PCs, 2 Split AC, 1 Projector, 1 Whiteboard'],
            'Room 301' => ['building' => 'CIDS Main', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 50, 'equipment_details' => '50 Armchairs, 2 Wall Fans, 1 Projector, 1 Whiteboard'],
            'Room 302' => ['building' => 'CIDS Main', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 50, 'equipment_details' => '50 Armchairs, 2 Wall Fans, 1 Projector, 1 Whiteboard'],
            'Room 303' => ['building' => 'CIDS Main', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 50, 'equipment_details' => '50 Armchairs, 2 Wall Fans, 1 Projector, 1 Whiteboard'],
            'Room 304' => ['building' => 'CIDS Main', 'floor' => '3rd Floor', 'type' => 'Lecture', 'capacity' => 50, 'equipment_details' => '50 Armchairs, 2 Wall Fans, 1 Projector, 1 Whiteboard'],
            'Conference Room' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Conference', 'capacity' => 25, 'equipment_details' => 'Executive Conference Table, 25 Swivel Chairs, 75-inch Display, Video Conference Bar'],
            'Dean\'s Office' => ['building' => 'CIDS Main', 'floor' => '2nd Floor', 'type' => 'Office', 'capacity' => 10, 'equipment_details' => 'Executive Desk, Consultation Table, 2 Split AC, Computer Workstation'],
        ];

        // Also fetch any other distinct room names from RoomSchedule
        $scheduleRooms = RoomSchedule::select('room_name')
            ->distinct()
            ->whereNotNull('room_name')
            ->where('room_name', '!=', '')
            ->pluck('room_name')
            ->toArray();

        foreach ($scheduleRooms as $name) {
            if (! isset($allExpectedRooms[$name])) {
                $isLab = str_contains(strtolower($name), 'lab') || str_contains(strtolower($name), 'clr') || str_contains(strtolower($name), 'studio');
                $allExpectedRooms[$name] = [
                    'building' => 'CIDS Main',
                    'floor' => '2nd Floor',
                    'type' => $isLab ? 'Laboratory' : 'Lecture',
                    'capacity' => $isLab ? 40 : 50,
                    'equipment_details' => $isLab ? 'Computer Lab Workstations, 2 Split AC, 1 Projector' : 'Standard lecture seating, Projector/Screen',
                ];
            }
        }

        foreach ($allExpectedRooms as $name => $meta) {
            Room::firstOrCreate(
                ['room_name' => $name],
                [
                    'building' => $meta['building'],
                    'floor' => $meta['floor'],
                    'type' => $meta['type'],
                    'capacity' => $meta['capacity'],
                    'status' => 'Available',
                    'equipment_details' => $meta['equipment_details'],
                    'notes' => 'Official CIDS Room & Laboratory Inventory',
                ]
            );
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
        $faculties = Faculty::orderBy('last_name')->get()->map(function ($f) {
            return [
                'id' => $f->id,
                'name' => $f->full_name,
                'email' => $f->email ?? '',
            ];
        });

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
