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
        Schema::table('exam_schedules', function (Blueprint $table) {
            $table->string('component_type')->default('Lecture')->after('exam_type')->index(); // 'Lecture', 'Laboratory'
            $table->string('day_of_week')->nullable()->after('exam_date'); // Monday, Tuesday, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_schedules', function (Blueprint $table) {
            $table->dropColumn(['component_type', 'day_of_week']);
        });
    }
};
