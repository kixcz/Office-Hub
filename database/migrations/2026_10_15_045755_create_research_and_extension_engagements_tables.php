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
        Schema::create('research_engagements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('title');
            $table->string('program')->default('CIDS College Research Program');
            $table->string('role')->default('Lead Researcher');
            $table->string('duration')->nullable(); // e.g. "June 2026 – May 2027"
            $table->string('status')->default('Active'); // Active, Completed, Proposed
            $table->text('description')->nullable();
            $table->integer('progress')->default(75);
            $table->string('current_milestone')->nullable(); // "Milestone 2 - Data Pipeline & Model Prototyping"
            $table->integer('milestone_progress')->default(75);
            $table->date('milestone_due_date')->nullable();
            $table->integer('collaborators_count')->default(3);
            $table->string('publications_summary')->nullable(); // "1 Publication (Draft)"
            $table->string('next_action')->nullable(); // "Next: Model Evaluation Nov 30, 2026"
            $table->string('academic_period')->default('AY 2026 - 2027');
            $table->timestamps();
        });

        Schema::create('extension_engagements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->string('title');
            $table->string('program')->default('Institutional Extension Program');
            $table->string('role')->default('Program Coordinator');
            $table->string('duration')->nullable(); // e.g. "August 2026 – December 2026"
            $table->string('status')->default('Active'); // Active, Completed, Planned
            $table->text('description')->nullable();
            $table->integer('progress')->default(60);
            $table->integer('beneficiaries_count')->default(85);
            $table->integer('activities_count')->default(5);
            $table->string('next_activity')->nullable(); // "Next: Community Training Session Oct 28, 2026"
            $table->string('academic_period')->default('AY 2026 - 2027');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('extension_engagements');
        Schema::dropIfExists('research_engagements');
    }
};
