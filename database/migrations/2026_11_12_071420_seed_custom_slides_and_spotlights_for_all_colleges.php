<?php

use App\Models\Faculty;
use App\Models\SpotlightSlide;
use App\Models\User;
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
        // Add college_code to spotlight_slides if not present
        Schema::table('spotlight_slides', function (Blueprint $table) {
            if (! Schema::hasColumn('spotlight_slides', 'college_code')) {
                $table->string('college_code')->nullable()->after('priority')->index();
            }
        });

        // Add college_code to custom_content_slides if not present
        Schema::table('custom_content_slides', function (Blueprint $table) {
            if (! Schema::hasColumn('custom_content_slides', 'college_code')) {
                $table->string('college_code')->nullable()->after('target_display_id')->index();
            }
        });

        $admin = User::first();
        $adminId = $admin ? $admin->id : 1;

        // Seed distinct Spotlight recognition slides for each college
        // 1. CED Spotlight
        $cedFaculty = Faculty::whereHas('program.college', fn ($q) => $q->where('code', 'CED'))->first();
        SpotlightSlide::updateOrCreate(
            ['headline' => 'OUTSTANDING TEACHER EDUCATOR OF THE YEAR'],
            [
                'type' => 'award',
                'subject_type' => 'individual',
                'faculty_id' => $cedFaculty?->id,
                'honoree_name' => $cedFaculty ? $cedFaculty->full_name : 'Prof. Jonathan Cruz',
                'honoree_title' => 'Associate Professor I',
                'program_or_department' => 'Bachelor of Secondary Education',
                'message' => 'Conferred the Regional Pedagogical Excellence Award for pioneering inclusive digital learning frameworks in secondary education.',
                'event_title' => 'Regional Education Summit 2026',
                'awarding_organization' => 'Department of Education Region XI',
                'template' => 'award',
                'background_style' => 'royal-gold',
                'accent_style' => 'gold',
                'priority' => 2,
                'display_duration' => 20,
                'status' => 'published',
                'college_code' => 'CED',
                'start_at' => now()->subDay(),
                'end_at' => now()->addDays(30),
            ]
        );

        // 2. CBA Spotlight
        $cbaFaculty = Faculty::whereHas('program.college', fn ($q) => $q->where('code', 'CBA'))->first();
        SpotlightSlide::updateOrCreate(
            ['headline' => 'CHAMPIONS: NATIONAL ENTREPRENEURSHIP DERBY'],
            [
                'type' => 'achievement',
                'subject_type' => 'individual',
                'faculty_id' => $cbaFaculty?->id,
                'honoree_name' => $cbaFaculty ? $cbaFaculty->full_name : 'Prof. Teresa Lim',
                'honoree_title' => 'Associate Professor II',
                'program_or_department' => 'Bachelor of Science in Business Administration',
                'message' => 'Guided the student startup venture to Grand Champion honors at the 2026 Philippine Inter-Collegiate Business Pitching Championship.',
                'event_title' => 'National Business Derby',
                'awarding_organization' => 'Philippine Chamber of Commerce',
                'template' => 'achievement',
                'background_style' => 'emerald-excellence',
                'accent_style' => 'emerald',
                'priority' => 2,
                'display_duration' => 20,
                'status' => 'published',
                'college_code' => 'CBA',
                'start_at' => now()->subDay(),
                'end_at' => now()->addDays(30),
            ]
        );

        // 3. COE Spotlight
        $coeFaculty = Faculty::whereHas('program.college', fn ($q) => $q->where('code', 'COE'))->first();
        SpotlightSlide::updateOrCreate(
            ['headline' => 'PATENT GRANT: RESILIENT BAMBOO COMPOSITE STRUCTURAL TILE'],
            [
                'type' => 'research',
                'subject_type' => 'individual',
                'faculty_id' => $coeFaculty?->id,
                'honoree_name' => $coeFaculty ? $coeFaculty->full_name : 'Engr. Paolo Mendoza',
                'honoree_title' => 'Associate Professor I',
                'program_or_department' => 'Bachelor of Science in Civil Engineering',
                'message' => 'Granted Intellectual Property Office of the Philippines (IPOPHL) utility model patent for low-carbon composite engineering materials.',
                'event_title' => 'IPOPHL Utility Patent Registry',
                'awarding_organization' => 'Intellectual Property Office of the Philippines',
                'template' => 'research',
                'background_style' => 'midnight-prestige',
                'accent_style' => 'blue',
                'priority' => 2,
                'display_duration' => 20,
                'status' => 'published',
                'college_code' => 'COE',
                'start_at' => now()->subDay(),
                'end_at' => now()->addDays(30),
            ]
        );

        // 4. CAS Spotlight
        $casFaculty = Faculty::whereHas('program.college', fn ($q) => $q->where('code', 'CAS'))->first();
        SpotlightSlide::updateOrCreate(
            ['headline' => 'INTERNATIONAL BIODIVERSITY CONSERVATION RESEARCH GRANT'],
            [
                'type' => 'research',
                'subject_type' => 'individual',
                'faculty_id' => $casFaculty?->id,
                'honoree_name' => $casFaculty ? $casFaculty->full_name : 'Dr. Rebecca Miranda',
                'honoree_title' => 'Professor I',
                'program_or_department' => 'Bachelor of Science in Biology',
                'message' => 'Recipient of the 2026 ASEAN Biodiversity Research Fellowship for endemic riparian flora conservation in Mt. Apo biosphere reserve.',
                'event_title' => 'ASEAN Wildlife & Biosphere Fund',
                'awarding_organization' => 'ASEAN Centre for Biodiversity',
                'template' => 'research',
                'background_style' => 'emerald-excellence',
                'accent_style' => 'emerald',
                'priority' => 2,
                'display_duration' => 20,
                'status' => 'published',
                'college_code' => 'CAS',
                'start_at' => now()->subDay(),
                'end_at' => now()->addDays(30),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        SpotlightSlide::whereIn('college_code', ['CED', 'CBA', 'COE', 'CAS'])->delete();

        Schema::table('spotlight_slides', function (Blueprint $table) {
            if (Schema::hasColumn('spotlight_slides', 'college_code')) {
                $table->dropColumn('college_code');
            }
        });

        Schema::table('custom_content_slides', function (Blueprint $table) {
            if (Schema::hasColumn('custom_content_slides', 'college_code')) {
                $table->dropColumn('college_code');
            }
        });
    }
};
