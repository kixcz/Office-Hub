import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
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
    Paperclip, 
    PieChart, 
    ShieldCheck, 
    Send, 
    Check, 
    X, 
    Sparkles,
    UserCheck,
    RotateCcw,
    FileText,
    Eye
} from 'lucide-react';

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
    college,
    currentWorkflowStage,
    summary,
    programs,
    facultyLoads,
    flags,
    collegeReview,
    auditHistory,
}: LoadingReviewProps) {
    // Top Navigation Tabs
    const [activePerspective, setActivePerspective] = useState<'program' | 'dean'>('program');
    const [selectedProgramId, setSelectedProgramId] = useState<number>(programs[0]?.id || 1);
    const [searchProgram, setSearchProgram] = useState('');

    // Detail Panel Tabs
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'faculty' | 'flags' | 'comments' | 'attachments' | 'history'>('overview');

    // Faculty Filter
    const [facultySearch, setFacultySearch] = useState('');
    const [facultyStatusFilter, setFacultyStatusFilter] = useState('All');

    // Selected Faculty for Side Inspection Drawer
    const [inspectedFaculty, setInspectedFaculty] = useState<FacultyLoadItem | null>(null);

    // Modals & Action States
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [flagData, setFlagData] = useState({
        program_id: selectedProgramId,
        faculty_id: '',
        flag_type: 'Specialization Mismatch',
        severity: 'Needs Attention',
        comment: '',
        suggested_action: '',
    });

    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolvingFlagId, setResolvingFlagId] = useState<number | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    const [endorsementNotes, setEndorsementNotes] = useState('');
    const [showEndorseModal, setShowEndorseModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [revisionReason, setRevisionReason] = useState('');

    // Current Selected Program Data
    const selectedProg = programs.find((p) => p.id === selectedProgramId) || programs[0];
    const filteredProgramFaculty = facultyLoads.filter((f) => {
        const matchesProg = f.program_id === selectedProgramId;
        const matchesSearch = f.name.toLowerCase().includes(facultySearch.toLowerCase()) || 
                              f.specialization.toLowerCase().includes(facultySearch.toLowerCase());
        const matchesStatus = facultyStatusFilter === 'All' || f.status === facultyStatusFilter;
        return matchesProg && matchesSearch && matchesStatus;
    });

    const filteredProgramFlags = flags.filter((fl) => fl.program_id === selectedProgramId);

    // Handle Endorsement to Dean
    const handleEndorseToDean = () => {
        if (!selectedProg) return;
        router.post(route('schedule.loading-review.endorse-program'), {
            program_id: selectedProg.id,
            notes: endorsementNotes,
        }, {
            onSuccess: () => {
                setShowEndorseModal(false);
                setEndorsementNotes('');
            }
        });
    };

    // Handle Program Revision Request
    const handleRequestRevision = () => {
        if (!selectedProg || !revisionReason.trim()) return;
        router.post(route('schedule.loading-review.request-revision'), {
            program_id: selectedProg.id,
            reason: revisionReason,
        }, {
            onSuccess: () => {
                setShowRevisionModal(false);
                setRevisionReason('');
            }
        });
    };

    // Handle Dean Decision
    const handleDeanDecision = (decision: 'Approve' | 'Request Revision' | 'Return to Program', targetProgId?: number) => {
        router.post(route('schedule.loading-review.dean-decision'), {
            decision,
            notes: endorsementNotes || 'Dean reviewed and committed.',
            program_id: targetProgId,
        }, {
            onSuccess: () => {
                setEndorsementNotes('');
            }
        });
    };

    // Handle Flag Creation
    const handleSubmitFlag = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('schedule.loading-review.flag'), {
            ...flagData,
            program_id: selectedProg?.id,
        }, {
            onSuccess: () => {
                setShowFlagModal(false);
                setFlagData({
                    program_id: selectedProg?.id || 1,
                    faculty_id: '',
                    flag_type: 'Specialization Mismatch',
                    severity: 'Needs Attention',
                    comment: '',
                    suggested_action: '',
                });
            }
        });
    };

    // Handle Flag Resolution
    const handleResolveFlag = () => {
        if (!resolvingFlagId || !resolutionNotes.trim()) return;
        router.post(route('schedule.loading-review.resolve-flag'), {
            flag_id: resolvingFlagId,
            status: 'Resolved',
            resolution_notes: resolutionNotes,
        }, {
            onSuccess: () => {
                setShowResolveModal(false);
                setResolvingFlagId(null);
                setResolutionNotes('');
            }
        });
    };

    return (
        <SchedulingWorkspaceLayout>
            <Head title="Loading Review - Ascend" />

            <div className="space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            <CheckSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loading Review</h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Review and approve faculty loading before schedule generation. Loading undergoes Program Head review per program and subsequent Dean review for final endorsement.
                            </p>
                        </div>
                    </div>

                    {/* Workflow Progress Tracker */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 px-4 flex items-center gap-4 shadow-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Workflow</span>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1.5 font-medium text-slate-400">
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px]">1</div>
                                <span>Generated (CP-SAT)</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            <div className={`flex items-center gap-1.5 font-bold ${currentWorkflowStage === 'Program Review' ? 'text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-full' : 'text-slate-500'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${currentWorkflowStage === 'Program Review' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
                                <span>Program Review</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            <div className={`flex items-center gap-1.5 font-bold ${currentWorkflowStage === 'Dean Review' ? 'text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-full' : 'text-slate-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${currentWorkflowStage === 'Dean Review' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
                                <span>Dean Review</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            <div className={`flex items-center gap-1.5 font-bold ${currentWorkflowStage === 'Approved' ? 'text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full' : 'text-slate-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${currentWorkflowStage === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>4</div>
                                <span>Approved</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6 Top Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{summary.total_programs}</div>
                            <div className="text-[11px] font-medium text-slate-500">Programs</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{summary.total_faculty}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Faculty</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{summary.for_program_review}</div>
                            <div className="text-[11px] font-medium text-slate-500">For Program Review</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{summary.for_dean_review}</div>
                            <div className="text-[11px] font-medium text-slate-500">For Dean Review</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{summary.completed_reviews}</div>
                            <div className="text-[11px] font-medium text-slate-500">Reviewed / Completed</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{summary.with_issues}</div>
                            <div className="text-[11px] font-medium text-slate-500">With Issues / Returns</div>
                        </div>
                    </div>
                </div>

                {/* Perspective Switcher & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200 w-fit">
                        <button
                            type="button"
                            onClick={() => setActivePerspective('program')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activePerspective === 'program'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Program Review (Program Heads)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActivePerspective('dean')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activePerspective === 'dean'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Building2 className="w-4 h-4" />
                            <span>Dean Review (College Consolidated)</span>
                            {summary.for_dean_review > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500 text-white font-bold">
                                    {summary.for_dean_review}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFlagModal(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
                        >
                            <Flag className="w-3.5 h-3.5 text-rose-500" />
                            <span>Flag Loading Issue</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Perspective View: Program Review vs Dean Consolidated Review */}
                {activePerspective === 'program' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Sidebar: Program Submissions List */}
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Program Loading Submissions</h3>
                                    <p className="text-[11px] text-slate-500">Review faculty load per program and take action.</p>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchProgram}
                                    onChange={(e) => setSearchProgram(e.target.value)}
                                    placeholder="Search program..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                {programs
                                    .filter((p) => p.code.toLowerCase().includes(searchProgram.toLowerCase()) || p.name.toLowerCase().includes(searchProgram.toLowerCase()))
                                    .map((prog) => {
                                        const isSelected = prog.id === selectedProgramId;
                                        return (
                                            <div
                                                key={prog.id}
                                                onClick={() => setSelectedProgramId(prog.id)}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-transparent shadow-md'
                                                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm tracking-tight">{prog.code}</span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    prog.status === 'Completed' || prog.status === 'Endorsed'
                                                                        ? isSelected ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : prog.status === 'Revision Required'
                                                                        ? isSelected ? 'bg-rose-500/20 text-rose-200 border border-rose-400/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        : isSelected ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                }`}
                                                            >
                                                                {prog.status === 'Completed' ? 'Program Review Completed' : prog.status === 'Revision Required' ? 'Revision Required' : 'For Program Review'}
                                                            </span>
                                                        </div>
                                                        <p className={`text-[11px] line-clamp-1 mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                            {prog.name}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`} />
                                                </div>

                                                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${isSelected ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5" />
                                                        <span>{prog.faculty_count} Faculty</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <AlertTriangle className={`w-3.5 h-3.5 ${prog.unresolved_issues > 0 ? (isSelected ? 'text-rose-400' : 'text-rose-500') : (isSelected ? 'text-slate-400' : 'text-slate-400')}`} />
                                                        <span>{prog.unresolved_issues} Conflicts</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 font-semibold">
                                                        <span className={isSelected ? 'text-emerald-300' : 'text-emerald-600'}>
                                                            {prog.load_balance_percent}% Balance
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Right Content Area: Program Review Workspace */}
                        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                            {/* Header for Selected Program */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                        {selectedProg?.code}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-bold text-slate-900">{selectedProg?.code} - Faculty Loading Review</h2>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                selectedProg?.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {selectedProg?.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {selectedProg?.name} • AY {currentPeriod?.academic_year || '2026-2027'}, {currentPeriod?.semester || '1st Semester'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowFlagModal(true)}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                                    >
                                        <Flag className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Add Flag</span>
                                    </button>
                                </div>
                            </div>

                            {/* Program Sub-Tabs: Overview, Faculty Loads, Issues & Flags, Comments, Attachments, History */}
                            <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold text-slate-600">
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab('overview')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeDetailTab === 'overview'
                                            ? 'border-indigo-600 text-indigo-600 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <PieChart className="w-3.5 h-3.5" />
                                    <span>Overview</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab('faculty')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeDetailTab === 'faculty'
                                            ? 'border-indigo-600 text-indigo-600 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Faculty Loads ({filteredProgramFaculty.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab('flags')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeDetailTab === 'flags'
                                            ? 'border-indigo-600 text-indigo-600 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Issues & Flags ({filteredProgramFlags.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveDetailTab('history')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeDetailTab === 'history'
                                            ? 'border-indigo-600 text-indigo-600 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <History className="w-3.5 h-3.5" />
                                    <span>Audit History</span>
                                </button>
                            </div>

                            {/* Tab 1: Overview */}
                            {activeDetailTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* 4 Stat Boxes */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                            <div className="text-[11px] font-medium text-slate-500">Program Faculty</div>
                                            <div className="text-xl font-bold text-slate-900 mt-1">{selectedProg?.faculty_count}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Assigned to {selectedProg?.code}</div>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                            <div className="text-[11px] font-medium text-slate-500">Total Load</div>
                                            <div className="text-xl font-bold text-slate-900 mt-1">{selectedProg?.total_load.toFixed(1)} hrs/wk</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Curriculum demand</div>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                            <div className="text-[11px] font-medium text-slate-500">Avg Faculty Load</div>
                                            <div className="text-xl font-bold text-slate-900 mt-1">{selectedProg?.avg_load.toFixed(1)} hrs/wk</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Target: 12.0 hrs/wk</div>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                            <div className="text-[11px] font-medium text-slate-500">Load Balance</div>
                                            <div className="text-xl font-bold text-emerald-600 mt-1">{selectedProg?.load_balance_percent}%</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">High optimization fit</div>
                                        </div>
                                    </div>

                                    {/* Distribution & Compliance */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Load Distribution</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                                                        Within Target (9 – 15 hrs)
                                                    </span>
                                                    <span className="font-bold text-slate-700">{selectedProg?.distribution.within_target} faculty</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                                        Underload (&lt; 9 hrs)
                                                    </span>
                                                    <span className="font-bold text-amber-600">{selectedProg?.distribution.underload} faculty</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                                        Overload (&gt; 15 hrs)
                                                    </span>
                                                    <span className="font-bold text-rose-600">{selectedProg?.distribution.overload} faculty</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Compliance Checks</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    <span>Within allowable load range (9 - 15 hrs/wk)</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    <span>No faculty schedule overlap conflicts</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    <span>All required {selectedProg?.code} core courses assigned</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar for Program Head */}
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">Program Head Governance Review</div>
                                            <p className="text-[11px] text-slate-500">
                                                As Program Head, review the generated loading, flag or resolve any issues, and endorse to Dean for college consolidation.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setShowRevisionModal(true)}
                                                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Request Revision</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowEndorseModal(true)}
                                                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs"
                                            >
                                                <span>Endorse to Dean</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Faculty Loads Table */}
                            {activeDetailTab === 'faculty' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="relative flex-1 max-w-sm">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={facultySearch}
                                                onChange={(e) => setFacultySearch(e.target.value)}
                                                placeholder="Filter faculty..."
                                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={facultyStatusFilter}
                                                onChange={(e) => setFacultyStatusFilter(e.target.value)}
                                                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                                            >
                                                <option value="All">All Statuses</option>
                                                <option value="Balanced">Balanced</option>
                                                <option value="Underloaded">Underloaded</option>
                                                <option value="Overloaded">Overloaded</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                                <tr>
                                                    <th className="py-2.5 px-3">Faculty</th>
                                                    <th className="py-2.5 px-3">Designation</th>
                                                    <th className="py-2.5 px-3 text-center">Assigned Load</th>
                                                    <th className="py-2.5 px-3 text-center">Target Load</th>
                                                    <th className="py-2.5 px-3 text-center">Preps</th>
                                                    <th className="py-2.5 px-3 text-center">Match</th>
                                                    <th className="py-2.5 px-3 text-center">Status</th>
                                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredProgramFaculty.map((f) => (
                                                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-2.5 px-3">
                                                            <div className="font-bold text-slate-800">{f.name}</div>
                                                            <div className="text-[10px] text-slate-400">{f.specialization}</div>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-slate-600">
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 font-medium">
                                                                {f.designation}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                                            {f.assigned_load.toFixed(1)} hrs
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center text-slate-500">
                                                            {f.target_load.toFixed(1)} hrs
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center text-slate-700">
                                                            {f.preparations}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                {f.course_match}%
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    f.status === 'Balanced'
                                                                        ? 'bg-emerald-50 text-emerald-700'
                                                                        : f.status === 'Overloaded'
                                                                        ? 'bg-rose-50 text-rose-700'
                                                                        : 'bg-amber-50 text-amber-700'
                                                                }`}
                                                            >
                                                                {f.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => setInspectedFaculty(f)}
                                                                className="px-2 py-1 rounded-md text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 inline-flex items-center gap-1"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                <span>Inspect</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Issues & Flags */}
                            {activeDetailTab === 'flags' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Program Loading Flags ({filteredProgramFlags.length})
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowFlagModal(true)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
                                        >
                                            <Flag className="w-3.5 h-3.5" />
                                            <span>Add New Flag</span>
                                        </button>
                                    </div>

                                    {filteredProgramFlags.length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                            <p className="text-xs font-semibold text-slate-700">No active flags for {selectedProg?.code}</p>
                                            <p className="text-[11px] text-slate-400">All faculty loads meet specialization and load policy rules.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredProgramFlags.map((fl) => (
                                                <div key={fl.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                {fl.flag_type}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-800">
                                                                {fl.faculty_name ? `Target: ${fl.faculty_name}` : 'General Program Flag'}
                                                            </span>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            fl.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                        }`}>
                                                            {fl.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600">{fl.comment}</p>
                                                    {fl.suggested_action && (
                                                        <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-1.5">
                                                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                            <span>Suggested Action: {fl.suggested_action}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                                                        <span>Logged by {fl.reviewer_name} • {fl.created_at}</span>
                                                        {fl.status !== 'Resolved' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setResolvingFlagId(fl.id);
                                                                    setShowResolveModal(true);
                                                                }}
                                                                className="font-bold text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                Resolve Flag →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 4: Audit History */}
                            {activeDetailTab === 'history' && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Loading Governance Audit Trail
                                    </h4>
                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                        {auditHistory.map((log) => (
                                            <div key={log.id} className="p-3.5 text-xs flex items-start justify-between gap-4 bg-white hover:bg-slate-50/60">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800">{log.action}</span>
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold">
                                                            {log.program_code}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-500 mt-0.5">{log.details}</p>
                                                </div>
                                                <div className="text-right text-[10px] text-slate-400 shrink-0">
                                                    <div>{log.user_name}</div>
                                                    <div>{log.created_at}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Perspective View: Dean Review (College Consolidated) */
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-slate-900">College Consolidated Loading Plan Review</h2>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        collegeReview?.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                                    }`}>
                                        Dean Review Stage ({collegeReview?.status || 'Pending'})
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {college?.name} • Consolidated loading governance across all {programs.length} programs.
                                </p>
                            </div>

                            {/* Dean Decision Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDeanDecision('Request Revision')}
                                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Request Revision</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeanDecision('Approve')}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve & Finalize College Loading</span>
                                </button>
                            </div>
                        </div>

                        {/* Program Readiness Grid */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Program Endorsement Readiness
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {programs.map((prog) => (
                                    <div key={prog.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-bold text-sm text-slate-900">{prog.code}</div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                prog.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {prog.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-600 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Program Head:</span>
                                                <span className="font-semibold text-slate-800">{prog.program_head}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total Faculty:</span>
                                                <span className="font-semibold text-slate-800">{prog.faculty_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Open Conflicts:</span>
                                                <span className={`font-semibold ${prog.unresolved_issues > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                                    {prog.unresolved_issues}
                                                </span>
                                            </div>
                                        </div>
                                        {prog.status === 'Completed' && (
                                            <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                                                ✓ Endorsed to Dean on {prog.endorsed_at || 'Recently'}
                                            </div>
                                        )}
                                        {prog.status !== 'Completed' && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeanDecision('Return to Program', prog.id)}
                                                className="w-full py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
                                            >
                                                Return to Program Head
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Side Inspection Drawer for Faculty Load Detail & Assignment Flagging */}
            {inspectedFaculty && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{inspectedFaculty.name}</h3>
                                <p className="text-xs text-slate-500">
                                    {inspectedFaculty.program_code} • {inspectedFaculty.designation} • {inspectedFaculty.specialization}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInspectedFaculty(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Load Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                <div className="text-[10px] text-slate-500">Assigned Load</div>
                                <div className="text-base font-bold text-slate-900 mt-0.5">{inspectedFaculty.assigned_load.toFixed(1)} hrs</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                <div className="text-[10px] text-slate-500">Target Load</div>
                                <div className="text-base font-bold text-slate-900 mt-0.5">{inspectedFaculty.target_load.toFixed(1)} hrs</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                <div className="text-[10px] text-slate-500">Course Match</div>
                                <div className="text-base font-bold text-emerald-600 mt-0.5">{inspectedFaculty.course_match}%</div>
                            </div>
                        </div>

                        {/* Assigned Course Offerings */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Assigned Course Offerings ({inspectedFaculty.assigned_courses.length})
                                </h4>
                            </div>

                            <div className="space-y-2">
                                {inspectedFaculty.assigned_courses.map((c) => (
                                    <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-slate-900">{c.course_code} - {c.course_title}</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{c.type}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Section: {c.section}</span>
                                            <span>{c.units} units ({c.hours} hrs/wk)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Flag Button */}
                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setFlagData((prev) => ({
                                        ...prev,
                                        faculty_id: String(inspectedFaculty.id),
                                    }));
                                    setShowFlagModal(true);
                                }}
                                className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 flex items-center justify-center gap-1.5"
                            >
                                <Flag className="w-3.5 h-3.5 text-rose-600" />
                                <span>Flag Assignment Issue for {inspectedFaculty.name}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Flag Modal */}
            {showFlagModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Flag className="w-4 h-4 text-rose-600" />
                                <span>Flag Loading Issue</span>
                            </h3>
                            <button type="button" onClick={() => setShowFlagModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitFlag} className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700">Flag Type</label>
                                <select
                                    value={flagData.flag_type}
                                    onChange={(e) => setFlagData({ ...flagData, flag_type: e.target.value })}
                                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                                >
                                    <option value="Specialization Mismatch">Specialization Mismatch</option>
                                    <option value="Overload">Overload (&gt; 15 hrs)</option>
                                    <option value="Underload">Underload (&lt; 9 hrs)</option>
                                    <option value="Excessive Preparations">Excessive Preparations (&gt; 4 preps)</option>
                                    <option value="Preference Conflict">Preference Conflict</option>
                                    <option value="Historical Mismatch">Historical Mismatch</option>
                                    <option value="Manual Reassignment">Manual Reassignment Request</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700">Severity</label>
                                <select
                                    value={flagData.severity}
                                    onChange={(e) => setFlagData({ ...flagData, severity: e.target.value })}
                                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                                >
                                    <option value="Advisory">Advisory</option>
                                    <option value="Needs Attention">Needs Attention</option>
                                    <option value="Blocking">Blocking</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700">Comment / Rationale</label>
                                <textarea
                                    rows={3}
                                    value={flagData.comment}
                                    onChange={(e) => setFlagData({ ...flagData, comment: e.target.value })}
                                    placeholder="Explain why this loading assignment is being flagged..."
                                    required
                                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700">Suggested Action (Optional)</label>
                                <input
                                    type="text"
                                    value={flagData.suggested_action}
                                    onChange={(e) => setFlagData({ ...flagData, suggested_action: e.target.value })}
                                    placeholder="e.g. Reassign CS 612 to Dr. Ramos"
                                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFlagModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                                >
                                    Submit Flag
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve Flag Modal */}
            {showResolveModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">Resolve Loading Flag</h3>
                            <button type="button" onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <label className="font-semibold text-slate-700">Resolution Notes</label>
                            <textarea
                                rows={3}
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="State how the flag was resolved or why it is accepted..."
                                className="w-full p-2 border border-slate-200 rounded-xl"
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowResolveModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResolveFlag}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                                >
                                    Confirm Resolution
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Endorse Modal */}
            {showEndorseModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">Endorse Program Loading to Dean</h3>
                            <button type="button" onClick={() => setShowEndorseModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <p className="text-slate-600">
                                You are about to endorse the faculty loading for <strong>{selectedProg?.code}</strong> to the College Dean for college-wide consolidation.
                            </p>
                            <label className="font-semibold text-slate-700">Endorsement Remarks (Optional)</label>
                            <textarea
                                rows={3}
                                value={endorsementNotes}
                                onChange={(e) => setEndorsementNotes(e.target.value)}
                                placeholder="Add notes regarding workload balance or special allocations..."
                                className="w-full p-2 border border-slate-200 rounded-xl"
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEndorseModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEndorseToDean}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Endorse to Dean</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Revision Modal */}
            {showRevisionModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">Request Program Loading Revision</h3>
                            <button type="button" onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <label className="font-semibold text-slate-700">Revision Reason & Required Changes</label>
                            <textarea
                                rows={4}
                                value={revisionReason}
                                onChange={(e) => setRevisionReason(e.target.value)}
                                placeholder="Specify which faculty assignments need rebalancing or course adjustments..."
                                className="w-full p-2 border border-slate-200 rounded-xl"
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRevisionModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRequestRevision}
                                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700"
                                >
                                    Submit Revision Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SchedulingWorkspaceLayout>
    );
}

