<?php

use App\Models\College;
use App\Models\Faculty;
use App\Models\LocatorSlip;
use App\Models\Room;
use App\Models\RoomSchedule;
use App\Models\TravelOrder;
use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = Carbon::now();
        $todayStr = $now->toDateString();

        // 1. Seed facilities for CED (5), CBA (6), COE (7), CAS (8)
        $collegeRooms = [
            5 => [ // CED
                ['code' => 'ED-101', 'name' => 'Education Lecture Hall 101', 'building' => 'Education Hall', 'floor' => '1st Floor', 'type' => 'Lecture Room'],
                ['code' => 'ED-LAB1', 'name' => 'Speech & Language Laboratory', 'building' => 'Education Hall', 'floor' => '2nd Floor', 'type' => 'Laboratory'],
                ['code' => 'ED-DEMO', 'name' => 'Microteaching Demonstration Room', 'building' => 'Education Hall', 'floor' => '2nd Floor', 'type' => 'Laboratory'],
            ],
            6 => [ // CBA
                ['code' => 'BA-201', 'name' => 'Business Case Analysis Room 201', 'building' => 'Business & Governance Wing', 'floor' => '2nd Floor', 'type' => 'Lecture Room'],
                ['code' => 'BA-FINLAB', 'name' => 'Financial Analytics & Accounting Lab', 'building' => 'Business & Governance Wing', 'floor' => '3rd Floor', 'type' => 'Laboratory'],
            ],
            7 => [ // COE
                ['code' => 'ENG-LAB1', 'name' => 'Materials & Structural Mechanics Lab', 'building' => 'Engineering Complex', 'floor' => 'Ground Floor', 'type' => 'Laboratory'],
                ['code' => 'ENG-CIRCUITS', 'name' => 'Electrical Circuits & Robotics Lab', 'building' => 'Engineering Complex', 'floor' => '2nd Floor', 'type' => 'Laboratory'],
                ['code' => 'ENG-CAD', 'name' => 'Computer-Aided Design & Simulation Lab', 'building' => 'Engineering Complex', 'floor' => '2nd Floor', 'type' => 'Laboratory'],
            ],
            8 => [ // CAS
                ['code' => 'CAS-BIO', 'name' => 'Biology & Microscopy Research Lab', 'building' => 'Academic Block A', 'floor' => '1st Floor', 'type' => 'Laboratory'],
                ['code' => 'CAS-STUDIO', 'name' => 'Broadcast Communication Studio', 'building' => 'Academic Block A', 'floor' => '2nd Floor', 'type' => 'Laboratory'],
            ],
        ];

        foreach ($collegeRooms as $collegeId => $rooms) {
            foreach ($rooms as $r) {
                Room::updateOrCreate(
                    ['room_code' => $r['code']],
                    [
                        'college_id' => $collegeId,
                        'room_name' => $r['name'],
                        'building' => $r['building'],
                        'floor' => $r['floor'],
                        'type' => $r['type'],
                        'capacity' => 40,
                        'status' => 'Available',
                        'condition' => 'Excellent',
                        'operational_status' => 'Operational',
                        'setup_readiness' => 'Ready',
                    ]
                );
            }
        }

        // 2. Seed Room Schedules for each College's Faculty
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // CED faculty (id 63, 64, 65)
        $jonathan = Faculty::find(64);
        if ($jonathan) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Speech & Language Laboratory',
                        'day_of_week' => $day,
                        'start_time' => '08:00:00',
                    ],
                    [
                        'end_time' => '11:00:00',
                        'course_code' => 'ENG-PED101',
                        'course_title' => 'Speech Pedagogy & Phonetics Lab',
                        'instructor' => $jonathan->full_name,
                        'faculty_id' => $jonathan->id,
                        'section' => 'BSED 3-A',
                    ]
                );
            }
        }

        $anna = Faculty::find(65);
        if ($anna) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Microteaching Demonstration Room',
                        'day_of_week' => $day,
                        'start_time' => '13:00:00',
                    ],
                    [
                        'end_time' => '16:00:00',
                        'course_code' => 'ELEM-PED202',
                        'course_title' => 'Elementary Instructional Media Practice',
                        'instructor' => $anna->full_name,
                        'faculty_id' => $anna->id,
                        'section' => 'BEED 2-A',
                    ]
                );
            }
        }

        // CBA faculty (id 67, 68)
        $teresa = Faculty::find(67);
        if ($teresa) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Business Case Analysis Room 201',
                        'day_of_week' => $day,
                        'start_time' => '09:00:00',
                    ],
                    [
                        'end_time' => '12:00:00',
                        'course_code' => 'MKTG-301',
                        'course_title' => 'Strategic Marketing & Product Innovation',
                        'instructor' => $teresa->full_name,
                        'faculty_id' => $teresa->id,
                        'section' => 'BSBA 3-B',
                    ]
                );
            }
        }

        $dexter = Faculty::find(68);
        if ($dexter) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Financial Analytics & Accounting Lab',
                        'day_of_week' => $day,
                        'start_time' => '13:30:00',
                    ],
                    [
                        'end_time' => '16:30:00',
                        'course_code' => 'ACCT-401',
                        'course_title' => 'Computerized Accounting & ERP Systems',
                        'instructor' => $dexter->full_name,
                        'faculty_id' => $dexter->id,
                        'section' => 'BSA 4-A',
                    ]
                );
            }
        }

        // COE faculty (id 70, 71)
        $paolo = Faculty::find(70);
        if ($paolo) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Materials & Structural Mechanics Lab',
                        'day_of_week' => $day,
                        'start_time' => '08:30:00',
                    ],
                    [
                        'end_time' => '11:30:00',
                        'course_code' => 'CE-311',
                        'course_title' => 'Structural Mechanics & Material Testing',
                        'instructor' => $paolo->full_name,
                        'faculty_id' => $paolo->id,
                        'section' => 'BSCE 3-A',
                    ]
                );
            }
        }

        $grace = Faculty::find(71);
        if ($grace) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Electrical Circuits & Robotics Lab',
                        'day_of_week' => $day,
                        'start_time' => '13:00:00',
                    ],
                    [
                        'end_time' => '16:00:00',
                        'course_code' => 'EE-205',
                        'course_title' => 'Circuits Simulation & Microcontrollers',
                        'instructor' => $grace->full_name,
                        'faculty_id' => $grace->id,
                        'section' => 'BSEE 2-A',
                    ]
                );
            }
        }

        // CAS faculty (id 73, 74)
        $sarah = Faculty::find(73);
        if ($sarah) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Broadcast Communication Studio',
                        'day_of_week' => $day,
                        'start_time' => '09:00:00',
                    ],
                    [
                        'end_time' => '12:00:00',
                        'course_code' => 'COMM-204',
                        'course_title' => 'Broadcast Production & Audio-Visual Media',
                        'instructor' => $sarah->full_name,
                        'faculty_id' => $sarah->id,
                        'section' => 'BACOMM 2-A',
                    ]
                );
            }
        }

        $michael = Faculty::find(74);
        if ($michael) {
            foreach ($days as $day) {
                RoomSchedule::updateOrCreate(
                    [
                        'room_name' => 'Biology & Microscopy Research Lab',
                        'day_of_week' => $day,
                        'start_time' => '13:00:00',
                    ],
                    [
                        'end_time' => '16:00:00',
                        'course_code' => 'BIO-305',
                        'course_title' => 'Microbiology & Botanical Tissue Culture',
                        'instructor' => $michael->full_name,
                        'faculty_id' => $michael->id,
                        'section' => 'BSBIO 3-A',
                    ]
                );
            }
        }

        // 3. Seed Locator Slips & Travel Orders for other colleges
        // CED: Dr. Carmela Bautista travel order
        $carmela = Faculty::find(63);
        if ($carmela) {
            TravelOrder::updateOrCreate(
                ['tracking_number' => 'TO-2026-CED-001'],
                [
                    'faculty_id' => $carmela->id,
                    'faculty_name' => $carmela->full_name,
                    'designation' => 'Dean, College of Teacher Education',
                    'destination' => 'DepEd Regional Office XI, Davao City',
                    'purpose' => 'Annual Consultative Conference on Teacher Education Curriculum Standards',
                    'start_date' => $now->copy()->subDays(1)->format('Y-m-d'),
                    'end_date' => $now->copy()->addDays(2)->format('Y-m-d'),
                    'status' => 'Approved',
                    'source_of_funds' => 'GAA / STF',
                    'tracking_code' => 'TRK-CED-2026-88',
                ]
            );

            LocatorSlip::updateOrCreate(
                ['slip_number' => 'LS-2026-CED-001'],
                [
                    'faculty_id' => $carmela->id,
                    'faculty_name' => $carmela->full_name,
                    'destination' => 'Davao City Division Office',
                    'purpose' => 'Coordination meeting for Practice Teaching interns',
                    'date' => $todayStr,
                    'slip_type' => 'Official',
                    'time_out' => '09:00:00',
                    'time_in' => '17:00:00',
                    'status' => 'Departed',
                ]
            );
        }

        // CBA: Dr. Fernando Gomez travel order
        $fernando = Faculty::find(66);
        if ($fernando) {
            TravelOrder::updateOrCreate(
                ['tracking_number' => 'TO-2026-CBA-001'],
                [
                    'faculty_id' => $fernando->id,
                    'faculty_name' => $fernando->full_name,
                    'designation' => 'Dean, College of Business Administration',
                    'destination' => 'Makati City Business Financial District',
                    'purpose' => 'ASEAN Business Education Accreditation Forum & Industry Partnership Summit',
                    'start_date' => $now->copy()->format('Y-m-d'),
                    'end_date' => $now->copy()->addDays(3)->format('Y-m-d'),
                    'status' => 'Approved',
                    'source_of_funds' => 'GAA / STF',
                    'tracking_code' => 'TRK-CBA-2026-12',
                ]
            );
        }

        // COE: Engr. Victor Salcedo locator slip
        $victor = Faculty::find(69);
        if ($victor) {
            LocatorSlip::updateOrCreate(
                ['slip_number' => 'LS-2026-COE-001'],
                [
                    'faculty_id' => $victor->id,
                    'faculty_name' => $victor->full_name,
                    'destination' => 'DPWH Regional Materials Testing Laboratory',
                    'purpose' => 'Witnessing tensile compressive testing of research structural specimens',
                    'date' => $todayStr,
                    'slip_type' => 'Official',
                    'time_out' => '10:00:00',
                    'time_in' => '16:30:00',
                    'status' => 'Departed',
                ]
            );
        }

        // CAS: Dr. Rebecca Miranda travel order
        $rebecca = Faculty::find(72);
        if ($rebecca) {
            TravelOrder::updateOrCreate(
                ['tracking_number' => 'TO-2026-CAS-001'],
                [
                    'faculty_id' => $rebecca->id,
                    'faculty_name' => $rebecca->full_name,
                    'designation' => 'Dean, College of Arts and Sciences',
                    'destination' => 'National Museum of Natural History, Manila',
                    'purpose' => 'Flora and Fauna Specimen Deposit & Collaborative Field Research Consultation',
                    'start_date' => $now->copy()->subDays(2)->format('Y-m-d'),
                    'end_date' => $now->copy()->addDays(1)->format('Y-m-d'),
                    'status' => 'Approved',
                    'source_of_funds' => 'GAA / STF',
                    'tracking_code' => 'TRK-CAS-2026-44',
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        TravelOrder::whereIn('tracking_number', ['TO-2026-CED-001', 'TO-2026-CBA-001', 'TO-2026-CAS-001'])->delete();
        LocatorSlip::whereIn('slip_number', ['LS-2026-CED-001', 'LS-2026-COE-001'])->delete();
        RoomSchedule::whereIn('faculty_id', [64, 65, 67, 68, 70, 71, 73, 74])->delete();
        Room::whereIn('room_code', ['ED-101', 'ED-LAB1', 'ED-DEMO', 'BA-201', 'BA-FINLAB', 'ENG-LAB1', 'ENG-CIRCUITS', 'ENG-CAD', 'CAS-BIO', 'CAS-STUDIO'])->delete();
    }
};
