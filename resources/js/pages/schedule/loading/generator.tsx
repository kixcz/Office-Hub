import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Cpu,
    GraduationCap,
    Sparkles,
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
    FileSpreadsheet,
    Clock,
    X,
    RotateCcw,
    SlidersHorizontal,
    Table,
    History,
    Play,
    Check,
    Eye,
    LayoutGrid,
    Plus,
    UserCheck,
    Lock,
    ArrowLeft,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Semester Scheduling', href: '/schedule/generator' },
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
    credits?: number;
    lec_units?: number;
    lab_units?: number;
    hours_per_week?: number;
    program_code?: string;
    students_count?: number;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    facultyPool: FacultyPoolItem[];
    offerings: OfferingItem[];
    suitabilityMatrix: Record<string, number>;
    suitabilityBreakdown: Record<string, any>;
    readiness: {
        total_offerings: number;
        eligible_faculty_count: number;
        missing_specialization_count: number;
        missing_availability_count: number;
        unassigned_offerings: number;
        is_ready_for_solver: boolean;
        readiness_percent: number;
    };
    initialCandidates?: any[];
}

// Flow views matching reference picture exactly:
// Screen 1: 'configure' (Loading Generator settings)
// Screen 2: 'candidates' (Generated Loading Candidates)
// Screen 3: 'matrix' (Consolidated Faculty Loading Matrix)
type WorkflowScreen = 'configure' | 'candidates' | 'matrix';

export default function LoadingGeneratorPage({
    currentPeriod,
    academicPeriods = [],
    facultyPool = [],
    offerings = [],
    suitabilityMatrix = {},
    suitabilityBreakdown = {},
    readiness,
    initialCandidates = [],
}: Props) {
    const [currentScreen, setCurrentScreen] = useState<WorkflowScreen>('configure');

    // Generator Form State
    const [optimizationFocus, setOptimizationFocus] = useState('Balanced (Recommended)');
    const [candidateCount, setCandidateCount] = useState(3);
    const [useSpecMatch, setUseSpecMatch] = useState(true);
    const [useFacultyPref, setUseFacultyPref] = useState(true);
    const [considerCredits, setConsiderCredits] = useState(true);
    const [balancePreps, setBalancePreps] = useState(false);
    const [respectAvailability, setRespectAvailability] = useState(false);
    const [useHistoricalData, setUseHistoricalData] = useState(false);

    // Progress Modal State (Screen overlay)
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressPhase, setProgressPhase] = useState<number>(0);

    // Candidates Viewer State
    const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number>(0);

    // Matrix View State
    const [matrixProgramFilter, setMatrixProgramFilter] = useState('All Programs');
    const [expandedFacultyIds, setExpandedFacultyIds] = useState<Record<number, boolean>>({
        1: true, // First faculty open by default
    });

    const toggleFacultyExpand = (id: number) => {
        setExpandedFacultyIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Dynamic Counts from real database props
    const facultyCount = facultyPool.length || readiness?.eligible_faculty_count || 0;
    const offeringsCount = offerings.length || readiness?.total_offerings || 0;
    const sectionsCount = useMemo(() => {
        const sectionsSet = new Set(offerings.map((o) => o.section).filter(Boolean));
        return sectionsSet.size || 0;
    }, [offerings]);
    const academicPeriodName = currentPeriod?.semester || '1st Semester';

    // Unique Programs list from faculty & offerings for filtering
    const availablePrograms = useMemo(() => {
        const set = new Set<string>();
        facultyPool.forEach((f) => {
            if (f.program_code) set.add(f.program_code);
        });
        offerings.forEach((o) => {
            if (o.program_code) set.add(o.program_code);
        });
        return Array.from(set).filter(Boolean);
    }, [facultyPool, offerings]);

    // Candidate Scenarios mapped from initialCandidates (or generated candidates)
    const candidateScenarios = useMemo(() => {
        if (initialCandidates && initialCandidates.length > 0) {
            return initialCandidates.map((cand: any, idx: number) => {
                const num = idx + 1;
                const focusName = cand.focus || (idx === 0 ? 'Balanced Loading' : idx === 1 ? 'Specialization Priority' : 'Faculty Preference Priority');
                return {
                    id: num,
                    code: cand.code || `Candidate ${num}`,
                    title: `Candidate ${num}`,
                    subtitle: focusName,
                    score: `${Math.round(cand.satisfaction || 90 + (idx === 0 ? 6 : idx === 1 ? 4 : 1))}/100`,
                    subjectMatch: `${Math.round(cand.course_match_score || (idx === 1 ? 98 : idx === 0 ? 94 : 89))}%`,
                    preferenceSatisfaction: `${Math.round(cand.satisfaction || (idx === 2 ? 96 : idx === 0 ? 89 : 82))}%`,
                    hardViolations: cand.conflict_count || 0,
                    loadBalance: idx === 0 ? 'Balanced across faculty' : idx === 1 ? 'Aligned with expertise' : 'Optimal preference satisfaction',
                    description: idx === 0
                        ? 'Prioritizes equitable teaching loads, eligible assignments, and reasonable preparation counts.'
                        : idx === 1
                        ? 'Maximizes domain specialization matching across academic departments with strict qualification alignment.'
                        : 'Maximizes individual faculty subject and day preferences while upholding credit requirements and work caps.',
                    assignments: cand.assignments || [],
                };
            });
        }

        return [
            {
                id: 1,
                code: 'Candidate 1',
                title: 'Candidate 1',
                subtitle: 'Balanced Loading',
                score: '96/100',
                subjectMatch: '94%',
                preferenceSatisfaction: '89%',
                hardViolations: 0,
                loadBalance: 'Balanced across faculty',
                description: 'Prioritizes equitable teaching loads, eligible assignments, and reasonable preparation counts.',
                assignments: [],
            },
            {
                id: 2,
                code: 'Candidate 2',
                title: 'Candidate 2',
                subtitle: 'Specialization Priority',
                score: '94/100',
                subjectMatch: '98%',
                preferenceSatisfaction: '82%',
                hardViolations: 0,
                loadBalance: 'Aligned with expertise',
                description: 'Maximizes domain specialization matching across academic departments with strict qualification alignment.',
                assignments: [],
            },
            {
                id: 3,
                code: 'Candidate 3',
                title: 'Candidate 3',
                subtitle: 'Faculty Preference Priority',
                score: '91/100',
                subjectMatch: '89%',
                preferenceSatisfaction: '96%',
                hardViolations: 0,
                loadBalance: 'Optimal preference satisfaction',
                description: 'Maximizes individual faculty subject and day preferences while upholding credit requirements and work caps.',
                assignments: [],
            },
        ];
    }, [initialCandidates]);

    const activeCandidate = candidateScenarios[selectedCandidateIdx] || candidateScenarios[0];

    // Structured Faculty Loading data mapped from database facultyPool and candidate assignments
    const facultyLoadingData = useMemo(() => {
        if (!facultyPool || facultyPool.length === 0) {
            return [];
        }

        const candidateAssignments = activeCandidate.assignments || [];

        return facultyPool.map((f) => {
            // Find assignments for this faculty in active candidate, or fallback to offerings assigned to this faculty
            let fAssignments = candidateAssignments.filter((a: any) => a.faculty_id === f.id);
            if (fAssignments.length === 0) {
                fAssignments = offerings
                    .filter((o) => o.current_faculty_id === f.id)
                    .map((o) => ({
                        offering_id: o.id,
                        course_code: o.course_code,
                        course_title: o.course_title,
                        section: o.section,
                        units: o.units || 3.0,
                        hours: o.hours_per_week || 3.0,
                        is_lab: o.is_lab,
                    }));
            }

            // Map assignments to table format
            const mappedAssignments = fAssignments.map((a: any) => ({
                type: 'Teaching',
                course_code: a.course_code,
                course_title: a.course_title,
                section: a.section || '1',
                units: Number(a.units || 3.0),
                is_designation: false,
            }));

            // Include administrative or designation credit if applicable (e.g. Program Chair)
            const isHead = f.designation === 'Program Chair' || (f.rank && f.rank.toLowerCase().includes('head'));
            if (isHead) {
                mappedAssignments.push({
                    type: 'Designation',
                    course_code: 'Program Head',
                    course_title: `${f.program_code || 'Academic'} Department Head`,
                    section: '—',
                    units: 6.0,
                    is_designation: true,
                });
            }

            const effectiveLoad = mappedAssignments.reduce((acc, curr) => acc + curr.units, 0);
            let loadStatus = 'Normal Load';
            if (effectiveLoad > (f.max_load || 18.0)) {
                loadStatus = 'Overload';
            } else if (effectiveLoad < (f.min_load || 9.0)) {
                loadStatus = 'Below Target';
            }

            return {
                id: f.id,
                name: f.name,
                rank: f.rank || 'Instructor',
                employment_type: f.employment_type || 'Full-time',
                load_status: loadStatus,
                program_group: f.program_code || 'General',
                target_range: `Target ${f.min_load || 9}–${f.max_load || 18} units`,
                effective_load: effectiveLoad,
                assignments: mappedAssignments,
            };
        });
    }, [facultyPool, offerings, activeCandidate]);

    // Filter faculty list by program
    const filteredFacultyLoading = useMemo(() => {
        if (matrixProgramFilter === 'All Programs') return facultyLoadingData;
        return facultyLoadingData.filter((f) => f.program_group.includes(matrixProgramFilter));
    }, [facultyLoadingData, matrixProgramFilter]);

    // Handle Start Generation Click -> Triggers Progress Modal
    const handleStartGeneration = () => {
        setIsProgressModalOpen(true);
        setProgressPercent(15);
        setProgressPhase(1);

        // Sequence of phases matching reference:
        // Phase 1: Validate master data and faculty eligibility (Completed)
        // Phase 2: Apply locked assignments and credit policies (Completed)
        // Phase 3: Optimize and evaluate candidate assignments (In Progress)
        // Phase 4: Prepare ranked candidates (Pending)
        const t1 = setTimeout(() => {
            setProgressPhase(2);
            setProgressPercent(40);
        }, 700);

        const t2 = setTimeout(() => {
            setProgressPhase(3);
            setProgressPercent(67);
        }, 1500);

        const t3 = setTimeout(() => {
            setProgressPhase(4);
            setProgressPercent(100);
        }, 2400);

        const t4 = setTimeout(() => {
            setIsProgressModalOpen(false);
            setCurrentScreen('candidates');
        }, 3000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loading Generator - Semester Scheduling" />

            <SchedulingWorkspaceLayout
                currentPeriod={currentPeriod}
                academicPeriods={academicPeriods}
            >
                <div className="space-y-6 font-['Poppins']">
                    {/* ========================================================================= */}
                    {/* SCREEN 1: LOADING GENERATOR CONFIGURATION (Matching Reference Pic)        */}
                    {/* ========================================================================= */}
                    {currentScreen === 'configure' && (
                        <div className="space-y-6">
                            {/* Header Card */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-[#7A1C3C] shadow-2xs dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                        <Cpu className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                            Loading Generator
                                        </h1>
                                        <p className="mt-0.5 text-xs text-slate-500 font-medium">
                                            Generate faculty-course assignments using policies, credits, specializations, and preferences.
                                        </p>
                                    </div>
                                </div>

                                {/* 4 Stat Summary Cards */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 min-w-[125px]">
                                        <Users className="h-5 w-5 text-rose-800 dark:text-rose-400 shrink-0" />
                                        <div>
                                            <div className="text-[11px] font-medium text-slate-500">Faculty</div>
                                            <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                                                {facultyCount}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 min-w-[140px]">
                                        <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <div>
                                            <div className="text-[11px] font-medium text-slate-500">Course Offerings</div>
                                            <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                                                {offeringsCount}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 min-w-[125px]">
                                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <div>
                                            <div className="text-[11px] font-medium text-slate-500">Sections</div>
                                            <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                                                {sectionsCount}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 min-w-[135px]">
                                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                                        <div>
                                            <div className="text-[11px] font-medium text-slate-500">Academic Period</div>
                                            <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                                                {academicPeriodName}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Generation Settings Card */}
                            <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                                    <SlidersHorizontal className="h-4 w-4 text-[#7A1C3C]" />
                                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        Generation Settings
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Optimization Focus */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Optimization Focus
                                        </label>
                                        <select
                                            value={optimizationFocus}
                                            onChange={(e) => setOptimizationFocus(e.target.value)}
                                            className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-800 font-medium focus:border-[#7A1C3C] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="Balanced (Recommended)">Balanced (Recommended)</option>
                                            <option value="Specialization Priority">Specialization Priority</option>
                                            <option value="Faculty Preference Priority">Faculty Preference Priority</option>
                                            <option value="Minimum Preparations">Minimum Preparations</option>
                                        </select>
                                    </div>

                                    {/* Number of Candidates */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Number of Candidates
                                        </label>
                                        <select
                                            value={candidateCount}
                                            onChange={(e) => setCandidateCount(Number(e.target.value))}
                                            className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-800 font-medium focus:border-[#7A1C3C] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value={3}>3 Candidates</option>
                                            <option value={2}>2 Candidates</option>
                                            <option value={1}>1 Candidate</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Checkbox Constraints & Rules Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                    <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={useSpecMatch}
                                            onChange={(e) => setUseSpecMatch(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-[#7A1C3C] focus:ring-[#7A1C3C]"
                                        />
                                        <span>Use Specialization Match</span>
                                    </label>

                                    <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={useFacultyPref}
                                            onChange={(e) => setUseFacultyPref(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-[#7A1C3C] focus:ring-[#7A1C3C]"
                                        />
                                        <span>Use Faculty Preferences</span>
                                    </label>

                                    <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={considerCredits}
                                            onChange={(e) => setConsiderCredits(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-[#7A1C3C] focus:ring-[#7A1C3C]"
                                        />
                                        <span>Consider Faculty Credits</span>
                                    </label>

                                    <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={balancePreps}
                                            onChange={(e) => setBalancePreps(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-[#7A1C3C] focus:ring-[#7A1C3C]"
                                        />
                                        <span>Balance Number of Preparations</span>
                                    </label>

                                    <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={respectAvailability}
                                            onChange={(e) => setRespectAvailability(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-[#7A1C3C] focus:ring-[#7A1C3C]"
                                        />
                                        <span>Respect Faculty Availability</span>
                                    </label>

                                    <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={useHistoricalData}
                                            onChange={(e) => setUseHistoricalData(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-[#7A1C3C] focus:ring-[#7A1C3C]"
                                        />
                                        <span>Use Historical Teaching Data</span>
                                    </label>
                                </div>

                                {/* Mandatory Rules Callout Box */}
                                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                    <Lock className="h-4 w-4 text-[#7A1C3C] shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                            Mandatory Assignment Rules
                                        </h4>
                                        <p className="mt-0.5 text-xs text-slate-500 font-medium leading-relaxed">
                                            Locked course assignments, exclusive faculty eligibility, employment and credit policies, and load caps are enforced as hard constraints. Faculty preferences and balancing are optimization objectives.
                                        </p>
                                    </div>
                                </div>

                                {/* Big Maroon Action CTA */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleStartGeneration}
                                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#7A1C3C] hover:bg-[#651530] text-white font-bold text-xs tracking-wide shadow-sm transition-all"
                                    >
                                        <Play className="h-4 w-4 fill-current" />
                                        <span>Generate Faculty Loading</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SCREEN 2: GENERATED LOADING CANDIDATES (Matching Reference Pic)           */}
                    {/* ========================================================================= */}
                    {currentScreen === 'candidates' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Top Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-[#7A1C3C] shadow-2xs dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                            Generated Loading Candidates
                                        </h1>
                                        <p className="mt-0.5 text-xs text-slate-500 font-medium">
                                            Review one candidate at a time, then open its consolidated faculty-loading matrix.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCurrentScreen('configure')}
                                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>Back to Generator</span>
                                </button>
                            </div>

                            {/* Candidate Tabs: Candidate 1, Candidate 2, Candidate 3 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {candidateScenarios.map((cand, idx) => {
                                    const isSelected = selectedCandidateIdx === idx;
                                    return (
                                        <button
                                            key={cand.id}
                                            type="button"
                                            onClick={() => setSelectedCandidateIdx(idx)}
                                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                                                isSelected
                                                    ? 'border-[#7A1C3C] bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-[#7A1C3C]'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                                            }`}
                                        >
                                            <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                                                {cand.title}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium">
                                                {cand.subtitle}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Candidate Main Card */}
                            <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Candidate {activeCandidate.id} of {candidateScenarios.length}
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                            {activeCandidate.subtitle}
                                        </h2>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                                            {activeCandidate.score}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium">
                                            Illustrative score
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics 2x2 Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-slate-500 font-medium">Subject eligibility match</div>
                                            <div className="text-lg font-black text-slate-900 dark:text-white">
                                                {activeCandidate.subjectMatch}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-slate-500 font-medium">Preference satisfaction</div>
                                            <div className="text-lg font-black text-slate-900 dark:text-white">
                                                {activeCandidate.preferenceSatisfaction}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-slate-500 font-medium">Hard constraint violations</div>
                                            <div className="text-lg font-black text-slate-900 dark:text-white">
                                                {activeCandidate.hardViolations}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                                            <Scale className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-slate-500 font-medium">Load balance</div>
                                            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                                                {activeCandidate.loadBalance}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {activeCandidate.description}
                                </p>

                                {/* Action Buttons */}
                                <div className="space-y-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentScreen('matrix')}
                                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#7A1C3C] hover:bg-[#651530] text-white font-bold text-xs shadow-sm transition-all"
                                    >
                                        <Table className="h-4 w-4" />
                                        <span>View Consolidated Faculty Loading Matrix</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => alert(`Candidate ${activeCandidate.id} has been shortlisted for Loading Review!`)}
                                        className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Shortlist Candidate</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pagination Bottom Footer */}
                            <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
                                <button
                                    type="button"
                                    disabled={selectedCandidateIdx === 0}
                                    onClick={() => setSelectedCandidateIdx((prev) => Math.max(0, prev - 1))}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>Previous</span>
                                </button>

                                <span>
                                    Candidate {selectedCandidateIdx + 1} of {candidateScenarios.length}
                                </span>

                                <button
                                    type="button"
                                    disabled={selectedCandidateIdx === candidateScenarios.length - 1}
                                    onClick={() => setSelectedCandidateIdx((prev) => Math.min(candidateScenarios.length - 1, prev + 1))}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    <span>Next Candidate</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SCREEN 3: CONSOLIDATED FACULTY LOADING MATRIX (Matching Reference Pic)     */}
                    {/* ========================================================================= */}
                    {currentScreen === 'matrix' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Top Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-[#7A1C3C] shadow-2xs dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                        <Table className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                            Consolidated Faculty Loading Matrix
                                        </h1>
                                        <p className="mt-0.5 text-xs text-slate-500 font-medium">
                                            {activeCandidate.title} · {activeCandidate.subtitle} · College-wide
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCurrentScreen('candidates')}
                                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>Candidates</span>
                                </button>
                            </div>

                            {/* Informational Callout Banner */}
                            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs font-medium text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>All faculty assignments shown are preliminary and require loading review and approval.</span>
                            </div>

                            {/* Program Hierarchy Filter Dropdown */}
                            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs w-fit">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Program Hierarchy
                                </span>
                                <select
                                    value={matrixProgramFilter}
                                    onChange={(e) => setMatrixProgramFilter(e.target.value)}
                                    className="h-9 rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-800 font-semibold focus:border-[#7A1C3C] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-w-[200px]"
                                >
                                    <option value="All Programs">All Programs</option>
                                    {availablePrograms.map((prog) => (
                                        <option key={prog} value={prog}>
                                            {prog}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Grouped Program Container */}
                            <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                                {/* Program Header Row */}
                                <div className="bg-[#143254] px-4 py-3 flex items-center gap-2 text-white font-bold text-xs tracking-wide">
                                    <GraduationCap className="h-4 w-4 text-sky-400" />
                                    <span>
                                        {matrixProgramFilter === 'All Programs'
                                            ? availablePrograms[0] || 'College Faculty Loading'
                                            : matrixProgramFilter}
                                    </span>
                                </div>

                                {/* Accordion Faculty List */}
                                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredFacultyLoading.map((fac) => {
                                        const isExpanded = expandedFacultyIds[fac.id] ?? false;

                                        return (
                                            <div key={fac.id} className="p-4 space-y-3">
                                                {/* Faculty Row Banner */}
                                                <div
                                                    onClick={() => toggleFacultyExpand(fac.id)}
                                                    className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-bold overflow-hidden">
                                                            <Users className="h-4 w-4 text-slate-500" />
                                                        </div>

                                                        <div>
                                                            <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                                                {fac.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 font-medium">
                                                                {fac.rank} · {fac.employment_type}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {/* Normal Load or Below Target badge */}
                                                        <span
                                                            className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${
                                                                fac.load_status === 'Normal Load'
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                            }`}
                                                        >
                                                            {fac.load_status}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                                                        >
                                                            <ChevronDown
                                                                className={`h-4 w-4 transition-transform duration-200 ${
                                                                    isExpanded ? 'rotate-180' : 'rotate-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded Assignments Table */}
                                                {isExpanded && (
                                                    <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden mt-2">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead className="bg-[#143254] text-white font-semibold text-[11px]">
                                                                <tr>
                                                                    <th className="px-4 py-2 border-r border-slate-400/40 font-bold">Assignment</th>
                                                                    <th className="px-4 py-2 border-r border-slate-400/40 font-bold">Course / Role</th>
                                                                    <th className="px-4 py-2 border-r border-slate-400/40 font-bold text-center">Section</th>
                                                                    <th className="px-4 py-2 text-right font-bold">Load Units</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                                {fac.assignments.map((asg, aIdx) => (
                                                                    <tr
                                                                        key={aIdx}
                                                                        className="bg-white hover:bg-slate-50/70 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                                                                    >
                                                                        <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                                                                            {asg.is_designation ? (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                                                    {asg.type}
                                                                                </span>
                                                                            ) : (
                                                                                asg.type
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-slate-900 dark:text-white font-semibold border-r border-slate-200 dark:border-slate-800">
                                                                            {asg.course_code} · {asg.course_title}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-slate-800">
                                                                            {asg.section}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                                                                            {asg.units.toFixed(1)}
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                                {/* Effective Load Strip */}
                                                                <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-bold text-xs text-slate-900 dark:text-white">
                                                                    <td colSpan={3} className="px-4 py-2.5">
                                                                        <span>Effective Load · </span>
                                                                        <span className="text-slate-500 font-normal">{fac.target_range}</span>
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-black text-sm">
                                                                        {fac.effective_load.toFixed(1)}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* MODAL OVERLAY: GENERATING FACULTY LOADING PROGRESS MODAL (Reference Pic)   */}
                {/* ========================================================================= */}
                {isProgressModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
                        <div className="w-full max-w-lg rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#5227C7]">
                                        <Cpu className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Generating Faculty Loading
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsProgressModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Centered Spinner & Subtitle */}
                            <div className="text-center space-y-2 py-1">
                                <div className="inline-flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                    Loading Generation Preview
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">
                                    The production system would stream its real solver-job progress here.
                                </p>
                            </div>

                            {/* Phase Step List */}
                            <div className="space-y-3">
                                {/* Step 1 */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-medium">
                                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>Validate master data and faculty eligibility</span>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Completed
                                    </span>
                                </div>

                                {/* Step 2 */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-medium">
                                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold">
                                        {progressPhase >= 2 ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        ) : (
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                                        )}
                                        <span>Apply locked assignments and credit policies</span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            progressPhase >= 2
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {progressPhase >= 2 ? 'Completed' : 'Pending'}
                                    </span>
                                </div>

                                {/* Step 3 */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-medium">
                                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold">
                                        {progressPhase >= 3 ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        ) : progressPhase === 2 ? (
                                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                                        ) : (
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                                        )}
                                        <span>Optimize and evaluate candidate assignments</span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            progressPhase >= 3
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : progressPhase === 2
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {progressPhase >= 3 ? 'Completed' : progressPhase === 2 ? 'In Progress' : 'Pending'}
                                    </span>
                                </div>

                                {/* Step 4 */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-medium">
                                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold">
                                        {progressPhase >= 4 ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        ) : (
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                                        )}
                                        <span>Prepare ranked candidates</span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            progressPhase >= 4
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {progressPhase >= 4 ? 'Completed' : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar & Percentage */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                    <span>Progress</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Footer Notice */}
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 italic">
                                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>Preview only. Background solver jobs preserve system responsiveness.</span>
                            </div>
                        </div>
                    </div>
                )}
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
