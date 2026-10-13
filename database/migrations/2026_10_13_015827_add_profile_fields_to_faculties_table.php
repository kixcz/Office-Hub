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
        Schema::table('faculties', function (Blueprint $table) {
            $table->string('faculty_id')->nullable()->after('last_name');
            $table->string('academic_rank')->nullable()->default('Assistant Professor I')->after('faculty_id');
            $table->string('employment_type')->nullable()->default('Full-time')->after('academic_rank');
            $table->string('status')->nullable()->default('Active')->after('employment_type');
            $table->string('highest_qualification')->nullable()->after('status');
            $table->string('specialization')->nullable()->after('highest_qualification');
            $table->string('email')->nullable()->after('specialization');
            $table->string('phone')->nullable()->after('email');
            $table->string('office_room')->nullable()->after('phone');
            $table->date('employment_date')->nullable()->after('office_room');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            $table->dropColumn([
                'faculty_id',
                'academic_rank',
                'employment_type',
                'status',
                'highest_qualification',
                'specialization',
                'email',
                'phone',
                'office_room',
                'employment_date',
            ]);
        });
    }
};
