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
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'department',
        'position',
        'program_id',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
