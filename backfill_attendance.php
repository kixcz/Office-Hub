<?php

use App\Models\FacultyAttendance;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

// 1. Update null or blank rooms to CHS
$updatedRooms = FacultyAttendance::whereNull('room')->orWhere('room', '')->update(['room' => 'CHS']);
echo "Updated {$updatedRooms} rooms to CHS.\n";

// 2. Backfill subjects and sections into table for instant retrieval and searchability
$all = FacultyAttendance::all();
$updatedSubj = 0;

foreach ($all as $a) {
    $sch = $a->resolveSchedule();
    if ($sch) {
        $changed = false;
        if (empty($a->getRawOriginal('subject'))) {
            $a->subject = "{$sch->course_code} - {$sch->course_title}";
            $changed = true;
        }
        if (empty($a->getRawOriginal('section'))) {
            $a->section = $sch->section;
            $changed = true;
        }
        if (empty($a->getRawOriginal('room')) || $a->getRawOriginal('room') === 'CHS') {
            if ($sch->room_name && $sch->room_name !== 'CHS') {
                $a->room = $sch->room_name;
                $changed = true;
            }
        }
        if ($changed) {
            $a->saveQuietly();
            $updatedSubj++;
        }
    }
}

echo "Backfilled {$updatedSubj} records with subject/section/room from RoomSchedule.\n";

$remainingEmptySubj = FacultyAttendance::whereNull('subject')->orWhere('subject', '')->count();
$remainingEmptyRoom = FacultyAttendance::whereNull('room')->orWhere('room', '')->count();
echo "Remaining with empty subject: {$remainingEmptySubj}\n";
echo "Remaining with empty room: {$remainingEmptyRoom}\n";
