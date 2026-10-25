import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    CalendarDays,
    Clock,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RotateCcw,
    Eye,
    Building2,
    GraduationCap,
    Send,
    UserCheck,
    FileSpreadsheet,
    FileText,
    AlertTriangle,
    Layers,
    MapPin,
    Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations/make-up-classes' },
    { title: 'Make-Up Class Monitoring', href: '/operations/make-up-classes' },
];

interface MakeUpRequest {
    id: number;
    reference_no: string;
    faculty_id: number;
    faculty?: {
        id: number;
        first_name: string;
        last_name: string;
        academic_rank?: string;
        program?: {
            name: string;
            code: string;
        };
    };
    course_code: string;
    course_title: string;
    section: string;
    missed_date: string;
    missed_start_time: string;
    missed_end_time: string;
    missed_reason: string;
    proposed_date: string;
    proposed_start_time: string;
    proposed_end_time: string;
    proposed_room: string;
    proposed_modality: 'F2F' | 'Online Synchronous' | 'Hybrid' | 'Asynchronous Activity';
    status: 'Draft' | 'Submitted' | 'Program Head Review' | 'Dean Approval' | 'Approved' | 'Conducted' | 'Completed' | 'Returned' | 'Rejected';
    program_head_remarks?: string;
    dean_remarks?: string;
    actual_conducted_date?: string;
    actual_students_present?: number;
    evidence_file_path?: string;
    created_at: string;
}

interface PageProps {
    currentPeriod: any;
    academicPeriods: any[];
    requests: MakeUpRequest[];
    metrics: {
        total_requests: number;
        pending_reviews: number;
        approved_count: number;
        completed_count: number;
        overdue_count: number;
    };
    faculties: Array<{ id: number; first_name: string; last_name: string }>;
    rooms: string[];
    filters: {
        status?: string;
        faculty_id?: string;
        search?: string;
    };
}

export default function MakeUpClassesMonitoringIndex({
    currentPeriod,
    requests = [],
    metrics,
    faculties = [],
    rooms = [],
    filters = {},
}: PageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedFaculty, setSelectedFaculty] = useState(filters.faculty_id || 'all');
    
    // Modal states
    const [selectedRequest, setSelectedRequest] = useState<MakeUpRequest | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'endorse' | 'approve' | 'return' | 'reject'>('approve');
    const [reviewRemarks, setReviewRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            const matchesSearch =
                !search ||
                req.reference_no.toLowerCase().includes(search.toLowerCase()) ||
                req.course_code.toLowerCase().includes(search.toLowerCase()) ||
                req.course_title.toLowerCase().includes(search.toLowerCase()) ||
                req.section.toLowerCase().includes(search.toLowerCase()) ||
                (req.faculty && `${req.faculty.first_name} ${req.faculty.last_name}`.toLowerCase().includes(search.toLowerCase()));

            const matchesStatus = selectedStatus === 'all' || req.status === selectedStatus;
            const matchesFaculty = selectedFaculty === 'all' || String(req.faculty_id) === String(selectedFaculty);

            return matchesSearch && matchesStatus && matchesFaculty;
        });
    }, [requests, search, selectedStatus, selectedFaculty]);

    const handleOpenReview = (request: MakeUpRequest, defaultAction: 'endorse' | 'approve' | 'return' | 'reject') => {
        setSelectedRequest(request);
        setReviewAction(defaultAction);
        setReviewRemarks('');
        setReviewModalOpen(true);
    };

    const handleSubmitReview = () => {
        if (!selectedRequest) return;
        setIsSubmitting(true);
        router.patch(
            `/operations/make-up-classes/${selectedRequest.id}/review`,
            {
                action: reviewAction,
                remarks: reviewRemarks,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReviewModalOpen(false);
                    setSelectedRequest(null);
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const getStatusBadge = (status: MakeUpRequest['status']) => {
        switch (status) {
            case 'Draft':
                return <Badge variant="outline" className="border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">Draft</Badge>;
            case 'Submitted':
            case 'Program Head Review':
                return <Badge className="bg-amber-500/15 text-amber-600 border-amber-300 dark:border-amber-700/50">Program Head Review</Badge>;
            case 'Dean Approval':
                return <Badge className="bg-blue-500/15 text-blue-600 border-blue-300 dark:border-blue-700/50">Dean Approval</Badge>;
            case 'Approved':
                return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-300 dark:border-emerald-700/50">Approved for Execution</Badge>;
            case 'Conducted':
                return <Badge className="bg-purple-500/15 text-purple-600 border-purple-300 dark:border-purple-700/50">Conducted (Pending Verification)</Badge>;
            case 'Completed':
                return <Badge className="bg-teal-500/15 text-teal-600 border-teal-300 dark:border-teal-700/50">Completed & Verified</Badge>;
            case 'Returned':
                return <Badge className="bg-orange-500/15 text-orange-600 border-orange-300 dark:border-orange-700/50">Returned for Adjustment</Badge>;
            case 'Rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Make-Up Class Monitoring" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Make-Up Class Monitoring Hub</h1>
                            <Badge variant="outline" className="text-xs bg-muted">
                                {currentPeriod?.academic_year || 'Academic Year'} - {currentPeriod?.semester || 'Semester'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Governance, verification, and academic integrity oversight for faculty replacement class schedules.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Print Oversight Roster
                        </Button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Encoded</span>
                            <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">{metrics?.total_requests || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Academic semester proposals</p>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm border-amber-200/50 dark:border-amber-900/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Review</span>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {metrics?.pending_reviews || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Dean & Program Head queue</p>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved Scheduled</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {metrics?.approved_count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Authorized for execution</p>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">Completed Sessions</span>
                            <UserCheck className="h-4 w-4 text-teal-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-teal-600 dark:text-teal-400">
                            {metrics?.completed_count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Conducted with proof</p>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm border-rose-200/50 dark:border-rose-900/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Overdue Execution</span>
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {metrics?.overdue_count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Past proposed date unconfirmed</p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by code, section, faculty, ref..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="all">All Approval States</option>
                            <option value="Submitted">Submitted (Pending Head)</option>
                            <option value="Dean Approval">Dean Approval Queue</option>
                            <option value="Approved">Approved (Ready)</option>
                            <option value="Conducted">Conducted</option>
                            <option value="Completed">Completed</option>
                            <option value="Returned">Returned</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        <select
                            value={selectedFaculty}
                            onChange={(e) => setSelectedFaculty(e.target.value)}
                            className="text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="all">All Faculty Instructors</option>
                            {faculties.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.last_name}, {f.first_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="py-3 px-4">Ref & Course</th>
                                    <th className="py-3 px-4">Faculty Member</th>
                                    <th className="py-3 px-4">Missed Schedule</th>
                                    <th className="py-3 px-4">Proposed Replacement</th>
                                    <th className="py-3 px-4">Modality & Venue</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-muted-foreground">
                                            No make-up class requests match the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => {
                                        const isPastDue =
                                            req.status === 'Approved' &&
                                            new Date(req.proposed_date) < new Date(new Date().toDateString());

                                        return (
                                            <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <span>{req.course_code}</span>
                                                        <span className="text-xs font-normal text-muted-foreground">({req.section})</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-xs">{req.course_title}</div>
                                                    <div className="text-[11px] font-mono text-primary/80 mt-0.5">{req.reference_no}</div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="font-medium text-foreground">
                                                        {req.faculty ? `${req.faculty.first_name} ${req.faculty.last_name}` : 'Unknown Faculty'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {req.faculty?.program?.code || 'Department Faculty'}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                                        {req.missed_date}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {req.missed_start_time} - {req.missed_end_time}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground italic truncate max-w-[140px]" title={req.missed_reason}>
                                                        Reason: {req.missed_reason}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        {req.proposed_date}
                                                        {isPastDue && (
                                                            <Badge variant="destructive" className="h-4 text-[9px] px-1">
                                                                Overdue
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {req.proposed_start_time} - {req.proposed_end_time}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{req.proposed_room || 'TBA'}</span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Radio className="h-3 w-3 text-primary/70" />
                                                        <span>{req.proposed_modality}</span>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    {getStatusBadge(req.status)}
                                                </td>

                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Program Head Endorsement / Dean Approval Shortcut */}
                                                        {['Submitted', 'Program Head Review'].includes(req.status) && (
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                                                onClick={() => handleOpenReview(req, 'endorse')}
                                                            >
                                                                Endorse
                                                            </Button>
                                                        )}

                                                        {req.status === 'Dean Approval' && (
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                onClick={() => handleOpenReview(req, 'approve')}
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs gap-1"
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setReviewAction('approve');
                                                                setReviewModalOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Details
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

                {/* Review & Details Modal */}
                {selectedRequest && (
                    <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                    <span>Make-Up Class Proposal Review</span>
                                    <span className="text-xs font-mono font-normal text-muted-foreground">
                                        {selectedRequest.reference_no}
                                    </span>
                                </DialogTitle>
                                <DialogDescription>
                                    Verify academic compliance, room availability, and student schedule conflicts.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2 text-sm">
                                {/* Course & Faculty info */}
                                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Faculty Member</div>
                                        <div className="font-semibold text-foreground">
                                            {selectedRequest.faculty?.first_name} {selectedRequest.faculty?.last_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{selectedRequest.faculty?.academic_rank}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Course & Section</div>
                                        <div className="font-semibold text-foreground">
                                            {selectedRequest.course_code} - {selectedRequest.section}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">{selectedRequest.course_title}</div>
                                    </div>
                                </div>

                                {/* Comparison: Missed vs Proposed */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 border rounded-lg border-rose-200 dark:border-rose-900/40 bg-rose-500/5">
                                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
                                            Missed Session
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{selectedRequest.missed_date}</span></div>
                                            <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{selectedRequest.missed_start_time} - {selectedRequest.missed_end_time}</span></div>
                                            <div><span className="text-muted-foreground">Reason:</span> <span className="font-medium text-foreground">{selectedRequest.missed_reason}</span></div>
                                        </div>
                                    </div>

                                    <div className="p-3 border rounded-lg border-emerald-200 dark:border-emerald-900/40 bg-emerald-500/5">
                                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                                            Replacement Session
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <div><span className="text-muted-foreground">Proposed Date:</span> <span className="font-medium">{selectedRequest.proposed_date}</span></div>
                                            <div><span className="text-muted-foreground">Proposed Time:</span> <span className="font-medium">{selectedRequest.proposed_start_time} - {selectedRequest.proposed_end_time}</span></div>
                                            <div><span className="text-muted-foreground">Room / Venue:</span> <span className="font-medium">{selectedRequest.proposed_room || 'TBA'}</span></div>
                                            <div><span className="text-muted-foreground">Modality:</span> <span className="font-medium">{selectedRequest.proposed_modality}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Conducted / Post-Class Execution data if available */}
                                {selectedRequest.status === 'Completed' && (
                                    <div className="p-3 border rounded-lg bg-teal-500/5 border-teal-200 dark:border-teal-900/40">
                                        <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
                                            Conducted Session Verification
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div><span className="text-muted-foreground">Conducted Date:</span> <span className="font-medium">{selectedRequest.actual_conducted_date}</span></div>
                                            <div><span className="text-muted-foreground">Students Present:</span> <span className="font-medium">{selectedRequest.actual_students_present ?? 'N/A'}</span></div>
                                        </div>
                                    </div>
                                )}

                                {/* Approval Audit History */}
                                <div className="p-3 border rounded-lg space-y-2 text-xs">
                                    <div className="font-semibold text-muted-foreground uppercase tracking-wider">Review Trail</div>
                                    {selectedRequest.program_head_remarks && (
                                        <div className="border-l-2 border-amber-500 pl-2">
                                            <span className="font-medium text-amber-600">Program Head Endorsement:</span>{' '}
                                            {selectedRequest.program_head_remarks}
                                        </div>
                                    )}
                                    {selectedRequest.dean_remarks && (
                                        <div className="border-l-2 border-emerald-500 pl-2">
                                            <span className="font-medium text-emerald-600">Dean Remark:</span>{' '}
                                            {selectedRequest.dean_remarks}
                                        </div>
                                    )}
                                    {!selectedRequest.program_head_remarks && !selectedRequest.dean_remarks && (
                                        <div className="text-muted-foreground italic">No review notes recorded yet.</div>
                                    )}
                                </div>

                                {/* Review Actions Form */}
                                <div className="space-y-3 pt-2 border-t">
                                    <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                        Take Administrative Action
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={reviewAction === 'endorse' ? 'default' : 'outline'}
                                            className={reviewAction === 'endorse' ? 'bg-amber-600 text-white' : ''}
                                            onClick={() => setReviewAction('endorse')}
                                        >
                                            Endorse to Dean
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={reviewAction === 'approve' ? 'default' : 'outline'}
                                            className={reviewAction === 'approve' ? 'bg-emerald-600 text-white' : ''}
                                            onClick={() => setReviewAction('approve')}
                                        >
                                            Approve & Post
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={reviewAction === 'return' ? 'default' : 'outline'}
                                            className={reviewAction === 'return' ? 'bg-orange-600 text-white' : ''}
                                            onClick={() => setReviewAction('return')}
                                        >
                                            Return
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                                            onClick={() => setReviewAction('reject')}
                                        >
                                            Reject
                                        </Button>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Reviewer Remarks / Instructions
                                        </label>
                                        <textarea
                                            value={reviewRemarks}
                                            onChange={(e) => setReviewRemarks(e.target.value)}
                                            rows={3}
                                            placeholder="Specify reasons for approval, classroom condition, or adjustment instructions..."
                                            className="w-full text-xs rounded-md border border-input bg-background p-2.5 mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSubmitReview}
                                    disabled={isSubmitting}
                                    className="gap-1.5"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Submit Decision
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}
