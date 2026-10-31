<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

$baseUrl = config('services.ehris.base_url');
$travelToken = config('services.ehris.travel_order_token');
$locatorToken = config('services.ehris.locator_slip_token');

echo "--- 30 Recent Travel Orders travelers ---\n";
for ($p = 1; $p <= 2; $p++) {
    $res = Http::withHeaders([
        'Authorization' => 'Bearer '.$travelToken,
        'Accept' => 'application/json',
    ])->get($baseUrl.'/travel-orders', ['page' => $p, 'per_page' => 15]);
    $items = $res->json()['data']['travel_orders'] ?? [];
    foreach ($items as $item) {
        $pt = $item['primary_traveler'] ?? [];
        echo "[ID {$item['id']}] {$pt['agencyid']} | {$pt['fullname']} | {$pt['email']} | {$pt['office']}\n";
    }
}

echo "\n--- 30 Recent Locator Slips employees ---\n";
for ($p = 1; $p <= 2; $p++) {
    $res = Http::withHeaders([
        'Authorization' => 'Bearer '.$locatorToken,
        'Accept' => 'application/json',
    ])->get($baseUrl.'/locator-slips', ['page' => $p, 'per_page' => 15]);
    $items = $res->json()['data']['locator_slips'] ?? [];
    foreach ($items as $item) {
        $emp = $item['employee'] ?? [];
        echo "[ID {$item['id']}] {$emp['agencyid']} | {$emp['fullname']} | {$emp['email']} | {$emp['office']}\n";
    }
}
