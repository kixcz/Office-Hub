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

$faculties = Faculty::all();
echo "Local Faculties in DB:\n";
foreach ($faculties as $f) {
    echo "- {$f->first_name} {$f->last_name} (ID: {$f->faculty_id}, Email: {$f->email})\n";
}

echo "\nSearching across 10 pages (1000 travel orders) for any match:\n";
$matchedTO = 0;
for ($p = 1; $p <= 10; $p++) {
    $res = Http::withHeaders([
        'Authorization' => 'Bearer '.$travelToken,
        'Accept' => 'application/json',
    ])->get($baseUrl.'/travel-orders', ['page' => $p, 'per_page' => 100]);
    $items = $res->json()['data']['travel_orders'] ?? [];
    foreach ($items as $item) {
        $pt = $item['primary_traveler'] ?? [];
        $fullname = strtolower($pt['fullname'] ?? '');
        foreach ($faculties as $f) {
            if (str_contains($fullname, strtolower($f->last_name)) && str_contains($fullname, strtolower($f->first_name))) {
                echo "FOUND TO MATCH! {$f->first_name} {$f->last_name} in TO #{$item['id']} ({$pt['fullname']})\n";
                $matchedTO++;
            }
        }
    }
}
echo "Total TO matches: $matchedTO\n";

echo "\nSearching across 10 pages (1000 locator slips) for any match:\n";
$matchedLS = 0;
for ($p = 1; $p <= 10; $p++) {
    $res = Http::withHeaders([
        'Authorization' => 'Bearer '.$locatorToken,
        'Accept' => 'application/json',
    ])->get($baseUrl.'/locator-slips', ['page' => $p, 'per_page' => 100]);
    $items = $res->json()['data']['locator_slips'] ?? [];
    foreach ($items as $item) {
        $emp = $item['employee'] ?? [];
        $name = strtolower($emp['name'] ?? '');
        foreach ($faculties as $f) {
            if (str_contains($name, strtolower($f->last_name)) && str_contains($name, strtolower($f->first_name))) {
                echo "FOUND LS MATCH! {$f->first_name} {$f->last_name} in LS #{$item['id']} ({$emp['name']})\n";
                $matchedLS++;
            }
        }
    }
}
echo "Total LS matches: $matchedLS\n";
