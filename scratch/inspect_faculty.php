<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Faculty;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

$baseUrl = config('services.ehris.base_url');
$travelToken = config('services.ehris.travel_order_token');
$locatorToken = config('services.ehris.locator_slip_token');

echo 'Total Faculty in DB: '.Faculty::count()."\n";
echo "Sample 5 Faculty:\n";
foreach (Faculty::take(5)->get() as $f) {
    echo "ID: {$f->id}, Name: {$f->first_name} {$f->last_name}, Agency/FacultyID: {$f->faculty_id}, Email: {$f->email}\n";
}

$response = Http::withHeaders([
    'Authorization' => 'Bearer '.$travelToken,
    'Accept' => 'application/json',
])->timeout(8)->get($baseUrl.'/travel-orders', [
    'page' => 1,
    'per_page' => 10,
]);

$items = $response->json()['data']['travel_orders'] ?? [];
echo "\nTotal travel orders fetched on page 1: ".count($items)."\n";
foreach (array_slice($items, 0, 5) as $to) {
    echo 'TO ID: '.$to['id']."\n";
    echo 'Primary traveler: '.json_encode($to['primary_traveler'] ?? [])."\n";
    echo 'Members: '.json_encode($to['members'] ?? [])."\n";
}
