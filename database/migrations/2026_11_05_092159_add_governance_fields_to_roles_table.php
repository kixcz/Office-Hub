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
        Schema::table('roles', function (Blueprint $table) {
            if (! Schema::hasColumn('roles', 'status')) {
                $table->string('status')->default('Active')->after('is_system_role');
            }
            if (! Schema::hasColumn('roles', 'allowed_scopes')) {
                $table->json('allowed_scopes')->nullable()->after('description');
            }
            if (! Schema::hasColumn('roles', 'requires_mfa')) {
                $table->boolean('requires_mfa')->default(false)->after('allowed_scopes');
            }
            if (! Schema::hasColumn('roles', 'requires_approval')) {
                $table->boolean('requires_approval')->default(false)->after('requires_mfa');
            }
            if (! Schema::hasColumn('roles', 'icon_key')) {
                $table->string('icon_key')->nullable()->after('requires_approval');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $cols = array_filter(
                ['status', 'allowed_scopes', 'requires_mfa', 'requires_approval', 'icon_key'],
                fn (string $c) => Schema::hasColumn('roles', $c),
            );
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
