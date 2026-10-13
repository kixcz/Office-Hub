<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('faculty_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('instructor_name')->index();
            $table->date('session_date')->index();
            $table->string('day_of_week')->index();
            $table->string('time_slot')->index(); // e.g. 7:30am-9:00am
            $table->string('week_label')->index(); // e.g. "August 10-14, 2026"
            $table->string('status')->default('Present')->index(); // Present, Absent, Late, Online, On Leave, Break, Others
            $table->integer('late_minutes')->default(0);
            $table->string('remarks')->nullable();
            $table->string('substitute_faculty')->nullable();
            $table->string('academic_year')->default('AY 2026–2027');
            $table->string('semester')->default('1st Semester');
            $table->string('source')->default('Google Sheets');
            $table->timestamps();

            $table->unique(['instructor_name', 'session_date', 'time_slot'], 'fac_att_unique_session');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faculty_attendances');
    }
};
