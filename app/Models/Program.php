<?php

namespace App\Models;

use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    /** @use HasFactory<ProgramFactory> */
    use HasFactory;

    protected $fillable = [
        'college_id',
        'code',
        'name',
        'degree_level',
        'department',
        'duration_years',
        'status',
        'description',
    ];

    public function college()
    {
        return $this->belongsTo(College::class);
    }

    public function faculties()
    {
        return $this->hasMany(Faculty::class);
    }

    public function curricula()
    {
        return $this->hasMany(Curriculum::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function courseOfferings()
    {
        return $this->hasMany(CourseOffering::class);
    }
}
