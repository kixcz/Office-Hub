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
        Schema::table('spotlight_slides', function (Blueprint $table) {
            $table->string('subject_type')->default('individual')->after('type'); // individual, multiple, team, program, group_photo
            $table->json('honorees')->nullable()->after('program_or_department'); // array of [{faculty_id, name, title, program, photo_url}]
            $table->string('group_photo_path')->nullable()->after('photo_path');
            $table->string('group_photo_fit')->default('cover')->after('group_photo_path'); // cover, contain
            $table->string('group_photo_focal')->default('center')->after('group_photo_fit'); // center, top, bottom
            $table->boolean('group_photo_overlay')->default(true)->after('group_photo_focal');
            $table->json('supporting_media')->nullable()->after('group_photo_overlay'); // array of [{path, name, caption}]
            $table->string('animation_effect')->default('confetti')->after('transition'); // confetti, balloons, floating_trophies, medals, sparkles, applause, none
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spotlight_slides', function (Blueprint $table) {
            $table->dropColumn([
                'subject_type',
                'honorees',
                'group_photo_path',
                'group_photo_fit',
                'group_photo_focal',
                'group_photo_overlay',
                'supporting_media',
                'animation_effect',
            ]);
        });
    }
};
