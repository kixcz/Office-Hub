<?php

namespace App\Http\Controllers;

use App\Jobs\SyncFacilityMonitoring;
use App\Models\FacilityMonitoring;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ClassroomMonitoringController extends Controller
{
    public function index()
    {
        $facilities = FacilityMonitoring::orderBy('room_name')->get();
        $lastSync = Cache::get('facility_monitoring_last_sync', now());

        return Inertia::render('monitoring/index', [
            'facilities' => $facilities,
            'last_updated' => Carbon::parse($lastSync)->format('M d, Y h:i A'),
        ]);
    }

    public function sync()
    {
        SyncFacilityMonitoring::dispatchSync();

        return redirect()->back()->with('success', 'Classroom monitoring data synchronized successfully.');
    }
}
