<?php

use App\Jobs\SyncComplianceSubmissionsJob;
use App\Jobs\SyncFacilityMonitoring;
use App\Jobs\SyncTvDisplayMonitoringSheet;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new SyncFacilityMonitoring)->everyFifteenMinutes();
Schedule::job(new SyncTvDisplayMonitoringSheet)->everyFifteenMinutes();
Schedule::job(new SyncComplianceSubmissionsJob)->everyThirtyMinutes();
