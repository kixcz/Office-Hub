import React, { useState } from 'react';
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
                return (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ready to Submit
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-muted-foreground font-semibold gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5" /> Draft · Real-Time Compiling
                    </Badge>
                );
        }
    };

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

            <div className="p-3 sm:p-5 space-y-5 w-full print-full">
                {/* 1. TOP HEADER & ACTION BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 font-semibold text-xs"
                            onClick={() => router.get('/monitoring/lab-in-charge')}
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Return to Command Hub
                        </Button>
                        <Badge variant="outline" className="font-mono text-xs">
                            {report.report_date}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Historical Date Selector */}
                        {pastReports.length > 0 && (
                            <select
                                className="h-8 text-xs font-semibold rounded-md border border-input bg-background px-2.5 shadow-2xs"
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
                            className="h-8 gap-1.5 font-bold text-xs"
                        >
                            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                            Print / Export PDF
                        </Button>

                        {/* Lab In-Charge Submission Button */}
                        {(!report.is_frozen || report.status === 'Draft' || report.status === 'Ready to Submit' || report.status === 'Clarification Required') && (
                            <Button
                                size="sm"
                                onClick={() => setSubmitModalOpen(true)}
                                className="h-8 gap-1.5 font-black text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
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
                                    className="h-8 gap-1 font-bold text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Review Report
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleFinalizeReport}
                                    disabled={isSubmitting}
                                    className="h-8 gap-1 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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
                                className="h-8 gap-1 font-bold text-xs border-amber-500 text-amber-700 hover:bg-amber-50"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Reopen for Correction
                            </Button>
                        )}
                    </div>
                </div>

                {/* 2. OFFICIAL INSTITUTIONAL REPORT HEADER */}
                <Card className="border-2 shadow-xs">
                    <CardHeader className="py-4 px-5 border-b bg-muted/20">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                        College Daily Reconciliation Layer
                                    </span>
                                    {getStatusBadge(report.status, report.has_exceptions)}
                                    {report.is_frozen && (
                                        <Badge variant="outline" className="text-[11px] font-mono gap-1 text-muted-foreground">
                                            <Lock className="h-3 w-3" /> Record Snapshot Frozen
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                    <FileCheck className="h-6 w-6 text-amber-500 shrink-0" />
                                    End-of-Day Laboratory Session Monitoring Report
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Daily closing, verification, and audit reconciliation for faculty attendance & room-utilization analytics.
                                </p>
                            </div>

                            {/* Completeness Rate Radial / Metric Card */}
                            <div className="flex items-center gap-4 bg-card border rounded-xl p-3 shadow-2xs shrink-0">
                                <div className="text-right">
                                    <div className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                                        Monitoring Completeness
                                    </div>
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className={cn(
                                            "text-2xl font-black font-mono",
                                            report.completeness_rate >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                        )}>
                                            {report.completeness_rate}%
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {report.monitored_sessions_count} of {report.expected_sessions_count} Expected Monitored
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-xs shadow-inner",
                                    report.completeness_rate >= 100
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                )}>
                                    {report.completeness_rate >= 100 ? '100%' : `${Math.round(report.completeness_rate)}%`}
                                </div>
                            </div>
                        </div>

                        {/* Metadata Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 text-xs border-t mt-3">
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Date</span>
                                <strong className="text-foreground font-mono">{report.report_date}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Lab In-Charge</span>
                                <strong className="text-foreground truncate block">{report.lab_in_charge}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Monitoring Shift</span>
                                <strong className="text-foreground">{report.shift_name}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Academic Period</span>
                                <strong className="text-foreground truncate block">{report.academic_period_name}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Verified Timetable</span>
                                <strong className="text-foreground">{report.schedule_version}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Covered Laboratories</span>
                                <strong className="text-foreground truncate block" title={report.covered_labs}>{report.covered_labs}</strong>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Notice on Downstream Integration */}
                    <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border-b border-amber-500/20 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-300">
                        <Info className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                            <strong>Downstream Chain of Evidence:</strong> Faculty attendance and room utilization analytics will treat today's monitoring records as dependable inputs only after this report is <strong>Submitted or Finalized</strong>. An unsubmitted or incomplete day remains tagged as <em>Monitoring Pending / Unverified</em>.
                        </span>
                    </div>

                    {/* Submission / Audit Trail Summary if available */}
                    {(report.submitted_at || report.reviewed_at || report.finalized_at || (report.correction_history && report.correction_history.length > 0)) && (
                        <div className="p-3 bg-muted/20 border-b text-xs space-y-1">
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-blue-600" /> Audit & Sign-off Trail:
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
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
                </Card>

                {/* 3. DAILY RECONCILIATION CHECKLIST */}
                <Card className="border shadow-2xs">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                Daily Closing & Reconciliation Checklist
                            </CardTitle>
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full border",
                                report.can_clean_close
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300"
                            )}>
                                {report.can_clean_close ? 'Eligible for Clean Close' : 'Closed with Exceptions Required'}
                            </span>
                        </div>
                        <CardDescription className="text-xs">
                            System verifies every session and physical disruption before permitting end-of-day closure. Unresolved items prevent a clean close and are permanently tagged.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                            {report.reconciliation_checklist.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "p-2.5 rounded-lg border flex items-start gap-2 text-xs transition-all",
                                        item.passed
                                            ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                                            : "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
                                    )}
                                >
                                    {item.passed ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                        <strong className={cn("block text-[11px] leading-snug", item.passed ? "text-emerald-900 dark:text-emerald-300" : "text-amber-900 dark:text-amber-300")}>
                                            {item.label}
                                        </strong>
                                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                                            {item.detail}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 4. MATRIX 1: DAILY SUMMARY MATRIX (PER LABORATORY) */}
                <Card className="border shadow-2xs">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
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
                                {report.summary_matrix.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={14} className="text-center py-4 text-muted-foreground">
                                            No laboratory sessions compiled for this operating day.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    report.summary_matrix.map((row) => (
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

                {/* 5. MATRIX 2: FACULTY / CLASS MONITORING MATRIX */}
                <Card className="border shadow-2xs">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
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
                                {report.sessions_matrix.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center py-4 text-muted-foreground">
                                            No scheduled sessions found for assigned laboratories today.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    report.sessions_matrix.map((s, idx) => (
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

                {/* 6. MATRIX 3: ROOM UTILIZATION MATRIX (HUMAN-READABLE DURATIONS) */}
                <Card className="border shadow-2xs">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                3. Room Utilization Matrix (Standard Operating Day)
                            </CardTitle>
                            <Badge variant="outline" className="text-[11px] font-mono">
                                Standard Base: 11h Operating Window (07:30 AM – 06:30 PM)
                            </Badge>
                        </div>
                        <CardDescription className="text-xs">
                            All values calculated internally in minutes and presented in human-readable durations (e.g. 7h 30m) to evaluate efficiency, idle time, and unplanned use.
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
                                {report.utilization_matrix.map((row) => (
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
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 7. MATRIX 4: EXCEPTIONS AND DISCREPANCIES MATRIX */}
                <Card className="border shadow-2xs">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-700 dark:text-rose-400">
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
                                {report.exceptions_matrix.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-6 text-emerald-700 dark:text-emerald-400 font-semibold">
                                            <CheckCircle2 className="h-5 w-5 inline mr-1.5" />
                                            Zero exceptions recorded today. All expected sessions were conducted as scheduled without facility disruption.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    report.exceptions_matrix.map((ex, idx) => (
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

                {/* 8. LEGEND & DYNAMIC INSTITUTIONAL SIGNATORIES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Status & Outcome Legend */}
                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1.5 text-[11px]">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-amber-500" />
                            Report Interpretation Legend:
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
                            <div>• <strong className="text-foreground">Available Time:</strong> Total standard operational lab window (11h).</div>
                            <div>• <strong className="text-foreground">Scheduled-Unused:</strong> Allocated classes that did not materialize.</div>
                            <div>• <strong className="text-foreground">Unplanned Use:</strong> Ad-hoc, makeup, or unscheduled occupancy.</div>
                            <div>• <strong className="text-foreground">Idle Time:</strong> Open window unoccupied by any academic activity.</div>
                            <div>• <strong className="text-foreground">Completeness Rate:</strong> Monitored ÷ Expected × 100%.</div>
                            <div>• <strong className="text-foreground">Clean Close:</strong> Zero unmonitored or unresolved issues.</div>
                        </div>
                    </div>

                    {/* Official Dynamic Signatories */}
                    <div className="p-4 rounded-xl border bg-card space-y-6">
                        <div className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b pb-1">
                            Institutional Signatories & Verification
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            {/* Prepared By */}
                            <div className="space-y-1">
                                <div className="h-9 border-b border-dashed border-foreground/40 flex items-end justify-center font-bold text-xs pb-1 text-foreground">
                                    {report.lab_in_charge}
                                </div>
                                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Prepared by:</div>
                                <div className="text-[9px] text-muted-foreground">Laboratory In-Charge</div>
                            </div>

                            {/* Reviewed By */}
                            <div className="space-y-1">
                                <div className="h-9 border-b border-dashed border-foreground/40 flex items-end justify-center font-bold text-xs pb-1 text-foreground">
                                    {report.reviewed_by || 'Engr. Lab Coordinator'}
                                </div>
                                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Reviewed by:</div>
                                <div className="text-[9px] text-muted-foreground">Super Admin / Lab Coordinator</div>
                            </div>

                            {/* Noted By */}
                            <div className="space-y-1">
                                <div className="h-9 border-b border-dashed border-foreground/40 flex items-end justify-center font-bold text-xs pb-1 text-foreground">
                                    {report.finalized_by || 'College Dean, CCS'}
                                </div>
                                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Noted by:</div>
                                <div className="text-[9px] text-muted-foreground">Dean / Academic Head</div>
                            </div>
                        </div>
                    </div>
                </div>
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
