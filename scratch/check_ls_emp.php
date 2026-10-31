<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

$baseUrl = config('services.ehris.base_url');
$locatorToken = config('services.ehris.locator_slip_token');

$res = Http::withHeaders([
    'Authorization' => 'Bearer '.$locatorToken,
    'Accept' => 'application/json',
])->get($baseUrl.'/locator-slips', ['page' => 1, 'per_page' => 1]);

print_r($res->json()['data']['locator_slips'][0]['employee'] ?? []);
