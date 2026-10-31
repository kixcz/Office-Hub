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

echo 'Base URL: '.$baseUrl."\n";

try {
    echo "--- Testing Travel Orders ---\n";
    $response = Http::withHeaders([
        'Authorization' => 'Bearer '.$travelToken,
        'Accept' => 'application/json',
    ])->timeout(8)->get($baseUrl.'/travel-orders', [
        'page' => 1,
        'per_page' => 5,
    ]);
    echo 'Status: '.$response->status()."\n";
    $json = $response->json();
    echo 'Keys: '.json_encode(array_keys($json ?? []))."\n";
    if (isset($json['data'])) {
        echo 'Data count: '.(is_array($json['data']) ? count($json['data']) : 'not array')."\n";
        echo 'Sample: '.json_encode(array_slice($json['data'], 0, 1), JSON_PRETTY_PRINT)."\n";
    } else {
        echo 'Body: '.substr($response->body(), 0, 300)."\n";
    }
} catch (Throwable $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

try {
    echo "\n--- Testing Locator Slips ---\n";
    $response2 = Http::withHeaders([
        'Authorization' => 'Bearer '.$locatorToken,
        'Accept' => 'application/json',
    ])->timeout(8)->get($baseUrl.'/locator-slips', [
        'page' => 1,
        'per_page' => 5,
    ]);
    echo 'Status: '.$response2->status()."\n";
    $json2 = $response2->json();
    echo 'Keys: '.json_encode(array_keys($json2 ?? []))."\n";
    if (isset($json2['data'])) {
        echo 'Data count: '.(is_array($json2['data']) ? count($json2['data']) : 'not array')."\n";
        echo 'Sample: '.json_encode(array_slice($json2['data'], 0, 1), JSON_PRETTY_PRINT)."\n";
    } else {
        echo 'Body: '.substr($response2->body(), 0, 300)."\n";
    }
} catch (Throwable $e) {
    echo 'Error: '.$e->getMessage()."\n";
}
