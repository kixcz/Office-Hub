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
        Schema::table('sections', function (Blueprint $table) {
            if (! Schema::hasColumn('sections', 'adviser_id')) {
                $table->foreignId('adviser_id')->nullable()->after('curriculum_id')->constrained('faculties')->nullOnDelete();
            }
            if (! Schema::hasColumn('sections', 'actual_count')) {
                $table->integer('actual_count')->nullable()->after('population');
            }
            if (! Schema::hasColumn('sections', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('status');
            }
            if (! Schema::hasColumn('sections', 'effective_until')) {
                $table->date('effective_until')->nullable()->after('effective_from');
            }
            if (! Schema::hasColumn('sections', 'remarks')) {
                $table->text('remarks')->nullable()->after('effective_until');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropForeign(['adviser_id']);
            $table->dropColumn(['adviser_id', 'actual_count', 'effective_from', 'effective_until', 'remarks']);
        });
    }
};
