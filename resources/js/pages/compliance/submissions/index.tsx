import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
    CheckSquare,
    CheckCircle2,
    Clock,
    FileText,
    Search,
    Filter,
    MoreVertical,
    Edit,
    RotateCcw,
    GraduationCap,
    Users,
    AlertCircle,
    Calendar,
    Check,
    X,
} from 'lucide-react';

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

interface Props {
    submissions: Submission[];
    pendingSubmissions: Submission[];
    requirements?: Requirement[];
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
}: Props) {
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    // Selection state for pending submissions
    const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<number[]>([]);

    // Search & filter states for Pending tab
    const [pendingSearch, setPendingSearch] = useState('');
    const [pendingRequirementFilter, setPendingRequirementFilter] = useState<string>('all');
    const [pendingProgramFilter, setPendingProgramFilter] = useState<string>('all');

    // Search & filter states for Completed tab
    const [completedSearch, setCompletedSearch] = useState('');
    const [completedStatusFilter, setCompletedStatusFilter] = useState<string>('all');

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
        submitted_at: '',
        status: 'approved',
        reviewer_comments: '',
    });

    // Extract unique programs from pending and completed
    const availablePrograms = useMemo(() => {
        const progMap = new Map<number, Program>();
        pendingSubmissions.forEach((sub) => {
            const p = sub.faculty?.program || sub.requirement?.program;
            if (p) progMap.set(p.id, p);
        });
        submissions.forEach((sub) => {
            const p = sub.faculty?.program || sub.requirement?.program;
            if (p) progMap.set(p.id, p);
        });
        return Array.from(progMap.values());
    }, [pendingSubmissions, submissions]);

    // Filtered pending submissions for the Pending tab
    const filteredPending = useMemo(() => {
        return pendingSubmissions.filter((sub) => {
            const facultyName = `${sub.faculty?.first_name || ''} ${sub.faculty?.last_name || ''}`.toLowerCase();
            const reqTitle = (sub.requirement?.title || '').toLowerCase();
            const searchLower = pendingSearch.toLowerCase();
            const matchesSearch = !pendingSearch || facultyName.includes(searchLower) || reqTitle.includes(searchLower);

            const matchesReq =
                pendingRequirementFilter === 'all' ||
                String(sub.requirement_id) === pendingRequirementFilter;

            const progId = sub.faculty?.program?.id || sub.requirement?.program?.id;
            const matchesProg =
                pendingProgramFilter === 'all' ||
                String(progId) === pendingProgramFilter;

            return matchesSearch && matchesReq && matchesProg;
        });
    }, [pendingSubmissions, pendingSearch, pendingRequirementFilter, pendingProgramFilter]);

    // Filtered completed submissions for the Completed tab
    const filteredCompleted = useMemo(() => {
        return submissions.filter((sub) => {
            const facultyName = `${sub.faculty?.first_name || ''} ${sub.faculty?.last_name || ''}`.toLowerCase();
            const reqTitle = (sub.requirement?.title || '').toLowerCase();
            const searchLower = completedSearch.toLowerCase();
            const matchesSearch = !completedSearch || facultyName.includes(searchLower) || reqTitle.includes(searchLower);

            const matchesStatus =
                completedStatusFilter === 'all' ||
                sub.status.toLowerCase() === completedStatusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [submissions, completedSearch, completedStatusFilter]);

    // Items displayed inside the Batch Record Modal
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

    // Revert completed to pending
    const handleRevertToPending = (sub: Submission) => {
        const facultyName = `${sub.faculty?.first_name || ''} ${sub.faculty?.last_name || ''}`;
        const reqTitle = sub.requirement?.title || 'this requirement';
        if (confirm(`Revert submission for ${facultyName} (${reqTitle}) back to pending?`)) {
            router.delete(`/compliance/submissions/${sub.id}`);
        }
    };

    // Urgency helper
    const getUrgency = (dueDateStr?: string) => {
        if (!dueDateStr) return { label: 'Pending', color: 'text-muted-foreground bg-muted' };
        const due = new Date(dueDateStr).getTime();
        const now = Date.now();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: `Overdue (${Math.abs(diffDays)}d)`,
                color: 'text-red-700 bg-red-500/10 border-red-500/20 dark:text-red-400',
            };
        }
        if (diffDays === 0) {
            return {
                label: 'Due Today',
                color: 'text-orange-700 bg-orange-500/10 border-orange-500/20 dark:text-orange-400',
            };
        }
        if (diffDays <= 3) {
            return {
                label: `Due in ${diffDays}d`,
                color: 'text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
            };
        }
        return {
            label: `Due in ${diffDays}d`,
            color: 'text-blue-700 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Submission Records" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <CheckSquare className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Submission Records
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track faculty outputs, inspect compliance, and batch-mark multiple faculty submissions at once.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                            onClick={() => openBatchModal()}
                            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        >
                            <CheckSquare className="w-4 h-4" />
                            Record Submissions
                        </Button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                        onClick={() => setActiveTab('pending')}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                            activeTab === 'pending'
                                ? 'bg-card border-primary/50 ring-1 ring-primary/20 shadow-sm'
                                : 'bg-card border-border hover:border-border/80'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Pending Outputs
                            </span>
                            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {pendingSubmissions.length}
                            </span>
                            <span className="text-xs text-muted-foreground">awaiting submission</span>
                        </div>
                    </div>

                    <div
                        onClick={() => setActiveTab('completed')}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                            activeTab === 'completed'
                                ? 'bg-card border-primary/50 ring-1 ring-primary/20 shadow-sm'
                                : 'bg-card border-border hover:border-border/80'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Completed Records
                            </span>
                            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {submissions.length}
                            </span>
                            <span className="text-xs text-muted-foreground">recorded & verified</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                                Compliance Requirements
                            </span>
                            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <FileText className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {requirements.length}
                            </span>
                            <span className="text-xs text-muted-foreground">active requirements</span>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'pending'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        <span>Pending Submissions</span>
                        <Badge
                            variant="secondary"
                            className="ml-1 text-xs px-2 py-0.5 rounded-full"
                        >
                            {pendingSubmissions.length}
                        </Badge>
                    </button>

                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'completed'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed Submissions</span>
                        <Badge
                            variant="secondary"
                            className="ml-1 text-xs px-2 py-0.5 rounded-full"
                        >
                            {submissions.length}
                        </Badge>
                    </button>
                </div>

                {/* TAB 1: PENDING SUBMISSIONS */}
                {activeTab === 'pending' && (
                    <div className="flex flex-col gap-4">
                        {/* Filters and Search Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                            <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search faculty or requirement..."
                                        value={pendingSearch}
                                        onChange={(e) => setPendingSearch(e.target.value)}
                                        className="pl-9 h-9"
                                    />
                                </div>

                                <div className="w-full sm:w-56">
                                    <select
                                        value={pendingRequirementFilter}
                                        onChange={(e) => setPendingRequirementFilter(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="all">All Requirements</option>
                                        {requirements.map((req) => (
                                            <option key={req.id} value={String(req.id)}>
                                                {req.title} {req.program?.code ? `(${req.program.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-full sm:w-44">
                                    <select
                                        value={pendingProgramFilter}
                                        onChange={(e) => setPendingProgramFilter(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="all">All Programs</option>
                                        {availablePrograms.map((prog) => (
                                            <option key={prog.id} value={String(prog.id)}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openBatchModal(pendingRequirementFilter)}
                                    className="gap-1.5 h-9"
                                >
                                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                                    <span>Batch Select</span>
                                </Button>
                            </div>
                        </div>

                        {/* Floating / Sticky Bulk Action Toolbar */}
                        {selectedSubmissionIds.length > 0 && (
                            <div className="sticky top-2 z-10 flex items-center justify-between gap-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 shadow-md backdrop-blur-sm transition-all">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs">
                                        ✓
                                    </span>
                                    <span className="font-semibold text-sm">
                                        {selectedSubmissionIds.length} faculty member
                                        {selectedSubmissionIds.length > 1 ? 's' : ''} selected
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={clearSelection}
                                        className="h-8 text-xs border-amber-500/30 hover:bg-amber-500/20"
                                    >
                                        <X className="w-3.5 h-3.5 mr-1" />
                                        Clear
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => openBatchModal(pendingRequirementFilter)}
                                        className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Mark Selected as Submitted ({selectedSubmissionIds.length})
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Pending Table Card */}
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                            {filteredPending.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="p-4 rounded-full bg-muted/60 mb-3">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        No pending outputs found
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                        {pendingSearch || pendingRequirementFilter !== 'all' || pendingProgramFilter !== 'all'
                                            ? 'No pending faculty matching your filter criteria. Try adjusting or clearing filters.'
                                            : 'Great job! All assigned requirements have been submitted.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 w-10 text-center">
                                                    <Checkbox
                                                        checked={
                                                            isAllFilteredPendingSelected
                                                                ? true
                                                                : isSomeFilteredPendingSelected
                                                                ? 'indeterminate'
                                                                : false
                                                        }
                                                        onCheckedChange={toggleSelectAllFilteredPending}
                                                        aria-label="Select all pending faculty"
                                                    />
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Faculty Member
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Missing Requirement
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Program
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Deadline & Urgency
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold text-right">
                                                    Quick Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredPending.map((sub) => {
                                                const isSelected = selectedSubmissionIds.includes(sub.id);
                                                const urgency = getUrgency(sub.requirement?.due_date);
                                                const programCode =
                                                    sub.faculty?.program?.code || sub.requirement?.program?.code;

                                                return (
                                                    <tr
                                                        key={sub.id}
                                                        className={`transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-amber-500/10 dark:bg-amber-500/15'
                                                                : 'hover:bg-muted/40'
                                                        }`}
                                                        onClick={() => toggleSelectOne(sub.id)}
                                                    >
                                                        <td
                                                            className="px-4 py-3.5 text-center"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelectOne(sub.id)}
                                                                aria-label={`Select ${sub.faculty?.first_name} ${sub.faculty?.last_name}`}
                                                            />
                                                        </td>

                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                {sub.faculty?.photo_url ? (
                                                                    <img
                                                                        src={sub.faculty.photo_url}
                                                                        alt={`${sub.faculty?.first_name} ${sub.faculty?.last_name}`}
                                                                        className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                                                                        {sub.faculty?.first_name?.[0]}
                                                                        {sub.faculty?.last_name?.[0]}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-medium text-foreground">
                                                                        {sub.faculty?.first_name} {sub.faculty?.last_name}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Faculty Member
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-3.5">
                                                            <div>
                                                                <div className="font-medium text-foreground">
                                                                    {sub.requirement?.title}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                                                    {sub.requirement?.document_type}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-3.5">
                                                            {programCode ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-muted text-foreground border border-border">
                                                                    <GraduationCap className="w-3 h-3 text-muted-foreground" />
                                                                    {programCode}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-6 py-3.5">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className="text-xs text-foreground">
                                                                    {sub.requirement?.due_date
                                                                        ? new Date(sub.requirement.due_date).toLocaleDateString(
                                                                              undefined,
                                                                              {
                                                                                  month: 'short',
                                                                                  day: 'numeric',
                                                                                  year: 'numeric',
                                                                              }
                                                                          )
                                                                        : 'No date'}
                                                                </span>
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${urgency.color}`}
                                                                >
                                                                    {urgency.label}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td
                                                            className="px-6 py-3.5 text-right"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openSingleRecord(sub)}
                                                                className="h-8 text-xs gap-1.5"
                                                            >
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                Record
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
                    </div>
                )}

                {/* TAB 2: COMPLETED SUBMISSIONS */}
                {activeTab === 'completed' && (
                    <div className="flex flex-col gap-4">
                        {/* Search & Status Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                            <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search completed records..."
                                        value={completedSearch}
                                        onChange={(e) => setCompletedSearch(e.target.value)}
                                        className="pl-9 h-9"
                                    />
                                </div>

                                <div className="w-full sm:w-48">
                                    <select
                                        value={completedStatusFilter}
                                        onChange={(e) => setCompletedStatusFilter(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="approved">Approved</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <span className="text-xs text-muted-foreground">
                                Showing {filteredCompleted.length} of {submissions.length} records
                            </span>
                        </div>

                        {/* Completed Table Card */}
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                            {filteredCompleted.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="p-4 rounded-full bg-muted/60 mb-3">
                                        <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        No completed submissions found
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                        {completedSearch || completedStatusFilter !== 'all'
                                            ? 'No records match your search filter.'
                                            : 'No submissions have been recorded yet. Click "Record Submissions" to record faculty outputs.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Faculty Member
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Requirement
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Submitted At
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold">
                                                    Remarks / Notes
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-semibold text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredCompleted.map((sub) => {
                                                const programCode =
                                                    sub.faculty?.program?.code || sub.requirement?.program?.code;

                                                const statusVariant =
                                                    sub.status === 'approved' || sub.status === 'accepted'
                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                                        : sub.status === 'rejected'
                                                        ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'
                                                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';

                                                return (
                                                    <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                {sub.faculty?.photo_url ? (
                                                                    <img
                                                                        src={sub.faculty.photo_url}
                                                                        alt={`${sub.faculty?.first_name} ${sub.faculty?.last_name}`}
                                                                        className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                                                                        {sub.faculty?.first_name?.[0]}
                                                                        {sub.faculty?.last_name?.[0]}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-medium text-foreground">
                                                                        {sub.faculty?.first_name} {sub.faculty?.last_name}
                                                                    </div>
                                                                    {programCode && (
                                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <GraduationCap className="w-3 h-3" />
                                                                            {programCode}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-3.5">
                                                            <div className="font-medium text-foreground">
                                                                {sub.requirement?.title}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                                                {sub.requirement?.document_type}
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-3.5 text-xs text-foreground">
                                                            {sub.submitted_at
                                                                ? new Date(sub.submitted_at).toLocaleString(undefined, {
                                                                      month: 'short',
                                                                      day: 'numeric',
                                                                      year: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                  })
                                                                : '—'}
                                                        </td>

                                                        <td className="px-6 py-3.5">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${statusVariant}`}
                                                            >
                                                                {sub.status}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                                                            {sub.reviewer_comments || <span className="italic">—</span>}
                                                        </td>

                                                        <td className="px-6 py-3.5 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44">
                                                                    <DropdownMenuItem onClick={() => openEditDialog(sub)}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/20"
                                                                        onClick={() => handleRevertToPending(sub)}
                                                                    >
                                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                                        Revert to Pending
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* BATCH RECORD MODAL DIALOG */}
                <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
                    <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                <CheckSquare className="w-5 h-5 text-primary" />
                                Record Faculty Submissions
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Mark multiple faculty members who submitted what. Select a requirement, check all faculty members, and record in one click.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleBulkSubmit} className="flex flex-col gap-4 mt-2 overflow-hidden flex-1">
                            {/* Step 1: Requirement Selector */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Filter by Requirement
                                </Label>
                                <select
                                    value={modalRequirementFilter}
                                    onChange={(e) => setModalRequirementFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="all">
                                        All Requirements ({pendingSubmissions.length} pending total)
                                    </option>
                                    {requirements.map((req) => {
                                        const pendingForReq = pendingSubmissions.filter(
                                            (s) => s.requirement_id === req.id
                                        ).length;
                                        return (
                                            <option key={req.id} value={String(req.id)}>
                                                {req.title} {req.program?.code ? `(${req.program.code})` : ''} — {pendingForReq} pending
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Step 2: Faculty Checklist */}
                            <div className="flex flex-col gap-2 flex-1 min-h-[160px]">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Filter faculty name..."
                                            value={modalFacultySearch}
                                            onChange={(e) => setModalFacultySearch(e.target.value)}
                                            className="pl-8 h-8 text-xs"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const currentIds = modalPendingList.map((s) => s.id);
                                                const allSelected = currentIds.every((id) =>
                                                    selectedSubmissionIds.includes(id)
                                                );
                                                if (allSelected) {
                                                    setSelectedSubmissionIds((prev) =>
                                                        prev.filter((id) => !currentIds.includes(id))
                                                    );
                                                } else {
                                                    setSelectedSubmissionIds((prev) =>
                                                        Array.from(new Set([...prev, ...currentIds]))
                                                    );
                                                }
                                            }}
                                            className="h-8 text-xs"
                                        >
                                            {modalPendingList.every((s) => selectedSubmissionIds.includes(s.id)) &&
                                            modalPendingList.length > 0
                                                ? 'Deselect All'
                                                : `Select All (${modalPendingList.length})`}
                                        </Button>

                                        <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                            {selectedSubmissionIds.length} selected
                                        </span>
                                    </div>
                                </div>

                                {/* Scrollable List of Faculty */}
                                <div className="rounded-lg border border-border bg-muted/20 p-2 max-h-[190px] overflow-y-auto divide-y divide-border/60">
                                    {modalPendingList.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-muted-foreground">
                                            No pending faculty found for this requirement filter.
                                        </div>
                                    ) : (
                                        modalPendingList.map((sub) => {
                                            const isChecked = selectedSubmissionIds.includes(sub.id);
                                            const programCode =
                                                sub.faculty?.program?.code || sub.requirement?.program?.code;

                                            return (
                                                <div
                                                    key={sub.id}
                                                    onClick={() => toggleSelectOne(sub.id)}
                                                    className={`flex items-center justify-between gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                                        isChecked
                                                            ? 'bg-amber-500/15 dark:bg-amber-500/20'
                                                            : 'hover:bg-muted/60'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => toggleSelectOne(sub.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {sub.faculty?.photo_url ? (
                                                            <img
                                                                src={sub.faculty.photo_url}
                                                                alt={`${sub.faculty?.first_name} ${sub.faculty?.last_name}`}
                                                                className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                                {sub.faculty?.first_name?.[0]}
                                                                {sub.faculty?.last_name?.[0]}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-xs font-semibold text-foreground">
                                                                {sub.faculty?.first_name} {sub.faculty?.last_name}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                                {programCode && <span>[{programCode}]</span>}
                                                                <span>{sub.requirement?.title}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className="text-[11px] text-muted-foreground shrink-0">
                                                        Due{' '}
                                                        {sub.requirement?.due_date
                                                            ? new Date(sub.requirement.due_date).toLocaleDateString(
                                                                  undefined,
                                                                  { month: 'short', day: 'numeric' }
                                                              )
                                                            : '—'}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Shared Submission Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Submitted Date & Time <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        value={bulkFormData.submitted_at}
                                        onChange={(e) =>
                                            setBulkFormData({ ...bulkFormData, submitted_at: e.target.value })
                                        }
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        value={bulkFormData.status}
                                        onChange={(e) =>
                                            setBulkFormData({ ...bulkFormData, status: e.target.value })
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="approved">Approved</option>
                                        <option value="submitted">Submitted / Under Review</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Remarks / Reviewer Comments (Optional)
                                </Label>
                                <Input
                                    placeholder="e.g. Received hardcopy, complete and verified"
                                    value={bulkFormData.reviewer_comments}
                                    onChange={(e) =>
                                        setBulkFormData({ ...bulkFormData, reviewer_comments: e.target.value })
                                    }
                                    className="h-9 text-xs"
                                />
                            </div>

                            <DialogFooter className="mt-2 pt-2 border-t border-border flex items-center justify-between sm:justify-between w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsBatchModalOpen(false)}
                                    className="h-9 text-xs"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={selectedSubmissionIds.length === 0 || isBulkSubmitting}
                                    className="h-9 text-xs bg-primary text-primary-foreground font-semibold disabled:opacity-50 gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    {isBulkSubmitting
                                        ? 'Recording...'
                                        : `Record Submissions (${selectedSubmissionIds.length} Faculty)`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* SINGLE EDIT MODAL DIALOG */}
                <Dialog open={!!editingSubmission} onOpenChange={(open) => !open && setEditingSubmission(null)}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-primary" />
                                Edit Submission Record
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Update submitted date, status, or remarks for{' '}
                                <span className="font-semibold text-foreground">
                                    {editingSubmission?.faculty?.first_name} {editingSubmission?.faculty?.last_name}
                                </span>{' '}
                                ({editingSubmission?.requirement?.title}).
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 mt-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Submitted Date & Time <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={editFormData.submitted_at}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, submitted_at: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    value={editFormData.status}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, status: e.target.value })
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="approved">Approved</option>
                                    <option value="submitted">Submitted / Under Review</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Remarks / Comments
                                </Label>
                                <Input
                                    value={editFormData.reviewer_comments}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, reviewer_comments: e.target.value })
                                    }
                                    placeholder="Remarks or feedback"
                                />
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingSubmission(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isEditSubmitting}
                                    className="bg-primary text-primary-foreground font-semibold"
                                >
                                    {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
