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
        Schema::table('accomplishments', function (Blueprint $table) {
            $table->string('subtitle')->nullable()->after('title'); // e.g. "National Conference on Computing Education" or "Published in IJACSA (Q2 Journal)"
            $table->string('category', 100)->change(); // Support 'Research Award', 'Publication', 'Service Accomplishment', 'Certification', 'Professional Development'
            $table->integer('points')->default(5)->after('date_achieved');
            $table->string('status', 50)->default('for_verification')->after('points'); // 'verified', 'for_verification', 'returned'
            $table->string('verified_by')->nullable()->after('status'); // e.g. "Research Office", "HR Office"
            $table->date('verified_at')->nullable()->after('verified_by');
            $table->string('academic_year')->default('2026-2027')->after('verified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accomplishments', function (Blueprint $table) {
            $table->dropColumn(['subtitle', 'points', 'status', 'verified_by', 'verified_at', 'academic_year']);
        });
    }
};
