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
        if (Schema::hasTable('lab_in_charge_assignments')) {
            Schema::table('lab_in_charge_assignments', function (Blueprint $table) {
                if (! Schema::hasColumn('lab_in_charge_assignments', 'academic_period_id')) {
                    $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
                }
                if (! Schema::hasColumn('lab_in_charge_assignments', 'status')) {
                    $table->string('status', 30)->default('Active')->index();
                }
                if (! Schema::hasColumn('lab_in_charge_assignments', 'reliever_user_id')) {
                    $table->foreignId('reliever_user_id')->nullable()->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('lab_in_charge_assignments', 'notes')) {
                    $table->text('notes')->nullable();
                }
                if (! Schema::hasColumn('lab_in_charge_assignments', 'assigned_by_user_id')) {
                    $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                }
            });
        }

        if (! Schema::hasTable('lab_in_charge_assignment_audits')) {
            Schema::create('lab_in_charge_assignment_audits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->nullable()->constrained('lab_in_charge_assignments')->nullOnDelete();
                $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
                $table->foreignId('previous_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('new_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action_type', 50);
                $table->string('role_type', 50)->nullable();
                $table->text('reason')->nullable();
                $table->json('details')->nullable();
                $table->foreignId('performed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('effective_at')->nullable();
                $table->timestamps();

                $table->index(['room_id', 'created_at']);
                $table->index('action_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_in_charge_assignment_audits');

        if (Schema::hasTable('lab_in_charge_assignments')) {
            Schema::table('lab_in_charge_assignments', function (Blueprint $table) {
                if (Schema::hasColumn('lab_in_charge_assignments', 'assigned_by_user_id')) {
                    $table->dropForeign(['assigned_by_user_id']);
                    $table->dropColumn('assigned_by_user_id');
                }
                if (Schema::hasColumn('lab_in_charge_assignments', 'reliever_user_id')) {
                    $table->dropForeign(['reliever_user_id']);
                    $table->dropColumn('reliever_user_id');
                }
                if (Schema::hasColumn('lab_in_charge_assignments', 'academic_period_id')) {
                    $table->dropForeign(['academic_period_id']);
                    $table->dropColumn('academic_period_id');
                }
                if (Schema::hasColumn('lab_in_charge_assignments', 'status')) {
                    $table->dropColumn('status');
                }
                if (Schema::hasColumn('lab_in_charge_assignments', 'notes')) {
                    $table->dropColumn('notes');
                }
            });
        }
    }
};
