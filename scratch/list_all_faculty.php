<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Faculty;
use Illuminate\Contracts\Console\Kernel;

echo "--- ALL FACULTY IN DATABASE ---\n";
foreach (Faculty::all() as $f) {
    echo "ID: {$f->id} | Name: {$f->first_name} {$f->last_name} | AgencyID: {$f->faculty_id} | Email: {$f->email}\n";
}
