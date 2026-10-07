<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentRoute extends Model
{
    //
    protected $fillable = [
        'tracking_number',
        'title',
        'type',
        'status',
        'current_location',
        'remarks',
        'logged_by',
    ];

    public function logger()
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}
