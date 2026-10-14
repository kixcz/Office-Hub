import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Search,
    Building2,
    Layers,
    Monitor,
    Laptop,
    Share2,
    Table,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/programs' },
    { title: 'Programs & Curriculum', href: '/schedule/master-data/programs' },
];

interface ProgramItem {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    offerings_count?: number;
    sections_count?: number;
}

interface Props {
    currentPeriod: any;
    programs: ProgramItem[];
}

export default function MasterDataProgramsIndex({
    currentPeriod,
    programs = [],
}: Props) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        return programs.filter((p) => {
            return (
                p.code.toLowerCase().includes(search.toLowerCase()) ||
                p.name.toLowerCase().includes(search.toLowerCase())
            );
        });
    }, [programs, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programs & Curriculum - Scheduling Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                    <GraduationCap className="size-5" />
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Programs &amp; Curriculum Demand
                                </h1>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                    Master Data 03
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 max-w-2xl">
                                Academic programs, active curriculum versions, and student cohort demand that the CP-SAT timetable solver must satisfy.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="text-xs">
                                <Link href="/programs">
                                    Programs Directory &rarr;
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Program Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {programs.map((p) => (
                            <div
                                key={p.id}
                                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                                        {p.code}
                                    </div>
                                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">
                                        Active Term
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm leading-snug">{p.name}</h3>
                                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                                        {p.description || 'College degree program curriculum with 1st to 4th year cohort sections.'}
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                                    <span>Sections</span>
                                    <span className="font-bold text-gray-900">4 Year Levels</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table of Program Offerings */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search programs..."
                                    className="pl-9 h-9 text-xs rounded-xl"
                                />
                            </div>

                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                                <Link href="/schedule/sections">
                                    View Section Offerings Matrix &rarr;
                                </Link>
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3 px-4">Program Code</th>
                                        <th className="py-3 px-4">Full Degree Title</th>
                                        <th className="py-3 px-4">Curriculum Scope</th>
                                        <th className="py-3 px-4">Cohort Years</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((item) => (
                                        <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                                            <td className="py-3 px-4 font-bold text-gray-900">
                                                {item.code}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-gray-800">
                                                {item.name}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                Active Curriculum (2025–2027)
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-gray-700">1st, 2nd, 3rd, 4th Year</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                                    Scheduled
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button asChild variant="outline" size="sm" className="text-xs h-7">
                                                    <Link href="/schedule/sections">
                                                        Inspect Cohorts &rarr;
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
