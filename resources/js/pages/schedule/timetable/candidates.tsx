import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import {
    FileSpreadsheet,
    Lock,
    CheckCircle2,
    Star,
    Clock,
    Building2,
    Layers,
    Check,
    RotateCcw,
    Eye,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    Download,
    Printer,
    SlidersHorizontal,
    Search,
    AlertTriangle,
    X,
    Calendar as CalendarIcon,
    Table,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Timetable Generation', href: '/schedule/timetable/generator' },
    { title: 'Candidate Schedules', href: '/schedule/timetable/candidates' },
];

export interface CandidateScheduleOffering {
    id: number;
    program_code: string;
    program_name: string;
    year_level: number;
    course_code: string;
    course_title: string;
    section: string;
    assigned_faculty: string;
    faculty_rank?: string;
    is_fixed: boolean;
    lec_units: number;
    lab_units: number;
    total_units: number;
    units_display: string;
    day: string;
    time: string;
    room: string;
    schedule_status: 'Scheduled' | 'Pending Room' | 'Conflict';
    remarks: string;
}

interface CandidateSchedulesProps {
    currentPeriod: any;
    loadingGate: any;
    college?: any;
    candidateOfferings?: CandidateScheduleOffering[];
}

export default function CandidateSchedulesPage({
    currentPeriod,
    loadingGate,
    college,
    candidateOfferings = [],
}: CandidateSchedulesProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<'A' | 'B' | 'C'>('A');
    const [inspectingCandidate, setInspectingCandidate] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<'matrix' | 'timetable'>('matrix');

    // Matrix filters
    const [programFilter, setProgramFilter] = useState<string>('All');
    const [yearLevelFilter, setYearLevelFilter] = useState<string>('All');
    const [sectionFilter, setSectionFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const candidates = [
        {
            code: 'Candidate A',
            name: 'Balanced (Recommended)',
            hard_conflicts: 0,
            preference_satisfaction: 93.8,
            room_utilization: 86.4,
            avg_faculty_gap: '0.8 hrs',
            avg_section_gap: '1.1 hrs',
            max_consecutive: '4 hrs',
            early_late_classes: '6 / 3',
            recommended: true,
        },
        {
            code: 'Candidate B',
            name: 'Faculty Preference Focused',
            hard_conflicts: 0,
            preference_satisfaction: 96.5,
            room_utilization: 84.1,
            avg_faculty_gap: '0.6 hrs',
            avg_section_gap: '1.3 hrs',
            max_consecutive: '5 hrs',
            early_late_classes: '5 / 4',
        },
        {
            code: 'Candidate C',
            name: 'Student Gap Optimized',
            hard_conflicts: 0,
            preference_satisfaction: 91.2,
            room_utilization: 87.6,
            avg_faculty_gap: '1.0 hrs',
            avg_section_gap: '0.8 hrs',
            max_consecutive: '4 hrs',
            early_late_classes: '7 / 2',
        },
    ];

    const handleSetWorkingDraft = () => {
        router.post(route('schedule.timetable.candidates.set-working-draft'), {
            candidate_code: `Candidate ${selectedCandidate}`,
        });
    };

    // Filter offerings
    const filteredOfferings = useMemo(() => {
        return candidateOfferings.filter((item) => {
            if (programFilter !== 'All' && item.program_code !== programFilter) return false;
            if (yearLevelFilter !== 'All' && String(item.year_level) !== yearLevelFilter) return false;
            if (sectionFilter !== 'All' && item.section !== sectionFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    item.course_code.toLowerCase().includes(q) ||
                    item.course_title.toLowerCase().includes(q) ||
                    item.assigned_faculty.toLowerCase().includes(q) ||
                    item.room.toLowerCase().includes(q) ||
                    item.remarks.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [candidateOfferings, programFilter, yearLevelFilter, sectionFilter, searchQuery]);

    // Group filtered offerings by program
    const groupedOfferings = useMemo(() => {
        const groups: Record<string, CandidateScheduleOffering[]> = {};
        filteredOfferings.forEach((item) => {
            const key = `${item.program_code} — ${item.program_name}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });
        return groups;
    }, [filteredOfferings]);

    // Timetable Grid Days & Time Slots
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
        '7:30 AM - 9:00 AM',
        '9:00 AM - 10:30 AM',
        '10:30 AM - 12:00 PM',
        '1:00 PM - 2:30 PM',
        '2:30 PM - 4:00 PM',
        '4:00 PM - 5:30 PM',
        '5:30 PM - 7:00 PM',
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Candidate ${selectedCandidate} - Course Scheduling Matrix`} />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod} academicPeriods={[]}>
                <div className="space-y-6 p-4 sm:p-6 font-['Poppins']">
                    {/* Permanent Faculty Loading Status Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-rose-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5 text-rose-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">Faculty Loading</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        Locked v3
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300">Approved by Dean • Finalized for Timetable Generation</p>
                            </div>
                        </div>

                        <a
                            href="/schedule/loading-review"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 shrink-0"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Loading Reference</span>
                        </a>
                    </div>

                    {/* Candidate Switcher Top Selector (Candidate A, B, C) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {candidates.map((cand, idx) => {
                            const letter = idx === 0 ? 'A' : idx === 1 ? 'B' : 'C';
                            const isSelected = selectedCandidate === letter;
                            return (
                                <div
                                    key={letter}
                                    onClick={() => {
                                        setSelectedCandidate(letter as any);
                                        setInspectingCandidate(true);
                                    }}
                                    className={`rounded-2xl border p-4 cursor-pointer transition-all space-y-2.5 ${
                                        isSelected
                                            ? 'bg-gradient-to-br from-slate-900 to-rose-950 text-white border-transparent shadow-lg ring-2 ring-rose-400/50'
                                            : 'bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-900 shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                                                <span>{cand.code}</span>
                                                {cand.recommended && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                        isSelected ? 'bg-rose-500/20 text-rose-200 border border-rose-400/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        ★ Recommended
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{cand.name}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                            <div className="text-[9px] text-slate-400">Hard Conflicts</div>
                                            <div className="font-bold text-emerald-400 mt-0.5">{cand.hard_conflicts}</div>
                                        </div>
                                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                            <div className="text-[9px] text-slate-400">Satisfaction</div>
                                            <div className={`font-bold mt-0.5 ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>{cand.preference_satisfaction}%</div>
                                        </div>
                                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                            <div className="text-[9px] text-slate-400">Room Util.</div>
                                            <div className="font-bold mt-0.5">{cand.room_utilization}%</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Container: Course Scheduling Matrix (Exact Match to Reference Screenshot) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Header Bar */}
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                                        <span>Semester Scheduling</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>Scheduling Generator</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Finalized Loading</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            Scheduling Generator
                                        </span>
                                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            Course Scheduling Matrix
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

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* View Mode Switcher: Matrix View vs Timetable View */}
                                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('matrix')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                                viewMode === 'matrix'
                                                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                        >
                                            <Table className="h-3.5 w-3.5" />
                                            <span>Matrix View</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('timetable')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                                viewMode === 'timetable'
                                                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                        >
                                            <CalendarIcon className="h-3.5 w-3.5" />
                                            <span>Timetable View</span>
                                        </button>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = '/schedule/timetable/candidates'}
                                        className="h-8 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Back to Candidates
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => alert('Schedule validated: 76 clean, 4 pending rooms, 2 conflicts.')}
                                        className="h-8 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Validate Schedule
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="h-8 gap-1.5 border-slate-200 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Export
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={handleSetWorkingDraft}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#8B1E3F] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[#721833]"
                                    >
                                        <Lock className="h-3.5 w-3.5" />
                                        Finalize & Lock
                                    </button>
                                </div>
                            </div>

                            {/* Metrics Cards Strip (Exact 6 cards from screenshot) */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-900/30">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-slate-900 dark:text-white">82</div>
                                        <div className="text-[11px] text-slate-500">Course Offerings</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100/70 text-purple-600 dark:bg-purple-900/30">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-slate-900 dark:text-white">82</div>
                                        <div className="text-[11px] text-slate-500">Scheduled</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-600 dark:bg-emerald-950/40">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">76</div>
                                        <div className="text-[11px] text-slate-500">No Conflict</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100/70 text-amber-600 dark:bg-amber-950/40">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-amber-600 dark:text-amber-400">4</div>
                                        <div className="text-[11px] text-slate-500">Pending Room</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100/70 text-rose-600 dark:bg-rose-950/40">
                                        <X className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-rose-600 dark:text-rose-400">2</div>
                                        <div className="text-[11px] text-slate-500">Conflict</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100/70 text-cyan-600 dark:bg-cyan-950/40">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-slate-900 dark:text-white">100%</div>
                                        <div className="text-[11px] text-slate-500">Coverage</div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters Bar */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>Program:</span>
                                        <select
                                            value={programFilter}
                                            onChange={(e) => setProgramFilter(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            <option value="All">All Programs</option>
                                            <option value="BSIT">BSIT</option>
                                            <option value="BSIS">BSIS</option>
                                            <option value="BSCS">BSCS</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>Year Level:</span>
                                        <select
                                            value={yearLevelFilter}
                                            onChange={(e) => setYearLevelFilter(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            <option value="All">All</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>Section:</span>
                                        <select
                                            value={sectionFilter}
                                            onChange={(e) => setSectionFilter(e.target.value)}
                                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            <option value="All">All</option>
                                            <option value="A">Section A</option>
                                            <option value="B">Section B</option>
                                            <option value="C">Section C</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="relative min-w-[280px]">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search course, faculty, or room..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* View 1: Course Scheduling Matrix View (Exact table matching screenshot) */}
                        {viewMode === 'matrix' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                        <tr>
                                            <th className="w-10 px-3 py-2.5 text-center font-bold">#</th>
                                            <th className="px-2.5 py-2.5 text-center font-bold">Program</th>
                                            <th className="px-2.5 py-2.5 text-center font-bold">Year Level</th>
                                            <th className="px-3 py-2.5 font-bold">Course Code</th>
                                            <th className="px-4 py-2.5 font-bold">Course Title</th>
                                            <th className="px-2.5 py-2.5 text-center font-bold">Section</th>
                                            <th className="px-4 py-2.5 font-bold">Assigned Faculty</th>
                                            <th className="px-3 py-2.5 text-center font-bold">Units (Lec/Lab)</th>
                                            <th className="px-2.5 py-2.5 text-center font-bold">Day</th>
                                            <th className="px-3 py-2.5 font-bold">Time</th>
                                            <th className="px-3 py-2.5 font-bold">Room</th>
                                            <th className="px-3 py-2.5 text-center font-bold">Schedule Status</th>
                                            <th className="px-4 py-2.5 font-bold">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {Object.entries(groupedOfferings).map(([progTitle, items]) => {
                                            return (
                                                <React.Fragment key={progTitle}>
                                                    {/* Program Group Header */}
                                                    <tr className="bg-cyan-50/70 font-semibold text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-200">
                                                        <td colSpan={13} className="px-3 py-2 text-xs">
                                                            <div className="flex items-center gap-1.5 font-bold">
                                                                <span className="text-[10px]">▼</span>
                                                                <span>{progTitle}</span>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Offering Rows */}
                                                    {items.map((row) => {
                                                        const isConflict = row.schedule_status === 'Conflict';
                                                        const isPending = row.schedule_status === 'Pending Room';

                                                        return (
                                                            <tr
                                                                key={row.id}
                                                                className={`transition-colors ${
                                                                    isConflict
                                                                        ? 'bg-rose-50/70 hover:bg-rose-100/60 dark:bg-rose-950/30'
                                                                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                                                                }`}
                                                            >
                                                                <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{row.id}</td>
                                                                <td className="px-2.5 py-2.5 text-center">
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                        {row.program_code}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2.5 py-2.5 text-center text-slate-600">{row.year_level}</td>
                                                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">{row.course_code}</td>
                                                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{row.course_title}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{row.section}</td>
                                                                <td className="px-4 py-2.5">
                                                                    <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                                                                        {row.is_fixed && (
                                                                            <span title="Fixed assignment">
                                                                                🔒
                                                                            </span>
                                                                        )}
                                                                        <span>{row.assigned_faculty}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2.5 text-center font-medium text-slate-700 dark:text-slate-300">{row.units_display}</td>
                                                                <td className="px-2.5 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200">{row.day}</td>
                                                                <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.time}</td>
                                                                <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{row.room}</td>
                                                                <td className="px-3 py-2.5 text-center">
                                                                    {row.schedule_status === 'Scheduled' ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                            Scheduled
                                                                        </span>
                                                                    ) : row.schedule_status === 'Pending Room' ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                                                                            <AlertTriangle className="h-3 w-3" />
                                                                            Pending Room
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                                                                            <X className="h-3 w-3" />
                                                                            Conflict
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                                                                    {row.remarks}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* College Total Row (Exact purple match) */}
                                        <tr className="bg-purple-100/70 font-bold text-slate-900 dark:bg-purple-950/50 dark:text-white text-xs">
                                            <td colSpan={4} className="px-3 py-2.5 font-bold">
                                                CIDS College Total
                                            </td>
                                            <td colSpan={3} className="px-3 py-2.5 text-center">—</td>
                                            <td className="px-3 py-2.5 text-center font-bold">432</td>
                                            <td className="px-2.5 py-2.5 text-center">—</td>
                                            <td className="px-3 py-2.5 text-center">—</td>
                                            <td className="px-3 py-2.5 text-center">—</td>
                                            <td colSpan={2} className="px-4 py-2.5 text-center font-bold">
                                                82 / 82 Scheduled
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* View 2: Weekly Timetable Grid View */}
                        {viewMode === 'timetable' && (
                            <div className="p-4 overflow-x-auto">
                                <div className="min-w-[800px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                    <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                                        <div className="p-3 text-center border-r border-slate-200 dark:border-slate-700">Time</div>
                                        {days.map((d) => (
                                            <div key={d} className="p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-700">
                                                {d}
                                            </div>
                                        ))}
                                    </div>

                                    {timeSlots.map((slot, sIdx) => (
                                        <div key={slot} className="grid grid-cols-7 border-b last:border-b-0 border-slate-200 dark:border-slate-800 min-h-[90px] text-xs">
                                            <div className="p-2.5 bg-slate-50/70 dark:bg-slate-900/50 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-center text-[11px]">
                                                {slot}
                                            </div>

                                            {days.map((day) => {
                                                // Find offerings matching this day/slot
                                                const dayMatches = filteredOfferings.filter((o) => {
                                                    const isMonWed = (day === 'Monday' || day === 'Wednesday') && o.day.includes('MW');
                                                    const isTueThu = (day === 'Tuesday' || day === 'Thursday') && (o.day.includes('TTH') || o.day.includes('Tu') || o.day.includes('Th'));
                                                    const isFriSat = (day === 'Friday' || day === 'Saturday') && (o.day.includes('FS') || o.day.includes('Fr'));
                                                    const dayApplies = isMonWed || isTueThu || isFriSat;

                                                    const slotStartHour = parseInt(slot.split(':')[0], 10);
                                                    const isPmSlot = slot.includes('PM') && slotStartHour !== 12;
                                                    const slotHourNorm = isPmSlot ? slotStartHour + 12 : slotStartHour;

                                                    const itemStartHour = parseInt(rowStartHour(o.time), 10);
                                                    return dayApplies && Math.abs(slotHourNorm - itemStartHour) <= 1;
                                                });

                                                return (
                                                    <div key={day} className="p-1.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800 space-y-1.5 bg-white dark:bg-slate-900">
                                                        {dayMatches.map((m) => (
                                                            <div
                                                                key={m.id}
                                                                className={`p-2 rounded-lg border text-[10px] leading-tight shadow-2xs ${
                                                                    m.schedule_status === 'Conflict'
                                                                        ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                                                                        : m.schedule_status === 'Pending Room'
                                                                          ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                                                                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
                                                                }`}
                                                            >
                                                                <div className="font-bold flex items-center justify-between">
                                                                    <span>{m.course_code} ({m.section})</span>
                                                                    <span className="font-mono text-[9px] px-1 rounded bg-white/70 dark:bg-black/30">{m.room}</span>
                                                                </div>
                                                                <div className="truncate text-slate-700 dark:text-slate-300 font-medium">{m.course_title}</div>
                                                                <div className="truncate text-slate-500 mt-0.5">{m.assigned_faculty}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom Legend (Exact match to reference screenshot) */}
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
                                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                        <CheckCircle2 className="h-2.5 w-2.5" /> Scheduled
                                    </span>
                                    <span className="text-slate-500">— Room and time assigned</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
                                        <AlertTriangle className="h-2.5 w-2.5" /> Pending Room
                                    </span>
                                    <span className="text-slate-500">— Needs room assignment</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200">
                                        <X className="h-2.5 w-2.5" /> Conflict
                                    </span>
                                    <span className="text-slate-500">— Scheduling conflict (must resolve)</span>
                                </span>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="bg-[#8B1E3F] text-xs text-white hover:bg-[#721833]"
                            >
                                Back to Top
                            </Button>
                        </div>
                    </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}

// Helper to parse time string
function rowStartHour(timeStr: string): string {
    if (!timeStr) return '8';
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '8';
    let hour = parseInt(match[1], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return String(hour);
}
