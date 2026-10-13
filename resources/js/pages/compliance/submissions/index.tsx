import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    Clock,
    CheckCircle2,
    FileText,
    TrendingUp,
    Search,
    ChevronDown,
    ChevronRight,
    CheckSquare,
    Download,
    MoreHorizontal,
    Edit,
    RotateCcw,
    X,
    Check,
    GraduationCap,
    Users,
    AlertCircle,
    Calendar,
    Sparkles,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Compliance', href: '/compliance/tracker' },
    { title: 'Submission Records', href: '/compliance/submissions' },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    photo_url?: string;
    program?: Program;
}

interface Requirement {
    id: number;
    title: string;
    document_type: string;
    due_date: string;
    academic_year?: string;
    semester?: string;
    program?: Program;
}

interface Submission {
    id: number;
    requirement_id: number;
    faculty_id: number;
    status: string;
    submitted_at: string | null;
    reviewer_comments: string | null;
    file_path?: string | null;
    faculty?: Faculty;
    requirement?: Requirement;
}

interface KPIs {
    pending_outputs: number;
    completed_records: number;
    active_requirements: number;
    submission_rate: number;
}

interface Props {
    submissions: Submission[];
    pendingSubmissions: Submission[];
    requirements?: Requirement[];
    programs?: Program[];
    kpis?: KPIs;
}

const getLocalDatetimeString = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function SubmissionsIndex({
    submissions = [],
    pendingSubmissions = [],
    requirements = [],
    programs = [],
    kpis,
}: Props) {
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    // Selection state for pending submissions
    const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<number[]>([]);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [requirementFilter, setRequirementFilter] = useState<string>('all');
    const [programFilter, setProgramFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Batch Record Modal state
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [modalRequirementFilter, setModalRequirementFilter] = useState<string>('all');
    const [modalFacultySearch, setModalFacultySearch] = useState('');
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
    const [bulkFormData, setBulkFormData] = useState({
        submitted_at: getLocalDatetimeString(),
        status: 'approved',
        reviewer_comments: '',
    });

    // Single Edit Modal state
    const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [editFormData, setEditFormData] = useState({
        submitted_at: getLocalDatetimeString(),
        status: 'approved',
        reviewer_comments: '',
    });

    // Available programs list
    const availablePrograms = useMemo(() => {
        if (programs && programs.length > 0) return programs;
        const map = new Map<number, Program>();
        [...submissions, ...pendingSubmissions].forEach((sub) => {
            const p = sub.faculty?.program || sub.requirement?.program;
            if (p) map.set(p.id, p);
        });
        return Array.from(map.values());
    }, [programs, submissions, pendingSubmissions]);

    // Filter pending submissions
    const filteredPending = useMemo(() => {
        return pendingSubmissions.filter((sub) => {
            const facultyName = `${sub.faculty?.first_name || ''} ${sub.faculty?.last_name || ''}`.toLowerCase();
            const reqTitle = (sub.requirement?.title || '').toLowerCase();
            const searchLower = searchQuery.toLowerCase();

            const matchesSearch = !searchQuery || facultyName.includes(searchLower) || reqTitle.includes(searchLower);

            const matchesReq =
                requirementFilter === 'all' || String(sub.requirement_id) === requirementFilter;

            const subProgramId = sub.faculty?.program?.id || sub.requirement?.program?.id;
            const subProgramCode = sub.faculty?.program?.code || sub.requirement?.program?.code;
            const matchesProgram =
                programFilter === 'all' ||
                String(subProgramId) === programFilter ||
                (subProgramCode && subProgramCode.toLowerCase() === programFilter.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || sub.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesReq && matchesProgram && matchesStatus;
        });
    }, [pendingSubmissions, searchQuery, requirementFilter, programFilter, statusFilter]);

    // Filter completed submissions
    const filteredCompleted = useMemo(() => {
        return submissions.filter((sub) => {
            const facultyName = `${sub.faculty?.first_name || ''} ${sub.faculty?.last_name || ''}`.toLowerCase();
            const reqTitle = (sub.requirement?.title || '').toLowerCase();
            const searchLower = searchQuery.toLowerCase();

            const matchesSearch = !searchQuery || facultyName.includes(searchLower) || reqTitle.includes(searchLower);

            const matchesReq =
                requirementFilter === 'all' || String(sub.requirement_id) === requirementFilter;

            const subProgramId = sub.faculty?.program?.id || sub.requirement?.program?.id;
            const subProgramCode = sub.faculty?.program?.code || sub.requirement?.program?.code;
            const matchesProgram =
                programFilter === 'all' ||
                String(subProgramId) === programFilter ||
                (subProgramCode && subProgramCode.toLowerCase() === programFilter.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || sub.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesReq && matchesProgram && matchesStatus;
        });
    }, [submissions, searchQuery, requirementFilter, programFilter, statusFilter]);

    // Filter pending list inside the Batch modal
    const modalPendingList = useMemo(() => {
        return pendingSubmissions.filter((sub) => {
            const matchesReq =
                modalRequirementFilter === 'all' ||
                String(sub.requirement_id) === modalRequirementFilter;

            const facultyName = `${sub.faculty?.first_name || ''} ${sub.faculty?.last_name || ''}`.toLowerCase();
            const matchesSearch = !modalFacultySearch || facultyName.includes(modalFacultySearch.toLowerCase());

            return matchesReq && matchesSearch;
        });
    }, [pendingSubmissions, modalRequirementFilter, modalFacultySearch]);

    // Checkbox selection handlers
    const toggleSelectOne = (id: number) => {
        setSelectedSubmissionIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const isAllFilteredPendingSelected =
        filteredPending.length > 0 &&
        filteredPending.every((sub) => selectedSubmissionIds.includes(sub.id));

    const isSomeFilteredPendingSelected =
        filteredPending.some((sub) => selectedSubmissionIds.includes(sub.id)) &&
        !isAllFilteredPendingSelected;

    const toggleSelectAllFilteredPending = () => {
        const filteredIds = filteredPending.map((s) => s.id);
        if (isAllFilteredPendingSelected) {
            setSelectedSubmissionIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
        } else {
            setSelectedSubmissionIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const clearSelection = () => {
        setSelectedSubmissionIds([]);
    };

    // Open batch modal
    const openBatchModal = (initialReqId: string = 'all') => {
        setModalRequirementFilter(initialReqId);
        setModalFacultySearch('');
        setBulkFormData({
            submitted_at: getLocalDatetimeString(),
            status: 'approved',
            reviewer_comments: '',
        });
        setIsBatchModalOpen(true);
    };

    // Open single record modal (preselects only this one)
    const openSingleRecord = (sub: Submission) => {
        setSelectedSubmissionIds([sub.id]);
        setModalRequirementFilter(String(sub.requirement_id));
        setModalFacultySearch('');
        setBulkFormData({
            submitted_at: getLocalDatetimeString(),
            status: 'approved',
            reviewer_comments: '',
        });
        setIsBatchModalOpen(true);
    };

    // Submit batch record
    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSubmissionIds.length === 0) {
            alert('Please select at least one faculty member who submitted.');
            return;
        }

        setIsBulkSubmitting(true);
        router.post(
            '/compliance/submissions/bulk-record',
            {
                submission_ids: selectedSubmissionIds,
                submitted_at: bulkFormData.submitted_at,
                status: bulkFormData.status,
                reviewer_comments: bulkFormData.reviewer_comments,
            },
            {
                onSuccess: () => {
                    setSelectedSubmissionIds([]);
                    setIsBatchModalOpen(false);
                },
                onFinish: () => {
                    setIsBulkSubmitting(false);
                },
            }
        );
    };

    // Single Edit handlers
    const openEditDialog = (sub: Submission) => {
        setEditingSubmission(sub);
        setEditFormData({
            submitted_at: sub.submitted_at ? sub.submitted_at.slice(0, 16) : getLocalDatetimeString(),
            status: sub.status || 'approved',
            reviewer_comments: sub.reviewer_comments || '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubmission) return;

        setIsEditSubmitting(true);
        router.put(
            `/compliance/submissions/${editingSubmission.id}`,
            editFormData,
            {
                onSuccess: () => {
                    setEditingSubmission(null);
                },
                onFinish: () => {
                    setIsEditSubmitting(false);
                },
            }
        );
    };

    const handleRevertToPending = (sub: Submission) => {
        if (confirm(`Are you sure you want to revert the submission for ${sub.faculty?.first_name} ${sub.faculty?.last_name} back to pending?`)) {
            router.delete(`/compliance/submissions/${sub.id}`);
        }
    };

    // Deadline urgency helper
    const getUrgency = (dueDateStr?: string) => {
        if (!dueDateStr) return { label: 'No Deadline', color: 'text-muted-foreground bg-muted border-border' };
        const due = new Date(dueDateStr).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: `Overdue (${Math.abs(diffDays)}d)`,
                color: 'text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400',
            };
        }
        if (diffDays === 0) {
            return {
                label: 'Due Today',
                color: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
            };
        }
        if (diffDays <= 3) {
            return {
                label: `Due in ${diffDays}d`,
                color: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
            };
        }
        return {
            label: `Due in ${diffDays}d`,
            color: 'text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-400',
        };
    };

    // KPIs values
    const pendingCount = kpis?.pending_outputs ?? pendingSubmissions.length;
    const completedCount = kpis?.completed_records ?? submissions.length;
    const activeReqsCount = kpis?.active_requirements ?? requirements.length;
    const subRate = kpis?.submission_rate ?? (pendingCount + completedCount > 0 ? Math.round((completedCount / (pendingCount + completedCount)) * 100) : 100);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Submission Records" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER (Matches Mockup) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xs">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                            <h1 className="text-2xl font-black tracking-tight text-foreground">
                                Submission Records
                            </h1>
                            <p className="text-xs text-muted-foreground font-medium">
                                Track faculty outputs, inspect compliance, and batch-mark multiple faculty submissions at once.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => openBatchModal()}
                        className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Record Submission</span>
                    </Button>
                </div>

                {/* 2. FOUR KPI CARDS (Exact Match to Mockup) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Pending Outputs */}
                    <div
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            "rounded-2xl border p-5 shadow-xs relative overflow-hidden flex items-center justify-between cursor-pointer transition-all",
                            activeTab === 'pending'
                                ? "border-amber-400 bg-card ring-1 ring-amber-400/30"
                                : "border-border bg-card hover:border-border/80"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground block">
                                    Pending Outputs
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {pendingCount}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    awaiting submission
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Card 2: Completed Records */}
                    <div
                        onClick={() => setActiveTab('completed')}
                        className={cn(
                            "rounded-2xl border p-5 shadow-xs relative overflow-hidden flex items-center justify-between cursor-pointer transition-all",
                            activeTab === 'completed'
                                ? "border-emerald-500 bg-card ring-1 ring-emerald-500/30"
                                : "border-border bg-card hover:border-border/80"
                        )}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground block">
                                    Completed Records
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {completedCount}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    recorded & verified
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Card 3: Active Requirements */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground block">
                                    Active Requirements
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {activeReqsCount}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    active requirements
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Card 4: Submission Rate */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground block">
                                    Submission Rate
                                </span>
                                <div className="text-2xl font-black text-foreground mt-0.5">
                                    {subRate}%
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    requirements submitted
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>

                {/* 3. TABS SWITCHER (Matches Mockup) */}
                <div className="flex items-center gap-8 border-b border-border/80 pb-0">
                    {/* Tab 1: Pending Submissions */}
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            "flex items-center gap-2 pb-3 text-xs font-bold transition-all relative cursor-pointer",
                            activeTab === 'pending'
                                ? "text-amber-500"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Clock className="w-4 h-4" />
                        <span>Pending Submissions</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-black",
                            activeTab === 'pending'
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                        )}>
                            {pendingCount}
                        </span>
                        {activeTab === 'pending' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                        )}
                    </button>

                    {/* Tab 2: Completed Submissions */}
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={cn(
                            "flex items-center gap-2 pb-3 text-xs font-bold transition-all relative cursor-pointer",
                            activeTab === 'completed'
                                ? "text-amber-500"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed Submissions</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-black",
                            activeTab === 'completed'
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                        )}>
                            {completedCount}
                        </span>
                        {activeTab === 'completed' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                        )}
                    </button>
                </div>

                {/* 4. FILTERS & SEARCH CONTROLS BAR (Matches Mockup) */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[260px]">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search faculty or requirement..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 pl-9.5 pr-4 text-xs rounded-xl border border-border bg-card text-foreground shadow-2xs"
                            />
                        </div>

                        {/* All Requirements */}
                        <div className="relative min-w-[170px]">
                            <select
                                value={requirementFilter}
                                onChange={(e) => setRequirementFilter(e.target.value)}
                                className="h-10 px-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden appearance-none w-full cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Requirements</option>
                                {requirements.map((req) => (
                                    <option key={req.id} value={String(req.id)}>
                                        {req.title} {req.program?.code ? `(${req.program.code})` : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* All Programs */}
                        <div className="relative min-w-[150px]">
                            <select
                                value={programFilter}
                                onChange={(e) => setProgramFilter(e.target.value)}
                                className="h-10 px-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden appearance-none w-full cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Programs</option>
                                {availablePrograms.map((prog) => (
                                    <option key={prog.id} value={String(prog.id)}>
                                        {prog.code} — {prog.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* All Statuses */}
                        <div className="relative min-w-[140px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 px-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-hidden appearance-none w-full cursor-pointer shadow-2xs"
                            >
                                <option value="all">All Statuses</option>
                                <option value="approved">Approved</option>
                                <option value="submitted">Submitted</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        {/* Batch Select Button */}
                        <Button
                            variant="outline"
                            onClick={() => openBatchModal(requirementFilter)}
                            className="h-10 px-3.5 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer shadow-2xs"
                        >
                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                            <span>Batch Select</span>
                        </Button>

                        {/* Export Button */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const listToExport = activeTab === 'pending' ? filteredPending : filteredCompleted;
                                    const csvContent =
                                        'data:text/csv;charset=utf-8,' +
                                        ['Faculty Name', 'Requirement', 'Document Type', 'Program', 'Status', 'Submitted At'].join(',') +
                                        '\n' +
                                        listToExport
                                            .map((s) =>
                                                [
                                                    `"${s.faculty?.first_name} ${s.faculty?.last_name}"`,
                                                    `"${s.requirement?.title || ''}"`,
                                                    `"${s.requirement?.document_type || ''}"`,
                                                    `"${s.faculty?.program?.code || s.requirement?.program?.code || ''}"`,
                                                    `"${s.status}"`,
                                                    `"${s.submitted_at || 'Pending'}"`,
                                                ].join(',')
                                            )
                                            .join('\n');
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement('a');
                                    link.setAttribute('href', encodedUri);
                                    link.setAttribute('download', `submission-records-${activeTab}.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="h-10 px-3.5 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer shadow-2xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export</span>
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 5. MAIN CONTENT CARD (Matches Mockup) */}
                <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                    {/* TAB 1: PENDING SUBMISSIONS */}
                    {activeTab === 'pending' && (
                        <div>
                            {filteredPending.length === 0 ? (
                                /* ZERO PENDING EMPTY STATE (Matches Mockup Exactly) */
                                <div className="flex flex-col items-center justify-center p-16 sm:p-24 text-center">
                                    {/* Illustrated Document Graphic */}
                                    <div className="relative mb-6">
                                        <div className="w-24 h-24 rounded-full bg-amber-500/10 absolute -inset-2 blur-xl pointer-events-none" />
                                        <div className="w-24 h-28 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col items-center justify-center p-4 relative">
                                            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mb-2" />
                                            <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mb-2" />
                                            <div className="w-8 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mb-3" />
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                                <Check className="w-6 h-6 stroke-[3]" />
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-foreground tracking-tight">
                                        No pending outputs found
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1.5 max-w-sm font-medium">
                                        Great job! All assigned requirements have been submitted.
                                    </p>

                                    {/* 2 Buttons */}
                                    <div className="flex items-center gap-3 mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => setActiveTab('completed')}
                                            className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs"
                                        >
                                            <FileText className="w-4 h-4 text-amber-500" />
                                            <span>View Completed Records</span>
                                        </Button>

                                        <Button
                                            onClick={() => openBatchModal()}
                                            className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                                        >
                                            <Plus className="w-4 h-4 stroke-[3]" />
                                            <span>Record New Submission</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* PENDING TABLE */
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                                                <th className="py-3.5 px-4 w-10 text-center">
                                                    <Checkbox
                                                        checked={
                                                            isAllFilteredPendingSelected
                                                                ? true
                                                                : isSomeFilteredPendingSelected
                                                                ? 'indeterminate'
                                                                : false
                                                        }
                                                        onCheckedChange={toggleSelectAllFilteredPending}
                                                        aria-label="Select all"
                                                    />
                                                </th>
                                                <th className="py-3.5 px-6 font-bold">FACULTY MEMBER</th>
                                                <th className="py-3.5 px-4 font-bold">MISSING REQUIREMENT</th>
                                                <th className="py-3.5 px-4 font-bold">PROGRAM</th>
                                                <th className="py-3.5 px-4 font-bold">DEADLINE & URGENCY</th>
                                                <th className="py-3.5 px-6 font-bold text-right">QUICK ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60 font-medium">
                                            {filteredPending.map((sub) => {
                                                const isSelected = selectedSubmissionIds.includes(sub.id);
                                                const urgency = getUrgency(sub.requirement?.due_date);
                                                const programCode =
                                                    sub.faculty?.program?.code || sub.requirement?.program?.code;

                                                return (
                                                    <tr
                                                        key={sub.id}
                                                        className={cn(
                                                            "transition-colors cursor-pointer",
                                                            isSelected ? "bg-amber-500/10" : "hover:bg-muted/30"
                                                        )}
                                                        onClick={() => toggleSelectOne(sub.id)}
                                                    >
                                                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelectOne(sub.id)}
                                                            />
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                                    {sub.faculty?.first_name?.[0]}
                                                                    {sub.faculty?.last_name?.[0]}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-foreground">
                                                                        {sub.faculty?.first_name} {sub.faculty?.last_name}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        Faculty Member
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-foreground">
                                                                    {sub.requirement?.title}
                                                                </span>
                                                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                                    {sub.requirement?.document_type}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {programCode ? (
                                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                                    {programCode}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", urgency.color)}>
                                                                {urgency.label}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openSingleRecord(sub)}
                                                                className="h-8 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg gap-1.5"
                                                            >
                                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                <span>Record</span>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: COMPLETED SUBMISSIONS */}
                    {activeTab === 'completed' && (
                        <div className="overflow-x-auto">
                            {filteredCompleted.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground">
                                    No completed submission records found matching the filter criteria.
                                </div>
                            ) : (
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                                            <th className="py-3.5 px-6 font-bold">FACULTY MEMBER</th>
                                            <th className="py-3.5 px-4 font-bold">REQUIREMENT</th>
                                            <th className="py-3.5 px-4 font-bold">SUBMITTED AT</th>
                                            <th className="py-3.5 px-4 font-bold">STATUS</th>
                                            <th className="py-3.5 px-4 font-bold">REMARKS / NOTES</th>
                                            <th className="py-3.5 px-6 font-bold text-right">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60 font-medium">
                                        {filteredCompleted.map((sub) => {
                                            const programCode =
                                                sub.faculty?.program?.code || sub.requirement?.program?.code;

                                            return (
                                                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                                                                {sub.faculty?.first_name?.[0]}
                                                                {sub.faculty?.last_name?.[0]}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-foreground">
                                                                    {sub.faculty?.first_name} {sub.faculty?.last_name}
                                                                </span>
                                                                {programCode && (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {programCode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-foreground">
                                                                {sub.requirement?.title}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                                {sub.requirement?.document_type}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-muted-foreground font-semibold">
                                                        {sub.submitted_at
                                                            ? new Date(sub.submitted_at).toLocaleString('en-US', {
                                                                  month: 'short',
                                                                  day: 'numeric',
                                                                  year: 'numeric',
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              })
                                                            : '—'}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize",
                                                            sub.status === 'approved' || sub.status === 'accepted'
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                : sub.status === 'rejected'
                                                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                                                : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                                        )}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-muted-foreground">
                                                        {sub.reviewer_comments || 'Verified on time'}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem onClick={() => openEditDialog(sub)} className="cursor-pointer">
                                                                    <Edit className="w-3.5 h-3.5 mr-2" />
                                                                    <span>Edit Record</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRevertToPending(sub)} className="text-amber-600 focus:text-amber-600 cursor-pointer">
                                                                    <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                                                    <span>Revert to Pending</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* BATCH RECORD SUBMISSIONS MODAL */}
                <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
                    <DialogContent className="sm:max-w-[560px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-amber-500" />
                                Record Submissions
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Select the requirement and faculty members whose outputs have been received.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleBulkSubmit} className="flex flex-col gap-4 mt-2">
                            {/* Requirement Selector */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Target Requirement <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    value={modalRequirementFilter}
                                    onChange={(e) => setModalRequirementFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold focus-visible:outline-none"
                                >
                                    <option value="all">All Requirements</option>
                                    {requirements.map((req) => (
                                        <option key={req.id} value={String(req.id)}>
                                            {req.title} {req.program?.code ? `(${req.program.code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Faculty Selection Box */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Select Faculty ({selectedSubmissionIds.length} chosen)
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentIds = modalPendingList.map((s) => s.id);
                                            const allSelected = currentIds.every((id) => selectedSubmissionIds.includes(id));
                                            if (allSelected) {
                                                setSelectedSubmissionIds((prev) => prev.filter((id) => !currentIds.includes(id)));
                                            } else {
                                                setSelectedSubmissionIds((prev) => Array.from(new Set([...prev, ...currentIds])));
                                            }
                                        }}
                                        className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                                    >
                                        {modalPendingList.every((s) => selectedSubmissionIds.includes(s.id)) && modalPendingList.length > 0
                                            ? 'Deselect All'
                                            : `Select All (${modalPendingList.length})`}
                                    </button>
                                </div>

                                <div className="rounded-xl border border-border bg-muted/20 p-2 max-h-[180px] overflow-y-auto divide-y divide-border/60">
                                    {modalPendingList.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-muted-foreground">
                                            No pending faculty found for this requirement.
                                        </div>
                                    ) : (
                                        modalPendingList.map((sub) => {
                                            const isChecked = selectedSubmissionIds.includes(sub.id);
                                            return (
                                                <div
                                                    key={sub.id}
                                                    onClick={() => toggleSelectOne(sub.id)}
                                                    className={cn(
                                                        "flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                                        isChecked ? "bg-amber-500/15" : "hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Checkbox checked={isChecked} onCheckedChange={() => toggleSelectOne(sub.id)} />
                                                        <span className="text-xs font-bold text-foreground">
                                                            {sub.faculty?.first_name} {sub.faculty?.last_name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            ({sub.requirement?.title})
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Submitted Date & Time <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        value={bulkFormData.submitted_at}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, submitted_at: e.target.value })}
                                        required
                                        className="h-10 text-xs rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        value={bulkFormData.status}
                                        onChange={(e) => setBulkFormData({ ...bulkFormData, status: e.target.value })}
                                        className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold focus-visible:outline-none"
                                    >
                                        <option value="approved">Approved</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Remarks / Notes (Optional)
                                </Label>
                                <Input
                                    placeholder="e.g. Received hardcopy, verified complete"
                                    value={bulkFormData.reviewer_comments}
                                    onChange={(e) => setBulkFormData({ ...bulkFormData, reviewer_comments: e.target.value })}
                                    className="h-10 text-xs rounded-xl"
                                />
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsBatchModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isBulkSubmitting || selectedSubmissionIds.length === 0}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                >
                                    {isBulkSubmitting ? 'Recording...' : `Mark ${selectedSubmissionIds.length} Submitted`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* EDIT SUBMISSION MODAL */}
                <Dialog open={!!editingSubmission} onOpenChange={(open) => !open && setEditingSubmission(null)}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-amber-500" />
                                Edit Submission Record
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Submitted Date & Time <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={editFormData.submitted_at}
                                    onChange={(e) => setEditFormData({ ...editFormData, submitted_at: e.target.value })}
                                    required
                                    className="h-10 text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    value={editFormData.status}
                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                    className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold focus-visible:outline-none"
                                >
                                    <option value="approved">Approved</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Remarks / Notes
                                </Label>
                                <Input
                                    value={editFormData.reviewer_comments}
                                    onChange={(e) => setEditFormData({ ...editFormData, reviewer_comments: e.target.value })}
                                    className="h-10 text-xs rounded-xl"
                                />
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingSubmission(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isEditSubmitting}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                >
                                    {isEditSubmitting ? 'Saving...' : 'Update Record'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
