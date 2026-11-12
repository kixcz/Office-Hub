import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
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
    ChevronRight
} from 'lucide-react';

interface CandidateSchedulesProps {
    currentPeriod: any;
    loadingGate: any;
}

export default function CandidateSchedulesPage({ currentPeriod, loadingGate }: CandidateSchedulesProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<'A' | 'B' | 'C'>('B');

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
            recommended: true,
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

    return (
        <SchedulingWorkspaceLayout>
            <Head title="Candidate Schedules - Timetable Generation" />

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

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Candidate Schedules</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    CP-SAT Optimization Alternatives
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Compare and select the best timetable from the generated candidates based on constraints, preferences, and utilization.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3 Candidate Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {candidates.map((cand, idx) => {
                        const letter = idx === 0 ? 'A' : idx === 1 ? 'B' : 'C';
                        const isSelected = selectedCandidate === letter;
                        return (
                            <div
                                key={letter}
                                onClick={() => setSelectedCandidate(letter as any)}
                                className={`rounded-2xl border p-5 cursor-pointer transition-all space-y-4 ${
                                    isSelected
                                        ? 'bg-gradient-to-br from-slate-900 to-rose-950 text-white border-transparent shadow-lg ring-2 ring-rose-400/50'
                                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-900 shadow-xs'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-bold text-base">{cand.code}</div>
                                        <div className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{cand.name}</div>
                                    </div>
                                    {cand.recommended && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            isSelected ? 'bg-rose-500/20 text-rose-200 border border-rose-400/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            ★ Recommended
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                        <div className="text-[10px] text-slate-400">Hard Conflicts</div>
                                        <div className="font-bold text-emerald-400 mt-0.5">{cand.hard_conflicts}</div>
                                    </div>
                                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                        <div className="text-[10px] text-slate-400">Satisfaction</div>
                                        <div className={`font-bold mt-0.5 ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>{cand.preference_satisfaction}%</div>
                                    </div>
                                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                        <div className="text-[10px] text-slate-400">Room Util.</div>
                                        <div className="font-bold mt-0.5">{cand.room_utilization}%</div>
                                    </div>
                                </div>

                                <div className={`space-y-1.5 text-xs pt-2 border-t ${isSelected ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                                    <div className="flex justify-between">
                                        <span>Avg. Faculty Gap:</span>
                                        <span className="font-semibold">{cand.avg_faculty_gap}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Avg. Section Gap:</span>
                                        <span className="font-semibold">{cand.avg_section_gap}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Consecutive Hours (Max):</span>
                                        <span className="font-semibold">{cand.max_consecutive}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Early / Late Classes:</span>
                                        <span className="font-semibold">{cand.early_late_classes}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Candidate Comparison Table & Working Draft Commitment */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Candidate Comparison Matrix</h3>
                            <p className="text-[11px] text-slate-500">Side-by-side metric comparison of all generated CP-SAT alternatives.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSetWorkingDraft}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:opacity-95"
                        >
                            <Check className="w-4 h-4" />
                            <span>Set Candidate {selectedCandidate} as Working Draft</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="py-2.5 px-3">Criteria</th>
                                    <th className="py-2.5 px-3 text-center">Candidate A</th>
                                    <th className="py-2.5 px-3 text-center">Candidate B</th>
                                    <th className="py-2.5 px-3 text-center">Candidate C</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-2 px-3 font-semibold text-slate-800">Hard Conflicts</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-600">0</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-600">0</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-600">0</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 font-semibold text-slate-800">Preference Satisfaction</td>
                                    <td className="py-2 px-3 text-center">93.8%</td>
                                    <td className="py-2 px-3 text-center font-bold text-amber-600">96.5%</td>
                                    <td className="py-2 px-3 text-center">91.2%</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 font-semibold text-slate-800">Room Utilization</td>
                                    <td className="py-2 px-3 text-center">86.4%</td>
                                    <td className="py-2 px-3 text-center">84.1%</td>
                                    <td className="py-2 px-3 text-center font-bold text-emerald-600">87.6%</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 font-semibold text-slate-800">Avg. Faculty Gap</td>
                                    <td className="py-2 px-3 text-center">0.8 hrs</td>
                                    <td className="py-2 px-3 text-center font-bold text-rose-950">0.6 hrs</td>
                                    <td className="py-2 px-3 text-center">1.0 hrs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SchedulingWorkspaceLayout>
    );
}

