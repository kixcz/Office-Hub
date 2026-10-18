import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    MapPin,
    Clock,
    Filter,
    Table as TableIcon,
    CalendarDays,
    Trash2,
    CalendarCheck,
    CheckCircle2,
    UserCheck,
    Layers,
    BookOpen,
    Info,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
    id: string;
    raw_id?: number;
    type: 'meeting' | 'activity' | 'deadline' | 'examination' | 'personal' | 'others';
    title: string;
    date: string; // YYYY-MM-DD
    start_time?: string;
    end_time?: string;
    venue?: string;
    status?: string;
    program?: string;
    program_id?: number | null;
    description?: string;
    is_personal?: boolean;
}

interface Props {
    faculty: {
        id: number;
        first_name: string;
        last_name: string;
        program?: {
            id: number;
            name: string;
            code: string;
        };
    } | null;
    calendarData: {
        events: CalendarEvent[];
        programs?: Array<{ id: number; code: string; name: string }>;
        venues?: string[];
        defaultDate?: string;
    };
    schedules: Array<any>;
    defaultDate?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Calendar', href: '/faculty/calendar' },
];

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function FacultyCalendarPage({
    faculty,
    calendarData,
    schedules = [],
    defaultDate = '2026-10-12',
}: Props) {
    const events: CalendarEvent[] = calendarData?.events || [];

    // Focus date
    const initialDateObj = useMemo(() => {
        const parts = defaultDate.split('-');
        if (parts.length === 3) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        return new Date(2026, 9, 12);
    }, [defaultDate]);

    const [currentYear, setCurrentYear] = useState<number>(initialDateObj.getFullYear());
    const [currentMonth, setCurrentMonth] = useState<number>(initialDateObj.getMonth());
    const [selectedDateStr, setSelectedDateStr] = useState<string>(defaultDate);

    // View filter state
    const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');
    const [selectedType, setSelectedType] = useState<string>('all');

    // Add Personal Event Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [newEventForm, setNewEventForm] = useState({
        title: '',
        date: defaultDate,
        start_time: '09:00',
        end_time: '10:30',
        venue: 'Faculty Office',
        category: 'Personal Consultation',
        description: '',
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

    const handleToday = () => {
        const now = new Date();
        setCurrentYear(now.getFullYear());
        setCurrentMonth(now.getMonth());
        setSelectedDateStr(now.toISOString().split('T')[0]);
    };

    // Filter events
    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            if (selectedType === 'all') return true;
            if (selectedType === 'personal') return Boolean(ev.is_personal || ev.type === 'personal');
            return ev.type === selectedType;
        });
    }, [events, selectedType]);

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
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
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

        // Next month leading days
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

    // Event styling helpers
    const getDotColor = (type: string) => {
        switch (type) {
            case 'personal':
                return 'bg-amber-500';
            case 'deadline':
                return 'bg-rose-500';
            case 'meeting':
                return 'bg-blue-500';
            case 'examination':
                return 'bg-emerald-500';
            case 'activity':
                return 'bg-purple-500';
            default:
                return 'bg-amber-500';
        }
    };

    const getTypeBadgeStyle = (type: string) => {
        switch (type) {
            case 'personal':
                return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
            case 'activity':
                return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20';
            case 'meeting':
                return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20';
            case 'deadline':
                return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20';
            case 'examination':
                return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
            default:
                return 'bg-muted text-foreground border-border';
        }
    };

    const getCardAccentBorder = (type: string) => {
        switch (type) {
            case 'personal':
                return 'border-l-4 border-l-amber-500';
            case 'activity':
                return 'border-l-4 border-l-purple-500';
            case 'meeting':
                return 'border-l-4 border-l-blue-500';
            case 'deadline':
                return 'border-l-4 border-l-rose-500';
            case 'examination':
                return 'border-l-4 border-l-emerald-500';
            default:
                return 'border-l-4 border-l-amber-500';
        }
    };

    // Handle personal event creation
    const handleCreatePersonalEvent = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        if (!newEventForm.title.trim()) {
            setFormErrors({ title: 'Title is required' });
            return;
        }

        setIsSubmitting(true);
        router.post('/faculty/calendar/personal', newEventForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setIsAddModalOpen(false);
                setNewEventForm({
                    title: '',
                    date: selectedDateStr,
                    start_time: '09:00',
                    end_time: '10:30',
                    venue: 'Faculty Office',
                    category: 'Personal Consultation',
                    description: '',
                });
            },
            onError: (errors) => {
                setIsSubmitting(false);
                setFormErrors(errors as Record<string, string>);
            },
        });
    };

    // Handle personal event deletion
    const handleDeletePersonalEvent = (rawId: number) => {
        if (!confirm('Are you sure you want to remove this personal event?')) return;
        router.delete(`/faculty/calendar/personal/${rawId}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Calendar - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1550px] mx-auto">
                {/* 1. Header with View Toggle and Add Personal Event Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-foreground tracking-tight">Personal Academic Calendar</h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 border border-amber-300 dark:border-amber-700/50">
                                {faculty?.first_name} {faculty?.last_name}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Consolidated schedule of your personal tasks, departmental meetings, institutional deadlines, and college activities.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Calendar vs Cards Switcher */}
                        <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewMode('calendar')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                    viewMode === 'calendar'
                                        ? "bg-background text-foreground shadow-xs font-extrabold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                                <span>Monthly Calendar</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                    viewMode === 'cards'
                                        ? "bg-background text-foreground shadow-xs font-extrabold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                <span>Events List</span>
                            </button>
                        </div>

                        {/* Add Personal Event Action */}
                        <Button
                            onClick={() => {
                                setNewEventForm((prev) => ({ ...prev, date: selectedDateStr }));
                                setIsAddModalOpen(true);
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 rounded-xl h-9 shadow-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Personal Event</span>
                        </Button>

                        <Link
                            href="/faculty/schedule"
                            className="px-3.5 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
                        >
                            <TableIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Class Timetable</span>
                        </Link>
                    </div>
                </div>

                {/* 2. CALENDAR VIEW (Interactive Month Grid + Day Side Panel) */}
                {viewMode === 'calendar' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left 8 Cols: Month Grid */}
                        <div className="lg:col-span-8 bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-4">
                            {/* Navigation Header */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-foreground">
                                        {MONTH_NAMES[currentMonth]} {currentYear}
                                    </h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleToday}
                                        className="h-7 text-[11px] font-bold px-2.5 rounded-lg border-border hover:bg-muted"
                                    >
                                        Today
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Type filter */}
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                                    >
                                        <option value="all">All Event Types</option>
                                        <option value="personal">Personal Events</option>
                                        <option value="meeting">Meetings</option>
                                        <option value="deadline">Deadlines</option>
                                        <option value="examination">Examinations</option>
                                        <option value="activity">Activities</option>
                                    </select>

                                    {/* Month Steppers */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={handlePrevMonth}
                                            className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shadow-xs cursor-pointer"
                                            title="Previous Month"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextMonth}
                                            className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shadow-xs cursor-pointer"
                                            title="Next Month"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 7-column Weekday Labels */}
                            <div className="grid grid-cols-7 text-center border-b border-border pb-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                {WEEKDAY_NAMES.map((name) => (
                                    <div key={name}>{name}</div>
                                ))}
                            </div>

                            {/* 7-column Days Grid */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {calendarDays.map((d, idx) => {
                                    const dayEvents = eventsByDate.get(d.dateStr) || [];
                                    const isSelected = d.dateStr === selectedDateStr;
                                    const hasPersonal = dayEvents.some((ev) => ev.is_personal || ev.type === 'personal');

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedDateStr(d.dateStr)}
                                            className={cn(
                                                "min-h-[88px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left select-none relative",
                                                d.isCurrentMonth
                                                    ? "bg-card/70 hover:bg-muted/40 border-border/80"
                                                    : "bg-muted/20 text-muted-foreground/40 border-border/30",
                                                isSelected && "ring-2 ring-amber-500 border-amber-500 bg-amber-500/5",
                                                hasPersonal && "border-amber-300 dark:border-amber-800/60"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={cn(
                                                        "text-xs font-black w-6 h-6 rounded-full flex items-center justify-center",
                                                        isSelected
                                                            ? "bg-amber-600 text-white shadow-xs"
                                                            : d.isCurrentMonth
                                                            ? "text-foreground"
                                                            : "text-muted-foreground/40"
                                                    )}
                                                >
                                                    {d.dayNumber}
                                                </span>

                                                {hasPersonal && (
                                                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Has Personal Event" />
                                                )}
                                            </div>

                                            {/* Event Pill Summaries */}
                                            <div className="space-y-1 mt-1 overflow-hidden">
                                                {dayEvents.slice(0, 2).map((ev) => (
                                                    <div
                                                        key={ev.id}
                                                        className={cn(
                                                            "text-[9.5px] font-bold px-1.5 py-0.5 rounded-md truncate leading-tight flex items-center gap-1",
                                                            ev.is_personal || ev.type === 'personal'
                                                                ? "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200"
                                                                : ev.type === 'meeting'
                                                                ? "bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200"
                                                                : ev.type === 'deadline'
                                                                ? "bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200"
                                                                : "bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200"
                                                        )}
                                                    >
                                                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", getDotColor(ev.type))} />
                                                        <span className="truncate">{ev.title}</span>
                                                    </div>
                                                ))}

                                                {dayEvents.length > 2 && (
                                                    <div className="text-[9px] font-bold text-muted-foreground px-1">
                                                        +{dayEvents.length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend Bar */}
                            <div className="pt-3 border-t border-border flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
                                <span className="text-[11px] font-bold uppercase tracking-wider">Legend:</span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span>Personal Event</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    <span>Meeting</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span>Deadline</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span>Exam</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                    <span>Activity</span>
                                </span>
                            </div>
                        </div>

                        {/* Right 4 Cols: Selected Day Detail Panel */}
                        <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-4">
                            <div className="pb-3 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-foreground">
                                        Events on {selectedDateStr}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {selectedDayEvents.length} scheduled event{selectedDayEvents.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setNewEventForm((prev) => ({ ...prev, date: selectedDateStr }));
                                        setIsAddModalOpen(true);
                                    }}
                                    className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1 rounded-lg"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                </Button>
                            </div>

                            {/* List of Events for the Selected Day */}
                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                {selectedDayEvents.length > 0 ? (
                                    selectedDayEvents.map((ev) => (
                                        <div
                                            key={ev.id}
                                            className={cn(
                                                "p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-2 hover:bg-muted/30 transition-all",
                                                getCardAccentBorder(ev.type)
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] font-black uppercase tracking-wider", getTypeBadgeStyle(ev.type))}
                                                >
                                                    {ev.is_personal ? 'PERSONAL' : ev.type?.toUpperCase()}
                                                </Badge>

                                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground">
                                                    <span>{ev.start_time} - {ev.end_time}</span>
                                                    {ev.is_personal && ev.raw_id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePersonalEvent(ev.raw_id!)}
                                                            className="text-rose-500 hover:text-rose-700 p-0.5"
                                                            title="Delete Personal Event"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-black text-foreground leading-snug">{ev.title}</h4>
                                                {ev.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {ev.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <MapPin className="w-3 h-3 text-amber-500" />
                                                    <span>{ev.venue || 'Campus / Office'}</span>
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {ev.status || 'Confirmed'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground space-y-2 bg-muted/20 rounded-xl border border-dashed border-border p-4">
                                        <CalendarCheck className="w-8 h-8 mx-auto text-muted-foreground/60" />
                                        <div className="text-xs font-bold text-foreground">No events on this date</div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Click "Add Personal Event" to schedule office hours, consultations, or preparation periods.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. CARD LIST VIEW (All Events in Grid) */}
                {viewMode === 'cards' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground font-medium">
                                Showing {filteredEvents.length} scheduled calendar event{filteredEvents.length !== 1 ? 's' : ''}
                            </div>

                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                            >
                                <option value="all">All Event Types</option>
                                <option value="personal">Personal Events</option>
                                <option value="meeting">Meetings</option>
                                <option value="deadline">Deadlines</option>
                                <option value="examination">Examinations</option>
                                <option value="activity">Activities</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredEvents.map((ev: any) => (
                                <div
                                    key={ev.id}
                                    className={cn(
                                        "bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-3 hover:shadow-xs transition-all",
                                        getCardAccentBorder(ev.type)
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className={cn("text-[10px] font-bold uppercase", getTypeBadgeStyle(ev.type))}
                                        >
                                            {ev.is_personal ? 'PERSONAL' : ev.type?.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs font-mono font-bold text-muted-foreground">
                                            {ev.date}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-black text-foreground">{ev.title}</h3>
                                        {ev.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                                        <span className="font-mono">{ev.start_time} - {ev.end_time}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{ev.venue}</span>
                                            {ev.is_personal && ev.raw_id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePersonalEvent(ev.raw_id)}
                                                    className="text-rose-500 hover:text-rose-700 p-0.5"
                                                    title="Delete Personal Event"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Add Personal Event Modal Dialog */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-black">
                                <CalendarIcon className="w-4 h-4 text-amber-500" />
                                <span>Schedule Personal Calendar Event</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Add personal consultations, committee tasks, or preparation blocks to your individual faculty calendar.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreatePersonalEvent} className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">
                                    Event Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newEventForm.title}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                                    placeholder="e.g. Thesis Advising / Office Hours / Research Review"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                                {formErrors.title && (
                                    <p className="text-[11px] text-rose-500">{formErrors.title}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">
                                        Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newEventForm.date}
                                        onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Category</label>
                                    <select
                                        value={newEventForm.category}
                                        onChange={(e) => setNewEventForm({ ...newEventForm, category: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    >
                                        <option value="Personal Consultation">Student Consultation</option>
                                        <option value="Research Writing">Research &amp; Extension</option>
                                        <option value="Office Hours">Office Hours</option>
                                        <option value="Department Task">Department Preparation</option>
                                        <option value="Personal Task">Personal Appointment</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Start Time</label>
                                    <input
                                        type="time"
                                        value={newEventForm.start_time}
                                        onChange={(e) => setNewEventForm({ ...newEventForm, start_time: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">End Time</label>
                                    <input
                                        type="time"
                                        value={newEventForm.end_time}
                                        onChange={(e) => setNewEventForm({ ...newEventForm, end_time: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Venue / Location</label>
                                <input
                                    type="text"
                                    value={newEventForm.venue}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, venue: e.target.value })}
                                    placeholder="e.g. Faculty Room, Lab 1, Online Meet"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Description / Notes</label>
                                <textarea
                                    rows={2}
                                    value={newEventForm.description}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                                    placeholder="Additional agenda or personal reminders..."
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                >
                                    {isSubmitting ? 'Saving...' : 'Add Event to Calendar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
