<?php

use App\Models\AcademicPeriod;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$period = AcademicPeriod::find(1);
if ($period) {
    $period->class_start_date = '2026-08-10';
    $period->start_date = '2026-08-01';
    $period->end_date = '2026-12-18';
    $period->class_end_date = '2026-12-18';
    $period->save();
    echo 'AcademicPeriod 1 official start of classes set to: '.$period->class_start_date->format('Y-m-d')."\n";
}
