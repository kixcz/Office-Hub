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
        Schema::create('facility_monitorings', function (Blueprint $table) {
            $table->id();
            $table->string('room_name');
            $table->string('room_type')->nullable(); // e.g. Laboratory, Classroom
            $table->string('current_class')->nullable(); // Class or activity
            $table->string('program')->nullable(); // Associated program
            $table->string('instructor')->nullable(); // Faculty name
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('status'); // Available, In Use, Reserved, Maintenance, Unavailable
            $table->text('remarks')->nullable();
            $table->string('next_schedule')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facility_monitorings');
    }
};
