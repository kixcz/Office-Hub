import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    RotateCw,
    AlertTriangle,
    Mail,
    BarChart3,
    Check,
    CheckCircle2,
    HelpCircle,
    X,
    Filter,
    Edit3,
    ArrowRight,
    Bell,
    Globe,
    Layers,
    Tag,
    Share2,
    CalendarCheck,
    Briefcase,
    Building2,
    GraduationCap,
    Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EventItem {
    id: string;
    raw_id: number;
    type: 'meeting' | 'activity';
    title: string;
    category: string; // 'Meeting', 'Consultation', 'Workshop', 'Lecture', etc.
    scope: string; // 'Official', 'Department', 'Personal', 'College Activity', 'Curriculum', etc.
    date: string;
    date_formatted: string;
    month: string;
    day: string;
    day_name: string;
    time_range: string;
    venue: string;
    audience: string;
    organizer: string;
    description: string;
    rsvp_status: 'Confirmed' | 'Needs Response' | 'Maybe' | 'Declined';
    is_personal: boolean;
}

interface StatItem {
    count: number;
    breakdown?: string;
    note?: string;
}

interface Props {
    faculty: any;
    events: EventItem[];
    stats: {
        upcoming_today: StatItem;
        this_week: StatItem;
        pending_rsvps: StatItem;
        calendar_conflicts: StatItem;
    };
    current_period?: any;
    academic_periods?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Meetings & Events', href: '/faculty/meetings' },
];

export default function FacultyMeetingsPage({
    faculty,
    events = [],
    stats,
    current_period,
    academic_periods = [],
}: Props) {
    // Search & Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState(
        current_period?.name || '1st Semester, AY 2026-2027'
    );
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedScope, setSelectedScope] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [activeTab, setActiveTab] = useState<'all' | 'meetings' | 'activities'>('all');
    const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'title'>('date_asc');

    // Selected event for right-side Event Details card
    const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 's_1');

    // RSVP local state overrides so user can interactively click Going, Maybe, Not Going
    const [rsvpOverrides, setRsvpOverrides] = useState<Record<string, 'Confirmed' | 'Maybe' | 'Declined' | 'Needs Response'>>({});

    // Add Personal Event Dialog State
    const [isAddEventOpen, setIsAddEventOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventCategory, setNewEventCategory] = useState('Consultation');
    const [newEventDate, setNewEventDate] = useState('2026-10-16');
    const [newEventTime, setNewEventTime] = useState('01:00 PM - 02:00 PM');
    const [newEventVenue, setNewEventVenue] = useState('');
    const [newEventAudience, setNewEventAudience] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');

    // Local events list that can be appended by adding personal event
    const [localEvents, setLocalEvents] = useState<EventItem[]>(events);

    // Sync notification feedback
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const handleSyncCalendar = () => {
        setSyncMessage('Calendar synced with university schedule!');
        setTimeout(() => setSyncMessage(null), 3000);
    };

    // Filtered Events
    const filteredEvents = useMemo(() => {
        return localEvents.filter((item) => {
            // Tab filter
            if (activeTab === 'meetings' && item.type !== 'meeting' && !item.is_personal) return false;
            if (activeTab === 'activities' && item.type !== 'activity' && item.scope !== 'College Activity') return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchVenue = item.venue.toLowerCase().includes(q);
                const matchOrganizer = item.organizer.toLowerCase().includes(q);
                const matchAudience = item.audience.toLowerCase().includes(q);
                const matchCategory = item.category.toLowerCase().includes(q);
                if (!matchTitle && !matchVenue && !matchOrganizer && !matchAudience && !matchCategory) {
                    return false;
                }
            }

            // Category filter
            if (selectedCategory !== 'All' && item.category !== selectedCategory) {
                return false;
            }

            // Scope filter
            if (selectedScope !== 'All' && item.scope !== selectedScope) {
                return false;
            }

            // Status filter
            const effectiveRsvp = rsvpOverrides[item.id] || item.rsvp_status;
            if (selectedStatus !== 'All') {
                if (selectedStatus === 'Confirmed' && effectiveRsvp !== 'Confirmed') return false;
                if (selectedStatus === 'Needs Response' && effectiveRsvp !== 'Needs Response') return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
            if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
            return a.title.localeCompare(b.title);
        });
    }, [localEvents, activeTab, searchQuery, selectedCategory, selectedScope, selectedStatus, sortBy, rsvpOverrides]);

    // Active selected item for details card
    const activeEvent = useMemo(() => {
        return localEvents.find((e) => e.id === selectedEventId) || localEvents[0] || null;
    }, [localEvents, selectedEventId]);

    const activeRsvpStatus = activeEvent
        ? (rsvpOverrides[activeEvent.id] || activeEvent.rsvp_status)
        : 'Confirmed';

    const handleRsvpChange = (eventId: string, newStatus: 'Confirmed' | 'Maybe' | 'Declined') => {
        setRsvpOverrides((prev) => ({
            ...prev,
            [eventId]: newStatus,
        }));
    };

    const handleAddPersonalEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;

        const newId = 'personal_' + Date.now();
        const dateObj = new Date(newEventDate);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const item: EventItem = {
            id: newId,
            raw_id: Date.now(),
            type: 'activity',
            title: newEventTitle,
            category: newEventCategory,
            scope: 'Personal',
            date: newEventDate,
            date_formatted: `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`,
            month: months[dateObj.getMonth()],
            day: String(dateObj.getDate()).padStart(2, '0'),
            day_name: days[dateObj.getDay()],
            time_range: newEventTime,
            venue: newEventVenue || 'My Office (CIDS 3F)',
            audience: newEventAudience || 'Student / Personal',
            organizer: 'Created by You',
            description: newEventDesc || 'Personal consultation or scheduled activity.',
            rsvp_status: 'Confirmed',
            is_personal: true,
        };

        setLocalEvents([item, ...localEvents]);
        setSelectedEventId(newId);
        setIsAddEventOpen(false);
        setNewEventTitle('');
        setNewEventVenue('');
        setNewEventAudience('');
        setNewEventDesc('');
    };

    // Quick counts for tabs
    const allCount = localEvents.length;
    const myMeetingsCount = localEvents.filter((e) => e.type === 'meeting' || e.is_personal).length;
    const collegeActivitiesCount = localEvents.filter((e) => e.type === 'activity' && e.scope === 'College Activity').length;

    // Helper for category pill color
    const getCategoryBadgeClass = (category: string) => {
        switch (category.toLowerCase()) {
            case 'meeting':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
            case 'consultation':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
            case 'workshop':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
            default:
                return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
        }
    };

    const getScopeBadgeClass = (scope: string) => {
        switch (scope.toLowerCase()) {
            case 'official':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
            case 'department':
                return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
            case 'personal':
                return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700';
            case 'college activity':
                return 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800';
            case 'curriculum':
                return 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meetings & Events - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-7 space-y-6 max-w-[1600px] mx-auto text-foreground">
                {/* 1. Header Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                            <CalendarIcon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                                Meetings & Events
                            </h1>
                            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                Track your personal meetings, college events, consultations, workshops, and academic activities in one organized workspace.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setIsAddEventOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs md:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Add Personal Event</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSyncCalendar}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-card hover:bg-muted/70 text-foreground border border-border text-xs md:text-sm font-semibold shadow-2xs hover:border-border/80 transition-all active:scale-[0.98]"
                        >
                            <RotateCw className="w-4 h-4 text-muted-foreground" />
                            <span>Sync Calendar</span>
                        </button>

                        <Link
                            href="/faculty/calendar"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-card hover:bg-muted/70 text-foreground border border-border text-xs md:text-sm font-semibold shadow-2xs hover:border-border/80 transition-all active:scale-[0.98]"
                        >
                            <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                            <span>Calendar View</span>
                        </Link>
                    </div>
                </div>

                {/* Toast feedback if synced */}
                {syncMessage && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{syncMessage}</span>
                    </div>
                )}

                {/* 2. Top Statistic KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Upcoming Today */}
                    <div className="bg-card rounded-2xl border border-amber-200/60 dark:border-amber-900/40 p-4.5 shadow-2xs relative overflow-hidden flex items-start justify-between">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Upcoming Today</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-foreground">
                                    {stats?.upcoming_today?.count ?? 3}
                                </span>
                                <span className="text-xs text-muted-foreground">events</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {stats?.upcoming_today?.breakdown ?? '1 meeting · 1 class · 1 other'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                    </div>

                    {/* This Week */}
                    <div className="bg-card rounded-2xl border border-blue-200/60 dark:border-blue-900/40 p-4.5 shadow-2xs relative overflow-hidden flex items-start justify-between">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">This Week</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-foreground">
                                    {stats?.this_week?.count ?? 7}
                                </span>
                                <span className="text-xs text-muted-foreground">events</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {stats?.this_week?.breakdown ?? '4 meetings · 2 activities · 1 other'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Pending RSVPs */}
                    <div className="bg-card rounded-2xl border border-red-200/60 dark:border-red-900/40 p-4.5 shadow-2xs relative overflow-hidden flex items-start justify-between">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Pending RSVPs</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                    {stats?.pending_rsvps?.count ?? 2}
                                </span>
                                <span className="text-xs text-muted-foreground">events</span>
                            </div>
                            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                {stats?.pending_rsvps?.note ?? 'Action needed'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Calendar Conflicts */}
                    <div className="bg-card rounded-2xl border border-amber-300/70 dark:border-amber-800/50 p-4.5 shadow-2xs relative overflow-hidden flex items-start justify-between">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Calendar Conflicts</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                    {stats?.calendar_conflicts?.count ?? 1}
                                </span>
                                <span className="text-xs text-muted-foreground">conflict</span>
                            </div>
                            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                {stats?.calendar_conflicts?.note ?? 'Tomorrow, 10:00 AM'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 3. Filter Controls Toolbar */}
                <div className="bg-card rounded-2xl border border-border p-3.5 shadow-2xs flex flex-wrap items-center gap-3">
                    {/* Academic Period */}
                    <div className="flex items-center gap-2 min-w-[210px] flex-1 sm:flex-initial">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Academic Period:</span>
                        <div className="relative flex-1">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="w-full text-xs font-semibold bg-muted/40 border border-border rounded-xl px-3 py-2 pr-7 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden appearance-none cursor-pointer"
                            >
                                <option value="1st Semester, AY 2026-2027">1st Semester, AY 2026-2027</option>
                                <option value="2nd Semester, AY 2025-2026">2nd Semester, AY 2025-2026</option>
                                <option value="Midyear, AY 2025-2026">Midyear, AY 2025-2026</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="relative min-w-[140px] flex-1 sm:flex-initial">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full text-xs font-semibold bg-muted/40 border border-border rounded-xl px-3 py-2 pr-7 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden appearance-none cursor-pointer"
                        >
                            <option value="All">All Categories</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Consultation">Consultation</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Activity">Activity</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>

                    {/* Program Scope */}
                    <div className="relative min-w-[140px] flex-1 sm:flex-initial">
                        <select
                            value={selectedScope}
                            onChange={(e) => setSelectedScope(e.target.value)}
                            className="w-full text-xs font-semibold bg-muted/40 border border-border rounded-xl px-3 py-2 pr-7 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden appearance-none cursor-pointer"
                        >
                            <option value="All">All Scopes</option>
                            <option value="Official">Official</option>
                            <option value="Department">Department</option>
                            <option value="College Activity">College Activity</option>
                            <option value="Curriculum">Curriculum</option>
                            <option value="Personal">Personal</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative min-w-[130px] flex-1 sm:flex-initial">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full text-xs font-semibold bg-muted/40 border border-border rounded-xl px-3 py-2 pr-7 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden appearance-none cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Needs Response">Needs Response</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search meetings, events, or organizers..."
                            className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. Scope Tabs & Sort Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                                activeTab === 'all'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/70 dark:border-amber-700/60 shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            All Events ({allCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('meetings')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                                activeTab === 'meetings'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/70 dark:border-amber-700/60 shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            My Meetings ({myMeetingsCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('activities')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                                activeTab === 'activities'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/70 dark:border-amber-700/60 shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            College Activities ({collegeActivitiesCount})
                        </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span className="text-xs text-muted-foreground font-medium">Sort by:</span>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="text-xs font-semibold bg-card border border-border rounded-xl px-3 py-1.5 pr-7 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden appearance-none cursor-pointer"
                            >
                                <option value="date_asc">Date (Soonest)</option>
                                <option value="date_desc">Date (Latest)</option>
                                <option value="title">Title (A-Z)</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-2 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* 5. Main Split Section: Upcoming Schedule (Left) & Sidebar Widgets (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Upcoming Schedule Cards (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-4.5 bg-amber-500 rounded-full" />
                            <h2 className="text-base font-extrabold text-foreground tracking-tight">Upcoming Schedule</h2>
                        </div>

                        {filteredEvents.length > 0 ? (
                            <div className="space-y-3.5">
                                {filteredEvents.map((item) => {
                                    const isSelected = activeEvent?.id === item.id;
                                    const effectiveRsvp = rsvpOverrides[item.id] || item.rsvp_status;

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedEventId(item.id)}
                                            className={cn(
                                                'bg-card rounded-2xl border p-4.5 shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-400/80 group',
                                                isSelected
                                                    ? 'border-amber-500/80 ring-1 ring-amber-500/50 bg-amber-500/[0.02]'
                                                    : 'border-border'
                                            )}
                                        >
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                {/* Date Block */}
                                                <div className="w-14 h-14 rounded-xl bg-muted/60 border border-border/80 flex flex-col items-center justify-center shrink-0 text-center font-bold">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">
                                                        {item.month}
                                                    </span>
                                                    <span className="text-lg font-black text-foreground leading-tight">
                                                        {item.day}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase leading-none font-semibold">
                                                        {item.day_name}
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    {/* Tags */}
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full', getCategoryBadgeClass(item.category))}>
                                                            {item.category}
                                                        </span>
                                                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getScopeBadgeClass(item.scope))}>
                                                            {item.scope}
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-sm font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                                        {item.title}
                                                    </h3>

                                                    {/* Time & Venue */}
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1 text-red-500/90 font-medium">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{item.time_range}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                                            <span className="truncate max-w-[200px]">{item.venue}</span>
                                                        </div>
                                                        {item.audience && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Users className="w-3.5 h-3.5 text-blue-500" />
                                                                <span className="truncate max-w-[180px]">{item.audience}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Organizer */}
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Organized by: <span className="font-semibold text-foreground/80">{item.organizer}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status Badge & Arrow */}
                                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                                                {effectiveRsvp === 'Confirmed' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                        <span>Confirmed</span>
                                                    </span>
                                                ) : effectiveRsvp === 'Needs Response' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        <span>Needs Response</span>
                                                    </span>
                                                ) : effectiveRsvp === 'Maybe' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                                        <HelpCircle className="w-3 h-3" />
                                                        <span>Maybe</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                        <X className="w-3 h-3" />
                                                        <span>Not Going</span>
                                                    </span>
                                                )}

                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
                                <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
                                <h3 className="text-sm font-bold text-foreground">No events match your current filter</h3>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    Try resetting your search query, scope or category filters to see all available schedule items.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('All');
                                        setSelectedScope('All');
                                        setSelectedStatus('All');
                                        setActiveTab('all');
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Sidebar Widgets (5 cols) */}
                    <div className="lg:col-span-5 space-y-5">
                        {/* 1. Mini Interactive Calendar Widget + Today's Agenda side by side on large screens */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* October 2026 Mini Calendar */}
                            <div className="bg-card rounded-2xl border border-border p-4 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-foreground">October 2026</span>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <button type="button" className="p-1 hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" className="p-1 hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                        <span key={d} className="font-semibold text-muted-foreground py-0.5">
                                            {d}
                                        </span>
                                    ))}

                                    {/* Prev month days */}
                                    {[27, 28, 29, 30].map((d) => (
                                        <span key={'prev-' + d} className="text-muted-foreground/40 py-1 font-medium">
                                            {d}
                                        </span>
                                    ))}

                                    {/* Oct days */}
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                                        const isToday = d === 15;
                                        const hasEvent = [15, 16, 17, 20].includes(d);
                                        return (
                                            <div
                                                key={d}
                                                className={cn(
                                                    'py-1 rounded-lg font-semibold flex flex-col items-center justify-center relative transition-colors',
                                                    isToday
                                                        ? 'bg-amber-500 text-white font-black shadow-2xs'
                                                        : 'text-foreground hover:bg-muted/60'
                                                )}
                                            >
                                                <span>{d}</span>
                                                {hasEvent && !isToday && (
                                                    <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-0.5" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Today's Agenda */}
                            <div className="bg-card rounded-2xl border border-border p-4 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-xs font-black text-foreground">Today's Agenda</span>
                                    </div>
                                    <Link href="/faculty/calendar" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline">
                                        View All
                                    </Link>
                                </div>

                                <div className="space-y-3 pt-1">
                                    {/* Agenda Item 1 */}
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">3:00 PM</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground leading-snug truncate">
                                                Monthly Faculty General Assembly
                                            </h4>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                                <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                                <span className="truncate">CIDS Multi-Purpose Hall</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agenda Item 2 */}
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">6:00 PM</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground leading-snug truncate">
                                                Prepare Midterm Exams
                                            </h4>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                                <Building2 className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                                <span>At Home</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agenda Item 3 */}
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">8:00 PM</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground leading-snug truncate">
                                                Check Student Submissions
                                            </h4>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                                <Tag className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                                <span>Personal Task</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Quick Actions widget */}
                        <div className="bg-card rounded-2xl border border-border p-4 shadow-2xs space-y-3">
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-black text-foreground">Quick Actions</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddEventOpen(true)}
                                    className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/60 transition-all flex flex-col items-center justify-center text-center gap-1.5 group active:scale-95"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground leading-tight">Add Personal Event</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSyncCalendar}
                                    className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/60 transition-all flex flex-col items-center justify-center text-center gap-1.5 group active:scale-95"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform font-bold text-xs">
                                        G
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground leading-tight">Sync with Google</span>
                                </button>

                                <Link
                                    href="/faculty/calendar"
                                    className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/60 transition-all flex flex-col items-center justify-center text-center gap-1.5 group active:scale-95"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground leading-tight">View My Calendar</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSyncMessage('Reminder alerts refreshed!');
                                        setTimeout(() => setSyncMessage(null), 3000);
                                    }}
                                    className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/60 transition-all flex flex-col items-center justify-center text-center gap-1.5 group active:scale-95"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground leading-tight">Set Reminders</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Event Details Card (Selected meeting/event preview with RSVP buttons) */}
                        {activeEvent ? (
                            <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarCheck className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-black text-foreground">Event Details</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (activeEvent.is_personal) {
                                                setIsAddEventOpen(true);
                                                setNewEventTitle(activeEvent.title);
                                                setNewEventVenue(activeEvent.venue);
                                                setNewEventDesc(activeEvent.description);
                                            }
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                    </button>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full', getCategoryBadgeClass(activeEvent.category))}>
                                        {activeEvent.category}
                                    </span>
                                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getScopeBadgeClass(activeEvent.scope))}>
                                        {activeEvent.scope} {activeEvent.scope === 'Official' ? 'Event' : ''}
                                    </span>
                                </div>

                                {/* Title & Description */}
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-foreground leading-tight">
                                        {activeEvent.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {activeEvent.description}
                                    </p>
                                </div>

                                {/* Meta details list */}
                                <div className="space-y-2 pt-2 border-t border-border/70 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span className="font-semibold text-foreground">
                                            {activeEvent.day_name ? `${activeEvent.day_name === 'Thu' ? 'Thursday' : activeEvent.day_name === 'Fri' ? 'Friday' : activeEvent.day_name === 'Sat' ? 'Saturday' : 'Tuesday'}, ${activeEvent.month === 'OCT' ? 'October' : activeEvent.month} ${activeEvent.day}, 2026` : activeEvent.date_formatted}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                        <span>{activeEvent.time_range}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>{activeEvent.venue}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span>{activeEvent.audience}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span>Organized by: <strong className="text-foreground">{activeEvent.organizer}</strong></span>
                                    </div>
                                </div>

                                {/* RSVP Buttons (Going, Maybe, Not Going) */}
                                <div className="pt-3 border-t border-border/70">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                        Your Response:
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleRsvpChange(activeEvent.id, 'Confirmed')}
                                            className={cn(
                                                'py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs',
                                                activeRsvpStatus === 'Confirmed'
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'bg-muted/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-border'
                                            )}
                                        >
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            <span>Going</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRsvpChange(activeEvent.id, 'Maybe')}
                                            className={cn(
                                                'py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs',
                                                activeRsvpStatus === 'Maybe'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-muted/40 hover:bg-blue-500/10 text-muted-foreground border border-border'
                                            )}
                                        >
                                            <HelpCircle className="w-3.5 h-3.5" />
                                            <span>Maybe</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRsvpChange(activeEvent.id, 'Declined')}
                                            className={cn(
                                                'py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs',
                                                activeRsvpStatus === 'Declined'
                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                    : 'bg-muted/40 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-border'
                                            )}
                                        >
                                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Not Going</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Add Personal Event Modal Dialog */}
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-amber-500" />
                            <span>Add Personal Event</span>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAddPersonalEvent} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Event / Consultation Title</label>
                            <input
                                type="text"
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                placeholder="e.g. Student Consultation – Capstone Progress"
                                required
                                className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Category</label>
                                <select
                                    value={newEventCategory}
                                    onChange={(e) => setNewEventCategory(e.target.value)}
                                    className="w-full text-xs font-semibold bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                                >
                                    <option value="Consultation">Consultation</option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Personal Task">Personal Task</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Date</label>
                                <input
                                    type="date"
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Time Slot</label>
                                <input
                                    type="text"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    placeholder="1:00 PM - 2:00 PM"
                                    className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Venue / Location</label>
                                <input
                                    type="text"
                                    value={newEventVenue}
                                    onChange={(e) => setNewEventVenue(e.target.value)}
                                    placeholder="My Office (CIDS 3F)"
                                    className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Target Audience / Participants</label>
                            <input
                                type="text"
                                value={newEventAudience}
                                onChange={(e) => setNewEventAudience(e.target.value)}
                                placeholder="BSIT Capstone Group 2"
                                className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Description / Notes</label>
                            <textarea
                                value={newEventDesc}
                                onChange={(e) => setNewEventDesc(e.target.value)}
                                rows={3}
                                placeholder="Advising session regarding chapter 3 methodology and hardware implementation..."
                                className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl p-3 text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-hidden resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddEventOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl hover:bg-muted text-muted-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-2xs"
                            >
                                Save Event
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
