<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = [
        'title',
        'category',
        'date',
        'start_time',
        'end_time',
        'venue',
        'description',
        'visibility',
        'status',
        'program_id',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }
}
