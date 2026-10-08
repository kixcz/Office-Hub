<?php
use App\Models\FacilityMonitoring;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

$spreadsheetId = env('GOOGLE_SHEETS_SPREADSHEET_ID');
$apiKey = env('GOOGLE_SHEETS_API_KEY');
echo "ID: $spreadsheetId, Key: $apiKey\n";

$metaResponse = Http::withoutVerifying()->get("https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}?key={$apiKey}");
$meta = $metaResponse->json();
$sheets = $meta['sheets'] ?? [];
echo "Found " . count($sheets) . " sheets\n";

$now = Carbon::now('Asia/Singapore');
$dayOfWeek = $now->format('l'); // 'Monday', 'Tuesday', etc.
echo "Day: $dayOfWeek, Time: " . $now->format('H:i') . "\n";

$dayColumns = [
    'Monday' => 2,
    'Tuesday' => 10,
    'Wednesday' => 18,
    'Thursday' => 26,
    'Friday' => 34,
];
$colIdx = $dayColumns[$dayOfWeek] ?? -1;

$facilityData = [];
foreach ($sheets as $sheet) {
    $sheetTitle = $sheet['properties']['title'] ?? '';
    if (strtolower($sheetTitle) === 'summary' || empty($sheetTitle)) continue;

    $sheetResponse = Http::withoutVerifying()->get("https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/{$sheetTitle}!A1:Z30?key={$apiKey}");
    $values = $sheetResponse->json('values') ?? [];

    echo "Sheet: $sheetTitle, rows: " . count($values) . "\n";
    if ($colIdx !== -1 && count($values) > 2) {
        $timeCol = $colIdx + 1;
        $instructorCol = $colIdx + 2;
        $statusCol = $colIdx + 3;
        
        $currentInstructor = null;
        $currentStatus = 'Available';
        $currentStart = null;
        $currentEnd = null;
        $nextSchedule = null;
        $foundCurrent = false;

        for ($i = 2; $i < count($values); $i++) {
            $row = $values[$i];
            $timeStr = $row[$timeCol] ?? '';
            $instructor = $row[$instructorCol] ?? '';
            $status = $row[$statusCol] ?? '';
            
            if (empty(trim($timeStr))) continue;
            
            $times = explode('-', $timeStr);
            if (count($times) == 2) {
                try {
                    $start = Carbon::createFromFormat('g:ia', trim($times[0]), 'Asia/Singapore')->setDate($now->year, $now->month, $now->day);
                    $end = Carbon::createFromFormat('g:ia', trim($times[1]), 'Asia/Singapore')->setDate($now->year, $now->month, $now->day);
                    
                    if ($now->between($start, $end)) {
                        $foundCurrent = true;
                        $currentStart = trim($times[0]);
                        $currentEnd = trim($times[1]);
                        $currentInstructor = trim($instructor);
                        $currentStatus = !empty($currentInstructor) ? 'In Use' : 'Available';
                    } elseif ($start->isAfter($now) && !$foundCurrent && empty($nextSchedule) && !empty(trim($instructor))) {
                        $nextSchedule = trim($instructor) . ' at ' . trim($times[0]);
                    }
                } catch (\Exception $e) {
                }
            }
        }
        $facilityData[] = [
            'room_name' => $sheetTitle,
            'status' => $currentStatus,
            'instructor' => $currentInstructor
        ];
    }
}
print_r($facilityData);
