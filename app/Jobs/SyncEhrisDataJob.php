<?php

namespace App\Jobs;

use App\Services\EhrisIntegrationService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncEhrisDataJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 45;

    public int $uniqueFor = 180;

    /**
     * @var array<int, int>
     */
    public array $backoff = [5, 15, 30];

    public function __construct(
        public string $resource = 'all'
    ) {}

    public function uniqueId(): string
    {
        return 'sync_ehris_'.$this->resource;
    }

    public function handle(EhrisIntegrationService $ehrisService): void
    {
        if ($this->resource === 'locator_slips' || $this->resource === 'all') {
            $ehrisService->syncLocatorSlips();
        }

        if ($this->resource === 'travel_orders' || $this->resource === 'all') {
            $ehrisService->syncTravelOrders();
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::error('SyncEhrisDataJob failed permanently', [
            'resource' => $this->resource,
            'error' => $exception->getMessage(),
        ]);
    }
}
