<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QmsDocumentType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'default_review_cycle_months',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'default_review_cycle_months' => 'integer',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(QmsDocument::class, 'document_type_id');
    }
}
