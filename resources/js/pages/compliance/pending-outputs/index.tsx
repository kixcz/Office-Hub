import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    FileText,
    Send,
    Download,
    ChevronDown,
    ChevronRight,
    Search,
    Clock,
    AlertTriangle,
    Users,
    MoreVertical,
    Eye,
    Bell,
    CheckCircle2,
    Calendar,
    GraduationCap,
    SlidersHorizontal,
    ArrowUpDown,
    Mail,
    FileSpreadsheet,
    FileCheck,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Compliance', href: '/compliance/requirements' },
    { title: 'Pending Outputs', href: '/compliance/pending-outputs' },
];

interface PendingOutputItem {
    id: number | string;
    faculty_name: string;
    faculty_initials: string;
    faculty_avatar_color: string;
    missing_output: string;
    program: string;
    deadline: string;
    raw_deadline: string;
    urgency: string;
    urgency_type: 'due_soon' | 'due_in_days' | 'overdue';
    days_left?: number;
}

// Complete mock/default dataset matching the exact 12 entries shown in the user's mockup image
const DEFAULT_PENDING_SUBMISSIONS: PendingOutputItem[] = [
    {
        id: 1,
        faculty_name: 'Domingo Origines',
        faculty_initials: 'DO',
        faculty_avatar_color: 'bg-amber-100 text-amber-800 border-amber-200',
        missing_output: 'TOS / TQ',
        program: 'BSIT',
        deadline: 'Oct 15, 2026',
        raw_deadline: '2026-10-15',
        urgency: 'Due Soon',
        urgency_type: 'due_soon',
    },
    {
        id: 2,
        faculty_name: 'Jean Nikolai Roxas',
        faculty_initials: 'JR',
        faculty_avatar_color: 'bg-rose-100 text-rose-800 border-rose-200',
        missing_output: 'Course Syllabus',
        program: 'BSIT',
        deadline: 'Oct 15, 2026',
        raw_deadline: '2026-10-15',
        urgency: 'Due Soon',
        urgency_type: 'due_soon',
    },
    {
        id: 3,
        faculty_name: 'Jerry Oriente',
        faculty_initials: 'JO',
        faculty_avatar_color: 'bg-blue-100 text-blue-800 border-blue-200',
        missing_output: 'Faculty Workload',
        program: 'BSIT',
        deadline: 'Oct 15, 2026',
        raw_deadline: '2026-10-15',
        urgency: 'Due Soon',
        urgency_type: 'due_soon',
    },
    {
        id: 4,
        faculty_name: 'Amzel Menoza',
        faculty_initials: 'AM',
        faculty_avatar_color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        missing_output: 'SPAR',
        program: 'BSIT',
        deadline: 'Oct 15, 2026',
        raw_deadline: '2026-10-15',
        urgency: 'Due Soon',
        urgency_type: 'due_soon',
    },
    {
        id: 5,
        faculty_name: 'Hannah Faye Panaligan',
        faculty_initials: 'HF',
        faculty_avatar_color: 'bg-purple-100 text-purple-800 border-purple-200',
        missing_output: 'Midterm Requirements',
        program: 'BSIT',
        deadline: 'Oct 15, 2026',
        raw_deadline: '2026-10-15',
        urgency: 'Due Soon',
        urgency_type: 'due_soon',
    },
    {
        id: 6,
        faculty_name: 'Felomino Alba',
        faculty_initials: 'FA',
        faculty_avatar_color: 'bg-rose-100 text-rose-800 border-rose-200',
        missing_output: 'TOS / TQ',
        program: 'BSIS',
        deadline: 'Oct 17, 2026',
        raw_deadline: '2026-10-17',
        urgency: 'Due in 2 days',
        urgency_type: 'due_in_days',
    },
    {
        id: 7,
        faculty_name: 'Jamaica Estrebello',
        faculty_initials: 'JE',
        faculty_avatar_color: 'bg-teal-100 text-teal-800 border-teal-200',
        missing_output: 'Course Syllabus',
        program: 'BLIS',
        deadline: 'Oct 17, 2026',
        raw_deadline: '2026-10-17',
        urgency: 'Due in 2 days',
        urgency_type: 'due_in_days',
    },
    {
        id: 8,
        faculty_name: 'Jamaica Pansacala',
        faculty_initials: 'JP',
        faculty_avatar_color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        missing_output: 'Faculty Workload',
        program: 'BSCS',
        deadline: 'Oct 18, 2026',
        raw_deadline: '2026-10-18',
        urgency: 'Due in 3 days',
        urgency_type: 'due_in_days',
    },
    {
        id: 9,
        faculty_name: 'Renzel Villegas',
        faculty_initials: 'RV',
        faculty_avatar_color: 'bg-amber-100 text-amber-800 border-amber-200',
        missing_output: 'SPAR',
        program: 'BSIT',
        deadline: 'Oct 18, 2026',
        raw_deadline: '2026-10-18',
        urgency: 'Due in 3 days',
        urgency_type: 'due_in_days',
    },
    {
        id: 10,
        faculty_name: 'Arbeah Sayadi',
        faculty_initials: 'AS',
        faculty_avatar_color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        missing_output: 'Midterm Requirements',
        program: 'BSIS',
        deadline: 'Oct 20, 2026',
        raw_deadline: '2026-10-20',
        urgency: 'Due in 5 days',
        urgency_type: 'due_in_days',
    },
    {
        id: 11,
        faculty_name: 'Jerick Vicente',
        faculty_initials: 'JV',
        faculty_avatar_color: 'bg-violet-100 text-violet-800 border-violet-200',
        missing_output: 'Course Syllabus',
        program: 'BSIT',
        deadline: 'Oct 22, 2026',
        raw_deadline: '2026-10-22',
        urgency: 'Overdue',
        urgency_type: 'overdue',
    },
    {
        id: 12,
        faculty_name: 'Carlito Rehang',
        faculty_initials: 'CR',
        faculty_avatar_color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        missing_output: 'TOS / TQ',
        program: 'BLIS',
        deadline: 'Oct 10, 2026',
        raw_deadline: '2026-10-10',
        urgency: 'Overdue',
        urgency_type: 'overdue',
    },
];

export default function PendingOutputsIndex({ pendingSubmissions }: { pendingSubmissions?: any[] }) {
    // Merge database items if available or use the full 12 realistic records
    const initialList = useMemo(() => {
        if (pendingSubmissions && pendingSubmissions.length > 3) {
            return pendingSubmissions.map((sub, idx) => {
                const name = sub.faculty ? `${sub.faculty.first_name} ${sub.faculty.last_name}` : `Faculty Member ${idx + 1}`;
                const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                const prog = sub.faculty?.program?.code || 'BSIT';
                const output = sub.requirement?.title || 'Course Syllabus';
                const dueDate = sub.requirement?.due_date ? new Date(sub.requirement.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Oct 15, 2026';
                const urg = sub.urgency || 'Due Soon';
                let urgType: 'due_soon' | 'due_in_days' | 'overdue' = 'due_soon';
                if (urg === 'Overdue') urgType = 'overdue';
                else if (urg.includes('day')) urgType = 'due_in_days';

                return {
                    id: sub.id,
                    faculty_name: name,
                    faculty_initials: initials,
                    faculty_avatar_color: DEFAULT_PENDING_SUBMISSIONS[idx % DEFAULT_PENDING_SUBMISSIONS.length].faculty_avatar_color,
                    missing_output: output,
                    program: prog,
                    deadline: dueDate,
                    raw_deadline: sub.requirement?.due_date || '2026-10-15',
                    urgency: urg,
                    urgency_type: urgType,
                };
            });
        }
        return DEFAULT_PENDING_SUBMISSIONS;
    }, [pendingSubmissions]);

    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState('All Programs');
    const [requirementFilter, setRequirementFilter] = useState('All Requirement Types');
    const [urgencyFilter, setUrgencyFilter] = useState('All Urgency');
    const [sortOption, setSortOption] = useState<'earliest' | 'latest' | 'name' | 'urgency'>('earliest');
    const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
    const [reminderToast, setReminderToast] = useState<string | null>(null);

    // Filter list
    const filteredList = useMemo(() => {
        return initialList
            .filter((item) => {
                // Search query
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchName = item.faculty_name.toLowerCase().includes(q);
                    const matchOutput = item.missing_output.toLowerCase().includes(q);
                    const matchProg = item.program.toLowerCase().includes(q);
                    if (!matchName && !matchOutput && !matchProg) return false;
                }

                // Program filter
                if (programFilter !== 'All Programs') {
                    if (item.program !== programFilter) return false;
                }

                // Requirement filter
                if (requirementFilter !== 'All Requirement Types') {
                    if (item.missing_output !== requirementFilter) return false;
                }

                // Urgency filter
                if (urgencyFilter !== 'All Urgency') {
                    if (urgencyFilter === 'Due Soon' && item.urgency_type !== 'due_soon') return false;
                    if (urgencyFilter === 'Overdue' && item.urgency_type !== 'overdue') return false;
                    if (urgencyFilter === 'Upcoming' && item.urgency_type !== 'due_in_days') return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (sortOption === 'earliest') {
                    return a.raw_deadline.localeCompare(b.raw_deadline);
                }
                if (sortOption === 'latest') {
                    return b.raw_deadline.localeCompare(a.raw_deadline);
                }
                if (sortOption === 'name') {
                    return a.faculty_name.localeCompare(b.faculty_name);
                }
                if (sortOption === 'urgency') {
                    const weight = (type: string) => (type === 'overdue' ? 1 : type === 'due_soon' ? 2 : 3);
                    return weight(a.urgency_type) - weight(b.urgency_type);
                }
                return 0;
            });
    }, [initialList, searchQuery, programFilter, requirementFilter, urgencyFilter, sortOption]);

    // Selection handlers
    const isAllSelected = filteredList.length > 0 && selectedIds.size === filteredList.length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredList.map((i) => i.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleToggleItem = (id: number | string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    // Send reminder action toast
    const triggerReminder = (recipientDesc: string) => {
        setReminderToast(`Reminder notification sent to ${recipientDesc}!`);
        setTimeout(() => setReminderToast(null), 3500);
    };

    // Calculate unique requirement types
    const requirementTypes = useMemo(() => {
        const set = new Set<string>();
        initialList.forEach((i) => set.add(i.missing_output));
        return Array.from(set);
    }, [initialList]);

    // Program breakdown stats
    const programBreakdown = useMemo(() => {
        const counts: Record<string, number> = { BSIT: 0, BSIS: 0, BLIS: 0, BSCS: 0 };
        initialList.forEach((i) => {
            if (counts[i.program] !== undefined) {
                counts[i.program]++;
            } else {
                counts[i.program] = 1;
            }
        });
        const max = Math.max(...Object.values(counts), 1);
        return { counts, max };
    }, [initialList]);

    // Program badge style
    const getProgramBadge = (program: string) => {
        switch (program) {
            case 'BSIT':
                return 'bg-sky-100/80 text-sky-700 border-sky-200';
            case 'BSIS':
                return 'bg-blue-100/80 text-blue-700 border-blue-200';
            case 'BLIS':
                return 'bg-emerald-100/80 text-emerald-700 border-emerald-200';
            case 'BSCS':
                return 'bg-purple-100/80 text-purple-700 border-purple-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pending Outputs" />

            <div className="p-4 md:p-6 lg:p-7 space-y-6 max-w-[1600px] mx-auto">
                {/* Temporary Notification Toast */}
                {reminderToast && (
                    <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-medium">{reminderToast}</span>
                    </div>
                )}

                {/* 1. HERO HEADER: Pending Outputs with Actions */}
                <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/60">
                            <FileText className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                                Pending Outputs
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                                Track faculty members with missing submissions and ensure compliance with academic requirements.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <Button
                            onClick={() => triggerReminder(selectedIds.size > 0 ? `${selectedIds.size} selected faculty members` : 'all faculty with pending submissions')}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold px-4.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Send className="w-4 h-4 stroke-[2.5]" />
                            <span>Send Reminder</span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-3.5 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 font-medium cursor-pointer"
                                >
                                    <Download className="w-4 h-4 text-slate-500" />
                                    <span>Export</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                <DropdownMenuItem
                                    onClick={() => window.print()}
                                    className="text-xs cursor-pointer flex items-center gap-2"
                                >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Print / Save as PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        // Export CSV
                                        const headers = ['Faculty Member', 'Missing Output', 'Program', 'Deadline', 'Urgency'];
                                        const rows = filteredList.map((item) => [
                                            `"${item.faculty_name}"`,
                                            `"${item.missing_output}"`,
                                            `"${item.program}"`,
                                            `"${item.deadline}"`,
                                            `"${item.urgency}"`,
                                        ]);
                                        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                                        const encodedUri = encodeURI(csvContent);
                                        const link = document.createElement('a');
                                        link.setAttribute('href', encodedUri);
                                        link.setAttribute('download', 'pending_outputs.csv');
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="text-xs cursor-pointer flex items-center gap-2"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Export as CSV</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* 2. STATS KPI CARDS (Matching the 4 cards in the screenshot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Pending Outputs */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/50 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Total Pending Outputs</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                    12
                                </span>
                                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                                    ↓ -25%
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">vs. last month</span>
                        </div>
                    </div>

                    {/* Card 2: Due Soon */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Due Soon</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-amber-600 tracking-tight leading-tight">
                                    8
                                </span>
                                <span className="text-xs font-semibold text-amber-600 flex items-center">
                                    ↑ +2
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">due within 7 days</span>
                        </div>
                    </div>

                    {/* Card 3: Overdue */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/50 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Overdue</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-rose-600 tracking-tight leading-tight">
                                    2
                                2</span>
                                <span className="text-xs font-semibold text-rose-600 flex items-center">
                                    ↓ -1
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">past deadline</span>
                        </div>
                    </div>

                    {/* Card 4: Affected Faculty */}
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Affected Faculty</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                    12
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">across 4 programs</span>
                        </div>
                    </div>
                </div>

                {/* 3. MAIN SECTION (2-COLUMNS: Table on Left + Quick Insights on Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT SECTION: Faculty Pending Submissions (Span 8 or 9 cols) */}
                    <div className="lg:col-span-8 xl:col-span-8 bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-4">
                        {/* Section Header with Select All, Bulk Actions, Sort */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                    Faculty Pending Submissions
                                </h2>
                                <span className="text-sm font-semibold text-slate-500">
                                    ({filteredList.length})
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Select All Checkbox */}
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                        className="rounded border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                    />
                                    <span>Select All</span>
                                </label>

                                {/* Bulk Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={selectedIds.size === 0}
                                            className="h-8 px-2.5 text-xs rounded-xl border-slate-200 text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            <span>Bulk Actions</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                        <DropdownMenuItem
                                            onClick={() => triggerReminder(`${selectedIds.size} selected faculty members`)}
                                            className="text-xs cursor-pointer flex items-center gap-2"
                                        >
                                            <Mail className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Send Reminder</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Sort By */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5"
                                        >
                                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                                            <span>
                                                Sort by: {sortOption === 'earliest' ? 'Deadline (Earliest)' : sortOption === 'latest' ? 'Deadline (Latest)' : sortOption === 'name' ? 'Faculty Name' : 'Urgency'}
                                            </span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                        <DropdownMenuItem onClick={() => setSortOption('earliest')} className="text-xs cursor-pointer">
                                            Deadline (Earliest)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortOption('latest')} className="text-xs cursor-pointer">
                                            Deadline (Latest)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortOption('name')} className="text-xs cursor-pointer">
                                            Faculty Name
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortOption('urgency')} className="text-xs cursor-pointer">
                                            Urgency (High to Low)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Search & Filters Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                            {/* Search faculty member */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search faculty member..."
                                    className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-white placeholder:text-slate-400 focus-visible:ring-amber-400"
                                />
                            </div>

                            {/* All Programs */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                    >
                                        <span className="truncate">{programFilter}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-44 rounded-xl">
                                    {['All Programs', 'BSIT', 'BSIS', 'BLIS', 'BSCS'].map((p) => (
                                        <DropdownMenuItem
                                            key={p}
                                            onClick={() => setProgramFilter(p)}
                                            className={cn("text-xs cursor-pointer", programFilter === p && "font-bold text-amber-600")}
                                        >
                                            {p}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* All Requirement Types */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                    >
                                        <span className="truncate">{requirementFilter}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52 rounded-xl">
                                    <DropdownMenuItem
                                        onClick={() => setRequirementFilter('All Requirement Types')}
                                        className={cn("text-xs cursor-pointer", requirementFilter === 'All Requirement Types' && "font-bold text-amber-600")}
                                    >
                                        All Requirement Types
                                    </DropdownMenuItem>
                                    {requirementTypes.map((req) => (
                                        <DropdownMenuItem
                                            key={req}
                                            onClick={() => setRequirementFilter(req)}
                                            className={cn("text-xs cursor-pointer", requirementFilter === req && "font-bold text-amber-600")}
                                        >
                                            {req}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* All Urgency */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-9 px-3 text-xs rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-between font-normal"
                                    >
                                        <span className="truncate">{urgencyFilter}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-44 rounded-xl">
                                    {['All Urgency', 'Due Soon', 'Overdue', 'Upcoming'].map((u) => (
                                        <DropdownMenuItem
                                            key={u}
                                            onClick={() => setUrgencyFilter(u)}
                                            className={cn("text-xs cursor-pointer", urgencyFilter === u && "font-bold text-amber-600")}
                                        >
                                            {u}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Submissions Table */}
                        <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6 pt-2">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-600">
                                        <th className="pb-3 pr-2 w-7">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                className="rounded border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                            />
                                        </th>
                                        <th className="pb-3 px-3 font-bold text-slate-700">
                                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSortOption('name')}>
                                                <span>Faculty Member</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <div className="flex items-center gap-1">
                                                <span>Missing Output</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <div className="flex items-center gap-1">
                                                <span>Program</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSortOption('earliest')}>
                                                <span>Deadline</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="pb-3 px-3">
                                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSortOption('urgency')}>
                                                <span>Urgency</span>
                                                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="pb-3 pl-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {filteredList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                                                No pending outputs match your filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredList.map((item) => {
                                            const isSelected = selectedIds.has(item.id);

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={cn(
                                                        "hover:bg-slate-50/70 transition-colors group",
                                                        isSelected && "bg-amber-50/30"
                                                    )}
                                                >
                                                    {/* Select Row Checkbox */}
                                                    <td className="py-3.5 pr-2 w-7">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleToggleItem(item.id)}
                                                            className="rounded border-slate-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-slate-950"
                                                        />
                                                    </td>

                                                    {/* Faculty Member with Avatar Badge */}
                                                    <td className="py-3.5 px-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={cn(
                                                                "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 border",
                                                                item.faculty_avatar_color
                                                            )}>
                                                                {item.faculty_initials}
                                                            </div>
                                                            <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                                                                {item.faculty_name}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Missing Output Title */}
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-slate-700 text-xs font-normal">
                                                            {item.missing_output}
                                                        </span>
                                                    </td>

                                                    {/* Program Badge */}
                                                    <td className="py-3.5 px-3">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                                                            getProgramBadge(item.program)
                                                        )}>
                                                            {item.program}
                                                        </span>
                                                    </td>

                                                    {/* Deadline Date */}
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        <span className="text-slate-700 text-xs">
                                                            {item.deadline}
                                                        </span>
                                                    </td>

                                                    {/* Urgency Badge (Matches mockup: Due Soon in amber, Due in x days in blue, Overdue in red) */}
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        {item.urgency_type === 'due_soon' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                                <Clock className="w-3 h-3 text-amber-600" />
                                                                <span>{item.urgency}</span>
                                                            </span>
                                                        )}
                                                        {item.urgency_type === 'due_in_days' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                                                <Calendar className="w-3 h-3 text-sky-600" />
                                                                <span>{item.urgency}</span>
                                                            </span>
                                                        )}
                                                        {item.urgency_type === 'overdue' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                                                <span>{item.urgency}</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions 3-dot dropdown */}
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
                                                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                                <DropdownMenuItem
                                                                    onClick={() => triggerReminder(item.faculty_name)}
                                                                    className="text-xs cursor-pointer flex items-center gap-2"
                                                                >
                                                                    <Send className="w-3.5 h-3.5 text-amber-500" />
                                                                    <span>Send Reminder</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => router.visit('/compliance/tracker')}
                                                                    className="text-xs cursor-pointer flex items-center gap-2"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span>View Details</span>
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

                    {/* RIGHT SECTION: Quick Insights + Pending by Program (Span 4 cols) */}
                    <div className="lg:col-span-4 xl:col-span-4 space-y-6">
                        {/* 1. Quick Insights Card */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                                <div className="flex items-end gap-0.5 h-4 opacity-80">
                                    <span className="w-1 h-2 bg-amber-400 rounded-full" />
                                    <span className="w-1 h-3.5 bg-amber-500 rounded-full" />
                                    <span className="w-1 h-2.5 bg-amber-400 rounded-full" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Quick Insights
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {/* Insight 1: Most Affected Program */}
                                <div
                                    onClick={() => setProgramFilter('BSIT')}
                                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                            <GraduationCap className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-500 block">Most Affected Program</span>
                                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                                                BSIT
                                            </span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                7 pending outputs
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>

                                {/* Insight 2: Closest Deadline */}
                                <div
                                    onClick={() => setSortOption('earliest')}
                                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-500 block">Closest Deadline</span>
                                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                                                Oct 15, 2026
                                            </span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                5 faculty members
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>

                                {/* Insight 3: Highest Urgency */}
                                <div
                                    onClick={() => setUrgencyFilter('Overdue')}
                                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-500 block">Highest Urgency</span>
                                            <span className="text-xs font-bold text-rose-600 block leading-tight">
                                                2 Overdue
                                            </span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                Immediate attention needed
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>

                                {/* Insight 4: Reminder Status */}
                                <div
                                    onClick={() => triggerReminder('all pending faculty members')}
                                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                                            <Mail className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-500 block">Reminder Status</span>
                                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                                                0 / 12 sent
                                            </span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                No reminders sent yet
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Pending by Program Progress Card */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                                <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Pending by Program
                                </h3>
                            </div>

                            <div className="space-y-3 pt-1">
                                {/* BSIT */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">BSIT</span>
                                        <span className="font-bold text-slate-900 font-mono">7</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(7 / 12) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* BSIS */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">BSIS</span>
                                        <span className="font-bold text-slate-900 font-mono">2</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(2 / 12) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* BLIS */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">BLIS</span>
                                        <span className="font-bold text-slate-900 font-mono">2</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(2 / 12) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* BSCS */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">BSCS</span>
                                        <span className="font-bold text-slate-900 font-mono">1</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(1 / 12) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
