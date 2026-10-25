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
        // 1. Enhance Programs table
        Schema::table('programs', function (Blueprint $table) {
            if (! Schema::hasColumn('programs', 'degree_level')) {
                $table->string('degree_level')->default("Bachelor's Degree")->after('name');
            }
            if (! Schema::hasColumn('programs', 'department')) {
                $table->string('department')->default('College of Information and Digital Sciences')->after('degree_level');
            }
            if (! Schema::hasColumn('programs', 'duration_years')) {
                $table->integer('duration_years')->default(4)->after('department');
            }
            if (! Schema::hasColumn('programs', 'status')) {
                $table->string('status')->default('Active')->after('duration_years'); // Active, Inactive, Phased Out
            }
        });

        // 2. Enhance Curricula table
        Schema::table('curricula', function (Blueprint $table) {
            if (! Schema::hasColumn('curricula', 'description')) {
                $table->text('description')->nullable()->after('version_name');
            }
            if (! Schema::hasColumn('curricula', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('status');
            }
        });

        // 3. Enhance Courses table (Canonical catalog entity)
        Schema::table('courses', function (Blueprint $table) {
            if (! Schema::hasColumn('courses', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
            if (! Schema::hasColumn('courses', 'prerequisites')) {
                $table->string('prerequisites')->nullable()->after('category');
            }
            if (! Schema::hasColumn('courses', 'corequisites')) {
                $table->string('corequisites')->nullable()->after('prerequisites');
            }
            if (! Schema::hasColumn('courses', 'required_facility_type')) {
                $table->string('required_facility_type')->default('Standard Classroom')->after('room_type_required');
            }
            if (! Schema::hasColumn('courses', 'required_equipment')) {
                $table->string('required_equipment')->nullable()->after('required_facility_type');
            }
            if (! Schema::hasColumn('courses', 'can_split_lab_hours')) {
                $table->boolean('can_split_lab_hours')->default(false)->after('consecutive_lab_required');
            }
            if (! Schema::hasColumn('courses', 'preferred_block_length')) {
                $table->decimal('preferred_block_length', 4, 1)->default(3.0)->after('can_split_lab_hours'); // in hours, e.g. 1.5, 3.0
            }
            if (! Schema::hasColumn('courses', 'status')) {
                $table->string('status')->default('Active')->after('specialization_tag');
            }
        });

        // 4. Curriculum Courses Pivot Table (Defines course placement, sequencing, and metadata in a curriculum version)
        if (! Schema::hasTable('curriculum_courses')) {
            Schema::create('curriculum_courses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('curriculum_id')->constrained('curricula')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->integer('year_level')->default(1); // 1, 2, 3, 4
                $table->string('semester_placement')->default('1st Semester'); // 1st Semester, 2nd Semester, Summer
                $table->string('requirement_type')->default('Required'); // Required, Major, Elective, Specialization, General Education, Institutional
                $table->string('prerequisite_override')->nullable();
                $table->string('corequisite_override')->nullable();
                $table->integer('sequence_order')->default(1);
                $table->timestamps();

                $table->unique(['curriculum_id', 'course_id', 'year_level', 'semester_placement'], 'curr_course_term_unique');
            });
        }

        // 5. Enhance Course Offerings table (Operational layer)
        Schema::table('course_offerings', function (Blueprint $table) {
            if (! Schema::hasColumn('course_offerings', 'program_id')) {
                $table->foreignId('program_id')->nullable()->after('academic_period_id')->constrained('programs')->nullOnDelete();
            }
            if (! Schema::hasColumn('course_offerings', 'curriculum_id')) {
                $table->foreignId('curriculum_id')->nullable()->after('program_id')->constrained('curricula')->nullOnDelete();
            }
            if (! Schema::hasColumn('course_offerings', 'year_level')) {
                $table->integer('year_level')->default(1)->after('section_name');
            }
            if (! Schema::hasColumn('course_offerings', 'expected_enrollment')) {
                $table->integer('expected_enrollment')->default(35)->after('year_level');
            }
            if (! Schema::hasColumn('course_offerings', 'offering_type')) {
                $table->string('offering_type')->default('Regular')->after('expected_enrollment'); // Regular, Elective, Retake/Tutorial, Merged, Special
            }
            if (! Schema::hasColumn('course_offerings', 'loading_status')) {
                $table->string('loading_status')->default('Unassigned')->after('status'); // Unassigned, Assigned, Confirmed
            }
            if (! Schema::hasColumn('course_offerings', 'timetable_status')) {
                $table->string('timetable_status')->default('Pending')->after('loading_status'); // Pending, Scheduled, Conflict
            }
            if (! Schema::hasColumn('course_offerings', 'publication_status')) {
                $table->string('publication_status')->default('Draft')->after('timetable_status'); // Draft, Ready, Published, Completed
            }
            if (! Schema::hasColumn('course_offerings', 'special_notes')) {
                $table->text('special_notes')->nullable()->after('publication_status');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_courses');
    }
};
