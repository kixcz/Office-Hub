<?php

namespace App\Jobs;

use App\Services\GoogleSheetsAttendanceService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncGoogleSheetsAttendanceJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 90;

    public int $uniqueFor = 300;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 30];

    public function __construct(
        public string $spreadsheetId = GoogleSheetsAttendanceService::DEFAULT_SPREADSHEET_ID,
        public string $gid = GoogleSheetsAttendanceService::DEFAULT_GID
    ) {}

    public function uniqueId(): string
    {
        return 'sync_gsheets_attendance_'.$this->spreadsheetId;
    }

    public function handle(GoogleSheetsAttendanceService $sheetsService): void
    {
        $sheetsService->sync($this->spreadsheetId, $this->gid);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('SyncGoogleSheetsAttendanceJob failed permanently', [
            'spreadsheet_id' => $this->spreadsheetId,
            'error' => $exception->getMessage(),
        ]);
    }
}
