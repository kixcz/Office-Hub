import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { 
    CalendarDays, 
    Lock, 
    Play, 
    CheckCircle2, 
    AlertTriangle, 
    Layers, 
    Users, 
    BookOpen, 
    Building2, 
    Clock, 
    Eye,
    ChevronRight
} from 'lucide-react';

interface ScheduleGeneratorProps {
    currentPeriod: any;
    loadingGate: {
        publication: {
            version: string;
            status: string;
            locked_at: string;
            is_locked: boolean;
            outstanding_requests_count: number;
        } | null;
        is_ready: boolean;
        readiness_checks: Array<{ label: string; status: boolean }>;
    };
    datasetStats: {
        sections_count: number;
        faculty_count: number;
        offerings_count: number;
        rooms_count: number;
        contact_hours: number;
    };
}

export default function TimetableScheduleGeneratorPage({ currentPeriod, loadingGate, datasetStats }: ScheduleGeneratorProps) {
    const [optimizationFocus, setOptimizationFocus] = useState('Balanced (Recommended)');
    const [candidateCount, setCandidateCount] = useState(3);
    const [usePreferences, setUsePreferences] = useState(true);
    const [respectRooms, setRespectRooms] = useState(true);
    const [prioritizeSpecialization, setPrioritizeSpecialization] = useState(true);

    const isLocked = loadingGate.is_ready;

    const handleRunGenerator = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('schedule.timetable.generator.run'));
    };

    return (
        <SchedulingWorkspaceLayout>
            <Head title="Schedule Generator - Timetable Generation" />

            <div className="space-y-6 pb-12">
                {/* Permanent Faculty Loading Status Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-rose-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <Lock className="w-5 h-5 text-rose-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">Faculty Loading</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isLocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                }`}>
                                    {loadingGate.publication?.status || 'Locked v3'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">
                                Approved by Dean • Version {loadingGate.publication?.version || 'v3'} ({datasetStats.offerings_count} assignments finalized)
                            </p>
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

                {/* Readiness Gating Banner if Not Ready */}
                {!isLocked && (
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span>TIMETABLE GENERATION LOCKED</span>
                        </div>
                        <p className="text-xs text-amber-800">
                            Faculty loading is currently in the Faculty Review Window or has unresolved course change requests. Timetable generation unlocks once loading is locked for scheduling.
                        </p>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Schedule Generator</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    CP-SAT Engine
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Generate optimized timetable candidates using Google OR-Tools CP-SAT based on your constraints, locked faculty loading, and institutional rules.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Steps Tracker */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs overflow-x-auto">
                    <div className="flex items-center gap-2 font-bold text-slate-500 shrink-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">1</span>
                        <span>Constraints (Configured)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className="flex items-center gap-2 font-bold text-rose-950 bg-rose-50 px-3 py-1.5 rounded-xl shrink-0">
                        <span className="w-6 h-6 rounded-full bg-rose-950 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Schedule Generator (Ready)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className="flex items-center gap-2 font-medium text-slate-400 shrink-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">3</span>
                        <span>Candidate Schedules</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className="flex items-center gap-2 font-medium text-slate-400 shrink-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">4</span>
                        <span>Conflict Checker</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className="flex items-center gap-2 font-medium text-slate-400 shrink-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">5</span>
                        <span>Timetable Editor</span>
                    </div>
                </div>

                {/* Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Input Dataset & Settings Box */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                        {/* Input Dataset Summary */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Input Dataset for Solver</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                    <div className="text-lg font-bold text-slate-900">{datasetStats.sections_count}</div>
                                    <div className="text-[10px] text-slate-500">Sections</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                    <div className="text-lg font-bold text-slate-900">{datasetStats.faculty_count}</div>
                                    <div className="text-[10px] text-slate-500">Faculty</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                    <div className="text-lg font-bold text-slate-900">{datasetStats.offerings_count}</div>
                                    <div className="text-[10px] text-slate-500">Course Offerings</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                    <div className="text-lg font-bold text-slate-900">{datasetStats.rooms_count}</div>
                                    <div className="text-[10px] text-slate-500">Rooms &amp; Labs</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                    <div className="text-lg font-bold text-rose-950">{datasetStats.contact_hours}</div>
                                    <div className="text-[10px] text-slate-500">Contact Hours</div>
                                </div>
                            </div>
                        </div>

                        {/* Generation Settings */}
                        <form onSubmit={handleRunGenerator} className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Generation Settings</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="font-semibold text-slate-700">Optimization Focus</label>
                                    <select
                                        value={optimizationFocus}
                                        onChange={(e) => setOptimizationFocus(e.target.value)}
                                        className="w-full mt-1.5 p-2 rounded-xl border border-slate-200 bg-white"
                                    >
                                        <option value="Balanced (Recommended)">Balanced (Recommended)</option>
                                        <option value="Faculty Preference Focused">Faculty Preference Focused</option>
                                        <option value="Student Gap / Room Utilization">Student Gap / Room Utilization</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-700">Number of Candidates</label>
                                    <select
                                        value={candidateCount}
                                        onChange={(e) => setCandidateCount(parseInt(e.target.value))}
                                        className="w-full mt-1.5 p-2 rounded-xl border border-slate-200 bg-white"
                                    >
                                        <option value={3}>3 Candidates (A, B, C)</option>
                                        <option value={2}>2 Candidates</option>
                                        <option value={1}>1 Candidate</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 text-xs">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={usePreferences}
                                        onChange={(e) => setUsePreferences(e.target.checked)}
                                        className="rounded border-slate-300 text-rose-950"
                                    />
                                    <span className="font-medium text-slate-700">Use Faculty Time Preferences (Soft Priority)</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={respectRooms}
                                        onChange={(e) => setRespectRooms(e.target.checked)}
                                        className="rounded border-slate-300 text-rose-950"
                                    />
                                    <span className="font-medium text-slate-700">Respect Room &amp; Laboratory Designations</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={prioritizeSpecialization}
                                        onChange={(e) => setPrioritizeSpecialization(e.target.checked)}
                                        className="rounded border-slate-300 text-rose-950"
                                    />
                                    <span className="font-medium text-slate-700">Prioritize Verified Specializations for Labs</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={!isLocked}
                                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                                    isLocked
                                        ? 'bg-gradient-to-r from-slate-900 to-rose-950 text-white hover:opacity-95'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Play className="w-4 h-4" />
                                <span>Generate Timetable Candidates</span>
                            </button>
                        </form>
                    </div>

                    {/* Right: Summary Information */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Generation Summary</h4>
                        <div className="space-y-2 text-xs text-slate-600">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span>Academic Period:</span>
                                <span className="font-bold text-slate-900">AY 2026 – 2027, 1st Sem</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span>Faculty Loading Source:</span>
                                <span className="font-bold text-emerald-700 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    <span>Locked {loadingGate.publication?.version || 'v3'}</span>
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span>Active Constraints:</span>
                                <span className="font-bold text-slate-900">10 Hard • 8 Soft</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                            <div className="font-bold text-slate-800">Before You Proceed</div>
                            <p className="text-[11px] text-slate-500">
                                The CP-SAT solver uses the locked faculty loading version as an immutable truth. Generated candidates can be evaluated and selected as the Working Draft.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SchedulingWorkspaceLayout>
    );
}

