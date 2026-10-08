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
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('category')->nullable();
            $table->string('priority')->default('normal'); // normal, high, urgent
            $table->string('destination')->default('public'); // public, office
            $table->string('status')->default('draft'); // draft, approval, scheduled, active, archived

            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();

            $table->timestamp('publish_at')->nullable();
            $table->timestamp('expire_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
