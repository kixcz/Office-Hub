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
        Schema::create('attendance_source_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('source_sheet_id')->nullable();
            $table->string('source_tab')->index();
            $table->integer('source_row_number')->nullable();
            $table->string('row_hash', 64)->nullable()->index();
            $table->string('raw_instructor_name')->nullable()->index();
            $table->foreignId('matched_faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('match_status')->default('unmatched'); // matched, unmatched, ambiguous
            $table->date('raw_date')->nullable();
            $table->string('raw_time_slot')->nullable();
            $table->string('raw_room')->nullable();
            $table->string('raw_status')->nullable();
            $table->integer('raw_late_minutes')->default(0);
            $table->integer('raw_scheduled_count')->nullable();
            $table->integer('raw_present_count')->nullable();
            $table->integer('raw_late_count')->nullable();
            $table->integer('raw_absent_count')->nullable();
            $table->json('raw_payload')->nullable();
            $table->string('sync_batch_id', 64)->nullable()->index();
            $table->boolean('has_anomaly')->default(false);
            $table->string('anomaly_reason')->nullable();
            $table->timestamp('synced_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_source_snapshots');
    }
};
