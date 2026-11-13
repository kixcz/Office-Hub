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
    Printer,
    SlidersHorizontal,
    FileSpreadsheet,
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

interface FinalizedLoadingRow {
    index: number;
    faculty_name: string;
    academic_rank: string;
    program_code: string;
    designation: string;
    course_code: string;
    descriptive_title: string;
    section: string;
    lec_units: number;
    lab_units: number;
    total_units: number;
    schedule: string;
    room: string;
    assignment_source: 'CP-SAT' | 'Fixed' | 'Manual' | 'Exclusive';
    validation: 'Validated' | 'Warning' | 'Conflict';
    remarks: string;
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

    // Filters for Finalized Matrix Modal
    const [matrixProgramFilter, setMatrixProgramFilter] = useState<string>('All');
    const [matrixFacultyFilter, setMatrixFacultyFilter] = useState<string>('All');
    const [matrixStatusFilter, setMatrixStatusFilter] = useState<string>('All');
    const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');

    // Pre-loaded realistic Finalized Loading Matrix dataset (matching uploaded screenshot)
    const finalizedLoadingData: Record<string, FinalizedLoadingRow[]> = {
        'BSIT — Bachelor of Science in Information Technology': [
            {
                index: 1,
                faculty_name: 'Dr. Maria Santos',
                academic_rank: 'Associate Professor',
                program_code: 'BSIT',
                designation: 'Associate Professor',
                course_code: 'IT 210',
                descriptive_title: 'Programming II',
                section: '1A',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Tu 5:30–7:00 PM (L)\nTh 5:30–7:00 PM (L)',
                room: 'CLR 3',
                assignment_source: 'CP-SAT',
                validation: 'Validated',
                remarks: '—',
            },
            {
                index: 1,
                faculty_name: 'Dr. Maria Santos',
                academic_rank: 'Associate Professor',
                program_code: 'BSIT',
                designation: 'Associate Professor',
                course_code: 'IT 311',
                descriptive_title: 'Database Systems',
                section: '3A',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Mw 1:00–2:30 PM (L)\nMw 2:30–4:00 PM (Lab)',
                room: 'CLR 2',
                assignment_source: 'CP-SAT',
                validation: 'Validated',
                remarks: '—',
            },
            {
                index: 2,
                faculty_name: 'Engr. John Reyes',
                academic_rank: 'Assistant Professor',
                program_code: 'BSIT',
                designation: 'Assistant Professor',
                course_code: 'IT 401',
                descriptive_title: 'Capstone Project',
                section: '4A',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Tu 8:00–11:00 AM (Lab)',
                room: 'CHS',
                assignment_source: 'Fixed',
                validation: 'Validated',
                remarks: 'Fixed assignment (All sections - Capstone)',
            },
            {
                index: 2,
                faculty_name: 'Engr. John Reyes',
                academic_rank: 'Assistant Professor',
                program_code: 'BSIT',
                designation: 'Assistant Professor',
                course_code: 'IT 401',
                descriptive_title: 'Capstone Project',
                section: '4B',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Th 8:00–11:00 AM (Lab)',
                room: 'CHS',
                assignment_source: 'Fixed',
                validation: 'Validated',
                remarks: 'Fixed assignment (All sections - Capstone)',
            },
            {
                index: 2,
                faculty_name: 'Engr. John Reyes',
                academic_rank: 'Assistant Professor',
                program_code: 'BSIT',
                designation: 'Assistant Professor',
                course_code: 'IT 401',
                descriptive_title: 'Capstone Project',
                section: '4C',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Fr 8:00–11:00 AM (Lab)',
                room: 'CHS',
                assignment_source: 'Fixed',
                validation: 'Validated',
                remarks: 'Fixed assignment (All sections - Capstone)',
            },
        ],
        'BSIS — Bachelor of Science in Information Systems': [
            {
                index: 3,
                faculty_name: 'Ms. Angela Cruz',
                academic_rank: 'Instructor',
                program_code: 'BSIS',
                designation: 'Instructor',
                course_code: 'IS 310',
                descriptive_title: 'Data Visualization',
                section: '3A',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Mw 9:00–10:30 AM (L)\nMw 10:30–12:00 PM (Lab)',
                room: 'CLR 4',
                assignment_source: 'CP-SAT',
                validation: 'Validated',
                remarks: '—',
            },
            {
                index: 3,
                faculty_name: 'Ms. Angela Cruz',
                academic_rank: 'Instructor',
                program_code: 'BSIS',
                designation: 'Instructor',
                course_code: 'IS 320',
                descriptive_title: 'Enterprise Systems',
                section: '4A',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Tu 1:00–2:30 PM (L)\nTu 2:30–4:00 PM (Lab)',
                room: 'CLR 4',
                assignment_source: 'CP-SAT',
                validation: 'Validated',
                remarks: 'Cross-program load (shared faculty)',
            },
        ],
        'BSCS — Bachelor of Science in Computer Science': [
            {
                index: 4,
                faculty_name: 'Dr. Kevin Dela Cruz',
                academic_rank: 'Associate Professor',
                program_code: 'BSCS',
                designation: 'Associate Professor',
                course_code: 'CS 210',
                descriptive_title: 'Algorithms',
                section: '2A',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Tu 10:30–12:00 PM (L)\nTu 1:00–2:30 PM (Lab)',
                room: 'CLR 1',
                assignment_source: 'CP-SAT',
                validation: 'Validated',
                remarks: '—',
            },
            {
                index: 4,
                faculty_name: 'Dr. Kevin Dela Cruz',
                academic_rank: 'Associate Professor',
                program_code: 'BSCS',
                designation: 'Associate Professor',
                course_code: 'CS 320',
                descriptive_title: 'Artificial Intelligence',
                section: '3A',
                lec_units: 2,
                lab_units: 3,
                total_units: 5,
                schedule: 'Th 1:00–2:30 PM (L)\nTh 2:30–4:00 PM (Lab)',
                room: 'CLR 1',
                assignment_source: 'CP-SAT',
                validation: 'Validated',
                remarks: 'Needs room assignment (for Lab)',
            },
        ],
    };

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
                                        className="w-full justify-center gap-2 border-[#8B1E3F]/30 bg-rose-50/50 py-2.5 text-xs font-semibold text-[#8B1E3F] hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        View Faculty Loading Matrix
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

                {/* Modal 2: Finalized Faculty Loading Matrix Modal (Exact Match to Reference Image) */}
                {showFacultyLoadingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm">
                        <div className="flex max-h-[96vh] w-full max-w-[98vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 font-['Poppins']">
                            {/* Modal Header Bar with Title, Subtitle, and Action Buttons */}
                            <div className="border-b border-slate-200 p-4 sm:p-5 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                            <span>Semester Scheduling</span>
                                            <ChevronRight className="h-3 w-3" />
                                            <span>Faculty Loading</span>
                                            <ChevronRight className="h-3 w-3" />
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Finalized Loading</span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-3">
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                Finalized Loading
                                            </span>
                                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                Faculty Loading Matrix
                                            </h2>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Ready for Scheduling
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            AY 2026–2027 | 1st Semester | College of Information and Digital Sciences (CIDS)
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.print()}
                                            className="h-8 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Export
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.print()}
                                            className="h-8 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                            Print
                                        </Button>
                                        <a
                                            href="/schedule/timetable/generator"
                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#8B1E3F] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[#721833]"
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5" />
                                            View Timetable Readiness
                                        </a>
                                        <button
                                            onClick={() => setShowFacultyLoadingModal(false)}
                                            className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Summary Metric Cards (Exact match) */}
                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-900/30">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">24</div>
                                            <div className="text-[11px] text-slate-500">Faculty</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100/70 text-purple-600 dark:bg-purple-900/30">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">82</div>
                                            <div className="text-[11px] text-slate-500">Course Offerings</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-600 dark:bg-emerald-950/40">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">0</div>
                                            <div className="text-[11px] text-slate-500">Conflicts</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-600 dark:bg-indigo-950/40">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">7</div>
                                            <div className="text-[11px] text-slate-500">Fixed Assignments</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100/70 text-cyan-600 dark:bg-cyan-950/40">
                                            <PieChart className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">100%</div>
                                            <div className="text-[11px] text-slate-500">Loading Coverage</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters Row */}
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <span>Program:</span>
                                            <select
                                                value={matrixProgramFilter}
                                                onChange={(e) => setMatrixProgramFilter(e.target.value)}
                                                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                <option value="All">All Programs</option>
                                                <option value="BSIT">BSIT</option>
                                                <option value="BSIS">BSIS</option>
                                                <option value="BSCS">BSCS</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <span>Faculty:</span>
                                            <select
                                                value={matrixFacultyFilter}
                                                onChange={(e) => setMatrixFacultyFilter(e.target.value)}
                                                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                <option value="All">All Faculty</option>
                                                <option value="Santos">Dr. Maria Santos</option>
                                                <option value="Reyes">Engr. John Reyes</option>
                                                <option value="Cruz">Ms. Angela Cruz</option>
                                                <option value="Dela Cruz">Dr. Kevin Dela Cruz</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <span>Status:</span>
                                            <select
                                                value={matrixStatusFilter}
                                                onChange={(e) => setMatrixStatusFilter(e.target.value)}
                                                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                <option value="All">All</option>
                                                <option value="Validated">Validated</option>
                                                <option value="Warning">Warning</option>
                                                <option value="Conflict">Conflict</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="relative min-w-[280px]">
                                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search course, faculty, section, or room..."
                                            value={matrixSearchQuery}
                                            onChange={(e) => setMatrixSearchQuery(e.target.value)}
                                            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Table Content Area */}
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                        <tr>
                                            <th className="w-10 px-3 py-2.5 text-center font-bold">#</th>
                                            <th className="px-3 py-2.5 font-bold">Faculty</th>
                                            <th className="px-2.5 py-2.5 text-center font-bold">Program</th>
                                            <th className="px-3 py-2.5 font-bold">Designation</th>
                                            <th className="px-3 py-2.5 font-bold">Course Code</th>
                                            <th className="px-4 py-2.5 font-bold">Descriptive Title</th>
                                            <th className="px-2.5 py-2.5 text-center font-bold">Section</th>
                                            <th className="px-2 py-2.5 text-center font-bold">Lec</th>
                                            <th className="px-2 py-2.5 text-center font-bold">Lab</th>
                                            <th className="px-2.5 py-2.5 text-center font-bold">Total</th>
                                            <th className="px-3 py-2.5 font-bold">Schedule</th>
                                            <th className="px-3 py-2.5 font-bold">Room</th>
                                            <th className="px-3 py-2.5 text-center font-bold">Assignment Source</th>
                                            <th className="px-3 py-2.5 text-center font-bold">Validation</th>
                                            <th className="px-4 py-2.5 font-bold">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {Object.entries(finalizedLoadingData).map(([progTitle, rows]) => {
                                            const progCode = progTitle.split(' ')[0];
                                            if (matrixProgramFilter !== 'All' && progCode !== matrixProgramFilter) {
                                                return null;
                                            }

                                            // Filter rows based on faculty search / status
                                            const filteredRows = rows.filter((r) => {
                                                if (matrixFacultyFilter !== 'All' && !r.faculty_name.includes(matrixFacultyFilter)) {
                                                    return false;
                                                }
                                                if (matrixStatusFilter !== 'All' && r.validation !== matrixStatusFilter) {
                                                    return false;
                                                }
                                                if (matrixSearchQuery.trim()) {
                                                    const q = matrixSearchQuery.toLowerCase();
                                                    return (
                                                        r.faculty_name.toLowerCase().includes(q) ||
                                                        r.course_code.toLowerCase().includes(q) ||
                                                        r.descriptive_title.toLowerCase().includes(q) ||
                                                        r.section.toLowerCase().includes(q) ||
                                                        r.room.toLowerCase().includes(q) ||
                                                        r.remarks.toLowerCase().includes(q)
                                                    );
                                                }
                                                return true;
                                            });

                                            if (filteredRows.length === 0) return null;

                                            const totalProgUnits = progCode === 'BSIT' ? 28 : progCode === 'BSIS' ? 10 : 10;
                                            const subtotalScheduled = progCode === 'BSIT' ? 42 : progCode === 'BSIS' ? 20 : 20;

                                            return (
                                                <React.Fragment key={progTitle}>
                                                    {/* Program Group Banner */}
                                                    <tr className="bg-cyan-50/70 font-semibold text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-200">
                                                        <td colSpan={10} className="px-3 py-2 text-xs">
                                                            <div className="flex items-center gap-1.5 font-bold">
                                                                <span className="text-[10px]">▼</span>
                                                                <span>{progTitle}</span>
                                                            </div>
                                                        </td>
                                                        <td colSpan={5} className="px-3 py-2 text-right text-xs">
                                                            <span className="text-cyan-800 dark:text-cyan-300">
                                                                Total Units: {progCode === 'BSIT' ? 144 : progCode === 'BSIS' ? 108 : 180} | Sections: {progCode === 'BSIT' ? 28 : progCode === 'BSIS' ? 22 : 32}
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    {/* Offering Rows */}
                                                    {filteredRows.map((row, rIdx) => (
                                                        <tr
                                                            key={`${progCode}-${rIdx}`}
                                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                                        >
                                                            <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{row.index}</td>
                                                            <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">
                                                                <div>{row.faculty_name}</div>
                                                                <div className="text-[10px] font-normal text-slate-400">{row.academic_rank}</div>
                                                            </td>
                                                            <td className="px-2.5 py-2.5 text-center">
                                                                <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                                                                    {row.program_code}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{row.designation}</td>
                                                            <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">{row.course_code}</td>
                                                            <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{row.descriptive_title}</td>
                                                            <td className="px-2.5 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{row.section}</td>
                                                            <td className="px-2 py-2.5 text-center text-slate-600">{row.lec_units}</td>
                                                            <td className="px-2 py-2.5 text-center text-slate-600">{row.lab_units}</td>
                                                            <td className="px-2.5 py-2.5 text-center font-bold text-slate-900 dark:text-white">{row.total_units}</td>
                                                            <td className="px-3 py-2.5 text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-tight">{row.schedule}</td>
                                                            <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{row.room}</td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                {row.assignment_source === 'CP-SAT' ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800">
                                                                        <Sparkles className="h-3 w-3" />
                                                                        CP-SAT
                                                                    </span>
                                                                ) : row.assignment_source === 'Fixed' ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                                                                        <Lock className="h-3 w-3" />
                                                                        Fixed
                                                                    </span>
                                                                ) : row.assignment_source === 'Exclusive' ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                                                                        <ShieldCheck className="h-3 w-3" />
                                                                        Exclusive
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                                                        <UserCheck className="h-3 w-3" />
                                                                        Manual
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    Validated
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-[11px] text-slate-500 font-medium">
                                                                {row.remarks}
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {/* Program Subtotal Row (amber highlight matching screenshot) */}
                                                    <tr className="bg-amber-50/80 font-bold text-slate-900 dark:bg-amber-950/30 dark:text-white">
                                                        <td colSpan={7} className="px-3 py-2 text-center text-xs">
                                                            {progCode} Subtotal
                                                        </td>
                                                        <td className="px-2 py-2 text-center">—</td>
                                                        <td className="px-2 py-2 text-center">—</td>
                                                        <td className="px-2.5 py-2 text-center text-xs font-bold">{totalProgUnits}</td>
                                                        <td className="px-3 py-2 text-center text-xs font-bold">{subtotalScheduled}</td>
                                                        <td className="px-3 py-2 text-center">—</td>
                                                        <td className="px-3 py-2 text-center">—</td>
                                                        <td className="px-3 py-2 text-center">—</td>
                                                        <td className="px-4 py-2 text-center">—</td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* College Total Row (purple highlight matching screenshot) */}
                                        <tr className="bg-purple-100/70 font-bold text-slate-900 dark:bg-purple-950/50 dark:text-white text-xs">
                                            <td colSpan={7} className="px-3 py-2.5 font-bold">
                                                CIDS College Total
                                            </td>
                                            <td className="px-2 py-2.5 text-center">—</td>
                                            <td className="px-2 py-2.5 text-center">—</td>
                                            <td className="px-2.5 py-2.5 text-center font-bold">82</td>
                                            <td className="px-3 py-2.5 text-center font-bold">432</td>
                                            <td className="px-3 py-2.5 text-center">—</td>
                                            <td className="px-3 py-2.5 text-center">—</td>
                                            <td className="px-3 py-2.5 text-center">—</td>
                                            <td className="px-4 py-2.5 text-center">—</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Bottom Legend (Matching screenshot) */}
                            <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-[11px] dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">Legend:</span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200">
                                            <Lock className="h-2.5 w-2.5" /> Fixed
                                        </span>
                                        <span className="text-slate-500">— Locked assignment (cannot be changed)</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200">
                                            <ShieldCheck className="h-2.5 w-2.5" /> Exclusive
                                        </span>
                                        <span className="text-slate-500">— Designated faculty only</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200">
                                            <UserCheck className="h-2.5 w-2.5" /> Manual
                                        </span>
                                        <span className="text-slate-500">— Manually assigned</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200">
                                            <Sparkles className="h-2.5 w-2.5" /> CP-SAT
                                        </span>
                                        <span className="text-slate-500">— Assigned by the solver</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                            <CheckCircle2 className="h-2.5 w-2.5" /> Validated
                                        </span>
                                        <span className="text-slate-500">— Meets all loading rules</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
                                            <AlertTriangle className="h-2.5 w-2.5" /> Warning
                                        </span>
                                        <span className="text-slate-500">— Needs attention</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200">
                                            <X className="h-2.5 w-2.5" /> Conflict
                                        </span>
                                        <span className="text-slate-500">— Must be resolved</span>
                                    </span>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => setShowFacultyLoadingModal(false)}
                                    className="bg-[#8B1E3F] text-xs text-white hover:bg-[#721833]"
                                >
                                    Close Matrix
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
