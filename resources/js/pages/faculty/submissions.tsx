import React, { useState, useMemo, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    FileSpreadsheet,
    FileCheck2,
    ListTodo,
    Users,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    Search,
    ChevronDown,
    MoreVertical,
    Upload,
    MessageSquare,
    ExternalLink,
    Filter,
    ArrowUpDown,
    RotateCcw,
    LayoutGrid,
    List,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Submissions', href: '/faculty/submissions' },
];

interface SubmissionItem {
    id: number;
    requirement_id: number;
    submission_id: number | null;
    title: string;
    office: string;
    category: string;
    document_type: string;
    due_date: string;
    due_date_raw: string | null;
    days_left: string | null;
    is_overdue: boolean;
    submitted_on_date: string | null;
    submitted_on_time: string | null;
    status: 'Approved' | 'Under Review' | 'Pending Review' | 'Returned' | 'Missing' | 'Pending' | string;
    reviewer_feedback: string | null;
    attachment_name: string | null;
    file_path: string | null;
    academic_year?: string;
    semester?: string;
}

interface StatItem {
    count: number;
    percentage: number;
}

interface Stats {
    total_requirements: number;
    submitted: StatItem;
    under_review: StatItem;
    approved: StatItem;
    returned: StatItem;
    overdue: StatItem;
}

interface AcademicPeriodItem {
    id: number;
    academic_year: string;
    semester: string;
    code?: string;
    is_current: boolean;
}

interface Props {
    faculty: any;
    items?: SubmissionItem[];
    stats?: Stats;
    categories?: string[];
    academic_periods?: AcademicPeriodItem[];
    current_period?: AcademicPeriodItem;
    available_requirements?: any[];
}

export default function FacultySubmissionsPage({
    faculty,
    items = [],
    stats = {
        total_requirements: 0,
        submitted: { count: 0, percentage: 0 },
        under_review: { count: 0, percentage: 0 },
        approved: { count: 0, percentage: 0 },
        returned: { count: 0, percentage: 0 },
        overdue: { count: 0, percentage: 0 },
    },
    categories = [],
    academic_periods = [],
    current_period,
    available_requirements = [],
}: Props) {
    // State management for filters and view
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [statusTab, setStatusTab] = useState<'All' | 'Pending' | 'Reviewed' | 'Returned'>('All');
    const [sortBy, setSortBy] = useState<'due_soonest' | 'due_latest' | 'submitted_recent' | 'title'>('due_soonest');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Upload dialog modal
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedUploadReq, setSelectedUploadReq] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Direct row upload trigger
    const rowFileInputRef = useRef<HTMLInputElement>(null);
    const [directUploadReqId, setDirectUploadReqId] = useState<number | null>(null);

    const handleDirectUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && directUploadReqId) {
            const formData = new FormData();
            formData.append('file', file);
            router.post(`/faculty/requirements/${directUploadReqId}/submit`, formData, {
                onFinish: () => {
                    setDirectUploadReqId(null);
                    if (rowFileInputRef.current) rowFileInputRef.current.value = '';
                },
            });
        }
    };

    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUploadReq) return;

        setIsSubmitting(true);
        const formData = new FormData();
        if (uploadFile) {
            formData.append('file', uploadFile);
        }
        if (notes) {
            formData.append('notes', notes);
        }

        router.post(`/faculty/requirements/${selectedUploadReq}/submit`, formData, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsUploadOpen(false);
                setSelectedUploadReq('');
                setUploadFile(null);
                setNotes('');
            },
        });
    };

    // Filtered & Sorted items
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchTitle = item.title?.toLowerCase().includes(query);
                const matchOffice = item.office?.toLowerCase().includes(query);
                const matchAttachment = item.attachment_name?.toLowerCase().includes(query);
                const matchType = item.document_type?.toLowerCase().includes(query);
                if (!matchTitle && !matchOffice && !matchAttachment && !matchType) {
                    return false;
                }
            }

            // Category filter
            if (selectedCategory !== 'all' && item.category !== selectedCategory) {
                return false;
            }

            // Status dropdown filter
            if (selectedStatus !== 'all' && item.status.toLowerCase() !== selectedStatus.toLowerCase()) {
                return false;
            }

            // Status Tabs filter: All | Pending | Reviewed | Returned
            if (statusTab === 'Pending') {
                if (!['Pending', 'Missing', 'Under Review', 'Pending Review'].includes(item.status)) {
                    return false;
                }
            } else if (statusTab === 'Reviewed') {
                if (!['Approved'].includes(item.status)) {
                    return false;
                }
            } else if (statusTab === 'Returned') {
                if (!['Returned'].includes(item.status)) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'due_soonest') {
                const dateA = a.due_date_raw ? new Date(a.due_date_raw).getTime() : 9999999999999;
                const dateB = b.due_date_raw ? new Date(b.due_date_raw).getTime() : 9999999999999;
                return dateA - dateB;
            }
            if (sortBy === 'due_latest') {
                const dateA = a.due_date_raw ? new Date(a.due_date_raw).getTime() : 0;
                const dateB = b.due_date_raw ? new Date(b.due_date_raw).getTime() : 0;
                return dateB - dateA;
            }
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
    }, [items, searchQuery, selectedCategory, selectedStatus, statusTab, sortBy]);

    // Icon helper by document type or title
    const renderRequirementIcon = (item: SubmissionItem) => {
        const titleLower = (item.title + ' ' + (item.document_type || '')).toLowerCase();
        if (titleLower.includes('grade')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50">
                    <FileSpreadsheet className="w-4 h-4" />
                </div>
            );
        }
        if (titleLower.includes('workload')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/50">
                    <Briefcase className="w-4 h-4" />
                </div>
            );
        }
        if (titleLower.includes('list') || titleLower.includes('graduating')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/50">
                    <Users className="w-4 h-4" />
                </div>
            );
        }
        if (titleLower.includes('tos') || titleLower.includes('specification')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/50">
                    <FileCheck2 className="w-4 h-4" />
                </div>
            );
        }
        if (titleLower.includes('tq') || titleLower.includes('test') || titleLower.includes('questionnaire')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200/50">
                    <ListTodo className="w-4 h-4" />
                </div>
            );
        }
        if (titleLower.includes('syllabus')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/50">
                    <FileText className="w-4 h-4" />
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/50">
                <FileText className="w-4 h-4" />
            </div>
        );
    };

    // Status Badge helper matching exact pill design in reference image
    const renderStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'approved') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60">
                    Approved
                </span>
            );
        }
        if (s === 'pending review') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60">
                    Pending Review
                </span>
            );
        }
        if (s === 'under review') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50/80 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/70">
                    Under Review
                </span>
            );
        }
        if (s === 'returned') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60">
                    Returned
                </span>
            );
        }
        if (s === 'missing') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60">
                    Missing
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40">
                Pending
            </span>
        );
    };

    // Attachment Pill helper matching screenshot
    const renderAttachmentBadge = (item: SubmissionItem) => {
        if (!item.file_path && !item.attachment_name) {
            return <span className="text-muted-foreground font-mono text-xs">—</span>;
        }

        const fileName = item.attachment_name || 'Document.pdf';
        const isPdf = fileName.toLowerCase().endsWith('.pdf');
        const isXlsx = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls');

        return (
            <div className="flex items-center gap-2">
                <a
                    href={`/storage/${item.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-medium text-foreground transition-colors group max-w-[150px] truncate border border-border/60"
                    title={fileName}
                >
                    {isPdf ? (
                        <span className="w-3.5 h-3.5 rounded-xs bg-rose-500 text-white font-black text-[8px] flex items-center justify-center shrink-0">
                            PDF
                        </span>
                    ) : isXlsx ? (
                        <span className="w-3.5 h-3.5 rounded-xs bg-emerald-600 text-white font-black text-[8px] flex items-center justify-center shrink-0">
                            XLS
                        </span>
                    ) : (
                        <span className="w-3.5 h-3.5 rounded-xs bg-blue-500 text-white font-black text-[8px] flex items-center justify-center shrink-0">
                            DOC
                        </span>
                    )}
                    <span className="truncate">{fileName}</span>
                </a>

                {item.file_path && (
                    <a
                        href={`/storage/${item.file_path}`}
                        download
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        title="Download file"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>
        );
    };

    // Quick CSV Export
    const handleExport = () => {
        const headers = ['Requirement', 'Office', 'Category', 'Due Date', 'Submitted On', 'Status', 'Reviewer Feedback', 'Attachment'];
        const rows = filteredItems.map((item) => [
            `"${item.title.replace(/"/g, '""')}"`,
            `"${item.office}"`,
            `"${item.category}"`,
            `"${item.due_date}"`,
            `"${item.submitted_on_date ? `${item.submitted_on_date} ${item.submitted_on_time || ''}` : '—'}"`,
            `"${item.status}"`,
            `"${(item.reviewer_feedback || '').replace(/"/g, '""')}"`,
            `"${item.attachment_name || '—'}"`,
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `Submission_Records_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Submission Records - CIDS OfficeHub" />

            {/* Hidden file input for single-click row submission */}
            <input
                type="file"
                ref={rowFileInputRef}
                onChange={handleDirectUploadChange}
                className="hidden"
                accept=".pdf,.docx,.xlsx,.doc,.xls"
            />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER WITH TWO ACTION BUTTONS (Exact match to screenshot banner) */}
                <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xs overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-amber-200/50">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-foreground">
                                    Submission Records
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                                    Track the review lifecycle of your uploaded compliance and academic documents.
                                </p>
                            </div>
                        </div>

                        {/* Top Right Action Buttons: "Submit Document" (amber filled) + "View Requirements" (outlined) */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => setIsUploadOpen(true)}
                                className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Submit Document</span>
                            </Button>

                            <Link
                                href="/faculty/requirements"
                                className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <FileCheck2 className="w-4 h-4 text-muted-foreground" />
                                <span>View Requirements</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2. SIX STATISTIC METRIC CARDS WITH COLORED BOTTOM PROGRESS BARS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {/* Card 1: Total Requirements (Blue icon) */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Total Requirements
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {stats.total_requirements}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                For this academic year
                            </span>
                        </div>
                        <div className="w-full bg-transparent h-1 mt-3" />
                    </div>

                    {/* Card 2: Submitted (Green check icon) */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Submitted
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {stats.submitted.count}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                {stats.submitted.percentage}% completion
                            </span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1 mt-3 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.submitted.percentage}%` }} />
                        </div>
                    </div>

                    {/* Card 3: Under Review (Yellow clock icon) */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Under Review
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {stats.under_review.count}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                {stats.under_review.percentage}% of total
                            </span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1 mt-3 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${stats.under_review.percentage}%` }} />
                        </div>
                    </div>

                    {/* Card 4: Approved (Green check icon) */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Approved
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {stats.approved.count}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                {stats.approved.percentage}% of total
                            </span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1 mt-3 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.approved.percentage}%` }} />
                        </div>
                    </div>

                    {/* Card 5: Returned (Red rotate/refresh icon) */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                                <RotateCcw className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Returned
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {stats.returned.count}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                {stats.returned.percentage}% of total
                            </span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1 mt-3 overflow-hidden">
                            <div className="bg-rose-400 h-full rounded-full transition-all" style={{ width: `${stats.returned.percentage}%` }} />
                        </div>
                    </div>

                    {/* Card 6: Overdue (Red calendar icon) */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                                <Calendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Overdue
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {stats.overdue.count}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                {stats.overdue.percentage}% of total
                            </span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1 mt-3 overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${stats.overdue.percentage}%` }} />
                        </div>
                    </div>
                </div>

                {/* 3. FILTER TOOLBAR (Exact matching controls: Search, Period, Category, Status, Date Range, Status Tabs, Export) */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search requirements, files, or keywords..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9.5 pl-9 pr-3 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                            />
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Academic Period */}
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-0.5">Academic Period</span>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[130px]"
                                >
                                    <option value="all">All Periods</option>
                                    {academic_periods.map((p) => (
                                        <option key={p.id} value={p.id.toString()}>
                                            {p.academic_year} {p.semester}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-0.5">Category</span>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[130px]"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-0.5">Status</span>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[120px]"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="approved">Approved</option>
                                    <option value="under review">Under Review</option>
                                    <option value="pending review">Pending Review</option>
                                    <option value="returned">Returned</option>
                                    <option value="missing">Missing</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            {/* Date Range input placeholder */}
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-0.5">Date Range</span>
                                <div className="h-8.5 rounded-xl border border-input bg-card px-3 text-xs font-medium text-muted-foreground flex items-center gap-2 shadow-2xs">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Select date range</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Quick Pill Tabs: All | Pending | Reviewed | Returned + Export Button */}
                        <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/70">
                                {(['All', 'Pending', 'Reviewed', 'Returned'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setStatusTab(tab)}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                            statusTab === tab
                                                ? "bg-card text-foreground shadow-2xs font-bold"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Export Button with Dropdown or direct CSV */}
                            <Button
                                onClick={handleExport}
                                variant="outline"
                                className="h-8.5 px-3 rounded-xl border-border bg-card text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export</span>
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 4. MAIN SUBMISSION RECORDS TABLE SECTION */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                    {/* Header Row: Title with Count + Sort Dropdown + View Toggle */}
                    <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-foreground">
                                Submission Records
                            </h2>
                            <span className="text-sm font-semibold text-muted-foreground">
                                ({filteredItems.length})
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sort By Dropdown */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="h-8 rounded-xl border border-input bg-card px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer"
                                >
                                    <option value="due_soonest">Due Date (Soonest)</option>
                                    <option value="due_latest">Due Date (Latest)</option>
                                    <option value="title">Requirement Title</option>
                                </select>
                            </div>

                            {/* View Switcher: Table / Cards */}
                            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/70">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-colors cursor-pointer",
                                        viewMode === 'table' ? "bg-card text-amber-500 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Table View"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-colors cursor-pointer",
                                        viewMode === 'cards' ? "bg-card text-amber-500 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Grid Card View"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto border border-border/80 rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] font-bold text-muted-foreground bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3.5 font-semibold">Requirement</th>
                                        <th className="px-4 py-3.5 font-semibold">Category</th>
                                        <th className="px-4 py-3.5 font-semibold">Due Date</th>
                                        <th className="px-4 py-3.5 font-semibold">Submitted On</th>
                                        <th className="px-4 py-3.5 font-semibold">Status</th>
                                        <th className="px-4 py-3.5 font-semibold">Reviewer Feedback</th>
                                        <th className="px-4 py-3.5 font-semibold">Attachment</th>
                                        <th className="px-3 py-3.5 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                                                No submission records found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                {/* Requirement Title with Department Subtitle */}
                                                <td className="px-4 py-3.5 min-w-[240px]">
                                                    <div className="flex items-center gap-3">
                                                        {renderRequirementIcon(item)}
                                                        <div>
                                                            <span className="font-bold text-foreground block text-xs leading-snug">
                                                                {item.title}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                                {item.office}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground font-medium">
                                                    {item.category}
                                                </td>

                                                {/* Due Date with Days Left badge */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div>
                                                        <span className="font-semibold text-foreground block">
                                                            {item.due_date}
                                                        </span>
                                                        {item.days_left && (
                                                            <span className={cn(
                                                                "text-[10px] font-bold block mt-0.5",
                                                                item.days_left.includes('overdue')
                                                                    ? "text-rose-600"
                                                                    : item.days_left === 'Today'
                                                                    ? "text-amber-600"
                                                                    : "text-amber-600/90"
                                                            )}>
                                                                {item.days_left}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Submitted On Date and Time */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {item.submitted_on_date ? (
                                                        <div>
                                                            <span className="font-semibold text-foreground block">
                                                                {item.submitted_on_date}
                                                            </span>
                                                            {item.submitted_on_time && (
                                                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                                    {item.submitted_on_time}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground font-mono">—</span>
                                                    )}
                                                </td>

                                                {/* Status Pill Badge */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {renderStatusBadge(item.status)}
                                                </td>

                                                {/* Reviewer Feedback with Chat Bubble Icon */}
                                                <td className="px-4 py-3.5 min-w-[200px] max-w-[280px]">
                                                    {item.reviewer_feedback ? (
                                                        <div className="flex items-start gap-1.5 text-muted-foreground text-[11px] leading-snug">
                                                            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/70" />
                                                            <span>{item.reviewer_feedback}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground font-mono">—</span>
                                                    )}
                                                </td>

                                                {/* Attachment File Chip */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {renderAttachmentBadge(item)}
                                                </td>

                                                {/* Actions Context Menu */}
                                                <td className="px-3 py-3.5 text-right whitespace-nowrap">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setDirectUploadReqId(item.requirement_id);
                                                                    rowFileInputRef.current?.click();
                                                                }}
                                                                className="cursor-pointer text-xs flex items-center gap-2 font-medium"
                                                            >
                                                                <Upload className="w-3.5 h-3.5" />
                                                                <span>Upload Document</span>
                                                            </DropdownMenuItem>

                                                            {item.file_path && (
                                                                <DropdownMenuItem asChild>
                                                                    <a
                                                                        href={`/storage/${item.file_path}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="cursor-pointer text-xs flex items-center gap-2 font-medium"
                                                                    >
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                        <span>View Uploaded File</span>
                                                                    </a>
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href="/faculty/requirements"
                                                                    className="cursor-pointer text-xs flex items-center gap-2 font-medium"
                                                                >
                                                                    <FileCheck2 className="w-3.5 h-3.5" />
                                                                    <span>Requirement Details</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Card Grid View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-5 rounded-2xl border border-border bg-card shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                {renderRequirementIcon(item)}
                                                <div>
                                                    <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-1">
                                                        {item.title}
                                                    </h3>
                                                    <span className="text-[10px] text-muted-foreground block">
                                                        {item.office}
                                                    </span>
                                                </div>
                                            </div>
                                            {renderStatusBadge(item.status)}
                                        </div>

                                        <div className="space-y-1.5 text-xs pt-2 border-t border-border/60">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground font-medium">Category:</span>
                                                <span className="font-semibold text-foreground">{item.category}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground font-medium">Due Date:</span>
                                                <span className="font-semibold text-foreground">{item.due_date}</span>
                                            </div>
                                            {item.days_left && (
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-muted-foreground font-medium">Timeline:</span>
                                                    <span className={cn(
                                                        "font-bold",
                                                        item.days_left.includes('overdue') ? "text-rose-600" : "text-amber-600"
                                                    )}>
                                                        {item.days_left}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground font-medium">Submitted:</span>
                                                <span className="font-semibold text-foreground">
                                                    {item.submitted_on_date || '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {item.reviewer_feedback && (
                                            <div className="p-2.5 rounded-xl bg-muted/40 text-[11px] text-muted-foreground flex items-start gap-1.5">
                                                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/70" />
                                                <span>{item.reviewer_feedback}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                                        <div>{renderAttachmentBadge(item)}</div>
                                        <Button
                                            onClick={() => {
                                                setDirectUploadReqId(item.requirement_id);
                                                rowFileInputRef.current?.click();
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="h-7.5 px-3 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer"
                                        >
                                            <Upload className="w-3 h-3" />
                                            <span>Upload</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Submission Modal Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Submit Document</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Upload your compliance requirement document for departmental review.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleModalSubmit} className="space-y-4 py-2">
                        {/* Requirement Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Select Requirement</label>
                            <select
                                required
                                value={selectedUploadReq}
                                onChange={(e) => setSelectedUploadReq(Number(e.target.value))}
                                className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer"
                            >
                                <option value="" disabled>Select requirement to submit...</option>
                                {items.map((it) => (
                                    <option key={it.requirement_id} value={it.requirement_id}>
                                        {it.title} (Due: {it.due_date})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* File Upload Drop Area */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Attach Document File</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border hover:border-amber-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    accept=".pdf,.docx,.xlsx,.doc,.xls"
                                />
                                <Upload className="w-6 h-6 mx-auto text-amber-500 mb-1.5" />
                                <span className="text-xs font-bold text-foreground block">
                                    {uploadFile ? uploadFile.name : 'Click to select a file'}
                                </span>
                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                    PDF, DOCX, XLSX up to 20MB
                                </span>
                            </div>
                        </div>

                        {/* Notes / Comments */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Optional Notes / Remarks</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes for the reviewer..."
                                rows={3}
                                className="w-full rounded-xl border border-input bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs resize-none"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsUploadOpen(false)}
                                className="rounded-xl text-xs h-9 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !selectedUploadReq}
                                className="rounded-xl text-xs h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer"
                            >
                                {isSubmitting ? 'Uploading...' : 'Submit Output'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
