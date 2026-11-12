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
            if (! Schema::hasColumn('faculties', 'min_load_hours')) {
                $table->decimal('min_load_hours', 4, 1)->default(9.0)->after('appointment_status');
            }
            if (! Schema::hasColumn('faculties', 'target_load_hours')) {
                $table->decimal('target_load_hours', 4, 1)->default(12.0)->after('min_load_hours');
            }
            if (! Schema::hasColumn('faculties', 'max_load_hours')) {
                $table->decimal('max_load_hours', 4, 1)->default(15.0)->after('target_load_hours');
            }
        });

        Schema::table('faculty_specializations', function (Blueprint $table) {
            if (! Schema::hasColumn('faculty_specializations', 'level')) {
                $table->string('level')->default('Primary')->after('expertise_area'); // Primary, Secondary, Familiar
            }
            if (! Schema::hasColumn('faculty_specializations', 'display_order')) {
                $table->integer('display_order')->default(1)->after('level');
            }
            if (! Schema::hasColumn('faculty_specializations', 'verification_status')) {
                $table->string('verification_status')->default('Verified')->after('is_verified'); // Verified, For Review, Pending
            }
            if (! Schema::hasColumn('faculty_specializations', 'verified_by_id')) {
                $table->foreignId('verified_by_id')->nullable()->constrained('users')->nullOnDelete()->after('verification_status');
            }
            if (! Schema::hasColumn('faculty_specializations', 'verified_at')) {
                $table->dateTime('verified_at')->nullable()->after('verified_by_id');
            }
        });

        Schema::table('faculty_preferences', function (Blueprint $table) {
            if (! Schema::hasColumn('faculty_preferences', 'preferred_min_load')) {
                $table->decimal('preferred_min_load', 4, 1)->nullable()->after('max_days_per_week');
            }
            if (! Schema::hasColumn('faculty_preferences', 'preferred_max_load')) {
                $table->decimal('preferred_max_load', 4, 1)->nullable()->after('preferred_min_load');
            }
            if (! Schema::hasColumn('faculty_preferences', 'preferred_max_preparations')) {
                $table->integer('preferred_max_preparations')->default(3)->after('preferred_max_load');
            }
            if (! Schema::hasColumn('faculty_preferences', 'preferred_teaching_mode')) {
                $table->string('preferred_teaching_mode')->default('Flexible')->after('preferred_max_preparations');
            }
            if (! Schema::hasColumn('faculty_preferences', 'avoid_early_morning')) {
                $table->boolean('avoid_early_morning')->default(false)->after('preferred_teaching_mode');
            }
            if (! Schema::hasColumn('faculty_preferences', 'avoid_late_evening')) {
                $table->boolean('avoid_late_evening')->default(false)->after('avoid_early_morning');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
