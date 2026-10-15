<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Accomplishment extends Model
{
    //
    protected $fillable = [
        'user_id',
        'title',
        'subtitle',
        'category',
        'date_achieved',
        'points',
        'status',
        'verified_by',
        'verified_at',
        'academic_year',
        'description',
        'proof_file_path',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_achieved' => 'date',
            'verified_at' => 'date',
            'points' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
