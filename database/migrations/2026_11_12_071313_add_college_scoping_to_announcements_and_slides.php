<?php

use App\Models\Announcement;
use App\Models\College;
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
        Schema::table('announcements', function (Blueprint $table) {
            if (! Schema::hasColumn('announcements', 'college_code')) {
                $table->string('college_code')->nullable()->after('destination')->index();
            }
            if (! Schema::hasColumn('announcements', 'college_id')) {
                $table->unsignedBigInteger('college_id')->nullable()->after('college_code')->index();
            }
        });

        // Seed distinct announcements for CED, CBA, COE, CAS so each college has vibrant unique announcements
        $colleges = College::whereIn('code', ['CED', 'CBA', 'COE', 'CAS'])->get();
        $admin = User::first();
        $adminId = $admin ? $admin->id : 1;

        $collegeAnnouncements = [
            'CED' => [
                [
                    'title' => 'Pre-Service Teachers Demonstration Teaching Schedule',
                    'message' => 'All 4th year BSED and BEED students are reminded of their final demonstration teaching starting next Monday across cooperating schools.',
                    'category' => 'Academic',
                    'priority' => 'High',
                    'destination' => 'public',
                ],
                [
                    'title' => 'Licensure Examination for Teachers (LET) Review Sessions',
                    'message' => 'Intensive LET enhancement and refresher classes will take place every Saturday at Education Hall 101.',
                    'category' => 'Board Exam',
                    'priority' => 'Normal',
                    'destination' => 'public',
                ],
            ],
            'CBA' => [
                [
                    'title' => 'Annual Business Plan & Pitching Competition 2026',
                    'message' => 'Young Entrepreneurs Pitching Round commences this Friday at the Business Wing Amphitheater. Faculty mentors are requested to attend.',
                    'category' => 'Competition',
                    'priority' => 'High',
                    'destination' => 'public',
                ],
                [
                    'title' => 'BSA Mock Board Examination Notice',
                    'message' => 'Comprehensive Mock Board Examinations for graduating Accountancy seniors are scheduled for November 25-27.',
                    'category' => 'Accountancy',
                    'priority' => 'High',
                    'destination' => 'public',
                ],
            ],
            'COE' => [
                [
                    'title' => 'Engineering Design & Capstone Project Expo',
                    'message' => 'Final Capstone Project defense and public engineering showcase will be held in the Engineering Innovation Foyer.',
                    'category' => 'Capstone',
                    'priority' => 'High',
                    'destination' => 'public',
                ],
                [
                    'title' => 'Laboratory Equipment Calibration & Safety Audit',
                    'message' => 'Materials Testing and Circuits Laboratories will undergo scheduled recalibration. Please coordinate schedules with Lab in-charge.',
                    'category' => 'Facility',
                    'priority' => 'Normal',
                    'destination' => 'office',
                ],
            ],
            'CAS' => [
                [
                    'title' => 'Interdisciplinary Arts & Sciences Research Colloquium',
                    'message' => 'Faculty researchers and students are invited to present oral and poster papers at the 5th Arts and Sciences Research Symposium.',
                    'category' => 'Research',
                    'priority' => 'High',
                    'destination' => 'public',
                ],
                [
                    'title' => 'Communication Arts Media Literacy Week',
                    'message' => 'Join the BACOMM media exhibits and student documentary film screenings at the Sulop Campus Activity Center.',
                    'category' => 'Student Affairs',
                    'priority' => 'Normal',
                    'destination' => 'public',
                ],
            ],
        ];

        foreach ($collegeAnnouncements as $code => $items) {
            $col = $colleges->firstWhere('code', $code);
            foreach ($items as $item) {
                Announcement::updateOrCreate(
                    [
                        'title' => $item['title'],
                        'college_code' => $code,
                    ],
                    [
                        'message' => $item['message'],
                        'category' => $item['category'],
                        'priority' => $item['priority'],
                        'destination' => $item['destination'],
                        'status' => 'active',
                        'college_id' => $col?->id,
                        'author_id' => $adminId,
                    ]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Announcement::whereIn('college_code', ['CED', 'CBA', 'COE', 'CAS'])->delete();

        Schema::table('announcements', function (Blueprint $table) {
            if (Schema::hasColumn('announcements', 'college_id')) {
                $table->dropColumn('college_id');
            }
            if (Schema::hasColumn('announcements', 'college_code')) {
                $table->dropColumn('college_code');
            }
        });
    }
};
