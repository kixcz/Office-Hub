import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle, Clock, DoorOpen, RefreshCw, Timer, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Classroom Monitoring',
        href: '/classroom-monitoring',
    },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface RoomSchedule {
    id: number;
    room_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    course_code: string | null;
    course_title: string | null;
    instructor: string | null;
    section: string | null;
}

interface MonitoringProps {
    rooms: string[];
    schedules: RoomSchedule[];
    today: string;
    current_time: string;
    last_updated: string;
}

/** 30-minute slots from 7:00 AM to 6:30 PM, as "HH:mm". */
const TIME_SLOTS = Array.from({ length: 24 }, (_, index) => {
    const minutes = 7 * 60 + index * 30;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** Round a "HH:mm" time down to its 30-minute slot, clamped to the slot range. */
function toSlot(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const slot = `${String(hours).padStart(2, '0')}:${minutes < 30 ? '00' : '30'}`;
    if (slot < TIME_SLOTS[0]) {
        return TIME_SLOTS[0];
    }
    if (slot > TIME_SLOTS[TIME_SLOTS.length - 1]) {
        return TIME_SLOTS[TIME_SLOTS.length - 1];
    }
    return slot;
}

function isActiveAt(block: RoomSchedule, time: string): boolean {
    const point = `${time}:00`;
    return block.start_time <= point && block.end_time > point;
}

export default function MonitoringIndex({ rooms, schedules, today, current_time, last_updated }: MonitoringProps) {
    const defaultDay = (DAYS as readonly string[]).includes(today) ? today : 'Monday';
    const [selectedDay, setSelectedDay] = useState<string>(defaultDay);
    const [selectedTime, setSelectedTime] = useState<string>(toSlot(current_time));
    const [selectedRoom, setSelectedRoom] = useState<string>('all');
    const [syncing, setSyncing] = useState(false);

    const handleSync = () => {
        router.post(
            route('classroom-monitoring.sync'),
            {},
            {
                preserveScroll: true,
                onStart: () => setSyncing(true),
                onFinish: () => setSyncing(false),
            },
        );
    };

    const resetToNow = () => {
        setSelectedDay(defaultDay);
        setSelectedTime(toSlot(current_time));
    };

    const roomCards = useMemo(() => {
        const visibleRooms = selectedRoom === 'all' ? rooms : rooms.filter((room) => room === selectedRoom);

        return visibleRooms.map((room) => {
            const blocks = schedules.filter((block) => block.room_name === room && block.day_of_week === selectedDay);
            const current = blocks.find((block) => isActiveAt(block, selectedTime)) ?? null;
            const next = blocks.find((block) => block.start_time > `${selectedTime}:00`) ?? null;

            return { room, blocks, current, next };
        });
    }, [rooms, schedules, selectedDay, selectedTime, selectedRoom]);

    const occupiedCount = roomCards.filter((card) => card.current).length;
    const vacantCount = roomCards.length - occupiedCount;
    const isNow = selectedDay === defaultDay && selectedTime === toSlot(current_time);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Classroom Monitoring" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl leading-tight font-semibold text-gray-800 dark:text-gray-100">Classroom &amp; Laboratory Monitoring</h1>
                        <span className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <Clock size={16} /> Last synced: {last_updated}
                        </span>
                    </div>
                    <Button id="sync-room-schedules" onClick={handleSync} disabled={syncing} className="gap-2">
                        <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync from Google Sheets'}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Day of week">
                        {DAYS.map((day) => (
                            <button
                                key={day}
                                id={`day-${day.toLowerCase()}`}
                                role="tab"
                                aria-selected={selectedDay === day}
                                onClick={() => setSelectedDay(day)}
                                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                                    selectedDay === day
                                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300'
                                }`}
                            >
                                {day}
                                {day === today && <span className="ml-1.5 text-xs opacity-75">(Today)</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Timer size={16} className="text-gray-500" />
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                                <SelectTrigger id="time-select" className="w-40">
                                    <SelectValue placeholder="Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_SLOTS.map((slot) => (
                                        <SelectItem key={slot} value={slot}>
                                            {formatTime(slot)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <DoorOpen size={16} className="text-gray-500" />
                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                <SelectTrigger id="room-select" className="w-40">
                                    <SelectValue placeholder="Room" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All rooms</SelectItem>
                                    {rooms.map((room) => (
                                        <SelectItem key={room} value={room}>
                                            {room}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button id="reset-to-now" variant="outline" size="sm" onClick={resetToNow} disabled={isNow}>
                            Now
                        </Button>

                        <div className="ml-auto flex flex-wrap gap-2 text-sm">
                            <span className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 font-medium text-blue-800">
                                <Users size={16} /> Occupied: {occupiedCount}
                            </span>
                            <span className="flex items-center gap-1.5 rounded-lg border border-green-100 bg-green-50 px-3 py-1.5 font-medium text-green-800">
                                <CheckCircle size={16} /> Vacant: {vacantCount}
                            </span>
                        </div>
                    </div>

                    <p className="flex items-center gap-1.5 text-sm text-gray-500">
                        <CalendarDays size={14} /> Showing who is scheduled on <strong className="text-gray-700 dark:text-gray-200">{selectedDay}</strong> at{' '}
                        <strong className="text-gray-700 dark:text-gray-200">{formatTime(selectedTime)}</strong>
                    </p>
                </div>

                {rooms.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-12 text-center text-gray-500">
                        No room schedules yet. Click <strong>Sync from Google Sheets</strong> to import the lab schedule.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {roomCards.map(({ room, blocks, current, next }) => (
                            <div
                                key={room}
                                className={`flex flex-col rounded-xl border p-5 transition-shadow hover:shadow-md ${
                                    current ? 'border-blue-200 bg-blue-50/60 dark:bg-blue-950/30' : 'border-green-200 bg-green-50/50 dark:bg-green-950/20'
                                }`}
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{room}</h2>
                                    <span
                                        className={`rounded px-2 py-1 text-xs font-bold ${
                                            current ? 'bg-blue-200 text-blue-900' : 'bg-green-200 text-green-900'
                                        }`}
                                    >
                                        {current ? 'Occupied' : 'Vacant'}
                                    </span>
                                </div>

                                {current ? (
                                    <div className="mb-4 rounded-lg border border-blue-200 bg-white p-4 shadow-sm dark:bg-neutral-900">
                                        <p className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
                                            <User size={16} className="text-blue-600" /> {current.instructor ?? 'TBA'}
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {[current.course_code, current.course_title].filter(Boolean).join(' – ')}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                                            {current.section && <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-neutral-800">{current.section}</span>}
                                            <span>
                                                {formatTime(current.start_time)} – {formatTime(current.end_time)}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 rounded-lg border border-green-200 bg-white p-4 text-sm text-gray-600 dark:bg-neutral-900 dark:text-gray-300">
                                        No class scheduled at this time.
                                        {next && (
                                            <p className="mt-1 text-xs">
                                                Up next: <strong>{next.instructor ?? next.course_code}</strong> at {formatTime(next.start_time)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">{selectedDay} schedule</p>
                                {blocks.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">No classes on this day.</p>
                                ) : (
                                    <ul className="flex flex-col gap-1.5">
                                        {blocks.map((block) => {
                                            const active = current?.id === block.id;
                                            return (
                                                <li key={block.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTime(toSlot(block.start_time.substring(0, 5)))}
                                                        className={`flex w-full items-start gap-3 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                                                            active
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-gray-700 hover:bg-white/80 dark:text-gray-300 dark:hover:bg-neutral-800'
                                                        }`}
                                                    >
                                                        <span className={`w-36 shrink-0 font-mono text-xs leading-5 ${active ? 'text-blue-100' : 'text-gray-500'}`}>
                                                            {formatTime(block.start_time)} – {formatTime(block.end_time)}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block truncate font-semibold">{block.instructor ?? 'TBA'}</span>
                                                            <span className={`block truncate text-xs ${active ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                {[block.course_code, block.section].filter(Boolean).join(' · ')}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
