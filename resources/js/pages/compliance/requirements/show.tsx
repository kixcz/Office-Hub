import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    Folder,
    GraduationCap,
    LayoutGrid,
    MoreVertical,
    PieChart,
    Printer,
    Search,
    TrendingUp,
    Users,
    X,
    AlertCircle,
    Edit,
    Send,
    UserCheck,
    FileUp,
    CalendarDays,
    SlidersHorizontal,
    Sparkles,
    Building2,
    FileCheck,
    CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SubmissionItem {
    id: number;
    index: number;
    faculty_id: number;
    faculty_name: string;
    faculty_email: string;
    avatar_url?: string | null;
    program_code: string;
    status: string; // 'Submitted On Time' | 'Submitted Late' | 'Pending' | 'Overdue' | 'Not Required'
    submission_state: string;
    submitted_at: string;
    due_date: string;
    days_early_late: string; // e.g. "2 days early", "3 days late"
    days_overdue: string;    // e.g. "8 days"
    files_count: number;
    reviewer_status?: string | null; // 'Verified' | 'For Review' | 'Revision Requested'
    remarks: string;
}

interface RequirementDetail {
    id: number;
    title: string;
    document_type: string;
    category: string;
    description: string | null;
    academic_year: string;
    semester: string;
    due_date: string;
    due_date_raw: string;
    countdown_label: string;
    status: string;
    health_indicator: string;
    reviewer_name: string;
    required_file_types: string;
    allow_multiple_files: boolean;
    naming_convention: string | null;
    grace_period_days: number;
}

interface ProgramItem {
    id: number;
    code: string;
    name: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    requirement: RequirementDetail;
    submissions: SubmissionItem[];
    pagination: Pagination;
    filters: {
        search: string;
        status: string;
        program: string;
        per_page: number;
    };
    kpis: {
        assigned: number;
        on_time: number;
        late: number;
        pending: number;
        overdue: number;
        compliance_rate: number;
    };
    programs: ProgramItem[];
}

export default function RequirementFolderShow({
    requirement,
    submissions = [],
    pagination,
    filters,
    kpis,
    programs = [],
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Compliance Management', href: '/compliance/requirements' },
        { title: 'Requirements', href: '/compliance/requirements' },
        { title: requirement.title, href: `/compliance/requirements/${requirement.id}` },
    ];

    // Sub-tabs matching screenshot:
    // Faculty Submissions | Reports & Analytics | Settings | Activity Log
    const [subTab, setSubTab] = useState<'submissions' | 'reports' | 'settings' | 'activity'>('submissions');

    // Filter states initialized from server-side filters
    const [searchFaculty, setSearchFaculty] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [programFilter, setProgramFilter] = useState(filters?.program || 'all');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Selection for bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Extend Deadline Modal
    const [isExtendOpen, setIsExtendOpen] = useState(false);
    const [newDueDate, setNewDueDate] = useState('');

    // Reminder Confirm Modal
    const [isReminderOpen, setIsReminderOpen] = useState(false);

    const applyFilters = (newParams: Partial<typeof filters>) => {
        router.get(
            `/compliance/requirements/${requirement.id}`,
            {
                search: newParams.search !== undefined ? newParams.search : searchFaculty,
                status: newParams.status !== undefined ? newParams.status : statusFilter,
                program: newParams.program !== undefined ? newParams.program : programFilter,
                per_page: newParams.per_page !== undefined ? newParams.per_page : perPage,
                page: 1,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            applyFilters({ search: searchFaculty });
        }
    };

    const changePage = (pageNumber: number) => {
        if (pageNumber < 1 || (pagination && pageNumber > pagination.last_page)) return;
        router.get(
            `/compliance/requirements/${requirement.id}`,
            {
                search: searchFaculty,
                status: statusFilter,
                program: programFilter,
                per_page: perPage,
                page: pageNumber,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(submissions.map((s) => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleExtendDeadline = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/compliance/requirements/${requirement.id}/extend-deadline`,
            { new_due_date: newDueDate },
            {
                onSuccess: () => setIsExtendOpen(false),
            }
        );
    };

    const handleSendReminder = () => {
        router.post(
            `/compliance/requirements/${requirement.id}/remind`,
            {},
            {
                onSuccess: () => setIsReminderOpen(false),
            }
        );
    };

    const handleCloseRequirement = () => {
        if (confirm('Are you sure you want to close this requirement folder for further submissions?')) {
            router.post(`/compliance/requirements/${requirement.id}/close`);
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedIds.length === 0) {
            alert('Please select at least one faculty member.');
            return;
        }

        router.post(`/compliance/requirements/${requirement.id}/bulk-action`, {
            action,
            submission_ids: selectedIds,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${requirement.title} - Requirement Folder`} />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-[#F9FAFB] dark:bg-zinc-950 min-h-screen">
                {/* Back Link Breadcrumb Line */}
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                    <Link
                        href="/compliance/requirements"
                        className="hover:text-amber-600 flex items-center gap-1 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Compliance Management</span>
                    </Link>
                    <span>&rsaquo;</span>
                    <Link href="/compliance/requirements" className="hover:text-amber-600 transition-colors">
                        Requirements
                    </Link>
                    <span>&rsaquo;</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">{requirement.title}</span>
                </div>

                {/* Header Banner matching bottom-right screenshot */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Title & Category Left */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                                <Folder className="w-7 h-7 fill-amber-500 text-amber-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                                        {requirement.title}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                                        {requirement.status}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                                    {requirement.category}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons Right Header */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => alert('Assigning additional faculty to this requirement...')}
                            >
                                <Users className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Assign Faculty
                            </Button>
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => setIsExtendOpen(true)}
                            >
                                <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Extend Deadline
                            </Button>
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => setIsReminderOpen(true)}
                            >
                                <Send className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Send Reminder
                            </Button>
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => window.print()}
                            >
                                <FileText className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Generate Report
                            </Button>
                            <Button
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-2 rounded-xl"
                                onClick={handleCloseRequirement}
                            >
                                <X className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                                Close Requirement
                            </Button>
                        </div>
                    </div>

                    {/* KPI Metric Strip below header */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                        {/* Due Date & relative countdown */}
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                Due Date
                            </span>
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">
                                {requirement.due_date}
                            </span>
                            <span className="text-[10px] font-bold text-rose-500">
                                {requirement.countdown_label || '(4 days left)'}
                            </span>
                        </div>

                        {/* Circular Compliance Rate */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-zinc-100 dark:text-zinc-800"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-emerald-500"
                                        strokeDasharray={`${kpis?.compliance_rate || 76}, 100`}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute text-[10px] font-black text-zinc-900 dark:text-zinc-100">
                                    {kpis?.compliance_rate || 76}%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400">Reqts</p>
                                <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">Compliance</p>
                            </div>
                        </div>

                        {/* Assigned */}
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                                {kpis?.assigned || 24}
                            </span>
                            <span className="text-[11px] font-bold text-zinc-400">Assigned</span>
                        </div>

                        {/* On Time */}
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                {kpis?.on_time || 18}
                            </span>
                            <span className="text-[11px] font-bold text-zinc-400">On Time</span>
                        </div>

                        {/* Late */}
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                                {kpis?.late || 2}
                            </span>
                            <span className="text-[11px] font-bold text-zinc-400">Late</span>
                        </div>

                        {/* Overdue */}
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                                {kpis?.overdue || 4}
                            </span>
                            <span className="text-[11px] font-bold text-zinc-400">Overdue</span>
                        </div>
                    </div>
                </div>

                {/* Sub-tab Selection */}
                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                    <button
                        onClick={() => setSubTab('submissions')}
                        className={cn(
                            'px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all',
                            subTab === 'submissions'
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                        )}
                    >
                        Faculty Submissions
                    </button>
                    <button
                        onClick={() => setSubTab('reports')}
                        className={cn(
                            'px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all',
                            subTab === 'reports'
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                        )}
                    >
                        Reports & Analytics
                    </button>
                    <button
                        onClick={() => setSubTab('settings')}
                        className={cn(
                            'px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all',
                            subTab === 'settings'
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                        )}
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => setSubTab('activity')}
                        className={cn(
                            'px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all',
                            subTab === 'activity'
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                        )}
                    >
                        Activity Log
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* SUB-TAB 1: FACULTY SUBMISSIONS TABLE */}
                {/* ========================================================================= */}
                {subTab === 'submissions' && (
                    <div className="flex flex-col gap-4">
                        {/* Table Controls Row */}
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                <div className="relative w-64">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Search faculty and press Enter..."
                                        value={searchFaculty}
                                        onChange={(e) => setSearchFaculty(e.target.value)}
                                        onKeyDown={handleSearchKeyDown}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        applyFilters({ status: e.target.value });
                                    }}
                                    className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="on_time">Submitted On Time</option>
                                    <option value="late">Submitted Late</option>
                                    <option value="pending">Pending</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="not_required">Not Required</option>
                                </select>

                                <select
                                    value={programFilter}
                                    onChange={(e) => {
                                        setProgramFilter(e.target.value);
                                        applyFilters({ program: e.target.value });
                                    }}
                                    className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                                >
                                    <option value="all">All Programs</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.code}>
                                            {p.code}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleBulkAction('verify')}
                                    className="border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-xl h-8 text-zinc-700"
                                >
                                    Bulk Actions
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => alert('Exporting records to Excel/PDF...')}
                                    className="border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-xl h-8 text-zinc-700"
                                >
                                    <Download className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Submissions Table with exact columns from screenshot */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                            <th className="py-3 px-3 w-8 text-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={
                                                        selectedIds.length > 0 &&
                                                        selectedIds.length === submissions.length
                                                    }
                                                    className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500/20"
                                                />
                                            </th>
                                            <th className="py-3 px-3 w-8 text-center">#</th>
                                            <th className="py-3 px-4 min-w-[170px]">Faculty</th>
                                            <th className="py-3 px-3 w-16">Program</th>
                                            <th className="py-3 px-4 min-w-[140px]">Status</th>
                                            <th className="py-3 px-4 min-w-[150px]">Submitted At</th>
                                            <th className="py-3 px-3 min-w-[110px]">Due Date</th>
                                            <th className="py-3 px-3 min-w-[110px]">Days Early/Late</th>
                                            <th className="py-3 px-3 min-w-[100px]">Days Overdue</th>
                                            <th className="py-3 px-3 text-center w-16">Files</th>
                                            <th className="py-3 px-4 min-w-[100px]">Reviewer</th>
                                            <th className="py-3 px-4 min-w-[110px]">Remarks</th>
                                            <th className="py-3 px-3 text-right w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                                        {submissions.map((sub) => {
                                            // Status pill styling
                                            let statusBadge =
                                                'bg-zinc-100 text-zinc-600 border border-zinc-200';
                                            if (sub.status === 'Submitted On Time') {
                                                statusBadge =
                                                    'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                            } else if (sub.status === 'Submitted Late') {
                                                statusBadge =
                                                    'bg-amber-50 text-amber-700 border border-amber-200';
                                            } else if (sub.status === 'Overdue') {
                                                statusBadge =
                                                    'bg-rose-50 text-rose-700 border border-rose-200';
                                            } else if (sub.status === 'Not Required') {
                                                statusBadge =
                                                    'bg-zinc-100 text-zinc-500 border border-transparent';
                                            }

                                            return (
                                                <tr
                                                    key={sub.id}
                                                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                                >
                                                    <td className="py-3.5 px-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(sub.id)}
                                                            onChange={() => handleToggleSelect(sub.id)}
                                                            className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500/20"
                                                        />
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-bold text-zinc-400">
                                                        {sub.index}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black text-[10px] flex items-center justify-center shrink-0">
                                                                {sub.faculty_name
                                                                    .split(' ')
                                                                    .map((n) => n[0])
                                                                    .slice(0, 2)
                                                                    .join('')}
                                                            </div>
                                                            <span className="text-xs font-bold">{sub.faculty_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 font-bold text-zinc-500 text-xs">
                                                        {sub.program_code}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black',
                                                                statusBadge
                                                            )}
                                                        >
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                                                        {sub.submitted_at}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-zinc-500 text-xs font-semibold">
                                                        {sub.due_date}
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span
                                                            className={cn(
                                                                'text-xs font-bold',
                                                                sub.days_early_late.includes('early')
                                                                    ? 'text-emerald-600'
                                                                    : sub.days_early_late.includes('late')
                                                                    ? 'text-amber-600'
                                                                    : 'text-zinc-400'
                                                            )}
                                                        >
                                                            {sub.days_early_late}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span
                                                            className={cn(
                                                                'text-xs font-bold',
                                                                sub.days_overdue !== '—'
                                                                    ? 'text-rose-600 font-black'
                                                                    : 'text-zinc-400'
                                                            )}
                                                        >
                                                            {sub.days_overdue}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        {sub.files_count > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-zinc-700 font-bold text-xs">
                                                                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                                                {sub.files_count}
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {sub.reviewer_status === 'Verified' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Verified
                                                            </span>
                                                        ) : sub.reviewer_status === 'For Review' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                                                For Review
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-zinc-500 text-xs italic">
                                                        {sub.remarks}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right">
                                                        <span className="text-zinc-300">—</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls Footer */}
                            {pagination && pagination.total > 0 && (
                                <div className="p-4 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/60 dark:bg-zinc-850">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold">
                                        <span>
                                            Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.from}</span> to{' '}
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.to}</span> of{' '}
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{pagination.total}</span> faculty submitters
                                        </span>
                                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] text-zinc-400">Rows per page:</span>
                                            <select
                                                value={pagination.per_page}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    setPerPage(val);
                                                    applyFilters({ per_page: val });
                                                }}
                                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.current_page <= 1}
                                            onClick={() => changePage(pagination.current_page - 1)}
                                            className="h-8 px-3 text-xs font-bold border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
                                        >
                                            Previous
                                        </Button>

                                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pg) => {
                                            // Only display relevant page buttons around current
                                            if (
                                                pg === 1 ||
                                                pg === pagination.last_page ||
                                                Math.abs(pg - pagination.current_page) <= 1
                                            ) {
                                                return (
                                                    <Button
                                                        key={pg}
                                                        variant={pg === pagination.current_page ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => changePage(pg)}
                                                        className={cn(
                                                            'h-8 w-8 p-0 text-xs font-bold',
                                                            pg === pagination.current_page
                                                                ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white border-transparent'
                                                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                        )}
                                                    >
                                                        {pg}
                                                    </Button>
                                                );
                                            } else if (Math.abs(pg - pagination.current_page) === 2) {
                                                return (
                                                    <span key={pg} className="px-1 text-zinc-400 text-xs">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.current_page >= pagination.last_page}
                                            onClick={() => changePage(pagination.current_page + 1)}
                                            className="h-8 px-3 text-xs font-bold border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 2: REPORTS & ANALYTICS INSIDE FOLDER */}
                {/* ========================================================================= */}
                {subTab === 'reports' && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
                            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
                                <div>
                                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                        Formal Compliance Report Summary
                                    </h2>
                                    <p className="text-xs text-zinc-500 font-medium">
                                        Exportable verification reports with academic signatories and audit breakdown.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => window.print()}
                                        className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs"
                                    >
                                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                                        Print PDF Report
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => alert('Exporting Excel report...')}
                                        className="border-zinc-200 text-xs font-bold rounded-xl"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                        Export Excel
                                    </Button>
                                </div>
                            </div>

                            {/* Report Header metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Academic Period</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">
                                        {requirement.academic_year} • {requirement.semester}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Requirement Name</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">{requirement.title}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Official Due Date</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">{requirement.due_date}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Generated By</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">
                                        {requirement.reviewer_name} (College Admin)
                                    </p>
                                </div>
                            </div>

                            {/* Summary Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                                    <h4 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-amber-500" />
                                        Folder Status Distribution
                                    </h4>
                                    <div className="flex flex-col gap-2 text-xs font-bold">
                                        <div className="flex justify-between">
                                            <span>On Time Submissions</span>
                                            <span className="text-emerald-600">{kpis.on_time}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Late Submissions</span>
                                            <span className="text-amber-600">{kpis.late}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pending</span>
                                            <span className="text-zinc-500">{kpis.pending}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Overdue</span>
                                            <span className="text-rose-600">{kpis.overdue}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                                            Overall Compliance Index
                                        </h4>
                                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                                            {kpis.compliance_rate}%
                                        </p>
                                        <p className="text-xs font-medium text-zinc-400 mt-1">
                                            {kpis.on_time + kpis.late} of {kpis.assigned} faculty completed compliance.
                                        </p>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden mt-4">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full"
                                            style={{ width: `${kpis.compliance_rate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Extend Deadline Modal */}
                <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
                    <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                Extend Deadline for {requirement.title}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Set a new submission deadline. Non-submitted faculty overdue counters will update automatically.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleExtendDeadline} className="flex flex-col gap-4 mt-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    New Due Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newDueDate}
                                    onChange={(e) => setNewDueDate(e.target.value)}
                                    required
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                />
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsExtendOpen(false)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl text-xs px-5"
                                >
                                    Apply Extension
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reminder Modal */}
                <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
                    <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                Send Compliance Reminder
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Notify all {kpis.pending + kpis.overdue} pending or overdue faculty members with upcoming deadline notices.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsReminderOpen(false)}
                                className="rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendReminder}
                                className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl text-xs px-5"
                            >
                                Broadcast Reminder
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
