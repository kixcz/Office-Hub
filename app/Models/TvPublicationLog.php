<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TvPublicationLog extends Model
{
    protected $fillable = [
        'version',
        'action',
        'target_type',
        'target_name',
        'user_id',
        'publisher_name',
        'summary',
        'snapshot_before',
        'snapshot_after',
    ];

    protected $casts = [
        'snapshot_before' => 'array',
        'snapshot_after' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
