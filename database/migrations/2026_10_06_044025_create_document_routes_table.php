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
        Schema::create('document_routes', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number')->unique();
            $table->string('title');
            $table->enum('type', ['incoming', 'outgoing', 'internal']);
            $table->enum('status', ['received', 'in_review', 'signed', 'released'])->default('received');
            $table->string('current_location')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('logged_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_routes');
    }
};
