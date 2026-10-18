import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    CalendarDays,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Layers,
    Plus,
    Search,
    Filter,
    FileCheck,
    Building2,
    Users,
    ChevronRight,
    MapPin,
    AlertCircle,
    ArrowRight,
    Sparkles,
    CalendarCheck,
    Check,
    Upload,
    FileText,
    HelpCircle,
    Download,
    BarChart3,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations/exam-monitoring' },
    { title: 'Exam Monitoring', href: '/operations/exam-monitoring' },
];

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    title_name?: string;
    specialization?: string;
}

interface ExamSchedule {
    id: number;
    course_code: string;
    course_title: string;
    section: string;
    year_level?: string;
    exam_type: string;
    custom_exam_title?: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_name: string;
    modality: string;
    proctor_name?: string;
    is_confirmed: boolean;
    notes?: string;
    status: 'Draft' | 'Scheduled' | 'Awaiting Confirmation' | 'Conducted' | 'Rescheduled' | 'Cancelled' | 'Not Conducted';
    conducted_at?: string;
    actual_start_time?: string;
    actual_end_time?: string;
    attendance_count?: number;
    remarks?: string;
    irregularities_reported?: string;
    non_conducted_reason?: string;
    rescheduled_target_date?: string;
    faculty_id: number;
    faculty?: Faculty;
    program?: {
        id: number;
        code: string;
        name: string;
    };
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    exams: ExamSchedule[];
    metrics: {
        total_exams: number;
        scheduled_today: number;
        awaiting_confirmation: number;
        conducted: number;
        rescheduled: number;
        not_conducted: number;
        conducted_percentage: number;
    };
    faculties: Faculty[];
    programs: any[];
    existingOfferings: any[];
    rooms: string[];
    filters: any;
}

export default function ExamMonitoringIndex({
    currentPeriod,
    academicPeriods,
    exams = [],
    metrics,
    faculties = [],
    programs = [],
    existingOfferings = [],
    rooms = [],
    filters = {},
}: Props) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'all' | 'today' | 'awaiting' | 'calendar'>('dashboard');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedExamForConducted, setSelectedExamForConducted] = useState<ExamSchedule | null>(null);
    const [selectedExamForNotConducted, setSelectedExamForNotConducted] = useState<ExamSchedule | null>(null);
    const [selectedExamForReschedule, setSelectedExamForReschedule] = useState<ExamSchedule | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || 'all');
    const [filterExamType, setFilterExamType] = useState(filters.exam_type || 'all');

    // Create Exam Form
    const [createForm, setCreateForm] = useState({
        faculty_id: faculties[0]?.id || 1,
        course_code: existingOfferings[0]?.course_code || 'IT 311',
        course_title: existingOfferings[0]?.course_title || 'Mobile Application Development',
        section: existingOfferings[0]?.section || 'BSIT 3A',
        room_name: rooms[0] || 'ComLab 1',
        exam_type: 'Midterm',
        exam_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '10:00',
        modality: 'Face-to-Face',
        proctor_name: '',
        notes: '',
        is_confirmed: true,
    });

    // Conducted Form
    const [conductedForm, setConductedForm] = useState({
        actual_start_time: '08:00',
        actual_end_time: '10:00',
        attendance_count: 35,
        remarks: 'Exam conducted as scheduled with full proctoring compliance.',
        irregularities_reported: '',
    });

    // Not Conducted Form
    const [notConductedForm, setNotConductedForm] = useState({
        non_conducted_reason: 'Faculty Unavailable',
        non_conducted_remarks: 'Official university institutional event / meeting.',
        rescheduled_target_date: '',
    });

    // Reschedule Form
    const [rescheduleForm, setRescheduleForm] = useState({
        exam_date: '',
        start_time: '08:00',
        end_time: '10:00',
        room_name: 'ComLab 1',
        notes: 'Rescheduled per academic departmental adjustment.',
    });

    // Handle course template selection from existing semester scheduling data
    const handleSelectOffering = (offeringId: number) => {
        const found = existingOfferings.find((o) => o.id === offeringId);
        if (found) {
            setCreateForm((prev) => ({
                ...prev,
                course_code: found.course_code,
                course_title: found.course_title,
                section: found.section,
                room_name: found.room_name || prev.room_name,
                faculty_id: found.faculty_id || prev.faculty_id,
            }));
        }
    };

    const handleCreateExam = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/operations/exam-monitoring', createForm, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleConfirmConducted = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamForConducted) return;
        router.patch(`/operations/exam-monitoring/${selectedExamForConducted.id}/conducted`, conductedForm, {
            onSuccess: () => {
                setSelectedExamForConducted(null);
            },
        });
    };

    const handleConfirmNotConducted = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamForNotConducted) return;
        router.patch(`/operations/exam-monitoring/${selectedExamForNotConducted.id}/not-conducted`, notConductedForm, {
            onSuccess: () => {
                setSelectedExamForNotConducted(null);
            },
        });
    };

    const handleConfirmReschedule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExamForReschedule) return;
        router.patch(`/operations/exam-monitoring/${selectedExamForReschedule.id}/reschedule`, rescheduleForm, {
            onSuccess: () => {
                setSelectedExamForReschedule(null);
            },
        });
    };

    // Filtered lists
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExams = useMemo(() => exams.filter((e) => e.exam_date === todayStr), [exams, todayStr]);
    const awaitingExams = useMemo(() => exams.filter((e) => e.status === 'Awaiting Confirmation'), [exams]);

    const displayedExams = useMemo(() => {
        return exams.filter((e) => {
            const matchesSearch =
                e.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.faculty ? `${e.faculty.first_name} ${e.faculty.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) : false);

            const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
            const matchesType = filterExamType === 'all' || e.exam_type === filterExamType;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [exams, searchTerm, filterStatus, filterExamType]);

    const getStatusBadge = (status: ExamSchedule['status']) => {
        switch (status) {
            case 'Conducted':
                return <Badge className="bg-emerald-600 text-white font-medium">Conducted</Badge>;
            case 'Scheduled':
                return <Badge className="bg-blue-600 text-white font-medium">Scheduled</Badge>;
            case 'Awaiting Confirmation':
                return <Badge className="bg-amber-500 text-white font-medium animate-pulse">Awaiting Confirmation</Badge>;
            case 'Rescheduled':
                return <Badge className="bg-purple-600 text-white font-medium">Rescheduled</Badge>;
            case 'Not Conducted':
                return <Badge className="bg-rose-600 text-white font-medium">Not Conducted</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Monitoring - Operations Hub - CIDS OfficeHub" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header Area */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                                Operational Governance
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                Active Period: {currentPeriod ? `${currentPeriod.academic_year} - ${currentPeriod.semester}` : 'AY 2026-2027'}
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            Examination Operations & Monitoring Hub
                        </h1>
                        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                            Consolidated tracking of Preliminary, Midterm, and Final examinations across departments.
                            Auto-flags passed periods as <em>Awaiting Confirmation</em> to verify whether examinations were conducted as planned.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 shadow-sm">
                            <Plus className="h-4 w-4" /> Schedule Examination
                        </Button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-2xs">
                        <span className="text-xs font-medium text-muted-foreground">Total Exams</span>
                        <p className="mt-2 text-2xl font-bold text-foreground">{metrics.total_exams}</p>
                        <p className="text-[11px] text-muted-foreground">Active academic semester</p>
                    </div>

                    <div className="rounded-xl border border-blue-500/20 bg-blue-50/40 p-4 dark:bg-blue-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Scheduled Today</span>
                        <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-200">{metrics.scheduled_today}</p>
                        <p className="text-[11px] text-blue-700/80 dark:text-blue-400">Classrooms &amp; Laboratories</p>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-4 dark:bg-amber-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Awaiting Confirmation</span>
                        <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-200">{metrics.awaiting_confirmation}</p>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400">Time passed; action required</p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 p-4 dark:bg-emerald-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Conducted</span>
                        <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-200">{metrics.conducted}</p>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">{metrics.conducted_percentage}% Execution Rate</p>
                    </div>

                    <div className="rounded-xl border border-purple-500/20 bg-purple-50/40 p-4 dark:bg-purple-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-purple-800 dark:text-purple-300">Rescheduled</span>
                        <p className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-200">{metrics.rescheduled}</p>
                        <p className="text-[11px] text-purple-700/80 dark:text-purple-400">Adjusted timetable</p>
                    </div>

                    <div className="rounded-xl border border-rose-500/20 bg-rose-50/40 p-4 dark:bg-rose-950/20 shadow-2xs">
                        <span className="text-xs font-medium text-rose-800 dark:text-rose-300">Not Conducted</span>
                        <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-200">{metrics.not_conducted}</p>
                        <p className="text-[11px] text-rose-700/80 dark:text-rose-400">Suspension / Conflicts</p>
                    </div>
                </div>

                {/* Sub-view Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'dashboard'
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <BarChart3 className="h-4 w-4" />
                        Executive Dashboard
                    </button>

                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'all'
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <Layers className="h-4 w-4" />
                        All Exam Schedules ({exams.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('today')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'today'
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <CalendarCheck className="h-4 w-4 text-blue-500" />
                        Today's Examinations ({todayExams.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('awaiting')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'awaiting'
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Awaiting Confirmation
                        {metrics.awaiting_confirmation > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                                {metrics.awaiting_confirmation}
                            </Badge>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'calendar'
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        <Calendar className="h-4 w-4" />
                        Timeline / Room Grid View
                    </button>
                </div>

                {/* Tab 1: Executive Dashboard View */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Awaiting Confirmation Callout if any */}
                        {awaitingExams.length > 0 && (
                            <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                                                {awaitingExams.length} Examinations Awaiting Post-Exam Confirmation
                                            </h3>
                                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                                The scheduled exam time has passed. Faculty or Department Chairs must record whether exams were conducted or need rescheduling.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-amber-400 text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900"
                                        onClick={() => setActiveTab('awaiting')}
                                    >
                                        Review Awaiting Exams <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Today's Live Examination Status */}
                            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">Today's Examination Schedule</h3>
                                        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <Badge variant="outline">{todayExams.length} Scheduled</Badge>
                                </div>

                                <div className="divide-y divide-border/40">
                                    {todayExams.length === 0 ? (
                                        <div className="py-8 text-center text-muted-foreground text-xs">
                                            No examinations scheduled for today.
                                        </div>
                                    ) : (
                                        todayExams.map((exam) => (
                                            <div key={exam.id} className="py-3 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-foreground">{exam.course_code}</span>
                                                        <span className="text-xs text-muted-foreground font-semibold">({exam.section})</span>
                                                        <Badge variant="outline" className="text-[10px]">{exam.exam_type}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span><Clock className="inline mr-1 h-3 w-3" />{exam.start_time.substring(0, 5)} - {exam.end_time.substring(0, 5)}</span>
                                                        <span>•</span>
                                                        <span><MapPin className="inline mr-1 h-3 w-3 text-amber-500" />{exam.room_name}</span>
                                                        <span>•</span>
                                                        <span>{exam.faculty ? `${exam.faculty.first_name} ${exam.faculty.last_name}` : 'TBA'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(exam.status)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Operational Summary & TV Display Feed */}
                            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">Campus Operational Visibility</h3>
                                        <p className="text-xs text-muted-foreground">Public TV Workspace & Monitoring Integration</p>
                                    </div>
                                    <Badge className="bg-amber-500 text-white">Live Streamed</Badge>
                                </div>

                                <div className="space-y-3 text-xs text-muted-foreground">
                                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground">TV Spotlight & Display Widget</span>
                                            <Badge variant="outline" className="text-[10px]">Active</Badge>
                                        </div>
                                        <p className="text-[11px] leading-relaxed">
                                            Safe operational information (Course, Section, Examination Time, Room) is piped directly into TV Displays and Lab Signage to guide students while obscuring confidential exam items.
                                        </p>
                                        <div className="pt-2 flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => window.open('/tv-display', '_blank')}>
                                                <Eye className="h-3.5 w-3.5" /> Preview TV Display Feed
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 space-y-2">
                                        <span className="font-semibold text-foreground">Conduct Verification Integrity</span>
                                        <p className="text-[11px] leading-relaxed">
                                            OfficeHub treats exam monitoring as an accountability record: once time elapses, an exam is not assumed to have happened until confirmed with actual headcounts and optional proctor documentation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: All Exam Schedules / Filters Table */}
                {(activeTab === 'all' || activeTab === 'today' || activeTab === 'awaiting') && (
                    <div className="space-y-4">
                        {/* Search & Filters */}
                        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter by course, section, room, or faculty..."
                                    className="pl-8 text-xs h-9"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Awaiting Confirmation">Awaiting Confirmation</option>
                                    <option value="Conducted">Conducted</option>
                                    <option value="Rescheduled">Rescheduled</option>
                                    <option value="Not Conducted">Not Conducted</option>
                                </select>

                                <select
                                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9"
                                    value={filterExamType}
                                    onChange={(e) => setFilterExamType(e.target.value)}
                                >
                                    <option value="all">All Exam Types</option>
                                    <option value="Preliminary">Preliminary</option>
                                    <option value="Midterm">Midterm</option>
                                    <option value="Final">Final</option>
                                    <option value="Practical/Laboratory Exam">Practical / Lab</option>
                                    <option value="Quiz/Departmental Exam">Quiz / Departmental</option>
                                </select>
                            </div>
                        </div>

                        {/* Examinations Table */}
                        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border/40 bg-muted/40 font-semibold uppercase text-[11px] text-muted-foreground">
                                        <th className="py-3 px-4">Course &amp; Section</th>
                                        <th className="py-3 px-4">Exam Type</th>
                                        <th className="py-3 px-4">Date &amp; Time</th>
                                        <th className="py-3 px-4">Room / Lab</th>
                                        <th className="py-3 px-4">Assigned Faculty</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {(activeTab === 'today' ? todayExams : activeTab === 'awaiting' ? awaitingExams : displayedExams).length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                                                No examinations found matching the selected filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        (activeTab === 'today' ? todayExams : activeTab === 'awaiting' ? awaitingExams : displayedExams).map((exam) => (
                                            <tr key={exam.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-foreground block">{exam.course_code}</span>
                                                    <span className="text-[11px] text-muted-foreground">{exam.course_title} • <strong>{exam.section}</strong></span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="font-semibold text-[11px]">
                                                        {exam.exam_type}
                                                    </Badge>
                                                    <span className="block text-[10px] text-muted-foreground mt-0.5">{exam.modality}</span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-foreground">{new Date(exam.exam_date).toLocaleDateString()}</div>
                                                    <div className="text-[11px] text-muted-foreground font-mono">{exam.start_time.substring(0, 5)} - {exam.end_time.substring(0, 5)}</div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1 font-semibold text-foreground">
                                                        <MapPin className="h-3 w-3 text-amber-500" />
                                                        <span>{exam.room_name}</span>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    {exam.faculty ? (
                                                        <span className="font-medium text-foreground">
                                                            {exam.faculty.first_name} {exam.faculty.last_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Unassigned</span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4">
                                                    {getStatusBadge(exam.status)}
                                                    {exam.attendance_count && (
                                                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                                                            {exam.attendance_count} students
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {exam.status !== 'Conducted' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-[11px] border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                                                                onClick={() => {
                                                                    setSelectedExamForConducted(exam);
                                                                    setConductedForm({
                                                                        actual_start_time: exam.start_time,
                                                                        actual_end_time: exam.end_time,
                                                                        attendance_count: 35,
                                                                        remarks: 'Conducted without issues.',
                                                                        irregularities_reported: '',
                                                                    });
                                                                }}
                                                            >
                                                                <Check className="mr-1 h-3 w-3" /> Conducted
                                                            </Button>
                                                        )}

                                                        {exam.status !== 'Not Conducted' && exam.status !== 'Conducted' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-[11px] border-rose-500/40 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                                                                onClick={() => setSelectedExamForNotConducted(exam)}
                                                            >
                                                                <XCircle className="mr-1 h-3 w-3" /> Not Conducted
                                                            </Button>
                                                        )}

                                                        {exam.status !== 'Conducted' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 text-[11px]"
                                                                onClick={() => {
                                                                    setSelectedExamForReschedule(exam);
                                                                    setRescheduleForm({
                                                                        exam_date: exam.exam_date,
                                                                        start_time: exam.start_time,
                                                                        end_time: exam.end_time,
                                                                        room_name: exam.room_name,
                                                                        notes: '',
                                                                    });
                                                                }}
                                                            >
                                                                Reschedule
                                                            </Button>
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
                )}

                {/* Tab 3: Calendar / Timeline Grid */}
                {activeTab === 'calendar' && (
                    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-border/40 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Examination Timeline &amp; Room Allocations</h3>
                                <p className="text-xs text-muted-foreground">Identify daily examination activity and ensure zero classroom/lab overlaps.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                                <div key={day} className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
                                    <span className="text-xs font-bold text-foreground block border-b border-border/30 pb-1">{day}</span>
                                    <div className="space-y-2">
                                        {exams.filter((_, i) => i % 7 === idx).slice(0, 3).map((e) => (
                                            <div key={e.id} className="rounded-lg bg-card border border-border/50 p-2 shadow-2xs space-y-1">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="font-bold text-foreground">{e.course_code}</span>
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0">{e.exam_type.substring(0, 3)}</Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">{e.start_time.substring(0, 5)} - {e.end_time.substring(0, 5)}</p>
                                                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">{e.room_name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Schedule Examination */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-lg font-['Poppins']">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Schedule Academic Examination
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Select one of your semester offerings to auto-populate course and section details, then define the examination timing and facility.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateExam} className="space-y-3.5 pt-1">
                        {existingOfferings.length > 0 && (
                            <div className="space-y-1">
                                <Label className="text-xs">Quick-Fill from Semester Offerings</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    onChange={(e) => handleSelectOffering(Number(e.target.value))}
                                >
                                    <option value="">-- Choose an assigned course & section --</option>
                                    {existingOfferings.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.course_code} - {o.course_title} ({o.section})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Course Code</Label>
                                <Input
                                    value={createForm.course_code}
                                    onChange={(e) => setCreateForm({ ...createForm, course_code: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Section</Label>
                                <Input
                                    value={createForm.section}
                                    onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Course Title</Label>
                            <Input
                                value={createForm.course_title}
                                onChange={(e) => setCreateForm({ ...createForm, course_title: e.target.value })}
                                className="text-xs"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Exam Type</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    value={createForm.exam_type}
                                    onChange={(e) => setCreateForm({ ...createForm, exam_type: e.target.value })}
                                >
                                    <option value="Preliminary">Preliminary</option>
                                    <option value="Midterm">Midterm</option>
                                    <option value="Final">Final</option>
                                    <option value="Practical/Laboratory Exam">Practical / Lab Exam</option>
                                    <option value="Quiz/Departmental Exam">Quiz / Departmental Exam</option>
                                    <option value="Custom">Custom Examination</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Assigned Faculty / Proctor</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    value={createForm.faculty_id}
                                    onChange={(e) => setCreateForm({ ...createForm, faculty_id: Number(e.target.value) })}
                                >
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.last_name}, {f.first_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Exam Date</Label>
                                <Input
                                    type="date"
                                    value={createForm.exam_date}
                                    onChange={(e) => setCreateForm({ ...createForm, exam_date: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                    type="time"
                                    value={createForm.start_time}
                                    onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">End Time</Label>
                                <Input
                                    type="time"
                                    value={createForm.end_time}
                                    onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Room / Laboratory</Label>
                                <Input
                                    value={createForm.room_name}
                                    onChange={(e) => setCreateForm({ ...createForm, room_name: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Modality</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    value={createForm.modality}
                                    onChange={(e) => setCreateForm({ ...createForm, modality: e.target.value })}
                                >
                                    <option value="Face-to-Face">Face-to-Face</option>
                                    <option value="Laboratory Hands-on">Laboratory Hands-on</option>
                                    <option value="Online">Online Proctored</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Special Instructions / Remarks</Label>
                            <Input
                                placeholder="e.g. Requires ComLab GPU workstation access..."
                                value={createForm.notes}
                                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Schedule Exam</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Mark as Conducted */}
            <Dialog open={!!selectedExamForConducted} onOpenChange={() => setSelectedExamForConducted(null)}>
                <DialogContent className="max-w-md font-['Poppins']">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            Confirm Conducted Examination
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Verify that {selectedExamForConducted?.course_code} ({selectedExamForConducted?.section}) was conducted as scheduled.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleConfirmConducted} className="space-y-3.5 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Actual Start</Label>
                                <Input
                                    type="time"
                                    value={conductedForm.actual_start_time}
                                    onChange={(e) => setConductedForm({ ...conductedForm, actual_start_time: e.target.value })}
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Actual End</Label>
                                <Input
                                    type="time"
                                    value={conductedForm.actual_end_time}
                                    onChange={(e) => setConductedForm({ ...conductedForm, actual_end_time: e.target.value })}
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Student Attendance Count</Label>
                            <Input
                                type="number"
                                value={conductedForm.attendance_count}
                                onChange={(e) => setConductedForm({ ...conductedForm, attendance_count: Number(e.target.value) })}
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Proctoring Remarks</Label>
                            <Input
                                value={conductedForm.remarks}
                                onChange={(e) => setConductedForm({ ...conductedForm, remarks: e.target.value })}
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setSelectedExamForConducted(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                Confirm Conducted
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Mark as Not Conducted */}
            <Dialog open={!!selectedExamForNotConducted} onOpenChange={() => setSelectedExamForNotConducted(null)}>
                <DialogContent className="max-w-md font-['Poppins']">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-rose-600" />
                            Record Non-Conducted Examination
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Document why {selectedExamForNotConducted?.course_code} could not proceed.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleConfirmNotConducted} className="space-y-3.5 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Reason for Non-Execution</Label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                value={notConductedForm.non_conducted_reason}
                                onChange={(e) => setNotConductedForm({ ...notConductedForm, non_conducted_reason: e.target.value })}
                            >
                                <option value="Faculty Unavailable">Faculty Unavailable / Medical</option>
                                <option value="Student Activity Conflict">Student Activity Conflict</option>
                                <option value="Room Issue">Room / Lab Facility Issue</option>
                                <option value="Suspension of Classes">Institutional Suspension of Classes / Weather</option>
                                <option value="Technical Problem">Technical / Power Failure</option>
                                <option value="Other">Other Operational Reason</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Remarks &amp; Context</Label>
                            <Input
                                value={notConductedForm.non_conducted_remarks}
                                onChange={(e) => setNotConductedForm({ ...notConductedForm, non_conducted_remarks: e.target.value })}
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Target Rescheduling Date (Optional)</Label>
                            <Input
                                type="date"
                                value={notConductedForm.rescheduled_target_date}
                                onChange={(e) => setNotConductedForm({ ...notConductedForm, rescheduled_target_date: e.target.value })}
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setSelectedExamForNotConducted(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                                Save Record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Reschedule Exam */}
            <Dialog open={!!selectedExamForReschedule} onOpenChange={() => setSelectedExamForReschedule(null)}>
                <DialogContent className="max-w-md font-['Poppins']">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-purple-600" />
                            Reschedule Examination
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Update the date, time, and room for {selectedExamForReschedule?.course_code}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleConfirmReschedule} className="space-y-3.5 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs">New Exam Date</Label>
                            <Input
                                type="date"
                                value={rescheduleForm.exam_date}
                                onChange={(e) => setRescheduleForm({ ...rescheduleForm, exam_date: e.target.value })}
                                className="text-xs"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                    type="time"
                                    value={rescheduleForm.start_time}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, start_time: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">End Time</Label>
                                <Input
                                    type="time"
                                    value={rescheduleForm.end_time}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, end_time: e.target.value })}
                                    className="text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Assigned Room / Lab</Label>
                            <Input
                                value={rescheduleForm.room_name}
                                onChange={(e) => setRescheduleForm({ ...rescheduleForm, room_name: e.target.value })}
                                className="text-xs"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setSelectedExamForReschedule(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                                Confirm Reschedule
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
