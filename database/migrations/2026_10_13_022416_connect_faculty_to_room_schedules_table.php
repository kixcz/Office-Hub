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
        Schema::table('faculties', function (Blueprint $table) {
            $table->string('spreadsheet_name')->nullable()->after('last_name')->index();
        });

        Schema::table('room_schedules', function (Blueprint $table) {
            $table->foreignId('faculty_id')->nullable()->after('instructor')->constrained('faculties')->nullOnDelete();
        });

        Schema::table('facility_monitorings', function (Blueprint $table) {
            $table->foreignId('faculty_id')->nullable()->after('instructor')->constrained('faculties')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facility_monitorings', function (Blueprint $table) {
            $table->dropForeign(['faculty_id']);
            $table->dropColumn('faculty_id');
        });

        Schema::table('room_schedules', function (Blueprint $table) {
            $table->dropForeign(['faculty_id']);
            $table->dropColumn('faculty_id');
        });

        Schema::table('faculties', function (Blueprint $table) {
            $table->dropColumn('spreadsheet_name');
        });
    }
};
