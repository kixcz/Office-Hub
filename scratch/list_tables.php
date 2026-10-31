<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$tables = DB::select('SHOW TABLES');
foreach ($tables as $t) {
    $arr = (array) $t;
    echo current($arr)."\n";
}
