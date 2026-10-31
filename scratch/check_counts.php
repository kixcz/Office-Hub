<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

echo 'Count faculties: '.DB::table('faculties')->count()."\n";
echo 'Count users: '.DB::table('users')->count()."\n";
echo 'Count travel_orders: '.DB::table('travel_orders')->count()."\n";
echo 'Count locator_slips: '.DB::table('locator_slips')->count()."\n";
