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
        Schema::table('accomplishments', function (Blueprint $table) {
            $table->string('functional_area', 100)->nullable()->after('category'); // Instruction, Research, Extension, Professional Development, Award/Recognition, Certification, Administration
            $table->string('scope', 50)->nullable()->after('functional_area'); // Institutional, Local, Regional, National, International
            $table->string('role', 100)->nullable()->after('scope'); // Participant, Presenter, Resource Speaker, Organizer, Awardee, Researcher, Project Leader
            $table->string('issuing_organization')->nullable()->after('role');
            $table->string('event_title')->nullable()->after('issuing_organization');
            $table->string('venue')->nullable()->after('event_title');
            $table->string('duration')->nullable()->after('venue'); // e.g. "40 hours", "3 days"
            $table->string('credential_number')->nullable()->after('duration');
            $table->date('expiration_date')->nullable()->after('credential_number');

            // AI Extraction & Status Workflow: Draft -> AI Extracted -> Faculty Confirmed -> Submitted -> Verified / Returned / Rejected -> Archived
            $table->json('ai_extracted_data')->nullable()->after('description');
            $table->boolean('faculty_confirmed')->default(false)->after('ai_extracted_data');
            $table->text('return_reason')->nullable()->after('verified_at');
            $table->integer('version')->default(1)->after('return_reason');

            // Google Drive Evidence Reference
            $table->string('google_drive_file_id')->nullable()->after('proof_file_path');
            $table->string('google_drive_folder_id')->nullable()->after('google_drive_file_id');
            $table->string('google_drive_path')->nullable()->after('google_drive_folder_id'); // e.g. "Faculty Evidence/AY 2026-2027/Instruction/National"
            $table->string('google_drive_web_link')->nullable()->after('google_drive_path');
            $table->string('file_checksum', 64)->nullable()->after('google_drive_web_link');
            $table->unsignedBigInteger('file_size_bytes')->nullable()->after('file_checksum');
            $table->string('file_mime_type', 100)->nullable()->after('file_size_bytes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accomplishments', function (Blueprint $table) {
            $table->dropColumn([
                'functional_area',
                'scope',
                'role',
                'issuing_organization',
                'event_title',
                'venue',
                'duration',
                'credential_number',
                'expiration_date',
                'ai_extracted_data',
                'faculty_confirmed',
                'return_reason',
                'version',
                'google_drive_file_id',
                'google_drive_folder_id',
                'google_drive_path',
                'google_drive_web_link',
                'file_checksum',
                'file_size_bytes',
                'file_mime_type',
            ]);
        });
    }
};
