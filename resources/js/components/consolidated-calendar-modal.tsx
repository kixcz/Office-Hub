import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    MapPin, 
    Users, 
    MoreVertical, 
    Filter,
    Clock,
    Layers,
    CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
    id: string;
    raw_id?: number;
    type: 'deadline' | 'meeting' | 'activity' | 'examination' | 'others';
    title: string;
    date: string; // YYYY-MM-DD
    start_time?: string;
    end_time?: string;
    venue?: string;
    status?: string;
    program?: string;
    program_id?: number | null;
    description?: string;
}

interface ConsolidatedCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    events?: CalendarEvent[];
    programs?: Array<{ id: number; code: string; name: string }>;
    venues?: string[];
    initialDate?: string;
}

const TYPE_COLORS: Record<string, { dot: string; border: string; badge: string; text: string }> = {
    deadline: {
        dot: 'bg-red-500',
        border: 'border-l-red-500',
        badge: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
        text: 'text-red-600 dark:text-red-400',
    },
    meeting: {
        dot: 'bg-blue-500',
        border: 'border-l-blue-500',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
        text: 'text-blue-600 dark:text-blue-400',
    },
    activity: {
        dot: 'bg-purple-500',
        border: 'border-l-purple-500',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
        text: 'text-purple-600 dark:text-purple-400',
    },
    examination: {
        dot: 'bg-emerald-500',
        border: 'border-l-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        text: 'text-emerald-600 dark:text-emerald-400',
    },
    others: {
        dot: 'bg-amber-500',
        border: 'border-l-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        text: 'text-amber-600 dark:text-amber-400',
    },
};

export function ConsolidatedCalendarModal({
    isOpen,
    onClose,
    events: initialEvents,
    programs: initialPrograms,
    venues: initialVenues,
    initialDate = '2026-10-13',
}: ConsolidatedCalendarModalProps) {
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents || []);
    const [programs, setPrograms] = useState(initialPrograms || []);
    const [venues, setVenues] = useState<string[]>(initialVenues || []);
    const [selectedDate, setSelectedDate] = useState<string>(initialDate);
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
    
    // Filters
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedVenue, setSelectedVenue] = useState<string>('all');

    // Current viewing month/year in the calendar
    const [currentYear, setCurrentYear] = useState<number>(() => {
        const d = new Date(initialDate);
        return isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
    });
    const [currentMonth, setCurrentMonth] = useState<number>(() => {
        const d = new Date(initialDate);
        return isNaN(d.getMonth()) ? 9 : d.getMonth(); // 9 is October (0-indexed)
    });

    const modalRef = useRef<HTMLDivElement>(null);

    // If initialEvents or props change, sync state
    useEffect(() => {
        if (initialEvents && initialEvents.length > 0) {
            setEvents(initialEvents);
        } else if (isOpen && events.length === 0) {
            // Fetch events asynchronously if not supplied
            fetch('/schedule/calendar/events-json')
                .then(res => res.json())
                .then(data => {
                    if (data?.events) setEvents(data.events);
                    if (data?.programs) setPrograms(data.programs);
                    if (data?.venues) setVenues(data.venues);
                })
                .catch(err => console.error('Failed to load calendar events', err));
        }
    }, [isOpen, initialEvents]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Month Navigation
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handleToday = () => {
        const todayStr = '2026-10-13'; // Project demo anchor date
        const d = new Date(todayStr);
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
        setSelectedDate(todayStr);
    };

    // Filtered Events
    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            if (selectedType !== 'all' && e.type !== selectedType) return false;
            if (selectedProgram !== 'all' && e.program !== selectedProgram && e.program !== 'All') return false;
            if (selectedVenue !== 'all' && e.venue !== selectedVenue) return false;
            return true;
        });
    }, [events, selectedType, selectedProgram, selectedVenue]);

    // Events mapped by date for dots in calendar
    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        filteredEvents.forEach(e => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [filteredEvents]);

    // Days grid for current month
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        const cells = [];

        // Trailing days from previous month
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const prevMonthDate = new Date(currentYear, currentMonth - 1, dayNum);
            const dateStr = prevMonthDate.toISOString().split('T')[0];
            cells.push({
                day: dayNum,
                dateStr,
                isCurrentMonth: false,
                isPrevMonth: true,
            });
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const monthStr = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
            cells.push({
                day: i,
                dateStr,
                isCurrentMonth: true,
            });
        }

        // Fill remaining cells for 5 or 6 complete rows (35 or 42 cells)
        const totalSlots = cells.length > 35 ? 42 : 35;
        const remaining = totalSlots - cells.length;
        for (let i = 1; i <= remaining; i++) {
            const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
            const dateStr = nextMonthDate.toISOString().split('T')[0];
            cells.push({
                day: i,
                dateStr,
                isCurrentMonth: false,
                isNextMonth: true,
            });
        }

        return cells;
    }, [currentYear, currentMonth]);

    // Events for selected date
    const selectedDateEvents = useMemo(() => {
        return filteredEvents.filter(e => e.date === selectedDate);
    }, [filteredEvents, selectedDate]);

    // Format selected date header
    const formattedSelectedDate = useMemo(() => {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }, [selectedDate]);

    // Month display name
    const monthYearTitle = useMemo(() => {
        return new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    }, [currentYear, currentMonth]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => {
                if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                    onClose();
                }
            }}
        >
            <div 
                ref={modalRef}
                className="relative w-full max-w-4xl lg:max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 my-auto transition-all max-h-[92vh] overflow-y-auto"
            >
                {/* Modal Top Header */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xs shrink-0">
                            <CalendarIcon className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Consolidated Calendar
                            </h2>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                View all academic activities, deadlines, meetings, and events
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Close Calendar (Esc)"
                    >
                        <X className="w-5 h-5" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                {/* Filter & View Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-50/80 dark:bg-slate-850/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    {/* Left Dropdown Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Event Types */}
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg pl-8 pr-7 py-2 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                            >
                                <option value="all">All Event Types</option>
                                <option value="deadline">Deadlines</option>
                                <option value="meeting">Meetings</option>
                                <option value="activity">Activities</option>
                                <option value="examination">Examinations</option>
                                <option value="others">Others</option>
                            </select>
                            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        </div>

                        {/* Programs */}
                        <div className="relative">
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg pl-8 pr-7 py-2 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                            >
                                <option value="all">All Programs</option>
                                {programs.map((p) => (
                                    <option key={p.id} value={p.code}>{p.code}</option>
                                ))}
                            </select>
                            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        </div>

                        {/* Venues */}
                        <div className="relative">
                            <select
                                value={selectedVenue}
                                onChange={(e) => setSelectedVenue(e.target.value)}
                                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg pl-8 pr-7 py-2 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                            >
                                <option value="all">All Venues</option>
                                {venues.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        </div>
                    </div>

                    {/* Right View Switch & Today */}
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('month')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
                                    viewMode === 'month'
                                        ? "bg-amber-500 text-white shadow-2xs"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                                )}
                            >
                                Month
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('week')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
                                    viewMode === 'week'
                                        ? "bg-amber-500 text-white shadow-2xs"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                                )}
                            >
                                Week
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('agenda')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer",
                                    viewMode === 'agenda'
                                        ? "bg-amber-500 text-white shadow-2xs"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                                )}
                            >
                                Agenda
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleToday}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Main Bento Grid: Calendar & Day Events List */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Interactive Month Calendar (7 cols on LG) */}
                    <div className="md:col-span-6 lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                        {/* Month Header with < > buttons */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {monthYearTitle}
                            </h3>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                    title="Previous Month"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                    title="Next Month"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                            <span>Sun</span>
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
                            {calendarDays.map((cell, idx) => {
                                const isSelected = cell.dateStr === selectedDate;
                                const dayEvents = eventsByDate[cell.dateStr] || [];

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedDate(cell.dateStr)}
                                        className={cn(
                                            "min-h-[46px] sm:min-h-[52px] rounded-xl flex flex-col items-center justify-center p-1 transition-all cursor-pointer relative",
                                            isSelected 
                                                ? "bg-amber-500 text-white font-extrabold shadow-md scale-102"
                                                : cell.isCurrentMonth
                                                    ? "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium"
                                                    : "text-slate-300 dark:text-slate-600 font-normal hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-xs sm:text-sm",
                                            isSelected && "font-black text-white"
                                        )}>
                                            {cell.day}
                                        </span>

                                        {/* Event Dots */}
                                        <div className="flex items-center justify-center gap-0.5 mt-1 max-w-[28px] overflow-hidden flex-wrap">
                                            {dayEvents.slice(0, 3).map((ev, dIdx) => (
                                                <span
                                                    key={dIdx}
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        isSelected 
                                                            ? "bg-white" 
                                                            : TYPE_COLORS[ev.type]?.dot || 'bg-amber-500'
                                                    )}
                                                />
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    isSelected ? "bg-white/80" : "bg-slate-400"
                                                )} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bottom Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span>Deadline</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Meeting</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                <span>Activity</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Examination</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>Others</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Selected Date Events (5 cols on LG) */}
                    <div className="md:col-span-6 lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col">
                        {/* Day Header */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 min-w-0">
                                <CalendarDays className="w-4 h-4 text-amber-500 shrink-0" />
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                    Events on {formattedSelectedDate}
                                </h3>
                            </div>
                            <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/60 font-semibold px-2.5 py-0.5 rounded-full text-xs shrink-0">
                                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Events list */}
                        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                            {selectedDateEvents.map((item) => {
                                const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.others;

                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex flex-col gap-2",
                                            typeStyle.border,
                                            "border-l-4"
                                        )}
                                    >
                                        {/* Time & Badges */}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {item.start_time && item.end_time 
                                                    ? `${item.start_time} - ${item.end_time}`
                                                    : item.start_time || 'All Day'}
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <span className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide", typeStyle.badge)}>
                                                    {item.type}
                                                </span>
                                                <span className="text-[9px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                    {item.status || 'Scheduled'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                            {item.title}
                                        </h4>

                                        {/* Venue & Program Details */}
                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-0.5">
                                            <span className="flex items-center gap-1 truncate max-w-[170px]" title={item.venue}>
                                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                {item.venue || 'N/A'}
                                            </span>

                                            <span className="flex items-center gap-1 shrink-0 font-medium text-slate-600 dark:text-slate-300">
                                                <Users className="w-3 h-3 text-slate-400" />
                                                Program: {item.program || 'All'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {selectedDateEvents.length === 0 && (
                                <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
                                    <CalendarIcon className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
                                    <p className="text-sm">No scheduled events on this date.</p>
                                    <p className="text-xs text-slate-400">Click another date or check filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
