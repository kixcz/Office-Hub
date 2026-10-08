<?php

namespace App\Jobs;

use App\Models\FacilityMonitoring;
use App\Models\RoomSchedule;
use Carbon\Carbon;
use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncFacilityMonitoring implements ShouldQueue
{
    use Queueable;

    /**
     * Map of spreadsheet day headers to full day names.
     *
     * @var array<string, string>
     */
    private const DAY_HEADERS = [
        'MON' => 'Monday',
        'TUE' => 'Tuesday',
        'WED' => 'Wednesday',
        'THU' => 'Thursday',
        'FRI' => 'Friday',
        'SAT' => 'Saturday',
        'SUN' => 'Sunday',
    ];

    public function handle(): void
    {
        $spreadsheetId = config('services.room_schedule.spreadsheet_id');

        if (! $spreadsheetId) {
            Log::error('Room schedule spreadsheet ID is not configured.');

            return;
        }

        try {
            $tabs = $this->fetchRoomTabs($spreadsheetId);

            if ($tabs === []) {
                Log::warning('No room tabs (CLR/COM/CHS) found in the room schedule spreadsheet.');

                return;
            }

            $schedules = [];

            foreach ($tabs as $tabName => $gid) {
                $response = Http::withoutVerifying()->get(
                    "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/htmlview/sheet",
                    ['headers' => 'false', 'gid' => $gid]
                );

                if (! $response->successful()) {
                    Log::warning("Failed to fetch room schedule tab [{$tabName}].");

                    continue;
                }

                array_push($schedules, ...$this->parseRoomSheet($response->body(), self::normalizeRoomName($tabName)));
            }

            if ($schedules === []) {
                Log::warning('No room schedules parsed from the spreadsheet.');

                return;
            }

            $timestamp = now();

            DB::transaction(function () use ($schedules, $timestamp): void {
                RoomSchedule::query()->delete();

                foreach (array_chunk($schedules, 200) as $chunk) {
                    RoomSchedule::insert(array_map(
                        fn (array $row): array => [...$row, 'created_at' => $timestamp, 'updated_at' => $timestamp],
                        $chunk
                    ));
                }
            });

            self::refreshSnapshot(Carbon::now(config('services.room_schedule.timezone')));

            Cache::put('facility_monitoring_last_sync', now(), now()->addDays(7));
            Log::info('Room schedules synchronized from Google Sheets successfully.');
        } catch (\Throwable $e) {
            Log::error('Failed to sync room schedules from Google Sheets: '.$e->getMessage());
        }
    }

    /**
     * Discover the room tabs of the spreadsheet and their gids.
     *
     * @return array<string, string> tab name => gid
     */
    public function fetchRoomTabs(string $spreadsheetId): array
    {
        $response = Http::withoutVerifying()->get("https://docs.google.com/spreadsheets/d/{$spreadsheetId}/htmlview");

        if (! $response->successful()) {
            return [];
        }

        preg_match_all('/items\.push\(\{name:\s*"(.*?)",.*?gid:\s*"(-?\d+)"/', $response->body(), $matches, PREG_SET_ORDER);

        $pattern = config('services.room_schedule.room_tab_pattern');
        $tabs = [];

        foreach ($matches as [, $name, $gid]) {
            $name = trim(stripcslashes($name));

            if (preg_match($pattern, $name)) {
                $tabs[$name] = $gid;
            }
        }

        return $tabs;
    }

    /**
     * Parse a room tab (published HTML) into schedule blocks, honouring merged cells.
     *
     * @return list<array{room_name: string, day_of_week: string, start_time: string, end_time: string, course_code: ?string, course_title: ?string, instructor: ?string, section: ?string, raw_text: string}>
     */
    public function parseRoomSheet(string $html, string $roomName): array
    {
        $grid = $this->buildGrid($html);

        $dayColumns = [];
        $headerRow = null;

        foreach ($grid as $rowIndex => $row) {
            foreach ($row as $colIndex => $cell) {
                $label = strtoupper(trim($cell['text']));

                if ($cell['origin'] && isset(self::DAY_HEADERS[$label])) {
                    $dayColumns[$colIndex] = self::DAY_HEADERS[$label];
                }
            }

            if ($dayColumns !== []) {
                $headerRow = $rowIndex;
                break;
            }
        }

        if ($headerRow === null) {
            return [];
        }

        $slots = [];

        foreach ($grid as $rowIndex => $row) {
            if ($rowIndex > $headerRow && isset($row[0])) {
                $slots[$rowIndex] = self::parseSlot($row[0]['text']);
            }
        }

        $schedules = [];

        foreach ($grid as $rowIndex => $row) {
            if ($rowIndex <= $headerRow || empty($slots[$rowIndex])) {
                continue;
            }

            foreach ($dayColumns as $colIndex => $day) {
                $cell = $row[$colIndex] ?? null;

                if (! $cell || ! $cell['origin'] || trim($cell['text']) === '') {
                    continue;
                }

                $endTime = $slots[$rowIndex]['end'];

                for ($r = $rowIndex; $r < $rowIndex + $cell['rowspan']; $r++) {
                    if (! empty($slots[$r])) {
                        $endTime = $slots[$r]['end'];
                    }
                }

                $schedules[] = [
                    'room_name' => $roomName,
                    'day_of_week' => $day,
                    'start_time' => $slots[$rowIndex]['start'],
                    'end_time' => $endTime,
                    ...self::parseCellText($cell['text']),
                    'raw_text' => trim($cell['text']),
                ];
            }
        }

        return $schedules;
    }

    /**
     * Rebuild the "current status" snapshot used by the TV display.
     */
    public static function refreshSnapshot(Carbon $now): void
    {
        $day = $now->format('l');
        $time = $now->format('H:i:s');

        $rooms = RoomSchedule::query()->distinct()->orderBy('room_name')->pluck('room_name');
        $todaySchedules = RoomSchedule::query()->where('day_of_week', $day)->orderBy('start_time')->get()->groupBy('room_name');

        $snapshot = $rooms->map(function (string $room) use ($todaySchedules, $time): array {
            $blocks = $todaySchedules->get($room, collect());
            $current = $blocks->first(fn (RoomSchedule $block): bool => $block->start_time <= $time && $block->end_time > $time);
            $next = $blocks->first(fn (RoomSchedule $block): bool => $block->start_time > $time);

            return [
                'room_name' => $room,
                'room_type' => 'Laboratory',
                'current_class' => $current ? trim(($current->course_code ?? '').' '.($current->course_title ?? '')) : null,
                'program' => $current?->section,
                'instructor' => $current?->instructor,
                'start_time' => $current?->start_time,
                'end_time' => $current?->end_time,
                'status' => $current ? 'In Use' : 'Available',
                'remarks' => null,
                'next_schedule' => $next
                    ? trim(($next->instructor ?? $next->course_code ?? 'Class').' at '.Carbon::parse($next->start_time)->format('g:i A'))
                    : null,
            ];
        });

        DB::transaction(function () use ($snapshot): void {
            FacilityMonitoring::query()->delete();

            foreach ($snapshot as $data) {
                FacilityMonitoring::create($data);
            }
        });
    }

    /**
     * Normalize tab names like "CLR2" / "clr 2" to "CLR 2".
     */
    public static function normalizeRoomName(string $name): string
    {
        return preg_replace('/^([A-Z]+)\s*(\d+)$/', '$1 $2', strtoupper(trim($name)));
    }

    /**
     * Parse a time slot label such as "7:30-8:00" or "12:30 - 1:00" into 24h times.
     * Hours before 7 are treated as PM since classes run from 7:00 AM to 7:00 PM.
     *
     * @return array{start: string, end: string}|null
     */
    public static function parseSlot(string $label): ?array
    {
        if (! preg_match('/^\s*(\d{1,2}):(\d{2})\s*(?:am|pm)?\s*-\s*(\d{1,2}):(\d{2})/i', $label, $m)) {
            return null;
        }

        $toTime = function (int $hour, int $minute): string {
            if ($hour < 7) {
                $hour += 12;
            }

            return sprintf('%02d:%02d:00', $hour, $minute);
        };

        return [
            'start' => $toTime((int) $m[1], (int) $m[2]),
            'end' => $toTime((int) $m[3], (int) $m[4]),
        ];
    }

    /**
     * Split a schedule cell (course code, title, instructor, section) into fields.
     *
     * @return array{course_code: ?string, course_title: ?string, instructor: ?string, section: ?string}
     */
    public static function parseCellText(string $text): array
    {
        $lines = array_values(array_filter(array_map('trim', preg_split('/\R/', $text)), fn (string $line): bool => $line !== ''));

        $courseCode = null;
        $courseTitle = null;
        $section = null;

        if (isset($lines[0]) && preg_match('/^([A-Z]{2,5}\s*[0-9O]{3})\b\s*(.*)$/i', $lines[0], $m)) {
            $courseCode = strtoupper(preg_replace('/\s+/', ' ', $m[1]));
            $courseTitle = $m[2] !== '' ? $m[2] : null;
            array_shift($lines);
        }

        foreach ($lines as $index => $line) {
            if (preg_match('/^(\d\s*-?\s*)?(BS|DIT)/', $line)) {
                $section = $line;
                unset($lines[$index]);
                break;
            }
        }

        $lines = array_values(array_filter($lines, fn (string $line): bool => ! preg_match('/^(lab|lec|lecture|laboratory|(CLR|COM|CHS)\s*\d*)$/i', $line)));

        if ($courseTitle === null && $lines !== []) {
            $courseTitle = array_shift($lines);
        }

        return [
            'course_code' => $courseCode,
            'course_title' => $courseTitle,
            'instructor' => $lines !== [] ? implode(' / ', $lines) : null,
            'section' => $section,
        ];
    }

    /**
     * Expand the first HTML table into a grid, resolving rowspan/colspan.
     *
     * @return array<int, array<int, array{text: string, rowspan: int, origin: bool}>>
     */
    private function buildGrid(string $html): array
    {
        $dom = new DOMDocument;
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">'.$html);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $rows = $xpath->query('(//table)[1]/tbody/tr');

        $grid = [];

        foreach ($rows as $rowIndex => $tr) {
            $colIndex = 0;

            foreach ($tr->childNodes as $node) {
                if (! $node instanceof DOMElement || $node->nodeName !== 'td') {
                    continue;
                }

                while (isset($grid[$rowIndex][$colIndex])) {
                    $colIndex++;
                }

                $rowspan = max(1, (int) ($node->getAttribute('rowspan') ?: 1));
                $colspan = max(1, (int) ($node->getAttribute('colspan') ?: 1));
                $text = $this->cellText($node);

                for ($r = 0; $r < $rowspan; $r++) {
                    for ($c = 0; $c < $colspan; $c++) {
                        $grid[$rowIndex + $r][$colIndex + $c] = [
                            'text' => $text,
                            'rowspan' => $rowspan,
                            'origin' => $r === 0 && $c === 0,
                        ];
                    }
                }

                $colIndex += $colspan;
            }
        }

        ksort($grid);

        return $grid;
    }

    /**
     * Extract a cell's text, converting <br> tags to newlines.
     */
    private function cellText(\DOMNode $node): string
    {
        $text = '';

        foreach ($node->childNodes as $child) {
            $text .= match (true) {
                $child->nodeName === 'br' => "\n",
                $child instanceof DOMElement => $this->cellText($child),
                default => $child->textContent,
            };
        }

        return str_replace("\u{00A0}", ' ', $text);
    }
}
