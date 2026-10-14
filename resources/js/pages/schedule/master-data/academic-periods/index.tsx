import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    Calendar,
    CheckCircle2,
    Clock,
    Plus,
    Search,
    ChevronRight,
    Star,
    Layers,
    Sliders,
    Building2,
    GraduationCap,
    Users,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/academic-periods' },
    { title: 'Academic Periods', href: '/schedule/master-data/academic-periods' },
];

interface AcademicPeriod {
    id: number;
    academic_year: string;
    semester: string;
    start_date: string;
    end_date: string;
    class_start_date?: string | null;
    class_end_date?: string | null;
    status: 'Draft' | 'Active' | 'Closed' | 'Archived';
    is_current: boolean;
    planning_parameters?: any;
}

interface Props {
    currentPeriod: AcademicPeriod | null;
    academicPeriods: AcademicPeriod[];
}

export default function MasterDataAcademicPeriodsIndex({
    currentPeriod,
    academicPeriods = [],
}: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = useMemo(() => {
        return academicPeriods.filter((p) => {
            const matchesSearch =
                p.academic_year.toLowerCase().includes(search.toLowerCase()) ||
                p.semester.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [academicPeriods, search, statusFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Periods - Scheduling Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                    <Clock className="size-5" />
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Academic Periods (Scheduling Context)
                                </h1>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                    Master Data 01
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 max-w-2xl">
                                Configures semester contexts, class bounds, active weekdays, and instructional weeks that bound the timetable solver.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="text-xs">
                                <Link href="/administration/academic-periods">
                                    General Periods Admin &rarr;
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Active Period Highlight Card */}
                    {currentPeriod && (
                        <div className="p-5 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Active Solver Semester
                                </span>
                                <h2 className="text-xl font-extrabold text-slate-900">
                                    {currentPeriod.academic_year} &bull; {currentPeriod.semester}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Classes: {currentPeriod.class_start_date || currentPeriod.start_date} to {currentPeriod.class_end_date || currentPeriod.end_date}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right text-xs">
                                    <span className="text-slate-400 block font-medium">Solver Status</span>
                                    <span className="font-bold text-emerald-700">Target Ready</span>
                                </div>
                                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                                    <Link href="/schedule/generator">
                                        Open Workspace
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Filter and Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search academic periods..."
                                    className="pl-9 h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-semibold"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3 px-4">Academic Year</th>
                                        <th className="py-3 px-4">Semester</th>
                                        <th className="py-3 px-4">Class Dates</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Scheduling Role</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((period) => (
                                        <tr key={period.id} className="hover:bg-amber-50/40 transition-colors">
                                            <td className="py-3 px-4 font-bold text-gray-900">
                                                {period.academic_year}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-gray-700">
                                                {period.semester}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {period.class_start_date || period.start_date} &ndash; {period.class_end_date || period.end_date}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    className={
                                                        period.status === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                            : period.status === 'Draft'
                                                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                              : 'bg-gray-100 text-gray-600 border-gray-200'
                                                    }
                                                >
                                                    {period.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {period.is_current ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                                                        <Star className="size-3 fill-amber-500 text-amber-500" />
                                                        Current Period
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px]">Historical Term</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                                                    <Link href="/schedule/generator">
                                                        Load In Generator &rarr;
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
