<?php

use App\Jobs\SyncFacilityMonitoring;
use App\Models\FacilityMonitoring;
use App\Models\RoomSchedule;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

function sampleRoomSheetHtml(): string
{
    return <<<'HTML'
    <table class="waffle"><tbody>
        <tr><td colspan="3">CLR1</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>Time</td><td>MON</td><td>TUE</td><td>WED</td><td>THU</td><td>FRI</td><td>SAT</td></tr>
        <tr><td>Morning</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>7:30-8:00</td><td rowspan="3">ISSA 612<br>Strands Alignment Program (Operating Systems)<br>VILLEGAS<br>BSIT 1A</td><td rowspan="3">IT 635 HCI<br>3 BSIS<br>Montoya<br>Lab<br>CLR 3</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>8:00-8:30</td><td></td><td></td><td rowspan="3">Fundamentals of Computing 2<br>BS-MATH 3<br>BALAGA, K.</td><td></td></tr>
        <tr><td>8:30-9:00</td><td></td><td></td><td></td></tr>
        <tr><td>9:00-9:30</td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>1:00-1:30</td><td rowspan="2">IT 623<br>Comp Networking 2<br>BSIT 2B<br>NOVAL</td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td>1:30-2:00</td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody></table>
    HTML;
}

test('it parses slot labels into 24 hour times', function () {
    expect(SyncFacilityMonitoring::parseSlot('7:30-8:00'))->toBe(['start' => '07:30:00', 'end' => '08:00:00'])
        ->and(SyncFacilityMonitoring::parseSlot('12:30-1:00'))->toBe(['start' => '12:30:00', 'end' => '13:00:00'])
        ->and(SyncFacilityMonitoring::parseSlot('6:00 - 6:30'))->toBe(['start' => '18:00:00', 'end' => '18:30:00'])
        ->and(SyncFacilityMonitoring::parseSlot('AFTERNOON'))->toBeNull();
});

test('it parses schedule cell text into fields', function () {
    expect(SyncFacilityMonitoring::parseCellText("IT 635 HCI\n3 BSIS\nMontoya\nLab\nCLR 3"))->toBe([
        'course_code' => 'IT 635',
        'course_title' => 'HCI',
        'instructor' => 'Montoya',
        'section' => '3 BSIS',
    ]);

    expect(SyncFacilityMonitoring::parseCellText("IT 623\nComp Networking 2\nBSIT 2B\nNOVAL"))->toBe([
        'course_code' => 'IT 623',
        'course_title' => 'Comp Networking 2',
        'instructor' => 'NOVAL',
        'section' => 'BSIT 2B',
    ]);

    expect(SyncFacilityMonitoring::parseCellText("Fundamentals of Computing 2\nBS-MATH 3\nBALAGA, K."))->toBe([
        'course_code' => null,
        'course_title' => 'Fundamentals of Computing 2',
        'instructor' => 'BALAGA, K.',
        'section' => 'BS-MATH 3',
    ]);
});

test('it normalizes room tab names', function () {
    expect(SyncFacilityMonitoring::normalizeRoomName('CLR2'))->toBe('CLR 2')
        ->and(SyncFacilityMonitoring::normalizeRoomName('CLR 1'))->toBe('CLR 1')
        ->and(SyncFacilityMonitoring::normalizeRoomName('CHS'))->toBe('CHS');
});

test('it parses a room sheet honouring merged cells', function () {
    $schedules = (new SyncFacilityMonitoring)->parseRoomSheet(sampleRoomSheetHtml(), 'CLR 1');

    expect($schedules)->toHaveCount(4);

    expect($schedules[0])->toMatchArray([
        'room_name' => 'CLR 1',
        'day_of_week' => 'Monday',
        'start_time' => '07:30:00',
        'end_time' => '09:00:00',
        'instructor' => 'VILLEGAS',
        'section' => 'BSIT 1A',
    ]);

    expect($schedules[1])->toMatchArray(['day_of_week' => 'Tuesday', 'instructor' => 'Montoya', 'end_time' => '09:00:00']);
    expect($schedules[2])->toMatchArray(['day_of_week' => 'Friday', 'start_time' => '08:00:00', 'end_time' => '09:30:00', 'instructor' => 'BALAGA, K.']);
    expect($schedules[3])->toMatchArray(['day_of_week' => 'Monday', 'start_time' => '13:00:00', 'end_time' => '14:00:00', 'instructor' => 'NOVAL']);
});

test('the sync job imports room schedules from the spreadsheet', function () {
    $this->travelTo(\Carbon\Carbon::parse('2026-10-05 08:00:00', 'Asia/Manila')); // Monday

    Http::fake([
        '*/htmlview/sheet*' => Http::response(sampleRoomSheetHtml()),
        '*/htmlview' => Http::response('items.push({name: "Faculty", pageUrl: "x", gid: "0",initialSheet: false});items.push({name: "CLR 1", pageUrl: "x", gid: "1235317711",initialSheet: false});'),
    ]);

    (new SyncFacilityMonitoring)->handle();

    expect(RoomSchedule::count())->toBe(4);

    $snapshot = FacilityMonitoring::firstWhere('room_name', 'CLR 1');
    expect($snapshot->status)->toBe('In Use')
        ->and($snapshot->instructor)->toBe('VILLEGAS');
});

test('authenticated users can see room schedules on the monitoring page', function () {
    $this->actingAs(User::factory()->create());

    RoomSchedule::factory()->create([
        'room_name' => 'CLR 2',
        'day_of_week' => 'Monday',
        'start_time' => '09:00:00',
        'end_time' => '10:30:00',
        'instructor' => 'MILLAN',
    ]);

    $this->get(route('classroom-monitoring.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('monitoring/index')
            ->where('rooms', ['CLR 2'])
            ->has('schedules', 1)
            ->where('schedules.0.instructor', 'MILLAN')
            ->has('today')
            ->has('current_time')
        );
});
