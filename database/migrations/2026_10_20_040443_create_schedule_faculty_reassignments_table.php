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
        Schema::create('schedule_faculty_reassignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verified_schedule_id')->constrained('verified_schedules')->cascadeOnDelete();
            $table->foreignId('previous_faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('new_faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->foreignId('changed_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('changed_by_role'); // 'Super Admin', 'Lab In-Charge', etc.
            $table->string('reassignment_type')->default('Permanent'); // 'Permanent', 'Substitute / Temporary', 'Daily Override'
            $table->date('effective_date')->nullable();
            $table->text('reason');
            $table->json('notified_roles')->nullable(); // ['Super Admin', 'Dean', 'Program Head']
            $table->json('notified_user_ids')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_faculty_reassignments');
    }
};
