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
        Schema::create('locator_slips', function (Blueprint $table) {
            $table->id();
            $table->string('slip_number')->unique();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->string('faculty_name')->nullable();
            $table->string('destination');
            $table->text('purpose');
            $table->date('date');
            $table->time('time_out')->nullable();
            $table->time('time_in')->nullable();
            $table->time('actual_time_out')->nullable();
            $table->time('actual_time_in')->nullable();
            $table->string('slip_type')->default('Official'); // Official, Personal
            $table->string('status')->default('Approved'); // Pending, Approved, Departed, Returned, Cancelled
            $table->string('approver_name')->nullable();
            $table->string('guard_on_duty')->nullable();
            $table->text('guard_remarks')->nullable();
            $table->text('remarks')->nullable();
            $table->string('ehris_id')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locator_slips');
    }
};
