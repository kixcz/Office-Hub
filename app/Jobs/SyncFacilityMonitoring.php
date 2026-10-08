<?php

namespace App\Jobs;

use App\Models\FacilityMonitoring;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncFacilityMonitoring implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $csvUrl = env('CLASSROOM_MONITORING_CSV_URL');
        $csvData = [];

        if ($csvUrl) {
            try {
                $response = Http::get($csvUrl);
                if ($response->successful()) {
                    $csvString = $response->body();
                    $lines = explode("\n", trim($csvString));
                    $headers = str_getcsv(array_shift($lines));
                    // Normalize headers
                    $headers = array_map(function ($h) {
                        return strtolower(trim(str_replace(' ', '_', $h)));
                    }, $headers);

                    foreach ($lines as $line) {
                        if (trim($line) === '') {
                            continue;
                        }
                        $row = str_getcsv($line);
                        // Pad row to match headers count if necessary
                        $row = array_pad($row, count($headers), null);
                        if (count($row) === count($headers)) {
                            $data = array_combine($headers, $row);
                            $csvData[] = [
                                'room_name' => $data['room_name'] ?? null,
                                'room_type' => $data['room_type'] ?? null,
                                'current_class' => ! empty($data['current_class']) ? $data['current_class'] : null,
                                'program' => ! empty($data['program']) ? $data['program'] : null,
                                'instructor' => ! empty($data['instructor']) ? $data['instructor'] : null,
                                'start_time' => ! empty($data['start_time']) ? $data['start_time'] : null,
                                'end_time' => ! empty($data['end_time']) ? $data['end_time'] : null,
                                'status' => ! empty($data['status']) ? $data['status'] : 'Available',
                                'remarks' => ! empty($data['remarks']) ? $data['remarks'] : null,
                                'next_schedule' => ! empty($data['next_schedule']) ? $data['next_schedule'] : null,
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to sync classroom monitoring from CSV: '.$e->getMessage());
            }
        }

        if (! empty($csvData)) {
            FacilityMonitoring::truncate();
            foreach ($csvData as $data) {
                FacilityMonitoring::create($data);
            }
            Cache::put('facility_monitoring_last_sync', now(), now()->addHours(24));
        } else {
            Log::warning('No classroom monitoring data fetched. Kept existing data to preserve TV Display.');
        }
    }
}
