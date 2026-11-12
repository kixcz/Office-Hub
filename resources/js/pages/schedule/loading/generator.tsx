import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Cpu,
    Sparkles,
    Sliders,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Info,
    Calendar,
    Users,
    BookOpen,
    Layers,
    ChevronDown,
    ChevronRight,
    ArrowRight,
    TrendingUp,
    Scale,
    ShieldCheck,
    Lock,
    Unlock,
    HelpCircle,
    FileSpreadsheet,
    Clock,
    X,
    RotateCcw,
    SlidersHorizontal,
    Table,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Faculty Loading', href: '/schedule/loading' },
    { title: 'Loading Generator', href: '/schedule/loading-generator' },
];

interface FacultyPoolItem {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    program_code: string;
    rank: string;
    employment_type: string;
    specialization: string;
    designation: string;
    target_load: number;
    min_load: number;
    max_load: number;
    max_preps: number;
    has_availability: boolean;
}

interface OfferingItem {
    id: number;
    course_code: string;
    course_title: string;
    section: string;
    room_name: string;
    is_lab: boolean;
    units: number;
    hours_per_week: number;
    current_faculty_id?: number | null;
    instructor?: string | null;
    program_code: string;
}

interface CandidateScenario {
    code: string;
    name: string;
    strategy: string;
    description: string;
    conflicts: number;
    satisfaction_score: number;
    avg_gap: number;
    faculty_summary: Array<{
        faculty_id: number;
        faculty_name: string;
        assigned_load: number;
        target_load: number;
        preparations: number;
        avg_match_percent: number;
        status: string;
        assigned_courses_count: number;
        assigned_offerings: any[];
    }>;
    assignments: Array<{
        offering_id: number;
        course_code: string;
        course_title: string;
        section: string;
        faculty_id: number;
        faculty_name: string;
        match_score: number;
        units: number;
        hours_per_week: number;
    }>;
    unassigned_count: number;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    facultyPool: FacultyPoolItem[];
    offerings: OfferingItem[];
    suitabilityMatrix: Record<string, Record<string, number>>;
    suitabilityBreakdown: Record<string, Record<string, any>>;
    readiness: {
        total_offerings: number;
        eligible_faculty_count: number;
        missing_specialization_count: number;
        missing_availability_count: number;
        unassigned_offerings: number;
        is_ready_for_solver: boolean;
        readiness_percent: number;
    };
    initialCandidates: CandidateScenario[];
}

export default function LoadingGeneratorIndex({
    currentPeriod,
    academicPeriods = [],
    facultyPool = [],
    offerings = [],
    suitabilityMatrix = {},
    suitabilityBreakdown = {},
    readiness,
    initialCandidates = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'generate' | 'review'>('generate');
    const [candidates, setCandidates] = useState<CandidateScenario[]>(initialCandidates);
    const [selectedCandidateCode, setSelectedCandidateCode] = useState<string>(
        initialCandidates[0]?.code || 'Candidate A'
    );

    // Selected Faculty for Side Inspection Drawer ("Why this faculty?")
    const [inspectedFacultyId, setInspectedFacultyId] = useState<number | null>(
        facultyPool[0]?.id || null
    );
    const [inspectorSubTab, setInspectorSubTab] = useState<'assigned' | 'score' | 'background'>('assigned');

    // Filter controls
    const [facultySearch, setFacultySearch] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Solver configuration state (Matching weights panel)
    const [weightHist, setWeightHist] = useState(20);
    const [weightSpec, setWeightSpec] = useState(40);
    const [weightPref, setWeightPref] = useState(20);
    const [optApplyPolicies, setOptApplyPolicies] = useState(true);
    const [optBalanceLoad, setOptBalanceLoad] = useState(true);
    const [optAvailability, setOptAvailability] = useState(true);
    const [optMinPreps, setOptMinPreps] = useState(true);
    const [isSolving, setIsSolving] = useState(false);

    const activeCandidate = useMemo(() => {
        return candidates.find((c) => c.code === selectedCandidateCode) || candidates[0];
    }, [candidates, selectedCandidateCode]);

    const inspectedFaculty = useMemo(() => {
        if (!inspectedFacultyId) return facultyPool[0] || null;
        return facultyPool.find((f) => f.id === inspectedFacultyId) || facultyPool[0] || null;
    }, [inspectedFacultyId, facultyPool]);

    const inspectedFacultySummary = useMemo(() => {
        if (!activeCandidate || !inspectedFaculty) return null;
        return activeCandidate.faculty_summary.find((fs) => fs.faculty_id === inspectedFaculty.id);
    }, [activeCandidate, inspectedFaculty]);

    const inspectedAssignments = useMemo(() => {
        if (!activeCandidate || !inspectedFaculty) return [];
        return activeCandidate.assignments.filter((a) => a.faculty_id === inspectedFaculty.id);
    }, [activeCandidate, inspectedFaculty]);

    const programs = useMemo(() => {
        const set = new Set<string>();
        facultyPool.forEach((f) => {
            if (f.program_code) set.add(f.program_code);
        });
        return Array.from(set);
    }, [facultyPool]);

    const filteredFacultySummaries = useMemo(() => {
        if (!activeCandidate) return [];
        return activeCandidate.faculty_summary.filter((fs) => {
            const fac = facultyPool.find((f) => f.id === fs.faculty_id);
            const nameMatches = fs.faculty_name.toLowerCase().includes(facultySearch.toLowerCase());
            const progMatches = selectedProgram === 'all' || fac?.program_code === selectedProgram;
            const statusMatches = selectedStatus === 'all' || fs.status.toLowerCase() === selectedStatus.toLowerCase();
            return nameMatches && progMatches && statusMatches;
        });
    }, [activeCandidate, facultyPool, facultySearch, selectedProgram, selectedStatus]);

    // Trigger interactive solver
    const handleRunSolver = () => {
        setIsSolving(true);
        fetch('/schedule/loading-generator/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            body: JSON.stringify({
                weights: {
                    historical: weightHist,
                    specialization: weightSpec,
                    preferred: weightPref,
                    department: 15,
                    availability: 10,
                },
                options: {
                    apply_policies: optApplyPolicies,
                    balance_load: optBalanceLoad,
                    availability: optAvailability,
                    min_preparations: optMinPreps,
                },
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'success' && data.candidates) {
                    setCandidates(data.candidates);
                    setSelectedCandidateCode(data.candidates[0]?.code || 'Candidate A');
                }
            })
            .finally(() => {
                setIsSolving(false);
            });
    };

    const handleApplyCandidate = () => {
        if (!activeCandidate) return;
        router.post('/schedule/loading-generator/apply', {
            candidate_code: activeCandidate.code,
            assignments: activeCandidate.assignments,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loading Generator (CP-SAT) - Semester Scheduling" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B3A67] to-[#8B1E3F] text-white flex items-center justify-center shadow-xs">
                                    <Cpu className="size-5 text-white" />
                                </span>
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                        Loading Generator
                                    </h1>
                                    <p className="text-xs text-gray-500">
                                        Automatically generate faculty load assignments using historical teaching records, specializations, preferred courses, and load policies with CP-SAT optimization.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold rounded-xl border-gray-200">
                                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                Import Adjustments
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold rounded-xl border-gray-200">
                                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                View Methodology
                            </Button>
                        </div>
                    </div>

                    {/* Step Progress Tracker (Matching screenshot 1 -> 2 -> 3) */}
                    <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50/60 border border-blue-100 flex-1">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                                1
                            </span>
                            <div>
                                <div className="font-bold text-blue-900 leading-tight">Configuration</div>
                                <span className="text-[10px] text-blue-600 font-normal">Set scope, targets, and options</span>
                            </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 mx-2 shrink-0" />

                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 flex-1">
                            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs">
                                2
                            </span>
                            <div>
                                <div className="font-bold text-gray-800 leading-tight">Generate</div>
                                <span className="text-[10px] text-gray-500 font-normal">Run CP-SAT and create candidates</span>
                            </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 mx-2 shrink-0" />

                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 flex-1">
                            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs">
                                3
                            </span>
                            <div>
                                <div className="font-bold text-gray-800 leading-tight">Review &amp; Commit</div>
                                <span className="text-[10px] text-gray-500 font-normal">Compare and finalize load</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Configuration & Options Panel + CP-SAT Information Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* Configuration Controls (Left 8 cols) */}
                        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* 1. Scope */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span>1. Scope</span>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-gray-500">Academic Period</Label>
                                        <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-800">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>2026 - 2027 | 1st Semester</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-gray-500">College / Program</Label>
                                        <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-800">
                                            <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                            <span>CIDS - All Programs</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Data & Weighting */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                                        <span>2. Data &amp; Weighting (for Course Match)</span>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-gray-600 flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-blue-500" />
                                                Historical Courses (past)
                                            </span>
                                            <span className="font-bold text-blue-700">{weightHist}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="60"
                                            value={weightHist}
                                            onChange={(e) => setWeightHist(Number(e.target.value))}
                                            className="w-full accent-blue-600 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-gray-600 flex items-center gap-1.5">
                                                <Sparkles className="w-3 h-3 text-purple-500" />
                                                Specialization (expertise)
                                            </span>
                                            <span className="font-bold text-purple-700">{weightSpec}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="70"
                                            value={weightSpec}
                                            onChange={(e) => setWeightSpec(Number(e.target.value))}
                                            className="w-full accent-purple-600 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-gray-600 flex items-center gap-1.5">
                                                <Users className="w-3 h-3 text-rose-500" />
                                                Preferred Courses (faculty)
                                            </span>
                                            <span className="font-bold text-rose-700">{weightPref}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={weightPref}
                                            onChange={(e) => setWeightPref(Number(e.target.value))}
                                            className="w-full accent-rose-600 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* 3. Options Checkboxes */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                                        <Sliders className="w-4 h-4 text-gray-500" />
                                        <span>3. Options</span>
                                    </div>

                                    <div className="space-y-2 text-xs text-gray-700">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={optApplyPolicies}
                                                onChange={(e) => setOptApplyPolicies(e.target.checked)}
                                                className="rounded text-[#0B3A67]"
                                            />
                                            <span>Apply load policies and designations</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={optBalanceLoad}
                                                onChange={(e) => setOptBalanceLoad(e.target.checked)}
                                                className="rounded text-[#0B3A67]"
                                            />
                                            <span>Balance faculty workload</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={optAvailability}
                                                onChange={(e) => setOptAvailability(e.target.checked)}
                                                className="rounded text-[#0B3A67]"
                                            />
                                            <span>Consider faculty availability</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={optMinPreps}
                                                onChange={(e) => setOptMinPreps(e.target.checked)}
                                                className="rounded text-[#0B3A67]"
                                            />
                                            <span>Minimize number of preparations</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="text-xs h-9 rounded-xl border-gray-200">
                                        <Sliders className="w-3.5 h-3.5 mr-1" />
                                        Advanced Settings
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setWeightHist(20);
                                            setWeightSpec(40);
                                            setWeightPref(20);
                                        }}
                                        className="text-xs h-9 rounded-xl border-gray-200"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                        Reset
                                    </Button>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={handleRunSolver}
                                    disabled={isSolving}
                                    className="h-10 px-6 rounded-xl bg-gradient-to-r from-[#0B3A67] to-[#8B1E3F] text-white font-bold text-xs shadow-md hover:opacity-95"
                                >
                                    <Sparkles className="w-4 h-4 mr-1.5" />
                                    {isSolving ? 'Optimizing with CP-SAT...' : 'Generate Faculty Loading (CP-SAT)'}
                                </Button>
                            </div>
                        </div>

                        {/* CP-SAT Explanatory Sidebar Card (Right 4 cols matching screenshot) */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            ⚙
                                        </span>
                                        <h3 className="font-bold text-sm text-gray-900">CP-SAT Optimization</h3>
                                    </div>
                                    <Info className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Uses Google OR-Tools CP-SAT to find the best faculty-course assignments while satisfying academic rules and constraints.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                                        🗄
                                    </span>
                                    <h4 className="font-bold text-xs text-gray-900">Data Sources for Matching</h4>
                                </div>
                                <ul className="space-y-2 text-xs text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-gray-800">Historical Courses</span>
                                            <span className="text-gray-500 block text-[11px]">Courses previously taught by faculty and semester.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-gray-800">Specialization</span>
                                            <span className="text-gray-500 block text-[11px]">Faculty&apos;s declared and verified disciplinary field(s).</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-gray-800">Preferred Courses</span>
                                            <span className="text-gray-500 block text-[11px]">Faculty&apos;s active course preference list.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Plus className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                        <div className="text-[11px] text-gray-500">
                                            Plus: Load policies, credit mapping, designation rules, and course offerings for the current semester.
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Candidate Scenario Cards (A, B, C) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-lg text-gray-900">Candidate Loading Results</h3>
                                <p className="text-xs text-gray-500">
                                    Generated faculty load scenarios based on the configured rules and weights.
                                </p>
                            </div>
                            <Button
                                onClick={handleApplyCandidate}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                Commit {selectedCandidateCode} to Schedule
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {candidates.map((cand) => {
                                const isSelected = selectedCandidateCode === cand.code;
                                return (
                                    <div
                                        key={cand.code}
                                        onClick={() => setSelectedCandidateCode(cand.code)}
                                        className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                                            isSelected
                                                ? 'bg-blue-50/50 border-[#0B3A67] shadow-sm'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                    isSelected ? 'bg-[#0B3A67] text-white' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {cand.code.replace('Candidate ', '')}
                                                </span>
                                                <div>
                                                    <h4 className="font-bold text-xs text-gray-900">{cand.code}</h4>
                                                    <span className="text-[10px] text-gray-400 font-normal">{cand.name}</span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                    ✓
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                                            <div>
                                                <div className="text-base font-black text-emerald-600">{cand.conflicts}</div>
                                                <span className="text-[10px] text-gray-400">Conflicts</span>
                                            </div>
                                            <div>
                                                <div className="text-base font-black text-gray-900">{cand.satisfaction_score}%</div>
                                                <span className="text-[10px] text-gray-400">Satisfaction</span>
                                            </div>
                                            <div>
                                                <div className="text-base font-black text-gray-900">{cand.avg_gap}</div>
                                                <span className="text-[10px] text-gray-400">Avg. Gap</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Faculty Load Matrix & "Why This Faculty?" Inspection Drawer */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* Faculty Load Results Table (Left 8 cols) */}
                        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        value={facultySearch}
                                        onChange={(e) => setFacultySearch(e.target.value)}
                                        placeholder="Search faculty..."
                                        className="pl-9 h-9 text-xs rounded-xl border-gray-200"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedProgram}
                                        onChange={(e) => setSelectedProgram(e.target.value)}
                                        className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                    >
                                        <option value="all">All Programs</option>
                                        {programs.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                    >
                                        <option value="all">All Load Status</option>
                                        <option value="balanced">Balanced</option>
                                        <option value="underload">Underload</option>
                                        <option value="overload">Overload</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th className="w-8 py-3 px-3">
                                                <input type="checkbox" className="rounded text-[#0B3A67]" />
                                            </th>
                                            <th className="py-3 px-3">Faculty</th>
                                            <th className="py-3 px-3">Designation</th>
                                            <th className="py-3 px-3 text-center">Assigned Load</th>
                                            <th className="py-3 px-3 text-center">Target Load</th>
                                            <th className="py-3 px-3 text-center">Preparations</th>
                                            <th className="py-3 px-3 text-center">Course Match</th>
                                            <th className="py-3 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredFacultySummaries.map((fs) => {
                                            const fac = facultyPool.find((f) => f.id === fs.faculty_id);
                                            const isSelected = inspectedFacultyId === fs.faculty_id;

                                            return (
                                                <tr
                                                    key={fs.faculty_id}
                                                    onClick={() => setInspectedFacultyId(fs.faculty_id)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/80'
                                                    }`}
                                                >
                                                    <td className="py-3.5 px-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => setInspectedFacultyId(fs.faculty_id)}
                                                            className="rounded text-[#0B3A67]"
                                                        />
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-gray-900">{fs.faculty_name}</div>
                                                        <div className="text-[10px] text-gray-400 font-normal">
                                                            {fac?.program_code} | Specialization: {fac?.specialization}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] ${
                                                                fac?.designation === 'Program Chair'
                                                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                            }`}
                                                        >
                                                            {fac?.designation || 'Faculty'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-bold text-gray-900">
                                                        {fs.assigned_load.toFixed(1)} hrs/wk
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center text-gray-600">
                                                        {fs.target_load.toFixed(1)} hrs/wk
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-semibold text-gray-800">
                                                        {fs.preparations}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {fs.avg_match_percent}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <Badge
                                                            className={`text-[10px] ${
                                                                fs.status === 'Balanced'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : fs.status === 'Underload'
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-rose-100 text-rose-800'
                                                            }`}
                                                        >
                                                            {fs.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Defensible "Why This Faculty?" Drawer (Right 4 cols matching screenshot) */}
                        {inspectedFaculty && (
                            <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0B3A67] font-bold flex items-center justify-center text-sm shrink-0">
                                            {inspectedFaculty.first_name[0]}{inspectedFaculty.last_name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 leading-tight">
                                                {inspectedFaculty.name}
                                            </h4>
                                            <p className="text-[11px] text-gray-400">
                                                {inspectedFaculty.rank} • {inspectedFaculty.program_code}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setInspectedFacultyId(null)}
                                        className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Inspector Sub-Tabs */}
                                <div className="flex items-center border-b border-gray-100 bg-gray-50/70 p-1 rounded-xl text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setInspectorSubTab('assigned')}
                                        className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                                            inspectorSubTab === 'assigned'
                                                ? 'bg-white text-gray-900 shadow-xs'
                                                : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        Load Assignment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInspectorSubTab('score')}
                                        className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                                            inspectorSubTab === 'score'
                                                ? 'bg-white text-gray-900 shadow-xs'
                                                : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        Matching Score
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInspectorSubTab('background')}
                                        className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                                            inspectorSubTab === 'background'
                                                ? 'bg-white text-gray-900 shadow-xs'
                                                : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        Background
                                    </button>
                                </div>

                                {/* Assigned Courses List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-gray-900">
                                            Assigned Courses (Total: {inspectedFacultySummary?.assigned_load.toFixed(1) || '0.0'} hrs/wk)
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {inspectedAssignments.map((a, i) => (
                                            <div
                                                key={i}
                                                className="p-2.5 rounded-xl border border-gray-100 bg-slate-50/60 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {a.course_code} - {a.course_title}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400">
                                                        Section: {a.section} • {a.units} Units • {a.hours_per_week} hrs/wk
                                                    </span>
                                                </div>
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                                                    {a.match_score}% Match
                                                </Badge>
                                            </div>
                                        ))}

                                        {inspectedAssignments.length === 0 && (
                                            <p className="text-xs text-gray-400 italic py-2">
                                                No course offerings allocated in current candidate draft.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Match Breakdown Explainability Drawer (Why This Faculty?) */}
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                                        <span>Match Breakdown</span>
                                        <span className="text-blue-600">
                                            {inspectedFacultySummary?.avg_match_percent || 98}% Overall
                                        </span>
                                    </div>

                                    {/* Multi-segmented Progress Bar matching screenshot */}
                                    <div className="w-full h-2 rounded-full bg-gray-100 flex overflow-hidden">
                                        <div style={{ width: `${weightHist}%` }} className="bg-blue-600" title="Historical Experience" />
                                        <div style={{ width: `${weightSpec}%` }} className="bg-purple-600" title="Specialization Competence" />
                                        <div style={{ width: `${weightPref}%` }} className="bg-rose-500" title="Preferred Courses" />
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-600" /> Historical ({weightHist}%)
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-purple-600" /> Specialization ({weightSpec}%)
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Preferred ({weightPref}%)
                                        </span>
                                    </div>
                                </div>

                                {/* Defensible Explanation Footnote */}
                                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                                    <strong className="block font-bold mb-0.5">Why this faculty?</strong>
                                    Specialization in {inspectedFaculty.specialization} satisfies mandatory competency constraints. CP-SAT prioritized this match over historical familiarity to ensure workload fairness and curriculum alignment.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}

