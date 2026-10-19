import React, { useState, FormEventHandler, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import { 
    Megaphone, 
    Search, 
    Plus, 
    PlusCircle,
    FileText, 
    Clock, 
    Archive, 
    Users, 
    Calendar as CalendarIcon, 
    MoreVertical, 
    Eye, 
    Edit, 
    Trash2, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight,
    TrendingUp,
    CheckCircle2,
    X,
    Filter
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Announcements',
        href: '/announcements',
    },
];

interface Announcement {
    id: number;
    title: string;
    message: string;
    category: string;
    priority: string;
    destination: string;
    status: string;
    author?: { name: string };
    publish_at?: string;
    expire_at?: string;
    created_at: string;
}

interface PaginationData {
    data: Announcement[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    announcements: PaginationData;
    stats?: {
        total: number;
        active: number;
        scheduled: number;
        archived: number;
        active_percentage?: number;
        scheduled_percentage?: number;
        archived_percentage?: number;
    };
    categories?: string[];
    filters?: {
        search?: string;
        category?: string;
        priority?: string;
        status?: string;
    };
}

export default function AnnouncementsIndex({ 
    announcements, 
    stats,
    categories = [],
    filters = {}
}: Props) {
    const [isCreating, setIsCreating] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // Client-side search & filter state
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Create form
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        message: '',
        category: 'General',
        priority: 'normal',
        destination: 'public',
        status: 'active',
        publish_at: new Date().toISOString().slice(0, 16),
        expire_at: '',
    });

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        post('/announcements', {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            }
        });
    };

    // Filter announcements locally or trigger query
    const filteredList = useMemo(() => {
        if (!announcements?.data) return [];
        return announcements.data.filter((item) => {
            const matchesSearch = searchTerm === '' || 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = selectedCategory === 'all' || 
                (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());

            const matchesPriority = selectedPriority === 'all' || 
                item.priority.toLowerCase() === selectedPriority.toLowerCase();

            const matchesStatus = selectedStatus === 'all' || 
                item.status.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
        });
    }, [announcements?.data, searchTerm, selectedCategory, selectedPriority, selectedStatus]);

    // Active KPI metrics
    const totalAnnouncements = stats?.total ?? announcements?.total ?? 0;
    const activeCount = stats?.active ?? 0;
    const scheduledCount = stats?.scheduled ?? 0;
    const archivedCount = stats?.archived ?? 0;

    const getCategoryBadge = (category: string) => {
        const cat = (category || 'General').toLowerCase();
        if (cat === 'requirement') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                    Requirement
                </span>
            );
        }
        if (cat === 'enrollment') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    Enrollment
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                {category || 'General'}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Urgent
                    </span>
                );
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        High
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Normal
                    </span>
                );
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                    </span>
                );
            case 'scheduled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Scheduled
                    </span>
                );
            case 'archived':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Archived
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 capitalize">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {status}
                    </span>
                );
        }
    };

    const getIconByRow = (_idx: number, category?: string) => {
        const cat = (category || '').toLowerCase();
        if (cat === 'requirement') {
            return (
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                </div>
            );
        }
        if (cat === 'enrollment') {
            return (
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                </div>
            );
        }
        return (
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-4 h-4" />
            </div>
        );
    };

    const getAudience = (announcement: Announcement, _idx: number) => {
        if (announcement.destination === 'office') {
            return {
                title: 'Internal Office / Faculty',
                subtitle: 'Restricted Staff',
            };
        }
        return {
            title: 'All Students & Public',
            subtitle: 'College-wide',
        };
    };

    const formatPublishDate = (dateStr?: string, _idx?: number) => {
        if (!dateStr) {
            return { date: 'Immediate', time: 'Active' };
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            return { date: 'Immediate', time: 'Active' };
        }
        return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full transition-colors">
                {/* Hero Header Banner */}
                <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent p-6 sm:p-7 relative overflow-hidden flex items-center justify-between shadow-2xs">
                    {/* Left Info */}
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <Megaphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Announcements
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                Manage official communications for the college and public displays.
                            </p>
                        </div>
                    </div>

                    {/* Right Decorative Megaphone Illustration */}
                    <div className="hidden md:flex items-center opacity-85 pointer-events-none select-none">
                        <svg className="w-32 h-24 text-amber-500/30 dark:text-amber-400/20" viewBox="0 0 160 120" fill="none" stroke="currentColor">
                            {/* Stylized Megaphone Cone */}
                            <path d="M40 50 L95 25 L105 30 L105 90 L95 95 L40 70 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                            {/* Megaphone Handle */}
                            <path d="M55 70 L55 95 L45 95 L45 65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Bell opening ring */}
                            <ellipse cx="105" cy="60" rx="6" ry="30" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="3" />
                            {/* Soundwave lines */}
                            <path d="M120 40 C 130 50, 130 70, 120 80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            <path d="M135 30 C 150 45, 150 75, 135 90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            <path d="M148 20 C 168 40, 168 80, 148 100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
                        </svg>
                    </div>
                </div>

                {/* 4 Bento Metric Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Announcements */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Announcements</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {totalAnnouncements}
                            </p>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                ↗ +1 this month
                            </p>
                        </div>
                    </div>

                    {/* Active */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {activeCount}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                                {stats?.active_percentage ?? 100}% of total
                            </p>
                        </div>
                    </div>

                    {/* Scheduled */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Scheduled</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {scheduledCount}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                                {stats?.scheduled_percentage ?? 0}% of total
                            </p>
                        </div>
                    </div>

                    {/* Archived */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                <Archive className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Archived</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {archivedCount}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                                {stats?.archived_percentage ?? 0}% of total
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter and Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    {/* Left: Search & Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search announcements..."
                                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                        </div>

                        {/* All Categories Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                <option value="General">General</option>
                                <option value="Requirement">Requirement</option>
                                <option value="Enrollment">Enrollment</option>
                                <option value="Event">Event</option>
                                <option value="Academic">Academic</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>

                        {/* All Priorities Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                className="appearance-none bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                            >
                                <option value="all">All Priorities</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>

                        {/* All Statuses Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="appearance-none bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                    </div>

                    {/* Right: + New Announcement Button */}
                    <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        New Announcement
                    </button>
                </div>

                {/* Announcements Table Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40">
                                <tr>
                                    <th className="py-3.5 px-5 font-bold">TITLE</th>
                                    <th className="py-3.5 px-4 font-bold">CATEGORY</th>
                                    <th className="py-3.5 px-4 font-bold">PRIORITY</th>
                                    <th className="py-3.5 px-4 font-bold">STATUS</th>
                                    <th className="py-3.5 px-4 font-bold">AUDIENCE</th>
                                    <th className="py-3.5 px-4 font-bold">
                                        <div className="flex items-center gap-1">
                                            <span>PUBLISH DATE</span>
                                            <ChevronDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 font-bold">AUTHOR</th>
                                    <th className="py-3.5 px-4 font-bold text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                                {filteredList.map((announcement, idx) => {
                                    const audience = getAudience(announcement, idx);
                                    const publish = formatPublishDate(announcement.publish_at, idx);

                                    return (
                                        <tr 
                                            key={announcement.id || idx} 
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                                        >
                                            {/* TITLE & SNIPPET */}
                                            <td className="py-4 px-5 max-w-sm">
                                                <div className="flex items-center gap-3">
                                                    {getIconByRow(idx, announcement.category)}
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                                                            {announcement.title}
                                                        </h3>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 max-w-xs">
                                                            {announcement.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* CATEGORY */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {getCategoryBadge(announcement.category)}
                                            </td>

                                            {/* PRIORITY */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {getPriorityBadge(announcement.priority)}
                                            </td>

                                            {/* STATUS */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {getStatusBadge(announcement.status)}
                                            </td>

                                            {/* AUDIENCE */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {audience.title}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {audience.subtitle}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* PUBLISH DATE */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {publish.date}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {publish.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* AUTHOR */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                        SA
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {announcement.author?.name || 'System Admin'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            Admin
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="py-4 px-4 text-right whitespace-nowrap">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button 
                                                            type="button"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                            <span className="sr-only">Actions</span>
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                        <DropdownMenuItem 
                                                            onClick={() => {
                                                                setSelectedAnnouncement(announcement);
                                                                setIsViewOpen(true);
                                                            }}
                                                            className="cursor-pointer text-xs"
                                                        >
                                                            <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className="cursor-pointer text-xs">
                                                            <Link href={`/announcements/${announcement.id}/edit`}>
                                                                <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-red-600 focus:text-red-600 cursor-pointer text-xs" 
                                                            onClick={() => setDeletingAnnouncement(announcement)}
                                                        >
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredList.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400">
                                            <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                            <p className="text-sm font-semibold">No announcements found.</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search keywords.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bottom Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                            Showing 1 to {filteredList.length} of {totalAnnouncements} announcements
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={true}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 disabled:opacity-40 cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold flex items-center justify-center shadow-xs"
                            >
                                1
                            </button>
                            <button
                                type="button"
                                disabled={true}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 disabled:opacity-40 cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Announcement Modal */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="sm:max-w-[650px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">New Announcement</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4 mt-2">
                        <div className="grid gap-1.5">
                            <label htmlFor="title" className="text-xs font-bold text-slate-700 dark:text-slate-300">Title *</label>
                            <input 
                                id="title" 
                                type="text" 
                                value={data.title} 
                                onChange={e => setData('title', e.target.value)} 
                                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500" 
                                placeholder="Announcement headline"
                                required 
                            />
                            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                        </div>

                        <div className="grid gap-1.5">
                            <label htmlFor="message" className="text-xs font-bold text-slate-700 dark:text-slate-300">Message *</label>
                            <textarea 
                                id="message" 
                                value={data.message} 
                                onChange={e => setData('message', e.target.value)} 
                                rows={4} 
                                className="flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500" 
                                placeholder="Full announcement details..."
                                required 
                            />
                            {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="grid gap-1.5">
                                <label htmlFor="category" className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                                <select 
                                    id="category" 
                                    value={data.category} 
                                    onChange={e => setData('category', e.target.value)} 
                                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-3 py-2 text-xs font-medium cursor-pointer"
                                >
                                    <option value="General">General</option>
                                    <option value="Requirement">Requirement</option>
                                    <option value="Enrollment">Enrollment</option>
                                    <option value="Academic">Academic</option>
                                    <option value="Event">Event</option>
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <label htmlFor="priority" className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority</label>
                                <select 
                                    id="priority" 
                                    value={data.priority} 
                                    onChange={e => setData('priority', e.target.value)} 
                                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-3 py-2 text-xs font-medium cursor-pointer"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <label htmlFor="destination" className="text-xs font-bold text-slate-700 dark:text-slate-300">Audience</label>
                                <select 
                                    id="destination" 
                                    value={data.destination} 
                                    onChange={e => setData('destination', e.target.value)} 
                                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-3 py-2 text-xs font-medium cursor-pointer"
                                >
                                    <option value="public">All Students (College-wide)</option>
                                    <option value="office">Graduating / Faculty Group</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <label htmlFor="publish_at" className="text-xs font-bold text-slate-700 dark:text-slate-300">Publish Date & Time</label>
                                <input 
                                    id="publish_at" 
                                    type="datetime-local" 
                                    value={data.publish_at} 
                                    onChange={e => setData('publish_at', e.target.value)} 
                                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-3 py-2 text-xs font-medium"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                                <select 
                                    id="status" 
                                    value={data.status} 
                                    onChange={e => setData('status', e.target.value)} 
                                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-3 py-2 text-xs font-medium cursor-pointer"
                                >
                                    <option value="active">Active</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsCreating(false)} 
                                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={processing} 
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Publish Announcement'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Announcement Details Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[550px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-amber-500" />
                            Announcement Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAnnouncement && (
                        <div className="space-y-4 py-2 text-xs">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {selectedAnnouncement.title}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {getCategoryBadge(selectedAnnouncement.category)}
                                    {getPriorityBadge(selectedAnnouncement.priority)}
                                    {getStatusBadge(selectedAnnouncement.status)}
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
                                {selectedAnnouncement.message}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                                <div>
                                    <span className="font-semibold block text-slate-700 dark:text-slate-300">Audience:</span>
                                    <span>{selectedAnnouncement.destination === 'office' ? 'Graduating Students (Specific Group)' : 'All Students (College-wide)'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block text-slate-700 dark:text-slate-300">Author:</span>
                                    <span>{selectedAnnouncement.author?.name || 'System Admin'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Announcement Confirmation Modal */}
            <DeleteConfirmDialog
                open={!!deletingAnnouncement}
                onOpenChange={(open) => !open && setDeletingAnnouncement(null)}
                title="Delete Announcement"
                description="Are you sure you want to permanently delete this announcement? It will be removed from all audience feeds and dashboard carousels."
                itemName={deletingAnnouncement ? deletingAnnouncement.title : undefined}
                confirmLabel="Delete Announcement"
                isDeleting={isDeleting}
                onConfirm={() => {
                    if (!deletingAnnouncement) return;
                    setIsDeleting(true);
                    router.delete(`/announcements/${deletingAnnouncement.id}`, {
                        preserveScroll: true,
                        onFinish: () => {
                            setIsDeleting(false);
                            setDeletingAnnouncement(null);
                        },
                    });
                }}
            />
        </AppLayout>
    );
}
