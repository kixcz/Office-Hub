import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    ShieldCheck, 
    Lock, 
    AlertTriangle, 
    CheckCircle2, 
    RotateCcw, 
    Search, 
    Filter, 
    Eye,
    ChevronRight,
    Sparkles,
    Check
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Timetable Generation', href: '/schedule/timetable/generator' },
    { title: 'Conflict Checker', href: '/schedule/timetable/conflict-checker' },
];

interface ConflictItem {
    id: number;
    type: string;
    severity: 'Blocking' | 'Warning' | 'Advisory';
    details: string;
    course_code: string;
    course_title: string;
    section: string;
    faculty: string;
    room: string;
    time_slot: string;
    conflict_entity?: string;
    conflict_time?: string;
}

interface ConflictCheckerProps {
    currentPeriod: any;
    loadingGate: any;
}

export default function TimetableConflictCheckerPage({ currentPeriod, loadingGate }: ConflictCheckerProps) {
    const [severityFilter, setSeverityFilter] = useState('All');
    const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);

    const issues: ConflictItem[] = [
        {
            id: 1,
            type: 'Faculty Conflict',
            severity: 'Blocking',
            details: 'Prof. J. Dela Cruz has two classes assigned at the same time (Mon, 9:00 – 10:30 AM).',
            course_code: 'ITEL 601',
            course_title: 'Artificial Intelligence',
            section: 'DIT 3B',
            faculty: 'Prof. J. Dela Cruz',
            room: 'CL-201',
            time_slot: 'Mon, 9:00 – 10:30 AM',
            conflict_entity: 'CS 612 (BSIT 2A)',
            conflict_time: 'Mon, 9:00 – 10:30 AM (CL-202)',
        },
        {
            id: 2,
            type: 'Room Conflict',
            severity: 'Blocking',
            details: 'Room C-101 is assigned to two concurrent classes (Wed, 1:00 – 2:30 PM).',
            course_code: 'IT 635',
            course_title: 'Introduction to Prototyping',
            section: 'BSIT 3A',
            faculty: 'Prof. M. Ramos',
            room: 'C-101',
            time_slot: 'Wed, 1:00 – 2:30 PM',
            conflict_entity: 'GE 101 (BSIS 1A)',
            conflict_time: 'Wed, 1:00 – 2:30 PM',
        },
        {
            id: 3,
            type: 'Room Capacity Exceeded',
            severity: 'Blocking',
            details: 'ITEL 601 (DIT 3B) has 45 students, but Room CL-201 has capacity of 35.',
            course_code: 'ITEL 601',
            course_title: 'Artificial Intelligence',
            section: 'DIT 3B',
            faculty: 'Prof. K. Panaligan',
            room: 'CL-201 (Cap: 35)',
            time_slot: 'Tue, 10:30 AM – 1:30 PM',
        },
        {
            id: 4,
            type: 'Section Conflict',
            severity: 'Warning',
            details: 'BSIT 2A has overlapping classes (Tue, 10:30 AM – 12:00 PM).',
            course_code: 'CS 612',
            course_title: 'Computer Programming II',
            section: 'BSIT 2A',
            faculty: 'Prof. A. Santos',
            room: 'CL-202',
            time_slot: 'Tue, 10:30 AM – 12:00 PM',
        },
        {
            id: 5,
            type: 'Availability Violation',
            severity: 'Warning',
            details: 'Prof. M. Ramos is unavailable (Official Research Block) on Thursday morning.',
            course_code: 'ISEL 601',
            course_title: 'Data Visualization',
            section: 'BSIS 3A',
            faculty: 'Prof. M. Ramos',
            room: 'ITL-301',
            time_slot: 'Thu, 7:30 – 9:00 AM',
        },
        {
            id: 6,
            type: 'Consecutive Hours (Long)',
            severity: 'Warning',
            details: 'Prof. A. Panaligan has 5 consecutive teaching hours on Friday without a gap.',
            course_code: 'ITEL 604',
            course_title: 'Integrative Programming',
            section: 'DIT 4A',
            faculty: 'Prof. A. Panaligan',
            room: 'CL-201',
            time_slot: 'Fri, 7:30 AM – 12:30 PM',
        },
        {
            id: 7,
            type: 'Room Type Mismatch',
            severity: 'Advisory',
            details: 'CS 612 (Laboratory) is assigned to classroom C-102 instead of a computer laboratory.',
            course_code: 'CS 612',
            course_title: 'Computer Programming II',
            section: 'BSIT 2B',
            faculty: 'Prof. D. Flores',
            room: 'C-102 (Classroom)',
            time_slot: 'Thu, 2:00 – 4:00 PM',
        },
    ];

    const activeConflict = selectedConflict || issues[0];
    const blockingCount = issues.filter((i) => i.severity === 'Blocking').length;
    const warningCount = issues.filter((i) => i.severity === 'Warning').length;
    const advisoryCount = issues.filter((i) => i.severity === 'Advisory').length;

    const filteredIssues = issues.filter((i) => 
        severityFilter === 'All' || i.severity === severityFilter
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Conflict Checker - Timetable Generation" />

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
                            <p className="text-xs text-slate-300">Checking Working Draft against constraints</p>
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
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Conflict Checker</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    Integrity Engine
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Identify and resolve scheduling conflicts, room capacity limits, and constraint violations in the working draft timetable.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Metric Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{issues.length}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Issues</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-rose-600">{blockingCount}</div>
                            <div className="text-[11px] font-medium text-slate-500">Blocking (Must Resolve)</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-amber-600">{warningCount}</div>
                            <div className="text-[11px] font-medium text-slate-500">Warning (Review)</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-blue-600">{advisoryCount}</div>
                            <div className="text-[11px] font-medium text-slate-500">Advisory (Optimization)</div>
                        </div>
                    </div>
                </div>

                {/* Table & Side Detail Drawer */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Issues Table */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-2.5 px-3">#</th>
                                        <th className="py-2.5 px-3">Conflict / Issue</th>
                                        <th className="py-2.5 px-3">Details</th>
                                        <th className="py-2.5 px-3 text-center">Severity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredIssues.map((issue) => {
                                        const isSelected = activeConflict.id === issue.id;
                                        return (
                                            <tr
                                                key={issue.id}
                                                onClick={() => setSelectedConflict(issue)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 font-bold text-slate-500">{issue.id}</td>
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{issue.type}</td>
                                                <td className="py-2.5 px-3 text-slate-600 line-clamp-1">{issue.details}</td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        issue.severity === 'Blocking'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : issue.severity === 'Warning'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}>
                                                        {issue.severity}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Conflict Details & Resolution Panel */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                        <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base">{activeConflict.type}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    activeConflict.severity === 'Blocking' ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                }`}>
                                    {activeConflict.severity}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium">{activeConflict.details}</p>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Course &amp; Section:</span>
                                <span className="font-bold text-slate-900">{activeConflict.course_code} ({activeConflict.section})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Faculty:</span>
                                <span className="font-bold text-slate-900">{activeConflict.faculty}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Assigned Room:</span>
                                <span className="font-bold text-slate-900">{activeConflict.room}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Scheduled Time:</span>
                                <span className="font-bold text-rose-950">{activeConflict.time_slot}</span>
                            </div>
                        </div>

                        {/* Suggested Resolutions */}
                        <div className="space-y-2 text-xs">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-rose-950" />
                                <span>Suggested Resolutions</span>
                            </h4>
                            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2 text-indigo-950">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input type="radio" name="res" defaultChecked className="mt-0.5 text-rose-950" />
                                    <span>Move class to available alternative slot (Tue, 1:00 – 2:30 PM in CL-201)</span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input type="radio" name="res" className="mt-0.5 text-rose-950" />
                                    <span>Reassign to an available qualified faculty member in the same program</span>
                                </label>
                            </div>

                            <button
                                type="button"
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                            >
                                <Check className="w-4 h-4" />
                                <span>Apply Resolution</span>
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}

