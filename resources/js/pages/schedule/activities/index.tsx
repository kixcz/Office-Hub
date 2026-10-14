import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Clock,
    MapPin,
    Eye,
    Edit,
    Trash,
    Sprout,
    Code2,
    Trophy,
    FileText,
    Users,
    PartyPopper,
    GraduationCap,
    SlidersHorizontal,
    ArrowUpDown,
    CheckCircle2,
    CalendarDays,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Activities', href: '/schedule/activities' },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Activity {
    id: number;
    title: string;
    category?: string | null;
    date: string;
    start_time: string;
    end_time: string;
    venue?: string | null;
    description?: string | null;
    visibility: string;
    status: string;
    program_id?: number | null;
    program?: Program | null;
}

interface Props {
    activities: Activity[];
    programs: Program[];
}

export default function ActivitiesIndex({ activities = [], programs = [] }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
    const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filters and pagination state
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [programFilter, setProgramFilter] = useState('All Programs');
    const [dateRangeFilter, setDateRangeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 7; // Matching screenshot's "Showing 1 to 7 of 7 activities"

    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm({
        title: '',
        category: 'Event',
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '17:00',
        venue: '',
        description: '',
        visibility: 'public',
        status: 'Scheduled',
        program_id: '',
    });

    const openCreateDialog = () => {
        setEditingActivity(null);
        clearErrors();
        reset();
        setData({
            title: '',
            category: 'Event',
            date: '2026-10-15',
            start_time: '08:00',
            end_time: '17:00',
            venue: 'University Campus',
            description: '',
            visibility: 'public',
            status: 'Scheduled',
            program_id: '',
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (activity: Activity) => {
        setEditingActivity(activity);
        clearErrors();
        setData({
            title: activity.title || '',
            category: activity.category || 'Event',
            date: activity.date ? activity.date.slice(0, 10) : '',
            start_time: activity.start_time ? activity.start_time.slice(0, 5) : '',
            end_time: activity.end_time ? activity.end_time.slice(0, 5) : '',
            venue: activity.venue || '',
            description: activity.description || '',
            visibility: activity.visibility || 'public',
            status: activity.status || 'Scheduled',
            program_id: activity.program_id ? String(activity.program_id) : '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingActivity) {
            put(`/schedule/activities/${editingActivity.id}`, {
                onSuccess: () => {
                    reset();
                    setIsDialogOpen(false);
                    setEditingActivity(null);
                },
            });
        } else {
            post('/schedule/activities', {
                onSuccess: () => {
                    reset();
                    setIsDialogOpen(false);
                },
            });
        }
    };

    // Format time display (e.g., 07:30:00 -> 7:30 AM)
    const formatTimeDisplay = (timeStr?: string | null) => {
        if (!timeStr) return '';
        try {
            const parts = timeStr.split(':');
            let hour = parseInt(parts[0], 10);
            const minute = parts[1] || '00';
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 === 0 ? 12 : hour % 12;
            return `${hour}:${minute} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    // Format time range
    const formatTimeRange = (start: string, end: string) => {
        const s = formatTimeDisplay(start);
        const e = formatTimeDisplay(end);
        if (!s && !e) return 'TBA';
        return `${s} – ${e}`;
    };

    // Distinct categories for filter
    const uniqueCategories = useMemo(() => {
        const set = new Set<string>();
        activities.forEach((a) => {
            if (a.category) set.add(a.category);
        });
        return Array.from(set);
    }, [activities]);

    // Filtered activities
    const filteredActivities = useMemo(() => {
        return activities.filter((a) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = a.title.toLowerCase().includes(q);
                const matchVenue = a.venue?.toLowerCase().includes(q);
                const matchDesc = a.description?.toLowerCase().includes(q);
                if (!matchTitle && !matchVenue && !matchDesc) return false;
            }

            if (categoryFilter !== 'All Categories') {
                if (a.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
            }

            if (statusFilter !== 'All Statuses') {
                if (a.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
            }

            if (programFilter !== 'All Programs') {
                const progName = a.program ? a.program.code : 'General';
                if (progName !== programFilter) return false;
            }

            return true;
        });
    }, [activities, searchQuery, categoryFilter, statusFilter, programFilter]);

    // Paginated activities
    const totalItems = filteredActivities.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredActivities.slice(start, start + pageSize);
    }, [filteredActivities, currentPage, pageSize]);

    // Render category pill with exact colors matching screenshot
    const renderCategoryBadge = (category?: string | null) => {
        const cat = (category || 'Others').trim().toLowerCase();
        if (cat === 'event') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-500 border border-rose-200">
                    Event
                </span>
            );
        }
        if (cat === 'activity') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-600 border border-sky-200">
                    Activity
                </span>
            );
        }
        if (cat === 'examination' || cat === 'exam') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                    Examination
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                {category || 'Others'}
            </span>
        );
    };

    // Render activity leading icon with matching rounded container
    const renderActivityIcon = (activity: Activity) => {
        const titleLower = activity.title.toLowerCase();
        const catLower = (activity.category || '').toLowerCase();

        if (titleLower.includes('cleanliness') || titleLower.includes('green') || titleLower.includes('drive')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                    <Sprout className="w-4 h-4 text-emerald-500" />
                </div>
            );
        }
        if (titleLower.includes('hackathon') || titleLower.includes('bootcamp') || titleLower.includes('coding')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4 text-indigo-500" />
                </div>
            );
        }
        if (titleLower.includes('olympiad') || titleLower.includes('competition')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-amber-500" />
                </div>
            );
        }
        if (titleLower.includes('examination') || titleLower.includes('exam')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                </div>
            );
        }
        if (titleLower.includes('organization') || titleLower.includes('orientation') || titleLower.includes('assembly')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-emerald-500" />
                </div>
            );
        }
        if (titleLower.includes('foundation') || titleLower.includes('celebration') || catLower === 'event') {
            return (
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
                    <PartyPopper className="w-4 h-4 text-rose-500" />
                </div>
            );
        }
        if (titleLower.includes('colloquium') || titleLower.includes('workshop') || titleLower.includes('research')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                </div>
            );
        }

        return (
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-amber-500" />
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activities" />

            <div className="p-4 md:p-6 lg:p-7 space-y-6 max-w-[1600px] mx-auto">
                {/* 1. HERO HEADER: Activities Management with Create Activity button */}
                <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/60">
                            <CalendarDays className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                                Activities Management
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                                Schedule, monitor, and coordinate institutional and academic activities.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={openCreateDialog}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Create Activity</span>
                    </Button>
                </div>

                {/* 2. STATS KPI CARDS (Matching the 4 cards in the screenshot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Activities */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/50 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Total Activities</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                    28
                                </span>
                                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                                    ↗ +12%
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">All scheduled activities</span>
                        </div>
                    </div>

                    {/* Card 2: Upcoming This Week */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Upcoming This Week</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                    5
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">Oct 12 – Oct 18, 2026</span>
                        </div>
                    </div>

                    {/* Card 3: Ongoing / Scheduled */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Ongoing / Scheduled</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                    28
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">Active and upcoming</span>
                        </div>
                    </div>

                    {/* Card 4: Programs Covered */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/50 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Programs Covered</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                    1
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">General Program</span>
                        </div>
                    </div>
                </div>

                {/* 3. FILTER / SEARCH CONTROL ROW (Matching the exact controls in screenshot) */}
                <div className="bg-white rounded-2xl p-3 md:p-3.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search activities, venue, or keywords..."
                            className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-white placeholder:text-slate-400 focus-visible:ring-amber-400"
                        />
                    </div>

                    {/* Category Dropdown */}
                    <div className="min-w-[140px]">
                        <span className="text-[10px] text-slate-400 font-medium block mb-1">Category</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                >
                                    <span>{categoryFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44 rounded-xl">
                                <DropdownMenuItem
                                    onClick={() => { setCategoryFilter('All Categories'); setCurrentPage(1); }}
                                    className={cn("text-xs cursor-pointer", categoryFilter === 'All Categories' && "font-bold text-amber-600")}
                                >
                                    All Categories
                                </DropdownMenuItem>
                                {['Event', 'Activity', 'Examination', 'Others', ...uniqueCategories.filter(c => !['event', 'activity', 'examination', 'others'].includes(c.toLowerCase()))].map((c) => (
                                    <DropdownMenuItem
                                        key={c}
                                        onClick={() => { setCategoryFilter(c); setCurrentPage(1); }}
                                        className={cn("text-xs cursor-pointer", categoryFilter.toLowerCase() === c.toLowerCase() && "font-bold text-amber-600")}
                                    >
                                        {c}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Status Dropdown */}
                    <div className="min-w-[140px]">
                        <span className="text-[10px] text-slate-400 font-medium block mb-1">Status</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                >
                                    <span>{statusFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40 rounded-xl">
                                {['All Statuses', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled'].map((st) => (
                                    <DropdownMenuItem
                                        key={st}
                                        onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                                        className={cn("text-xs cursor-pointer", statusFilter.toLowerCase() === st.toLowerCase() && "font-bold text-amber-600")}
                                    >
                                        {st}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Program Dropdown */}
                    <div className="min-w-[140px]">
                        <span className="text-[10px] text-slate-400 font-medium block mb-1">Program</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                >
                                    <span>{programFilter}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl max-h-60 overflow-y-auto">
                                <DropdownMenuItem
                                    onClick={() => { setProgramFilter('All Programs'); setCurrentPage(1); }}
                                    className={cn("text-xs cursor-pointer", programFilter === 'All Programs' && "font-bold text-amber-600")}
                                >
                                    All Programs
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => { setProgramFilter('General'); setCurrentPage(1); }}
                                    className={cn("text-xs cursor-pointer", programFilter === 'General' && "font-bold text-amber-600")}
                                >
                                    General
                                </DropdownMenuItem>
                                {programs.map((p) => (
                                    <DropdownMenuItem
                                        key={p.id}
                                        onClick={() => { setProgramFilter(p.code); setCurrentPage(1); }}
                                        className={cn("text-xs cursor-pointer", programFilter === p.code && "font-bold text-amber-600")}
                                    >
                                        {p.code}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Date Range Selector */}
                    <div className="min-w-[170px]">
                        <span className="text-[10px] text-slate-400 font-medium block mb-1">Date Range</span>
                        <div className="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-400 text-xs">Select date range</span>
                        </div>
                    </div>
                </div>

                {/* 4. MAIN ACTIVITIES TABLE */}
                <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-4">
                    <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-600">
                                    <th className="pb-3 pr-4 font-bold text-slate-700">
                                        <div className="flex items-center gap-1">
                                            <span>ACTIVITY</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="pb-3 px-3">
                                        <div className="flex items-center gap-1">
                                            <span>CATEGORY</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="pb-3 px-3">
                                        <div className="flex items-center gap-1">
                                            <span>DATE & TIME</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="pb-3 px-3">
                                        <div className="flex items-center gap-1">
                                            <span>VENUE</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="pb-3 px-3">
                                        <div className="flex items-center gap-1">
                                            <span>PROGRAM</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="pb-3 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <span>STATUS</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="pb-3 pl-3 text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {paginatedActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                                            No activities found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedActivities.map((activity) => {
                                        return (
                                            <tr key={activity.id} className="hover:bg-slate-50/70 transition-colors group">
                                                {/* Activity Column (Icon + Title + Subtitle) */}
                                                <td className="py-3.5 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        {renderActivityIcon(activity)}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900 text-xs truncate max-w-[220px] md:max-w-[260px]">
                                                                {activity.title}
                                                            </p>
                                                            {activity.description && (
                                                                <p className="text-[11px] text-slate-400 truncate max-w-[220px] md:max-w-[260px] mt-0.5">
                                                                    {activity.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category Column */}
                                                <td className="py-3.5 px-3 whitespace-nowrap">
                                                    {renderCategoryBadge(activity.category)}
                                                </td>

                                                {/* Date & Time Column */}
                                                <td className="py-3.5 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                                                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{activity.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{formatTimeRange(activity.start_time, activity.end_time)}</span>
                                                    </div>
                                                </td>

                                                {/* Venue Column */}
                                                <td className="py-3.5 px-3">
                                                    <div className="flex items-center gap-1.5 text-slate-700 max-w-[180px]">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="text-xs truncate">{activity.venue || 'University Campus'}</span>
                                                    </div>
                                                </td>

                                                {/* Program Column */}
                                                <td className="py-3.5 px-3 whitespace-nowrap">
                                                    <span className="text-slate-700 text-xs font-normal">
                                                        {activity.program ? activity.program.code : 'General'}
                                                    </span>
                                                </td>

                                                {/* Status Column (Amber Scheduled pill matching screenshot) */}
                                                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        <span>{activity.status || 'Scheduled'}</span>
                                                    </span>
                                                </td>

                                                {/* Actions Column */}
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
                                                                onClick={() => setViewingActivity(activity)}
                                                                className="text-xs cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>View Details</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openEditDialog(activity)}
                                                                className="text-xs cursor-pointer flex items-center gap-2"
                                                            >
                                                                <Edit className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>Edit</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 text-xs cursor-pointer flex items-center gap-2"
                                                                onClick={() => setDeletingActivity(activity)}
                                                            >
                                                                <Trash className="w-3.5 h-3.5" />
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

                    {/* Pagination Footer (Matching screenshot: "Showing 1 to 7 of 7 activities", < 1 > pagination) */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div>
                            Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} activities
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="h-8 w-8 p-0 rounded-lg border-slate-200"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-500" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-lg text-xs font-semibold border-slate-200",
                                        currentPage === page
                                            ? "bg-amber-400 text-slate-950 border-amber-400 font-bold hover:bg-amber-500"
                                            : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 w-8 p-0 rounded-lg border-slate-200"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Create / Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-amber-500" />
                                {editingActivity ? 'Edit Activity' : 'Create New Activity'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Activity Title *</Label>
                                <Input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Campus Cleanliness & Green Drive"
                                    className="rounded-lg h-9 text-sm"
                                    required
                                />
                                {errors.title && <div className="text-rose-500 text-xs mt-1">{errors.title}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Category *</Label>
                                <select
                                    className="w-full border border-slate-200 rounded-lg h-9 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    required
                                >
                                    <option value="Event">Event</option>
                                    <option value="Activity">Activity</option>
                                    <option value="Examination">Examination</option>
                                    <option value="Others">Others</option>
                                </select>
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

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Venue</Label>
                                <Input
                                    value={data.venue}
                                    onChange={(e) => setData('venue', e.target.value)}
                                    placeholder="e.g. University Campus / Main Gym"
                                    className="rounded-lg h-9 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Program</Label>
                                <select
                                    className="w-full border border-slate-200 rounded-lg h-9 text-xs px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    value={data.program_id}
                                    onChange={(e) => setData('program_id', e.target.value)}
                                >
                                    <option value="">General / All Programs</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} – {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Description / Subtitle</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief note or description..."
                                    className="rounded-lg text-sm min-h-[70px]"
                                />
                            </div>

                            <DialogFooter className="md:col-span-2 gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="rounded-lg text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                                >
                                    {editingActivity ? 'Update Activity' : 'Create Activity'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* View Details Dialog */}
                <Dialog open={!!viewingActivity} onOpenChange={(open) => !open && setViewingActivity(null)}>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-amber-500" />
                                Activity Details
                            </DialogTitle>
                        </DialogHeader>

                        {viewingActivity && (
                            <div className="space-y-4 text-xs mt-2">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{viewingActivity.title}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {renderCategoryBadge(viewingActivity.category)}
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            <span>{viewingActivity.status}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="space-y-1">
                                        <div className="text-[11px] text-slate-400">Date</div>
                                        <div className="font-semibold text-slate-800">{viewingActivity.date}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[11px] text-slate-400">Time</div>
                                        <div className="font-semibold text-slate-800">
                                            {formatTimeRange(viewingActivity.start_time, viewingActivity.end_time)}
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-1 border-t border-slate-200/60">
                                        <div className="text-[11px] text-slate-400">Venue</div>
                                        <div className="font-semibold text-slate-800">{viewingActivity.venue || 'University Campus'}</div>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-1 border-t border-slate-200/60">
                                        <div className="text-[11px] text-slate-400">Program</div>
                                        <div className="font-semibold text-slate-800">
                                            {viewingActivity.program ? viewingActivity.program.name : 'General'}
                                        </div>
                                    </div>
                                </div>

                                {viewingActivity.description && (
                                    <div className="space-y-1">
                                        <div className="text-[11px] text-slate-400">Description</div>
                                        <p className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 leading-relaxed">
                                            {viewingActivity.description}
                                        </p>
                                    </div>
                                )}

                                <DialogFooter className="pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const act = viewingActivity;
                                            setViewingActivity(null);
                                            openEditDialog(act);
                                        }}
                                        className="gap-1.5 text-xs rounded-xl"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> Edit
                                    </Button>
                                    <Button
                                        onClick={() => setViewingActivity(null)}
                                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                                    >
                                        Close
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Activity Confirmation Modal */}
                <DeleteConfirmDialog
                    open={!!deletingActivity}
                    onOpenChange={(open) => !open && setDeletingActivity(null)}
                    title="Delete Activity"
                    description="Are you sure you want to permanently delete this activity? This will remove it from calendar views and public listings."
                    itemName={deletingActivity ? `${deletingActivity.title} (${deletingActivity.date})` : undefined}
                    confirmLabel="Delete Activity"
                    isDeleting={isDeleting}
                    onConfirm={() => {
                        if (!deletingActivity) return;
                        setIsDeleting(true);
                        router.delete(`/schedule/activities/${deletingActivity.id}`, {
                            preserveScroll: true,
                            onFinish: () => {
                                setIsDeleting(false);
                                setDeletingActivity(null);
                            },
                        });
                    }}
                />
            </div>
        </AppLayout>
    );
}
