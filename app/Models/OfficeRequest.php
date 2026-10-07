<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficeRequest extends Model
{
    protected $fillable = [
        'title',
        'description',
        'type',
        'status',
        'requester_id',
        'resolver_id',
        'resolution_notes',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolver_id');
    }
}
