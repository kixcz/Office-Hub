<?php

namespace App\Http\Controllers;

use App\Jobs\SyncFacilityMonitoring;
use App\Models\FacilityMonitoring;
use App\Models\Faculty;
use App\Models\RoomSchedule;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomMonitoringController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now(config('services.room_schedule.timezone'));
        $lastSync = Cache::get('facility_monitoring_last_sync');

        $schedules = RoomSchedule::with(['faculty.program'])
            ->orderBy('room_name')
            ->orderBy('start_time')
            ->get();

        $faculties = Faculty::with('program')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('monitoring/index', [
            'facilities' => FacilityMonitoring::with('faculty')->orderBy('room_name')->get(),
            'rooms' => $schedules->pluck('room_name')->unique()->values(),
            'schedules' => $schedules,
            'faculties' => $faculties,
            'today' => $now->format('l'),
            'current_time' => $now->format('H:i'),
            'last_updated' => $lastSync ? Carbon::parse($lastSync)->format('M d, Y h:i A') : 'Never',
        ]);
    }

    public function sync(): RedirectResponse
    {
        SyncFacilityMonitoring::dispatchSync();

        return redirect()->back()->with('success', 'Classroom monitoring data synchronized successfully.');
    }

    public function linkFaculty(Request $request, RoomSchedule $schedule): RedirectResponse
    {
        $validated = $request->validate([
            'faculty_id' => 'nullable|exists:faculties,id',
        ]);

        $schedule->update([
            'faculty_id' => $validated['faculty_id'] ?? null,
        ]);

        if (! empty($validated['faculty_id']) && $schedule->instructor) {
            $faculty = Faculty::find($validated['faculty_id']);
            if ($faculty && empty($faculty->spreadsheet_name)) {
                $faculty->update(['spreadsheet_name' => $schedule->instructor]);
            }
        }

        SyncFacilityMonitoring::refreshSnapshot(Carbon::now(config('services.room_schedule.timezone')));

        return redirect()->back()->with('success', 'Faculty assignment updated successfully.');
    }
}
