<?php

namespace App\Models;

use Database\Factories\RoomScheduleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomSchedule extends Model
{
    /** @use HasFactory<RoomScheduleFactory> */
    use HasFactory;

    protected $fillable = [
        'room_name',
        'day_of_week',
        'start_time',
        'end_time',
        'course_code',
        'course_title',
        'instructor',
        'section',
        'raw_text',
    ];
}
