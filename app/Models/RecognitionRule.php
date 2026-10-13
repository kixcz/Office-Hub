<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecognitionRule extends Model
{
    protected $fillable = [
        'title',
        'description',
        'type',
        'metric',
        'criteria_detail',
        'target',
        'display_format',
        'min_requirements',
        'min_on_time_rate',
        'min_compliance_rate',
        'allow_overdue',
        'is_active',
        'updated_by',
    ];

    protected $casts = [
        'min_on_time_rate' => 'float',
        'min_compliance_rate' => 'float',
        'allow_overdue' => 'boolean',
        'is_active' => 'boolean',
    ];
}
