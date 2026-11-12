import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    SlidersHorizontal, 
    Lock, 
    CheckCircle2, 
    AlertTriangle, 
    Save, 
    RotateCcw, 
    FileText, 
    ShieldCheck, 
    Check, 
    ChevronRight,
    Eye
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Timetable Generation', href: '/schedule/timetable/generator' },
    { title: 'Constraints', href: '/schedule/timetable/constraints' },
];

interface TimetableConstraintsProps {
    currentPeriod: any;
    loadingGate: {
        publication: {
            version: string;
            status: string;
            locked_at: string;
            is_locked: boolean;
        } | null;
        is_ready: boolean;
        readiness_checks: Array<{ label: string; status: boolean }>;
    };
}

export default function TimetableConstraintsPage({ currentPeriod, loadingGate }: TimetableConstraintsProps) {
    const [hardConstraints, setHardConstraints] = useState([
        { id: 'no_faculty_overlap', name: 'No Faculty Conflict', desc: 'A faculty can teach only one class at a time.', enabled: true },
        { id: 'no_section_overlap', name: 'No Section Conflict', desc: 'A section can have only one class at a time.', enabled: true },
        { id: 'no_room_overlap', name: 'No Room Conflict', desc: 'A room can host only one class at a time.', enabled: true },
        { id: 'room_type_req', name: 'Room Type Requirement', desc: 'Match class to required room type (e.g., laboratory).', enabled: true },
        { id: 'room_capacity', name: 'Room Capacity', desc: 'Ensure room capacity is >= class size.', enabled: true },
        { id: 'faculty_availability', name: 'Faculty Availability', desc: 'Schedule only within the faculty’s available time.', enabled: true },
        { id: 'required_contact_hours', name: 'Required Contact Hours', desc: 'Meet the prescribed weekly contact hours per course.', enabled: true },
        { id: 'laboratory_continuity', name: 'Laboratory Continuity', desc: 'Laboratory classes are scheduled in uninterrupted blocks.', enabled: true },
        { id: 'operating_hours', name: 'Operating Hours', desc: 'Keep classes within the college’s operating days and hours.', enabled: true },
        { id: 'locked_assignments', name: 'Locked Assignments', desc: 'Use the approved and locked faculty loading.', enabled: true },
    ]);

    const [softConstraints, setSoftConstraints] = useState([
        { id: 'faculty_pref_time', name: 'Faculty Preferred Times', desc: 'Give higher priority to faculty time preferences.', enabled: true },
        { id: 'minimize_gaps', name: 'Minimize Gaps', desc: 'Reduce idle time between classes (faculty and section).', enabled: true },
        { id: 'minimize_transfers', name: 'Minimize Room Transfers', desc: 'Avoid frequent room changes for the same section.', enabled: true },
        { id: 'limit_consecutive', name: 'Limit Consecutive Hours', desc: 'Avoid excessively long consecutive teaching hours.', enabled: true },
        { id: 'even_distribution', name: 'Even Class Distribution', desc: 'Distribute classes evenly across the week.', enabled: true },
        { id: 'avoid_early_late', name: 'Avoid Early/Late Classes', desc: 'Deprioritize very early or late time slots.', enabled: true },
        { id: 'prefer_rooms', name: 'Prefer Designated Rooms', desc: 'Use program-designated rooms/labs when available.', enabled: true },
        { id: 'balance_workload', name: 'Balance Faculty Load', desc: 'Consider a balanced distribution of teaching hours.', enabled: true },
    ]);

    const toggleHard = (id: string) => {
        setHardConstraints(hardConstraints.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c));
    };

    const toggleSoft = (id: string) => {
        setSoftConstraints(softConstraints.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Constraints - Timetable Generation" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="space-y-6 p-6 font-['Poppins']">
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
                                    {loadingGate.publication?.status || 'Locked v3'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">
                                Approved &amp; Locked ({loadingGate.publication?.version || 'v3'}) • Finalized for Timetable Generation
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

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Constraints</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Optimization Rules
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Define the hard scheduling rules and soft preference weights for CP-SAT timetable generation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Grid: Constraints Form & Readiness Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Constraints Configuration Panels */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Hard Constraints Box */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Hard Constraints (Required)</h3>
                                        <p className="text-[11px] text-slate-500">Must always be satisfied by the CP-SAT solver.</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {hardConstraints.filter((c) => c.enabled).length} enabled
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {hardConstraints.map((c) => (
                                    <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-bold text-xs text-slate-900">{c.name}</div>
                                            <div className="text-[11px] text-slate-500">{c.desc}</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={c.enabled}
                                            onChange={() => toggleHard(c.id)}
                                            className="w-4 h-4 text-rose-950 rounded border-slate-300 focus:ring-rose-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Soft Constraints Box */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                                        <SlidersHorizontal className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Soft Constraints (Preferences)</h3>
                                        <p className="text-[11px] text-slate-500">Optimizer tries to satisfy these as much as possible.</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {softConstraints.filter((c) => c.enabled).length} enabled
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {softConstraints.map((c) => (
                                    <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-bold text-xs text-slate-900">{c.name}</div>
                                            <div className="text-[11px] text-slate-500">{c.desc}</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={c.enabled}
                                            onChange={() => toggleSoft(c.id)}
                                            className="w-4 h-4 text-rose-950 rounded border-slate-300 focus:ring-rose-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Readiness Gate & Constraint Summary */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Scheduling Readiness</h3>
                                    <p className="text-[11px] text-emerald-600 font-semibold">Ready for Timetable Generation</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                                {loadingGate.readiness_checks.map((check, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>{check.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Constraint Summary</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                    <div className="text-base font-bold text-rose-950">10</div>
                                    <div className="text-[10px] text-slate-500">Hard Constraints</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                    <div className="text-base font-bold text-indigo-900">8</div>
                                    <div className="text-[10px] text-slate-500">Soft Constraints</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="w-full py-2 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Constraints</span>
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}

