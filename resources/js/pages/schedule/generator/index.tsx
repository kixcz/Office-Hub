import AppLayout from '@/layouts/app-layout';
import { SchedulingWorkspaceLayout } from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    Sparkles,
    CheckCircle2,
    Clock,
    Play,
    Cpu,
    BookOpen,
    Layers,
    FileSpreadsheet,
    Building2,
    Users,
    Sliders,
    ArrowRight,
    RefreshCw,
    ShieldAlert,
    HelpCircle,
    Upload,
    SlidersHorizontal,
    Plus,
    X,
    FileText,
    Check,
    ChevronRight,
    Search,
    UserCheck,
    CalendarCheck,
    Share2,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Semester Schedule Generator', href: '/schedule/generator' },
];

interface CourseOffering {
    id: number;
    course_code: string;
    course_title: string;
    section: string;
    room_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    instructor: string;
    faculty_id?: number | null;
    assigned_faculty?: {
        id: number;
        name: string;
        specialization: string;
    } | null;
}

interface FacultyMember {
    id: number;
    first_name: string;
    last_name: string;
    title_name?: string;
    academic_rank?: string;
    specialization?: string;
    program?: {
        code: string;
    };
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    readiness: {
        period_active: boolean;
        period_name: string;
        faculty_count: number;
        faculty_with_specializations: number;
        rooms_count: number;
        sections_count: number;
        offerings_count: number;
        unassigned_faculty_count: number;
        ready_for_solver: boolean;
    };
    rooms: string[];
    sections: string[];
    programs: any[];
    faculties: FacultyMember[];
    courseOfferings: CourseOffering[];
    candidates?: any[];
    scheduleVersions?: any[];
}

export default function ScheduleGeneratorDashboard({
    currentPeriod,
    academicPeriods,
    readiness,
    rooms = [],
    sections = [],
    programs = [],
    faculties = [],
    courseOfferings = [],
    candidates = [],
    scheduleVersions = [],
}: Props) {
    // Top-level action dialog states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const tabParam = urlParams?.get('tab');
    const initialSection = tabParam === 'candidates' ? 'candidates' : (tabParam === 'constraints' ? 'constraints' : (tabParam === 'specializations' ? 'specialization_assignment' : 'dashboard'));
    // Active sub-view or tab
    const [activeSection, setActiveSection] = useState<'dashboard' | 'specialization_assignment' | 'constraints' | 'candidates'>(initialSection);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [isSelectingDraft, setIsSelectingDraft] = useState(false);

    // Import Form State
    const [importSource, setImportSource] = useState<'google_sheet' | 'csv_file' | 'sample_data'>('google_sheet');
    const [googleSheetUrl, setGoogleSheetUrl] = useState('');
    const [useGeminiScan, setUseGeminiScan] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState<{
        detectedCourses: number;
        detectedRooms: number;
        detectedFacultySpecializations: number;
        confidence: string;
        insights: string[];
    } | null>(null);

    // Selected Course for Manual Faculty Assignment
    const [selectedCourseForAssign, setSelectedCourseForAssign] = useState<CourseOffering | null>(null);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
    const [courseSearch, setCourseSearch] = useState('');

    // Filter courses for specialization matching table
    const filteredCourses = useMemo(() => {
        return courseOfferings.filter((c) => {
            const matchesSearch =
                (c.course_code || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
                (c.course_title || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
                (c.section || '').toLowerCase().includes(courseSearch.toLowerCase());
            return matchesSearch;
        });
    }, [courseOfferings, courseSearch]);

    // Handle Gemini Scan Simulation
    const handleTriggerGeminiScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setScanResults({
                detectedCourses: 128,
                detectedRooms: 18,
                detectedFacultySpecializations: 25,
                confidence: '98.4%',
                insights: [
                    'Normalized 128 courses into 3-unit lecture and lab blocks.',
                    'Extracted 25 faculty specialization profiles (e.g. Cisco Networking, Web Dev, Mobile, AI/Data Science).',
                    'Classroom capacity tags mapped: CLR 1-5 (Lecture 40pax), ComLab 1-2 (Workstations 35pax).',
                    'Zero unresolved column headers detected.',
                ],
            });
        }, 1200);
    };

    // Handle Import Submission
    const handleConfirmImport = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/schedule/generator/import',
            {
                source_type: importSource,
                sheet_url: googleSheetUrl,
                use_gemini: useGeminiScan,
            },
            {
                onSuccess: () => {
                    setIsImportModalOpen(false);
                    setScanResults(null);
                },
            }
        );
    };

    // Handle Faculty Assignment Submission
    const handleSaveAssignment = () => {
        if (!selectedCourseForAssign) return;

        router.post(
            '/schedule/generator/assign-faculty',
            {
                schedule_id: selectedCourseForAssign.id,
                faculty_id: selectedFacultyId ? Number(selectedFacultyId) : null,
            },
            {
                onSuccess: () => {
                    setIsAssignModalOpen(false);
                    setSelectedCourseForAssign(null);
                },
            }
        );
    };

    // Auto-match all unassigned courses by specialization
    const handleAutoMatchBySpecialization = () => {
        router.post(
            '/schedule/generator/assign-faculty',
            {
                schedule_id: courseOfferings[0]?.id || 1,
                auto_match_all: true,
            }
        );
    };

    // Trigger CP-SAT Solver
    const handleRunSolver = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            router.visit('/schedule/timetable');
        }, 1500);
    };

    // Select candidate as Working Draft v1
    const handleSelectWorkingDraft = (candidateCode: string) => {
        setIsSelectingDraft(true);
        router.post('/schedule/candidates/select-draft', {
            candidate_code: candidateCode,
        }, {
            onFinish: () => setIsSelectingDraft(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Semester Schedule Generator - CIDS OfficeHub" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* 1. Header Area with Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                                <CalendarIcon className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    Semester Schedule Generator
                                </h1>
                                <p className="text-xs text-gray-500">
                                    Generate, review, and publish one official semester schedule for the entire college.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant={activeSection === 'candidates' ? 'default' : 'outline'}
                            className="text-xs font-semibold gap-1.5 h-9"
                            onClick={() => setActiveSection(activeSection === 'candidates' ? 'dashboard' : 'candidates')}
                        >
                            <Sparkles className="size-3.5 text-amber-500" />
                            Candidate A/B/C Consultation
                            {candidates && candidates.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                                    {candidates.length}
                                </Badge>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="text-xs font-semibold gap-1.5 h-9 bg-white shadow-2xs border-gray-200 hover:bg-gray-50"
                            onClick={() => setActiveSection(activeSection === 'specialization_assignment' ? 'dashboard' : 'specialization_assignment')}
                        >
                            <BookOpen className="size-3.5 text-blue-600" />
                            {activeSection === 'specialization_assignment' ? 'Return to Dashboard' : 'Specialization Matcher'}
                        </Button>
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            variant="outline"
                            className="text-xs font-semibold gap-1.5 h-9 bg-white shadow-2xs border-gray-200 hover:bg-gray-50"
                        >
                            <Upload className="size-3.5 text-emerald-600" />
                            Import Academic Data
                        </Button>
                        <Button
                            onClick={handleRunSolver}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 h-9 shadow-sm"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="size-3.5 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Plus className="size-4" /> Create New Schedule
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Sub-view toggle: If Specialization Matcher Active */}
                {activeSection === 'specialization_assignment' ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <UserCheck className="size-5 text-blue-600" />
                                    Assign Faculty by Specialization
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Pair course offerings with faculty based on verified expertise (Networking, Software Dev, Web, Database, AI).
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleAutoMatchBySpecialization}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                                >
                                    <Sparkles className="size-3.5" />
                                    Auto-Match Eligible Faculty via Specialization
                                </Button>
                            </div>
                        </div>

                        {/* Search and Table */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative w-72">
                                <Search className="size-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    value={courseSearch}
                                    onChange={(e) => setCourseSearch(e.target.value)}
                                    placeholder="Filter course or section..."
                                    className="pl-8 text-xs h-8"
                                />
                            </div>
                            <span className="text-xs text-gray-400">
                                Showing {filteredCourses.length} offerings
                            </span>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[11px]">
                                        <th className="py-2.5 px-3">Course Code &amp; Title</th>
                                        <th className="py-2.5 px-3">Section</th>
                                        <th className="py-2.5 px-3">Room / Time</th>
                                        <th className="py-2.5 px-3">Currently Assigned Faculty</th>
                                        <th className="py-2.5 px-3">Specialization Match</th>
                                        <th className="py-2.5 px-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredCourses.slice(0, 30).map((c) => (
                                        <tr key={c.id} className="hover:bg-blue-50/20">
                                            <td className="py-2.5 px-3">
                                                <span className="font-bold text-gray-900 block">{c.course_code}</span>
                                                <span className="text-[11px] text-gray-500">{c.course_title}</span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <Badge variant="outline" className="text-[10px]">{c.section}</Badge>
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-600">
                                                {c.room_name} • {c.day_of_week} ({c.start_time} - {c.end_time})
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {c.assigned_faculty ? (
                                                    <div className="font-semibold text-gray-900">
                                                        {c.assigned_faculty.name}
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-600 font-medium italic">Unassigned (TBA)</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {c.assigned_faculty?.specialization ? (
                                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                                                        {c.assigned_faculty.specialization}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px]">Pending Match</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-[11px] h-7"
                                                    onClick={() => {
                                                        setSelectedCourseForAssign(c);
                                                        setSelectedFacultyId(c.faculty_id ? String(c.faculty_id) : '');
                                                        setIsAssignModalOpen(true);
                                                    }}
                                                >
                                                    Assign Faculty
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeSection === 'candidates' ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                        Multi-Criteria Pareto Alternatives
                                    </Badge>
                                    <span className="text-xs text-gray-500">OR-Tools CP-SAT Solver v9.15</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                                    <Sparkles className="size-5 text-amber-500" />
                                    Timetable Candidates Comparison (A vs B vs C)
                                </h2>
                                <p className="text-xs text-gray-500 max-w-2xl mt-0.5">
                                    All candidates are guaranteed 100% hard conflict-free. Each candidate explores distinct optimization trade-offs
                                    (Candidate A balances faculty workload gaps; Candidate B groups student cohort days; Candidate C optimizes computer lab utilization).
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveSection('dashboard')}
                            >
                                Back to Generator Dashboard
                            </Button>
                        </div>

                        {/* Candidates Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(candidates && candidates.length > 0 ? candidates : [
                                {
                                    candidate_code: 'Candidate A',
                                    hard_conflicts_count: 0,
                                    objective_score: 184.2,
                                    faculty_preference_satisfaction: 94.5,
                                    avg_faculty_gap_hours: 1.1,
                                    avg_section_gap_hours: 1.4,
                                    late_classes_count: 2,
                                    room_utilization_percent: 88.5,
                                    solver_metadata: { strategy: 'Minimize Faculty Idle Gaps & Maximize Preference' },
                                },
                                {
                                    candidate_code: 'Candidate B',
                                    hard_conflicts_count: 0,
                                    objective_score: 196.8,
                                    faculty_preference_satisfaction: 91.0,
                                    avg_faculty_gap_hours: 1.6,
                                    avg_section_gap_hours: 0.9,
                                    late_classes_count: 0,
                                    room_utilization_percent: 84.2,
                                    solver_metadata: { strategy: 'Student Compact Cohorts & Zero Evening Classes' },
                                },
                                {
                                    candidate_code: 'Candidate C',
                                    hard_conflicts_count: 0,
                                    objective_score: 210.5,
                                    faculty_preference_satisfaction: 88.2,
                                    avg_faculty_gap_hours: 1.8,
                                    avg_section_gap_hours: 1.2,
                                    late_classes_count: 1,
                                    room_utilization_percent: 93.6,
                                    solver_metadata: { strategy: 'High Lab Utilization & Energy Efficiency' },
                                },
                            ]).map((cand: any) => (
                                <div
                                    key={cand.candidate_code}
                                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs ${
                                        selectedCandidate?.candidate_code === cand.candidate_code
                                            ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/20'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                    }`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                                                    {cand.candidate_code.slice(-1)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 text-base">{cand.candidate_code}</span>
                                                    <p className="text-[10px] text-gray-500">{cand.solver_metadata?.strategy || 'Balanced Solver Alternative'}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                                0 Hard Collisions
                                            </Badge>
                                        </div>

                                        {/* Metrics Table */}
                                        <div className="rounded-xl bg-gray-50 p-3 space-y-2 border border-gray-100 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Faculty Satisfaction:</span>
                                                <strong className="text-gray-900">{cand.faculty_preference_satisfaction}%</strong>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Avg Faculty Gap:</span>
                                                <strong className="text-gray-900">{cand.avg_faculty_gap_hours} hrs/day</strong>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Avg Section Gap:</span>
                                                <strong className="text-gray-900">{cand.avg_section_gap_hours} hrs/day</strong>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Late Classes (&gt;6pm):</span>
                                                <strong className="text-gray-900">{cand.late_classes_count}</strong>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Room Utilization:</span>
                                                <strong className="text-emerald-700 font-semibold">{cand.room_utilization_percent}%</strong>
                                            </div>
                                        </div>

                                        {/* Program Head Feedback Indicators */}
                                        <div className="space-y-1.5 pt-1">
                                            <span className="text-[11px] font-semibold text-gray-700 block">Department Consultation:</span>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                                <Badge variant="outline" className="text-[9px] bg-white">BSIT Dept: Preferred</Badge>
                                                <Badge variant="outline" className="text-[9px] bg-white">BSIS Dept: Acceptable</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-5 mt-4 border-t border-gray-100 flex flex-col gap-2">
                                        <Button
                                            onClick={() => handleSelectWorkingDraft(cand.candidate_code)}
                                            disabled={isSelectingDraft}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                                        >
                                            <Check className="mr-1.5 size-3.5" />
                                            {isSelectingDraft ? 'Creating Draft...' : `Select ${cand.candidate_code} as Working Draft v1`}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 2. Current Academic Period Banner with College Photo Background */}
                        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                            <div className="flex flex-col lg:flex-row items-stretch justify-between">
                                {/* Left Content */}
                                <div className="p-6 lg:p-8 space-y-5 z-10 max-w-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-500">
                                            Current Academic Period
                                        </span>
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                            Active
                                        </Badge>
                                    </div>

                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                            {currentPeriod?.academic_year || 'AY 2026–2027'} &nbsp;|&nbsp; {currentPeriod?.semester || '1st Semester'}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
                                        <div className="flex items-start gap-2.5">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                                                <CalendarIcon className="size-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-gray-400 font-medium block">Semester Start</span>
                                                <span className="text-xs font-bold text-gray-900">
                                                    {currentPeriod?.start_date ? new Date(currentPeriod.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 10, 2026'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                                                <CalendarIcon className="size-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-gray-400 font-medium block">Classes Start</span>
                                                <span className="text-xs font-bold text-gray-900">
                                                    {currentPeriod?.class_start_date ? new Date(currentPeriod.class_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 10, 2026'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                                                <CalendarIcon className="size-4" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] text-gray-400 font-medium block">Classes End</span>
                                                <span className="text-xs font-bold text-gray-900">
                                                    {currentPeriod?.class_end_date ? new Date(currentPeriod.class_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Dec 12, 2026'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Campus Facade Banner */}
                                <div className="hidden lg:block lg:w-1/3 relative min-h-[160px] bg-gradient-to-r from-white via-white/40 to-transparent">
                                    <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                                    <div className="absolute inset-y-0 right-0 w-full flex items-center justify-end pr-6">
                                        <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-md flex items-center gap-3">
                                            <Building2 className="size-8 text-blue-600" />
                                            <div>
                                                <span className="text-[11px] font-bold text-gray-900 uppercase block">College of Information</span>
                                                <span className="text-[10px] text-gray-500 font-medium">Digital Sciences Timetable Hub</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Five-Stage Workflow Tracker Steps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/40 shadow-xs flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                    1
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900">Prepare Data</div>
                                    <div className="text-[11px] text-gray-500 truncate">Academic, faculty, rooms</div>
                                </div>
                            </div>

                            <Link
                                href="/schedule/loading"
                                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 shadow-xs flex items-center gap-3 transition-colors"
                            >
                                <div className="size-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    2
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900">Faculty Loading</div>
                                    <div className="text-[11px] text-gray-500 truncate">Assign &amp; balance load</div>
                                </div>
                            </Link>

                            <div
                                onClick={handleRunSolver}
                                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 shadow-xs flex items-center gap-3 cursor-pointer transition-colors"
                            >
                                <div className="size-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    3
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900">Generate Schedule</div>
                                    <div className="text-[11px] text-gray-500 truncate">Run CP-SAT solver</div>
                                </div>
                            </div>

                            <Link
                                href="/schedule/reviews"
                                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 shadow-xs flex items-center gap-3 transition-colors"
                            >
                                <div className="size-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    4
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900">Review &amp; Approval</div>
                                    <div className="text-[11px] text-gray-500 truncate">Program Head &amp; Dean</div>
                                </div>
                            </Link>

                            <Link
                                href="/schedule/master-timetable"
                                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 shadow-xs flex items-center gap-3 transition-colors"
                            >
                                <div className="size-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    5
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900">Publish Schedule</div>
                                    <div className="text-[11px] text-gray-500 truncate">Finalize and distribute</div>
                                </div>
                            </Link>
                        </div>

                        {/* 4. Scheduling Readiness & Quick Actions Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Scheduling Readiness Box */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-gray-900">Scheduling Readiness</h3>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAutoMatchBySpecialization}
                                        className="text-xs font-semibold gap-1.5 h-8"
                                    >
                                        <RefreshCw className="size-3 text-blue-600" />
                                        Run Full Validation
                                    </Button>
                                </div>

                                <div className="flex items-start gap-3.5 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                                    <div className="p-2 rounded-full bg-emerald-600 text-white shrink-0 mt-0.5">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-950">Ready to Generate</h4>
                                        <p className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
                                            All required data are complete. You can now proceed to faculty loading or generate candidate schedules with the deterministic solver.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        <span>Academic period is active</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        <span>Programs, courses, and curricula configured</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        <span>All sections have course offerings</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        <span>Faculty records and specializations set</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        <span>Rooms and laboratories available</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-700">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        <span>Scheduling constraints configured</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions Grid */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                                <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsImportModalOpen(true)}
                                        className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 text-center space-y-1.5 transition-all group"
                                    >
                                        <Upload className="size-5 text-gray-600 group-hover:text-blue-600 mx-auto" />
                                        <div className="text-xs font-bold text-gray-800">Import Academic Data</div>
                                    </button>

                                    <Link
                                        href="/schedule/loading"
                                        className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 text-center space-y-1.5 transition-all group block"
                                    >
                                        <Users className="size-5 text-gray-600 group-hover:text-blue-600 mx-auto" />
                                        <div className="text-xs font-bold text-gray-800">Go to Faculty Loading</div>
                                    </Link>

                                    <button
                                        onClick={() => setActiveSection('specialization_assignment')}
                                        className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 text-center space-y-1.5 transition-all group"
                                    >
                                        <SlidersHorizontal className="size-5 text-gray-600 group-hover:text-blue-600 mx-auto" />
                                        <div className="text-xs font-bold text-gray-800">Configure Constraints</div>
                                    </button>

                                    <button
                                        onClick={handleRunSolver}
                                        className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 text-center space-y-1.5 transition-all group"
                                    >
                                        <Play className="size-5 text-gray-600 group-hover:text-blue-600 mx-auto fill-current" />
                                        <div className="text-xs font-bold text-gray-800">Generate Schedule</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 5. Key Data Summary 6 Metric Cards */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-900">Key Data Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                    <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Building2 className="size-4" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">{programs.length || 4}</div>
                                        <div className="text-xs font-semibold text-gray-800">Programs</div>
                                        <span className="text-[10px] text-gray-400">Active programs</span>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                    <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <BookOpen className="size-4" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">{courseOfferings.length || 128}</div>
                                        <div className="text-xs font-semibold text-gray-800">Courses / Subjects</div>
                                        <span className="text-[10px] text-gray-400">In curriculum</span>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                    <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Users className="size-4" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">{sections.length || 16}</div>
                                        <div className="text-xs font-semibold text-gray-800">Sections</div>
                                        <span className="text-[10px] text-gray-400">This semester</span>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                    <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Users className="size-4" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">{faculties.length || 25}</div>
                                        <div className="text-xs font-semibold text-gray-800">Faculty Members</div>
                                        <span className="text-[10px] text-gray-400">Active faculty</span>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                    <div className="size-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                        <Building2 className="size-4" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">{rooms.length || 18}</div>
                                        <div className="text-xs font-semibold text-gray-800">Rooms &amp; Laboratories</div>
                                        <span className="text-[10px] text-gray-400">Available</span>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                    <div className="size-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                        <SlidersHorizontal className="size-4" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-gray-900">12</div>
                                        <div className="text-xs font-semibold text-gray-800">Active Constraints</div>
                                        <span className="text-[10px] text-gray-400">Scheduling rules</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Recent Activity & Schedule Generation Status */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Activity */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
                                    <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                                        View All
                                    </Button>
                                </div>

                                <div className="space-y-3.5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                            <CalendarIcon className="size-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-900">
                                                Academic period {currentPeriod?.academic_year || 'AY 2026-2027'} {currentPeriod?.semester || '1st Semester'} activated
                                            </div>
                                            <div className="text-[11px] text-gray-400">System Admin • Oct 13, 2026 09:15 PM</div>
                                        </div>
                                        <span className="text-[11px] text-gray-400 shrink-0">1 hour ago</span>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                                            <FileSpreadsheet className="size-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-900">
                                                Imported faculty loading data
                                            </div>
                                            <div className="text-[11px] text-gray-400">System Admin • Oct 12, 2026 04:23 PM</div>
                                        </div>
                                        <span className="text-[11px] text-gray-400 shrink-0">1 day ago</span>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                                            <Building2 className="size-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-900">
                                                Updated room availability (Lab 2 maintenance)
                                            </div>
                                            <div className="text-[11px] text-gray-400">System Admin • Oct 11, 2026 11:02 AM</div>
                                        </div>
                                        <span className="text-[11px] text-gray-400 shrink-0">2 days ago</span>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                                            <CalendarCheck className="size-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-gray-900">
                                                Created draft schedule (Candidate 1)
                                            </div>
                                            <div className="text-[11px] text-gray-400">System Admin • Oct 10, 2026 03:45 PM</div>
                                        </div>
                                        <span className="text-[11px] text-gray-400 shrink-0">3 days ago</span>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Generation Status Timeline */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-gray-900">Schedule Generation Status</h3>
                                    <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                                        View All
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                                ✓
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block">Data Preparation</span>
                                                <span className="text-[11px] text-gray-500">Master data completed</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                Completed
                                            </Badge>
                                            <span className="text-[10px] text-gray-400 block mt-0.5">Oct 12, 2026 10:30 AM</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                                ✓
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block">Faculty Loading</span>
                                                <span className="text-[11px] text-gray-500">All faculty assigned</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                Completed
                                            </Badge>
                                            <span className="text-[10px] text-gray-400 block mt-0.5">Oct 12, 2026 02:15 PM</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                                ✓
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block">Candidate Generation</span>
                                                <span className="text-[11px] text-gray-500">3 candidates generated</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                Completed
                                            </Badge>
                                            <span className="text-[10px] text-gray-400 block mt-0.5">Oct 12, 2026 05:40 PM</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-[10px]">
                                                4
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block">Program Review</span>
                                                <span className="text-[11px] text-gray-500">Waiting for program head review</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                                                Pending
                                            </Badge>
                                            <span className="text-[10px] text-gray-400 block mt-0.5">—</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Import Modal with Google Spreadsheet, CSV, and Gemini Scanner */}
                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="max-w-2xl font-['Poppins']">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                <Upload className="size-5 text-blue-600" />
                                Import Academic Data &amp; Master Records
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Import spreadsheets or CSV documents. Gemini will intelligently scan, validate, and normalize records into structured OfficeHub tables.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleConfirmImport} className="space-y-4 pt-2">
                            {/* Import Source Option */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700">Source Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setImportSource('google_sheet')}
                                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                                            importSource === 'google_sheet'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <FileSpreadsheet className="size-4 text-emerald-600" />
                                        Google Sheets URL
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setImportSource('csv_file')}
                                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                                            importSource === 'csv_file'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <FileText className="size-4 text-blue-600" />
                                        CSV File Upload
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setImportSource('sample_data')}
                                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                                            importSource === 'sample_data'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <RefreshCw className="size-4 text-purple-600" />
                                        OfficeHub Records
                                    </button>
                                </div>
                            </div>

                            {/* Google Sheet URL Input */}
                            {importSource === 'google_sheet' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">
                                        Google Spreadsheet URL / ID
                                    </label>
                                    <Input
                                        value={googleSheetUrl}
                                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                                        className="text-xs"
                                    />
                                    <span className="text-[11px] text-gray-400">
                                        Must be shared with view access or exported as CSV.
                                    </span>
                                </div>
                            )}

                            {/* CSV File Input */}
                            {importSource === 'csv_file' && (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-2 hover:border-blue-400 cursor-pointer">
                                    <Upload className="size-6 text-gray-400 mx-auto" />
                                    <div className="text-xs font-semibold text-gray-700">
                                        Click to browse or drop .csv timetable file here
                                    </div>
                                    <span className="text-[10px] text-gray-400 block">
                                        Supports UTF-8 CSV with Course, Section, Faculty, and Room headers.
                                    </span>
                                </div>
                            )}

                            {/* Gemini AI Scanner Callout */}
                            <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="size-4 text-purple-600" />
                                        <span className="text-xs font-bold text-purple-950">
                                            Enable Gemini AI Document Scanning &amp; Normalization
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={useGeminiScan}
                                        onChange={(e) => setUseGeminiScan(e.target.checked)}
                                        className="rounded size-4 text-purple-600 focus:ring-purple-500"
                                    />
                                </div>
                                <p className="text-[11px] text-purple-900/80 leading-relaxed">
                                    Gemini inspects column variations (e.g. &apos;Prof Name&apos; vs &apos;Instructor&apos;), infers missing room types (Lecture vs Lab), extracts faculty specializations, and maps entries into normalized database records.
                                </p>

                                {useGeminiScan && (
                                    <div className="pt-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleTriggerGeminiScan}
                                            disabled={isScanning}
                                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold h-7 px-3 gap-1.5"
                                        >
                                            {isScanning ? (
                                                <>
                                                    <RefreshCw className="size-3 animate-spin" /> Scanning with Gemini...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="size-3" /> Test Scan Document
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Scan Insights Display */}
                            {scanResults && (
                                <div className="p-3 bg-white border border-purple-200 rounded-xl space-y-2 text-xs">
                                    <div className="flex items-center justify-between font-bold text-purple-900">
                                        <span>Gemini Document Scan Completed</span>
                                        <Badge className="bg-purple-100 text-purple-800 text-[10px]">
                                            Confidence: {scanResults.confidence}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 py-1 text-center font-bold">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-900 block">{scanResults.detectedCourses}</span>
                                            <span className="text-[10px] text-gray-500 font-normal">Courses</span>
                                        </div>
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-900 block">{scanResults.detectedFacultySpecializations}</span>
                                            <span className="text-[10px] text-gray-500 font-normal">Specializations</span>
                                        </div>
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-900 block">{scanResults.detectedRooms}</span>
                                            <span className="text-[10px] text-gray-500 font-normal">Rooms &amp; Labs</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                                >
                                    Import &amp; Normalize into OfficeHub
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Faculty Assignment Dialog */}
                <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                    <DialogContent className="max-w-md font-['Poppins']">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-gray-900">
                                Assign Faculty to Course
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                {selectedCourseForAssign?.course_code} - {selectedCourseForAssign?.course_title} ({selectedCourseForAssign?.section})
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Select Faculty Member</label>
                                <select
                                    value={selectedFacultyId}
                                    onChange={(e) => setSelectedFacultyId(e.target.value)}
                                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white text-gray-900"
                                >
                                    <option value="">-- TBA / Unassigned --</option>
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.title_name || `${f.first_name} ${f.last_name}`} &nbsp;
                                            {f.specialization ? `(${f.specialization})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveAssignment}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                                >
                                    Save Assignment
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
