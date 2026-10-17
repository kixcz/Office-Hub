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
        Schema::create('tv_publication_logs', function (Blueprint $table) {
            $table->id();
            $table->string('version')->nullable(); // e.g. "v2.5.0"
            $table->string('action'); // 'Published', 'Unpublished', 'Activated', 'Deactivated', 'Reordered', 'Scheduled', 'Settings Changed', 'Restored'
            $table->string('target_type'); // 'Playlist', 'Slide', 'Spotlight', 'Display Settings', 'Device'
            $table->string('target_name')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('publisher_name'); // Dr. Eleanor Vance, etc.
            $table->text('summary');
            $table->json('snapshot_before')->nullable();
            $table->json('snapshot_after')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tv_publication_logs');
    }
};
