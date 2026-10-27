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
        Schema::create('travel_orders', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number')->unique();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->string('faculty_name')->nullable();
            $table->string('destination');
            $table->text('purpose');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('Approved'); // Approved, In Progress, Completed, Pending, Cancelled
            $table->string('travel_type')->default('Official Business'); // Official Business, Official Time
            $table->boolean('with_per_diem')->default(false);
            $table->decimal('estimated_budget', 12, 2)->default(0);
            $table->string('approver_name')->nullable();
            $table->string('approver_role')->nullable();
            $table->dateTime('approved_at')->nullable();
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
        Schema::dropIfExists('travel_orders');
    }
};
