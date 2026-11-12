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
        Schema::table('travel_orders', function (Blueprint $table) {
            $table->foreignId('created_by_user_id')->nullable()->after('faculty_name')->constrained('users')->nullOnDelete();
            $table->string('created_by_name')->nullable()->after('created_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('travel_orders', function (Blueprint $table) {
            $table->dropForeign(['created_by_user_id']);
            $table->dropColumn(['created_by_user_id', 'created_by_name']);
        });
    }
};
