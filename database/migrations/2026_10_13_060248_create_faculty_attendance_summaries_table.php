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
        Schema::create('faculty_attendance_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('instructor_name')->index();
            $table->string('period_type')->default('monthly')->index(); // 'weekly' or 'monthly'
            $table->string('period_label')->index(); // e.g. "August 2026" or "August 10-14, 2026"
            $table->integer('present_count')->default(0);
            $table->integer('absent_count')->default(0);
            $table->integer('late_count')->default(0);
            $table->integer('online_count')->default(0);
            $table->integer('others_count')->default(0);
            $table->integer('on_leave_count')->default(0);
            $table->integer('sub_insert_count')->default(0);
            $table->integer('total_late_minutes')->default(0);
            $table->integer('scheduled_sessions')->default(0);
            $table->decimal('attendance_rate', 5, 2)->default(0.00);
            $table->string('academic_year')->default('AY 2026–2027');
            $table->string('semester')->default('1st Semester');
            $table->timestamps();

            $table->unique(['instructor_name', 'period_type', 'period_label'], 'fac_summary_unique_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faculty_attendance_summaries');
    }
};
