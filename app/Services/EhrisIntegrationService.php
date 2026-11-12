<?php

namespace App\Services;

use App\Jobs\SyncEhrisDataJob;
use App\Models\Faculty;
use App\Models\LocatorSlip;
use App\Models\TravelOrder;
use Carbon\Carbon;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EhrisIntegrationService
{
    public const LOCATOR_SLIPS_SYNC_CACHE_KEY = 'officehub_ehris_locator_slips_sync_status_v1';

    public const TRAVEL_ORDERS_SYNC_CACHE_KEY = 'officehub_ehris_travel_orders_sync_status_v1';

    public const SYNC_FRESHNESS_SECONDS = 300; // 5 minutes

    protected string $baseUrl;

    protected string $travelOrderToken;

    protected string $locatorSlipToken;

    /**
     * @var array{fetched: int, matched: int, error: ?string}
     */
    public array $lastSyncStats = ['fetched' => 0, 'matched' => 0, 'error' => null];

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('services.ehris.base_url', 'http://hris2.dssc.edu.ph:1952/api/v1'), '/');
        $this->travelOrderToken = (string) config('services.ehris.travel_order_token', 'SbKZPf9ielpjqLyPc5wUq4YfENWrR6zIfnyomukWQ3D68pKfm7wARIRPfLa5');
        $this->locatorSlipToken = (string) config('services.ehris.locator_slip_token', 'QsHyg9PjH2TNyY4YFZ6jxUnZ1UuHtu7YSm8S9dm37LYVTOG3c6Cj1Q1TRPl2');
    }

    /**
     * Get the synchronization status metadata for Locator Slips or Travel Orders.
     *
     * @return array{last_synced_at: ?string, is_stale: bool, status: string, last_error: ?string, fetched: int, matched: int}
     */
    public function getSyncStatus(string $type = 'locator_slips'): array
    {
        $key = $type === 'travel_orders' ? self::TRAVEL_ORDERS_SYNC_CACHE_KEY : self::LOCATOR_SLIPS_SYNC_CACHE_KEY;
        $cached = Cache::get($key);

        if (! is_array($cached)) {
            return [
                'last_synced_at' => null,
                'is_stale' => true,
                'status' => 'idle',
                'last_error' => null,
                'fetched' => 0,
                'matched' => 0,
            ];
        }

        $timestamp = $cached['timestamp'] ?? 0;
        $isStale = (time() - (int) $timestamp) > self::SYNC_FRESHNESS_SECONDS;

        return [
            'last_synced_at' => $cached['last_synced_at'] ?? null,
            'is_stale' => $isStale,
            'status' => $cached['status'] ?? 'ok',
            'last_error' => $cached['last_error'] ?? null,
            'fetched' => (int) ($cached['fetched'] ?? 0),
            'matched' => (int) ($cached['matched'] ?? 0),
        ];
    }

    /**
     * Check whether the given integration resource is stale and should be synced in the background.
     */
    public function isSyncStale(string $type = 'locator_slips'): bool
    {
        return $this->getSyncStatus($type)['is_stale'];
    }

    /**
     * Queue a non-blocking background synchronization job if stale and not already queued.
     */
    public function queueSyncIfStale(string $type = 'locator_slips'): void
    {
        if (! $this->isSyncStale($type)) {
            return;
        }

        $dispatchGuardKey = "officehub_ehris_sync_queued_{$type}";
        if (Cache::has($dispatchGuardKey)) {
            return;
        }

        Cache::put($dispatchGuardKey, true, self::SYNC_FRESHNESS_SECONDS);

        $key = $type === 'travel_orders' ? self::TRAVEL_ORDERS_SYNC_CACHE_KEY : self::LOCATOR_SLIPS_SYNC_CACHE_KEY;
        $previous = Cache::get($key, []);
        Cache::put($key, array_merge(is_array($previous) ? $previous : [], [
            'last_synced_at' => $previous['last_synced_at'] ?? null,
            'timestamp' => time(),
            'status' => $previous['status'] ?? 'syncing',
            'last_error' => $previous['last_error'] ?? null,
            'fetched' => (int) ($previous['fetched'] ?? 0),
            'matched' => (int) ($previous['matched'] ?? 0),
        ]), 3600);

        SyncEhrisDataJob::dispatch($type);
    }

    /**
     * Build lookup maps for all local Faculty in OfficeHub directory.
     */
    protected function getFacultyLookup(): array
    {
        $faculties = Faculty::with('program')->get();
        $byName = [];
        $byLastName = [];
        $byEmail = [];
        $byId = [];

        foreach ($faculties as $f) {
            $fullName = strtolower(trim($f->first_name.' '.$f->last_name));
            $reverseName = strtolower(trim($f->last_name.' '.$f->first_name));
            $commaName = strtolower(trim($f->last_name.', '.$f->first_name));

            $byName[$fullName] = $f;
            $byName[$reverseName] = $f;
            $byName[$commaName] = $f;

            if ($f->last_name) {
                $byLastName[strtolower(trim($f->last_name))] = $f;
            }
            if ($f->email) {
                $byEmail[strtolower(trim($f->email))] = $f;
            }
            if ($f->faculty_id) {
                $byId[strtolower(trim($f->faculty_id))] = $f;
            }
        }

        return [$byName, $byLastName, $byEmail, $byId];
    }

    /**
     * Match an employee from e-HRIS to a local Faculty member.
     */
    protected function matchFaculty(array $employee, array $byName, array $byLastName, array $byEmail, array $byId): ?Faculty
    {
        $agencyId = strtolower(trim($employee['agency_id'] ?? $employee['agencyid'] ?? $employee['employee_id'] ?? ''));
        $email = strtolower(trim($employee['email'] ?? ''));
        $rawName = strtolower(trim($employee['name'] ?? $employee['fullname'] ?? ''));
        $firstname = strtolower(trim($employee['firstname'] ?? ''));
        $lastname = strtolower(trim($employee['lastname'] ?? ''));

        // 1. Match by agency id
        if ($agencyId && isset($byId[$agencyId])) {
            return $byId[$agencyId];
        }

        // 2. Match by email
        if ($email && isset($byEmail[$email])) {
            return $byEmail[$email];
        }

        // 3. Match by firstname + lastname
        if ($firstname && $lastname && isset($byName[$firstname.' '.$lastname])) {
            return $byName[$firstname.' '.$lastname];
        }

        // 4. Match cleaned rawName
        if ($rawName) {
            // Strip trailing/leading punctuation, middle initials, suffixes like 'N/A'
            $cleanName = preg_replace('/[^a-z\s]/', '', $rawName);
            $cleanName = trim(preg_replace('/\s+/', ' ', $cleanName));

            if (isset($byName[$cleanName])) {
                return $byName[$cleanName];
            }

            foreach ($byName as $dirName => $f) {
                if (str_contains($rawName, $dirName) || str_contains($dirName, $cleanName)) {
                    return $f;
                }
            }

            // Check match by first and last name components
            if ($lastname && isset($byLastName[$lastname])) {
                $candidate = $byLastName[$lastname];
                if ($firstname && (str_contains($candidate->first_name, $firstname) || str_contains($firstname, strtolower($candidate->first_name)))) {
                    return $candidate;
                }
            }
        }

        return null;
    }

    /**
     * Sync Locator Slips from live e-HRIS API for directory faculty.
     * Uses concurrent HTTP pooling and bounded timeouts while preserving local snapshots on failure.
     */
    public function syncLocatorSlips(): array
    {
        [$byName, $byLastName, $byEmail, $byId] = $this->getFacultyLookup();
        $slipsList = [];
        $syncError = null;
        $startTime = microtime(true);

        try {
            $responses = Http::pool(fn (Pool $pool) => [
                $pool->as('page_1')->withHeaders([
                    'Authorization' => 'Bearer '.$this->locatorSlipToken,
                    'Accept' => 'application/json',
                ])->connectTimeout(3)->timeout(6)->get($this->baseUrl.'/locator-slips', [
                    'page' => 1,
                    'per_page' => 100,
                ]),
                $pool->as('page_2')->withHeaders([
                    'Authorization' => 'Bearer '.$this->locatorSlipToken,
                    'Accept' => 'application/json',
                ])->connectTimeout(3)->timeout(6)->get($this->baseUrl.'/locator-slips', [
                    'page' => 2,
                    'per_page' => 100,
                ]),
                $pool->as('page_3')->withHeaders([
                    'Authorization' => 'Bearer '.$this->locatorSlipToken,
                    'Accept' => 'application/json',
                ])->connectTimeout(3)->timeout(6)->get($this->baseUrl.'/locator-slips', [
                    'page' => 3,
                    'per_page' => 100,
                ]),
            ]);

            foreach (['page_1', 'page_2', 'page_3'] as $pageKey) {
                $response = $responses[$pageKey] ?? null;
                if ($response instanceof Response && $response->successful()) {
                    $json = $response->json();
                    $items = $json['data']['locator_slips'] ?? $json['data'] ?? [];
                    if (! empty($items) && is_array($items)) {
                        $slipsList = array_merge($slipsList, $items);
                    }
                } elseif ($response instanceof \Throwable && $pageKey === 'page_1') {
                    throw $response;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('e-HRIS locator slips sync failed (preserving local snapshot): '.$e->getMessage(), [
                'duration_ms' => round((microtime(true) - $startTime) * 1000, 1),
            ]);
            $syncError = $e->getMessage();
        }

        $matched = 0;
        foreach ($slipsList as $item) {
            $employee = $item['employee'] ?? [];
            $faculty = $this->matchFaculty($employee, $byName, $byLastName, $byEmail, $byId);

            // Filter strictly to faculty present in the local database directory
            if ($faculty) {
                $matched++;
                $trackingNumber = $item['tracking_number'] ?? ('LS-'.$item['id']);
                $guardDep = $item['guard_logs']['departure'] ?? [];
                $guardArr = $item['guard_logs']['arrival'] ?? [];

                $depTime = null;
                if (! empty($guardDep['time'])) {
                    try {
                        $depTime = Carbon::parse($guardDep['time'])->format('H:i:s');
                    } catch (\Throwable) {
                        $depTime = null;
                    }
                }

                $arrTime = null;
                if (! empty($guardArr['time'])) {
                    try {
                        $arrTime = Carbon::parse($guardArr['time'])->format('H:i:s');
                    } catch (\Throwable) {
                        $arrTime = null;
                    }
                }

                $filingDate = now()->toDateString();
                if (! empty($item['date_filing'])) {
                    try {
                        $filingDate = Carbon::parse($item['date_filing'])->toDateString();
                    } catch (\Throwable) {
                        $filingDate = now()->toDateString();
                    }
                }

                $status = $item['status_label'] ?? 'Approved';
                if ($depTime && ! $arrTime) {
                    $status = 'Departed';
                } elseif ($arrTime) {
                    $status = 'Returned';
                }

                LocatorSlip::updateOrCreate(
                    ['slip_number' => $trackingNumber],
                    [
                        'faculty_id' => $faculty->id,
                        'faculty_name' => $faculty->first_name.' '.$faculty->last_name,
                        'destination' => $item['destination'] ?? 'Office Transaction',
                        'purpose' => $item['purpose'] ?? 'Official Department Business',
                        'date' => $filingDate,
                        'time_out' => '08:00:00',
                        'time_in' => '17:00:00',
                        'actual_time_out' => $depTime,
                        'actual_time_in' => $arrTime,
                        'slip_type' => ($item['category']['is_official_business'] ?? false) ? 'Official' : (($item['category']['is_personal'] ?? false) ? 'Personal' : 'Official'),
                        'status' => $status,
                        'approver_name' => $item['signatories'][1]['name'] ?? ($item['signatories'][0]['name'] ?? 'Approving Authority'),
                        'guard_on_duty' => $guardDep['guard_name'] ?? ($guardArr['guard_name'] ?? 'Security Officer'),
                        'guard_remarks' => ! empty($guardDep['time_formatted']) ? ('Departed at '.$guardDep['time_formatted']) : null,
                        'remarks' => "Synced live from e-HRIS (ID: {$item['id']})",
                        'ehris_id' => (string) $item['id'],
                    ]
                );
            }
        }

        $this->lastSyncStats = ['fetched' => count($slipsList), 'matched' => $matched, 'error' => $syncError ?? null];

        $previousStatus = Cache::get(self::LOCATOR_SLIPS_SYNC_CACHE_KEY, []);
        Cache::put(self::LOCATOR_SLIPS_SYNC_CACHE_KEY, [
            'last_synced_at' => $syncError ? ($previousStatus['last_synced_at'] ?? now()->format('M d, Y h:i A')) : now()->format('M d, Y h:i A'),
            'timestamp' => time(),
            'status' => $syncError ? 'offline_snapshot' : 'ok',
            'last_error' => $syncError,
            'fetched' => count($slipsList),
            'matched' => $matched,
        ], 3600);

        return LocatorSlip::with('faculty.program')->orderBy('date', 'desc')->get()->toArray();
    }

    /**
     * Sync Travel Orders from live e-HRIS API for directory faculty.
     * Uses concurrent HTTP pooling and bounded timeouts while preserving local snapshots on failure.
     */
    public function syncTravelOrders(): array
    {
        [$byName, $byLastName, $byEmail, $byId] = $this->getFacultyLookup();
        $travelList = [];
        $syncError = null;
        $startTime = microtime(true);

        try {
            $responses = Http::pool(fn (Pool $pool) => [
                $pool->as('page_1')->withHeaders([
                    'Authorization' => 'Bearer '.$this->travelOrderToken,
                    'Accept' => 'application/json',
                ])->connectTimeout(3)->timeout(6)->get($this->baseUrl.'/travel-orders', [
                    'page' => 1,
                    'per_page' => 100,
                ]),
                $pool->as('page_2')->withHeaders([
                    'Authorization' => 'Bearer '.$this->travelOrderToken,
                    'Accept' => 'application/json',
                ])->connectTimeout(3)->timeout(6)->get($this->baseUrl.'/travel-orders', [
                    'page' => 2,
                    'per_page' => 100,
                ]),
                $pool->as('page_3')->withHeaders([
                    'Authorization' => 'Bearer '.$this->travelOrderToken,
                    'Accept' => 'application/json',
                ])->connectTimeout(3)->timeout(6)->get($this->baseUrl.'/travel-orders', [
                    'page' => 3,
                    'per_page' => 100,
                ]),
            ]);

            foreach (['page_1', 'page_2', 'page_3'] as $pageKey) {
                $response = $responses[$pageKey] ?? null;
                if ($response instanceof Response && $response->successful()) {
                    $json = $response->json();
                    $items = $json['data']['travel_orders'] ?? $json['data'] ?? [];
                    if (! empty($items) && is_array($items)) {
                        $travelList = array_merge($travelList, $items);
                    }
                } elseif ($response instanceof \Throwable && $pageKey === 'page_1') {
                    throw $response;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('e-HRIS travel orders sync failed (preserving local snapshot): '.$e->getMessage(), [
                'duration_ms' => round((microtime(true) - $startTime) * 1000, 1),
            ]);
            $syncError = $e->getMessage();
        }

        $matched = 0;
        foreach ($travelList as $item) {
            $traveler = $item['primary_traveler'] ?? [];
            $faculty = $this->matchFaculty($traveler, $byName, $byLastName, $byEmail, $byId);

            // Also check travel order members if primary traveler is someone else
            if (! $faculty && ! empty($item['members'])) {
                foreach ($item['members'] as $member) {
                    $mFaculty = $this->matchFaculty($member, $byName, $byLastName, $byEmail, $byId);
                    if ($mFaculty) {
                        $faculty = $mFaculty;
                        break;
                    }
                }
            }

            if ($faculty) {
                $matched++;
                $trackingNumber = $item['tracking_number'] ?? ('TO-'.$item['id']);
                $dates = $item['dates'] ?? [];
                $startDate = ! empty($dates['departure_date']) ? Carbon::parse($dates['departure_date'])->toDateString() : now()->toDateString();
                $endDate = ! empty($dates['return_date']) ? Carbon::parse($dates['return_date'])->toDateString() : $startDate;

                $rawStatus = is_array($item['status']) ? ($item['status']['name'] ?? 'Approved') : $item['status'];
                $status = 'Approved';
                if (strtolower($rawStatus) === 'ongoing') {
                    $status = 'In Progress';
                } elseif (strtolower($rawStatus) === 'completed') {
                    $status = 'Completed';
                } elseif (strtolower($rawStatus) === 'cancelled') {
                    $status = 'Cancelled';
                }

                $trans = $item['transportation_and_privileges'] ?? [];
                $withPerDiem = ! empty($trans['official_business']);

                $approver = 'College Dean / University President';
                if (! empty($item['signatories'])) {
                    $lastSig = end($item['signatories']);
                    if (! empty($lastSig['name'])) {
                        $approver = $lastSig['name'];
                    }
                }

                $creatorName = null;
                if (! empty($item['applicant']['name'])) {
                    $creatorName = $item['applicant']['name'];
                } elseif (! empty($item['created_by']['name'])) {
                    $creatorName = $item['created_by']['name'];
                }

                TravelOrder::updateOrCreate(
                    ['tracking_number' => $trackingNumber],
                    [
                        'faculty_id' => $faculty->id,
                        'faculty_name' => $faculty->first_name.' '.$faculty->last_name,
                        'created_by_name' => $creatorName ?: ($faculty->first_name.' '.$faculty->last_name),
                        'destination' => $item['destination'] ?? 'Official Destination',
                        'purpose' => $item['purpose'] ?? 'Official College Business',
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'status' => $status,
                        'travel_type' => ! empty($trans['official_business']) ? 'Official Business' : 'Official Time',
                        'with_per_diem' => $withPerDiem,
                        'estimated_budget' => 0.00,
                        'approver_name' => $approver,
                        'approver_role' => 'Approving Authority',
                        'approved_at' => ! empty($item['created_at']) ? Carbon::parse($item['created_at']) : now(),
                        'remarks' => "Synced live from e-HRIS (ID: {$item['id']})",
                        'ehris_id' => (string) $item['id'],
                    ]
                );
            }
        }

        $this->lastSyncStats = ['fetched' => count($travelList), 'matched' => $matched, 'error' => $syncError ?? null];

        $previousStatus = Cache::get(self::TRAVEL_ORDERS_SYNC_CACHE_KEY, []);
        Cache::put(self::TRAVEL_ORDERS_SYNC_CACHE_KEY, [
            'last_synced_at' => $syncError ? ($previousStatus['last_synced_at'] ?? now()->format('M d, Y h:i A')) : now()->format('M d, Y h:i A'),
            'timestamp' => time(),
            'status' => $syncError ? 'offline_snapshot' : 'ok',
            'last_error' => $syncError,
            'fetched' => count($travelList),
            'matched' => $matched,
        ], 3600);

        return TravelOrder::with('faculty.program')->orderBy('start_date', 'desc')->get()->toArray();
    }
}
