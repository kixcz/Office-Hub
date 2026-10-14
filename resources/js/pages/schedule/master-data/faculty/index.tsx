import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    Search,
    BookOpen,
    GraduationCap,
    Clock,
    Briefcase,
    Building2,
    Sliders,
    Sparkles,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/faculty' },
    { title: 'Faculty & Specializations', href: '/schedule/master-data/faculty' },
];

interface FacultyMember {
    id: number;
    first_name: string;
    last_name: string;
    title_name?: string | null;
    academic_rank?: string | null;
    specialization?: string | null;
    program?: {
        id: number;
        code: string;
        name: string;
    } | null;
}

interface Props {
    currentPeriod: any;
    faculties: FacultyMember[];
}

export default function MasterDataFacultyIndex({
    currentPeriod,
    faculties = [],
}: Props) {
    const [search, setSearch] = useState('');
    const [programFilter, setProgramFilter] = useState('all');

    const filtered = useMemo(() => {
        return faculties.filter((f) => {
            const name = `${f.first_name} ${f.last_name} ${f.title_name || ''}`.toLowerCase();
            const spec = (f.specialization || '').toLowerCase();
            const matchesSearch = name.includes(search.toLowerCase()) || spec.includes(search.toLowerCase());
            const matchesProg = programFilter === 'all' || f.program?.code === programFilter;
            return matchesSearch && matchesProg;
        });
    }, [faculties, search, programFilter]);

    const programs = useMemo(() => {
        const set = new Set<string>();
        faculties.forEach((f) => {
            if (f.program?.code) set.add(f.program.code);
        });
        return Array.from(set);
    }, [faculties]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty & Specializations - Scheduling Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                    <Users className="size-5" />
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Faculty &amp; Specialization Matrix
                                </h1>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                    Master Data 05
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 max-w-2xl">
                                Instructors, disciplinary expertise tags, and academic ranks used by the automated scheduler to match courses without competency conflicts.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="text-xs">
                                <Link href="/faculties">
                                    Faculty Directory &rarr;
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Total Faculty Pool</span>
                            <div className="text-2xl font-black text-gray-900">{faculties.length}</div>
                            <span className="text-[11px] text-gray-500">Qualified instructional pool</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">With Tagged Specialization</span>
                            <div className="text-2xl font-black text-emerald-600">
                                {faculties.filter((f) => f.specialization).length}
                            </div>
                            <span className="text-[11px] text-gray-500">Ready for automated matcher</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Loading Workload Target</span>
                            <div className="text-2xl font-black text-blue-600">18 Units</div>
                            <span className="text-[11px] text-gray-500">Institutional standard full-time</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by instructor or specialty..."
                                    className="pl-9 h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={programFilter}
                                    onChange={(e) => setProgramFilter(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-semibold"
                                >
                                    <option value="all">All Programs</option>
                                    {programs.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                                    <Link href="/schedule/loading">
                                        View Load Allocation &rarr;
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3 px-4">Faculty Member</th>
                                        <th className="py-3 px-4">Home Program</th>
                                        <th className="py-3 px-4">Academic Rank</th>
                                        <th className="py-3 px-4">Specialization Tags</th>
                                        <th className="py-3 px-4 text-center">Eligibility</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((faculty) => (
                                        <tr key={faculty.id} className="hover:bg-amber-50/40 transition-colors">
                                            <td className="py-3 px-4 font-bold text-gray-900">
                                                {faculty.title_name ? `${faculty.title_name} ` : ''}
                                                {faculty.first_name} {faculty.last_name}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-gray-700">
                                                {faculty.program?.code || 'General'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {faculty.academic_rank || 'Instructor'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {faculty.specialization ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                                                        {faculty.specialization}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-[11px]">No tags assigned</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                                    Assignable
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button asChild variant="outline" size="sm" className="text-xs h-7">
                                                    <Link href="/schedule/loading">
                                                        Inspect Load &rarr;
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
