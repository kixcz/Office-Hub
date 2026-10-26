<?php

use App\Models\Role;
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
        // 1. Add college/channel scoping fields to tv_devices if not present
        Schema::table('tv_devices', function (Blueprint $table) {
            if (! Schema::hasColumn('tv_devices', 'college_name')) {
                $table->string('college_name')->nullable()->default('College of Information and Digital Sciences')->after('location');
            }
            if (! Schema::hasColumn('tv_devices', 'college_code')) {
                $table->string('college_code')->nullable()->default('CIDS')->after('college_name');
            }
            if (! Schema::hasColumn('tv_devices', 'channel_number')) {
                $table->integer('channel_number')->nullable()->default(1)->after('college_code');
            }
        });

        // 2. Ensure all COMPASS institutional & college roles exist in the database
        $standardRoles = [
            // Institution Level
            'Institution Super Admin',
            'VPAF / Executive Oversight',
            'Institution TV / Communications Manager',

            // College Level
            'College Admin',
            'Dean',
            'Program Head',
            'Program Chair',
            'Head Lab / Facility In-Charge',
            'Faculty Member',
            'Non-Teaching Lab / Facility In-Charge',
            'College TV Display / TV Manager',

            // Existing legacy aliases preserved for seamless backward-compatibility
            'System Administrator',
            'Lab In-Charge',
            'Office Secretary',
            'Display Screen',
        ];

        foreach ($standardRoles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        // 3. For any user who has legacy 'System Administrator' or 'Super Admin', also grant 'College Admin'
        $adminRole = Role::where('name', 'System Administrator')->first();
        $collegeAdminRole = Role::where('name', 'College Admin')->first();

        if ($adminRole && $collegeAdminRole) {
            $adminUsers = User::whereHas('roles', fn ($q) => $q->where('roles.id', $adminRole->id))->get();
            foreach ($adminUsers as $user) {
                if (! $user->roles()->where('role_id', $collegeAdminRole->id)->exists()) {
                    $user->roles()->attach($collegeAdminRole->id);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tv_devices', function (Blueprint $table) {
            if (Schema::hasColumn('tv_devices', 'channel_number')) {
                $table->dropColumn('channel_number');
            }
            if (Schema::hasColumn('tv_devices', 'college_code')) {
                $table->dropColumn('college_code');
            }
            if (Schema::hasColumn('tv_devices', 'college_name')) {
                $table->dropColumn('college_name');
            }
        });
    }
};
