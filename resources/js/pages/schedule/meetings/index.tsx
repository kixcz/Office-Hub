import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Calendar as CalendarIcon,
    Plus,
    Search,
    ChevronDown,
    ChevronRight,
    MoreVertical,
    Trash,
    Clock,
    MapPin,
    User,
    CheckCircle2,
    CalendarDays,
    FileSpreadsheet,
    FileText,
    ArrowUpRight,
    SlidersHorizontal,
    ArrowUpDown,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Meetings', href: '/schedule/meetings' },
];

interface MeetingItem {
    id: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    venue: string | null;
    agenda: string | null;
    notes: string | null;
    status: string;
    program_id: number | null;
    program_ids?: number[] | null;
    organizer_id: number;
    organizer?: { id: number; name: string };
    program?: { id: number; name: string; code?: string };
    programs?: Array<{ id: number; name: string; code?: string }>;
}

export default function MeetingsIndex({
    meetings = [],
    programs = [],
}: {
    meetings: MeetingItem[];
    programs: any[];
}) {
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [programFilter, setProgramFilter] = useState('All Programs');
    const [venueFilter, setVenueFilter] = useState('All Venues');
    const [dateRangeFilter, setDateRangeFilter] = useState('Oct 1, 2026 - Oct 31, 2026');
    const [sortField, setSortField] = useState<'date' | 'time' | 'venue' | 'organizer' | 'title'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        date: '',
        start_time: '',
        end_time: '',
        venue: '',
        agenda: '',
        notes: '',
        status: 'Scheduled',
        program_id: '',
        program_ids: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/schedule/meetings', {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    // Extract unique venues
    const venues = useMemo(() => {
        const set = new Set<string>();
        meetings.forEach((m) => {
            if (m.venue) set.add(m.venue);
        });
        return Array.from(set);
    }, [meetings]);

    // Format time helpers (e.g. "13:00:00" -> "1:00 PM")
    const formatTimeDisplay = (timeStr: string) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    // Format full time range (e.g., "1:00 PM - 3:00 PM")
    const formatTimeRange = (start: string, end: string) => {
        const startFormatted = formatTimeDisplay(start);
        const endFormatted = formatTimeDisplay(end);
        if (!startFormatted && !endFormatted) return 'TBA';
        return `${startFormatted} - ${endFormatted}`;
    };

    // Format friendly date
    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return { date: 'TBA', day: '' };
        try {
            const d = new Date(dateStr + 'T00:00:00');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const month = monthNames[d.getMonth()];
            const day = String(d.getDate()).padStart(2, '0');
            const year = d.getFullYear();
            const dayName = dayNames[d.getDay()];
            return {
                date: `${month} ${day}, ${year}`,
                day: dayName,
            };
        } catch {
            return { date: dateStr, day: '' };
        }
    };

    // Derive meeting status logic based on date
    const getMeetingStatusCategory = (meeting: MeetingItem): 'Today' | 'Upcoming' | 'Completed' => {
        const todayStr = '2026-10-13'; // Context date
        if (meeting.date === todayStr) {
            return 'Today';
        }
        if (meeting.date > todayStr) {
            return 'Upcoming';
        }
        return 'Completed';
    };

    // Calculate metrics exactly as pictured in the mockup
    const metrics = useMemo(() => {
        let totalThisMonth = 0;
        let todayCount = 0;
        let upcomingCount = 0;
        let completedCount = 0;

        meetings.forEach((m) => {
            totalThisMonth++;
            const category = getMeetingStatusCategory(m);
            if (category === 'Today') todayCount++;
            else if (category === 'Upcoming') upcomingCount++;
            else if (category === 'Completed') completedCount++;
        });

        return {
            total: totalThisMonth,
            today: todayCount,
            upcoming: upcomingCount,
            completed: completedCount,
        };
    }, [meetings]);

    // Today's Agenda list for the right sidebar card
    const todayAgendaMeetings = useMemo(() => {
        return meetings
            .filter((m) => getMeetingStatusCategory(m) === 'Today')
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [meetings]);

    // Meeting icon styles based on index / category to match screenshot
    const getIconTheme = (index: number) => {
        const themes = [
            { bg: 'bg-orange-50 text-orange-500 border-orange-100' },
            { bg: 'bg-blue-50 text-blue-500 border-blue-100' },
            { bg: 'bg-purple-50 text-purple-500 border-purple-100' },
            { bg: 'bg-orange-50 text-orange-500 border-orange-100' },
            { bg: 'bg-rose-50 text-rose-500 border-rose-100' },
            { bg: 'bg-slate-50 text-slate-500 border-slate-200' },
            { bg: 'bg-emerald-50 text-emerald-500 border-emerald-100' },
            { bg: 'bg-purple-50 text-purple-500 border-purple-100' },
        ];
        return themes[index % themes.length];
    };

    // Subtitle categorization based on meeting title/type
    const getMeetingSubtitle = (meeting: MeetingItem) => {
        if (meeting.programs && meeting.programs.length > 0) {
            return meeting.programs.map((p) => p.code || p.name).join(', ');
        }
        if (meeting.program?.name) return meeting.program.name;
        const titleLower = meeting.title.toLowerCase();
        if (titleLower.includes('general assembly')) return 'General Assembly';
        if (titleLower.includes('bsit') || titleLower.includes('program')) return 'Program Meeting';
        if (titleLower.includes('council')) return 'Council Meeting';
        if (titleLower.includes('curriculum')) return 'Curriculum';
        if (titleLower.includes('department') || titleLower.includes('sync')) return 'Department Meeting';
        if (titleLower.includes('committee')) return 'Committee Meeting';
        return 'General Meeting';
    };

    // Filtered & sorted meetings
    const filteredMeetings = useMemo(() => {
        return meetings
            .filter((m) => {
                // Search query
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchesTitle = m.title.toLowerCase().includes(q);
                    const matchesVenue = m.venue?.toLowerCase().includes(q);
                    const matchesOrganizer = m.organizer?.name?.toLowerCase().includes(q);
                    const matchesAgenda = m.agenda?.toLowerCase().includes(q);
                    const matchesPrograms = m.programs?.some((p) =>
                        p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q))
                    );
                    if (!matchesTitle && !matchesVenue && !matchesOrganizer && !matchesAgenda && !matchesPrograms) return false;
                }

                // Status filter
                if (statusFilter !== 'All Status') {
                    const cat = getMeetingStatusCategory(m);
                    if (cat !== statusFilter) return false;
                }

                // Program filter
                if (programFilter !== 'All Programs') {
                    const matchesSingle = m.program && m.program.name === programFilter;
                    const matchesMultiple = m.programs && m.programs.some((p) => p.name === programFilter);
                    if (!matchesSingle && !matchesMultiple) return false;
                }

                // Venue filter
                if (venueFilter !== 'All Venues') {
                    if (m.venue !== venueFilter) return false;
                }

                return true;
            })
            .sort((a, b) => {
                let compare = 0;
                if (sortField === 'date') {
                    compare = a.date.localeCompare(b.date);
                } else if (sortField === 'time') {
                    compare = a.start_time.localeCompare(b.start_time);
                } else if (sortField === 'venue') {
                    compare = (a.venue || '').localeCompare(b.venue || '');
                } else if (sortField === 'organizer') {
                    compare = (a.organizer?.name || '').localeCompare(b.organizer?.name || '');
                } else if (sortField === 'title') {
                    compare = a.title.localeCompare(b.title);
                }
                return sortDirection === 'asc' ? compare : -compare;
            });
    }, [meetings, searchQuery, statusFilter, programFilter, venueFilter, sortField, sortDirection]);

    const handleSort = (field: 'date' | 'time' | 'venue' | 'organizer' | 'title') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meetings" />

            <div className="p-4 md:p-6 lg:p-7 space-y-6 max-w-[1600px] mx-auto">
                {/* 1. TOP HERO BANNER: Meetings header + Schedule Meeting button */}
                <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/60">
                            <CalendarDays className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                                Meetings
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                                Schedule and manage faculty meetings, council sessions, and other departmental meetings.
                            </p>
                        </div>
                    </div>

                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer">
                                <Plus className="w-4 h-4 stroke-[2.5]" />
                                <span>Schedule Meeting</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-2xl p-6">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-amber-500" />
                                    Schedule a Meeting
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Meeting Title *</Label>
                                    <Input
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. BSIT Curriculum Review & Alignment"
                                        className="rounded-lg h-9 text-sm"
                                        required
                                    />
                                    {errors.title && <div className="text-rose-500 text-xs mt-1">{errors.title}</div>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Date *</Label>
                                    <Input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="rounded-lg h-9 text-sm"
                                        required
                                    />
                                    {errors.date && <div className="text-rose-500 text-xs mt-1">{errors.date}</div>}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-slate-700">Involved Programs (Optional)</Label>
                                        {data.program_ids.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData('program_ids', []);
                                                    setData('program_id', '');
                                                }}
                                                className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="w-full min-h-[36px] px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center justify-between text-left gap-2 cursor-pointer"
                                            >
                                                <div className="flex flex-wrap items-center gap-1 overflow-hidden">
                                                    {data.program_ids.length === 0 ? (
                                                        <span className="text-slate-400">All / College-wide (or select specific)</span>
                                                    ) : (
                                                        data.program_ids.map((id) => {
                                                            const prog = programs.find((p: any) => p.id === id);
                                                            return (
                                                                <span
                                                                    key={id}
                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                                                                >
                                                                    {prog?.code || prog?.name}
                                                                </span>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-64 max-h-60 overflow-y-auto rounded-xl p-1.5 shadow-lg">
                                            <div
                                                onClick={() => {
                                                    if (data.program_ids.length === programs.length) {
                                                        setData('program_ids', []);
                                                        setData('program_id', '');
                                                    } else {
                                                        const allIds = programs.map((p: any) => p.id);
                                                        setData('program_ids', allIds);
                                                        setData('program_id', String(allIds[0] || ''));
                                                    }
                                                }}
                                                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer border-b border-slate-100 font-semibold mb-1"
                                            >
                                                <span>Select All Programs</span>
                                                <div className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                    data.program_ids.length === programs.length
                                                        ? "bg-amber-400 border-amber-500 text-slate-950"
                                                        : "border-slate-300 bg-white"
                                                )}>
                                                    {data.program_ids.length === programs.length && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                            </div>
                                            {programs.map((program: any) => {
                                                const isSelected = data.program_ids.includes(program.id);
                                                return (
                                                    <div
                                                        key={program.id}
                                                        onClick={() => {
                                                            let newIds: number[];
                                                            if (isSelected) {
                                                                newIds = data.program_ids.filter((id) => id !== program.id);
                                                            } else {
                                                                newIds = [...data.program_ids, program.id];
                                                            }
                                                            setData('program_ids', newIds);
                                                            setData('program_id', newIds.length > 0 ? String(newIds[0]) : '');
                                                        }}
                                                        className={cn(
                                                            "px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors",
                                                            isSelected ? "bg-amber-50/60 text-slate-900 font-medium" : "text-slate-700 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className="flex flex-col min-w-0 pr-2">
                                                            <span className="truncate">{program.name}</span>
                                                            {program.code && <span className="text-[10px] text-slate-400">{program.code}</span>}
                                                        </div>
                                                        <div className={cn(
                                                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                            isSelected
                                                                ? "bg-amber-400 border-amber-500 text-slate-950"
                                                                : "border-slate-300 bg-white"
                                                        )}>
                                                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Start Time *</Label>
                                    <Input
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        className="rounded-lg h-9 text-sm"
                                        required
                                    />
                                    {errors.start_time && <div className="text-rose-500 text-xs mt-1">{errors.start_time}</div>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">End Time *</Label>
                                    <Input
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        className="rounded-lg h-9 text-sm"
                                        required
                                    />
                                    {errors.end_time && <div className="text-rose-500 text-xs mt-1">{errors.end_time}</div>}
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Venue</Label>
                                    <Input
                                        value={data.venue}
                                        onChange={(e) => setData('venue', e.target.value)}
                                        placeholder="e.g. Conference Room A / Dean's Office / AVR"
                                        className="rounded-lg h-9 text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Agenda</Label>
                                    <Textarea
                                        value={data.agenda}
                                        onChange={(e) => setData('agenda', e.target.value)}
                                        placeholder="Brief details or meeting agenda items..."
                                        className="rounded-lg text-sm min-h-[75px]"
                                    />
                                </div>
                                <DialogFooter className="md:col-span-2 gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreating(false)}
                                        className="rounded-lg text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                                    >
                                        Create Meeting
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* 2. STATS KPI CARDS (Matching the 4 cards in the screenshot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Meetings */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/50 flex items-center justify-center shrink-0">
                                <CalendarDays className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-medium block">Total Meetings</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                                    {metrics.total}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5 block">This month</span>
                            </div>
                        </div>
                        {/* Mini vertical bar indicator */}
                        <div className="flex items-end gap-0.5 h-6 opacity-75 self-center">
                            <span className="w-1 h-3 bg-amber-400 rounded-full" />
                            <span className="w-1 h-5 bg-amber-500 rounded-full" />
                            <span className="w-1 h-4 bg-amber-400 rounded-full" />
                        </div>
                    </div>

                    {/* Card 2: Today */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center shrink-0">
                                <CalendarDays className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-medium block">Today</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                                    {metrics.today}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5 block">Meetings today</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    {/* Card 3: Upcoming */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
                                <CalendarDays className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-medium block">Upcoming</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                                    {metrics.upcoming}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5 block">Next 7 days</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    {/* Card 4: Completed */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/50 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-medium block">Completed</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight block leading-tight">
                                    {metrics.completed}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5 block">This month</span>
                            </div>
                        </div>
                        {/* Mini vertical bar indicator */}
                        <div className="flex items-end gap-0.5 h-6 opacity-75 self-center">
                            <span className="w-1 h-2 bg-purple-400 rounded-full" />
                            <span className="w-1 h-5 bg-purple-500 rounded-full" />
                            <span className="w-1 h-3 bg-purple-400 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* 3. FILTER / SEARCH CONTROL BAR (Matching screenshot layout) */}
                <div className="bg-white rounded-2xl p-3 md:p-3.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                        {/* Search Input */}
                        <div className="relative min-w-[200px] max-w-[280px] w-full">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search meetings..."
                                className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-white placeholder:text-slate-400 focus-visible:ring-amber-400"
                            />
                        </div>

                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 font-normal"
                                >
                                    <span>{statusFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40 rounded-xl">
                                {['All Status', 'Today', 'Upcoming', 'Completed'].map((st) => (
                                    <DropdownMenuItem
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={cn("text-xs cursor-pointer", statusFilter === st && "font-bold text-amber-600")}
                                    >
                                        {st}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Programs Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 font-normal"
                                >
                                    <span>{programFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl max-h-60 overflow-y-auto">
                                <DropdownMenuItem
                                    onClick={() => setProgramFilter('All Programs')}
                                    className={cn("text-xs cursor-pointer", programFilter === 'All Programs' && "font-bold text-amber-600")}
                                >
                                    All Programs
                                </DropdownMenuItem>
                                {programs.map((prog: any) => (
                                    <DropdownMenuItem
                                        key={prog.id}
                                        onClick={() => setProgramFilter(prog.name)}
                                        className={cn("text-xs cursor-pointer", programFilter === prog.name && "font-bold text-amber-600")}
                                    >
                                        {prog.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Date Range Selector Display */}
                        <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{dateRangeFilter}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                        </div>

                        {/* Venue Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 font-normal"
                                >
                                    <span>{venueFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl max-h-60 overflow-y-auto">
                                <DropdownMenuItem
                                    onClick={() => setVenueFilter('All Venues')}
                                    className={cn("text-xs cursor-pointer", venueFilter === 'All Venues' && "font-bold text-amber-600")}
                                >
                                    All Venues
                                </DropdownMenuItem>
                                {venues.map((vn) => (
                                    <DropdownMenuItem
                                        key={vn}
                                        onClick={() => setVenueFilter(vn)}
                                        className={cn("text-xs cursor-pointer", venueFilter === vn && "font-bold text-amber-600")}
                                    >
                                        {vn}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Right action buttons: Calendar View & Export */}
                    <div className="flex items-center gap-2">
                        <Link href="/schedule/calendar">
                            <Button
                                variant="outline"
                                className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 font-normal cursor-pointer"
                            >
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>Calendar View</span>
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 font-normal cursor-pointer"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Export</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem
                                    onClick={() => window.print()}
                                    className="text-xs cursor-pointer flex items-center gap-2"
                                >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Print / PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        // Export CSV
                                        const headers = ['Title', 'Date', 'Start Time', 'End Time', 'Venue', 'Status', 'Organizer'];
                                        const rows = filteredMeetings.map(m => [
                                            `"${m.title}"`,
                                            `"${m.date}"`,
                                            `"${m.start_time}"`,
                                            `"${m.end_time}"`,
                                            `"${m.venue || ''}"`,
                                            `"${getMeetingStatusCategory(m)}"`,
                                            `"${m.organizer?.name || 'System Admin'}"`,
                                        ]);
                                        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                                        const encodedUri = encodeURI(csvContent);
                                        const link = document.createElement('a');
                                        link.setAttribute('href', encodedUri);
                                        link.setAttribute('download', 'meetings_export.csv');
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="text-xs cursor-pointer flex items-center gap-2"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Export CSV</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* 4. MAIN CONTENT SPLIT: Left (Meetings Table) + Right (Today's Agenda) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT SECTION: Meetings List Table (Span 8 or 9 cols) */}
                    <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                        <div className="mb-4">
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                Meetings List
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Showing {filteredMeetings.length} of {meetings.length} meetings
                            </p>
                        </div>

                        <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-600">
                                        <th className="pb-3 pr-4 font-bold text-slate-700">
                                            <button
                                                onClick={() => handleSort('title')}
                                                className="flex items-center gap-1 hover:text-slate-900 cursor-pointer text-left"
                                            >
                                                <span>Title</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </button>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <button
                                                onClick={() => handleSort('date')}
                                                className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                                            >
                                                <span>Date</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </button>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <button
                                                onClick={() => handleSort('time')}
                                                className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                                            >
                                                <span>Time</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </button>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <button
                                                onClick={() => handleSort('venue')}
                                                className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                                            >
                                                <span>Venue</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </button>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <button
                                                onClick={() => handleSort('organizer')}
                                                className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                                            >
                                                <span>Organizer</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </button>
                                        </th>
                                        <th className="pb-3 px-3 text-center">Status</th>
                                        <th className="pb-3 pl-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {filteredMeetings.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                                                No meetings found matching your filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMeetings.map((meeting, index) => {
                                            const statusCat = getMeetingStatusCategory(meeting);
                                            const dateObj = formatDateDisplay(meeting.date);
                                            const timeRange = formatTimeRange(meeting.start_time, meeting.end_time);
                                            const iconTheme = getIconTheme(index);
                                            const subtitle = getMeetingSubtitle(meeting);

                                            return (
                                                <tr key={meeting.id} className="hover:bg-slate-50/70 transition-colors group">
                                                    {/* Title Column with colorful icon & subtitle */}
                                                    <td className="py-3.5 pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0", iconTheme.bg)}>
                                                                <CalendarDays className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900 text-xs truncate max-w-[200px] md:max-w-[240px]">
                                                                    {meeting.title}
                                                                </p>
                                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                                    {subtitle}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Date Column */}
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        <p className="text-slate-800 font-semibold text-xs">
                                                            {dateObj.date}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {dateObj.day}
                                                        </p>
                                                    </td>

                                                    {/* Time Column with clock icon */}
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-slate-700">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="text-xs">{timeRange}</span>
                                                        </div>
                                                    </td>

                                                    {/* Venue Column with map-pin icon */}
                                                    <td className="py-3.5 px-3">
                                                        <div className="flex items-center gap-1.5 text-slate-700 max-w-[150px]">
                                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="text-xs truncate">{meeting.venue || 'TBA'}</span>
                                                        </div>
                                                    </td>

                                                    {/* Organizer Column with user icon */}
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-slate-700">
                                                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="text-xs">{meeting.organizer?.name || 'System Admin'}</span>
                                                        </div>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                                                                statusCat === 'Upcoming' && "bg-blue-50 text-blue-600 border-blue-200",
                                                                statusCat === 'Today' && "bg-amber-50 text-amber-700 border-amber-200",
                                                                statusCat === 'Completed' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            )}
                                                        >
                                                            {statusCat}
                                                        </span>
                                                    </td>

                                                    {/* Actions menu */}
                                                    <td className="py-3.5 pl-3 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                                                <DropdownMenuItem
                                                                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 text-xs cursor-pointer flex items-center gap-2"
                                                                    onClick={() => setDeletingMeeting(meeting)}
                                                                >
                                                                    <Trash className="h-3.5 w-3.5" />
                                                                    <span>Delete</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT SECTION: Today's Agenda Timeline (Span 4 cols) */}
                    <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-6">
                        {/* Header banner */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center shrink-0">
                                    <CalendarDays className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 leading-none">
                                        Today's Agenda
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Tuesday, October 13, 2026
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/70 text-amber-800 border border-amber-200/70">
                                {todayAgendaMeetings.length} meetings
                            </span>
                        </div>

                        {/* Timeline meetings list */}
                        <div className="relative pl-6 space-y-7 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200/80">
                            {todayAgendaMeetings.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No meetings scheduled for today.</p>
                            ) : (
                                todayAgendaMeetings.map((agendaMeeting, idx) => {
                                    // Bullet dot colors matching mockup: Red/Coral, Amber, Amber
                                    const dotColors = [
                                        'bg-rose-500 ring-rose-100',
                                        'bg-amber-500 ring-amber-100',
                                        'bg-amber-500 ring-amber-100',
                                    ];
                                    const dotClass = dotColors[idx % dotColors.length];

                                    return (
                                        <div key={agendaMeeting.id} className="relative group">
                                            {/* Timeline dot */}
                                            <span
                                                className={cn(
                                                    "absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full ring-4 transition-transform group-hover:scale-125",
                                                    dotClass
                                                )}
                                            />
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="w-16 shrink-0">
                                                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                                                        {formatTimeDisplay(agendaMeeting.start_time)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        {formatTimeDisplay(agendaMeeting.end_time)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                                        {agendaMeeting.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1 text-[11px] text-amber-600/90 font-medium mt-0.5">
                                                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                                                        <span className="truncate">{agendaMeeting.venue || 'No venue set'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* View Full Calendar footer link button */}
                        <div className="pt-2">
                            <Link href="/schedule/calendar" className="block w-full">
                                <Button
                                    variant="outline"
                                    className="w-full h-10 rounded-xl text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                >
                                    <span>View Full Calendar</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Delete Meeting Confirmation Modal */}
                <DeleteConfirmDialog
                    open={!!deletingMeeting}
                    onOpenChange={(open) => !open && setDeletingMeeting(null)}
                    title="Delete Meeting"
                    description="Are you sure you want to permanently delete this scheduled meeting? Attendees will no longer see it on their calendars."
                    itemName={deletingMeeting ? `${deletingMeeting.title} (${deletingMeeting.date})` : undefined}
                    confirmLabel="Delete Meeting"
                    isDeleting={isDeleting}
                    onConfirm={() => {
                        if (!deletingMeeting) return;
                        setIsDeleting(true);
                        router.delete(`/schedule/meetings/${deletingMeeting.id}`, {
                            preserveScroll: true,
                            onFinish: () => {
                                setIsDeleting(false);
                                setDeletingMeeting(null);
                            },
                        });
                    }}
                />
            </div>
        </AppLayout>
    );
}
