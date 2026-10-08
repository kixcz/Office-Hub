<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacilityMonitoring extends Model
{
    protected $fillable = [
        'room_name',
        'room_type',
        'current_class',
        'program',
        'instructor',
        'start_time',
        'end_time',
        'status',
        'remarks',
        'next_schedule',
    ];
}
