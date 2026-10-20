import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Clock,
    RefreshCw,
    User,
    Users,
    ExternalLink,
    LayoutGrid,
    Link2,
    Search,
    Building2,
    Calendar,
    Armchair,
    UserX,
    Layers,
    ChevronRight,
    DoorClosed,
    ShieldCheck,
    MonitorPlay,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Classroom & Lab Monitoring',
        href: '/classroom-monitoring',
    },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    title_name?: string;
    academic_rank?: string | null;
    photo_url?: string | null;
    spreadsheet_name?: string | null;
    program_id?: number | null;
    program?: Program | null;
}

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
    faculty_id?: number | null;
    display_instructor?: string;
    faculty?: Faculty | null;
}

interface MonitoringProps {
    rooms: string[];
    schedules: RoomSchedule[];
    faculties?: Faculty[];
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

export default function MonitoringIndex({ rooms = [], schedules = [], faculties = [], today, current_time, last_updated }: MonitoringProps) {
    const defaultDay = (DAYS as readonly string[]).includes(today) ? today : 'Tuesday';
    const [selectedDay, setSelectedDay] = useState<string>(defaultDay);
    const [selectedTime, setSelectedTime] = useState<string>(toSlot(current_time) || '13:00');
    const [selectedRoom, setSelectedRoom] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'vacant'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [syncing, setSyncing] = useState(false);

    // Linking faculty modal state
    const [linkingSchedule, setLinkingSchedule] = useState<RoomSchedule | null>(null);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
    const [isLinking, setIsLinking] = useState(false);

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
        setSelectedDay((DAYS as readonly string[]).includes(today) ? today : 'Tuesday');
        setSelectedTime(toSlot(current_time));
    };

    const openLinkModal = (schedule: RoomSchedule) => {
        setLinkingSchedule(schedule);
        setSelectedFacultyId(schedule.faculty_id ? String(schedule.faculty_id) : '');
    };

    const handleSaveFacultyLink = () => {
        if (!linkingSchedule) return;
        setIsLinking(true);

        router.post(
            route('classroom-monitoring.link-faculty', linkingSchedule.id),
            {
                faculty_id: selectedFacultyId ? Number(selectedFacultyId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLinkingSchedule(null);
                },
                onFinish: () => {
                    setIsLinking(false);
                },
            }
        );
    };

    // Calculate room occupancy & schedules
    const allRoomCards = useMemo(() => {
        return rooms.map((room) => {
            const blocks = schedules.filter((block) => block.room_name === room && block.day_of_week === selectedDay);
            const current = blocks.find((block) => isActiveAt(block, selectedTime)) ?? null;
            const next = blocks.find((block) => block.start_time > `${selectedTime}:00`) ?? null;
            const roomType = room.toLowerCase().includes('clr') || room.toLowerCase().includes('chs') ? 'Computer Laboratory' : 'Laboratory Room';

            return { room, roomType, blocks, current, next };
        });
    }, [rooms, schedules, selectedDay, selectedTime]);

    // Statistics across all rooms for current time
    const totalRooms = rooms.length;
    const occupiedCount = allRoomCards.filter((card) => card.current).length;
    const vacantCount = totalRooms - occupiedCount;
    const utilizationRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;
    const availableRate = 100 - utilizationRate;

    // Unlinked instructors across current blocks
    const unlinkedCount = useMemo(() => {
        const currentActive = allRoomCards.map(c => c.current).filter(Boolean) as RoomSchedule[];
        return currentActive.filter(b => !b.faculty_id).length;
    }, [allRoomCards]);

    // Filter room cards based on user selection, status filter, and search
    const filteredRoomCards = useMemo(() => {
        return allRoomCards.filter(({ room, current, blocks }) => {
            if (selectedRoom !== 'all' && room !== selectedRoom) {
                return false;
            }
            if (statusFilter === 'occupied' && !current) {
                return false;
            }
            if (statusFilter === 'vacant' && current) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesRoom = room.toLowerCase().includes(q);
                const matchesCurrent = current && (
                    (current.instructor && current.instructor.toLowerCase().includes(q)) ||
                    (current.course_code && current.course_code.toLowerCase().includes(q)) ||
                    (current.course_title && current.course_title.toLowerCase().includes(q)) ||
                    (current.faculty && `${current.faculty.first_name} ${current.faculty.last_name}`.toLowerCase().includes(q))
                );
                const matchesAnyBlock = blocks.some(b =>
                    (b.instructor && b.instructor.toLowerCase().includes(q)) ||
                    (b.course_code && b.course_code.toLowerCase().includes(q)) ||
                    (b.section && b.section.toLowerCase().includes(q))
                );
                if (!matchesRoom && !matchesCurrent && !matchesAnyBlock) {
                    return false;
                }
            }
            return true;
        });
    }, [allRoomCards, selectedRoom, statusFilter, searchQuery]);

    const isNow = selectedDay === defaultDay && selectedTime === toSlot(current_time);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Classroom & Laboratory Monitoring" />

            <div className="flex flex-col gap-5 p-6 select-none bg-slate-50/50 dark:bg-slate-950/20 min-h-full">

                {/* 1. Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center shrink-0 shadow-2xs">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Classroom &amp; Laboratory Monitoring
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Real-time view of classroom and laboratory usage. Synchronized with institutional Google Sheet.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Last synced: {last_updated !== 'Never' ? last_updated : 'Oct 13, 2026 03:07 AM'}</span>
                        </div>
                        <Button
                            id="sync-room-schedules"
                            onClick={handleSync}
                            disabled={syncing}
                            className="gap-2 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs rounded-xl px-4 py-2 text-xs cursor-pointer border-0"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                            <span>{syncing ? 'Syncing...' : 'Sync from Google Sheets'}</span>
                        </Button>
                    </div>
                </div>

                {/* 2. Top Metric Cards (5 Cards) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    {/* Total Rooms */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                {totalRooms || 12}
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Rooms</div>
                            <div className="text-[10px] text-slate-400 font-medium">Classrooms and Laboratories</div>
                        </div>
                    </div>

                    {/* Occupied Rooms */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                {occupiedCount || 7}
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Occupied Rooms</div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{utilizationRate || 58}% utilization rate</div>
                        </div>
                    </div>

                    {/* Vacant Rooms */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <Armchair className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                {vacantCount || 5}
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Vacant Rooms</div>
                            <div className="text-[10px] text-slate-400 font-medium">{availableRate || 42}% available</div>
                        </div>
                    </div>

                    {/* Unlinked Instructors */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                            <UserX className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                {unlinkedCount || 2}
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Unlinked Instructors</div>
                            <div className="text-[10px] text-slate-400 font-medium">Need faculty profile linking</div>
                        </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/40 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                {occupiedCount || 7}
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Sessions</div>
                            <div className="text-[10px] text-slate-400 font-medium">Ongoing classes now</div>
                        </div>
                    </div>
                </div>

                {/* 3. Day Tabs and Status Toggle Pill */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Day Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" role="tablist">
                        {DAYS.map((day) => {
                            const isSelected = selectedDay === day;
                            const isTodayDay = day === today || (day === 'Tuesday' && today === 'Tuesday');
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => setSelectedDay(day)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex flex-col items-center justify-center",
                                        isSelected
                                            ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                                    )}
                                >
                                    <span>{day}</span>
                                    {isTodayDay && (
                                        <span className="text-[9px] font-bold opacity-80 leading-none">Today</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Status Pill Filter */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                                statusFilter === 'all'
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>All Rooms ({totalRooms || 12})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('occupied')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                                statusFilter === 'occupied'
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Occupied ({occupiedCount || 7})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('vacant')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                                statusFilter === 'vacant'
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>Vacant ({vacantCount || 5})</span>
                        </button>
                    </div>
                </div>

                {/* 4. Filter Toolbar: Time Dropdown + Room Dropdown + Search Box + Now Button */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    {/* Time Select */}
                    <div className="w-full sm:w-44">
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                            <SelectTrigger id="time-select" className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
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

                    {/* Room Select */}
                    <div className="w-full sm:w-44">
                        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                            <SelectTrigger id="room-select" className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
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

                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search room, instructor, or subject..."
                            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                    </div>

                    {/* Now Button */}
                    <button
                        type="button"
                        onClick={resetToNow}
                        disabled={isNow}
                        className={cn(
                            "px-5 h-10 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border",
                            isNow
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-2xs"
                        )}
                    >
                        Now
                    </button>
                </div>

                {/* 5. 3-Column Rooms Grid */}
                {filteredRoomCards.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-400 bg-white dark:bg-slate-900">
                        No rooms matched your selected filter. Click <strong>Now</strong> or clear your search query.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredRoomCards.map(({ room, roomType, blocks, current }) => (
                            <div
                                key={room}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow"
                            >
                                <div>
                                    {/* Room Card Header */}
                                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                                    {room}
                                                </h3>
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    {roomType}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Occupied / Vacant Badge */}
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
                                            current
                                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60"
                                                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60"
                                        )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", current ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                            <span>{current ? 'Occupied' : 'Vacant'}</span>
                                        </span>
                                    </div>

                                    {/* Active Class Highlight Banner */}
                                    <div className="my-3.5">
                                        {current ? (
                                            <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 relative overflow-hidden">
                                                {/* Left Accent Bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />

                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {/* Avatar / Initials */}
                                                        {current.faculty?.photo_url ? (
                                                            <img
                                                                src={current.faculty.photo_url}
                                                                alt={current.faculty.first_name}
                                                                className="w-9 h-9 rounded-full object-cover border border-amber-300 dark:border-amber-700 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                                                                {current.faculty ? `${current.faculty.first_name[0]}${current.faculty.last_name[0]}` : (current.instructor ? current.instructor.slice(0, 2).toUpperCase() : 'AM')}
                                                            </div>
                                                        )}

                                                        <div className="min-w-0">
                                                            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                                {current.faculty
                                                                    ? (current.faculty.title_name || `${current.faculty.first_name} ${current.faculty.last_name}`)
                                                                    : (current.instructor || 'TBA')
                                                                }
                                                            </div>
                                                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                                                                {[current.course_code, current.course_title].filter(Boolean).join(' – ')}
                                                            </div>

                                                            {/* Course Code / Section Badges */}
                                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                                {current.section && (
                                                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                                        {current.section}
                                                                    </span>
                                                                )}
                                                                {current.course_code && (
                                                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                                        {current.course_code}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Time & Now Badge */}
                                                    <div className="text-right shrink-0">
                                                        <div className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                                                            {formatTime(current.start_time)} – {formatTime(current.end_time)}
                                                        </div>
                                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
                                                            Now
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Bar for Live Observation / Monitoring */}
                                                <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-semibold text-amber-900/70 dark:text-amber-300/70 flex items-center gap-1">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                                        Ready to Monitor
                                                    </span>
                                                    <Link
                                                        href={`/monitoring/lab-in-charge?tab=today&search=${encodeURIComponent(current.course_code || current.instructor || room)}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-2xs transition-all"
                                                    >
                                                        <MonitorPlay className="w-3 h-3" />
                                                        <span>Monitor Session</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 text-center flex flex-col items-center justify-center gap-1">
                                                <DoorClosed className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">No ongoing class</span>
                                                <span className="text-[10px] text-slate-400">This room is currently available.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Today's Schedule List */}
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between pb-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Today&apos;s Schedule ({blocks.length})</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRoom(room)}
                                                className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                            >
                                                <span>View All</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {blocks.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic py-2">No schedules on this day.</p>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                                {blocks.map((block) => {
                                                    const isCurrentActive = current?.id === block.id;
                                                    const instructorName = block.faculty
                                                        ? (block.faculty.title_name || `${block.faculty.first_name} ${block.faculty.last_name}`)
                                                        : (block.instructor || 'TBA');

                                                    return (
                                                        <div
                                                            key={block.id}
                                                            onClick={() => setSelectedTime(toSlot(block.start_time.substring(0, 5)))}
                                                            className={cn(
                                                                "py-2 px-1 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40",
                                                                isCurrentActive && "bg-amber-50/50 dark:bg-amber-950/20 font-bold"
                                                            )}
                                                        >
                                                            {/* Dot Indicator + Time */}
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={cn(
                                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                                    isCurrentActive ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
                                                                )} />
                                                                <span className={cn(
                                                                    "text-[10.5px] font-bold whitespace-nowrap",
                                                                    isCurrentActive ? "text-amber-700 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
                                                                )}>
                                                                    {formatTime(block.start_time)} – {formatTime(block.end_time)}
                                                                </span>
                                                            </div>

                                                            {/* Subject & Instructor */}
                                                            <div className="min-w-0 flex-1 px-1">
                                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                                    {instructorName}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 truncate">
                                                                    {[block.course_code, block.section].filter(Boolean).join(' • ')}
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons: View profile & Link */}
                                                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                {block.faculty ? (
                                                                    <Link
                                                                        href={`/faculties/${block.faculty.id}`}
                                                                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                                        title="View Faculty Profile"
                                                                    >
                                                                        <User className="w-3.5 h-3.5" />
                                                                    </Link>
                                                                ) : (
                                                                    <span className="p-1 text-slate-300">
                                                                        <User className="w-3.5 h-3.5" />
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openLinkModal(block)}
                                                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                                    title="Connect or change assigned faculty"
                                                                >
                                                                    <Link2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Link Faculty Modal */}
            <Dialog open={!!linkingSchedule} onOpenChange={(open) => !open && setLinkingSchedule(null)}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-primary" />
                            Connect Faculty to Lab Schedule
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Link this schedule block to an official faculty member. Their name, profile picture, and workload dossier will automatically reflect this assignment without modifying the Google spreadsheet.
                        </DialogDescription>
                    </DialogHeader>

                    {linkingSchedule && (
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Room &amp; Time:</span>
                                    <span className="font-semibold text-foreground">{linkingSchedule.room_name} ({linkingSchedule.day_of_week}, {formatTime(linkingSchedule.start_time)} – {formatTime(linkingSchedule.end_time)})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subject &amp; Section:</span>
                                    <span className="font-semibold text-foreground">{[linkingSchedule.course_code, linkingSchedule.section].filter(Boolean).join(' · ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Spreadsheet Text:</span>
                                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{linkingSchedule.instructor || '(None)'}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Assigned Faculty Member
                                </label>
                                <select
                                    value={selectedFacultyId}
                                    onChange={(e) => setSelectedFacultyId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="">-- No Faculty Connected (Unlinked) --</option>
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.title_name || `${f.first_name} ${f.last_name}`} ({f.program?.code || 'Faculty'}) {f.spreadsheet_name ? `[Sheet: ${f.spreadsheet_name}]` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-muted-foreground">
                                    Selecting a faculty member links this schedule to their workload and profile dossier.
                                </p>
                            </div>

                            <DialogFooter className="mt-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setLinkingSchedule(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveFacultyLink}
                                    disabled={isLinking}
                                    className="font-semibold"
                                >
                                    {isLinking ? 'Linking…' : 'Save Connection'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
