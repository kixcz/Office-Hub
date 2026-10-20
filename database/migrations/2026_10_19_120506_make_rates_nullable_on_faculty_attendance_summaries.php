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
        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            $table->decimal('attendance_rate', 5, 2)->nullable()->change();
            $table->decimal('attendance_coverage_rate', 5, 2)->nullable()->change();
            $table->decimal('on_time_rate', 5, 2)->nullable()->change();
            $table->decimal('instructional_completion_rate', 5, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faculty_attendance_summaries', function (Blueprint $table) {
            $table->decimal('attendance_rate', 5, 2)->default(0)->change();
            $table->decimal('attendance_coverage_rate', 5, 2)->default(100)->change();
            $table->decimal('on_time_rate', 5, 2)->default(100)->change();
            $table->decimal('instructional_completion_rate', 5, 2)->default(100)->change();
        });
    }
};
