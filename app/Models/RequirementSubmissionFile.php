<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequirementSubmissionFile extends Model
{
    protected $fillable = [
        'submission_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size_bytes',
        'version',
    ];

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }
}
