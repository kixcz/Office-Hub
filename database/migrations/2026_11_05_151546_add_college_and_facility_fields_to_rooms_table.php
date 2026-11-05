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
        Schema::table('rooms', function (Blueprint $table) {
            $table->foreignId('college_id')->nullable()->after('id')->constrained('colleges')->nullOnDelete();
            $table->boolean('is_shared')->default(false)->after('capacity');
            $table->string('condition')->default('Good')->after('status'); // Good, Fair, Needs Repair, For Replacement
            $table->string('setup_readiness')->default('Ready')->after('operational_status'); // Ready, Incomplete, Needs Attention
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeign(['college_id']);
            $table->dropColumn(['college_id', 'is_shared', 'condition', 'setup_readiness']);
        });
    }
};
