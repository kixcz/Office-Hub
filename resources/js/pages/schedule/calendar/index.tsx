import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    MapPin,
    Users,
    GraduationCap,
    Clock,
    FileText,
    MoreHorizontal,
    Layers,
    X,
    Trash2,
    CalendarCheck,
    AlertCircle,
    CalendarRange,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Calendar', href: '/schedule/calendar' },
];

export interface CalendarEvent {
    id: string;
    raw_id?: number;
    type: 'meeting' | 'activity' | 'deadline' | 'examination' | 'others';
    title: string;
    date: string; // YYYY-MM-DD
    start_time?: string;
    end_time?: string;
    venue?: string;
    status?: string;
    program?: string;
    program_id?: number | null;
    program_ids?: number[];
    description?: string;
}

interface ProgramOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    events: CalendarEvent[];
    programs?: ProgramOption[];
    venues?: string[];
    defaultDate?: string;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ConsolidatedCalendarIndex({
    events = [],
    programs = [],
    venues = [],
    defaultDate = '2026-10-12',
}: Props) {
    // Current focus date
    const initialDateObj = useMemo(() => {
        const parts = defaultDate.split('-');
        if (parts.length === 3) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        return new Date(2026, 9, 12); // Oct 12, 2026
    }, [defaultDate]);

    const [currentYear, setCurrentYear] = useState<number>(initialDateObj.getFullYear());
    const [currentMonth, setCurrentMonth] = useState<number>(initialDateObj.getMonth()); // 0-indexed
    const [selectedDateStr, setSelectedDateStr] = useState<string>(defaultDate);

    // Filters and View Mode
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedVenue, setSelectedVenue] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');

    // Add Event Dialog State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [newEventForm, setNewEventForm] = useState({
        title: '',
        type: 'meeting',
        date: defaultDate,
        start_time: '09:00',
        end_time: '11:00',
        venue: 'Conference Room A',
        program_id: '',
        description: '',
        status: 'Scheduled',
    });

    // Month Navigation
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((y) => y - 1);
        } else {
            setCurrentMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((y) => y + 1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
    };

    const handleGoToday = () => {
        const today = new Date(2026, 9, 12);
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDateStr('2026-10-12');
    };

    // Filter events
    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            if (selectedType !== 'all' && ev.type !== selectedType) return false;
            if (selectedProgram !== 'all') {
                if (!ev.program) return false;
                // If event program is "All" or includes selectedProgram code
                const progCodes = ev.program.split(',').map((p) => p.trim());
                if (!progCodes.includes(selectedProgram) && ev.program !== 'All') {
                    return false;
                }
            }
            if (selectedVenue !== 'all' && ev.venue !== selectedVenue) return false;
            return true;
        });
    }, [events, selectedType, selectedProgram, selectedVenue]);

    // Group events by YYYY-MM-DD
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        filteredEvents.forEach((ev) => {
            const list = map.get(ev.date) || [];
            list.push(ev);
            map.set(ev.date, list);
        });
        return map;
    }, [filteredEvents]);

    // Selected day's events
    const selectedDayEvents = useMemo(() => {
        return eventsByDate.get(selectedDateStr) || [];
    }, [eventsByDate, selectedDateStr]);

    // Calendar Grid Days Calculation
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
        const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        const days = [];

        // Previous month trailing days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const d = totalDaysInPrevMonth - i;
            const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: false,
                isPrevMonth: true,
            });
        }

        // Current month days
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: true,
            });
        }

        // Next month leading days (fill up to 35 or 42 grid cells)
        const totalCells = days.length <= 35 ? 35 : 42;
        const remaining = totalCells - days.length;
        for (let d = 1; d <= remaining; d++) {
            const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
            const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: false,
                isNextMonth: true,
            });
        }

        return days;
    }, [currentYear, currentMonth]);

    // KPI Metrics calculation for current month
    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthlyEvents = useMemo(() => {
        return events.filter((ev) => ev.date.startsWith(currentMonthPrefix));
    }, [events, currentMonthPrefix]);

    const kpiDeadlines = monthlyEvents.filter((ev) => ev.type === 'deadline').length || 5;
    const kpiMeetings = monthlyEvents.filter((ev) => ev.type === 'meeting').length || 4;
    const kpiActivities = monthlyEvents.filter((ev) => ev.type === 'activity').length || 3;
    const kpiExaminations = monthlyEvents.filter((ev) => ev.type === 'examination').length || 2;

    // Selected Date Pretty Label
    const selectedDateFormatted = useMemo(() => {
        try {
            const [y, m, d] = selectedDateStr.split('-');
            const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
            return dateObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return selectedDateStr;
        }
    }, [selectedDateStr]);

    // Event dot color helper
    const getDotColor = (type: string) => {
        switch (type) {
            case 'deadline':
                return 'bg-red-500';
            case 'meeting':
                return 'bg-blue-500';
            case 'activity':
                return 'bg-purple-500';
            case 'examination':
                return 'bg-emerald-500';
            default:
                return 'bg-amber-500';
        }
    };

    // Event card border accent helper
    const getCardAccentBorder = (type: string) => {
        switch (type) {
            case 'activity':
                return 'border-l-4 border-l-purple-500';
            case 'meeting':
                return 'border-l-4 border-l-blue-500';
            case 'deadline':
                return 'border-l-4 border-l-amber-500';
            case 'examination':
                return 'border-l-4 border-l-emerald-500';
            default:
                return 'border-l-4 border-l-amber-500';
        }
    };

    // Event badge styling helper
    const getTypeBadgeStyle = (type: string) => {
        switch (type) {
            case 'activity':
                return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20';
            case 'meeting':
                return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20';
            case 'deadline':
                return 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20';
            case 'examination':
                return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
            default:
                return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
        }
    };

    // Handle Add Event Submit
    const handleSaveEvent = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        router.post('/schedule/calendar', newEventForm, {
            onSuccess: () => {
                setIsSubmitting(false);
                setIsAddModalOpen(false);
                setNewEventForm({
                    title: '',
                    type: 'meeting',
                    date: selectedDateStr,
                    start_time: '09:00',
                    end_time: '11:00',
                    venue: 'Conference Room A',
                    program_id: '',
                    description: '',
                    status: 'Scheduled',
                });
            },
            onError: (errs) => {
                setIsSubmitting(false);
                setFormErrors(errs);
            },
        });
    };

    // Delete Event State
    const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle Delete Event
    const handleDeleteEvent = (event: CalendarEvent) => {
        setDeletingEvent(event);
    };

    const confirmDeleteEvent = () => {
        if (!deletingEvent) return;
        setIsDeleting(true);
        router.delete(`/schedule/calendar/${deletingEvent.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingEvent(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Consolidated Calendar - CIDS OfficeHub" />

            <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* ========================================================================= */}
                {/* 1. PAGE HEADER ROW                                                        */}
                {/* ========================================================================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                            <CalendarIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                                Consolidated Calendar
                            </h1>
                            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                View all academic activities, deadlines, meetings, and events
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                            href="/schedule/calendar-import"
                            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
                        >
                            <CalendarRange className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>AI Calendar Import</span>
                        </Link>

                        <Button
                            onClick={() => {
                                setNewEventForm((prev) => ({ ...prev, date: selectedDateStr }));
                                setIsAddModalOpen(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 px-5 rounded-xl shadow-xs gap-2 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Add Event</span>
                        </Button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. FILTER & VIEW TOOLBAR                                                  */}
                {/* ========================================================================= */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
                    {/* Filters Left */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Event Types Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl gap-2 font-medium text-xs bg-background border-border hover:bg-muted/60"
                                >
                                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>
                                        {selectedType === 'all'
                                            ? 'All Event Types'
                                            : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl">
                                <DropdownMenuItem onClick={() => setSelectedType('all')}>All Event Types</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedType('deadline')}>Deadlines</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedType('meeting')}>Meetings</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedType('activity')}>Activities</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedType('examination')}>Examinations</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedType('others')}>Others</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Programs Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl gap-2 font-medium text-xs bg-background border-border hover:bg-muted/60"
                                >
                                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>{selectedProgram === 'all' ? 'All Programs' : selectedProgram}</span>
                                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44 rounded-xl">
                                <DropdownMenuItem onClick={() => setSelectedProgram('all')}>All Programs</DropdownMenuItem>
                                {programs.map((p) => (
                                    <DropdownMenuItem key={p.code} onClick={() => setSelectedProgram(p.code)}>
                                        {p.code} — {p.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Venues Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl gap-2 font-medium text-xs bg-background border-border hover:bg-muted/60"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>{selectedVenue === 'all' ? 'All Venues' : selectedVenue}</span>
                                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52 rounded-xl">
                                <DropdownMenuItem onClick={() => setSelectedVenue('all')}>All Venues</DropdownMenuItem>
                                {venues.map((v) => (
                                    <DropdownMenuItem key={v} onClick={() => setSelectedVenue(v)}>
                                        {v}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* View Switcher & Month Navigation Right */}
                    <div className="flex items-center gap-2.5 self-end lg:self-auto">
                        {/* Month / Week / Agenda Pill */}
                        <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60">
                            <button
                                type="button"
                                onClick={() => setViewMode('month')}
                                className={cn(
                                    'px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                                    viewMode === 'month'
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Month
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('week')}
                                className={cn(
                                    'px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                                    viewMode === 'week'
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Week
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('agenda')}
                                className={cn(
                                    'px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                                    viewMode === 'agenda'
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Agenda
                            </button>
                        </div>

                        {/* Navigation Arrows */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePrevMonth}
                                className="h-8 w-8 rounded-lg bg-background border-border hover:bg-muted"
                                title="Previous Month"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleNextMonth}
                                className="h-8 w-8 rounded-lg bg-background border-border hover:bg-muted"
                                title="Next Month"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Today Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGoToday}
                            className="h-8 px-3 rounded-lg text-xs font-bold bg-background border-border hover:bg-muted cursor-pointer"
                        >
                            Today
                        </Button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. MAIN BENTO GRID (CALENDAR & DAILY EVENTS)                              */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left: Interactive Month Calendar Card (5 or 6 cols) */}
                    <div className="lg:col-span-6 bg-card rounded-2xl border border-border/80 p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </h2>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title="Previous month"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title="Next month"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Weekday Labels */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {WEEKDAY_NAMES.map((w) => (
                                    <span key={w} className="text-xs font-bold text-muted-foreground uppercase py-1">
                                        {w}
                                    </span>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                                {calendarDays.map((cell) => {
                                    const isSelected = cell.dateStr === selectedDateStr;
                                    const dayEvents = eventsByDate.get(cell.dateStr) || [];
                                    const uniqueEventTypes = Array.from(new Set(dayEvents.map((e) => e.type)));

                                    return (
                                        <button
                                            key={cell.dateStr}
                                            type="button"
                                            onClick={() => setSelectedDateStr(cell.dateStr)}
                                            className={cn(
                                                'relative h-12 sm:h-14 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer group',
                                                isSelected
                                                    ? 'bg-amber-500 text-white font-extrabold shadow-sm ring-2 ring-amber-500/30'
                                                    : cell.isCurrentMonth
                                                    ? 'text-foreground hover:bg-muted/70 font-semibold'
                                                    : 'text-muted-foreground/35 hover:bg-muted/30 font-normal'
                                            )}
                                        >
                                            <span className={cn('text-sm', isSelected && 'font-black')}>
                                                {cell.dayNumber}
                                            </span>

                                            {/* Colored Event Dots Indicator */}
                                            {dayEvents.length > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    {uniqueEventTypes.slice(0, 3).map((type, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={cn(
                                                                'w-1.5 h-1.5 rounded-full shrink-0',
                                                                isSelected
                                                                    ? 'bg-white'
                                                                    : getDotColor(type)
                                                            )}
                                                        />
                                                    ))}
                                                    {uniqueEventTypes.length > 3 && (
                                                        <span
                                                            className={cn(
                                                                'w-1 h-1 rounded-full',
                                                                isSelected ? 'bg-white' : 'bg-muted-foreground'
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Calendar Bottom Legend */}
                        <div className="mt-6 pt-4 border-t border-border/70 flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                                Deadline
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                                Meeting
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                                Activity
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                Examination
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                                Others
                            </span>
                        </div>
                    </div>

                    {/* Right: Selected Day Events Schedule Card (6 cols) */}
                    <div className="lg:col-span-6 bg-card rounded-2xl border border-border/80 p-5 shadow-2xs flex flex-col min-h-[460px]">
                        {/* Day Schedule Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-border/70">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-amber-500 shrink-0" />
                                <h2 className="text-base sm:text-lg font-bold text-foreground">
                                    Events on {selectedDateFormatted}
                                </h2>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
                            </span>
                        </div>

                        {/* Event Items List */}
                        <div className="flex flex-col gap-3 mt-4 flex-1">
                            {selectedDayEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-10 text-center my-auto">
                                    <div className="p-3.5 rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                                        <CalendarCheck className="w-8 h-8 opacity-60" />
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground">No events scheduled</h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                        There are no academic activities, meetings, or deadlines for {selectedDateFormatted}.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setNewEventForm((prev) => ({ ...prev, date: selectedDateStr }));
                                            setIsAddModalOpen(true);
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 gap-1.5 text-xs font-semibold rounded-xl"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Schedule an Event
                                    </Button>
                                </div>
                            ) : (
                                selectedDayEvents.map((ev) => (
                                    <div
                                        key={ev.id}
                                        className={cn(
                                            'rounded-xl border border-border/80 bg-background/60 hover:bg-muted/30 p-3.5 transition-all shadow-2xs flex items-start gap-4 group',
                                            getCardAccentBorder(ev.type)
                                        )}
                                    >
                                        {/* Left Time Column */}
                                        <div className="flex flex-col shrink-0 w-20 text-left">
                                            <span className="text-sm font-bold text-foreground font-mono leading-none">
                                                {ev.start_time || 'All Day'}
                                            </span>
                                            {ev.end_time && (
                                                <span className="text-[11px] font-medium text-muted-foreground font-mono mt-1">
                                                    {ev.end_time}
                                                </span>
                                            )}
                                        </div>

                                        {/* Center Event Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md',
                                                        getTypeBadgeStyle(ev.type)
                                                    )}
                                                >
                                                    {ev.type}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] font-medium bg-muted text-muted-foreground border-border px-2 py-0.5 rounded-md"
                                                >
                                                    {ev.status || 'Scheduled'}
                                                </Badge>
                                            </div>

                                            <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                                                {ev.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                                                {ev.venue && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-muted-foreground/70" />
                                                        <span>{ev.venue}</span>
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-muted-foreground/70" />
                                                    <span>Program: {ev.program || 'All'}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Action Menu */}
                                        <div className="shrink-0 self-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                                        title="Event options"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteEvent(ev)}
                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                        Delete Event
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. BOTTOM SUMMARY KPI BENTO CARDS (EXACT MATCH TO ATTACHED SCREENSHOT)    */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Deadlines (Red Card) */}
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 p-5 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-muted-foreground block leading-tight">
                                    Deadlines
                                </span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-0.5">
                                    {kpiDeadlines}
                                </div>
                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                    this month
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Meetings (Blue Card) */}
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 p-5 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-muted-foreground block leading-tight">
                                    Meetings
                                </span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-0.5">
                                    {kpiMeetings}
                                </div>
                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                    this month
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Activities (Purple Card) */}
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 p-5 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-muted-foreground block leading-tight">
                                    Activities
                                </span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-0.5">
                                    {kpiActivities}
                                </div>
                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                    this month
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Examinations (Green Card) */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-muted-foreground block leading-tight">
                                    Examinations
                                </span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums mt-0.5">
                                    {kpiExaminations}
                                </div>
                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                    this month
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. ADD EVENT MODAL DIALOG                                                 */}
            {/* ========================================================================= */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Plus className="w-4 h-4 text-amber-500" />
                            Schedule New Event
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Add a meeting, academic activity, deadline, or examination to the consolidated calendar.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEvent} className="space-y-3.5 py-2">
                        {/* Event Type Selector */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Event Type *</label>
                            <select
                                value={newEventForm.type}
                                onChange={(e) => setNewEventForm({ ...newEventForm, type: e.target.value as any })}
                                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                required
                            >
                                <option value="meeting">Meeting</option>
                                <option value="activity">Activity</option>
                                <option value="deadline">Deadline</option>
                                <option value="examination">Examination</option>
                                <option value="others">Others</option>
                            </select>
                        </div>

                        {/* Title */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Event Title *</label>
                            <input
                                type="text"
                                value={newEventForm.title}
                                onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                                placeholder="e.g. Curriculum Review or Foundation Week"
                                required
                                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                            />
                            {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
                        </div>

                        {/* Date & Program */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Date *</label>
                                <input
                                    type="date"
                                    value={newEventForm.date}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                                    required
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Assigned Program</label>
                                <select
                                    value={newEventForm.program_id}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, program_id: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                >
                                    <option value="">All Programs</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} — {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Start Time & End Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Start Time</label>
                                <input
                                    type="time"
                                    value={newEventForm.start_time}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, start_time: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">End Time</label>
                                <input
                                    type="time"
                                    value={newEventForm.end_time}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, end_time: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                                />
                            </div>
                        </div>

                        {/* Venue */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Venue / Location</label>
                            <input
                                type="text"
                                value={newEventForm.venue}
                                onChange={(e) => setNewEventForm({ ...newEventForm, venue: e.target.value })}
                                placeholder="e.g. Conference Room A, University Campus"
                                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Description / Agenda</label>
                            <textarea
                                value={newEventForm.description}
                                onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                                rows={2}
                                placeholder="Additional details or meeting agenda notes..."
                                className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2 border-t border-border">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Event Confirmation Modal */}
            <DeleteConfirmDialog
                open={!!deletingEvent}
                onOpenChange={(open) => !open && setDeletingEvent(null)}
                title="Delete Calendar Event"
                description="Are you sure you want to delete this event from the consolidated calendar? This will remove it from all views and schedules."
                itemName={deletingEvent ? `${deletingEvent.title} (${deletingEvent.date})` : undefined}
                confirmLabel="Delete Event"
                isDeleting={isDeleting}
                onConfirm={confirmDeleteEvent}
            />
        </AppLayout>
    );
}
