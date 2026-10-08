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
        Schema::create('room_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('room_name');
            $table->string('day_of_week'); // Monday, Tuesday, ...
            $table->time('start_time');
            $table->time('end_time');
            $table->string('course_code')->nullable();
            $table->string('course_title')->nullable();
            $table->string('instructor')->nullable();
            $table->string('section')->nullable();
            $table->text('raw_text')->nullable();
            $table->timestamps();

            $table->index(['room_name', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_schedules');
    }
};
