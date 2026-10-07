<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title', 'message', 'category', 'priority', 'destination', 
        'status', 'author_id', 'publish_at', 'expire_at', 'requirement_id'
    ];

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }

    protected function casts(): array
    {
        return [
            'publish_at' => 'datetime',
            'expire_at' => 'datetime',
        ];
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
