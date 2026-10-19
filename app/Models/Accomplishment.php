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
        'functional_area',
        'scope',
        'role',
        'issuing_organization',
        'event_title',
        'venue',
        'duration',
        'credential_number',
        'expiration_date',
        'date_achieved',
        'points',
        'status',
        'verified_by',
        'verified_at',
        'return_reason',
        'version',
        'academic_year',
        'description',
        'ai_extracted_data',
        'faculty_confirmed',
        'proof_file_path',
        'google_drive_file_id',
        'google_drive_folder_id',
        'google_drive_path',
        'google_drive_web_link',
        'file_checksum',
        'file_size_bytes',
        'file_mime_type',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_achieved' => 'date',
            'expiration_date' => 'date',
            'verified_at' => 'date',
            'points' => 'integer',
            'version' => 'integer',
            'faculty_confirmed' => 'boolean',
            'ai_extracted_data' => 'array',
            'file_size_bytes' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
