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
        Schema::create('colleges', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. CIDS, CED, CBA
            $table->string('name'); // e.g. College of Information and Digital Sciences
            $table->string('acronym')->nullable();
            $table->string('type')->default('College'); // College, Campus, School, Institute
            $table->unsignedBigInteger('parent_id')->nullable(); // For hierarchical campus/college structure
            $table->string('dean_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('status')->default('Active'); // Not Configured, In Setup, Ready, Active, Suspended, Archived
            $table->string('setup_stage')->default('Active'); // Identity, Branding, Modules, Admins, Programs, Facilities, Policies, Workflows, Reports, TV, Activation
            $table->integer('setup_progress')->default(100);
            $table->json('enabled_modules')->nullable(); // Configured module permissions
            $table->string('logo_url')->nullable();
            $table->string('color_theme')->default('amber'); // amber, blue, emerald, indigo, purple, rose
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('colleges');
    }
};
