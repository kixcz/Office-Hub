import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import {
    CheckSquare,
    Layers,
    Users,
    Building2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowRight,
    ChevronRight,
    Search,
    Filter,
    Download,
    Flag,
    MessageSquare,
    History,
    PieChart,
    ShieldCheck,
    Send,
    Check,
    X,
    Sparkles,
    UserCheck,
    RotateCcw,
    FileText,
    Eye,
    Calendar,
    Lock,
    Unlock,
    BookOpen,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Faculty Loading', href: '/schedule/loading' },
    { title: 'Loading Review', href: '/schedule/loading-review' },
];

interface ProgramSummary {
    id: number;
    code: string;
    name: string;
    faculty_count: number;
    status: string;
    program_head: string;
    total_load: number;
    avg_load: number;
    load_balance_percent: number;
    unresolved_issues: number;
    endorsement_notes?: string;
    endorsed_at?: string;
    distribution: {
        within_target: number;
        underload: number;
        overload: number;
    };
}

interface FacultyLoadItem {
    id: number;
    name: string;
    avatar?: string;
    program_id: number;
    program_code: string;
    program_name: string;
    designation: string;
    academic_rank: string;
    specialization: string;
    target_load: number;
    assigned_load: number;
    preparations: number;
    course_match: number;
    status: string;
    assigned_courses: Array<{
        id: number;
        course_code: string;
        course_title: string;
        section: string;
        units: number;
        hours: number;
        type: string;
    }>;
}

interface FlagItem {
    id: number;
    program_id?: number;
    program_code: string;
    faculty_id?: number;
    faculty_name?: string;
    reviewer_role: string;
    reviewer_name: string;
    flag_type: string;
    severity: string;
    comment: string;
    suggested_action?: string;
    status: string;
    resolution_notes?: string;
    resolved_by?: string;
    resolved_at?: string;
    created_at: string;
}

interface AuditLogItem {
    id: number;
    action: string;
    user_name: string;
    program_code: string;
    target_type?: string;
    details?: string;
    created_at: string;
}

interface ChangeRequest {
    id: number;
    requester: string;
    requester_program: string;
    target_faculty: string;
    offering_course: string;
    offering_section: string;
    target_course: string;
    target_section: string;
    reason: string;
    status: 'Pending' | 'For Approval' | 'Approved' | 'Declined';
    days_ago: string;
}

interface LoadingReviewProps {
    currentPeriod: any;
    academicPeriods: any[];
    college: any;
    currentWorkflowStage: string;
    summary: {
        total_programs: number;
        total_faculty: number;
        for_program_review: number;
        for_dean_review: number;
        completed_reviews: number;
        with_issues: number;
        balanced_count: number;
        overloaded_count: number;
        underloaded_count: number;
        unresolved_flags: number;
    };
    programs: ProgramSummary[];
    facultyLoads: FacultyLoadItem[];
    flags: FlagItem[];
    collegeReview: {
        id: number;
        status: string;
        dean_name: string;
        decision_notes?: string;
        decided_at?: string;
        can_dean_review: boolean;
    } | null;
    auditHistory: AuditLogItem[];
}

export default function LoadingReviewPage({
    currentPeriod,
    academicPeriods = [],
    college,
    currentWorkflowStage = 'faculty_review',
    summary,
    programs = [],
    facultyLoads = [],
    flags = [],
    collegeReview,
    auditHistory = [],
}: LoadingReviewProps) {
    // Modals & Drawers state
    const [showWorkflowModal, setShowWorkflowModal] = useState(false);
    const [showFacultyLoadingModal, setShowFacultyLoadingModal] = useState(false);
    const [showChangeRequestsModal, setShowChangeRequestsModal] = useState(false);
    const [inspectedFaculty, setInspectedFaculty] = useState<FacultyLoadItem | null>(facultyLoads[0] || null);

    // Course Change Requests mock data matching the screenshot ("5 (2 Pending, 3 For Approval)")
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([
        {
            id: 1,
            requester: 'Prof. J. Dela Cruz',
            requester_program: 'DIT Program',
            target_faculty: 'Prof. K. Panaligan',
            offering_course: 'ITEL 601 (AI)',
            offering_section: 'DIT 3B',
            target_course: 'CS 612 (Prog II)',
            target_section: 'BSIT 2A',
            reason: 'Direct specialization alignment in Machine Learning',
            status: 'For Approval',
            days_ago: '1 day ago',
        },
        {
            id: 2,
            requester: 'Prof. M. Ramos',
            requester_program: 'BSIS Program',
            target_faculty: 'Prof. A. Torres',
            offering_course: 'ISEL 601 (Data Viz)',
            offering_section: 'BSIS 3A',
            target_course: 'IT 635 (Prototyping)',
            target_section: 'BSIT 1A',
            reason: 'Mutual consent swap due to lab software readiness',
            status: 'For Approval',
            days_ago: '2 days ago',
        },
        {
            id: 3,
            requester: 'Prof. Domingo Origines',
            requester_program: 'BSIT Program',
            target_faculty: 'Prof. Jean Nikolai Roxas',
            offering_course: 'CS 121 (Prog II)',
            offering_section: 'BSCS 1B',
            target_course: 'IT 111 (Intro Computing)',
            target_section: 'BSIT 1C',
            reason: 'Administrative schedule deconfliction for College Dean',
            status: 'For Approval',
            days_ago: '2 days ago',
        },
        {
            id: 4,
            requester: 'Prof. Rhea Mae Perito',
            requester_program: 'BSIS Program',
            target_faculty: 'Prof. Carlos Mendoza',
            offering_course: 'ISEL 602 (Enterprise Sec)',
            offering_section: 'BSIS 4A',
            target_course: 'ITEL 604 (Integrative Prog)',
            target_section: 'DIT 4A',
            reason: 'Specialization matching for senior network security project',
            status: 'Pending',
            days_ago: '3 hours ago',
        },
        {
            id: 5,
            requester: 'Prof. Carlos Mendoza',
            requester_program: 'BSDS Program',
            target_faculty: 'Prof. J. Dela Cruz',
            offering_course: 'MATH 101 (Modern World)',
            offering_section: 'BSDS 1A',
            target_course: 'GE 101 (Understanding Self)',
            target_section: 'BSIT 1B',
            reason: 'Faculty mutual agreement on foundation courses',
            status: 'Pending',
            days_ago: '5 hours ago',
        },
    ]);

    const handleApproveRequest = (id: number) => {
        setChangeRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
        );
    };

    const handleDeclineRequest = (id: number) => {
        setChangeRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'Declined' } : r))
        );
    };

    const handleLockLoading = () => {
        if (confirm('Lock Faculty Loading? This will finalize all assignments and unlock Timetable Generation (CP-SAT).')) {
            router.post('/schedule/timetable/lock-loading', {}, {
                onSuccess: () => alert('Faculty loading has been locked successfully! Timetable generation is now unlocked.'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loading Review - Semester Scheduling" />
            <SchedulingWorkspaceLayout
                currentPeriod={currentPeriod}
                academicPeriods={academicPeriods}
                title="Loading Review"
                subtitle="Review, approve, and finalize the faculty loading before timetable generation."
            >
                <div className="space-y-6">
                    {/* Header Card (Bottom-Right Quadrant Match) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#60122B] text-white shadow-md shadow-[#8B1E3F]/20">
                                    <CheckSquare className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Loading Review
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Review, approve, and finalize the faculty loading before timetable generation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowWorkflowModal(true)}
                                    className="gap-2 border-slate-200 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    View Workflow
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Linear Progress Step Pipeline Tracker (1 -> 2 -> 3 -> 4 -> 5 -> 6) */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex min-w-[760px] items-center justify-between">
                            {/* Step 1: Generated v3 */}
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                    <Check className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                        1. Generated
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium">v3 Ready</div>
                                </div>
                            </div>

                            <div className="h-0.5 w-8 bg-emerald-500" />

                            {/* Step 2: Program Review Completed */}
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                    <Check className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                        2. Program Review
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium">Completed</div>
                                </div>
                            </div>

                            <div className="h-0.5 w-8 bg-emerald-500" />

                            {/* Step 3: Dean Review Completed */}
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                    <Check className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                        3. Dean Review
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium">Completed</div>
                                </div>
                            </div>

                            <div className="h-0.5 w-8 bg-[#8B1E3F]" />

                            {/* Step 4: Faculty Review In Progress */}
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#8B1E3F] text-xs font-bold text-white shadow-sm shadow-[#8B1E3F]/30 ring-4 ring-[#8B1E3F]/20">
                                    4
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-[#8B1E3F] dark:text-rose-400">
                                        4. Faculty Review
                                    </div>
                                    <div className="text-[10px] font-semibold text-rose-600">In Progress</div>
                                </div>
                            </div>

                            <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-700" />

                            {/* Step 5: Final Validation Pending */}
                            <div className="flex items-center gap-2.5 opacity-60">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                    5
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        5. Final Validation
                                    </div>
                                    <div className="text-[10px] text-slate-400">Pending</div>
                                </div>
                            </div>

                            <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-700" />

                            {/* Step 6: Locked Pending */}
                            <div className="flex items-center gap-2.5 opacity-60">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                    6
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        6. Locked
                                    </div>
                                    <div className="text-[10px] text-slate-400">Pending</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Two Main Columns Grid (Matching Quadrant) */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left Column: Faculty Loading Overview & Review Details */}
                        <div className="space-y-6">
                            {/* Card 1: Faculty Loading Overview */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-[#8B1E3F]" />
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Faculty Loading Overview
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        AY 2026 - 2027, 1st Semester - Version 3
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div className="flex justify-center text-blue-600">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                            {summary?.total_faculty || 124}
                                        </div>
                                        <div className="text-[10px] text-slate-500">Faculty</div>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div className="flex justify-center text-amber-600">
                                            <BookOpen className="h-4 w-4" />
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                            326
                                        </div>
                                        <div className="text-[10px] text-slate-500">Assignments</div>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div className="flex justify-center text-orange-600">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                            12.0 hrs
                                        </div>
                                        <div className="text-[10px] text-slate-500">Avg. Load</div>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div className="flex justify-center text-emerald-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                            0
                                        </div>
                                        <div className="text-[10px] text-slate-500">Unassigned</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Review Details */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <Clock className="h-4 w-4 text-[#8B1E3F]" />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Review Details
                                    </h3>
                                </div>

                                <div className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-slate-500">Current Status</span>
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            Faculty Review (Published)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-slate-500">Review Window</span>
                                        <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            Nov 13 - Nov 16, 2026 (3 days remaining)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-slate-500">Course Change Requests</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                5 (2 Pending, 3 For Approval)
                                            </span>
                                            <button
                                                onClick={() => setShowChangeRequestsModal(true)}
                                                className="text-[11px] font-semibold text-[#8B1E3F] hover:underline dark:text-rose-400"
                                            >
                                                View Requests
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-slate-500">Next Action</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            Validate requests and lock loading
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Workflow Actions & Timeline */}
                        <div className="space-y-6">
                            {/* Card 1: Workflow Actions */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <ShieldCheck className="h-4 w-4 text-[#8B1E3F]" />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Workflow Actions
                                    </h3>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowFacultyLoadingModal(true)}
                                        className="w-full justify-center gap-2 border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        View Faculty Loading
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => setShowChangeRequestsModal(true)}
                                        className="w-full justify-center gap-2 border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Review Change Requests (5)
                                    </Button>

                                    <div className="pt-1">
                                        <Button
                                            onClick={handleLockLoading}
                                            className="w-full justify-center gap-2 bg-[#8B1E3F] py-2.5 text-xs font-bold text-white shadow-md shadow-[#8B1E3F]/20 hover:bg-[#721833]"
                                        >
                                            <Lock className="h-3.5 w-3.5" />
                                            Lock Loading
                                        </Button>
                                        <div className="mt-1 text-center text-[10px] text-slate-400">
                                            (After all requests are resolved)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Timeline */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <History className="h-4 w-4 text-[#8B1E3F]" />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Timeline
                                    </h3>
                                </div>

                                <div className="mt-4 space-y-3 text-xs">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900 dark:text-white">Generated</div>
                                            <div className="text-[11px] text-slate-400">Nov 10, 2026 - 09:14 AM</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                Program Review Completed
                                            </div>
                                            <div className="text-[11px] text-slate-400">Nov 11, 2026 - 04:20 PM</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                Dean Review Completed
                                            </div>
                                            <div className="text-[11px] text-slate-400">Nov 12, 2026 - 10:35 AM</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#8B1E3F] dark:bg-[#8B1E3F]/20 dark:text-rose-400">
                                            <span className="h-2 w-2 rounded-full bg-[#8B1E3F]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                Faculty Review (In Progress)
                                            </div>
                                            <div className="text-[11px] text-slate-400">Nov 13 - 16, 2026</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal 1: Workflow Overview Modal */}
                {showWorkflowModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-[#8B1E3F]" />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Faculty Loading Governance Workflow
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowWorkflowModal(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-400">
                                <p>
                                    The loading governance process enforces institutional checks and balances before any timetable generation can proceed:
                                </p>
                                <div className="space-y-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
                                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] dark:bg-slate-700">1</span>
                                        Loading Generator produces candidate scenarios with CP-SAT solver
                                    </div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] dark:bg-slate-700">2</span>
                                        Program Heads review department-specific courses and faculty workloads
                                    </div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] dark:bg-slate-700">3</span>
                                        College Dean reviews consolidated college plan and approves for publication
                                    </div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B1E3F] text-[10px] text-white">4</span>
                                        Faculty Review Window allows peer-to-peer course change requests
                                    </div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] dark:bg-slate-700">5</span>
                                        Final Validation resolves any pending requests
                                    </div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] dark:bg-slate-700">6</span>
                                        Locking Loading unlocks Timetable Constraints & CP-SAT Schedule Generator
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Button
                                    size="sm"
                                    onClick={() => setShowWorkflowModal(false)}
                                    className="bg-[#8B1E3F] text-xs text-white hover:bg-[#721833]"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal 2: View Faculty Loading Modal */}
                {showFacultyLoadingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Official Faculty Loading (AY 2026 - 2027, 1st Sem)
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Showing all assigned courses, workload credit breakdowns, and status.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowFacultyLoadingModal(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                        <tr>
                                            <th className="px-3 py-2.5 font-semibold">Faculty</th>
                                            <th className="px-3 py-2.5 font-semibold">Program</th>
                                            <th className="px-3 py-2.5 font-semibold">Designation</th>
                                            <th className="px-3 py-2.5 font-semibold">Assigned Load</th>
                                            <th className="px-3 py-2.5 font-semibold">Target Load</th>
                                            <th className="px-3 py-2.5 font-semibold">Preps</th>
                                            <th className="px-3 py-2.5 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {facultyLoads.slice(0, 15).map((f) => (
                                            <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white">
                                                    {f.name}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-500">{f.program_code}</td>
                                                <td className="px-3 py-2.5 text-slate-600">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {f.designation}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                                                    {Number(f.assigned_load).toFixed(1)} hrs/wk
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-500">
                                                    {Number(f.target_load).toFixed(1)} hrs/wk
                                                </td>
                                                <td className="px-3 py-2.5">{f.preparations}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {f.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Button
                                    size="sm"
                                    onClick={() => setShowFacultyLoadingModal(false)}
                                    className="bg-[#8B1E3F] text-xs text-white hover:bg-[#721833]"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal 3: Review Change Requests Modal */}
                {showChangeRequestsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-[#8B1E3F]" />
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Faculty-to-Faculty Course Change Requests
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowChangeRequestsModal(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {changeRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-800/60"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {req.requester}
                                                </span>
                                                <span className="text-slate-400">⇄</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {req.target_faculty}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-slate-400">{req.days_ago}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        req.status === 'Approved'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : req.status === 'Declined'
                                                              ? 'bg-rose-50 text-rose-700'
                                                              : 'bg-amber-50 text-amber-700'
                                                    }
                                                >
                                                    {req.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mt-2.5 rounded-lg bg-slate-50 p-2.5 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                Proposed Course Swap:
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-[11px]">
                                                <span className="rounded bg-white px-2 py-0.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                                                    {req.offering_course} ({req.offering_section})
                                                </span>
                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                                <span className="rounded bg-white px-2 py-0.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                                                    {req.target_course} ({req.target_section})
                                                </span>
                                            </div>
                                            <div className="mt-1.5 text-[11px] text-slate-500">
                                                Reason: {req.reason}
                                            </div>
                                        </div>

                                        {req.status !== 'Approved' && req.status !== 'Declined' && (
                                            <div className="mt-3 flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeclineRequest(req.id)}
                                                    className="h-7 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                >
                                                    Decline
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApproveRequest(req.id)}
                                                    className="h-7 bg-[#8B1E3F] text-xs font-semibold text-white hover:bg-[#721833]"
                                                >
                                                    Approve Swap
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Button
                                    size="sm"
                                    onClick={() => setShowChangeRequestsModal(false)}
                                    className="bg-[#8B1E3F] text-xs text-white hover:bg-[#721833]"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
