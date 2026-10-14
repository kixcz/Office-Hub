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
        Schema::create('room_complaints', function (Blueprint $table) {
            $table->id();
            $table->string('room_name');
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('complainant_name');
            $table->string('complainant_email')->nullable();
            $table->string('issue_category'); // e.g. Air Conditioning, Computers / Peripherals, Projector / AV, Electrical / Lighting, Furniture / Seating, Internet / LAN, Cleanliness, Other
            $table->string('urgency')->default('Medium'); // Low, Medium, High, Critical
            $table->text('description');
            $table->string('status')->default('Submitted to Dean'); // Submitted to Dean, Under Review, In Progress, Resolved, Dismissed
            $table->text('action_taken')->nullable();
            $table->text('dean_notes')->nullable();
            $table->string('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['room_name', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_complaints');
    }
};
