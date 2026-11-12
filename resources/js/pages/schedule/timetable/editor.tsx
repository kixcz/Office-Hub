import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    Table, 
    Lock, 
    Save, 
    RotateCcw, 
    Sparkles, 
    CheckCircle2, 
    AlertTriangle, 
    Search, 
    Filter, 
    Eye,
    ChevronRight,
    Send
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Timetable Generation', href: '/schedule/timetable/generator' },
    { title: 'Timetable Editor', href: '/schedule/timetable/editor' },
];

interface TimetableEditorProps {
    currentPeriod: any;
    loadingGate: any;
    schedules: any[];
}

export default function TimetableEditorPage({ currentPeriod, loadingGate, schedules }: TimetableEditorProps) {
    const [selectedView, setSelectedView] = useState<'grid' | 'faculty' | 'section' | 'room'>('grid');
    const [selectedClass, setSelectedClass] = useState<any>(schedules[0] || null);
    const [showAlternativeModal, setShowAlternativeModal] = useState(false);

    const timeSlots = [
        '7:00 - 8:00 AM',
        '8:00 - 9:00 AM',
        '9:00 - 10:00 AM',
        '10:00 - 11:00 AM',
        '11:00 - 12:00 PM',
        '12:00 - 1:00 PM',
        '1:00 - 2:00 PM',
        '2:00 - 3:00 PM',
        '3:00 - 4:00 PM',
        '4:00 - 5:00 PM',
        '5:00 - 6:00 PM',
    ];

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Timetable Editor - Timetable Generation" />

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
                                    Locked v3
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">Fine-tuning Working Draft timetable before publication</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/schedule/loading-review"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 shrink-0"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Loading Reference</span>
                        </a>
                    </div>
                </div>

                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <Table className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Timetable Editor</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Working Draft v1
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Manual review and fine-tuning of the working draft timetable before final review and approval.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
                        >
                            <Save className="w-3.5 h-3.5 text-slate-500" />
                            <span>Save Changes</span>
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white text-xs font-semibold hover:opacity-95 shadow-xs"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Publish for Review</span>
                        </button>
                    </div>
                </div>

                {/* 5 Summary Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
                        <div className="text-[11px] text-slate-500">Scheduled Classes</div>
                        <div className="text-lg font-bold text-slate-900 mt-0.5">412</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
                        <div className="text-[11px] text-slate-500">Unassigned Classes</div>
                        <div className="text-lg font-bold text-rose-600 mt-0.5">8</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
                        <div className="text-[11px] text-slate-500">Conflicts Detected</div>
                        <div className="text-lg font-bold text-amber-600 mt-0.5">4</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
                        <div className="text-[11px] text-slate-500">Room Utilization</div>
                        <div className="text-lg font-bold text-slate-900 mt-0.5">82%</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
                        <div className="text-[11px] text-slate-500">Validation Status</div>
                        <div className="text-lg font-bold text-emerald-600 mt-0.5">Valid Move Required</div>
                    </div>
                </div>

                {/* Main Timetable Matrix & Side Inspector */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Weekly Timetable Calendar Grid */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                                <button
                                    type="button"
                                    onClick={() => setSelectedView('grid')}
                                    className={`px-3 py-1.5 rounded-lg ${selectedView === 'grid' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
                                >
                                    Grid View
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedView('faculty')}
                                    className={`px-3 py-1.5 rounded-lg ${selectedView === 'faculty' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
                                >
                                    Faculty View
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedView('section')}
                                    className={`px-3 py-1.5 rounded-lg ${selectedView === 'section' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
                                >
                                    Section View
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedView('room')}
                                    className={`px-3 py-1.5 rounded-lg ${selectedView === 'room' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
                                >
                                    Room View
                                </button>
                            </div>

                            <span className="text-xs text-slate-400">Click a class to view safety validation</span>
                        </div>

                        {/* Calendar Matrix */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-center text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="py-2.5 px-3 text-left w-24">Time</th>
                                        {days.map((d) => (
                                            <th key={d} className="py-2.5 px-3">{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {timeSlots.map((slot, sIdx) => (
                                        <tr key={sIdx} className="hover:bg-slate-50/50">
                                            <td className="py-2.5 px-3 text-left text-[11px] font-medium text-slate-500 whitespace-nowrap">
                                                {slot}
                                            </td>
                                            {days.map((d, dIdx) => {
                                                const hasSampleClass = (sIdx === 1 && dIdx === 0) || (sIdx === 2 && dIdx === 1) || (sIdx === 4 && dIdx === 3);
                                                return (
                                                    <td key={d} className="p-1.5 align-top">
                                                        {hasSampleClass && (
                                                            <div
                                                                onClick={() => setSelectedClass({
                                                                    code: sIdx === 1 ? 'CS 612' : 'ITEL 601',
                                                                    title: sIdx === 1 ? 'Computer Programming II' : 'Artificial Intelligence',
                                                                    section: 'BSIT 2A',
                                                                    faculty: 'Prof. J. Dela Cruz',
                                                                    room: 'CL-201',
                                                                    time: `${d}, ${slot}`,
                                                                })}
                                                                className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 cursor-pointer hover:shadow-xs transition-all text-left space-y-0.5"
                                                            >
                                                                <div className="font-bold text-[11px]">
                                                                    {sIdx === 1 ? 'CS 612' : 'ITEL 601'}
                                                                </div>
                                                                <div className="text-[10px] text-indigo-700">BSIT 2A • CL-201</div>
                                                                <div className="text-[9px] text-slate-500">Prof. J. Dela Cruz</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Selected Class Details & Safety Alternative Drawer */}
                    {selectedClass && (
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                <h3 className="font-bold text-base">{selectedClass.code} – {selectedClass.title}</h3>
                                <p className="text-xs text-slate-300">
                                    {selectedClass.section} • {selectedClass.faculty}
                                </p>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Assigned Room:</span>
                                    <span className="font-bold text-slate-900">{selectedClass.room}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Scheduled Slot:</span>
                                    <span className="font-bold text-slate-900">{selectedClass.time}</span>
                                </div>
                            </div>

                            {/* Move Validation & Alternatives Box */}
                            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                                    <Sparkles className="w-4 h-4 text-rose-950" />
                                    <span>Safe Move Validation Alternatives</span>
                                </div>
                                <p className="text-[11px] text-indigo-900">
                                    Moving this class must adhere to faculty availability and room compatibility constraints.
                                </p>

                                <div className="space-y-1.5">
                                    <div className="p-2 rounded-lg bg-white border border-indigo-100 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-slate-800">Tue, 10:00 – 12:00 PM</div>
                                            <div className="text-[10px] text-slate-400">CL-201 • Best Fit</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-2 py-1 rounded bg-indigo-600 text-white font-bold text-[10px]"
                                        >
                                            Apply Slot
                                        </button>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white border border-indigo-100 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-slate-800">Fri, 8:00 – 10:00 AM</div>
                                            <div className="text-[10px] text-slate-400">CL-203 • Acceptable</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-2 py-1 rounded bg-indigo-600 text-white font-bold text-[10px]"
                                        >
                                            Apply Slot
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}

