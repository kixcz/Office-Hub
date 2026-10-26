<?php

namespace App\Jobs;

use App\Services\ComplianceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncComplianceSubmissionsJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        try {
            ComplianceService::syncPendingSubmissions();
            Log::info('Successfully synchronized pending compliance submissions in background job.');
        } catch (\Throwable $e) {
            Log::warning('SyncComplianceSubmissionsJob error: '.$e->getMessage());
        }
    }
}
