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

$response = Http::withHeaders([
    'Authorization' => 'Bearer '.$travelToken,
    'Accept' => 'application/json',
])->timeout(8)->get($baseUrl.'/travel-orders', [
    'page' => 1,
    'per_page' => 2,
]);

$json = $response->json();
echo "Travel Orders Data keys:\n";
print_r(array_keys($json['data'] ?? []));

$response2 = Http::withHeaders([
    'Authorization' => 'Bearer '.$locatorToken,
    'Accept' => 'application/json',
])->timeout(8)->get($baseUrl.'/locator-slips', [
    'page' => 1,
    'per_page' => 2,
]);

$json2 = $response2->json();
echo "Locator Slips Data keys:\n";
print_r(array_keys($json2['data'] ?? []));
