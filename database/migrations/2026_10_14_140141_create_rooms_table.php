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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('room_name')->unique();
            $table->string('building')->nullable()->default('CIDS Main');
            $table->string('floor')->nullable();
            $table->string('type')->default('Lecture'); // Laboratory, Lecture, Conference, etc.
            $table->integer('capacity')->default(40);
            $table->string('status')->default('Available'); // Available, In Use, Maintenance, Under Repair
            $table->text('equipment_details')->nullable(); // JSON or text summary e.g. "40 Desktop PCs, 2 Split ACs, 1 Projector"
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
