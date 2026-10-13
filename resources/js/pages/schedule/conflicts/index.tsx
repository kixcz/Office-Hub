import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Search,
    Filter,
    RotateCcw,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Conflict Center', href: '/schedule/conflicts' },
];

interface ConflictItem {
    id: string;
    category: string;
    severity: 'Blocking' | 'Warning' | 'Info';
    description: string;
    entity: string;
    room: string;
    day_time: string;
    status: 'Unresolved' | 'Resolved';
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    conflicts: ConflictItem[];
}

export default function ConflictCenterIndex({
    currentPeriod,
    academicPeriods,
    conflicts = [],
}: Props) {
    const [filterCategory, setFilterCategory] = useState('all');
    const [search, setSearch] = useState('');

    const filteredConflicts = useMemo(() => {
        return conflicts.filter((c) => {
            const matchesCat = filterCategory === 'all' || c.category === filterCategory;
            const matchesSearch =
                c.description.toLowerCase().includes(search.toLowerCase()) ||
                c.entity.toLowerCase().includes(search.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [conflicts, filterCategory, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Conflict Center - CIDS OfficeHub" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Conflict Center &amp; Quality Assurance
                            </h1>
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                Module 15
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-500 max-w-2xl">
                            Central quality-assurance facility identifying, classifying, and resolving technical scheduling violations (faculty overlaps, section collisions, room double-bookings, underload/overload, and unassigned courses).
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button asChild variant="outline" className="text-xs">
                            <Link href="/schedule/timetable">
                                Timetable Editor
                            </Link>
                        </Button>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                            <Link href="/schedule/reviews">
                                Reviews &amp; Approval <ArrowRight className="size-3.5 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-xs text-gray-500 font-medium">Hard Solver Collisions</span>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">0</div>
                        <span className="text-[11px] text-emerald-700 mt-0.5 block">Zero double-bookings</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-xs text-gray-500 font-medium">Unassigned Courses</span>
                        <div className="text-2xl font-bold text-amber-600 mt-1">{conflicts.length}</div>
                        <span className="text-[11px] text-amber-700 mt-0.5 block">Requires faculty matching</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-xs text-gray-500 font-medium">Reviewer Flags</span>
                        <div className="text-2xl font-bold text-purple-600 mt-1">2</div>
                        <span className="text-[11px] text-purple-700 mt-0.5 block">From Program Heads</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-xs text-gray-500 font-medium">Overall Health Score</span>
                        <div className="text-2xl font-bold text-blue-600 mt-1">94.6%</div>
                        <span className="text-[11px] text-blue-700 mt-0.5 block">CP-SAT Optimized</span>
                    </div>
                </div>

                {/* Conflict List */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-72">
                            <Search className="size-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search conflict description or section..."
                                className="pl-8 text-xs h-8"
                            />
                        </div>

                        <span className="text-xs text-gray-500">
                            Showing {filteredConflicts.length} issues
                        </span>
                    </div>

                    <div className="space-y-3">
                        {filteredConflicts.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                                <CheckCircle2 className="size-8 text-emerald-600 mx-auto mb-2" />
                                No technical violations or blocking issues detected for this academic period.
                            </div>
                        ) : (
                            filteredConflicts.map((c) => (
                                <div
                                    key={c.id}
                                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                                >
                                    <div className="space-y-1 max-w-2xl">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{c.id}</span>
                                            <Badge
                                                className={
                                                    c.severity === 'Blocking'
                                                        ? 'bg-red-100 text-red-800 border-red-200 text-[10px]'
                                                        : 'bg-amber-100 text-amber-800 border-amber-200 text-[10px]'
                                                }
                                            >
                                                {c.severity}
                                            </Badge>
                                            <span className="text-gray-400">•</span>
                                            <span className="font-semibold text-gray-700">{c.category}</span>
                                        </div>
                                        <p className="text-gray-700">{c.description}</p>
                                        <div className="text-[11px] text-gray-500">
                                            Section: <span className="font-medium text-gray-800">{c.entity}</span> &nbsp;|&nbsp;
                                            Facility: <span className="font-medium text-gray-800">{c.room}</span> &nbsp;|&nbsp;
                                            Schedule: <span className="font-medium text-gray-800">{c.day_time}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button asChild variant="outline" size="sm" className="text-xs">
                                            <Link href="/schedule/generator">
                                                Specialization Match
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
