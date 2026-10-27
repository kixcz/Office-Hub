<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\LocatorSlip;
use App\Models\TravelOrder;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EhrisIntegrationService
{
    protected string $baseUrl;

    protected string $travelOrderToken;

    protected string $locatorSlipToken;

    public function __construct()
    {
        $this->baseUrl = config('services.ehris.base_url', 'http://hris2.dssc.edu.ph:1952/api/v1');
        $this->travelOrderToken = config('services.ehris.travel_order_token', 'SbKZPf9ielpjqLyPc5wUq4YfENWrR6zIfnyomukWQ3D68pKfm7wARIRPfLa5');
        $this->locatorSlipToken = config('services.ehris.locator_slip_token', 'QsHyg9PjH2TNyY4YFZ6jxUnZ1UuHtu7YSm8S9dm37LYVTOG3c6Cj1Q1TRPl2');
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
     */
    public function syncLocatorSlips(): array
    {
        [$byName, $byLastName, $byEmail, $byId] = $this->getFacultyLookup();
        $slipsList = [];

        try {
            // Fetch multiple pages (up to 300 recent slips) to ensure we find all faculty slips
            for ($page = 1; $page <= 3; $page++) {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$this->locatorSlipToken,
                    'Accept' => 'application/json',
                ])->timeout(8)->get($this->baseUrl.'/locator-slips', [
                    'page' => $page,
                    'per_page' => 100,
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $items = $json['data']['locator_slips'] ?? $json['data'] ?? [];
                    if (empty($items)) {
                        break;
                    }
                    $slipsList = array_merge($slipsList, $items);
                } else {
                    break;
                }
            }
        } catch (\Throwable $e) {
            Log::error('e-HRIS locator slips sync failed: '.$e->getMessage());
        }

        foreach ($slipsList as $item) {
            $employee = $item['employee'] ?? [];
            $faculty = $this->matchFaculty($employee, $byName, $byLastName, $byEmail, $byId);

            // Filter strictly to faculty present in the local database directory
            if ($faculty) {
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

        return LocatorSlip::with('faculty.program')->orderBy('date', 'desc')->get()->toArray();
    }

    /**
     * Sync Travel Orders from live e-HRIS API for directory faculty.
     */
    public function syncTravelOrders(): array
    {
        [$byName, $byLastName, $byEmail, $byId] = $this->getFacultyLookup();
        $travelList = [];

        try {
            for ($page = 1; $page <= 3; $page++) {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$this->travelOrderToken,
                    'Accept' => 'application/json',
                ])->timeout(8)->get($this->baseUrl.'/travel-orders', [
                    'page' => $page,
                    'per_page' => 100,
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $items = $json['data']['travel_orders'] ?? $json['data'] ?? [];
                    if (empty($items)) {
                        break;
                    }
                    $travelList = array_merge($travelList, $items);
                } else {
                    break;
                }
            }
        } catch (\Throwable $e) {
            Log::error('e-HRIS travel orders sync failed: '.$e->getMessage());
        }

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

                TravelOrder::updateOrCreate(
                    ['tracking_number' => $trackingNumber],
                    [
                        'faculty_id' => $faculty->id,
                        'faculty_name' => $faculty->first_name.' '.$faculty->last_name,
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

        return TravelOrder::with('faculty.program')->orderBy('start_date', 'desc')->get()->toArray();
    }
}
