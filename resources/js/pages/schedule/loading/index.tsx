import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Briefcase,
    Users,
    AlertCircle,
    CheckCircle2,
    Clock,
    BookOpen,
    GraduationCap,
    Sliders,
    Search,
    Filter,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Faculty Loading', href: '/schedule/loading' },
];

interface FacultyLoadItem {
    id: number;
    name: string;
    program: string;
    rank: string;
    employment_type: string;
    specialization: string;
    teaching_units: number;
    admin_units: number;
    research_units: number;
    extension_units: number;
    total_load: number;
    target_load: number;
    load_status: 'normal' | 'underloaded' | 'overloaded';
    assigned_courses_count: number;
    classes: Array<{
        id: number;
        course_code: string;
        course_title: string;
        section: string;
        room: string;
        day: string;
        time: string;
    }>;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    facultyLoads: FacultyLoadItem[];
}

export default function FacultyLoadingIndex({
    currentPeriod,
    academicPeriods,
    facultyLoads = [],
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [activeFacultyDetail, setActiveFacultyDetail] = useState<FacultyLoadItem | null>(null);

    const programs = useMemo(() => {
        const set = new Set<string>();
        facultyLoads.forEach((f) => {
            if (f.program) set.add(f.program);
        });
        return Array.from(set);
    }, [facultyLoads]);

    const filteredLoads = useMemo(() => {
        return facultyLoads.filter((f) => {
            const matchesSearch =
                f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.specialization.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProgram = selectedProgram === 'all' || f.program === selectedProgram;
            const matchesStatus = selectedStatus === 'all' || f.load_status === selectedStatus;
            return matchesSearch && matchesProgram && matchesStatus;
        });
    }, [facultyLoads, searchTerm, selectedProgram, selectedStatus]);

    const stats = useMemo(() => {
        const total = facultyLoads.length;
        const normal = facultyLoads.filter((f) => f.load_status === 'normal').length;
        const under = facultyLoads.filter((f) => f.load_status === 'underloaded').length;
        const over = facultyLoads.filter((f) => f.load_status === 'overloaded').length;
        return { total, normal, under, over };
    }, [facultyLoads]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Loading - Target Calculation" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Faculty Workload &amp; Loading</h1>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                {currentPeriod ? `${currentPeriod.academic_year} (${currentPeriod.semester})` : 'Active Term'}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Calculates every faculty member&apos;s target workload combining teaching assignments with credited non-teaching duties (Program Head designation, research participation, extension work, and coordinatorships).
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="text-xs">
                            <Link href="/schedule/generator">
                                Back to Generator
                            </Link>
                        </Button>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                            <Link href="/schedule/timetable">
                                Timetable Editor <ArrowRight className="size-3.5 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-xs text-gray-500 font-medium">Total Roster Faculty</span>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">Full-time &amp; Part-time</span>
                    </div>
                    <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-2xs">
                        <span className="text-xs text-emerald-800 font-medium">Balanced / Normal Load</span>
                        <div className="text-2xl font-bold text-emerald-950 mt-1">{stats.normal}</div>
                        <span className="text-[11px] text-emerald-700 mt-0.5 block">Between 12 and 21 units</span>
                    </div>
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-2xs">
                        <span className="text-xs text-amber-800 font-medium">Underloaded Faculty</span>
                        <div className="text-2xl font-bold text-amber-950 mt-1">{stats.under}</div>
                        <span className="text-[11px] text-amber-700 mt-0.5 block">Below 12 teaching units</span>
                    </div>
                    <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-2xs">
                        <span className="text-xs text-rose-800 font-medium">Overloaded Faculty</span>
                        <div className="text-2xl font-bold text-rose-950 mt-1">{stats.over}</div>
                        <span className="text-[11px] text-rose-700 mt-0.5 block">Exceeds 21 units ceiling</span>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search instructor or specialization..."
                            className="pl-9 text-xs"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Program:</span>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
                            >
                                <option value="all">All Programs</option>
                                {programs.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Load Status:</span>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
                            >
                                <option value="all">All Statuses</option>
                                <option value="normal">Normal (12 - 21)</option>
                                <option value="underloaded">Underloaded (&lt;12)</option>
                                <option value="overloaded">Overloaded (&gt;21)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                                    <th className="py-3 px-4">Faculty Member</th>
                                    <th className="py-3 px-4">Program / Rank</th>
                                    <th className="py-3 px-4 text-center">Teaching Units</th>
                                    <th className="py-3 px-4 text-center">Admin Release</th>
                                    <th className="py-3 px-4 text-center">Research</th>
                                    <th className="py-3 px-4 text-center">Total Load</th>
                                    <th className="py-3 px-4 text-center">Load Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLoads.map((faculty) => (
                                    <tr key={faculty.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-gray-900 text-sm">{faculty.name}</div>
                                            <div className="text-[11px] text-gray-500">{faculty.specialization}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-gray-800">{faculty.program}</div>
                                            <div className="text-[11px] text-gray-500">{faculty.rank}</div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-gray-900">
                                            {faculty.teaching_units} units
                                            <span className="block text-[10px] text-gray-400 font-normal">
                                                ({faculty.assigned_courses_count} courses)
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium text-gray-700">
                                            {faculty.admin_units} units
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium text-gray-700">
                                            {faculty.research_units} units
                                        </td>
                                        <td className="py-3 px-4 text-center font-black text-blue-700 text-sm">
                                            {faculty.total_load} / {faculty.target_load}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {faculty.load_status === 'normal' && (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                                    Balanced
                                                </Badge>
                                            )}
                                            {faculty.load_status === 'underloaded' && (
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                                                    Underloaded
                                                </Badge>
                                            )}
                                            {faculty.load_status === 'overloaded' && (
                                                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
                                                    Overloaded
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Button
                                                onClick={() => setActiveFacultyDetail(faculty)}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7 px-2.5"
                                            >
                                                Inspect Assigned Classes
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Inspect Drawer/Modal Modal Detail */}
                {activeFacultyDetail && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{activeFacultyDetail.name}</h3>
                                    <span className="text-xs text-gray-500">
                                        {activeFacultyDetail.program} • {activeFacultyDetail.rank} • Total Load: {activeFacultyDetail.total_load} Units
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveFacultyDetail(null)}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Assigned Teaching Sections ({activeFacultyDetail.classes.length})
                                </h4>
                                {activeFacultyDetail.classes.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
                                        No active course offerings assigned yet. The deterministic solver can match unassigned offerings.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {activeFacultyDetail.classes.map((c) => (
                                            <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="font-bold text-gray-900">{c.course_code} - {c.course_title}</span>
                                                    <span className="text-gray-500 block">{c.section} • Room: {c.room}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-semibold text-blue-700 block">{c.day}</span>
                                                    <span className="text-gray-500">{c.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Program Head & Dean Workload Review & Endorsement Controls */}
                            <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            alert(`Added workload review comment / flag for ${activeFacultyDetail.name}.`);
                                        }}
                                        className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs font-semibold"
                                    >
                                        Flag Match / Reassignment
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            alert(`Workload proposal for ${activeFacultyDetail.name} endorsed by Program Head.`);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                    >
                                        Endorse Faculty Load
                                    </Button>
                                </div>
                                <Button onClick={() => setActiveFacultyDetail(null)} variant="ghost" className="text-xs text-gray-500">
                                    Close Window
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
