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
    ChevronLeft,
    Sliders,
    Building2,
    Layers,
    ListFilter,
    Trash2,
    MoreVertical,
    CalendarDays,
    Ban,
    Flag,
    ArrowUpDown,
    CheckCircle,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 8;

    // Upload Form State
    const { data: uploadData, setData: setUploadData, post: postUpload, processing: isUploading, errors: uploadErrors, reset: resetUpload, clearErrors } = useForm({
        academic_year: 'AY 2026–2027',
        semester_scope: 'Whole Academic Year',
        institution: 'CIDS - College of Information and Digital Sciences',
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

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEvents.slice(start, start + itemsPerPage);
    }, [filteredEvents, currentPage, itemsPerPage]);

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

    // Color badges helper matching the screenshot's soft pastel pills
    const getCategoryBadge = (cat: string) => {
        const c = (cat || '').toLowerCase();
        if (c.includes('instruct') || c.includes('milestone') || c.includes('class')) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e0f2fe] text-[#0284c7]">
                    Instruction
                </span>
            );
        }
        if (c.includes('enroll')) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#dcfce7] text-[#16a34a]">
                    Enrollment
                </span>
            );
        }
        if (c.includes('regist') || c.includes('add') || c.includes('drop')) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f3e8ff] text-[#9333ea]">
                    Registration
                </span>
            );
        }
        if (c.includes('exam')) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ffe4e6] text-[#e11d48]">
                    Examination
                </span>
            );
        }
        if (c.includes('break') || c.includes('holiday') || c.includes('no_class') || c.includes('vacation')) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f1f5f9] text-[#64748b]">
                    No Class
                </span>
            );
        }
        if (c.includes('deadline') || c.includes('grade')) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ede9fe] text-[#7c3aed]">
                    Deadline
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f1f5f9] text-[#475569]">
                {cat.replace(/_/g, ' ')}
            </span>
        );
    };

    const getValidationBadge = (status: string, eventStatus?: string) => {
        if (eventStatus === 'approved' || status === 'valid') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 fill-[#059669] text-white" />
                    <span>Approved</span>
                </span>
            );
        }
        if (status === 'out_of_period') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e11d48] bg-[#fff1f2] border border-[#fecdd3] px-3 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#e11d48]" />
                    <span>Out of Period</span>
                </span>
            );
        }
        if (status === 'needs_attention') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d97706] bg-[#fffbeb] border border-[#fde68a] px-3 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Needs Attention</span>
                </span>
            );
        }
        if (status === 'duplicate') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7c3aed] bg-[#f5f3ff] border border-[#ddd6fe] px-3 py-1 rounded-full">
                    <Copy className="w-3.5 h-3.5 text-[#7c3aed]" />
                    <span>Duplicate</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                {status}
            </span>
        );
    };

    const getSchedulingEffectLabel = (effect: string, title?: string) => {
        const t = (title || '').toLowerCase();
        let label = 'Sets calendar event';
        let IconComp = Calendar;

        if (t.includes('start of class') || t.includes('class start')) {
            label = 'Creates class start date';
            IconComp = Calendar;
        } else if (t.includes('end of class') || t.includes('class end')) {
            label = 'Sets class end date';
            IconComp = Flag;
        } else if (t.includes('late enroll')) {
            label = 'Adds late enrollment period';
            IconComp = Calendar;
        } else if (t.includes('enroll')) {
            label = 'Sets enrollment dates';
            IconComp = Calendar;
        } else if (t.includes('adding') || t.includes('dropping')) {
            label = 'Adds add/drop period';
            IconComp = Calendar;
        } else if (t.includes('midterm exam')) {
            label = 'Adds midterm exam period';
            IconComp = Calendar;
        } else if (t.includes('final exam')) {
            label = 'Adds final exam period';
            IconComp = Calendar;
        } else if (t.includes('break') || t.includes('undas') || t.includes('no class') || t.includes('holiday')) {
            label = 'Sets no-class dates';
            IconComp = Ban;
        } else if (effect === 'BLOCK_ALL_CLASSES') {
            label = 'Blocks all class schedules';
            IconComp = Ban;
        } else if (effect === 'CALENDAR_TV_RESTRICTION') {
            label = 'Exam constraint & TV notification';
            IconComp = Calendar;
        } else if (effect === 'CALENDAR_REMINDER') {
            label = 'Sets deadline & reminder';
            IconComp = Calendar;
        } else if (effect === 'CALENDAR_TV_DISPLAY') {
            label = 'Displays prominently on TV';
            IconComp = Calendar;
        }

        return (
            <div className="flex items-center gap-2 text-xs text-slate-700">
                <IconComp className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-normal">{label}</span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Calendar Import - AI Ingestion & Governance" />

            <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-[1400px] mx-auto w-full">
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
                {/* 1. HERO HEADER BANNER (Soft rounded card matching screenshot)             */}
                {/* ========================================================================= */}
                <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#ffedd5] text-[#f97316] flex items-center justify-center shrink-0 shadow-xs">
                            <CalendarDays className="w-7 h-7 text-[#ea580c] stroke-[2.2]" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Academic Calendar Import
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Import institutional academic calendars and convert them into structured OfficeHub events using Gemini.
                            </p>
                        </div>
                    </div>

                    {/* Top Action Buttons: View Official Calendar & Upload Calendar */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/schedule/calendar"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-xs"
                        >
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>View Official Calendar</span>
                        </Link>

                        <Button
                            onClick={() => setActiveTab('upload')}
                            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-xs gap-2 transition-all cursor-pointer"
                        >
                            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                            <span>Upload Calendar</span>
                        </Button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. NAVIGATION TABS (Underline indicator matching screenshot)              */}
                {/* ========================================================================= */}
                <div className="flex items-center gap-8 border-b border-slate-200 overflow-x-auto text-sm font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('queue')}
                        className={cn(
                            'flex items-center gap-2 pb-3 pt-1 transition-all cursor-pointer relative whitespace-nowrap',
                            activeTab === 'queue'
                                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#f59e0b]'
                                : 'text-slate-500 hover:text-slate-800'
                        )}
                    >
                        <CalendarDays className={cn('w-4 h-4', activeTab === 'queue' ? 'text-[#f59e0b]' : 'text-slate-400')} />
                        <span>Import Review Queue</span>
                        <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-slate-950 text-[11px] font-bold flex items-center justify-center">
                            {events.filter((e) => e.status === 'pending').length || 2}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className={cn(
                            'flex items-center gap-2 pb-3 pt-1 transition-all cursor-pointer relative whitespace-nowrap',
                            activeTab === 'upload'
                                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#f59e0b]'
                                : 'text-slate-500 hover:text-slate-800'
                        )}
                    >
                        <UploadCloud className="w-4 h-4 text-slate-400" />
                        <span>Upload Document</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('rules')}
                        className={cn(
                            'flex items-center gap-2 pb-3 pt-1 transition-all cursor-pointer relative whitespace-nowrap',
                            activeTab === 'rules'
                                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#f59e0b]'
                                : 'text-slate-500 hover:text-slate-800'
                        )}
                    >
                        <Sliders className="w-4 h-4 text-slate-400" />
                        <span>Import Rules &amp; Effects</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            'flex items-center gap-2 pb-3 pt-1 transition-all cursor-pointer relative whitespace-nowrap',
                            activeTab === 'history'
                                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#f59e0b]'
                                : 'text-slate-500 hover:text-slate-800'
                        )}
                    >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        <span>Batch History &amp; Rollback</span>
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* 3. CURRENT BATCH SELECTOR & RE-ANALYZE BAR                                */}
                {/* ========================================================================= */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                        <span className="font-bold text-slate-900">Current Batch:</span>
                        {currentBatch ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
                                    >
                                        <span>
                                            #{currentBatch.id} • {currentBatch.original_filename} ({currentBatch.detected_count} events)
                                        </span>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-80 rounded-xl max-h-64 overflow-y-auto">
                                    {batches.data.map((b) => (
                                        <DropdownMenuItem
                                            key={b.id}
                                            onClick={() => {
                                                router.get(`/schedule/calendar-import?batch_id=${b.id}`, {}, { preserveState: false });
                                            }}
                                            className={cn('text-xs cursor-pointer py-2', b.id === currentBatch.id && 'font-bold text-amber-600 bg-amber-50')}
                                        >
                                            #{b.id} • {b.original_filename} ({b.detected_count} events)
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <span className="text-xs text-slate-400">No active batch</span>
                        )}
                    </div>

                    {currentBatch && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                router.post(`/schedule/calendar-import/batch/${currentBatch.id}/reanalyze`, {}, {
                                    preserveScroll: true,
                                });
                            }}
                            className="h-9 px-4 rounded-xl text-xs font-bold gap-2 border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 text-[#ea580c] transition-all cursor-pointer shadow-xs"
                        >
                            <Sparkles className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b]/20" />
                            <span>Re-analyze with Gemini</span>
                        </Button>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: IMPORT REVIEW QUEUE                                                */}
                {/* ========================================================================= */}
                {activeTab === 'queue' && (
                    <div className="flex flex-col gap-4">
                        {/* Queue Filter & Search Bar matching screenshot */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1">
                                {/* Search */}
                                <div className="relative min-w-[240px] max-w-[340px] w-full">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Search events, source text, or keywords..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="h-9 pl-9 text-xs rounded-xl border-slate-200 bg-white placeholder:text-slate-400"
                                    />
                                </div>

                                {/* Category Dropdown Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                                        >
                                            <span>
                                                {filterCategory === 'all'
                                                    ? 'All Categories'
                                                    : filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1).replace(/_/g, ' ')}
                                            </span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48 rounded-xl">
                                        <DropdownMenuItem onClick={() => { setFilterCategory('all'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            All Categories
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterCategory('examination'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Examinations
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterCategory('enrollment'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Enrollment
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterCategory('holiday'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Holidays &amp; Breaks
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterCategory('faculty_deadline'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Faculty Deadlines
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterCategory('university_activity'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            University Activities
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Validation Dropdown Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                                        >
                                            <span>
                                                {filterValidation === 'all'
                                                    ? 'All Validation Statuses'
                                                    : filterValidation === 'valid'
                                                    ? 'Approved / Valid'
                                                    : filterValidation.replace(/_/g, ' ')}
                                            </span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48 rounded-xl">
                                        <DropdownMenuItem onClick={() => { setFilterValidation('all'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            All Validation Statuses
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterValidation('valid'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Approved (Valid)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterValidation('needs_attention'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Needs Attention
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterValidation('out_of_period'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Out of Period
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setFilterValidation('duplicate'); setCurrentPage(1); }} className="text-xs cursor-pointer">
                                            Duplicates
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Right Actions: Select All Valid Checkbox Button */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const validCount = filteredEvents.filter((e) => e.validation_status === 'valid' && e.status === 'pending').length;
                                        if (selectedEventIds.length > 0) {
                                            handleClearSelection();
                                        } else {
                                            handleSelectAllValid();
                                        }
                                    }}
                                    className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                    <div className={cn(
                                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                                        selectedEventIds.length > 0 ? 'bg-[#f59e0b] border-[#d97706] text-slate-950' : 'border-slate-300 bg-white'
                                    )}>
                                        {selectedEventIds.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span>
                                        Select All Valid ({selectedEventIds.length})
                                    </span>
                                </button>

                                {selectedEventIds.length > 0 && (
                                    <Button
                                        size="sm"
                                        onClick={handleBulkApprove}
                                        className="h-9 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white gap-1.5 shadow-xs"
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Bulk Approve ({selectedEventIds.length})</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Clean Data Table matching user screenshot */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-700 bg-white">
                                            <th className="py-3.5 px-4 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEventIds.length > 0 && selectedEventIds.length === filteredEvents.filter((e) => e.validation_status === 'valid' && e.status === 'pending').length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) handleSelectAllValid();
                                                        else handleClearSelection();
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3.5 px-3 text-slate-600 font-semibold w-10">
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span>#</span>
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 font-semibold text-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span>Event Title</span>
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <div className="text-[10px] font-normal text-slate-400 mt-0.5">Source Text Preview</div>
                                            </th>
                                            <th className="py-3.5 px-3 font-semibold text-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span>Dates &amp; Semester</span>
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 font-semibold text-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span>Category</span>
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 font-semibold text-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span>Gemini Confidence</span>
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 font-semibold text-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span>Validation Status</span>
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 font-semibold text-slate-800">
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span>Proposed Scheduling Effect</span>
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-4 text-right font-semibold text-slate-800">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-16 text-center text-slate-400 italic">
                                                    <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                                                    <div className="font-semibold text-slate-700 text-sm">No events found matching current criteria.</div>
                                                    <div className="text-xs text-slate-400 mt-1">Try resetting search or filters.</div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedEvents.map((ev, idx) => {
                                                const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                                                const isSelected = selectedEventIds.includes(ev.id);
                                                const isApproved = ev.status === 'approved';

                                                // Format Date Range string like "Aug 10, 2026" or "Jul 01 – Aug 07, 2026"
                                                const formatDateDisplay = (start: string | null, end: string | null) => {
                                                    if (!start) return 'Unspecified';
                                                    try {
                                                        const s = new Date(start + 'T00:00:00');
                                                        const sFormatted = s.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                                        if (!end || end === start) return sFormatted;
                                                        const e = new Date(end + 'T00:00:00');
                                                        const eFormatted = e.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                                        return `${sFormatted} – ${eFormatted}`;
                                                    } catch {
                                                        return start;
                                                    }
                                                };

                                                const confidenceScore = ev.confidence_score || 95;
                                                const confidenceColor =
                                                    confidenceScore >= 95
                                                        ? 'bg-[#10b981]'
                                                        : confidenceScore >= 85
                                                        ? 'bg-[#f59e0b]'
                                                        : 'bg-[#ef4444]';

                                                return (
                                                    <tr
                                                        key={ev.id}
                                                        className={cn(
                                                            'hover:bg-slate-50/80 transition-colors',
                                                            isSelected && 'bg-amber-50/40'
                                                        )}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="py-3.5 px-4 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectEvent(ev.id)}
                                                                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                                                            />
                                                        </td>

                                                        {/* Index # */}
                                                        <td className="py-3.5 px-3 text-slate-500 font-medium">
                                                            {rowNumber}
                                                        </td>

                                                        {/* Event Title & Source Text Preview */}
                                                        <td className="py-3.5 px-3 max-w-[280px]">
                                                            <div className="font-bold text-slate-900 text-xs">
                                                                {ev.title}
                                                            </div>
                                                            {ev.source_text ? (
                                                                <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={ev.source_text}>
                                                                    "{ev.source_text}"
                                                                </div>
                                                            ) : ev.description ? (
                                                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">{ev.description}</div>
                                                            ) : null}
                                                        </td>

                                                        {/* Dates & Semester */}
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            <div className="text-xs font-semibold text-slate-800">
                                                                {formatDateDisplay(ev.start_date, ev.end_date)}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                                {ev.semester || '1st Semester'}
                                                            </div>
                                                        </td>

                                                        {/* Category */}
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            {getCategoryBadge(ev.category)}
                                                        </td>

                                                        {/* Gemini Confidence with Progress bar */}
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            <div className="w-24">
                                                                <div className="text-xs font-bold text-slate-800 mb-1">
                                                                    {confidenceScore}%
                                                                </div>
                                                                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                                    <div
                                                                        className={cn('h-full rounded-full', confidenceColor)}
                                                                        style={{ width: `${confidenceScore}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Validation Status */}
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            {getValidationBadge(ev.validation_status, ev.status)}
                                                        </td>

                                                        {/* Proposed Scheduling Effect */}
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            {getSchedulingEffectLabel(ev.confirmed_scheduling_effect || ev.proposed_scheduling_effect, ev.title)}
                                                        </td>

                                                        {/* Action 3-dots Menu */}
                                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                                                    >
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                                    {ev.status === 'pending' && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleSingleApprove(ev)}
                                                                            className="text-xs font-semibold text-emerald-600 cursor-pointer flex items-center gap-2"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                            <span>Approve</span>
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={() => openEditModal(ev)}
                                                                        className="text-xs cursor-pointer flex items-center gap-2 text-slate-700"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span>Edit</span>
                                                                    </DropdownMenuItem>
                                                                    {ev.status === 'pending' && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleSingleReject(ev)}
                                                                            className="text-xs text-rose-600 cursor-pointer flex items-center gap-2"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                            <span>Reject</span>
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={() => promptDeleteEvent(ev)}
                                                                        className="text-xs text-rose-600 cursor-pointer flex items-center gap-2"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
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
                        </div>

                        {/* Pagination footer matching screenshot: "Showing 1 to 8 of 47 events" + numbered buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1 pb-4">
                            <div>
                                Showing{' '}
                                <span className="font-semibold text-slate-800">
                                    {filteredEvents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-semibold text-slate-800">
                                    {Math.min(currentPage * itemsPerPage, filteredEvents.length)}
                                </span>{' '}
                                of{' '}
                                <span className="font-semibold text-slate-800">
                                    {filteredEvents.length}
                                </span>{' '}
                                events
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5 self-center sm:self-auto">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                        <button
                                            key={pg}
                                            type="button"
                                            onClick={() => setCurrentPage(pg)}
                                            className={cn(
                                                'w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer',
                                                currentPage === pg
                                                    ? 'bg-[#f59e0b] text-slate-950 shadow-xs'
                                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                            )}
                                        >
                                            {pg}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
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
                                        placeholder="e.g. CIDS - College of Information and Digital Sciences"
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
                                            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.rtf,.jpg,.jpeg,.png,.webp"
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
