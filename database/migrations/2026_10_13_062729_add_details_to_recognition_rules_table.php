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
        Schema::table('recognition_rules', function (Blueprint $table) {
            $table->string('description')->nullable()->after('title');
            $table->string('metric')->default('Compliance Rate')->after('type'); // e.g. Compliance Rate, On-Time Submission Rate, Overdue Count, Improvement Rate, Program Compliance Rate, Total Submissions
            $table->string('criteria_detail')->nullable()->after('metric'); // e.g. "Based on verified submissions", "Must be 0"
            $table->string('target')->default('Top 5')->after('criteria_detail'); // e.g. "Top 5", "Top 3", "All Qualified"
            $table->string('display_format')->default('Leaderboard')->after('target'); // e.g. "Leaderboard", "Ranked List", "Highlight Card", "Progress Card"
            $table->boolean('is_active')->default(true)->after('allow_overdue');
            $table->string('updated_by')->default('System Admin')->after('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recognition_rules', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'metric',
                'criteria_detail',
                'target',
                'display_format',
                'is_active',
                'updated_by',
            ]);
        });
    }
};
