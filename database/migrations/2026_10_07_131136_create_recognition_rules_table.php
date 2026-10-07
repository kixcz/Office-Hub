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
        Schema::create('recognition_rules', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // e.g. "Top Performing Faculty"
            $table->string('type'); // 'faculty' or 'program'
            $table->integer('min_requirements')->default(0);
            $table->decimal('min_on_time_rate', 5, 2)->default(0.00);
            $table->decimal('min_compliance_rate', 5, 2)->default(0.00);
            $table->boolean('allow_overdue')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recognition_rules');
    }
};
