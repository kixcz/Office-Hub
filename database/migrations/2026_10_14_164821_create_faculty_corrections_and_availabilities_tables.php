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
        Schema::create('faculty_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->string('type')->default('attendance'); // attendance, schedule, workload, profile, other
            $table->string('title');
            $table->text('explanation');
            $table->date('affected_date')->nullable();
            $table->string('affected_session')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('reviewer_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('faculty_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->string('academic_year')->default('AY 2026–2027');
            $table->string('semester')->default('1st Semester');
            $table->string('day_of_week'); // Monday, Tuesday, etc.
            $table->string('preferred_start_time')->default('08:00');
            $table->string('preferred_end_time')->default('17:00');
            $table->string('status')->default('available'); // available, preferred, unavailable
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faculty_availabilities');
        Schema::dropIfExists('faculty_corrections');
    }
};
