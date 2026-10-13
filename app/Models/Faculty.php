<?php

namespace App\Models;

use Database\Factories\FacultyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    /** @use HasFactory<FacultyFactory> */
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'profile_picture',
        'program_id',
    ];

    protected $appends = [
        'photo_url',
    ];

    /**
     * Get the accessible public URL of the faculty profile picture.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->profile_picture) {
            return null;
        }

        if (str_starts_with($this->profile_picture, 'http://') || str_starts_with($this->profile_picture, 'https://')) {
            return $this->profile_picture;
        }

        return asset('storage/'.$this->profile_picture);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
