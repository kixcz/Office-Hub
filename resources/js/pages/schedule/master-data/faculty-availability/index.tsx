import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    Clock, 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    Layers, 
    Check, 
    X,
    Calendar,
    ChevronRight
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/faculty-availability' },
    { title: 'Faculty Availability', href: '/schedule/master-data/faculty-availability' },
];

interface FacultyAvailabilityRow {
    id: number;
    name: string;
    avatar?: string;
    program_code: string;
    schedule_summary: string;
    total_hours: string;
    status: string;
}

interface AvailabilityPageProps {
    currentPeriod: any;
    faculties: FacultyAvailabilityRow[];
}

export default function FacultyAvailabilityPage({ currentPeriod, faculties }: AvailabilityPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState<FacultyAvailabilityRow | null>(faculties[0] || null);

    const totalFaculty = faculties.length;
    const withAvailability = faculties.filter((f) => f.status === 'Set').length;
    const limitedAvailability = faculties.filter((f) => f.status === 'Limited').length;
    const notSet = totalFaculty - withAvailability - limitedAvailability;

    const filteredFaculties = faculties.filter((f) => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.program_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const timeSlots = [
        '7:30 - 8:30 AM',
        '8:30 - 9:30 AM',
        '9:30 - 10:30 AM',
        '10:30 - 11:30 AM',
        '11:30 - 12:30 PM',
        '12:30 - 1:30 PM (Lunch)',
        '1:30 - 2:30 PM',
        '2:30 - 3:30 PM',
        '3:30 - 4:30 PM',
        '4:30 - 5:00 PM',
    ];

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Availability - Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="space-y-6 p-6 font-['Poppins']">
                    {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty Availability</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Hard Constraint Inputs
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Manage weekly faculty teaching availability, break windows, and administrative commitments for timetable feasibility.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalFaculty}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Faculty</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{withAvailability}</div>
                            <div className="text-[11px] font-medium text-slate-500">With Availability Set</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{limitedAvailability}</div>
                            <div className="text-[11px] font-medium text-slate-500">Limited Availability</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{notSet}</div>
                            <div className="text-[11px] font-medium text-slate-500">Not Set</div>
                        </div>
                    </div>
                </div>

                {/* Filter Search Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search faculty name or program..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>
                </div>

                {/* Main Table & Side Grid Drawer */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Faculty Table */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-2.5 px-3">Faculty</th>
                                        <th className="py-2.5 px-3">Program</th>
                                        <th className="py-2.5 px-3">Availability Summary</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredFaculties.map((f) => {
                                        const isSelected = selectedFaculty?.id === f.id;
                                        return (
                                            <tr
                                                key={f.id}
                                                onClick={() => setSelectedFaculty(f)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{f.name}</td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-700">{f.program_code}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{f.schedule_summary} ({f.total_hours})</td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        f.status === 'Set'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {f.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Weekly Availability Grid Drawer */}
                    {selectedFaculty && (
                        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-base">{selectedFaculty.name}</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        {selectedFaculty.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">Weekly Availability Grid • 40 hrs / week</p>
                            </div>

                            {/* Weekly Availability Timetable */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Weekly Feasibility Matrix</h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-center text-xs">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="py-2 px-2 text-left">Time</th>
                                                {days.map((d) => (
                                                    <th key={d} className="py-2 px-2">{d}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {timeSlots.map((slot, sIdx) => {
                                                const isLunch = slot.includes('Lunch');
                                                return (
                                                    <tr key={sIdx} className={isLunch ? 'bg-slate-100/60' : 'hover:bg-slate-50/50'}>
                                                        <td className="py-1.5 px-2 text-left text-[11px] font-medium text-slate-500">{slot}</td>
                                                        {days.map((d) => (
                                                            <td key={d} className="py-1.5 px-2">
                                                                {isLunch ? (
                                                                    <span className="text-[10px] text-slate-400 font-medium">Break</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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

