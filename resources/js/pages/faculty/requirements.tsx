import React, { useRef, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    FileText,
    UploadCloud,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    Hourglass,
    AlertTriangle,
    Search,
    Filter,
    ChevronDown,
    ArrowUpDown,
    Download,
    Eye,
    LayoutGrid,
    List,
    FileSpreadsheet,
    Building2,
    Send,
    Edit3,
    MoreVertical,
    FileUp,
    Check,
    X,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface RequirementItem {
    id: number;
    requirement_id: number;
    submission_id?: number | null;
    title: string;
    description?: string | null;
    category: string;
    document_type: string;
    due_date: string;
    due_date_raw?: string | null;
    days_left?: string | null;
    days_remaining?: number | null;
    is_urgent?: boolean;
    is_overdue?: boolean;
    status: 'Pending' | 'Under Review' | 'Approved' | 'Returned' | 'Completed';
    progress: number;
    last_updated: string;
    last_updated_by: string;
    reviewer_feedback?: string | null;
    file_path?: string | null;
    attachment_name?: string | null;
    academic_year?: string;
    semester?: string;
}

interface Metrics {
    total: number;
    approved: { count: number; percentage: number };
    under_review: { count: number; percentage: number };
    pending: { count: number; percentage: number };
    returned: { count: number };
    urgent: { count: number; percentage: number };
    completed: { count: number };
}

interface Props {
    faculty: any;
    items: RequirementItem[];
    metrics?: Metrics;
    categories?: string[];
    types?: string[];
    academic_periods?: any[];
    current_period?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Requirements', href: '/faculty/requirements' },
];

export default function FacultyRequirementsPage({
    faculty,
    items = [],
    metrics,
    categories = [],
    types = [],
    academic_periods = [],
    current_period,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedReqForUpload, setSelectedReqForUpload] = useState<RequirementItem | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string>('All');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'due_nearest' | 'due_furthest' | 'title' | 'progress'>('due_nearest');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

    // Detail Modal State
    const [activeDetailItem, setActiveDetailItem] = useState<RequirementItem | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Direct Upload Modal State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [targetRequirement, setTargetRequirement] = useState<RequirementItem | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadNotes, setUploadNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived summary calculations fallback
    const totalCount = metrics?.total ?? items.length;
    const approvedCount = metrics?.approved?.count ?? items.filter(i => i.status === 'Approved').length;
    const approvedPct = metrics?.approved?.percentage ?? (totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0);
    const underReviewCount = metrics?.under_review?.count ?? items.filter(i => i.status === 'Under Review').length;
    const underReviewPct = metrics?.under_review?.percentage ?? (totalCount > 0 ? Math.round((underReviewCount / totalCount) * 100) : 0);
    const pendingCount = metrics?.pending?.count ?? items.filter(i => i.status === 'Pending').length;
    const pendingPct = metrics?.pending?.percentage ?? (totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0);
    const urgentCount = metrics?.urgent?.count ?? items.filter(i => i.is_urgent && i.status !== 'Approved').length;
    const urgentPct = metrics?.urgent?.percentage ?? (totalCount > 0 ? Math.round((urgentCount / totalCount) * 100) : 0);
    const returnedCount = metrics?.returned?.count ?? items.filter(i => i.status === 'Returned').length;
    const completedCount = metrics?.completed?.count ?? items.filter(i => i.status === 'Completed' || i.status === 'Approved').length;

    // Filtered & Sorted Requirements
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Search Query
            const matchesSearch =
                !searchQuery ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.document_type.toLowerCase().includes(searchQuery.toLowerCase());

            // Tab Filter (All, Pending, Under Review, Approved, Returned, Urgent, Completed)
            let matchesTab = true;
            if (activeTab === 'Pending') matchesTab = item.status === 'Pending';
            else if (activeTab === 'Under Review') matchesTab = item.status === 'Under Review';
            else if (activeTab === 'Approved') matchesTab = item.status === 'Approved';
            else if (activeTab === 'Returned') matchesTab = item.status === 'Returned';
            else if (activeTab === 'Urgent') matchesTab = !!item.is_urgent && item.status !== 'Approved';
            else if (activeTab === 'Completed') matchesTab = item.status === 'Completed' || item.status === 'Approved';

            // Dropdowns
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            const matchesType = selectedType === 'all' || item.document_type === selectedType;
            const matchesStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;

            return matchesSearch && matchesTab && matchesCategory && matchesType && matchesStatus;
        }).sort((a, b) => {
            if (sortBy === 'due_nearest') {
                const dateA = a.due_date_raw ? new Date(a.due_date_raw).getTime() : Infinity;
                const dateB = b.due_date_raw ? new Date(b.due_date_raw).getTime() : Infinity;
                return dateA - dateB;
            }
            if (sortBy === 'due_furthest') {
                const dateA = a.due_date_raw ? new Date(a.due_date_raw).getTime() : -Infinity;
                const dateB = b.due_date_raw ? new Date(b.due_date_raw).getTime() : -Infinity;
                return dateB - dateA;
            }
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }
            if (sortBy === 'progress') {
                return b.progress - a.progress;
            }
            return 0;
        });
    }, [items, searchQuery, activeTab, selectedCategory, selectedType, selectedStatusFilter, sortBy]);

    // Pagination Slices
    const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredItems.slice(start, start + perPage);
    }, [filteredItems, currentPage, perPage]);

    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const pageIds = paginatedItems.map(i => i.id);
            setSelectedRowIds(Array.from(new Set([...selectedRowIds, ...pageIds])));
        } else {
            const pageIds = new Set(paginatedItems.map(i => i.id));
            setSelectedRowIds(selectedRowIds.filter(id => !pageIds.has(id)));
        }
    };

    const handleToggleSelectRow = (id: number) => {
        if (selectedRowIds.includes(id)) {
            setSelectedRowIds(selectedRowIds.filter(rId => rId !== id));
        } else {
            setSelectedRowIds([...selectedRowIds, id]);
        }
    };

    const isAllSelectedOnPage =
        paginatedItems.length > 0 && paginatedItems.every(i => selectedRowIds.includes(i.id));

    // Upload Trigger
    const openUploadModal = (item?: RequirementItem) => {
        setTargetRequirement(item || paginatedItems[0] || null);
        setUploadFile(null);
        setUploadNotes('');
        setUploadModalOpen(true);
    };

    const handleExecuteUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetRequirement) return;

        setIsSubmitting(true);
        const formData = new FormData();
        if (uploadFile) {
            formData.append('file', uploadFile);
        }
        if (uploadNotes) {
            formData.append('notes', uploadNotes);
        }

        router.post(`/faculty/requirements/${targetRequirement.requirement_id}/submit`, formData, {
            onFinish: () => {
                setIsSubmitting(false);
                setUploadModalOpen(false);
                setUploadFile(null);
                setUploadNotes('');
            },
        });
    };

    const getCategoryPill = (cat: string) => {
        switch (cat) {
            case 'Academic Compliance':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
                        {cat}
                    </span>
                );
            case 'Course Syllabi':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60">
                        {cat}
                    </span>
                );
            case 'Faculty Load':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                        {cat}
                    </span>
                );
            case 'Rubrics Submission':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60">
                        {cat}
                    </span>
                );
            case 'Grading Sheets':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                        {cat}
                    </span>
                );
            case 'Research':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
                        {cat}
                    </span>
                );
            case 'Extension':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60">
                        {cat}
                    </span>
                );
            case 'SPAR':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60">
                        {cat}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                        {cat}
                    </span>
                );
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
            case 'Completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                        Approved
                    </span>
                );
            case 'Under Review':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800">
                        Under Review
                    </span>
                );
            case 'Returned':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800">
                        Returned
                    </span>
                );
            case 'Pending':
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                        Pending
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Requirements - Document Compliance" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                {/* 1. Header Hero with Yellow Theme Accent */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/40 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                            <FileUp className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Required Academic Outputs
                                </h1>
                                <Badge variant="outline" className="text-xs bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300/50">
                                    AY {current_period?.academic_year || '2026-2027'} • {current_period?.semester || '1st Semester'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Documentary requirements published for your program and academic period. Upload documents directly for review.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Switcher: Table vs Cards */}
                        <div className="inline-flex items-center rounded-lg border border-border bg-card p-1 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    viewMode === 'table'
                                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Table View"
                            >
                                <List className="w-3.5 h-3.5" />
                                <span>Table</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('cards')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    viewMode === 'cards'
                                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Card View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span>Cards</span>
                            </button>
                        </div>

                        {/* Primary Action Button (Shades of Yellow) */}
                        <Button
                            onClick={() => openUploadModal()}
                            className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-xs h-9.5 px-4 rounded-lg shadow-sm gap-2 transition-colors cursor-pointer border border-amber-600/20"
                        >
                            <UploadCloud className="w-4 h-4 stroke-[2.2]" />
                            <span>Upload Requirement</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                        </Button>
                    </div>
                </div>

                {/* 2. Top Metric Cards (Matches Image Architecture) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Total Requirements */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Requirements
                            </span>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {totalCount}
                            </div>
                            <p className="text-[11px] text-muted-foreground">This Academic Year</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                            <FileText className="w-5 h-5 stroke-[1.8]" />
                        </div>
                    </div>

                    {/* Approved */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Approved
                            </span>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {approvedCount}
                            </div>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                {approvedPct}% completion
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                        </div>
                    </div>

                    {/* Under Review */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Under Review
                            </span>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {underReviewCount}
                            </div>
                            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                                {underReviewPct}% of total
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <Clock className="w-5 h-5 stroke-[2]" />
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Pending
                            </span>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {pendingCount}
                            </div>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                {pendingPct}% of total
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Hourglass className="w-5 h-5 stroke-[2]" />
                        </div>
                    </div>

                    {/* Urgent / Due Soon */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex items-center justify-between col-span-2 md:col-span-1">
                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Urgent / Due Soon
                            </span>
                            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                                {urgentCount}
                            </div>
                            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                                {urgentPct}% of total
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 stroke-[2]" />
                        </div>
                    </div>
                </div>

                {/* 3. Filter Navigation & Search Bar */}
                <div className="flex flex-col gap-3.5">
                    {/* Status Tabs with Counts */}
                    <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-border">
                        <div className="flex items-center gap-1.5 shrink-0">
                            {[
                                { key: 'All', label: 'All', count: totalCount },
                                { key: 'Pending', label: 'Pending', count: pendingCount },
                                { key: 'Under Review', label: 'Under Review', count: underReviewCount },
                                { key: 'Approved', label: 'Approved', count: approvedCount },
                                { key: 'Returned', label: 'Returned', count: returnedCount },
                                { key: 'Urgent', label: 'Urgent', count: urgentCount, isUrgent: true },
                                { key: 'Completed', label: 'Completed', count: completedCount },
                            ].map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab.key);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                            isActive
                                                ? 'bg-amber-500 text-white shadow-xs font-bold'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                                isActive
                                                    ? 'bg-amber-600/70 text-white'
                                                    : tab.isUrgent && tab.count > 0
                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-auto">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e: any) => setSortBy(e.target.value)}
                                className="h-8 text-xs font-semibold rounded-md border border-input bg-card px-2.5 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                            >
                                <option value="due_nearest">Due Date (Nearest)</option>
                                <option value="due_furthest">Due Date (Furthest)</option>
                                <option value="title">Requirement Title (A-Z)</option>
                                <option value="progress">Progress %</option>
                            </select>
                        </div>
                    </div>

                    {/* Secondary Filters Strip (Period, Category, Types, Search, Reset) */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-2 rounded-xl border border-border shadow-2xs">
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            {/* Academic Year Filter */}
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="h-8 text-xs font-medium rounded-lg border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                            >
                                <option value="all">This Academic Year</option>
                                {academic_periods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        AY {p.academic_year} ({p.semester})
                                    </option>
                                ))}
                            </select>

                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 text-xs font-medium rounded-lg border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>

                            {/* Types Filter */}
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 text-xs font-medium rounded-lg border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                            >
                                <option value="all">All Types</option>
                                {types.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>

                            {/* Statuses Filter */}
                            <select
                                value={selectedStatusFilter}
                                onChange={(e) => {
                                    setSelectedStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 text-xs font-medium rounded-lg border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Approved">Approved</option>
                                <option value="Returned">Returned</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-72">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search requirements..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8.5 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Content Area: Table View vs Cards View */}
                {viewMode === 'table' ? (
                    /* Table View (Identical to attached reference picture) */
                    <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="py-3 px-4 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelectedOnPage}
                                                onChange={handleSelectAllOnPage}
                                                className="rounded border-input text-amber-500 focus:ring-amber-400"
                                            />
                                        </th>
                                        <th className="py-3 px-4 min-w-[260px]">Requirement Title</th>
                                        <th className="py-3 px-4">Category</th>
                                        <th className="py-3 px-4 min-w-[140px]">Due Date</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 min-w-[150px]">Progress</th>
                                        <th className="py-3 px-4 min-w-[130px]">Last Updated</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                                                <p className="font-semibold text-sm text-foreground">No requirements found</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    No requirements match your active filter criteria.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item) => {
                                            const isSelected = selectedRowIds.includes(item.id);
                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`hover:bg-amber-500/[0.03] dark:hover:bg-amber-500/[0.05] transition-colors ${
                                                        isSelected ? 'bg-amber-500/[0.06] dark:bg-amber-500/[0.08]' : ''
                                                    }`}
                                                >
                                                    {/* Checkbox */}
                                                    <td className="py-3.5 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleSelectRow(item.id)}
                                                            className="rounded border-input text-amber-500 focus:ring-amber-400"
                                                        />
                                                    </td>

                                                    {/* Requirement Title */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-foreground text-xs leading-snug">
                                                            {item.title}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                            {item.description || item.document_type || 'Prescribed compliance artifact'}
                                                        </div>
                                                    </td>

                                                    {/* Category */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {getCategoryPill(item.category)}
                                                    </td>

                                                    {/* Due Date & Days countdown */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <div className="font-semibold text-foreground text-xs">
                                                            {item.due_date}
                                                        </div>
                                                        {item.days_left && (
                                                            <div
                                                                className={`flex items-center gap-1 text-[11px] font-medium mt-0.5 ${
                                                                    item.is_urgent
                                                                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                                                                        : 'text-amber-600 dark:text-amber-400'
                                                                }`}
                                                            >
                                                                <Clock className="w-3 h-3" />
                                                                <span>{item.days_left}</span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {getStatusBadge(item.status)}
                                                    </td>

                                                    {/* Progress Bar (Matches green/amber bar in picture) */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${
                                                                        item.progress === 100
                                                                            ? 'bg-emerald-500'
                                                                            : item.progress >= 50
                                                                            ? 'bg-emerald-500'
                                                                            : item.progress > 0
                                                                            ? 'bg-emerald-400'
                                                                            : 'bg-transparent'
                                                                    }`}
                                                                    style={{ width: `${item.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-muted-foreground w-8 text-right">
                                                                {item.progress}%
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Last Updated */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <div className="font-medium text-foreground text-xs">
                                                            {item.last_updated}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {item.last_updated_by}
                                                        </div>
                                                    </td>

                                                    {/* Actions (View, Upload/Edit, More) */}
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveDetailItem(item);
                                                                    setDetailModalOpen(true);
                                                                }}
                                                                className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                                title="View Details"
                                                            >
                                                                <FileText className="w-3.5 h-3.5" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => openUploadModal(item)}
                                                                className="h-8 w-8 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
                                                                title="Upload / Revise"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveDetailItem(item);
                                                                    setDetailModalOpen(true);
                                                                }}
                                                                className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                                title="Options"
                                                            >
                                                                <MoreVertical className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer with Pagination matching screenshot */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                            <div>
                                Showing{' '}
                                <span className="font-bold text-foreground">
                                    {filteredItems.length === 0 ? 0 : (currentPage - 1) * perPage + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-bold text-foreground">
                                    {Math.min(currentPage * perPage, filteredItems.length)}
                                </span>{' '}
                                of <span className="font-bold text-foreground">{filteredItems.length}</span> requirements
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-7 w-7 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                                    >
                                        &lt;
                                    </button>

                                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`h-7 w-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                                currentPage === pageNum
                                                    ? 'bg-amber-500 text-white shadow-xs'
                                                    : 'border border-border bg-background hover:bg-muted text-foreground'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="h-7 w-7 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                                    >
                                        &gt;
                                    </button>
                                </div>

                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-7 text-xs font-medium rounded-md border border-input bg-background px-2 text-foreground focus-visible:outline-none"
                                >
                                    <option value={8}>8 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={15}>15 / page</option>
                                    <option value={20}>20 / page</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 5. Card View (Requested Feature) */
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginatedItems.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl bg-card">
                                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                                    <p className="font-semibold text-sm text-foreground">No requirements found</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        No requirements match your active filter criteria.
                                    </p>
                                </div>
                            ) : (
                                paginatedItems.map((item) => {
                                    return (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-border bg-card p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-amber-400/60 dark:hover:border-amber-500/40 relative overflow-hidden"
                                        >
                                            {/* Top Yellow Accent Strip on hover */}
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="space-y-3">
                                                {/* Header Category & Status */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>{getCategoryPill(item.category)}</div>
                                                    <div>{getStatusBadge(item.status)}</div>
                                                </div>

                                                {/* Title & Description */}
                                                <div>
                                                    <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {item.description || item.document_type || 'Prescribed compliance artifact'}
                                                    </p>
                                                </div>

                                                {/* Progress Bar in Card */}
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                                        <span>Compliance Progress</span>
                                                        <span className="text-foreground">{item.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                item.progress === 100
                                                                    ? 'bg-emerald-500'
                                                                    : item.progress > 0
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-transparent'
                                                            }`}
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Metadata */}
                                                <div className="pt-2 border-t border-border/60 text-xs space-y-1 text-muted-foreground">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px]">Due Date:</span>
                                                        <span className="font-semibold text-foreground">{item.due_date}</span>
                                                    </div>
                                                    {item.days_left && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px]">Timeline:</span>
                                                            <span
                                                                className={`font-semibold flex items-center gap-1 ${
                                                                    item.is_urgent
                                                                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                                                                        : 'text-amber-600 dark:text-amber-400'
                                                                }`}
                                                            >
                                                                <Clock className="w-3 h-3" />
                                                                {item.days_left}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px]">Last Updated:</span>
                                                        <span className="text-foreground text-[11px] font-medium">{item.last_updated}</span>
                                                    </div>
                                                </div>

                                                {/* Reviewer Feedback snippet if available */}
                                                {item.reviewer_feedback && (
                                                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-300/40 text-[11px] text-amber-800 dark:text-amber-300">
                                                        <span className="font-bold">Remarks: </span>
                                                        <span className="italic">{item.reviewer_feedback}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Footer Actions */}
                                            <div className="pt-4 mt-3 border-t border-border flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setActiveDetailItem(item);
                                                        setDetailModalOpen(true);
                                                    }}
                                                    className="flex-1 text-xs h-8 gap-1.5 cursor-pointer"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>View</span>
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    onClick={() => openUploadModal(item)}
                                                    className="flex-1 text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-1.5 cursor-pointer"
                                                >
                                                    <UploadCloud className="w-3.5 h-3.5" />
                                                    <span>{item.submission_id ? 'Revise' : 'Submit'}</span>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Cards Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card text-xs text-muted-foreground shadow-2xs">
                            <div>
                                Showing <span className="font-bold text-foreground">{paginatedItems.length}</span> of{' '}
                                <span className="font-bold text-foreground">{filteredItems.length}</span> requirements
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 flex items-center justify-center cursor-pointer"
                                >
                                    &lt;
                                </button>
                                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`h-7 w-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                            currentPage === pageNum
                                                ? 'bg-amber-500 text-white shadow-xs'
                                                : 'border border-border bg-background hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="h-7 w-7 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 flex items-center justify-center cursor-pointer"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Upload Requirement Modal */}
                <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                                <UploadCloud className="w-5 h-5 text-amber-500" />
                                <span>Upload Academic Requirement</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Submit or revise your documentary compliance file for evaluation.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleExecuteUpload} className="space-y-4 pt-2">
                            {/* Target Requirement Picker */}
                            <div>
                                <label className="text-xs font-semibold text-foreground">Select Requirement</label>
                                <select
                                    value={targetRequirement?.id || ''}
                                    onChange={(e) => {
                                        const req = items.find(i => String(i.id) === e.target.value);
                                        setTargetRequirement(req || null);
                                    }}
                                    className="w-full text-xs font-medium rounded-lg border border-input bg-background p-2 mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                    required
                                >
                                    {items.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.title} (Due: {i.due_date})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Requirement Details card summary */}
                            {targetRequirement && (
                                <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Category:</span>
                                        <span className="font-semibold text-foreground">{targetRequirement.category}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Deadline:</span>
                                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                                            {targetRequirement.due_date} ({targetRequirement.days_left})
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Current Status:</span>
                                        <span>{getStatusBadge(targetRequirement.status)}</span>
                                    </div>
                                </div>
                            )}

                            {/* File Upload Dropzone */}
                            <div>
                                <label className="text-xs font-semibold text-foreground">Output File Attachment</label>
                                <div className="mt-1 border-2 border-dashed border-amber-400/50 dark:border-amber-500/40 rounded-xl p-4 text-center bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition-colors">
                                    <input
                                        type="file"
                                        id="output-file-input"
                                        accept=".pdf,.docx,.doc,.xlsx,.xls,.zip"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="output-file-input"
                                        className="flex flex-col items-center justify-center cursor-pointer space-y-1.5"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                            <UploadCloud className="w-5 h-5 stroke-[2]" />
                                        </div>
                                        <div className="text-xs font-semibold text-foreground">
                                            {uploadFile ? uploadFile.name : 'Click to select or drag and drop document'}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Accepted formats: PDF, DOCX, XLSX, ZIP (Max: 20MB)
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {/* Submission Notes */}
                            <div>
                                <label className="text-xs font-semibold text-foreground">Notes / Comments (Optional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Add any context, revision notes, or justifications for the reviewer..."
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input bg-background p-2 mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUploadModalOpen(false)}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting || !uploadFile}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>{isSubmitting ? 'Uploading...' : 'Submit Output'}</span>
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 7. Requirement Details Modal */}
                <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                                <FileText className="w-5 h-5 text-amber-500" />
                                <span>Requirement Specification</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Complete academic delivery terms, guidelines, and review tracking.
                            </DialogDescription>
                        </DialogHeader>

                        {activeDetailItem && (
                            <div className="space-y-4 pt-1">
                                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                                    <div className="flex items-center justify-between">
                                        {getCategoryPill(activeDetailItem.category)}
                                        {getStatusBadge(activeDetailItem.status)}
                                    </div>
                                    <h2 className="text-base font-bold text-foreground">
                                        {activeDetailItem.title}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {activeDetailItem.description || 'No detailed instructions provided.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Due Date</span>
                                        <div className="font-bold text-foreground">{activeDetailItem.due_date}</div>
                                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            {activeDetailItem.days_left}
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Document Type</span>
                                        <div className="font-bold text-foreground">{activeDetailItem.document_type}</div>
                                        <div className="text-[11px] text-muted-foreground">
                                            Progress: {activeDetailItem.progress}%
                                        </div>
                                    </div>
                                </div>

                                {/* Reviewer Feedback if present */}
                                {activeDetailItem.reviewer_feedback && (
                                    <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-xs space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Evaluator Feedback & Directions</span>
                                        </div>
                                        <p className="text-amber-900/90 dark:text-amber-200 text-xs italic">
                                            "{activeDetailItem.reviewer_feedback}"
                                        </p>
                                    </div>
                                )}

                                {/* Attached File if submitted */}
                                {activeDetailItem.attachment_name && (
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span className="font-medium text-foreground truncate">{activeDetailItem.attachment_name}</span>
                                        </div>
                                        {activeDetailItem.file_path && (
                                            <a
                                                href={`/storage/${activeDetailItem.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-xs inline-flex items-center gap-1 shrink-0"
                                            >
                                                <Download className="w-3 h-3" />
                                                <span>Download</span>
                                            </a>
                                        )}
                                    </div>
                                )}

                                <DialogFooter className="gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDetailModalOpen(false)}
                                        className="cursor-pointer"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setDetailModalOpen(false);
                                            openUploadModal(activeDetailItem);
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer gap-1.5"
                                    >
                                        <UploadCloud className="w-3.5 h-3.5" />
                                        <span>{activeDetailItem.submission_id ? 'Upload Revision' : 'Submit Output'}</span>
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
