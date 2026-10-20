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
        // 1. Add Employment & Teaching Assignment effective dates to faculties table if not exists
        Schema::table('faculties', function (Blueprint $table) {
            if (! Schema::hasColumn('faculties', 'employment_start_date')) {
                $table->date('employment_start_date')->nullable()->after('employment_date');
            }
            if (! Schema::hasColumn('faculties', 'employment_end_date')) {
                $table->date('employment_end_date')->nullable()->after('employment_start_date');
            }
            if (! Schema::hasColumn('faculties', 'teaching_assignment_effective_from')) {
                $table->date('teaching_assignment_effective_from')->nullable()->after('employment_end_date');
            }
            if (! Schema::hasColumn('faculties', 'teaching_assignment_effective_until')) {
                $table->date('teaching_assignment_effective_until')->nullable()->after('teaching_assignment_effective_from');
            }
            if (! Schema::hasColumn('faculties', 'appointment_status')) {
                $table->string('appointment_status')->default('Regular')->after('status');
            }
        });

        // 2. Faculty Teaching Assignment History table (effective-dated subject assignment)
        if (! Schema::hasTable('faculty_teaching_assignments')) {
            Schema::create('faculty_teaching_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
                $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
                $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
                $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
                $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
                $table->date('effective_start_date');
                $table->date('effective_end_date')->nullable();
                $table->string('assignment_role')->default('Primary Instructor'); // Primary, Substitute, Co-Teacher
                $table->string('approval_reference')->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['faculty_id', 'effective_start_date', 'effective_end_date'], 'fac_assignment_dates_idx');
            });
        }

        // 3. Approved Faculty Leave Periods table
        if (! Schema::hasTable('faculty_approved_leaves')) {
            Schema::create('faculty_approved_leaves', function (Blueprint $table) {
                $table->id();
                $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
                $table->date('start_date');
                $table->date('end_date');
                $table->string('leave_type')->default('Sick Leave'); // Sick, Vacation, Maternity, Official Business, Study
                $table->string('approval_reference')->nullable();
                $table->boolean('requires_make_up')->default(true);
                $table->text('reason')->nullable();
                $table->string('status')->default('Approved'); // Approved, Cancelled
                $table->timestamps();

                $table->index(['faculty_id', 'start_date', 'end_date'], 'fac_leaves_dates_idx');
            });
        }

        // 4. Room Conditions & Session Disruptions table
        if (! Schema::hasTable('room_session_disruptions')) {
            Schema::create('room_session_disruptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
                $table->foreignId('verified_schedule_id')->nullable()->constrained('verified_schedules')->nullOnDelete();
                $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
                $table->date('disruption_date');
                $table->string('time_slot')->nullable(); // e.g., 09:00 - 10:30
                $table->integer('scheduled_minutes')->default(90);

                // Room Condition
                $table->string('room_condition')->default('Available');
                // Available, In Use as Scheduled, Occupied by Another Class, Occupied by Unscheduled Activity,
                // Maintenance, Equipment Failure, Power/Network Issue, Temporarily Closed, Reserved for Official Activity, Unavailable - Other

                // Session Outcome
                $table->string('session_outcome')->default('Conducted as Scheduled');
                // Conducted as Scheduled, Transferred to Another Room, Switched to Online Modality, Rescheduled,
                // Class Conducted in Alternative Venue, Cancelled, Awaiting Decision, Not Conducted

                $table->foreignId('alternative_room_id')->nullable()->constrained('rooms')->nullOnDelete();
                $table->boolean('instructional_minutes_delivered')->default(true);
                $table->integer('delivered_minutes')->default(0);
                $table->boolean('make_up_required')->default(false);

                // Tracking
                $table->foreignId('observed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('resolved_at')->nullable();
                $table->text('remarks')->nullable();
                $table->string('resolution_status')->default('Pending'); // Pending, Resolved, Dismissed
                $table->timestamps();

                $table->index(['room_id', 'disruption_date'], 'room_disruption_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_session_disruptions');
        Schema::dropIfExists('faculty_approved_leaves');
        Schema::dropIfExists('faculty_teaching_assignments');

        Schema::table('faculties', function (Blueprint $table) {
            $table->dropColumn([
                'employment_start_date',
                'employment_end_date',
                'teaching_assignment_effective_from',
                'teaching_assignment_effective_until',
                'appointment_status',
            ]);
        });
    }
};
