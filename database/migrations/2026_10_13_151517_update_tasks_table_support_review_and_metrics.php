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
            // Change status to string to support 'review' and any custom statuses
            $table->string('status', 50)->default('to_do')->change();
            $table->integer('progress')->default(0)->after('status');
            $table->integer('comments_count')->default(0)->after('progress');
            $table->integer('subtasks_completed')->default(0)->after('comments_count');
            $table->integer('subtasks_total')->default(0)->after('subtasks_completed');
            $table->integer('attachments_count')->default(0)->after('subtasks_total');
            $table->string('assignee_initials')->nullable()->after('assigned_to');
            $table->integer('extra_assignees_count')->default(0)->after('assignee_initials');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'progress',
                'comments_count',
                'subtasks_completed',
                'subtasks_total',
                'attachments_count',
                'assignee_initials',
                'extra_assignees_count',
            ]);
        });
    }
};
