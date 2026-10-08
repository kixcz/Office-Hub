<?php

namespace App\Http\Controllers;

use App\Jobs\SyncFacilityMonitoring;
use App\Models\FacilityMonitoring;
use App\Models\RoomSchedule;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomMonitoringController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now(config('services.room_schedule.timezone'));
        $lastSync = Cache::get('facility_monitoring_last_sync');

        $schedules = RoomSchedule::query()
            ->orderBy('room_name')
            ->orderBy('start_time')
            ->get(['id', 'room_name', 'day_of_week', 'start_time', 'end_time', 'course_code', 'course_title', 'instructor', 'section']);

        return Inertia::render('monitoring/index', [
            'facilities' => FacilityMonitoring::orderBy('room_name')->get(),
            'rooms' => $schedules->pluck('room_name')->unique()->values(),
            'schedules' => $schedules,
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
}
