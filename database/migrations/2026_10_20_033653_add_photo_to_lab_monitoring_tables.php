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
        Schema::table('lab_monitoring_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('lab_monitoring_sessions', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('remarks');
            }
        });

        Schema::table('lab_monitoring_discrepancies', function (Blueprint $table) {
            if (! Schema::hasColumn('lab_monitoring_discrepancies', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('evidence_details');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_monitoring_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('lab_monitoring_sessions', 'photo_path')) {
                $table->dropColumn('photo_path');
            }
        });

        Schema::table('lab_monitoring_discrepancies', function (Blueprint $table) {
            if (Schema::hasColumn('lab_monitoring_discrepancies', 'photo_path')) {
                $table->dropColumn('photo_path');
            }
        });
    }
};
