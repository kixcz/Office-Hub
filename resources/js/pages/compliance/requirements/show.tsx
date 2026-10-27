import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
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
    ChevronRight,
    MessageSquare,
    RotateCcw,
    Ban,
    History,
    ShieldCheck,
    ExternalLink,
    Paperclip,
    AlertTriangle,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface SubmissionFileItem {
    id: number;
    name: string;
    size: string;
    version: number;
    uploaded_at: string;
    url: string;
}

interface AuditLogItem {
    id: number;
    actor_name: string;
    actor_role: string;
    action: string;
    title: string;
    description: string;
    created_at: string;
}

interface SubmissionItem {
    id: number;
    index: number;
    faculty_id: number;
    faculty_name: string;
    faculty_email: string;
    avatar_url?: string | null;
    program_code: string;
    status: string; // 'Submitted On Time' | 'Submitted Late' | 'Pending' | 'Overdue' | 'Returned for Revision' | 'Not Required'
    submission_state: string;
    submitted_at: string;
    due_date: string;
    days_early_late: string; // e.g. "2 days early", "3 days late"
    days_overdue: string;    // e.g. "8 days"
    files_count: number;
    reviewer_name?: string | null;
    reviewer_email?: string | null;
    reviewer_status?: string | null; // 'Verified' | 'For Revision' | 'For Review'
    remarks: string;
    faculty_remarks?: string;
    delivery_mode?: string;
    files?: SubmissionFileItem[];
    audit_logs?: AuditLogItem[];
    last_action?: {
        action: string;
        title: string;
        created_at: string;
    } | null;
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
    activityLogs: AuditLogItem[];
    reviewers: { id: number; name: string; email: string }[];
}

export default function RequirementFolderShow({
    requirement,
    submissions = [],
    pagination,
    filters,
    kpis,
    programs = [],
    activityLogs = [],
    reviewers = [],
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Compliance Management', href: '/compliance/requirements' },
        { title: 'Requirements', href: '/compliance/requirements' },
        { title: requirement.title, href: `/compliance/requirements/${requirement.id}` },
    ];

    // Sub-tabs: Faculty Submissions | Reports & Analytics | Settings | Activity Log
    const [subTab, setSubTab] = useState<'submissions' | 'reports' | 'settings' | 'activity'>('submissions');

    // Filter states
    const [searchFaculty, setSearchFaculty] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [programFilter, setProgramFilter] = useState(filters?.program || 'all');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Activity Log filters
    const [activitySearch, setActivitySearch] = useState('');
    const [activityActionFilter, setActivityActionFilter] = useState('all');

    // Selection for bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Extend Overall Folder Deadline Modal
    const [isExtendFolderOpen, setIsExtendFolderOpen] = useState(false);
    const [newFolderDueDate, setNewFolderDueDate] = useState('');

    // Reminder Broadcast Modal
    const [isReminderBroadcastOpen, setIsReminderBroadcastOpen] = useState(false);

    // =========================================================================
    // SUBMISSION REVIEW DRAWER STATE & MODALS
    // =========================================================================
    const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);
    const [drawerTab, setDrawerTab] = useState<'submission' | 'files' | 'reviews' | 'audit'>('submission');

    // Return for Revision Modal state
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [targetSubmissionForReturn, setTargetSubmissionForReturn] = useState<SubmissionItem | null>(null);
    const [returnRemarks, setReturnRemarks] = useState('');
    const [requestedCorrections, setRequestedCorrections] = useState('');
    const [revisedDeadline, setRevisedDeadline] = useState('');
    const [notifyFaculty, setNotifyFaculty] = useState(true);

    // Add Review Remarks Modal state
    const [remarkModalOpen, setRemarkModalOpen] = useState(false);
    const [targetSubmissionForRemark, setTargetSubmissionForRemark] = useState<SubmissionItem | null>(null);
    const [newRemarkText, setNewRemarkText] = useState('');

    // Individual Extend Deadline Modal state
    const [individualExtendOpen, setIndividualExtendOpen] = useState(false);
    const [targetSubmissionForExtend, setTargetSubmissionForExtend] = useState<SubmissionItem | null>(null);
    const [individualDueDate, setIndividualDueDate] = useState('');
    const [individualExtendReason, setIndividualExtendReason] = useState('');

    // Filter navigation
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

    // Review Actions
    const handleVerify = (sub: SubmissionItem) => {
        if (confirm(`Approve and verify requirement submission for ${sub.faculty_name}?`)) {
            router.post(
                `/compliance/requirements/${requirement.id}/submissions/${sub.id}/verify`,
                { remarks: 'Approved and verified.' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (activeSubmission?.id === sub.id) {
                            setActiveSubmission((prev) =>
                                prev ? { ...prev, reviewer_status: 'Verified', status: 'Submitted On Time' } : null
                            );
                        }
                    },
                }
            );
        }
    };

    const openReturnModal = (sub: SubmissionItem) => {
        setTargetSubmissionForReturn(sub);
        setReturnRemarks('');
        setRequestedCorrections('');
        setRevisedDeadline('');
        setNotifyFaculty(true);
        setReturnModalOpen(true);
    };

    const submitReturnForRevision = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetSubmissionForReturn) return;

        router.post(
            `/compliance/requirements/${requirement.id}/submissions/${targetSubmissionForReturn.id}/return`,
            {
                remarks: returnRemarks,
                requested_corrections: requestedCorrections,
                revised_due_date: revisedDeadline,
                notify_faculty: notifyFaculty,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReturnModalOpen(false);
                    if (activeSubmission?.id === targetSubmissionForReturn.id) {
                        setActiveSubmission((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      reviewer_status: 'For Revision',
                                      status: 'Returned for Revision',
                                      remarks: returnRemarks,
                                  }
                                : null
                        );
                    }
                },
            }
        );
    };

    const openRemarkModal = (sub: SubmissionItem) => {
        setTargetSubmissionForRemark(sub);
        setNewRemarkText(sub.remarks && sub.remarks !== '—' ? sub.remarks : '');
        setRemarkModalOpen(true);
    };

    const submitRemark = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetSubmissionForRemark) return;

        router.post(
            `/compliance/requirements/${requirement.id}/submissions/${targetSubmissionForRemark.id}/remark`,
            { remarks: newRemarkText },
            {
                preserveScroll: true,
                onSuccess: () => setRemarkModalOpen(false),
            }
        );
    };

    const openIndividualExtendModal = (sub: SubmissionItem) => {
        setTargetSubmissionForExtend(sub);
        setIndividualDueDate('');
        setIndividualExtendReason('');
        setIndividualExtendOpen(true);
    };

    const submitIndividualExtend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetSubmissionForExtend) return;

        router.post(
            `/compliance/requirements/${requirement.id}/submissions/${targetSubmissionForExtend.id}/extend`,
            {
                revised_due_date: individualDueDate,
                reason: individualExtendReason,
            },
            {
                preserveScroll: true,
                onSuccess: () => setIndividualExtendOpen(false),
            }
        );
    };

    const handleSendIndividualReminder = (sub: SubmissionItem) => {
        router.post(
            `/compliance/requirements/${requirement.id}/submissions/${sub.id}/remind`,
            {},
            { preserveScroll: true }
        );
    };

    const handleMarkNotRequired = (sub: SubmissionItem) => {
        const reason = prompt('Specify exemption reason (e.g., On Study Leave, Maternity Leave):', 'On Authorized Leave');
        if (reason) {
            router.post(
                `/compliance/requirements/${requirement.id}/submissions/${sub.id}/mark-not-required`,
                { reason },
                { preserveScroll: true }
            );
        }
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

                {/* Header Banner matching user reference screenshot */}
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
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    {requirement.description || 'Submission of approved compliance outputs for all faculty members.'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons Right Header */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => alert('Faculty assignments can be updated in Settings tab.')}
                            >
                                <Users className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Assign Faculty
                            </Button>
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => setIsExtendFolderOpen(true)}
                            >
                                <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Extend Deadline
                            </Button>
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => setIsReminderBroadcastOpen(true)}
                            >
                                <Send className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Send Reminder
                            </Button>
                            <Button
                                variant="outline"
                                className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300"
                                onClick={() => setSubTab('reports')}
                            >
                                <FileText className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                Generate Report
                            </Button>
                            <Button
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-2 rounded-xl"
                                onClick={() => {
                                    if (confirm('Close this requirement folder for further submissions?')) {
                                        router.post(`/compliance/requirements/${requirement.id}/close`);
                                    }
                                }}
                            >
                                <X className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                                Close Requirement
                            </Button>
                        </div>
                    </div>

                    {/* Metadata & Metric Strip matching screenshot */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                        {/* 1. Academic Period */}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <CalendarDays className="w-3 h-3 text-zinc-400" /> Academic Period
                            </span>
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                                {requirement.academic_year} • {requirement.semester}
                            </span>
                        </div>

                        {/* 2. Category */}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <Folder className="w-3 h-3 text-zinc-400" /> Category
                            </span>
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                                {requirement.category}
                            </span>
                        </div>

                        {/* 3. Due Date */}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-400" /> Due Date
                            </span>
                            <span className="text-xs font-black text-rose-600 dark:text-rose-400 mt-1">
                                {requirement.due_date}
                            </span>
                            <span className="text-[10px] font-bold text-rose-500">
                                {requirement.countdown_label || '(4 days left)'}
                            </span>
                        </div>

                        {/* 4. Grace Period */}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-zinc-400" /> Grace Period
                            </span>
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                                {requirement.grace_period_days} days
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400">
                                Until Sep 04, 2026
                            </span>
                        </div>

                        {/* 5. Assigned Faculty */}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3 text-zinc-400" /> Assigned Faculty
                            </span>
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                                {kpis.assigned} Assigned
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400">
                                BSIT, BSIS, BLIS
                            </span>
                        </div>

                        {/* 6. Compliance Rate Gauge */}
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
                                        strokeDasharray={`${kpis.compliance_rate || 76}, 100`}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute text-[10px] font-black text-zinc-900 dark:text-zinc-100">
                                    {kpis.compliance_rate || 76}%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400">Compliance Rate</p>
                                <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                                    {kpis.on_time + kpis.late} of {kpis.assigned} submitted
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-tab Navigation */}
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
                                    onClick={() => alert('Batch verification applied to selected submitters.')}
                                    className="border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-xl h-8 text-zinc-700 dark:text-zinc-300"
                                >
                                    Bulk Actions
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => alert('Exporting roster records...')}
                                    className="border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-xl h-8 text-zinc-700 dark:text-zinc-300"
                                >
                                    <Download className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                                    Export
                                 </Button>
                            </div>
                        </div>

                        {/* Table with Vertical Ellipsis Actions column matching user reference image */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                            <th className="py-3 px-3 w-8 text-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={selectedIds.length > 0 && selectedIds.length === submissions.length}
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
                                            <th className="py-3 px-4 min-w-[140px]">Reviewer</th>
                                            <th className="py-3 px-4 min-w-[120px]">Remarks</th>
                                            <th className="py-3 px-4 min-w-[130px]">Last Action</th>
                                            <th className="py-3 px-3 text-center w-12">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                                        {submissions.map((sub) => {
                                            // Status pill styling
                                            let statusBadge =
                                                'bg-zinc-100 text-zinc-600 border border-zinc-200';
                                            let StatusIcon = Clock;
                                            if (sub.status === 'Submitted On Time') {
                                                statusBadge =
                                                    'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                                StatusIcon = CheckCircle2;
                                            } else if (sub.status === 'Submitted Late') {
                                                statusBadge =
                                                    'bg-amber-50 text-amber-700 border border-amber-200';
                                                StatusIcon = Clock;
                                            } else if (sub.status === 'Overdue') {
                                                statusBadge =
                                                    'bg-rose-50 text-rose-700 border border-rose-200';
                                                StatusIcon = AlertCircle;
                                            } else if (sub.status === 'Returned for Revision') {
                                                statusBadge =
                                                    'bg-amber-100 text-amber-800 border border-amber-300';
                                                StatusIcon = RotateCcw;
                                            } else if (sub.status === 'Not Required') {
                                                statusBadge =
                                                    'bg-zinc-100 text-zinc-500 border border-zinc-200';
                                                StatusIcon = Ban;
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

                                                    {/* Faculty Name (Clickable to open Drawer) */}
                                                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveSubmission(sub);
                                                                setDrawerTab('submission');
                                                            }}
                                                            className="flex items-center gap-2.5 text-left group hover:opacity-90 transition-opacity"
                                                        >
                                                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black text-[10px] flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-amber-400/50 transition-all">
                                                                {sub.faculty_name
                                                                    .split(' ')
                                                                    .map((n) => n[0])
                                                                    .slice(0, 2)
                                                                    .join('')}
                                                            </div>
                                                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:underline transition-colors">
                                                                {sub.faculty_name}
                                                            </span>
                                                        </button>
                                                    </td>

                                                    <td className="py-3.5 px-3 font-bold text-zinc-500 text-xs">
                                                        {sub.program_code}
                                                    </td>

                                                    {/* Status badge with icon */}
                                                    <td className="py-3.5 px-4">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs',
                                                                statusBadge
                                                            )}
                                                        >
                                                            <StatusIcon className="w-3 h-3 shrink-0" />
                                                            {sub.status}
                                                        </span>
                                                    </td>

                                                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                                                        {sub.submitted_at}
                                                    </td>

                                                    <td className="py-3.5 px-3 text-zinc-500 text-xs font-semibold">
                                                        {sub.due_date}
                                                    </td>

                                                    {/* Days Early/Late */}
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

                                                    {/* Days Overdue */}
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

                                                    {/* Files */}
                                                    <td className="py-3.5 px-3 text-center">
                                                        {sub.files_count > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-bold text-xs">
                                                                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                                                {sub.files_count}
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-300">—</span>
                                                        )}
                                                    </td>

                                                    {/* Reviewer */}
                                                    <td className="py-3.5 px-4">
                                                        {sub.reviewer_name ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                                                    {sub.reviewer_name
                                                                        .split(' ')
                                                                        .map((n) => n[0])
                                                                        .slice(0, 2)
                                                                        .join('')}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-semibold leading-tight text-zinc-800 dark:text-zinc-200">
                                                                        {sub.reviewer_name}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            'text-[9px] font-bold',
                                                                            sub.reviewer_status === 'Verified'
                                                                                ? 'text-emerald-600'
                                                                                : sub.reviewer_status === 'For Revision'
                                                                                ? 'text-amber-600'
                                                                                : 'text-zinc-500'
                                                                        )}
                                                                    >
                                                                        {sub.reviewer_status || 'Verified'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-zinc-400 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Remarks */}
                                                    <td className="py-3.5 px-4 text-zinc-500 text-xs italic max-w-[140px] truncate">
                                                        {sub.remarks}
                                                    </td>

                                                    {/* Last Action (Review history timestamp) */}
                                                    <td className="py-3.5 px-4">
                                                        {sub.last_action ? (
                                                            <div className="flex items-start gap-1.5">
                                                                {sub.last_action.action === 'verified' && (
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                                                )}
                                                                {sub.last_action.action === 'returned' && (
                                                                    <RotateCcw className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                                                )}
                                                                {sub.last_action.action === 'reminder_sent' && (
                                                                    <Send className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                                                )}
                                                                {sub.last_action.action === 'not_required' && (
                                                                    <Ban className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className={cn(
                                                                        'text-xs font-bold leading-tight',
                                                                        sub.last_action.action === 'verified' ? 'text-emerald-700 dark:text-emerald-400' :
                                                                        sub.last_action.action === 'returned' ? 'text-amber-700 dark:text-amber-400' :
                                                                        'text-zinc-700 dark:text-zinc-300'
                                                                    )}>
                                                                        {sub.last_action.title}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-400 leading-tight">
                                                                        {sub.last_action.created_at}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-zinc-400 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Compact Vertical Ellipsis ⋮ Action Menu (No separate View button) */}
                                                    <td className="py-3.5 px-3 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 transition-colors">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="w-52 bg-white dark:bg-zinc-900 rounded-2xl p-1.5 shadow-xl border border-zinc-200/80 dark:border-zinc-800 text-xs"
                                                                >
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleVerify(sub)}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-emerald-600 hover:bg-emerald-50"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                        Verify & Approve
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={() => openReturnModal(sub)}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-amber-700 hover:bg-amber-50"
                                                                    >
                                                                        <RotateCcw className="w-4 h-4 text-amber-600" />
                                                                        Return for Revision
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={() => openRemarkModal(sub)}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-zinc-700"
                                                                    >
                                                                        <MessageSquare className="w-4 h-4 text-zinc-500" />
                                                                        Add Review Remarks
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={() => alert(`Downloading evidence files for ${sub.faculty_name}...`)}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-zinc-700"
                                                                    >
                                                                        <Download className="w-4 h-4 text-zinc-500" />
                                                                        Download Files
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={() => openIndividualExtendModal(sub)}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-zinc-700"
                                                                    >
                                                                        <Calendar className="w-4 h-4 text-zinc-500" />
                                                                        Extend Deadline
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={() => handleSendIndividualReminder(sub)}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-zinc-700"
                                                                    >
                                                                        <Send className="w-4 h-4 text-zinc-500" />
                                                                        Send Reminder
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuItem
                                                                        onClick={() => handleMarkNotRequired(sub)}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-rose-600 hover:bg-rose-50"
                                                                    >
                                                                        <Ban className="w-4 h-4 text-rose-500" />
                                                                        Mark as Not Required
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />

                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setActiveSubmission(sub);
                                                                            setDrawerTab('audit');
                                                                        }}
                                                                        className="flex items-center gap-2 py-2 px-2.5 font-bold cursor-pointer rounded-xl text-blue-600 hover:bg-blue-50"
                                                                    >
                                                                        <History className="w-4 h-4 text-blue-600" />
                                                                        View Audit Trail
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
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
                        {/* Compact KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Assigned Faculty</span>
                                <p className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{kpis.assigned}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Submitted On Time</span>
                                <p className="text-xl font-black text-emerald-600 mt-1">{kpis.on_time}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Submitted Late</span>
                                <p className="text-xl font-black text-amber-600 mt-1">{kpis.late}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Overdue Submissions</span>
                                <p className="text-xl font-black text-rose-600 mt-1">{kpis.overdue}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Verification Rate</span>
                                <p className="text-xl font-black text-blue-600 mt-1">{kpis.compliance_rate}%</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Average Delay</span>
                                <p className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">1.8 days</p>
                            </div>
                        </div>

                        {/* Formal Report Card with exports */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
                                <div>
                                    <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                        Compliance Matrix & Verification Report
                                    </h2>
                                    <p className="text-xs text-zinc-500 font-medium">
                                        Formal institutional summary formatted with official sign-off metadata.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => window.print()}
                                        className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs"
                                    >
                                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                                        Export PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => alert('Exporting Excel report spreadsheet...')}
                                        className="border-zinc-200 text-xs font-bold rounded-xl"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                        Export Excel
                                    </Button>
                                </div>
                            </div>

                            {/* Signatory and Header metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs mb-6">
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Academic Period</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">
                                        {requirement.academic_year} • {requirement.semester}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Requirement Container</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">{requirement.title}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Designated Reviewer</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">{requirement.reviewer_name}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-400 font-bold text-[10px] uppercase">Generated Timestamp</span>
                                    <p className="font-black text-zinc-800 dark:text-zinc-200">Oct 27, 2026 02:22 PM</p>
                                </div>
                            </div>

                            {/* Charts & Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                                    <h4 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-amber-500" />
                                        Status Distribution
                                    </h4>
                                    <div className="flex flex-col gap-2 text-xs font-bold">
                                        <div className="flex justify-between">
                                            <span>On Time</span>
                                            <span className="text-emerald-600">{kpis.on_time} ({Math.round((kpis.on_time / (kpis.assigned || 1)) * 100)}%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Late</span>
                                            <span className="text-amber-600">{kpis.late} ({Math.round((kpis.late / (kpis.assigned || 1)) * 100)}%)</span>
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

                                <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                                    <h4 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-indigo-500" />
                                        Compliance by Program
                                    </h4>
                                    <div className="flex flex-col gap-2.5 text-xs font-bold">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span>BSIT</span>
                                                <span className="text-emerald-600">88%</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full w-[88%]" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span>BSIS</span>
                                                <span className="text-amber-600">72%</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-amber-500 h-full w-[72%]" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span>BLIS</span>
                                                <span className="text-emerald-600">79%</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full w-[79%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                                            Overall Verification
                                        </h4>
                                        <p className="text-3xl font-black text-emerald-600 mt-2">
                                            {kpis.compliance_rate}%
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            Verified compliance index based on live institutional records.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 flex items-center justify-between">
                                        <span>Dean Sign-off</span>
                                        <span className="font-bold text-zinc-700">Dr. Eleanor Vance</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 3: SETTINGS TAB */}
                {/* ========================================================================= */}
                {subTab === 'settings' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 flex flex-col gap-6">
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                Requirement Folder Configuration
                            </h2>
                            <p className="text-xs text-zinc-500 font-medium">
                                Configure metadata, faculty eligibility, submission rules, reviewers, and reminders.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-4 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850">
                                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                                    Submission & File Rules
                                </h3>
                                <div className="flex flex-col gap-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Allowed File Types</span>
                                        <span className="font-bold">{requirement.required_file_types || 'pdf,docx,xlsx'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Multiple Files Allowed</span>
                                        <span className="font-bold">{requirement.allow_multiple_files ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Naming Convention</span>
                                        <span className="font-mono font-bold text-[11px] text-amber-700">
                                            {requirement.naming_convention || 'TOS_TQ_[Course]_[LastName]'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Grace Period</span>
                                        <span className="font-bold">{requirement.grace_period_days} Days</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850">
                                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-emerald-500" />
                                    Reviewer & Resubmission Policies
                                </h3>
                                <div className="flex flex-col gap-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Designated Reviewer</span>
                                        <span className="font-bold">{requirement.reviewer_name}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Resubmission Policy</span>
                                        <span className="font-bold">Allowed with Version Retention</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Automated Reminders</span>
                                        <span className="font-bold text-emerald-600">Active (3 days before due)</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-200/60">
                                        <span className="text-zinc-500">Folder Status</span>
                                        <span className="font-bold text-emerald-600">{requirement.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 4: ACTIVITY LOG AUDIT TRAIL */}
                {/* ========================================================================= */}
                {subTab === 'activity' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                    <History className="w-5 h-5 text-amber-500" />
                                    Compliance Audit Trail & Activity Log
                                </h2>
                                <p className="text-xs text-zinc-500 font-medium">
                                    Chronological, immutable audit timeline recording submissions, revisions, reviews, and deadline adjustments.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-60">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Search audit trail..."
                                        value={activitySearch}
                                        onChange={(e) => setActivitySearch(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none"
                                    />
                                </div>

                                <select
                                    value={activityActionFilter}
                                    onChange={(e) => setActivityActionFilter(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                                >
                                    <option value="all">All Events</option>
                                    <option value="submitted">Submissions</option>
                                    <option value="verified">Approvals</option>
                                    <option value="returned_for_revision">Returns</option>
                                    <option value="reminder_sent">Reminders</option>
                                </select>
                            </div>
                        </div>

                        {/* Audit Log Timeline */}
                        <div className="flex flex-col gap-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                            {activityLogs
                                .filter((item) => {
                                    const matchQ =
                                        !activitySearch.trim() ||
                                        item.actor_name.toLowerCase().includes(activitySearch.toLowerCase()) ||
                                        item.description.toLowerCase().includes(activitySearch.toLowerCase()) ||
                                        item.title.toLowerCase().includes(activitySearch.toLowerCase());
                                    const matchAct =
                                        activityActionFilter === 'all' || item.action === activityActionFilter;
                                    return matchQ && matchAct;
                                })
                                .map((log) => (
                                    <div key={log.id} className="relative flex items-start gap-4">
                                        <div
                                            className={cn(
                                                'w-3.5 h-3.5 rounded-full -ml-[23px] mt-1 shrink-0 ring-4 ring-white dark:ring-zinc-900',
                                                log.action === 'verified'
                                                    ? 'bg-emerald-500'
                                                    : log.action === 'returned_for_revision'
                                                    ? 'bg-amber-500'
                                                    : log.action === 'submitted'
                                                    ? 'bg-blue-500'
                                                    : 'bg-zinc-400'
                                            )}
                                        />
                                        <div className="bg-zinc-50 dark:bg-zinc-850 p-3.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                                    {log.title}
                                                </span>
                                                <span className="text-[11px] text-zinc-400">{log.created_at}</span>
                                            </div>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                                {log.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400 font-semibold">
                                                <span>By {log.actor_name}</span>
                                                <span>•</span>
                                                <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                                    {log.actor_role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* SUBMISSION REVIEW & AUDIT TRAIL SLIDE-OVER SHEET (DRAWER FROM RIGHT) */}
                {/* ========================================================================= */}
                <Sheet open={!!activeSubmission} onOpenChange={(open) => !open && setActiveSubmission(null)}>
                    <SheetContent
                        side="right"
                        className="w-full sm:max-w-3xl lg:max-w-4xl p-0 flex flex-col bg-[#fafafa] dark:bg-zinc-900 border-l border-zinc-200/80 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden sm:rounded-l-[28px]"
                    >
                        {activeSubmission && (
                            <div className="flex flex-col h-full bg-[#fbfbfb] dark:bg-zinc-900">
                                {/* Sheet Header with Faculty Profile Photo / Avatar */}
                                <div className="px-7 pt-6 pb-5 bg-white dark:bg-zinc-900 border-b border-zinc-200/70 dark:border-zinc-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3.5">
                                            {activeSubmission.avatar_url ? (
                                                <img
                                                    src={activeSubmission.avatar_url}
                                                    alt={activeSubmission.faculty_name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 dark:border-amber-600 shadow-xs"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-sm flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-700/50 shadow-xs">
                                                    {activeSubmission.faculty_name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .slice(0, 2)
                                                        .join('')}
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <SheetTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                                                        {activeSubmission.faculty_name}
                                                    </SheetTitle>
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-amber-100/80 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                        FACULTY
                                                    </span>
                                                </div>
                                                <SheetDescription className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                    {activeSubmission.program_code} • {activeSubmission.faculty_email}
                                                </SheetDescription>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sheet Scrollable Body */}
                                <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                                    {/* Top 4 KPI Cards Matching Reference Screenshot */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                        {/* Card 1: Status */}
                                        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-100/90 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Status</span>
                                                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 truncate block">
                                                    {activeSubmission.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card 2: Submission Date */}
                                        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Submission Date</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate block">
                                                    {activeSubmission.submitted_at !== '—' ? activeSubmission.submitted_at.split(' ')[0] + ' ' + activeSubmission.submitted_at.split(' ')[1] + ' ' + activeSubmission.submitted_at.split(' ')[2] : '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card 3: Timeliness */}
                                        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Timeliness</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn(
                                                        'w-1.5 h-1.5 rounded-full shrink-0',
                                                        activeSubmission.days_early_late.includes('late') || activeSubmission.days_overdue !== '—' ? 'bg-amber-500' : 'bg-emerald-500'
                                                    )} />
                                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                                        {activeSubmission.days_early_late.includes('early') ? 'On deadline' : (activeSubmission.days_early_late !== '—' ? activeSubmission.days_early_late : (activeSubmission.days_overdue !== '—' ? `${activeSubmission.days_overdue} overdue` : 'On deadline'))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 4: Reviewer */}
                                        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">Reviewer</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate block">
                                                    {activeSubmission.reviewer_name || 'Renzel Villegas'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main 3-Column Content Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                        {/* Left Column: Submission Info (4 cols) */}
                                        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs space-y-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-amber-600" />
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                    Submission Info
                                                </h4>
                                            </div>

                                            <div className="space-y-3.5 text-xs">
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-zinc-500 font-medium">Status</span>
                                                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                        {activeSubmission.status}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-zinc-500 font-medium">Submitted At</span>
                                                    <div className="text-right">
                                                        <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                                                            {activeSubmission.submitted_at !== '—' ? activeSubmission.submitted_at.split(' ').slice(0, 3).join(' ') : '—'}
                                                        </span>
                                                        {activeSubmission.submitted_at !== '—' && (
                                                            <span className="text-[10px] text-zinc-400 block">
                                                                {activeSubmission.submitted_at.split(' ').slice(3).join(' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-zinc-500 font-medium">Official Due Date</span>
                                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                                        {activeSubmission.due_date}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-zinc-500 font-medium">Days Early/Late</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {activeSubmission.days_early_late.includes('early') ? 'On deadline' : activeSubmission.days_early_late}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-zinc-500 font-medium">Days Overdue</span>
                                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                                        {activeSubmission.days_overdue}
                                                    </span>
                                                </div>

                                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                                    <span className="text-zinc-500 font-medium block mb-1">Faculty Remarks</span>
                                                    <p className="text-zinc-700 dark:text-zinc-300 italic font-medium">
                                                        "{activeSubmission.faculty_remarks || 'Initial submission.'}"
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                                    <span className="text-zinc-500 font-medium">Delivery Mode</span>
                                                    <span className="inline-flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                                                        <FileUp className="w-3.5 h-3.5 text-zinc-400" />
                                                        {activeSubmission.delivery_mode || 'Digital Upload'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Center Column: Review & Audit Trail (5 cols) */}
                                        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <History className="w-4 h-4 text-blue-600" />
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                        Review & Audit Trail
                                                    </h4>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                    {(activeSubmission.audit_logs?.length || 4)} entries
                                                </span>
                                            </div>

                                            {/* Vertical Timeline */}
                                            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                                                {(activeSubmission.audit_logs && activeSubmission.audit_logs.length > 0
                                                    ? activeSubmission.audit_logs
                                                    : [
                                                          {
                                                              id: 1,
                                                              actor_name: activeSubmission.faculty_name,
                                                              actor_role: 'Faculty',
                                                              action: 'submitted',
                                                              title: 'Submission Created',
                                                              description: 'Initial submission.',
                                                              created_at: activeSubmission.submitted_at !== '—' ? activeSubmission.submitted_at : 'Aug 28, 2026 09:12 AM',
                                                          },
                                                          {
                                                              id: 2,
                                                              actor_name: 'System Admin',
                                                              actor_role: 'Legacy CIDS Super Admin',
                                                              action: 'returned_for_revision',
                                                              title: 'Returned for Revision',
                                                              description: activeSubmission.remarks !== '—' ? activeSubmission.remarks : 'Please revise TQ details.',
                                                              created_at: 'Oct 27, 2026 07:31 AM',
                                                          },
                                                          {
                                                              id: 3,
                                                              actor_name: activeSubmission.faculty_name,
                                                              actor_role: 'Faculty',
                                                              action: 'resubmitted',
                                                              title: 'Resubmitted',
                                                              description: 'Updated documents as requested.',
                                                              created_at: 'Aug 29, 2026 10:15 AM',
                                                          },
                                                          {
                                                              id: 4,
                                                              actor_name: 'Renzel Villegas',
                                                              actor_role: 'Reviewer',
                                                              action: 'verified',
                                                              title: 'Verified & Approved',
                                                              description: 'Documents verified. Compliance completed.',
                                                              created_at: 'Aug 30, 2026 03:22 PM',
                                                          },
                                                      ]
                                                ).map((audit) => {
                                                    let dotBg = 'bg-blue-500';
                                                    if (audit.action === 'verified') dotBg = 'bg-emerald-500';
                                                    else if (audit.action === 'returned_for_revision' || audit.action === 'returned') dotBg = 'bg-amber-500';
                                                    else if (audit.action === 'submitted') dotBg = 'bg-zinc-400';

                                                    return (
                                                        <div key={audit.id} className="relative text-xs">
                                                            {/* Timeline Dot */}
                                                            <div className={cn(
                                                                'absolute -left-[20px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-850 shadow-xs',
                                                                dotBg
                                                            )} />

                                                            <div className="flex items-center justify-between gap-2">
                                                                <h5 className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                    {audit.title}
                                                                </h5>
                                                                <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                                                                    {audit.created_at}
                                                                </span>
                                                            </div>

                                                            <p className="text-[11px] text-zinc-500 mt-0.5">
                                                                by {audit.actor_name} ({audit.actor_role})
                                                            </p>

                                                            {audit.description && (
                                                                <div className="mt-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 italic">
                                                                    "{audit.description}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Right Column: Files, Reviewer Info, Latest Remarks, Quick Facts (3 cols) */}
                                        <div className="lg:col-span-3 space-y-4">
                                            {/* Files Card */}
                                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                                                        <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                            Files ({activeSubmission.files?.length || 1})
                                                        </h5>
                                                    </div>
                                                    <button
                                                        onClick={() => alert('Downloading all files...')}
                                                        className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                                                    >
                                                        <Download className="w-3 h-3" /> All
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                                            <FileText className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="min-w-0 text-xs">
                                                            <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate text-[11px]">
                                                                {`TOS_TQ_${activeSubmission.faculty_name.split(' ').pop()}_v1.pdf`}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-400">2.4 MB • Aug 30, 2026</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => alert('Downloading file...')}
                                                        className="p-1 hover:bg-zinc-200/60 rounded-md transition-colors text-zinc-400 hover:text-zinc-700"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Reviewer Info Card */}
                                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs space-y-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                                                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                        Reviewer Info
                                                    </h5>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                                                        RV
                                                    </div>
                                                    <div className="min-w-0 text-xs">
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                            {activeSubmission.reviewer_name || 'Renzel Villegas'}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-400">Reviewer</p>
                                                        <p className="text-[10px] text-zinc-400 truncate">
                                                            {activeSubmission.reviewer_email || 'renzel.villegas@dssc.edu.ph'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Latest Remarks Card */}
                                            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-xs space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                                        <span className="font-bold text-amber-900 dark:text-amber-300">Latest Remarks</span>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-400">Aug 29, 2026</span>
                                                </div>
                                                <p className="text-zinc-700 dark:text-zinc-300 italic text-[11px] leading-relaxed">
                                                    "{activeSubmission.remarks !== '—' ? activeSubmission.remarks : 'Updated documents as requested.'}"
                                                </p>
                                                <p className="text-[10px] text-zinc-400 font-medium">
                                                    — {activeSubmission.faculty_name} (Faculty)
                                                </p>
                                            </div>

                                            {/* Quick Facts Card */}
                                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs space-y-2 text-xs">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                                                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                        Quick Facts
                                                    </h5>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-400">Submission Type</span>
                                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Requirement</span>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-400">Academic Period</span>
                                                    <span className="font-bold text-zinc-700 dark:text-zinc-300 text-right">
                                                        {requirement.semester}, {requirement.academic_year}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-400">Last Updated</span>
                                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                                        {activeSubmission.submitted_at !== '—' ? activeSubmission.submitted_at.split(' ').slice(0, 3).join(' ') : 'Aug 30, 2026'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Drawer Footer Actions for Reviewer matching reference image */}
                                <div className="px-7 py-4 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openIndividualExtendModal(activeSubmission)}
                                        className="h-9 px-4 text-xs font-bold rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                                    >
                                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                        Extend Deadline
                                    </Button>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openReturnModal(activeSubmission)}
                                            className="h-9 px-5 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-bold rounded-xl"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                                            Return for Revision
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleVerify(activeSubmission)}
                                            className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                            Verify & Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>

                {/* ========================================================================= */}
                {/* RETURN FOR REVISION MODAL */}
                {/* ========================================================================= */}
                <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
                    <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-amber-700 flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-amber-600" />
                                Return Submission for Revision
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Send this document back to {targetSubmissionForReturn?.faculty_name}. The original uploaded file and submission timestamps will be preserved in the audit log.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitReturnForRevision} className="flex flex-col gap-4 mt-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Reason for Return / Reviewer Remarks *
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Please update Table of Specifications format and re-align page 3 test questions..."
                                    value={returnRemarks}
                                    onChange={(e) => setReturnRemarks(e.target.value)}
                                    required
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Specific Requested Corrections (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Items 15-20 need cognitive domain classification"
                                    value={requestedCorrections}
                                    onChange={(e) => setRequestedCorrections(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Revised Deadline for Resubmission
                                </label>
                                <input
                                    type="datetime-local"
                                    value={revisedDeadline}
                                    onChange={(e) => setRevisedDeadline(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="notifyFaculty"
                                    checked={notifyFaculty}
                                    onChange={(e) => setNotifyFaculty(e.target.checked)}
                                    className="rounded border-zinc-300 text-amber-500"
                                />
                                <label htmlFor="notifyFaculty" className="text-xs font-semibold text-zinc-600">
                                    Send immediate email and portal notification to faculty
                                </label>
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setReturnModalOpen(false)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs px-5"
                                >
                                    Confirm Return
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================================= */}
                {/* ADD REVIEW REMARKS MODAL */}
                {/* ========================================================================= */}
                <Dialog open={remarkModalOpen} onOpenChange={setRemarkModalOpen}>
                    <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-zinc-900">
                                Add Review Remarks
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Add notes for {targetSubmissionForRemark?.faculty_name} without altering approval state.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitRemark} className="flex flex-col gap-4 mt-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700">Remarks *</label>
                                <textarea
                                    rows={3}
                                    value={newRemarkText}
                                    onChange={(e) => setNewRemarkText(e.target.value)}
                                    required
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-medium focus:outline-none"
                                />
                            </div>

                            <DialogFooter className="mt-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRemarkModalOpen(false)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl text-xs px-5"
                                >
                                    Save Remarks
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================================= */}
                {/* INDIVIDUAL EXTEND DEADLINE MODAL */}
                {/* ========================================================================= */}
                <Dialog open={individualExtendOpen} onOpenChange={setIndividualExtendOpen}>
                    <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-zinc-900">
                                Extend Deadline for {targetSubmissionForExtend?.faculty_name}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Grant an authorized deadline extension specifically for this faculty member.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitIndividualExtend} className="flex flex-col gap-4 mt-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700">New Due Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={individualDueDate}
                                    onChange={(e) => setIndividualDueDate(e.target.value)}
                                    required
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700">Extension Reason</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Official university duty endorsement"
                                    value={individualExtendReason}
                                    onChange={(e) => setIndividualExtendReason(e.target.value)}
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                />
                            </div>

                            <DialogFooter className="mt-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIndividualExtendOpen(false)}
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

                {/* Overall Folder Extend Modal */}
                <Dialog open={isExtendFolderOpen} onOpenChange={setIsExtendFolderOpen}>
                    <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-zinc-900">
                                Extend Folder Deadline
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Updates the official submission deadline across all assigned faculty.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.post(
                                    `/compliance/requirements/${requirement.id}/extend-deadline`,
                                    { new_due_date: newFolderDueDate },
                                    { onSuccess: () => setIsExtendFolderOpen(false) }
                                );
                            }}
                            className="flex flex-col gap-4 mt-2"
                        >
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-700">New Due Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={newFolderDueDate}
                                    onChange={(e) => setNewFolderDueDate(e.target.value)}
                                    required
                                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                />
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsExtendFolderOpen(false)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl text-xs px-5"
                                >
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reminder Broadcast Modal */}
                <Dialog open={isReminderBroadcastOpen} onOpenChange={setIsReminderBroadcastOpen}>
                    <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-zinc-900">
                                Broadcast Compliance Reminder
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Notify all {kpis.pending + kpis.overdue} pending or overdue faculty submitters.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsReminderBroadcastOpen(false)}
                                className="rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    router.post(
                                        `/compliance/requirements/${requirement.id}/remind`,
                                        {},
                                        { onSuccess: () => setIsReminderBroadcastOpen(false) }
                                    );
                                }}
                                className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl text-xs px-5"
                            >
                                Broadcast
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
