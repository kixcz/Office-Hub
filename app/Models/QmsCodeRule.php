<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QmsCodeRule extends Model
{
    protected $fillable = [
        'name',
        'scope_level',
        'prefix_format',
        'sequence_digits',
        'current_sequence',
        'sample_code',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sequence_digits' => 'integer',
        'current_sequence' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
