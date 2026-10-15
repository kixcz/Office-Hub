<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExtensionEngagement extends Model
{
    protected $fillable = [
        'user_id',
        'faculty_id',
        'title',
        'program',
        'role',
        'duration',
        'status',
        'description',
        'progress',
        'beneficiaries_count',
        'activities_count',
        'next_activity',
        'academic_period',
    ];

    protected function casts(): array
    {
        return [
            'progress' => 'integer',
            'beneficiaries_count' => 'integer',
            'activities_count' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }
}
