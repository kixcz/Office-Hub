<?php

use App\Jobs\SyncComplianceSubmissionsJob;
use App\Jobs\SyncEhrisDataJob;
use App\Jobs\SyncFacilityMonitoring;
use App\Jobs\SyncGoogleSheetsAttendanceJob;
use App\Jobs\SyncTvDisplayMonitoringSheet;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new SyncFacilityMonitoring)->everyFifteenMinutes()->withoutOverlapping(10);
Schedule::job(new SyncTvDisplayMonitoringSheet)->everyFifteenMinutes()->withoutOverlapping(10);
Schedule::job(new SyncGoogleSheetsAttendanceJob)->everyFifteenMinutes()->withoutOverlapping(10);
Schedule::job(new SyncEhrisDataJob('all'))->everyFiveMinutes()->withoutOverlapping(5);
Schedule::job(new SyncComplianceSubmissionsJob)->everyThirtyMinutes()->withoutOverlapping(15);
