import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    CalendarDays,
    Clock,
    Plus,
    CheckCircle2,
    RotateCcw,
    MapPin,
    Radio,
    FileSpreadsheet,
    Eye,
    UploadCloud,
    AlertCircle,
    UserCheck,
    Layers,
    Send,
    Download,
    Printer,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Portal', href: '/faculty/dashboard' },
    { title: 'Make-Up Classes', href: '/faculty/make-up-classes' },
];

interface MakeUpRequest {
    id: number;
    reference_no: string;
    course_code: string;
    course_title: string;
    section: string;
    missed_date: string;
    original_day_of_week: string;
    original_start_time: string;
    original_end_time: string;
    original_room_name: string;
    required_contact_hours: number;
    absence_reason: string;
    absence_remarks?: string;
    proposed_date: string;
    proposed_start_time: string;
    proposed_end_time: string;
    proposed_room_name: string;
    modality: string;
    proposed_remarks?: string;
    status: 'Draft' | 'Submitted' | 'Program Head Review' | 'Dean Approval' | 'Approved' | 'Conducted' | 'Completed' | 'Returned' | 'Rejected';
    program_head_remarks?: string;
    dean_remarks?: string;
    conducted_at?: string;
    actual_attendance_count?: number;
    completion_remarks?: string;
    evidence_path?: string;
    created_at: string;
}

interface PageProps {
    faculty: any;
    currentPeriod: any;
    requests: MakeUpRequest[];
    myOfferings: any[];
    rooms: string[];
}

export default function FacultyMakeUpClassesPage({
    faculty,
    currentPeriod,
    requests = [],
    myOfferings = [],
    rooms = [],
}: PageProps) {
    // New Request Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedOfferingIndex, setSelectedOfferingIndex] = useState<string>('');
    const [missedDate, setMissedDate] = useState('');
    const [absenceReason, setAbsenceReason] = useState('Official Academic Business / Conference');
    const [absenceRemarks, setAbsenceRemarks] = useState('');
    const [proposedDate, setProposedDate] = useState('');
    const [proposedStartTime, setProposedStartTime] = useState('09:00');
    const [proposedEndTime, setProposedEndTime] = useState('12:00');
    const [proposedRoom, setProposedRoom] = useState('');
    const [modality, setModality] = useState('Face-to-Face');
    const [proposedRemarks, setProposedRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirm Conducted Modal State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [activeConfirmRequest, setActiveConfirmRequest] = useState<MakeUpRequest | null>(null);
    const [actualStartTime, setActualStartTime] = useState('');
    const [actualEndTime, setActualEndTime] = useState('');
    const [actualAttendanceCount, setActualAttendanceCount] = useState<string>('35');
    const [completionRemarks, setCompletionRemarks] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    // Official FM-DSSC-CAP-008 Form Modal State
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [printableRequest, setPrintableRequest] = useState<MakeUpRequest | null>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // Selected offering helper
    const activeOffering = selectedOfferingIndex !== '' ? myOfferings[parseInt(selectedOfferingIndex, 10)] : null;

    const handleOpenCreateModal = () => {
        if (myOfferings.length > 0) {
            setSelectedOfferingIndex('0');
            const off = myOfferings[0];
            setProposedStartTime(off.start_time || '09:00');
            setProposedEndTime(off.end_time || '12:00');
            setProposedRoom(off.room_name || '');
        }
        setMissedDate('');
        setProposedDate('');
        setCreateModalOpen(true);
    };

    const handleOfferingChange = (indexStr: string) => {
        setSelectedOfferingIndex(indexStr);
        if (indexStr !== '') {
            const off = myOfferings[parseInt(indexStr, 10)];
            if (off) {
                setProposedStartTime(off.start_time || '09:00');
                setProposedEndTime(off.end_time || '12:00');
                setProposedRoom(off.room_name || '');
            }
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOffering) return;

        setIsSubmitting(true);
        router.post(
            '/faculty/make-up-classes',
            {
                room_schedule_id: activeOffering.id,
                course_code: activeOffering.course_code,
                course_title: activeOffering.course_title,
                section: activeOffering.section,
                missed_date: missedDate,
                original_day_of_week: activeOffering.day_of_week || 'Monday',
                original_start_time: activeOffering.start_time || '08:00',
                original_end_time: activeOffering.end_time || '11:00',
                original_room_name: activeOffering.room_name || 'TBA',
                required_contact_hours: 3.0,
                absence_reason: absenceReason,
                absence_remarks: absenceRemarks,
                proposed_date: proposedDate,
                proposed_start_time: proposedStartTime,
                proposed_end_time: proposedEndTime,
                proposed_room_name: proposedRoom || activeOffering.room_name,
                modality: modality,
                proposed_remarks: proposedRemarks,
            },
            {
                onSuccess: () => {
                    setCreateModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false),
            }
        );
    };

    const handleOpenConfirm = (request: MakeUpRequest) => {
        setActiveConfirmRequest(request);
        setActualStartTime(request.proposed_start_time);
        setActualEndTime(request.proposed_end_time);
        setActualAttendanceCount('35');
        setCompletionRemarks('Conducted curriculum syllabus topics in accordance with approval.');
        setEvidenceFile(null);
        setConfirmModalOpen(true);
    };

    const handleConfirmSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConfirmRequest) return;

        const formData = new FormData();
        formData.append('actual_start_time', actualStartTime);
        formData.append('actual_end_time', actualEndTime);
        formData.append('actual_attendance_count', actualAttendanceCount);
        formData.append('completion_remarks', completionRemarks);
        if (evidenceFile) {
            formData.append('evidence', evidenceFile);
        }

        setIsSubmitting(true);
        router.post(`/faculty/make-up-classes/${activeConfirmRequest.id}/confirm`, formData, {
            onSuccess: () => {
                setConfirmModalOpen(false);
                setActiveConfirmRequest(null);
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const getStatusBadge = (status: MakeUpRequest['status']) => {
        switch (status) {
            case 'Draft':
                return <Badge variant="outline">Draft</Badge>;
            case 'Program Head Review':
            case 'Submitted':
                return <Badge className="bg-amber-500/15 text-amber-600 border-amber-300">Under Program Head Review</Badge>;
            case 'Dean Approval':
                return <Badge className="bg-blue-500/15 text-blue-600 border-blue-300">Dean Approval Queue</Badge>;
            case 'Approved':
                return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-300">Approved for Execution</Badge>;
            case 'Completed':
                return <Badge className="bg-teal-500/15 text-teal-600 border-teal-300">Completed & Verified</Badge>;
            case 'Returned':
                return <Badge className="bg-orange-500/15 text-orange-600 border-orange-300">Returned for Adjustment</Badge>;
            case 'Rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Make-Up Classes" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Make-Up Class Scheduling</h1>
                            <Badge variant="outline" className="text-xs bg-muted">
                                {currentPeriod?.academic_year || 'A.Y. 2026-2027'} - {currentPeriod?.semester || '1st Semester'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            File replacement class schedules for missed sessions, track Program Head and Dean endorsements, and submit post-session conduct reports.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreateModal} className="gap-2">
                        <Plus className="h-4 w-4" />
                        File Make-Up Class Request
                    </Button>
                </div>

                {/* Requests List */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <h2 className="font-semibold text-sm">My Make-Up Class Requests</h2>
                        </div>
                        <span className="text-xs text-muted-foreground">Total: {requests.length} applications</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="py-3 px-4">Ref No. & Course</th>
                                    <th className="py-3 px-4">Missed Session</th>
                                    <th className="py-3 px-4">Proposed Schedule</th>
                                    <th className="py-3 px-4">Venue & Modality</th>
                                    <th className="py-3 px-4">Status & Approval</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No make-up class requests filed yet. Click "File Make-Up Class Request" to submit one.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-muted/20">
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-foreground">{req.course_code} - {req.section}</div>
                                                <div className="text-xs text-muted-foreground">{req.course_title}</div>
                                                <div className="text-[11px] font-mono text-primary/80 mt-0.5">{req.reference_no}</div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="text-xs font-medium text-rose-600">{req.missed_date}</div>
                                                <div className="text-[11px] text-muted-foreground">{req.original_start_time} - {req.original_end_time}</div>
                                                <div className="text-[11px] text-muted-foreground italic truncate max-w-[140px]" title={req.absence_reason}>
                                                    {req.absence_reason}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="text-xs font-semibold text-emerald-600">{req.proposed_date}</div>
                                                <div className="text-[11px] text-muted-foreground">{req.proposed_start_time} - {req.proposed_end_time}</div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    <span>{req.proposed_room_name || 'TBA'}</span>
                                                </div>
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Radio className="h-3 w-3 text-primary/70" />
                                                    <span>{req.modality}</span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div>{getStatusBadge(req.status)}</div>
                                                {req.program_head_remarks && (
                                                    <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[140px]" title={req.program_head_remarks}>
                                                        PH: {req.program_head_remarks}
                                                    </div>
                                                )}
                                                {req.dean_remarks && (
                                                    <div className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={req.dean_remarks}>
                                                        Dean: {req.dean_remarks}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs font-semibold gap-1 hover:bg-muted"
                                                        onClick={() => {
                                                            setPrintableRequest(req);
                                                            setPrintModalOpen(true);
                                                        }}
                                                        title="Generate Official Form (FM-DSSC-CAP-008)"
                                                    >
                                                        <FileText className="h-3.5 w-3.5 text-amber-600" />
                                                        <span className="hidden sm:inline">Form</span>
                                                    </Button>

                                                    {req.status === 'Approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1"
                                                            onClick={() => handleOpenConfirm(req)}
                                                        >
                                                            <UserCheck className="h-3.5 w-3.5" />
                                                            Confirm
                                                        </Button>
                                                    )}
                                                    {req.status === 'Completed' && (
                                                        <Badge variant="outline" className="border-teal-500 text-teal-600 bg-teal-50 text-[10px]">
                                                            Conducted ({req.actual_attendance_count})
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* File Make-Up Class Request Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>File Make-Up Class Schedule Request</DialogTitle>
                            <DialogDescription>
                                Reuses your authoritative semester assignments. Propose a non-conflicting replacement time and venue.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
                            {/* Course Offering Selection */}
                            <div>
                                <label className="font-semibold text-foreground">Select Affected Subject / Section</label>
                                <select
                                    value={selectedOfferingIndex}
                                    onChange={(e) => handleOfferingChange(e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-xs"
                                    required
                                >
                                    {myOfferings.map((offering, idx) => (
                                        <option key={offering.id} value={idx}>
                                            {offering.course_code} - {offering.section} ({offering.course_title}) | {offering.day_of_week} {offering.start_time}-{offering.end_time} ({offering.room_name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Section 1: Missed Class Details */}
                            <div className="p-3 border rounded-lg bg-rose-500/5 border-rose-200 dark:border-rose-900/30 space-y-3">
                                <div className="font-bold text-rose-600 uppercase tracking-wider text-[11px]">
                                    I. Missed Class Session Details
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-muted-foreground">Date of Missed Class</label>
                                        <Input
                                            type="date"
                                            value={missedDate}
                                            onChange={(e) => setMissedDate(e.target.value)}
                                            required
                                            className="h-8 text-xs mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground">Absence Category / Reason</label>
                                        <select
                                            value={absenceReason}
                                            onChange={(e) => setAbsenceReason(e.target.value)}
                                            className="w-full h-8 rounded-md border border-input bg-background px-2 mt-1 text-xs"
                                        >
                                            <option value="Official Academic Business / Conference">Official Academic Business / Conference</option>
                                            <option value="Official University Travel / Taskforce">Official University Travel / Taskforce</option>
                                            <option value="Medical / Illness (with Medical Certificate)">Medical / Illness</option>
                                            <option value="Institutional Holiday / Class Suspension">Institutional Holiday / Suspension</option>
                                            <option value="Emergency / Personal Leave">Emergency / Personal Leave</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-muted-foreground">Absence Justification Notes</label>
                                    <Input
                                        placeholder="E.g., Attended CHED COE Curriculum Benchmarking Workshop"
                                        value={absenceRemarks}
                                        onChange={(e) => setAbsenceRemarks(e.target.value)}
                                        className="h-8 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            {/* Section 2: Proposed Replacement Schedule */}
                            <div className="p-3 border rounded-lg bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/30 space-y-3">
                                <div className="font-bold text-emerald-600 uppercase tracking-wider text-[11px]">
                                    II. Proposed Replacement Schedule
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-muted-foreground">Proposed Date</label>
                                        <Input
                                            type="date"
                                            value={proposedDate}
                                            onChange={(e) => setProposedDate(e.target.value)}
                                            required
                                            className="h-8 text-xs mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground">Start Time</label>
                                        <Input
                                            type="time"
                                            value={proposedStartTime}
                                            onChange={(e) => setProposedStartTime(e.target.value)}
                                            required
                                            className="h-8 text-xs mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground">End Time</label>
                                        <Input
                                            type="time"
                                            value={proposedEndTime}
                                            onChange={(e) => setProposedEndTime(e.target.value)}
                                            required
                                            className="h-8 text-xs mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-muted-foreground">Target Classroom / Laboratory</label>
                                        <Input
                                            value={proposedRoom}
                                            onChange={(e) => setProposedRoom(e.target.value)}
                                            placeholder="E.g., ComLab 1, RM 304, or Virtual"
                                            className="h-8 text-xs mt-1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground">Delivery Modality</label>
                                        <select
                                            value={modality}
                                            onChange={(e) => setModality(e.target.value)}
                                            className="w-full h-8 rounded-md border border-input bg-background px-2 mt-1 text-xs"
                                        >
                                            <option value="Face-to-Face">Face-to-Face (On-Campus)</option>
                                            <option value="Online Synchronous">Online Synchronous (Google Meet/Zoom)</option>
                                            <option value="Hybrid">Hybrid Delivery</option>
                                            <option value="Asynchronous Activity">Asynchronous Activity / Lab Output</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-muted-foreground">Plan of Activities / Covered Syllabus Topics</label>
                                    <Input
                                        placeholder="Topic outline and planned activities during make-up session..."
                                        value={proposedRemarks}
                                        onChange={(e) => setProposedRemarks(e.target.value)}
                                        className="h-8 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
                                    <Send className="h-3.5 w-3.5" />
                                    Submit for Program Head Endorsement
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Confirm Conducted Modal */}
                {activeConfirmRequest && (
                    <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Confirm Conducted Make-Up Class</DialogTitle>
                                <DialogDescription>
                                    Report completion for {activeConfirmRequest.course_code} - {activeConfirmRequest.section} ({activeConfirmRequest.reference_no}).
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleConfirmSubmit} className="space-y-4 py-2 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-muted-foreground">Actual Start Time</label>
                                        <Input
                                            type="time"
                                            value={actualStartTime}
                                            onChange={(e) => setActualStartTime(e.target.value)}
                                            className="h-8 text-xs mt-1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground">Actual End Time</label>
                                        <Input
                                            type="time"
                                            value={actualEndTime}
                                            onChange={(e) => setActualEndTime(e.target.value)}
                                            className="h-8 text-xs mt-1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-muted-foreground">Actual Student Attendance Headcount</label>
                                    <Input
                                        type="number"
                                        value={actualAttendanceCount}
                                        onChange={(e) => setActualAttendanceCount(e.target.value)}
                                        className="h-8 text-xs mt-1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-muted-foreground">Class Conduct Remarks</label>
                                    <Input
                                        value={completionRemarks}
                                        onChange={(e) => setCompletionRemarks(e.target.value)}
                                        className="h-8 text-xs mt-1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-muted-foreground">Attendance Sheet / Photo Evidence (Optional)</label>
                                    <Input
                                        type="file"
                                        onChange={(e) => setEvidenceFile(e.target.files ? e.target.files[0] : null)}
                                        className="h-9 text-xs mt-1 cursor-pointer"
                                    />
                                </div>

                                <DialogFooter className="gap-2 pt-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setConfirmModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Record Session Conducted
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Official Institutional FM-DSSC-CAP-008 Make Up Class Form Modal */}
                <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between">
                            <div>
                                <DialogTitle className="text-base font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                    Make Up Class Form (FM-DSSC-CAP-008)
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Official institutional format: Beadle's Copy & Department's Copy
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2 pr-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold gap-1.5"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    Print
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    disabled={isExportingPdf}
                                    onClick={async () => {
                                        const formEl = document.getElementById('official-makeup-form-printable');
                                        if (!formEl) return;
                                        try {
                                            setIsExportingPdf(true);
                                            const html2canvas = (await import('html2canvas-pro')).default;
                                            const { jsPDF } = await import('jspdf');

                                            const canvas = await html2canvas(formEl, {
                                                scale: 2,
                                                useCORS: true,
                                                logging: false,
                                                backgroundColor: '#ffffff',
                                            });
                                            const imgData = canvas.toDataURL('image/png');
                                            const pdf = new jsPDF('p', 'mm', 'a4');
                                            const pdfWidth = pdf.internal.pageSize.getWidth();
                                            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                            pdf.save(`Make_Up_Class_Form_${printableRequest?.reference_no || 'FM-DSSC-CAP-008'}.pdf`);
                                        } catch (error) {
                                            console.error('Failed to export PDF:', error);
                                            window.print();
                                        } finally {
                                            setIsExportingPdf(false);
                                        }
                                    }}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    {isExportingPdf ? 'Exporting...' : 'Save as PDF'}
                                </Button>
                            </div>
                        </DialogHeader>

                        {/* Printable Area */}
                        <div className="py-2 overflow-x-auto">
                            <div
                                id="official-makeup-form-printable"
                                className="bg-white text-black p-4 sm:p-6 w-[790px] mx-auto shadow-sm border border-neutral-300 font-sans print:shadow-none print:border-none print:p-0 print:w-full"
                                style={{ minHeight: '1050px' }}
                            >
                                <style type="text/css" media="print">{`
                                    @page { size: portrait; margin: 10mm; }
                                    body * { visibility: hidden; }
                                    #official-makeup-form-printable, #official-makeup-form-printable * { visibility: visible; }
                                    #official-makeup-form-printable {
                                        position: absolute;
                                        left: 0;
                                        top: 0;
                                        width: 100% !important;
                                        box-shadow: none !important;
                                        border: none !important;
                                        padding: 0 !important;
                                    }
                                `}</style>

                                {/* SLIP HELPER RENDERER */}
                                {[
                                    { copyLabel: "(Beadle's Copy)", isTop: true },
                                    { copyLabel: "(Department's Copy)", isTop: false }
                                ].map((slip, slipIdx) => {
                                    const semString = currentPeriod?.name || printableRequest?.course_title || 'First Semester, A.Y. 2024-2025';
                                    const instituteString = faculty?.department?.name ? `Institute of Computing / ${faculty?.department?.name}` : 'Institute of Computing';
                                    const deptString = faculty?.department?.name || 'Information Technology Department';
                                    const missingForString = printableRequest ? `${printableRequest.course_code} - ${printableRequest.course_title} (${printableRequest.missed_date} ${printableRequest.original_start_time || ''})` : '';
                                    const requestedDateString = printableRequest ? `${printableRequest.proposed_date} (${printableRequest.proposed_start_time} - ${printableRequest.proposed_end_time})` : '';
                                    const courseYearSec = printableRequest ? `${printableRequest.course_code} / ${printableRequest.section}` : '';
                                    const reasonString = printableRequest ? (printableRequest.absence_remarks ? `${printableRequest.absence_reason} - ${printableRequest.absence_remarks}` : printableRequest.absence_reason) : '';
                                    const facultyName = faculty ? `${faculty.first_name || ''} ${faculty.last_name || ''}`.trim() : 'Faculty Member';

                                    return (
                                        <div key={slipIdx} className={slipIdx > 0 ? "mt-5 pt-4 border-t-2 border-dashed border-neutral-400" : ""}>
                                            {/* HEADER BANNER */}
                                            <div className="border border-neutral-800">
                                                <div className="flex flex-row items-stretch">
                                                    {/* Left Banner: Navy Blue */}
                                                    <div className="flex-1 bg-[#10355c] text-white px-4 py-2 flex items-center gap-3">
                                                        <img
                                                            src="/DSSC.jpg"
                                                            alt="Davao Del Sur State College"
                                                            className="h-14 w-14 rounded-full border-2 border-white bg-white object-contain flex-shrink-0"
                                                        />
                                                        <div>
                                                            <div className="text-[10px] tracking-wide uppercase font-light text-blue-100">Republic of the Philippines</div>
                                                            <div className="text-base sm:text-lg font-black tracking-wider leading-tight">DAVAO DEL SUR STATE COLLEGE</div>
                                                            <div className="text-[9px] text-blue-200">Brgy. Matti, Digos City, Davao del Sur, Philippines 8002</div>
                                                        </div>
                                                    </div>

                                                    {/* Right ISO Document Code Number Box */}
                                                    <div className="w-56 border-l border-neutral-800 flex flex-col text-center text-[10px] bg-white">
                                                        <div className="bg-[#10355c] text-white font-bold text-[9px] py-0.5 tracking-wider uppercase border-b border-neutral-800">
                                                            DOCUMENT CODE NUMBER
                                                        </div>
                                                        <div className="py-1 px-1 font-extrabold text-sm tracking-tight text-neutral-900 border-b border-neutral-800">
                                                            FM-DSSC-CAP-008
                                                        </div>
                                                        <div className="grid grid-cols-4 text-[8px] bg-neutral-100 border-b border-neutral-800 font-semibold text-neutral-700">
                                                            <div className="border-r border-neutral-800 py-0.5 uppercase">ISSUE STATUS</div>
                                                            <div className="border-r border-neutral-800 py-0.5 uppercase">REV. NO.</div>
                                                            <div className="border-r border-neutral-800 py-0.5 uppercase">EFFECTIVE DATE</div>
                                                            <div className="py-0.5 uppercase">PAGE NO.</div>
                                                        </div>
                                                        <div className="grid grid-cols-4 text-[9px] font-bold text-neutral-900">
                                                            <div className="border-r border-neutral-800 py-0.5">01</div>
                                                            <div className="border-r border-neutral-800 py-0.5">00</div>
                                                            <div className="border-r border-neutral-800 py-0.5">11.11.2024</div>
                                                            <div className="py-0.5">1 of 1</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Header Maroon Accent Stripe */}
                                                <div className="h-1.5 bg-[#78181f] border-t border-neutral-800" />
                                            </div>

                                            {/* FORM TITLE */}
                                            <div className="text-center my-3">
                                                <h2 className="text-sm font-extrabold tracking-wider uppercase text-neutral-900">
                                                    MAKE UP CLASS FORM
                                                </h2>
                                            </div>

                                            {/* TOP FIELDS: Semester, Institute, Department */}
                                            <div className="grid grid-cols-12 gap-x-2 gap-y-2 text-[11px] text-neutral-900 items-baseline">
                                                <div className="col-span-4 flex items-baseline">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Semester:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium truncate">{semString}</span>
                                                </div>
                                                <div className="col-span-4 flex items-baseline">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Institute:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium truncate">{instituteString}</span>
                                                </div>
                                                <div className="col-span-4 flex items-baseline">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Department:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium truncate">{deptString}</span>
                                                </div>

                                                {/* Row 2: Make Up Class for & Requested Date */}
                                                <div className="col-span-6 flex items-baseline mt-1">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Make Up Class for:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium truncate">{missingForString}</span>
                                                </div>
                                                <div className="col-span-6 flex items-baseline mt-1">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Requested Date for Make Up Class:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium truncate">{requestedDateString}</span>
                                                </div>

                                                {/* Row 3: Course/Year/Section */}
                                                <div className="col-span-12 flex items-baseline mt-1">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Course/Year/Section:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium">{courseYearSec}</span>
                                                </div>

                                                {/* Row 4: Reason for Missing the Class */}
                                                <div className="col-span-12 flex items-baseline mt-1">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Reason for Missing the Class:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium">{reasonString}</span>
                                                </div>
                                            </div>

                                            {/* SIGNATORIES: Pre Make Up Class */}
                                            <div className="grid grid-cols-2 gap-8 text-[11px] mt-4 pt-1">
                                                <div>
                                                    <div className="font-semibold mb-6">Requested by:</div>
                                                    <div className="border-b border-neutral-700 text-center font-bold pb-0.5 truncate uppercase">
                                                        {facultyName}
                                                    </div>
                                                    <div className="text-center text-[10px] text-neutral-600 mt-0.5 font-medium">
                                                        Faculty
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="font-semibold mb-6">Approved:</div>
                                                    <div className="border-b border-neutral-700 text-center font-bold pb-0.5 min-h-[18px]">
                                                        {printableRequest?.status === 'Approved' || printableRequest?.status === 'Completed' ? 'APPROVED' : ''}
                                                    </div>
                                                    <div className="text-center text-[10px] text-neutral-600 mt-0.5 font-medium">
                                                        Subject Coor/Dept. Chair/Prog. Head/Dean
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AFTER THE MAKE UP CLASS SECTION */}
                                            <div className="mt-3 pt-2 border-t border-dashed border-neutral-400">
                                                <div className="text-[10px] italic font-semibold text-neutral-700 mb-1">
                                                    (After the Make Up Class)
                                                </div>
                                                <div className="flex items-baseline text-[11px]">
                                                    <span className="font-semibold whitespace-nowrap mr-1">Remarks:</span>
                                                    <span className="flex-1 border-b border-neutral-700 px-1 font-medium">
                                                        {printableRequest?.completion_remarks || ''}
                                                    </span>
                                                </div>

                                                {/* Recorded & Verified Signatories */}
                                                <div className="grid grid-cols-2 gap-8 text-[11px] mt-3">
                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold whitespace-nowrap mr-1">Recorded:</span>
                                                        <div className="flex-1 text-center">
                                                            <div className="border-b border-neutral-700 pb-0.5 min-h-[16px]">
                                                                {printableRequest?.actual_attendance_count ? `${printableRequest.actual_attendance_count} students attended` : ''}
                                                            </div>
                                                            <div className="text-[10px] text-neutral-600 mt-0.5 font-medium">Class Beadle</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-baseline">
                                                        <span className="font-semibold whitespace-nowrap mr-1">Verified:</span>
                                                        <div className="flex-1 text-center">
                                                            <div className="border-b border-neutral-700 pb-0.5 min-h-[16px]"></div>
                                                            <div className="text-[10px] text-neutral-600 mt-0.5 font-medium">Subject Coor/Dept. Chair/Prog. Head/Dean</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* COPY LABEL: Beadle's Copy or Department's Copy */}
                                            <div className="text-[10px] italic font-bold text-neutral-700 mt-2">
                                                {slip.copyLabel}
                                            </div>

                                            {/* FOOTER BAR */}
                                            <div className="mt-2.5 pt-1 border-t-2 border-[#78181f] flex flex-row items-center justify-between text-[9px] text-neutral-700">
                                                <div className="font-black text-sm text-[#10355c] tracking-widest opacity-60">
                                                    DSSC
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                                                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#10355c] text-white text-[8px] text-center leading-3">📞</span>
                                                        <span>(+63) 939924-0793</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                                                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#10355c] text-white text-[8px] text-center leading-3">@</span>
                                                        <span>op@dssc.edu.ph</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 font-semibold text-neutral-800">
                                                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#10355c] text-white text-[8px] text-center leading-3">🌐</span>
                                                        <span>www.dssc.edu.ph</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
