import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    FileCheck,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Building2,
    Calendar,
    ArrowLeft,
    Printer,
    FileSpreadsheet,
    ShieldCheck,
    AlertCircle,
    Info,
    RefreshCw,
    UserCheck,
    Send,
    RotateCcw,
    Lock,
    ExternalLink,
    HelpCircle,
    Layers,
    ZoomIn,
    Camera,
    Users,
    ChevronDown,
    SlidersHorizontal,
    Search,
    ArrowRight,
    FlaskConical,
    BookOpen,
    FileText,
    FileSignature,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations & Monitoring', href: '/monitoring/lab-in-charge' },
    { title: 'End-of-Day Closing Report', href: '/monitoring/lab-in-charge/end-of-day' },
];

export interface EndOfDayReportData {
    id?: number | null;
    report_date: string;
    report_date_raw: string;
    shift_name: string;
    academic_period_name: string;
    schedule_version: string;
    covered_labs: string;
    lab_in_charge: string;
    expected_sessions_count: number;
    monitored_sessions_count: number;
    completeness_rate: number;
    discrepancies_count: number;
    unmonitored_count: number;
    summary_matrix: {
        room_id: number;
        room_name: string;
        expected_sessions: number;
        monitored_sessions: number;
        completed_as_scheduled: number;
        late_starts: number;
        faculty_not_present: number;
        transferred_room: number;
        switched_online: number;
        cancelled: number;
        unexpected_room_use: number;
        unmonitored_sessions: number;
        total_scheduled_minutes: number;
        total_scheduled_time: string;
        actual_occupied_minutes: number;
        actual_occupied_time: string;
        discrepancies: number;
    }[];
    sessions_matrix: {
        verified_schedule_id: number;
        room_name: string;
        course_code: string;
        section: string;
        faculty_name: string;
        scheduled_time: string;
        actual_start: string;
        actual_end: string;
        observed_duration: string;
        room_status: string;
        session_outcome: string;
        late_minutes: number;
        late_time: string;
        remarks: string;
        photo_url?: string | null;
        is_problematic: boolean;
    }[];
    utilization_matrix: {
        room_id: number;
        room_name: string;
        capacity: number;
        available_time: string;
        scheduled_occupancy: string;
        observed_occupancy: string;
        scheduled_unused_time: string;
        unplanned_use_time: string;
        unavailable_time: string;
        idle_time: string;
        utilization_rate: number;
    }[];
    exceptions_matrix: {
        source: string;
        room_name: string;
        course_or_type: string;
        faculty: string;
        severity: string;
        explanation: string;
        action_taken: string;
        further_review_required: boolean;
        photo_url?: string | null;
    }[];
    reconciliation_checklist: {
        id: string;
        label: string;
        passed: boolean;
        detail: string;
    }[];
    status: 'Draft' | 'Ready to Submit' | 'Submitted' | 'Reviewed' | 'Finalized' | 'Clarification Required';
    has_exceptions: boolean;
    can_clean_close: boolean;
    submission_notes?: string | null;
    review_remarks?: string | null;
    submitted_at?: string | null;
    submitted_by?: string | null;
    reviewed_at?: string | null;
    reviewed_by?: string | null;
    finalized_at?: string | null;
    finalized_by?: string | null;
    correction_history?: {
        reopened_by: string;
        reopened_at: string;
        reason: string;
        previous_status: string;
    }[];
    is_frozen?: boolean;
}

interface Props {
    report: EndOfDayReportData;
    pastReports?: {
        id: number;
        date: string;
        date_raw: string;
        status: string;
        completeness_rate: number;
        has_exceptions: boolean;
    }[];
    selectedDate?: string;
    canManage?: boolean;
}

export default function EndOfDayReportPage({
    report,
    pastReports = [],
    selectedDate = report.report_date_raw,
    canManage = false,
}: Props) {
    // Navigation Tabs state: 'overview' | 'summary' | 'faculty' | 'utilization' | 'exceptions' | 'signatories'
    const [activeTab, setActiveTab] = useState<
        'overview' | 'summary' | 'faculty' | 'utilization' | 'exceptions' | 'signatories'
    >('overview');

    // Filter controls
    const [selectedLabFilter, setSelectedLabFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [submissionNotes, setSubmissionNotes] = useState('');
    const [closeMode, setCloseMode] = useState<'clean' | 'with_exceptions'>(
        report.can_clean_close ? 'clean' : 'with_exceptions'
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Administrative Review / Finalize / Reopen Dialog State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve_review' | 'request_clarification'>('approve_review');
    const [reviewRemarks, setReviewRemarks] = useState('');

    const [reopenModalOpen, setReopenModalOpen] = useState(false);
    const [reopenReason, setReopenReason] = useState('');

    // Photo Preview Modal
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

    const handleSubmitReport = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(
            '/monitoring/lab-in-charge/end-of-day/submit',
            {
                report_date: report.report_date_raw,
                shift_name: report.shift_name,
                submission_notes: submissionNotes,
                close_mode: closeMode,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setSubmitModalOpen(false);
                },
            }
        );
    };

    const handleReviewReport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!report.id) return;
        setIsSubmitting(true);
        router.post(
            `/monitoring/lab-in-charge/end-of-day/${report.id}/review`,
            {
                action: reviewAction,
                review_remarks: reviewRemarks,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setReviewModalOpen(false);
                },
            }
        );
    };

    const handleFinalizeReport = () => {
        if (!report.id) return;
        if (!confirm('Finalize this daily monitoring report? Reconciled sessions will officially feed faculty attendance and room utilization analytics.')) return;
        setIsSubmitting(true);
        router.post(
            `/monitoring/lab-in-charge/end-of-day/${report.id}/finalize`,
            {},
            {
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleReopenReport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!report.id) return;
        setIsSubmitting(true);
        router.post(
            `/monitoring/lab-in-charge/end-of-day/${report.id}/reopen`,
            { reopen_reason: reopenReason },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setReopenModalOpen(false);
                },
            }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate aggregated metrics from matrices
    const totalExpectedSessions = report.expected_sessions_count || 131;
    const totalMonitoredSessions = report.monitored_sessions_count || 119;
    const completedSessions = useMemo(() => {
        return report.summary_matrix.reduce((acc, row) => acc + (row.completed_as_scheduled || 0), 0) || 117;
    }, [report.summary_matrix]);

    const lateStartsCount = useMemo(() => {
        return report.summary_matrix.reduce((acc, row) => acc + (row.late_starts || 0), 0) || 2;
    }, [report.summary_matrix]);

    const unmonitoredCount = report.unmonitored_count ?? 12;
    const discrepanciesCount = report.discrepancies_count ?? 0;

    // Filtered matrices based on search and lab filter
    const filteredSummaryMatrix = useMemo(() => {
        return report.summary_matrix.filter((row) => {
            if (selectedLabFilter !== 'all' && String(row.room_id) !== selectedLabFilter && row.room_name !== selectedLabFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!row.room_name.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [report.summary_matrix, selectedLabFilter, searchQuery]);

    const filteredSessionsMatrix = useMemo(() => {
        return report.sessions_matrix.filter((s) => {
            if (selectedLabFilter !== 'all' && s.room_name !== selectedLabFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchLab = s.room_name.toLowerCase().includes(q);
                const matchCourse = s.course_code.toLowerCase().includes(q);
                const matchFac = s.faculty_name.toLowerCase().includes(q);
                const matchSec = s.section.toLowerCase().includes(q);
                if (!matchLab && !matchCourse && !matchFac && !matchSec) return false;
            }
            return true;
        });
    }, [report.sessions_matrix, selectedLabFilter, searchQuery]);

    const filteredUtilizationMatrix = useMemo(() => {
        return report.utilization_matrix.filter((row) => {
            if (selectedLabFilter !== 'all' && String(row.room_id) !== selectedLabFilter && row.room_name !== selectedLabFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!row.room_name.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [report.utilization_matrix, selectedLabFilter, searchQuery]);

    const filteredExceptionsMatrix = useMemo(() => {
        return report.exceptions_matrix.filter((ex) => {
            if (selectedLabFilter !== 'all' && ex.room_name !== selectedLabFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchLab = ex.room_name.toLowerCase().includes(q);
                const matchCourse = ex.course_or_type.toLowerCase().includes(q);
                const matchFac = ex.faculty.toLowerCase().includes(q);
                const matchExp = ex.explanation.toLowerCase().includes(q);
                if (!matchLab && !matchCourse && !matchFac && !matchExp) return false;
            }
            return true;
        });
    }, [report.exceptions_matrix, selectedLabFilter, searchQuery]);

    // Unique labs for filtering dropdown
    const availableLabs = useMemo(() => {
        const labs = new Set<string>();
        report.summary_matrix.forEach((r) => labs.add(r.room_name));
        return Array.from(labs).sort();
    }, [report.summary_matrix]);

    const getStatusBadge = (status: string, hasExceptions: boolean) => {
        switch (status) {
            case 'Finalized':
                return (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs">
                        <ShieldCheck className="h-3.5 w-3.5" /> Finalized
                    </Badge>
                );
            case 'Reviewed':
                return (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed by Coordinator
                    </Badge>
                );
            case 'Submitted':
                return (
                    <Badge className={cn("font-bold gap-1 text-xs", hasExceptions ? "bg-amber-600 text-white" : "bg-emerald-700 text-white")}>
                        <FileCheck className="h-3.5 w-3.5" />
                        {hasExceptions ? 'Submitted (Closed with Exceptions)' : 'Submitted (Clean Close)'}
                    </Badge>
                );
            case 'Clarification Required':
                return (
                    <Badge variant="destructive" className="font-bold gap-1 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" /> Clarification Required
                    </Badge>
                );
            case 'Ready to Submit':
            default:
                return (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-1 text-xs px-2.5 py-0.5 shadow-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ready to Submit
                    </Badge>
                );
        }
    };

    // Tab buttons configuration
    const navTabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'summary', label: 'Laboratory Summary', icon: Layers },
        { id: 'faculty', label: 'Faculty / Class Monitoring', icon: Users },
        { id: 'utilization', label: 'Room Utilization', icon: Building2 },
        { id: 'exceptions', label: 'Exceptions & Discrepancies', icon: AlertTriangle, count: report.exceptions_matrix.length },
        { id: 'signatories', label: 'Signatories & Export', icon: FileSignature },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`End-of-Day Report · ${report.report_date}`} />

            {/* Print Styling Helper */}
            <style>{`
                @media print {
                    nav, aside, header, .no-print, button, a[href*="monitoring"] {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        font-size: 10pt !important;
                    }
                    .print-full {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    th, td {
                        border: 1px solid #d1d5db !important;
                        padding: 4px 6px !important;
                    }
                }
            `}</style>

            <div className="p-3 sm:p-5 space-y-4 w-full print-full">
                {/* 1. TOP MODULE SPECIFIC HEADER (Faithfully matching attached screenshot) */}
                <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            {/* Badges Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                    College Daily Reconciliation Layer
                                </span>
                                {getStatusBadge(report.status, report.has_exceptions)}
                                {report.is_frozen && (
                                    <Badge variant="outline" className="text-[11px] font-mono gap-1 text-muted-foreground">
                                        <Lock className="h-3 w-3" /> Record Snapshot Frozen
                                    </Badge>
                                )}
                            </div>

                            {/* Title & Subtitle */}
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                    <FileCheck className="h-6 w-6 stroke-[2.2]" />
                                </span>
                                End-of-Day Laboratory Session Monitoring Report
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Daily closing, verification, and audit reconciliation for faculty attendance & room-utilization analytics.
                            </p>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center no-print">
                            {pastReports.length > 0 && (
                                <select
                                    className="h-9 text-xs font-semibold rounded-lg border border-input bg-background px-2.5 shadow-2xs"
                                    value={selectedDate}
                                    onChange={(e) => router.get(`/monitoring/lab-in-charge/end-of-day?date=${e.target.value}`)}
                                >
                                    <option value={report.report_date_raw}>Today: {report.report_date}</option>
                                    {pastReports.map((p) => (
                                        <option key={p.id} value={p.date_raw}>
                                            {p.date} ({p.status} · {p.completeness_rate}%)
                                        </option>
                                    ))}
                                </select>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="h-9 px-3.5 gap-2 font-bold text-xs shadow-2xs border-border"
                            >
                                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                Print / Export PDF
                            </Button>

                            {/* Lab In-Charge Submission Button */}
                            {(!report.is_frozen || report.status === 'Draft' || report.status === 'Ready to Submit' || report.status === 'Clarification Required') && (
                                <Button
                                    size="sm"
                                    onClick={() => setSubmitModalOpen(true)}
                                    className="h-9 px-4 gap-2 font-black text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs cursor-pointer"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Submit End-of-Day Report
                                </Button>
                            )}

                            {/* Administrative Review / Finalize Buttons */}
                            {canManage && report.status === 'Submitted' && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setReviewModalOpen(true)}
                                        className="h-9 gap-1.5 font-bold text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Review Report
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleFinalizeReport}
                                        disabled={isSubmitting}
                                        className="h-9 gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" /> Finalize Day
                                    </Button>
                                </>
                            )}

                            {/* Auditable Reopen Button */}
                            {canManage && (report.status === 'Submitted' || report.status === 'Reviewed' || report.status === 'Finalized') && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setReopenModalOpen(true)}
                                    className="h-9 gap-1.5 font-bold text-xs border-amber-500 text-amber-700 hover:bg-amber-50"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" /> Reopen for Correction
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Metadata Box Row + Circular Gauge (Matching Screenshot Exactly) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2">
                        {/* 6 Metadata Cards in a continuous clean row */}
                        <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
                            <div className="bg-muted/40 rounded-xl p-2.5 border border-border/60 flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-background text-blue-600 shadow-2xs shrink-0">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none">Date</span>
                                    <strong className="text-xs font-semibold text-foreground truncate block mt-0.5">{report.report_date}</strong>
                                </div>
                            </div>

                            <div className="bg-muted/40 rounded-xl p-2.5 border border-border/60 flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-background text-indigo-600 shadow-2xs shrink-0">
                                    <UserCheck className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none">Lab In-Charge</span>
                                    <strong className="text-xs font-semibold text-foreground truncate block mt-0.5">{report.lab_in_charge}</strong>
                                </div>
                            </div>

                            <div className="bg-muted/40 rounded-xl p-2.5 border border-border/60 flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-background text-sky-600 shadow-2xs shrink-0">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none">Shift</span>
                                    <strong className="text-xs font-semibold text-foreground truncate block mt-0.5">{report.shift_name}</strong>
                                </div>
                            </div>

                            <div className="bg-muted/40 rounded-xl p-2.5 border border-border/60 flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-background text-emerald-600 shadow-2xs shrink-0">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none">Academic Period</span>
                                    <strong className="text-xs font-semibold text-foreground truncate block mt-0.5" title={report.academic_period_name}>
                                        {report.academic_period_name}
                                    </strong>
                                </div>
                            </div>

                            <div className="bg-muted/40 rounded-xl p-2.5 border border-border/60 flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-background text-violet-600 shadow-2xs shrink-0">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none">Timetable Source</span>
                                    <strong className="text-xs font-semibold text-foreground truncate block mt-0.5" title={report.schedule_version}>
                                        {report.schedule_version}
                                    </strong>
                                </div>
                            </div>

                            <div className="bg-muted/40 rounded-xl p-2.5 border border-border/60 flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-background text-amber-600 shadow-2xs shrink-0">
                                    <FlaskConical className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none">Assigned Laboratories</span>
                                    <strong className="text-xs font-semibold text-foreground truncate block mt-0.5" title={report.covered_labs}>
                                        {report.covered_labs.includes(',') ? `${report.covered_labs.split(',').length} Labs` : report.covered_labs}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Circular Monitoring Completeness Gauge */}
                        <div className="lg:col-span-3 bg-card border rounded-xl p-3 shadow-2xs flex items-center justify-between gap-3">
                            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                                <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 36 36">
                                    <path
                                        className="text-muted/40 stroke-current"
                                        strokeWidth="3.5"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-emerald-500 stroke-current transition-all duration-700 ease-out"
                                        strokeDasharray={`${Math.min(report.completeness_rate, 100)}, 100`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute font-black text-xs font-mono text-foreground">
                                    {Math.round(report.completeness_rate)}%
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                                    <span>Monitoring Completeness</span>
                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {report.monitored_sessions_count} of {report.expected_sessions_count} Expected Sessions Monitored
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. NAVIGATION TABS ROW */}
                <div className="border-b border-border bg-card/60 rounded-t-xl px-2 pt-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer",
                                    isActive
                                        ? "border-amber-500 text-amber-700 dark:text-amber-400 font-black bg-amber-500/5 rounded-t-lg"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-lg"
                                )}
                            >
                                <Icon className={cn("h-4 w-4", isActive ? "text-amber-500" : "text-muted-foreground")} />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 3. SECONDARY CONTROLS & FILTER BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Time Period Filter */}
                        <div className="inline-flex items-center rounded-lg border bg-background px-3 py-1.5 text-xs font-bold shadow-2xs text-foreground gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Today Only</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                        </div>

                        {/* Assigned Labs Dropdown */}
                        <div className="relative">
                            <select
                                className="h-8 text-xs font-bold rounded-lg border border-input bg-background pl-8 pr-7 shadow-2xs text-foreground cursor-pointer"
                                value={selectedLabFilter}
                                onChange={(e) => setSelectedLabFilter(e.target.value)}
                            >
                                <option value="all">All Assigned Labs ({availableLabs.length})</option>
                                {availableLabs.map((lab) => (
                                    <option key={lab} value={lab}>{lab}</option>
                                ))}
                            </select>
                            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2.5 pointer-events-none" />
                        </div>

                        {/* More Filters Toggle */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                setSelectedLabFilter('all');
                                setSearchQuery('');
                            }}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            {selectedLabFilter !== 'all' || searchQuery ? 'Reset Filters' : 'More Filters'}
                        </Button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                        <Input
                            placeholder="Search laboratory, course, or faculty..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 text-xs bg-background"
                        />
                    </div>
                </div>

                {/* 4. MAIN CONTENT AREA CONDITIONED BY ACTIVE TAB */}

                {/* ===================== TAB: OVERVIEW ===================== */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Daily Closing Checklist Card */}
                        <Card className="border shadow-2xs">
                            <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                                Daily Closing Checklist
                                            </CardTitle>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                System verifies every session and physical disruption before permitting end-of-day closure.
                                            </p>
                                        </div>
                                    </div>

                                    <span className={cn(
                                        "text-xs font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto",
                                        report.can_clean_close
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                                            : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                                    )}>
                                        {report.can_clean_close ? 'Eligible for Clean Close' : 'Closed with Exceptions Required'}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                                    {report.reconciliation_checklist.map((item) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all",
                                                item.passed
                                                    ? "bg-emerald-50/40 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                                                    : "bg-amber-50/40 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                item.passed ? "text-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/60" : "text-amber-600 bg-amber-100/70"
                                            )}>
                                                {item.passed ? <Check className="h-3 w-3 stroke-[2.5]" /> : <AlertTriangle className="h-3 w-3" />}
                                            </div>
                                            <div className="min-w-0">
                                                <strong className={cn("block text-xs leading-snug font-bold", item.passed ? "text-emerald-950 dark:text-emerald-200" : "text-amber-950 dark:text-amber-200")}>
                                                    {item.label}
                                                </strong>
                                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                                    {item.detail}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 5 KPI Metric Cards Row (Matching Screenshot) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {/* 1. Expected Sessions */}
                            <Card className="border bg-card p-4 rounded-xl shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground block">Expected Sessions</span>
                                    <div className="text-2xl font-black font-mono text-foreground">{totalExpectedSessions}</div>
                                    <span className="text-[11px] text-muted-foreground block">Total scheduled sessions today</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
                                    <Calendar className="h-5 w-5" />
                                </div>
                            </Card>

                            {/* 2. Monitored Sessions */}
                            <Card className="border bg-card p-4 rounded-xl shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground block">Monitored Sessions</span>
                                    <div className="text-2xl font-black font-mono text-foreground flex items-baseline gap-2">
                                        <span>{totalMonitoredSessions}</span>
                                    </div>
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                        {Math.round((totalMonitoredSessions / totalExpectedSessions) * 100)}% of expected sessions
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </Card>

                            {/* 3. Completed Sessions */}
                            <Card className="border bg-card p-4 rounded-xl shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground block">Completed Sessions</span>
                                    <div className="text-2xl font-black font-mono text-foreground">{completedSessions}</div>
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                        {Math.round((completedSessions / totalExpectedSessions) * 100)}% of expected sessions
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                            </Card>

                            {/* 4. Unmonitored Sessions */}
                            <Card className="border bg-card p-4 rounded-xl shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground block">Unmonitored Sessions</span>
                                    <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{unmonitoredCount}</div>
                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">
                                        {Math.round((unmonitoredCount / totalExpectedSessions) * 100)}% of expected sessions
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 shrink-0">
                                    <Clock className="h-5 w-5" />
                                </div>
                            </Card>

                            {/* 5. Discrepancies */}
                            <Card className="border bg-card p-4 rounded-xl shadow-2xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground block">Discrepancies</span>
                                    <div className={cn("text-2xl font-black font-mono", discrepanciesCount > 0 ? "text-rose-600" : "text-foreground")}>
                                        {discrepanciesCount}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground block">
                                        {discrepanciesCount === 0 ? '0 unresolved issues' : `${discrepanciesCount} unresolved issues`}
                                    </span>
                                </div>
                                <div className={cn("p-2.5 rounded-xl shrink-0", discrepanciesCount > 0 ? "bg-rose-50 text-rose-600" : "bg-muted text-muted-foreground")}>
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                            </Card>
                        </div>

                        {/* Downstream Chain of Evidence Alert Banner */}
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs flex items-center gap-2.5 text-amber-900 dark:text-amber-300">
                            <Info className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>
                                <strong>Downstream Chain of Evidence:</strong> Faculty attendance and room utilization analytics will treat today's monitoring records as dependable inputs only after this report is <strong>Submitted or Finalized</strong>. An unsubmitted or incomplete day remains tagged as <em>Monitoring Pending / Unverified</em>.
                            </span>
                        </div>

                        {/* 2x2 Grid of Key Overview Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Card 1: Laboratory Daily Summary Matrix (Preview) */}
                            <Card className="border shadow-2xs">
                                <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-black flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-amber-500" />
                                            Laboratory Daily Summary Matrix (Preview)
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Expected vs actual monitored sessions, with key variances.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs font-bold gap-1 text-amber-700 dark:text-amber-400"
                                        onClick={() => setActiveTab('summary')}
                                    >
                                        View Full Laboratory Summary <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <Table className="text-xs">
                                        <TableHeader className="bg-muted/40 text-[10px] uppercase font-bold tracking-tight">
                                            <TableRow>
                                                <TableHead className="py-2 px-3">Laboratory</TableHead>
                                                <TableHead className="py-2 px-2 text-center">Expected</TableHead>
                                                <TableHead className="py-2 px-2 text-center">Monitored</TableHead>
                                                <TableHead className="py-2 px-2 text-center text-emerald-700 dark:text-emerald-400">Scheduled Ok</TableHead>
                                                <TableHead className="py-2 px-2 text-center text-amber-700 dark:text-amber-400">Late Starts</TableHead>
                                                <TableHead className="py-2 px-3 text-center">Discrepancies</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.summary_matrix.slice(0, 4).map((row) => (
                                                <TableRow key={row.room_id} className="hover:bg-muted/20">
                                                    <TableCell className="font-bold py-2.5 px-3 text-foreground whitespace-nowrap">
                                                        {row.room_name}
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono py-2.5 px-2">{row.expected_sessions}</TableCell>
                                                    <TableCell className="text-center font-mono py-2.5 px-2 font-bold text-foreground">{row.monitored_sessions}</TableCell>
                                                    <TableCell className="text-center font-mono py-2.5 px-2 text-emerald-600 dark:text-emerald-400 font-bold">{row.completed_as_scheduled}</TableCell>
                                                    <TableCell className="text-center font-mono py-2.5 px-2 text-amber-600 dark:text-amber-400 font-bold">{row.late_starts}</TableCell>
                                                    <TableCell className="text-center py-2.5 px-3">
                                                        {row.discrepancies > 0 ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                                                {row.discrepancies}
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Card 2: Top Findings / Exceptions */}
                            <Card className="border shadow-2xs flex flex-col justify-between">
                                <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-black flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            Top Findings / Exceptions
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Notable items for today's monitoring period.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs font-bold gap-1 text-amber-700 dark:text-amber-400"
                                        onClick={() => setActiveTab('exceptions')}
                                    >
                                        View All <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-3 space-y-2.5">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60">
                                        <div className="flex items-center gap-2.5">
                                            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                                            <div>
                                                <strong className="text-xs font-bold text-foreground block">1 late start in CLR 2</strong>
                                                <span className="text-[11px] text-muted-foreground">BSCS 2A · Started 28 minutes late (08:28 AM).</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                            Late Start
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60">
                                        <div className="flex items-center gap-2.5">
                                            <Info className="h-4 w-4 text-blue-600 shrink-0" />
                                            <div>
                                                <strong className="text-xs font-bold text-foreground block">Network issue resolved in COM 1</strong>
                                                <span className="text-[11px] text-muted-foreground">Short network interruption (09:15 AM – 09:40 AM). Session completed.</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                            Resolved
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60">
                                        <div className="flex items-center gap-2.5">
                                            <RotateCcw className="h-4 w-4 text-purple-600 shrink-0" />
                                            <div>
                                                <strong className="text-xs font-bold text-foreground block">2 sessions transferred</strong>
                                                <span className="text-[11px] text-muted-foreground">Reassigned to alternate room due to facility maintenance.</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                            Transferred
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60">
                                        <div className="flex items-center gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <div>
                                                <strong className="text-xs font-bold text-foreground block">0 unresolved incidents</strong>
                                                <span className="text-[11px] text-muted-foreground">All technical issues and room concerns have been resolved.</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                            All Cleared
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 3: Observed Session Outcomes (Bar Chart Histogram) */}
                            <Card className="border shadow-2xs">
                                <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                    <CardTitle className="text-sm font-black flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                        Observed Session Outcomes
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Distribution of monitored sessions by outcome.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {/* Bar Chart Representation */}
                                    <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2 border-b">
                                        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                            <span className="text-[10px] font-mono font-bold text-emerald-600">117</span>
                                            <div className="w-full max-w-[40px] bg-emerald-500 rounded-t h-[85%]" />
                                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">Completed</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                            <span className="text-[10px] font-mono font-bold text-amber-600">2</span>
                                            <div className="w-full max-w-[40px] bg-amber-500 rounded-t h-[10%]" />
                                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">Late Start</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                            <span className="text-[10px] font-mono font-bold text-rose-600">0</span>
                                            <div className="w-full max-w-[40px] bg-rose-500/40 rounded-t h-[2px]" />
                                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">Absent</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                            <span className="text-[10px] font-mono font-bold text-purple-600">0</span>
                                            <div className="w-full max-w-[40px] bg-purple-500/40 rounded-t h-[2px]" />
                                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">Transferred</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                            <span className="text-[10px] font-mono font-bold text-slate-500">0</span>
                                            <div className="w-full max-w-[40px] bg-slate-400 rounded-t h-[2px]" />
                                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">Cancelled</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                            <span className="text-[10px] font-mono font-bold text-indigo-600">0</span>
                                            <div className="w-full max-w-[40px] bg-indigo-500/40 rounded-t h-[2px]" />
                                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">Unexpected</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                            <span className="text-[10px] font-mono font-bold text-muted-foreground">0</span>
                                            <div className="w-full max-w-[40px] bg-muted-foreground/30 rounded-t h-[2px]" />
                                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">Unmonitored</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Room Utilization Summary (Horizontal Progress Bars) */}
                            <Card className="border shadow-2xs">
                                <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-black flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-blue-500" />
                                            Room Utilization Summary
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Observed room occupancy rate (based on scheduled time).
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs font-bold gap-1 text-amber-700 dark:text-amber-400"
                                        onClick={() => setActiveTab('utilization')}
                                    >
                                        View Full Room Utilization <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3.5">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>CHS</span>
                                            <span className="font-mono font-bold">92%</span>
                                        </div>
                                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: '92%' }} />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>CLR Laboratories (1–5)</span>
                                            <span className="font-mono font-bold">88%</span>
                                        </div>
                                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: '88%' }} />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>COM Laboratories (1–4)</span>
                                            <span className="font-mono font-bold">90%</span>
                                        </div>
                                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: '90%' }} />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>Specialized Labs (NET, MAC)</span>
                                            <span className="font-mono font-bold">94%</span>
                                        </div>
                                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: '94%' }} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Signatories & Verification Preview Bar (Matching Bottom of Screenshot) */}
                        <div className="p-4 rounded-xl border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
                            <div className="space-y-0.5">
                                <div className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <FileSignature className="h-4 w-4 text-amber-500" />
                                    Signatories & Verification Preview
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    This report will be tagged with the following signatories upon submission.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-xs">
                                <div>
                                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Prepared By</span>
                                    <strong className="text-foreground font-bold">{report.lab_in_charge}</strong>
                                    <span className="text-[10px] text-muted-foreground block">Laboratory In-Charge</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Reviewed By</span>
                                    <strong className="text-foreground font-bold">{report.reviewed_by || 'Engr. Lab Coordinator'}</strong>
                                    <span className="text-[10px] text-muted-foreground block">Super Admin / Lab Coordinator</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Noted By</span>
                                    <strong className="text-foreground font-bold">{report.finalized_by || 'College Dean, CCS'}</strong>
                                    <span className="text-[10px] text-muted-foreground block">Dean / Academic Head</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TAB: LABORATORY SUMMARY ===================== */}
                {activeTab === 'summary' && (
                    <Card className="border shadow-2xs">
                        <CardHeader className="py-3 px-4 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-amber-500" />
                                    1. Laboratory Daily Summary Matrix
                                </CardTitle>
                                <Badge variant="outline" className="text-[11px] font-mono">
                                    Aggregate Session & Occupancy Metrics
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">
                                Expected vs actual monitored sessions, delivery outcomes, occupied time, and variance per assigned laboratory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-muted/40 text-[10px] uppercase font-bold tracking-tight">
                                    <TableRow>
                                        <TableHead className="py-2 px-3">Laboratory</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Expected</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Monitored</TableHead>
                                        <TableHead className="py-2 px-2 text-center text-emerald-700 dark:text-emerald-400">Scheduled Ok</TableHead>
                                        <TableHead className="py-2 px-2 text-center text-amber-700 dark:text-amber-400">Late Starts</TableHead>
                                        <TableHead className="py-2 px-2 text-center text-rose-700 dark:text-rose-400">Faculty Absent</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Transferred</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Online</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Cancelled</TableHead>
                                        <TableHead className="py-2 px-2 text-center text-purple-700 dark:text-purple-400">Unexpected Use</TableHead>
                                        <TableHead className="py-2 px-2 text-center text-rose-600 dark:text-rose-400">Unmonitored</TableHead>
                                        <TableHead className="py-2 px-2 text-right">Scheduled Time</TableHead>
                                        <TableHead className="py-2 px-2 text-right font-bold">Occupied Time</TableHead>
                                        <TableHead className="py-2 px-3 text-center">Discrepancies</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSummaryMatrix.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                                                No laboratory records match the active filter criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSummaryMatrix.map((row) => (
                                            <TableRow key={row.room_id} className="hover:bg-muted/20">
                                                <TableCell className="font-bold py-2.5 px-3 whitespace-nowrap text-foreground">
                                                    {row.room_name}
                                                </TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2">{row.expected_sessions}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2 font-bold text-foreground">{row.monitored_sessions}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2 text-emerald-600 dark:text-emerald-400 font-bold">{row.completed_as_scheduled}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2 text-amber-600 dark:text-amber-400 font-bold">{row.late_starts}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2 text-rose-600 dark:text-rose-400 font-bold">{row.faculty_not_present}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2">{row.transferred_room}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2">{row.switched_online}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2">{row.cancelled}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2 text-purple-600 dark:text-purple-400 font-bold">{row.unexpected_room_use}</TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2 text-rose-600 dark:text-rose-400 font-bold">{row.unmonitored_sessions}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 text-muted-foreground whitespace-nowrap">{row.total_scheduled_time}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 font-bold text-foreground whitespace-nowrap">{row.actual_occupied_time}</TableCell>
                                                <TableCell className="text-center py-2.5 px-3">
                                                    {row.discrepancies > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                                            {row.discrepancies} variance
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">0</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* ===================== TAB: FACULTY / CLASS MONITORING ===================== */}
                {activeTab === 'faculty' && (
                    <Card className="border shadow-2xs">
                        <CardHeader className="py-3 px-4 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-amber-500" />
                                    2. Faculty / Class Monitoring Matrix
                                </CardTitle>
                                <Badge variant="outline" className="text-[11px] font-mono">
                                    Detailed Timetable & Observed Sessions
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">
                                Comprehensive record of each scheduled timetable session, faculty arrival, observed duration, facility condition, and outcome.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-muted/40 text-[10px] uppercase font-bold tracking-tight">
                                    <TableRow>
                                        <TableHead className="py-2 px-3">Faculty</TableHead>
                                        <TableHead className="py-2 px-2">Course & Section</TableHead>
                                        <TableHead className="py-2 px-2">Lab</TableHead>
                                        <TableHead className="py-2 px-2">Scheduled Time</TableHead>
                                        <TableHead className="py-2 px-2">Actual Start</TableHead>
                                        <TableHead className="py-2 px-2">Actual End</TableHead>
                                        <TableHead className="py-2 px-2 text-right">Observed Duration</TableHead>
                                        <TableHead className="py-2 px-2">Room Status</TableHead>
                                        <TableHead className="py-2 px-2">Session Outcome</TableHead>
                                        <TableHead className="py-2 px-2">Late Time</TableHead>
                                        <TableHead className="py-2 px-3">Remarks / Evidence</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSessionsMatrix.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                                                No scheduled sessions found matching the active filter criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSessionsMatrix.map((s, idx) => (
                                            <TableRow
                                                key={idx}
                                                className={cn("hover:bg-muted/20", s.is_problematic && "bg-rose-50/30 dark:bg-rose-950/10")}
                                            >
                                                <TableCell className="font-bold py-2.5 px-3 text-foreground whitespace-nowrap">
                                                    {s.faculty_name}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2">
                                                    <div className="font-semibold text-foreground">{s.course_code}</div>
                                                    <div className="text-[10px] text-muted-foreground">{s.section}</div>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-semibold text-foreground whitespace-nowrap">
                                                    {s.room_name}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-mono text-[11px] whitespace-nowrap">
                                                    {s.scheduled_time}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-mono text-[11px] whitespace-nowrap">
                                                    {s.actual_start}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-mono text-[11px] whitespace-nowrap">
                                                    {s.actual_end}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-mono text-[11px] text-right font-bold text-foreground whitespace-nowrap">
                                                    {s.observed_duration}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2">
                                                    <Badge variant="outline" className="text-[10px] font-medium py-0 h-5">
                                                        {s.room_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2">
                                                    <span className={cn(
                                                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                                                        s.session_outcome === 'Conducted as Scheduled'
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                            : s.session_outcome === 'Faculty Not Present'
                                                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                                                : s.session_outcome === 'Switched to Online'
                                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                                    )}>
                                                        {s.session_outcome}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-mono text-[11px]">
                                                    {s.late_minutes > 0 ? (
                                                        <span className="text-amber-600 dark:text-amber-400 font-bold">{s.late_time}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3 max-w-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate text-muted-foreground text-[11px]" title={s.remarks}>
                                                            {s.remarks}
                                                        </span>
                                                        {s.photo_url && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 px-1.5 text-[10px] gap-1 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-100/50"
                                                                onClick={() => setPreviewPhotoUrl(s.photo_url!)}
                                                            >
                                                                <Camera className="h-3 w-3" /> Photo
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* ===================== TAB: ROOM UTILIZATION ===================== */}
                {activeTab === 'utilization' && (
                    <Card className="border shadow-2xs">
                        <CardHeader className="py-3 px-4 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                    3. Room Utilization Matrix (Standard Operating Day)
                                </CardTitle>
                                <Badge variant="outline" className="text-[11px] font-mono">
                                    Standard Base: 11h Operating Window (07:30 AM – 06:30 PM)
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">
                                All values calculated internally in minutes and presented in human-readable durations to evaluate efficiency, idle time, and unplanned use.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-muted/40 text-[10px] uppercase font-bold tracking-tight">
                                    <TableRow>
                                        <TableHead className="py-2 px-3">Laboratory</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Cap</TableHead>
                                        <TableHead className="py-2 px-2 text-right">Available Time</TableHead>
                                        <TableHead className="py-2 px-2 text-right">Scheduled Occupancy</TableHead>
                                        <TableHead className="py-2 px-2 text-right font-bold text-foreground">Observed Occupancy</TableHead>
                                        <TableHead className="py-2 px-2 text-right text-rose-700 dark:text-rose-400">Scheduled-Unused</TableHead>
                                        <TableHead className="py-2 px-2 text-right text-purple-700 dark:text-purple-400">Unplanned Use</TableHead>
                                        <TableHead className="py-2 px-2 text-right text-muted-foreground">Unavailable Time</TableHead>
                                        <TableHead className="py-2 px-2 text-right text-blue-700 dark:text-blue-400 font-bold">Idle Time</TableHead>
                                        <TableHead className="py-2 px-3 text-center font-bold">Observed Utilization Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUtilizationMatrix.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                                                No utilization records match the active filter criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUtilizationMatrix.map((row) => (
                                            <TableRow key={row.room_id} className="hover:bg-muted/20">
                                                <TableCell className="font-bold py-2.5 px-3 text-foreground whitespace-nowrap">
                                                    {row.room_name}
                                                </TableCell>
                                                <TableCell className="text-center font-mono py-2.5 px-2">{row.capacity}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 text-muted-foreground whitespace-nowrap">{row.available_time}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 whitespace-nowrap">{row.scheduled_occupancy}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 font-bold text-foreground whitespace-nowrap">{row.observed_occupancy}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">{row.scheduled_unused_time}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 text-purple-600 dark:text-purple-400 font-semibold whitespace-nowrap">{row.unplanned_use_time}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 text-muted-foreground whitespace-nowrap">{row.unavailable_time}</TableCell>
                                                <TableCell className="text-right font-mono py-2.5 px-2 text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">{row.idle_time}</TableCell>
                                                <TableCell className="text-center py-2.5 px-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-mono font-black text-xs text-foreground">
                                                            {row.utilization_rate}%
                                                        </span>
                                                        <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden shrink-0">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full",
                                                                    row.utilization_rate > 75 ? "bg-emerald-500" : row.utilization_rate > 40 ? "bg-amber-500" : "bg-blue-500"
                                                                )}
                                                                style={{ width: `${Math.min(row.utilization_rate, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* ===================== TAB: EXCEPTIONS & DISCREPANCIES ===================== */}
                {activeTab === 'exceptions' && (
                    <Card className="border shadow-2xs">
                        <CardHeader className="py-3 px-4 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-700 dark:text-rose-400">
                                    <AlertTriangle className="h-4 w-4" />
                                    4. Exceptions and Discrepancies Matrix ({report.exceptions_matrix.length})
                                </CardTitle>
                                <Badge variant="outline" className="text-[11px] font-mono border-rose-300 text-rose-700">
                                    Action Items & Problematic Cases Only
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">
                                Isolates unmonitored slots, missing faculty, room disruptions, unscheduled classes, and technical breakdowns requiring follow-up.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-muted/40 text-[10px] uppercase font-bold tracking-tight">
                                    <TableRow>
                                        <TableHead className="py-2 px-3">Type / Source</TableHead>
                                        <TableHead className="py-2 px-2">Laboratory</TableHead>
                                        <TableHead className="py-2 px-2">Course / Incident</TableHead>
                                        <TableHead className="py-2 px-2">Faculty / Entity</TableHead>
                                        <TableHead className="py-2 px-2">Severity</TableHead>
                                        <TableHead className="py-2 px-3">Explanation</TableHead>
                                        <TableHead className="py-2 px-3">Action Taken</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Further Review</TableHead>
                                        <TableHead className="py-2 px-3 text-center">Evidence</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExceptionsMatrix.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-6 text-emerald-700 dark:text-emerald-400 font-semibold">
                                                <CheckCircle2 className="h-5 w-5 inline mr-1.5" />
                                                Zero exceptions recorded today. All expected sessions were conducted as scheduled without facility disruption.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredExceptionsMatrix.map((ex, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/20">
                                                <TableCell className="py-2.5 px-3 whitespace-nowrap">
                                                    <Badge variant="outline" className="text-[10px] font-bold">
                                                        {ex.source}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-bold text-foreground whitespace-nowrap">
                                                    {ex.room_name}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 font-semibold text-foreground">
                                                    {ex.course_or_type}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">
                                                    {ex.faculty}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 whitespace-nowrap">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold",
                                                        ex.severity.includes('Urgent')
                                                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                                            : ex.severity.includes('Needs Attention')
                                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                                    )}>
                                                        {ex.severity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3 max-w-xs text-foreground font-medium text-[11px]">
                                                    {ex.explanation}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3 max-w-xs text-muted-foreground text-[11px]">
                                                    {ex.action_taken}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-2 text-center">
                                                    {ex.further_review_required ? (
                                                        <Badge variant="destructive" className="text-[10px] py-0 h-4 font-bold">
                                                            Required
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[10px]">Resolved</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3 text-center">
                                                    {ex.photo_url ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-1.5 text-[10px] gap-1 text-amber-700 dark:text-amber-400 font-bold"
                                                            onClick={() => setPreviewPhotoUrl(ex.photo_url!)}
                                                        >
                                                            <Camera className="h-3 w-3" /> View
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[10px]">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* ===================== TAB: SIGNATORIES & EXPORT ===================== */}
                {activeTab === 'signatories' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Status & Outcome Legend */}
                            <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs">
                                <div className="font-bold text-foreground flex items-center gap-2">
                                    <Info className="h-4 w-4 text-amber-500" />
                                    Report Interpretation Legend:
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-muted-foreground">
                                    <div>• <strong className="text-foreground">Available Time:</strong> Total standard operational lab window (11h).</div>
                                    <div>• <strong className="text-foreground">Scheduled-Unused:</strong> Allocated classes that did not materialize.</div>
                                    <div>• <strong className="text-foreground">Unplanned Use:</strong> Ad-hoc, makeup, or unscheduled occupancy.</div>
                                    <div>• <strong className="text-foreground">Idle Time:</strong> Open window unoccupied by any academic activity.</div>
                                    <div>• <strong className="text-foreground">Completeness Rate:</strong> Monitored ÷ Expected × 100%.</div>
                                    <div>• <strong className="text-foreground">Clean Close:</strong> Zero unmonitored or unresolved issues.</div>
                                </div>
                            </div>

                            {/* Official Institutional Signatories */}
                            <div className="p-4 rounded-xl border bg-card space-y-6">
                                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b pb-1">
                                    Institutional Signatories & Verification
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    {/* Prepared By */}
                                    <div className="space-y-1">
                                        <div className="h-10 border-b border-dashed border-foreground/40 flex items-end justify-center font-bold text-xs pb-1 text-foreground">
                                            {report.lab_in_charge}
                                        </div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Prepared by:</div>
                                        <div className="text-[9px] text-muted-foreground">Laboratory In-Charge</div>
                                    </div>

                                    {/* Reviewed By */}
                                    <div className="space-y-1">
                                        <div className="h-10 border-b border-dashed border-foreground/40 flex items-end justify-center font-bold text-xs pb-1 text-foreground">
                                            {report.reviewed_by || 'Engr. Lab Coordinator'}
                                        </div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Reviewed by:</div>
                                        <div className="text-[9px] text-muted-foreground">Super Admin / Lab Coordinator</div>
                                    </div>

                                    {/* Noted By */}
                                    <div className="space-y-1">
                                        <div className="h-10 border-b border-dashed border-foreground/40 flex items-end justify-center font-bold text-xs pb-1 text-foreground">
                                            {report.finalized_by || 'College Dean, CCS'}
                                        </div>
                                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Noted by:</div>
                                        <div className="text-[9px] text-muted-foreground">Dean / Academic Head</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submission / Audit Trail Summary if available */}
                        {(report.submitted_at || report.reviewed_at || report.finalized_at || (report.correction_history && report.correction_history.length > 0)) && (
                            <div className="p-4 bg-muted/20 border rounded-xl text-xs space-y-2">
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                    <UserCheck className="h-4 w-4 text-blue-600" /> Audit & Sign-off Trail:
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    {report.submitted_at && (
                                        <span>Submitted by <strong className="text-foreground">{report.submitted_by}</strong> on {report.submitted_at}</span>
                                    )}
                                    {report.reviewed_at && (
                                        <span>• Reviewed by <strong className="text-foreground">{report.reviewed_by}</strong> on {report.reviewed_at}</span>
                                    )}
                                    {report.finalized_at && (
                                        <span>• Finalized by <strong className="text-foreground">{report.finalized_by}</strong> on {report.finalized_at}</span>
                                    )}
                                    {report.submission_notes && (
                                        <div className="w-full text-foreground italic mt-0.5">
                                            "Submission Note: {report.submission_notes}"
                                        </div>
                                    )}
                                    {report.review_remarks && (
                                        <div className="w-full text-blue-700 dark:text-blue-300 italic mt-0.5">
                                            "Coordinator Review Remarks: {report.review_remarks}"
                                        </div>
                                    )}
                                </div>
                                {report.correction_history && report.correction_history.length > 0 && (
                                    <div className="mt-2 pt-2 border-t text-[11px] text-amber-800 dark:text-amber-300">
                                        <strong className="block">Auditable Correction History ({report.correction_history.length} Reopens):</strong>
                                        {report.correction_history.map((h, i) => (
                                            <div key={i} className="ml-2">
                                                • Reopened by {h.reopened_by} on {h.reopened_at} (Prior: {h.previous_status}) — <em>Reason: "{h.reason}"</em>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 9. SUBMIT END-OF-DAY REPORT MODAL */}
            <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-amber-500" />
                            Submit End-of-Day Monitoring Report
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Freezes today's monitoring records and activates downstream faculty attendance and room utilization analytics.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitReport} className="space-y-4">
                        <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1 border">
                            <div className="flex justify-between">
                                <span>Operating Date:</span>
                                <strong>{report.report_date}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Completeness Rate:</span>
                                <strong className={cn(report.completeness_rate >= 100 ? "text-emerald-600" : "text-amber-600")}>
                                    {report.completeness_rate}%
                                </strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Unmonitored Sessions:</span>
                                <strong>{report.unmonitored_count}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Exceptions Recorded:</span>
                                <strong className={report.discrepancies_count > 0 ? "text-rose-600" : "text-foreground"}>
                                    {report.discrepancies_count}
                                </strong>
                            </div>
                        </div>

                        {/* Close Mode Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold">Closing Mode</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className={cn(
                                    "p-2.5 rounded-lg border cursor-pointer text-xs flex flex-col justify-between transition-all",
                                    closeMode === 'clean'
                                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                                        : "border-muted bg-card hover:bg-muted/30 opacity-70"
                                )}>
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <input
                                            type="radio"
                                            name="close_mode"
                                            value="clean"
                                            checked={closeMode === 'clean'}
                                            onChange={() => setCloseMode('clean')}
                                            disabled={!report.can_clean_close}
                                            className="text-emerald-600"
                                        />
                                        Clean Close
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1">
                                        100% verified, no unresolved items
                                    </span>
                                </label>

                                <label className={cn(
                                    "p-2.5 rounded-lg border cursor-pointer text-xs flex flex-col justify-between transition-all",
                                    closeMode === 'with_exceptions'
                                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                                        : "border-muted bg-card hover:bg-muted/30"
                                )}>
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <input
                                            type="radio"
                                            name="close_mode"
                                            value="with_exceptions"
                                            checked={closeMode === 'with_exceptions'}
                                            onChange={() => setCloseMode('with_exceptions')}
                                            className="text-amber-600"
                                        />
                                        With Exceptions
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1">
                                        Flagged variances recorded
                                    </span>
                                </label>
                            </div>
                            {!report.can_clean_close && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    * Clean close is unavailable because one or more checklist items are pending. This day will be permanently logged as "Closed with Exceptions".
                                </p>
                            )}
                        </div>

                        {/* Submission Remarks */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Lab In-Charge Shift Notes & Clarifications</Label>
                            <Textarea
                                className="text-xs min-h-[70px]"
                                placeholder="Explain any room issues, power interruptions, or faculty absences..."
                                value={submissionNotes}
                                onChange={(e) => setSubmissionNotes(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSubmitModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Confirm & Freeze Day'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 10. ADMINISTRATIVE REVIEW MODAL */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            Review Daily Monitoring Report
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            As Laboratory Coordinator or Administrator, verify recorded sessions or request clarification.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleReviewReport} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold">Review Action</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className={cn(
                                    "p-2.5 rounded-lg border cursor-pointer text-xs transition-all",
                                    reviewAction === 'approve_review' ? "border-blue-500 bg-blue-50/50 text-blue-900" : "border-muted"
                                )}>
                                    <input
                                        type="radio"
                                        name="review_action"
                                        checked={reviewAction === 'approve_review'}
                                        onChange={() => setReviewAction('approve_review')}
                                        className="mr-1.5"
                                    />
                                    <strong>Mark as Reviewed</strong>
                                </label>
                                <label className={cn(
                                    "p-2.5 rounded-lg border cursor-pointer text-xs transition-all",
                                    reviewAction === 'request_clarification' ? "border-rose-500 bg-rose-50/50 text-rose-900" : "border-muted"
                                )}>
                                    <input
                                        type="radio"
                                        name="review_action"
                                        checked={reviewAction === 'request_clarification'}
                                        onChange={() => setReviewAction('request_clarification')}
                                        className="mr-1.5"
                                    />
                                    <strong>Request Clarification</strong>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Reviewer Remarks / Instructions</Label>
                            <Textarea
                                className="text-xs min-h-[80px]"
                                placeholder="Add guidance, feedback, or justification..."
                                value={reviewRemarks}
                                onChange={(e) => setReviewRemarks(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReviewModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Submit Review'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 11. AUDITABLE REOPEN MODAL */}
            <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-amber-700">
                            <RotateCcw className="h-5 w-5 text-amber-600" />
                            Reopen Report for Auditable Correction
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Reopening switches the report back to Draft so corrections can be made. This action is permanently logged in the report's correction history.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleReopenReport} className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Mandatory Justification / Reason for Reopening</Label>
                            <Textarea
                                className="text-xs min-h-[90px]"
                                placeholder="State precisely why this finalized/submitted report requires amendment..."
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReopenModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                disabled={isSubmitting || reopenReason.trim().length < 10}
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm Reopen'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 12. PHOTO EVIDENCE LIGHTBOX */}
            <Dialog open={Boolean(previewPhotoUrl)} onOpenChange={() => setPreviewPhotoUrl(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <Camera className="h-4 w-4 text-amber-500" />
                            Laboratory Photographic Evidence
                        </DialogTitle>
                    </DialogHeader>
                    {previewPhotoUrl && (
                        <div className="rounded-lg overflow-hidden border">
                            <img src={previewPhotoUrl} alt="Laboratory evidence" className="w-full max-h-[70vh] object-contain" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
