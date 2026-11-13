import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Cpu,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
    focus: string;
    satisfaction: number;
    conflict_count: number;
    avg_gap_hours: number;
    prep_distribution: string;
    assigned_count: number;
    total_offerings: number;
    faculty_summary: Array<{
        faculty_id: number;
        faculty_name: string;
        target_load: number;
        assigned_load: number;
        preparations: number;
        course_match_score: number;
        status: string;
    }>;
    assignments: Array<{
        offering_id: number;
        course_code: string;
        course_title: string;
        section: string;
        units: number;
        hours: number;
        is_lab: boolean;
        faculty_id: number;
        faculty_name: string;
        match_score: number;
    }>;
}

interface GenerationHistoryItem {
    version: string;
    generated_on: string;
    focus: string;
    candidates: number;
    result: 'Ready' | 'Superseded';
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
    initialCandidates: CandidateScenario[];
}

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
    const [candidates, setCandidates] = useState<CandidateScenario[]>(initialCandidates);
    const [selectedCandidateCode, setSelectedCandidateCode] = useState<string>(
        initialCandidates[0]?.code || 'Candidate A'
    );

    // Selected Faculty for Side Detail Drawer
    const [inspectedFacultyId, setInspectedFacultyId] = useState<number | null>(
        facultyPool[0]?.id || 1
    );
    const [drawerTab, setDrawerTab] = useState<'assignment' | 'score' | 'background'>('assignment');
    const [showCandidatesSection, setShowCandidatesSection] = useState<boolean>(
        initialCandidates.length > 0
    );

    // Generation Settings (Quadrant match)
    const [optimizationFocus, setOptimizationFocus] = useState('Balanced (Recommended)');
    const [candidateCount, setCandidateCount] = useState(3);
    const [useSpecMatch, setUseSpecMatch] = useState(true);
    const [useFacultyPref, setUseFacultyPref] = useState(true);
    const [considerCredits, setConsiderCredits] = useState(true);
    const [balancePreps, setBalancePreps] = useState(false);
    const [respectAvailability, setRespectAvailability] = useState(false);
    const [useHistoricalData, setUseHistoricalData] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter controls for candidate table
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    // Manual Course Loading Modal State (for Program Heads & Dean)
    const [isManualAssignModalOpen, setIsManualAssignModalOpen] = useState(false);
    const [selectedOfferingForAssign, setSelectedOfferingForAssign] = useState<number | null>(null);
    const [selectedFacultyForAssign, setSelectedFacultyForAssign] = useState<number | null>(null);
    const [isSubmittingManualAssign, setIsSubmittingManualAssign] = useState(false);

    // Recent Generation History (Quadrant match)
    const [generationHistory] = useState<GenerationHistoryItem[]>([
        {
            version: 'v3',
            generated_on: 'Nov 10, 2026 - 09:14 AM',
            focus: 'Balanced',
            candidates: 3,
            result: 'Ready',
        },
        {
            version: 'v2',
            generated_on: 'Nov 08, 2026 - 03:27 PM',
            focus: 'Preference-Focused',
            candidates: 3,
            result: 'Superseded',
        },
        {
            version: 'v1',
            generated_on: 'Nov 06, 2026 - 11:02 AM',
            focus: 'Balanced',
            candidates: 3,
            result: 'Superseded',
        },
    ]);

    const activeCandidate = useMemo(() => {
        return candidates.find((c) => c.code === selectedCandidateCode) || candidates[0];
    }, [candidates, selectedCandidateCode]);

    const inspectedFaculty = useMemo(() => {
        return facultyPool.find((f) => f.id === inspectedFacultyId) || facultyPool[0];
    }, [facultyPool, inspectedFacultyId]);

    const inspectedAssignments = useMemo(() => {
        if (!activeCandidate || !inspectedFaculty) return [];
        return activeCandidate.assignments.filter((a) => a.faculty_id === inspectedFaculty.id);
    }, [activeCandidate, inspectedFaculty]);

    const filteredFacultySummaries = useMemo(() => {
        if (!activeCandidate) return [];
        return activeCandidate.faculty_summary.filter((fs) => {
            const fac = facultyPool.find((f) => f.id === fs.faculty_id);
            const nameMatches = fs.faculty_name.toLowerCase().includes(searchQuery.toLowerCase());
            const progMatches = selectedProgram === 'All' || fac?.program_code === selectedProgram;
            const statusMatches = selectedStatus === 'All' || fs.status.toLowerCase() === selectedStatus.toLowerCase();
            return nameMatches && progMatches && statusMatches;
        });
    }, [activeCandidate, facultyPool, searchQuery, selectedProgram, selectedStatus]);

    const handleGenerate = () => {
        setIsGenerating(true);

        router.post(
            '/schedule/loading-generator',
            {
                run_solver: true,
                candidate_count: candidateCount,
                solver_weights: {
                    historical: useHistoricalData ? 30 : 15,
                    specialization: useSpecMatch ? 40 : 20,
                    preferred: useFacultyPref ? 30 : 15,
                    department: 15,
                    availability: respectAvailability ? 15 : 5,
                },
                options: {
                    candidate_count: candidateCount,
                    balance_load: true,
                    consider_credits: considerCredits,
                    respect_availability: respectAvailability,
                    balance_preparations: balancePreps,
                },
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    const freshCandidates = (page.props as any).initialCandidates;
                    if (freshCandidates && freshCandidates.length > 0) {
                        setCandidates(freshCandidates);
                        setSelectedCandidateCode(freshCandidates[0]?.code || 'Candidate A');
                        setShowCandidatesSection(true);
                    }
                },
                onError: (errors) => {
                    console.error('Failed to generate loading candidates:', errors);
                },
                onFinish: () => {
                    setIsGenerating(false);
                },
            }
        );
    };

    const handleOpenManualAssign = (offeringId?: number, facultyId?: number) => {
        setSelectedOfferingForAssign(offeringId || offerings[0]?.id || null);
        setSelectedFacultyForAssign(facultyId || inspectedFaculty?.id || facultyPool[0]?.id || null);
        setIsManualAssignModalOpen(true);
    };

    const handleConfirmManualAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOfferingForAssign || !selectedFacultyForAssign) return;

        setIsSubmittingManualAssign(true);
        router.post(
            '/schedule/loading-generator/manual-assign',
            {
                offering_id: selectedOfferingForAssign,
                faculty_id: selectedFacultyForAssign,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsManualAssignModalOpen(false);

                    // Realtime optimistic update into active candidate assignment state
                    const targetOffering = offerings.find((o) => o.id === selectedOfferingForAssign);
                    const targetFaculty = facultyPool.find((f) => f.id === selectedFacultyForAssign);

                    if (targetOffering && targetFaculty) {
                        setCandidates((prev) =>
                            prev.map((cand) => {
                                const updatedAssignments = cand.assignments.filter(
                                    (a) => a.offering_id !== selectedOfferingForAssign
                                );
                                updatedAssignments.push({
                                    offering_id: targetOffering.id,
                                    course_code: targetOffering.course_code,
                                    course_title: targetOffering.course_title,
                                    section: targetOffering.section,
                                    faculty_id: targetFaculty.id,
                                    faculty_name: targetFaculty.name,
                                    hours: targetOffering.hours_per_week || 3.0,
                                    is_lab: targetOffering.is_lab,
                                    match_score: 95,
                                });

                                return {
                                    ...cand,
                                    assignments: updatedAssignments,
                                };
                            })
                        );
                    }
                },
                onError: (err) => {
                    console.error('Failed to manually assign course offering:', err);
                },
                onFinish: () => {
                    setIsSubmittingManualAssign(false);
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loading Generator - Semester Scheduling" />
            <SchedulingWorkspaceLayout
                currentPeriod={currentPeriod}
                academicPeriods={academicPeriods}
                title="Loading Generator"
                subtitle="Generate faculty-course assignments using policies, credits, specializations, and preferences."
            >
                <div className="space-y-6">
                    {/* Header Banner Card (Quadrant Match) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#60122B] text-white shadow-md shadow-[#8B1E3F]/20">
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Loading Generator
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Generate faculty-course assignments using policies, credits, specializations, and preferences.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => alert('Viewing generation run history & solver logs...')}
                                    className="gap-2 border-slate-200 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                >
                                    <History className="h-3.5 w-3.5" />
                                    Generation History
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Main Settings & Input Summary Grid */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Input Summary (Left 4 cols) */}
                        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
                            <div>
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <SlidersHorizontal className="h-4 w-4 text-[#8B1E3F]" />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Input Summary
                                    </h3>
                                </div>

                                <div className="mt-4 space-y-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#8B1E3F] dark:bg-[#8B1E3F]/20 dark:text-rose-400">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                                {readiness.eligible_faculty_count > 0 ? readiness.eligible_faculty_count : 124}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Faculty</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                            <Layers className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                                {readiness.total_offerings > 0 ? readiness.total_offerings : 326}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Course Offerings</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                                26
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Sections</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                            <Scale className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                                96
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Faculty with Credits</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generation Settings (Right 8 cols) */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <Sparkles className="h-4 w-4 text-[#8B1E3F]" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Generation Settings
                                </h3>
                            </div>

                            <div className="mt-4 space-y-4">
                                {/* Top Dropdowns Row */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Optimization Focus
                                        </Label>
                                        <select
                                            value={optimizationFocus}
                                            onChange={(e) => setOptimizationFocus(e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="Balanced (Recommended)">Balanced (Recommended)</option>
                                            <option value="Preference-Focused">Preference-Focused</option>
                                            <option value="Historical Continuity">Historical Continuity</option>
                                            <option value="Minimum Preparations">Minimum Preparations</option>
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Number of Candidates
                                        </Label>
                                        <select
                                            value={candidateCount}
                                            onChange={(e) => setCandidateCount(Number(e.target.value))}
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={5}>5</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Checkbox Options (Row 1 & Row 2) */}
                                <div className="space-y-2.5 pt-2">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useSpecMatch}
                                                onChange={(e) => setUseSpecMatch(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                            />
                                            <span>Use Specialization Match</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useFacultyPref}
                                                onChange={(e) => setUseFacultyPref(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                            />
                                            <span>Use Faculty Preferences</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={considerCredits}
                                                onChange={(e) => setConsiderCredits(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                            />
                                            <span>Consider Faculty Credits</span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={balancePreps}
                                                onChange={(e) => setBalancePreps(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                            />
                                            <span>Balance Number of Preparations</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={respectAvailability}
                                                onChange={(e) => setRespectAvailability(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                            />
                                            <span>Respect Faculty Availability</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useHistoricalData}
                                                onChange={(e) => setUseHistoricalData(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                                            />
                                            <span>Use Historical Teaching Data</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Advanced Options Collapsible */}
                                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    >
                                        <ChevronRight
                                            className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                                        />
                                        Advanced Options
                                    </button>

                                    {showAdvanced && (
                                        <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800 sm:grid-cols-2">
                                            <div>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    CP-SAT Solver Time Limit:
                                                </span>
                                                <span className="ml-2 text-slate-500">30 seconds</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    Hard Constraints:
                                                </span>
                                                <span className="ml-2 text-slate-500">Max Load & No Conflicts</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Big CTA Button */}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full gap-2 bg-[#8B1E3F] py-2.5 text-xs font-bold text-white shadow-md shadow-[#8B1E3F]/20 hover:bg-[#721833]"
                                >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    {isGenerating ? 'Running CP-SAT Solver...' : 'Generate Faculty Loading'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Generation Table Card (Bottom of Quadrant) */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-[#8B1E3F]" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Recent Generation
                                </h3>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Version</th>
                                        <th className="px-5 py-3 font-semibold">Generated On</th>
                                        <th className="px-5 py-3 font-semibold">Focus</th>
                                        <th className="px-5 py-3 font-semibold">Candidates</th>
                                        <th className="px-5 py-3 font-semibold">Result</th>
                                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {generationHistory.map((item) => (
                                        <tr
                                            key={item.version}
                                            className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                                        >
                                            <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                                {item.version}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                                                {item.generated_on}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                                                {item.focus}
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                                                {item.candidates}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {item.result === 'Ready' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Ready
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        Superseded
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowCandidatesSection(true)}
                                                    className="h-7 border-slate-200 text-xs text-slate-700 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300"
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Candidate Loading Results Inspection (Expandable upon View or Generate) */}
                    {showCandidatesSection && activeCandidate && (
                        <div className="space-y-6 pt-2">
                            {/* Candidate Cards */}
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Candidate Loading Results
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Generated faculty load scenarios based on the configured rules and weights.
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Compare Candidates: <span className="font-semibold">{selectedCandidateCode}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {candidates.map((cand) => {
                                        const isSelected = selectedCandidateCode === cand.code;
                                        return (
                                            <div
                                                key={cand.code}
                                                onClick={() => setSelectedCandidateCode(cand.code)}
                                                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                                    isSelected
                                                        ? 'border-[#8B1E3F] bg-rose-50/20 shadow-sm ring-1 ring-[#8B1E3F] dark:bg-[#8B1E3F]/10'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {cand.code}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{cand.name}</div>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B1E3F] text-white">
                                                            <Check className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
                                                    <div>
                                                        <div className="text-sm font-bold text-emerald-600">
                                                            {cand.conflict_count}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">Conflicts</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {cand.satisfaction}%
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">Satisfaction</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {cand.avg_gap_hours}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">Avg. Gap</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Candidate Faculty Table & Details Drawer */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                placeholder="Search faculty..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8 text-xs"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenManualAssign()}
                                                className="h-8 gap-1.5 border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-[#8B1E3F] hover:text-[#8B1E3F] dark:border-slate-700 dark:text-slate-300"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Manual Add Load
                                            </Button>

                                            <select
                                                value={selectedProgram}
                                                onChange={(e) => setSelectedProgram(e.target.value)}
                                                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                <option value="All">All Programs</option>
                                                <option value="BSIT">BSIT</option>
                                                <option value="BSIS">BSIS</option>
                                                <option value="BSCS">BSCS</option>
                                                <option value="BSDS">BSDS</option>
                                                <option value="DIT">DIT</option>
                                            </select>

                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                <option value="All">All Load Status</option>
                                                <option value="Balanced">Balanced</option>
                                                <option value="Overloaded">Overloaded</option>
                                                <option value="Underloaded">Underloaded</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                                <tr>
                                                    <th className="px-3 py-2.5 font-semibold">Faculty</th>
                                                    <th className="px-3 py-2.5 font-semibold">Designation</th>
                                                    <th className="px-3 py-2.5 font-semibold">Assigned</th>
                                                    <th className="px-3 py-2.5 font-semibold">Target</th>
                                                    <th className="px-3 py-2.5 font-semibold">Preps</th>
                                                    <th className="px-3 py-2.5 font-semibold">Course Match</th>
                                                    <th className="px-3 py-2.5 font-semibold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredFacultySummaries.slice(0, 8).map((fs) => {
                                                    const isInspected = inspectedFacultyId === fs.faculty_id;
                                                    const fac = facultyPool.find((f) => f.id === fs.faculty_id);
                                                    return (
                                                        <tr
                                                            key={fs.faculty_id}
                                                            onClick={() => setInspectedFacultyId(fs.faculty_id)}
                                                            className={`cursor-pointer transition-colors ${
                                                                isInspected
                                                                    ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                            }`}
                                                        >
                                                            <td className="px-3 py-2.5">
                                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                                    {fs.faculty_name}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500">
                                                                    {fac?.program_code} | {fac?.specialization || 'Computing'}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                                                <Badge variant="outline" className="text-[10px]">
                                                                    {fac?.designation || 'Faculty'}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                                                                {fs.assigned_load.toFixed(1)} hrs/wk
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-500">
                                                                {fs.target_load.toFixed(1)} hrs/wk
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                                                                {fs.preparations}
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                    {fs.course_match_score}%
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    {fs.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Right Side Faculty Detail Drawer */}
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-[#8B1E3F]" />
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Faculty Load Detail
                                            </h3>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenManualAssign(undefined, inspectedFaculty?.id)}
                                            className="h-7 gap-1 border-rose-200 bg-rose-50/50 px-2.5 text-[11px] font-semibold text-[#8B1E3F] hover:bg-rose-100 hover:text-[#721833] dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Course Load
                                        </Button>
                                    </div>

                                    {inspectedFaculty && (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {inspectedFaculty.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {inspectedFaculty.rank} | {inspectedFaculty.program_code}
                                                </div>
                                            </div>

                                            {/* Subtabs */}
                                            <div className="flex items-center gap-1 border-b border-slate-100 pb-2 text-xs font-semibold dark:border-slate-800">
                                                <button
                                                    onClick={() => setDrawerTab('assignment')}
                                                    className={`rounded-md px-2.5 py-1 ${
                                                        drawerTab === 'assignment'
                                                            ? 'bg-[#8B1E3F] text-white'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                                >
                                                    Load Assignment
                                                </button>
                                                <button
                                                    onClick={() => setDrawerTab('score')}
                                                    className={`rounded-md px-2.5 py-1 ${
                                                        drawerTab === 'score'
                                                            ? 'bg-[#8B1E3F] text-white'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                                >
                                                    Matching Score
                                                </button>
                                                <button
                                                    onClick={() => setDrawerTab('background')}
                                                    className={`rounded-md px-2.5 py-1 ${
                                                        drawerTab === 'background'
                                                            ? 'bg-[#8B1E3F] text-white'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                                >
                                                    Background
                                                </button>
                                            </div>

                                            {drawerTab === 'assignment' && (
                                                <div className="space-y-3">
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        Assigned Courses (Total: 12.0 hrs/wk)
                                                    </div>
                                                    <div className="space-y-2 text-xs">
                                                        {inspectedAssignments.length > 0 ? (
                                                            inspectedAssignments.map((a) => (
                                                                <div
                                                                    key={a.offering_id}
                                                                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                                            {a.course_code} - {a.course_title}
                                                                        </span>
                                                                        <Badge variant="outline" className="text-[10px]">
                                                                            {a.section}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                                                                        <span>{a.is_lab ? 'Lab' : 'Lecture'}</span>
                                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                            {a.hours} hrs/wk
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                                            ITEL 601 - Artificial Intelligence
                                                                        </span>
                                                                        <Badge variant="outline" className="text-[10px]">
                                                                            DIT 3B
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                                                                        <span>Lab</span>
                                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                            3.0 hrs/wk
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                                            CS 612 - Computer Programming II
                                                                        </span>
                                                                        <Badge variant="outline" className="text-[10px]">
                                                                            BSIT 2A
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                                                                        <span>Lab</span>
                                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                            3.0 hrs/wk
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                                            ISEL 601 - Data Visualization
                                                                        </span>
                                                                        <Badge variant="outline" className="text-[10px]">
                                                                            BSIS 3A
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                                                                        <span>Lab</span>
                                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                            3.0 hrs/wk
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="pt-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                Match Breakdown
                                                            </span>
                                                            <span className="font-bold text-[#8B1E3F]">98% Match</span>
                                                        </div>
                                                        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                            <div className="bg-blue-600" style={{ width: '50%' }} />
                                                            <div className="bg-cyan-500" style={{ width: '30%' }} />
                                                            <div className="bg-emerald-500" style={{ width: '20%' }} />
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-blue-600" /> Historical (50%)
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-cyan-500" /> Specialization (30%)
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Preferred (20%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {drawerTab === 'score' && (
                                                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                                    <p>
                                                        Candidate solver calculated high alignment for specialized laboratory subjects with positive student feedback history.
                                                    </p>
                                                </div>
                                            )}

                                            {drawerTab === 'background' && (
                                                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                                    <div>
                                                        <span className="font-medium text-slate-900 dark:text-white">Specialization:</span>{' '}
                                                        {inspectedFaculty.specialization}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-slate-900 dark:text-white">Designation:</span>{' '}
                                                        {inspectedFaculty.designation}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual Course Loading Assignment Modal for Program Head & Dean */}
                <Dialog open={isManualAssignModalOpen} onOpenChange={setIsManualAssignModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                <UserCheck className="h-5 w-5 text-[#8B1E3F]" />
                                Manual Faculty Loading Assignment
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                As Program Head or Dean, directly assign or adjust course loading for a faculty member.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleConfirmManualAssign} className="space-y-4 py-2">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Target Faculty Member
                                </Label>
                                <select
                                    value={selectedFacultyForAssign || ''}
                                    onChange={(e) => setSelectedFacultyForAssign(Number(e.target.value))}
                                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    required
                                >
                                    <option value="" disabled>Select faculty member...</option>
                                    {facultyPool.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} ({f.program_code}) — Target: {f.target_load}h | {f.specialization}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Course Offering to Assign
                                </Label>
                                <select
                                    value={selectedOfferingForAssign || ''}
                                    onChange={(e) => setSelectedOfferingForAssign(Number(e.target.value))}
                                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    required
                                >
                                    <option value="" disabled>Select course offering...</option>
                                    {offerings.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.course_code} - {o.course_title} ({o.section}) · {o.hours_per_week || 3.0} hrs/wk {o.is_lab ? '[Lab]' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-[11px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                                <strong>Note:</strong> Manual assignment overrides CP-SAT recommendations and records an audit trace for Program Head and Dean review.
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsManualAssignModalOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingManualAssign || !selectedOfferingForAssign || !selectedFacultyForAssign}
                                    className="gap-1.5 bg-[#8B1E3F] text-xs font-semibold text-white hover:bg-[#721833]"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    {isSubmittingManualAssign ? 'Saving...' : 'Confirm Assignment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
