import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    CalendarRange,
    Sparkles,
    UploadCloud,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Copy,
    ArrowRight,
    Settings,
    History,
    RotateCcw,
    Check,
    X,
    Edit3,
    Filter,
    Search,
    ShieldCheck,
    Calendar,
    Clock,
    Info,
    ChevronDown,
    RefreshCw,
    Download,
    Eye,
    Save,
    ChevronRight,
    Sliders,
    Building2,
    Layers,
    ListFilter,
    Trash2
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { cn } from '@/lib/utils';

interface AcademicPeriod {
    id: number;
    academic_year: string;
    semester: string;
    code: string | null;
    start_date: string;
    end_date: string;
    status: string;
    is_current: boolean;
}

interface ImportRule {
    id: number;
    event_category: string;
    default_scheduling_effect: string;
    suggested_destination_module: string;
    description: string;
    is_active: boolean;
}

interface ImportBatch {
    id: number;
    academic_year: string;
    semester_scope: string;
    institution: string;
    original_filename: string;
    file_type: string;
    file_size_bytes: number;
    extracted_text: string | null;
    status: string;
    detected_count: number;
    approved_count: number;
    rejected_count: number;
    manual_corrected_count: number;
    needs_attention_count: number;
    created_at: string;
    creator?: { id: number; name: string };
}

interface ImportEvent {
    id: number;
    batch_id: number;
    title: string;
    description: string | null;
    category: string;
    semester: string | null;
    start_date: string | null;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    source_text: string | null;
    confidence_score: number;
    ai_reasoning: string | null;
    validation_status: 'valid' | 'needs_attention' | 'duplicate' | 'conflict' | 'out_of_period';
    validation_notes: string | null;
    proposed_scheduling_effect: string;
    confirmed_scheduling_effect: string | null;
    status: 'pending' | 'approved' | 'rejected';
    is_manually_corrected: boolean;
    approved_at: string | null;
    destination_type: string | null;
    destination_id: number | null;
}

interface Props {
    academicPeriods: AcademicPeriod[];
    currentBatch: ImportBatch;
    batches: {
        data: ImportBatch[];
        links: any[];
    };
    events: ImportEvent[];
    rules: ImportRule[];
    stats: {
        total_detected: number;
        valid_count: number;
        needs_attention_count: number;
        duplicates_count: number;
        approved_count: number;
        rejected_count: number;
    };
    filters: {
        category: string;
        validation_status: string;
        status: string;
    };
    flash?: {
        success?: string | null;
        error?: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Calendar', href: '/schedule/calendar' },
    { title: 'Academic Calendar Import', href: '/schedule/calendar-import' },
];

export default function AcademicCalendarImportIndex({
    academicPeriods = [],
    currentBatch,
    batches,
    events = [],
    rules = [],
    stats,
    filters,
    flash,
}: Props) {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialTab = urlParams?.get('tab') === 'upload' ? 'upload' : 'queue';
    const [activeTab, setActiveTab] = useState<'queue' | 'upload' | 'rules' | 'history'>(initialTab);
    const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
    const [editingEvent, setEditingEvent] = useState<ImportEvent | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [rollingBackBatch, setRollingBackBatch] = useState<ImportBatch | null>(null);
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>(filters.category || 'all');
    const [filterValidation, setFilterValidation] = useState<string>(filters.validation_status || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<ImportEvent | null>(null);
    const [isDeletingEvent, setIsDeletingEvent] = useState(false);

    // Upload Form State
    const { data: uploadData, setData: setUploadData, post: postUpload, processing: isUploading, errors: uploadErrors, reset: resetUpload, clearErrors } = useForm({
        academic_year: 'AY 2026–2027',
        semester_scope: 'Whole Academic Year',
        institution: 'CIDS - College of Information and Computing Sciences',
        calendar_file: null as File | null,
    });

    // Edit Event Form State
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        category: 'academic_milestone',
        semester: '1st Semester',
        start_date: '',
        end_date: '',
        start_time: '08:00',
        end_time: '17:00',
        proposed_scheduling_effect: 'INFORMATIONAL',
        validation_status: 'valid',
    });

    // Filter events locally by search and dropdowns
    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const matchesSearch = searchQuery === '' || 
                ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (ev.source_text && ev.source_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
                ev.category.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCat = filterCategory === 'all' || ev.category === filterCategory;
            const matchesVal = filterValidation === 'all' || ev.validation_status === filterValidation;

            return matchesSearch && matchesCat && matchesVal;
        });
    }, [events, searchQuery, filterCategory, filterValidation]);

    // Handle Selection
    const handleSelectAllValid = () => {
        // Select all records with valid status and pending
        const validPending = filteredEvents
            .filter((e) => e.validation_status === 'valid' && e.status === 'pending')
            .map((e) => e.id);
        setSelectedEventIds(validPending);
    };

    const handleClearSelection = () => {
        setSelectedEventIds([]);
    };

    const toggleSelectEvent = (id: number) => {
        setSelectedEventIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Actions
    const handleSingleApprove = (event: ImportEvent) => {
        router.post(`/schedule/calendar-import/approve/${event.id}`, {
            confirmed_scheduling_effect: event.proposed_scheduling_effect,
        }, {
            preserveScroll: true,
        });
    };

    const handleBulkApprove = () => {
        if (selectedEventIds.length === 0) return;
        router.post('/schedule/calendar-import/bulk-approve', {
            event_ids: selectedEventIds,
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedEventIds([]),
        });
    };

    const handleSingleReject = (event: ImportEvent) => {
        router.post(`/schedule/calendar-import/reject/${event.id}`, {}, {
            preserveScroll: true,
        });
    };

    const promptDeleteEvent = (event: ImportEvent) => {
        setDeletingEvent(event);
    };

    const confirmDeleteEvent = () => {
        if (!deletingEvent) return;
        setIsDeletingEvent(true);
        router.delete(`/schedule/calendar-import/event/${deletingEvent.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingEvent(null);
                setSelectedEventIds((prev) => prev.filter((id) => id !== deletingEvent.id));
            },
            onFinish: () => setIsDeletingEvent(false),
        });
    };

    const openEditModal = (event: ImportEvent) => {
        setEditingEvent(event);
        setEditForm({
            title: event.title,
            description: event.description || '',
            category: event.category,
            semester: event.semester || '1st Semester',
            start_date: event.start_date || '',
            end_date: event.end_date || event.start_date || '',
            start_time: event.start_time || '08:00',
            end_time: event.end_time || '17:00',
            proposed_scheduling_effect: event.proposed_scheduling_effect,
            validation_status: event.validation_status === 'needs_attention' ? 'valid' : event.validation_status,
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;

        router.put(`/schedule/calendar-import/event/${editingEvent.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => setIsEditDialogOpen(false),
        });
    };

    const handleRollbackBatch = (batch: ImportBatch) => {
        setRollingBackBatch(batch);
    };

    const confirmRollbackBatch = () => {
        if (!rollingBackBatch) return;
        setIsRollingBack(true);
        router.post(`/schedule/calendar-import/batch/${rollingBackBatch.id}/rollback`, {}, {
            preserveScroll: true,
            onSuccess: () => setRollingBackBatch(null),
            onFinish: () => setIsRollingBack(false),
        });
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUploadErrorMessage(null);

        if (!uploadData.calendar_file) {
            setUploadErrorMessage('Please select a valid academic calendar document to proceed.');
            return;
        }

        postUpload('/schedule/calendar-import/upload', {
            forceFormData: true,
            preserveScroll: false,
            onSuccess: () => {
                setActiveTab('queue');
                resetUpload();
                setUploadErrorMessage(null);
            },
            onError: (errs) => {
                const firstKey = Object.keys(errs)[0];
                if (firstKey) {
                    setUploadErrorMessage(errs[firstKey]);
                } else {
                    setUploadErrorMessage('An unexpected error occurred while uploading. Please check the document format and try again.');
                }
            },
        });
    };

    // Color badges helper
    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'holiday':
                return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">Holiday</Badge>;
            case 'examination':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">Examination</Badge>;
            case 'faculty_deadline':
                return <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">Faculty Deadline</Badge>;
            case 'grade_submission':
                return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">Grade Cutoff</Badge>;
            case 'enrollment':
                return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Enrollment</Badge>;
            case 'break':
                return <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">Break</Badge>;
            case 'university_activity':
            case 'college_activity':
                return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Activity</Badge>;
            default:
                return <Badge variant="outline">{cat.replace(/_/g, ' ')}</Badge>;
        }
    };

    const getValidationBadge = (status: string) => {
        switch (status) {
            case 'valid':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                );
            case 'needs_attention':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Needs Attention
                    </span>
                );
            case 'duplicate':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        <Copy className="w-3 h-3" /> Duplicate
                    </span>
                );
            case 'out_of_period':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3" /> Out of Period
                    </span>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getSchedulingEffectLabel = (effect: string) => {
        switch (effect) {
            case 'BLOCK_ALL_CLASSES':
                return (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span>Block All Classes</span>
                    </div>
                );
            case 'CALENDAR_TV_RESTRICTION':
                return (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Calendar + TV + Exam Restriction</span>
                    </div>
                );
            case 'CALENDAR_REMINDER':
                return (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span>Calendar + Reminder Compliance</span>
                    </div>
                );
            case 'CALENDAR_TV_DISPLAY':
                return (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Calendar + TV Display</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                        <span>Informational (No Block)</span>
                    </div>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Calendar Import - AI Ingestion & Governance" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Flash Messages & Alerts */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-2xs animate-in fade-in duration-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="flex-1">{flash.success}</div>
                    </div>
                )}

                {(flash?.error || uploadErrorMessage) && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold shadow-2xs animate-in fade-in duration-300">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                        <div className="flex-1">{flash?.error || uploadErrorMessage}</div>
                        {uploadErrorMessage && (
                            <button
                                type="button"
                                onClick={() => setUploadErrorMessage(null)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 1. HERO & WORKFLOW BANNER                                                 */}
                {/* ========================================================================= */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500/10 via-background to-card border border-amber-500/20 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                                        AI-Assisted Ingestion &amp; Governance
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">• Super Admin Final Authority</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                                    Academic Calendar Import
                                </h1>
                                <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mt-1.5 leading-relaxed">
                                    Convert official institutional academic calendars into structured OfficeHub events without manual date entry. 
                                    Gemini interprets, categorizes, and normalizes candidate dates, while Laravel enforces strict governance, duplicate detection, and scheduling effect rules.
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href="/schedule/calendar"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-background hover:bg-muted border border-border transition-all cursor-pointer shadow-2xs"
                            >
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>Official Calendar</span>
                            </Link>

                            <Button
                                onClick={() => setActiveTab('upload')}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs gap-2 transition-all cursor-pointer"
                            >
                                <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                                <span>Upload Calendar</span>
                            </Button>
                        </div>
                    </div>

                    {/* Architectural Steps Micro-Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center shrink-0 text-[11px]">1</span>
                            <span className="text-muted-foreground font-medium">Upload Official File</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center shrink-0 text-[11px]">2</span>
                            <span className="text-muted-foreground font-medium">Gemini Document Parsing</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center shrink-0 text-[11px]">3</span>
                            <span className="text-muted-foreground font-medium">Laravel Period Validation</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-[11px]">4</span>
                            <span className="text-muted-foreground font-medium">Super Admin Approval</span>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. KPI METRICS & STATS CARDS                                              */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Detected</div>
                        <div className="text-2xl font-black text-foreground mt-1">{stats.total_detected}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Gemini Extracted</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Valid Ready</div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.valid_count}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Passed Period Rules</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Needs Attention</div>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.needs_attention_count}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Vague / Incomplete</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
                        <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Duplicates</div>
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{stats.duplicates_count}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Existing in Calendar</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
                        <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Approved</div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.approved_count}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Promoted to Calendar</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Rejected</div>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.rejected_count}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Declined by Admin</div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. NAVIGATION TABS                                                        */}
                {/* ========================================================================= */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-3">
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60">
                        <button
                            type="button"
                            onClick={() => setActiveTab('queue')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                                activeTab === 'queue'
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Import Review Queue</span>
                            <Badge className="bg-white/20 text-white text-[10px] px-1.5 py-0 h-4">
                                {events.filter((e) => e.status === 'pending').length}
                            </Badge>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                                activeTab === 'upload'
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Document</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('rules')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                                activeTab === 'rules'
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Import Rules &amp; Effects</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                                activeTab === 'history'
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>Batch History &amp; Rollback</span>
                        </button>
                    </div>

                    {/* Active Batch Summary Tag & Switcher */}
                    {currentBatch && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-foreground">Current Batch:</span>
                            <div className="relative inline-flex items-center">
                                <select
                                    value={currentBatch.id}
                                    onChange={(e) => {
                                        router.get(`/schedule/calendar-import?batch_id=${e.target.value}`, {}, { preserveState: false });
                                    }}
                                    className="h-8 pl-2.5 pr-7 py-1 text-xs font-mono font-bold rounded-xl border border-border bg-background text-foreground cursor-pointer focus:ring-1 focus:ring-amber-500"
                                >
                                    {batches.data.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            #{b.id} • {b.original_filename} ({b.detected_count} events)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: IMPORT REVIEW QUEUE                                                */}
                {/* ========================================================================= */}
                {activeTab === 'queue' && (
                    <div className="flex flex-col gap-4">
                        {/* Queue Filter & Bulk Actions Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border shadow-2xs">
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Search */}
                                <div className="relative w-64">
                                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Filter title or source text..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-9 pl-9 text-xs rounded-xl"
                                    />
                                </div>

                                {/* Category Filter */}
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="examination">Examinations</option>
                                    <option value="holiday">Holidays</option>
                                    <option value="faculty_deadline">Faculty Deadlines</option>
                                    <option value="grade_submission">Grade Submissions</option>
                                    <option value="enrollment">Enrollment</option>
                                    <option value="university_activity">University Activities</option>
                                    <option value="college_activity">College Activities</option>
                                </select>

                                {/* Validation Filter */}
                                <select
                                    value={filterValidation}
                                    onChange={(e) => setFilterValidation(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer"
                                >
                                    <option value="all">All Validation States</option>
                                    <option value="valid">Valid (Ready)</option>
                                    <option value="needs_attention">Needs Attention</option>
                                    <option value="duplicate">Duplicates</option>
                                    <option value="out_of_period">Out of Period</option>
                                </select>
                            </div>

                            {/* Batch Control & Selection Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllValid}
                                    className="h-9 rounded-xl text-xs font-bold bg-background border-border hover:bg-muted"
                                >
                                    Select All Valid ({filteredEvents.filter((e) => e.validation_status === 'valid' && e.status === 'pending').length})
                                </Button>

                                {selectedEventIds.length > 0 && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearSelection}
                                            className="h-9 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Clear ({selectedEventIds.length})
                                        </Button>

                                        <Button
                                            size="sm"
                                            onClick={handleBulkApprove}
                                            className="h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                                        >
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            <span>Bulk Approve Selected ({selectedEventIds.length})</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Provenance Context Banner */}
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs text-muted-foreground">
                            <Info className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>
                                <strong>Human Approval Governance:</strong> Gemini extracted these candidate records with provenance links to the uploaded document. Ambiguous entries and duplicates remain unselected until manually resolved or edited by the Super Admin.
                            </span>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                                            <th className="py-3 px-3 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEventIds.length > 0 && selectedEventIds.length === filteredEvents.filter((e) => e.validation_status === 'valid' && e.status === 'pending').length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) handleSelectAllValid();
                                                        else handleClearSelection();
                                                    }}
                                                    className="rounded border-border text-amber-500 focus:ring-amber-500"
                                                />
                                            </th>
                                            <th className="py-3 px-3">Event Title &amp; Source Provenance</th>
                                            <th className="py-3 px-3">Dates &amp; Semester</th>
                                            <th className="py-3 px-3">Category</th>
                                            <th className="py-3 px-3">Gemini Confidence</th>
                                            <th className="py-3 px-3">Validation Status</th>
                                            <th className="py-3 px-3">Proposed Scheduling Effect</th>
                                            <th className="py-3 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {filteredEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                                    <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                                                    <div className="font-bold text-foreground">No events found matching current criteria.</div>
                                                    <div className="text-xs mt-1">Try resetting filters or uploading a new official academic calendar.</div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEvents.map((ev) => {
                                                const isSelected = selectedEventIds.includes(ev.id);
                                                const isApproved = ev.status === 'approved';
                                                const isRejected = ev.status === 'rejected';

                                                return (
                                                    <tr
                                                        key={ev.id}
                                                        className={cn(
                                                            'hover:bg-muted/30 transition-colors',
                                                            isSelected && 'bg-amber-500/5 dark:bg-amber-500/10',
                                                            isApproved && 'opacity-70 bg-emerald-500/5',
                                                            isRejected && 'opacity-50 bg-rose-500/5 line-through'
                                                        )}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="py-3 px-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                disabled={ev.status !== 'pending' || ev.validation_status === 'needs_attention'}
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectEvent(ev.id)}
                                                                className="rounded border-border text-amber-500 focus:ring-amber-500 disabled:opacity-40"
                                                            />
                                                        </td>

                                                        {/* Title & Source Text */}
                                                        <td className="py-3 px-3 max-w-xs">
                                                            <div className="font-bold text-foreground leading-tight">{ev.title}</div>
                                                            {ev.source_text && (
                                                                <div className="text-[11px] text-muted-foreground/90 font-mono mt-1 bg-muted/60 px-2 py-1 rounded-md border border-border/40 inline-block line-clamp-1" title={ev.source_text}>
                                                                    "{ev.source_text}"
                                                                </div>
                                                            )}
                                                            {ev.description && (
                                                                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ev.description}</div>
                                                            )}
                                                        </td>

                                                        {/* Dates */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <div className="font-semibold text-foreground">
                                                                {ev.start_date ? (
                                                                    <>
                                                                        {ev.start_date}
                                                                        {ev.end_date && ev.end_date !== ev.start_date && ` to ${ev.end_date}`}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-amber-600 dark:text-amber-400 font-bold italic">Unspecified (Vague Date)</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground mt-0.5">{ev.semester || 'Academic Year'}</div>
                                                        </td>

                                                        {/* Category */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            {getCategoryBadge(ev.category)}
                                                        </td>

                                                        {/* Confidence */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                                                <span className={cn(
                                                                    'font-bold',
                                                                    ev.confidence_score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                                                )}>
                                                                    {ev.confidence_score}%
                                                                </span>
                                                            </div>
                                                            {ev.ai_reasoning && (
                                                                <div className="text-[10px] text-muted-foreground max-w-xs truncate" title={ev.ai_reasoning}>
                                                                    {ev.ai_reasoning}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Validation */}
                                                        <td className="py-3 px-3">
                                                            <div>{getValidationBadge(ev.validation_status)}</div>
                                                            {ev.validation_notes && (
                                                                <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2 max-w-xs" title={ev.validation_notes}>
                                                                    {ev.validation_notes}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Scheduling Effect */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            {getSchedulingEffectLabel(ev.confirmed_scheduling_effect || ev.proposed_scheduling_effect)}
                                                        </td>

                                                        {/* Row Actions */}
                                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1">
                                                                {ev.status === 'pending' ? (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => openEditModal(ev)}
                                                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                            title="Edit Details"
                                                                        >
                                                                            <Edit3 className="w-3.5 h-3.5" />
                                                                        </Button>

                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleSingleReject(ev)}
                                                                            className="h-8 w-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                                                            title="Reject Record"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>

                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleSingleApprove(ev)}
                                                                            className="h-8 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white gap-1"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                            <span>Approve</span>
                                                                        </Button>
                                                                    </>
                                                                ) : isApproved ? (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 mr-1">
                                                                        <Check className="w-3.5 h-3.5" /> Approved
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 mr-1">
                                                                        <X className="w-3.5 h-3.5" /> Rejected
                                                                    </span>
                                                                )}

                                                                {/* Delete Action (User request: allow deletion of a specific event) */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => promptDeleteEvent(ev)}
                                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                                                    title="Delete Event"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: UPLOAD DOCUMENT FORM                                               */}
                {/* ========================================================================= */}
                {activeTab === 'upload' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center gap-3 pb-5 border-b border-border">
                                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Upload Official Academic Calendar</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Upload official PDF, DOCX, XLSX, CSV, or document scan for Gemini intelligent ingestion.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-5 mt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Academic Period Selector */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-foreground">Academic Year</label>
                                        <select
                                            value={uploadData.academic_year}
                                            onChange={(e) => setUploadData('academic_year', e.target.value)}
                                            className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                                        >
                                            <option value="AY 2026–2027">AY 2026–2027 (Current Active)</option>
                                            <option value="AY 2025–2026">AY 2025–2026 (Historical)</option>
                                            <option value="AY 2027–2028">AY 2027–2028 (Upcoming Planning)</option>
                                        </select>
                                        {uploadErrors.academic_year && <span className="text-xs text-rose-500">{uploadErrors.academic_year}</span>}
                                    </div>

                                    {/* Scope */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-foreground">Semester Scope</label>
                                        <select
                                            value={uploadData.semester_scope}
                                            onChange={(e) => setUploadData('semester_scope', e.target.value)}
                                            className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                                        >
                                            <option value="Whole Academic Year">Whole Academic Year (Annual Calendar)</option>
                                            <option value="1st Semester">1st Semester Only</option>
                                            <option value="2nd Semester">2nd Semester Only</option>
                                            <option value="Summer">Summer Term Only</option>
                                        </select>
                                        {uploadErrors.semester_scope && <span className="text-xs text-rose-500">{uploadErrors.semester_scope}</span>}
                                    </div>
                                </div>

                                {/* Institution */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-foreground">Collegiate / University Unit</label>
                                    <Input
                                        value={uploadData.institution}
                                        onChange={(e) => setUploadData('institution', e.target.value)}
                                        placeholder="e.g. CIDS - College of Information and Computing Sciences"
                                        className="h-10 text-xs rounded-xl"
                                    />
                                    {uploadErrors.institution && <span className="text-xs text-rose-500">{uploadErrors.institution}</span>}
                                </div>

                                {/* File Dropzone */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground">Source Document</label>
                                        {uploadData.calendar_file && (
                                            <span className="text-[11px] text-muted-foreground font-medium">
                                                {(uploadData.calendar_file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDraggingOver(true);
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            setIsDraggingOver(false);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDraggingOver(false);
                                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                setUploadData('calendar_file', e.dataTransfer.files[0]);
                                                clearErrors('calendar_file');
                                                setUploadErrorMessage(null);
                                            }
                                        }}
                                        className={cn(
                                            'border-2 border-dashed transition-all rounded-2xl p-6 sm:p-8 text-center',
                                            isDraggingOver
                                                ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                                                : uploadData.calendar_file
                                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                                : 'border-border/80 hover:border-amber-500/60 bg-muted/20'
                                        )}
                                    >
                                        <input
                                            type="file"
                                            id="file-upload"
                                            accept=".pdf,.docx,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setUploadData('calendar_file', e.target.files[0]);
                                                    clearErrors('calendar_file');
                                                    setUploadErrorMessage(null);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        {uploadData.calendar_file ? (
                                            <div className="flex flex-col items-center">
                                                <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <div className="text-sm font-bold text-foreground max-w-md truncate">
                                                    {uploadData.calendar_file.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="outline" className="text-[11px] font-mono text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                                                        {(uploadData.calendar_file.size / 1024).toFixed(1)} KB Ready
                                                    </Badge>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setUploadData('calendar_file', null);
                                                        }}
                                                        className="text-xs text-rose-500 hover:text-rose-600 underline font-medium cursor-pointer ml-1"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
                                                    <UploadCloud className="w-7 h-7" />
                                                </div>
                                                <div className="text-sm font-bold text-foreground">
                                                    Click to choose official calendar file or drop here
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Supported formats: PDF, DOCX, XLSX, CSV, PNG, JPG (up to 20MB)
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                    {uploadErrors.calendar_file && <span className="text-xs text-rose-500 font-semibold">{uploadErrors.calendar_file}</span>}
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isUploading || !uploadData.calendar_file}
                                        className="w-full sm:w-auto h-11 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Gemini Extracting &amp; Interpreting Dates...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                                                <span>Ingest &amp; Extract with Gemini</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Side Guidance Card */}
                        <div className="flex flex-col gap-4">
                            <div className="p-6 rounded-3xl bg-card border border-border shadow-2xs">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    Authoritative Source Guarantee
                                </h3>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    OfficeHub retains the original binary file forever as the primary legal audit source. Every parsed event maintains a reference snippet to the exact line in the uploaded document.
                                </p>
                            </div>

                            <div className="p-6 rounded-3xl bg-card border border-border shadow-2xs">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Ambiguity Detection Engine
                                </h3>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    Vague statements like <em>"Second week of November – Research Week"</em> are intentionally flagged as <strong>Needs Attention</strong> rather than allowing the AI to invent unverified dates.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: REUSABLE IMPORT RULES                                              */}
                {/* ========================================================================= */}
                {activeTab === 'rules' && (
                    <div className="flex flex-col gap-4">
                        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Reusable Institutional Scheduling Rules</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Configure automatic scheduling effect mappings for categories. These rules inform Gemini's proposed recommendations while Super Admins retain manual override control.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rules.map((rule) => (
                                <div key={rule.id} className="p-5 rounded-2xl bg-card border border-border shadow-2xs flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant="outline" className="text-xs font-bold capitalize">
                                                {rule.event_category.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                Active Rule
                                            </span>
                                        </div>

                                        <div className="mt-3">
                                            <div className="text-xs font-bold text-muted-foreground">Default Proposed Effect:</div>
                                            <div className="mt-1">{getSchedulingEffectLabel(rule.default_scheduling_effect)}</div>
                                        </div>

                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {rule.description}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Target Module:</span>
                                        <span className="font-semibold text-foreground">{rule.suggested_destination_module}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: IMPORT BATCH HISTORY & ROLLBACK                                     */}
                {/* ========================================================================= */}
                {activeTab === 'history' && (
                    <div className="flex flex-col gap-4">
                        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Academic Calendar Import Batches</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Audit past uploads, review detection counts, track approving administrators, and perform controlled rollbacks.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                                        <th className="py-3 px-4">Batch ID</th>
                                        <th className="py-3 px-4">Academic Year &amp; Scope</th>
                                        <th className="py-3 px-4">Uploaded File</th>
                                        <th className="py-3 px-4 text-center">Detected</th>
                                        <th className="py-3 px-4 text-center">Approved</th>
                                        <th className="py-3 px-4 text-center">Rejected</th>
                                        <th className="py-3 px-4 text-center">Ambiguous</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {batches.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/30">
                                            <td className="py-3 px-4 font-mono font-bold">#{b.id}</td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-foreground">{b.academic_year}</div>
                                                <div className="text-[11px] text-muted-foreground">{b.semester_scope}</div>
                                            </td>
                                            <td className="py-3 px-4 max-w-xs truncate">
                                                <div className="font-medium text-foreground">{b.original_filename}</div>
                                                <div className="text-[10px] text-muted-foreground">{b.file_type.toUpperCase()} • {Math.round(b.file_size_bytes / 1024)} KB</div>
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold">{b.detected_count}</td>
                                            <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{b.approved_count}</td>
                                            <td className="py-3 px-4 text-center font-bold text-rose-600 dark:text-rose-400">{b.rejected_count}</td>
                                            <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">{b.needs_attention_count}</td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {b.status === 'rolled_back' ? (
                                                    <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">Rolled Back</Badge>
                                                ) : b.approved_count > 0 ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Processed</Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending Review</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2">
                                                    <Link
                                                        href={`/schedule/calendar-import?batch_id=${b.id}`}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground"
                                                    >
                                                        View Queue
                                                    </Link>

                                                    {b.approved_count > 0 && b.status !== 'rolled_back' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRollbackBatch(b)}
                                                            className="h-7 px-2 text-xs font-bold text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            <span>Rollback</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* EDIT EVENT MODAL                                                          */}
            {/* ========================================================================= */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Edit Candidate Calendar Event</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Resolve vague dates, correct titles, or adjust scheduling effects before approving into the official calendar.
                        </DialogDescription>
                    </DialogHeader>

                    {editingEvent && (
                        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 mt-2">
                            {editingEvent.source_text && (
                                <div className="p-3 rounded-xl bg-muted/60 border border-border/80 text-xs">
                                    <div className="font-bold text-muted-foreground text-[10px] uppercase">Authoritative Source Snippet</div>
                                    <div className="font-mono mt-0.5 text-foreground">"{editingEvent.source_text}"</div>
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-foreground">Event Title</label>
                                <Input
                                    value={editForm.title}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                                    className="h-9 text-xs rounded-xl"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-foreground">Category</label>
                                    <select
                                        value={editForm.category}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                                        className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                                    >
                                        <option value="examination">Examination</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="faculty_deadline">Faculty Deadline</option>
                                        <option value="grade_submission">Grade Submission</option>
                                        <option value="enrollment">Enrollment</option>
                                        <option value="university_activity">University Activity</option>
                                        <option value="college_activity">College Activity</option>
                                        <option value="academic_milestone">Academic Milestone</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-foreground">Semester</label>
                                    <select
                                        value={editForm.semester}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, semester: e.target.value }))}
                                        className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                                    >
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                        <option value="Whole Academic Year">Whole Academic Year</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-foreground">Start Date</label>
                                    <Input
                                        type="date"
                                        value={editForm.start_date}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, start_date: e.target.value }))}
                                        className="h-9 text-xs rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-foreground">End Date</label>
                                    <Input
                                        type="date"
                                        value={editForm.end_date}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, end_date: e.target.value }))}
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-foreground">Scheduling Effect</label>
                                <select
                                    value={editForm.proposed_scheduling_effect}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, proposed_scheduling_effect: e.target.value }))}
                                    className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground"
                                >
                                    <option value="INFORMATIONAL">INFORMATIONAL (Purely Informational, No Class Block)</option>
                                    <option value="BLOCK_ALL_CLASSES">BLOCK_ALL_CLASSES (Holiday / Recess Block in Scheduler)</option>
                                    <option value="CALENDAR_TV_RESTRICTION">CALENDAR_TV_RESTRICTION (Exam Week Constraint &amp; TV)</option>
                                    <option value="CALENDAR_REMINDER">CALENDAR_REMINDER (Faculty Deadline / Compliance)</option>
                                    <option value="CALENDAR_TV_DISPLAY">CALENDAR_TV_DISPLAY (Prominent TV Display &amp; Calendar)</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-foreground">Description / Notes</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-hidden"
                                />
                            </div>

                            <DialogFooter className="pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                    className="rounded-xl text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save &amp; Mark Valid</span>
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={!!rollingBackBatch}
                onOpenChange={(open) => !open && setRollingBackBatch(null)}
                title="Rollback Import Batch"
                description="Are you sure you want to rollback this import batch? All official calendar events created and approved by this batch will be safely unlinked and removed."
                itemName={rollingBackBatch ? `${rollingBackBatch.original_filename} (${rollingBackBatch.academic_year} — ${rollingBackBatch.semester_scope})` : undefined}
                confirmLabel="Rollback Batch"
                isDeleting={isRollingBack}
                onConfirm={confirmRollbackBatch}
            />

            <DeleteConfirmDialog
                open={!!deletingEvent}
                onOpenChange={(open) => !open && setDeletingEvent(null)}
                title="Delete Calendar Event"
                description="Are you sure you want to delete this event from the import queue? This will permanently remove the record."
                itemName={deletingEvent ? `${deletingEvent.title} (${deletingEvent.start_date || 'Unspecified'})` : undefined}
                confirmLabel="Delete Event"
                isDeleting={isDeletingEvent}
                onConfirm={confirmDeleteEvent}
            />
        </AppLayout>
    );
}
