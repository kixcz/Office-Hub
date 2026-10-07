<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Accomplishment extends Model
{
    //
    protected $fillable = [
        'user_id',
        'title',
        'category',
        'date_achieved',
        'description',
        'proof_file_path',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
