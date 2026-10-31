<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

$baseUrl = config('services.ehris.base_url');
$travelToken = config('services.ehris.travel_order_token');

echo "Scanning travel orders for ICET / CIDS / Computing offices...\n";
$found = [];
for ($page = 1; $page <= 20; $page++) {
    $res = Http::withHeaders([
        'Authorization' => 'Bearer '.$travelToken,
        'Accept' => 'application/json',
    ])->get($baseUrl.'/travel-orders', ['page' => $page, 'per_page' => 100]);
    $items = $res->json()['data']['travel_orders'] ?? [];
    if (empty($items)) {
        break;
    }
    foreach ($items as $item) {
        $travelers = array_merge([$item['primary_traveler'] ?? []], $item['members'] ?? []);
        foreach ($travelers as $t) {
            $office = $t['office'] ?? '';
            if (preg_match('/(comput|engin|cids|icet|tech|inform|system)/i', $office)) {
                $id = $t['agencyid'] ?? $t['agency_id'] ?? '';
                $name = $t['fullname'] ?? $t['name'] ?? '';
                if ($name && ! isset($found[$name])) {
                    $found[$name] = [
                        'agency_id' => $id,
                        'name' => $name,
                        'office' => $office,
                        'email' => $t['email'] ?? '',
                        'position' => $t['position'] ?? '',
                    ];
                    echo "Found: {$name} | {$id} | {$office} | {$t['email']}\n";
                }
            }
        }
    }
}
echo 'Total distinct computing faculty found: '.count($found)."\n";
print_r($found);
