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
        Schema::create('academic_periods', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year'); // e.g. '2026 - 2027' or 'AY 2026–2027'
            $table->string('semester'); // e.g. '1st Semester', '2nd Semester', 'Summer'
            $table->string('code')->nullable(); // e.g. 'AY2627-1S'
            $table->date('start_date');
            $table->date('end_date');
            $table->date('class_start_date');
            $table->date('class_end_date');
            $table->date('midterm_start_date')->nullable();
            $table->date('midterm_end_date')->nullable();
            $table->date('final_start_date')->nullable();
            $table->date('final_end_date')->nullable();
            $table->string('status')->default('Draft'); // Draft, Active, Closed, Archived
            $table->boolean('is_current')->default(false);
            $table->text('notes')->nullable();
            $table->string('planning_rules_version')->default('Default Rules v2');

            // Schedule Planning Parameters (JSON)
            // active_weekdays, earliest_class_time, latest_class_time, allow_saturday, holidays, semester_start_reference, room_availability_ruleset
            $table->json('planning_parameters')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_periods');
    }
};
