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
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('task_type')->default('assigned')->after('priority'); // 'assigned', 'personal', 'project'
            $table->string('category')->default('General')->after('task_type'); // 'Teaching & Instruction', 'Administrative', 'Research', 'Extension', 'Personal', 'General'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['task_type', 'category']);
        });
    }
};
