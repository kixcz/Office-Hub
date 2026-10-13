<?php

use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\Program;

// Ensure programs
$bsit = Program::where('code', 'BSIT')->first();
$bsis = Program::where('code', 'BSIS')->first();
$bscs = Program::where('code', 'BSCS')->first();
$blis = Program::where('code', 'BLIS')->first();

// Ensure mock faculty exist with proper names matching screenshot
$sampleFaculties = [
    ['first_name' => 'Juan', 'last_name' => 'Dela Cruz', 'program_id' => $bsit?->id, 'rank' => 'Assistant Professor I'],
    ['first_name' => 'Maria', 'last_name' => 'Santos', 'program_id' => $bsis?->id, 'rank' => 'Associate Professor II'],
    ['first_name' => 'Peter', 'last_name' => 'Castillo', 'program_id' => $bsit?->id, 'rank' => 'Instructor III'],
    ['first_name' => 'Ana', 'last_name' => 'Reyes', 'program_id' => $bscs?->id, 'rank' => 'Associate Professor I'],
    ['first_name' => 'James', 'last_name' => 'Lim', 'program_id' => $bsis?->id, 'rank' => 'Assistant Professor II'],
    ['first_name' => 'Kris', 'last_name' => 'Bahaya', 'program_id' => $bsit?->id, 'rank' => 'Associate Professor I'],
    ['first_name' => 'Ella', 'last_name' => 'Mendoza', 'program_id' => $bsit?->id, 'rank' => 'Instructor I'],
    ['first_name' => 'Ramel', 'last_name' => 'Panaligan', 'program_id' => $bsis?->id, 'rank' => 'Professor I'],
];

foreach ($sampleFaculties as $sf) {
    Faculty::firstOrCreate(
        ['first_name' => $sf['first_name'], 'last_name' => $sf['last_name']],
        [
            'program_id' => $sf['program_id'],
            'academic_rank' => $sf['rank'],
            'employment_type' => 'Full-time',
            'status' => 'Active',
            'employee_id' => 'CIDS-'.strtoupper(substr($sf['last_name'], 0, 3)).'-'.rand(100, 999),
        ]
    );
}

// Sample weekly records matching screenshot for August 10 – 14, 2026 (Week 2)
$weekLabel = 'August 10 – 14, 2026 (Week 2)';

$sessions = [
    [
        'date' => '2026-08-10',
        'day' => 'Mon',
        'time' => '7:00 AM – 8:30 AM',
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'section' => 'BSIT 3A',
        'subject' => 'Data Structures',
        'room' => 'Main Lab',
        'status' => 'Present',
        'late_minutes' => 0,
        'remarks' => null,
    ],
    [
        'date' => '2026-08-10',
        'day' => 'Mon',
        'time' => '8:30 AM – 10:00 AM',
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'section' => 'BSIS 2B',
        'subject' => 'Web Development',
        'room' => 'ICT Lab 2',
        'status' => 'Present',
        'late_minutes' => 0,
        'remarks' => null,
    ],
    [
        'date' => '2026-08-10',
        'day' => 'Mon',
        'time' => '10:00 AM – 11:30 AM',
        'first_name' => 'Peter',
        'last_name' => 'Castillo',
        'section' => 'BSIT 1A',
        'subject' => 'Introduction to Computing',
        'room' => 'Room 101',
        'status' => 'Late',
        'late_minutes' => 20,
        'remarks' => 'Started at 10:20 AM',
    ],
    [
        'date' => '2026-08-10',
        'day' => 'Mon',
        'time' => '1:00 PM – 2:30 PM',
        'first_name' => 'Ana',
        'last_name' => 'Reyes',
        'section' => 'BSCS 4A',
        'subject' => 'Machine Learning',
        'room' => 'ICT Lab 1',
        'status' => 'Absent',
        'late_minutes' => 0,
        'remarks' => null,
    ],
    [
        'date' => '2026-08-10',
        'day' => 'Mon',
        'time' => '2:30 PM – 4:00 PM',
        'first_name' => 'James',
        'last_name' => 'Lim',
        'section' => 'BSIS 3A',
        'subject' => 'Human Computer Interaction',
        'room' => 'Room 204',
        'status' => 'Present',
        'late_minutes' => 0,
        'remarks' => null,
    ],
    [
        'date' => '2026-08-11',
        'day' => 'Tue',
        'time' => '7:00 AM – 8:30 AM',
        'first_name' => 'Kris',
        'last_name' => 'Bahaya',
        'section' => 'BSIT 2A',
        'subject' => 'Network Fundamentals',
        'room' => 'Main Lab',
        'status' => 'Present',
        'late_minutes' => 0,
        'remarks' => null,
    ],
    [
        'date' => '2026-08-11',
        'day' => 'Tue',
        'time' => '8:30 AM – 10:00 AM',
        'first_name' => 'Ella',
        'last_name' => 'Mendoza',
        'section' => 'BSIT 1B',
        'subject' => 'Computer Programming 1',
        'room' => 'Room 102',
        'status' => 'Absent',
        'late_minutes' => 0,
        'remarks' => null,
    ],
    [
        'date' => '2026-08-11',
        'day' => 'Tue',
        'time' => '10:00 AM – 11:30 AM',
        'first_name' => 'Ramel',
        'last_name' => 'Panaligan',
        'section' => 'BSIS 4A',
        'subject' => 'Information Security',
        'room' => 'ICT Lab 3',
        'status' => 'Present',
        'late_minutes' => 0,
        'remarks' => null,
    ],
];

// Delete previous week label records or replace them
FacultyAttendance::where('week_label', $weekLabel)->delete();

foreach ($sessions as $s) {
    $faculty = Faculty::where('first_name', $s['first_name'])->where('last_name', $s['last_name'])->first();
    FacultyAttendance::create([
        'faculty_id' => $faculty?->id,
        'instructor_name' => $s['first_name'].' '.$s['last_name'],
        'session_date' => $s['date'],
        'day_of_week' => $s['day'],
        'time_slot' => $s['time'],
        'section' => $s['section'],
        'subject' => $s['subject'],
        'room' => $s['room'],
        'week_label' => $weekLabel,
        'status' => $s['status'],
        'late_minutes' => $s['late_minutes'],
        'remarks' => $s['remarks'],
        'academic_year' => 'AY 2026–2027',
        'semester' => '1st Semester',
        'source' => 'Google Sheets',
    ]);
}

echo 'Seeded '.count($sessions)." attendance sessions successfully.\n";
