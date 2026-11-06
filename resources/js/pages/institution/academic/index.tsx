import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock,
    GraduationCap,
    LibraryBig,
    Search,
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Academic Governance Oversight', href: '/institution/academic-governance' },
];

interface ProgramItem {
    id: number;
    code: string;
    name: string;
    degree_level?: string;
    status?: string;
    courses_count: number;
    college?: {
        id: number;
        code: string;
        name: string;
        parent?: { id: number; code: string; name: string } | null;
    } | null;
    curricula?: Array<{ id: number; version_name: string; effective_year: string; status: string }>;
}

interface CurriculumItem {
    id: number;
    version_name: string;
    effective_year: string;
    total_units: number;
    status: string;
    is_active: boolean;
    courses_count: number;
    program?: {
        id: number;
        code: string;
        name: string;
        college?: { id: number; code: string; name: string } | null;
    } | null;
}

interface CourseItem {
    id: number;
    code: string;
    title: string;
    units: string | number;
    lecture_hours: string | number;
    lab_hours: string | number;
    category?: string | null;
    status?: string | null;
    program?: {
        id: number;
        code: string;
        college?: { id: number; code: string } | null;
    } | null;
}

interface CollegeSchedulingItem {
    id: number;
    code: string;
    name: string;
    entity_name: string;
    dean_name: string;
    programs_count: number;
    setup_progress: number;
    scheduling_state: string;
}

interface Props {
    programs: ProgramItem[];
    curricula: CurriculumItem[];
    courses: CourseItem[];
    collegesScheduling: CollegeSchedulingItem[];
    initialTab?: string;
}

export default function InstitutionAcademicGovernance({
    programs = [],
    curricula = [],
    courses = [],
    collegesScheduling = [],
    initialTab = 'programs',
}: Props) {
    const [activeTab, setActiveTab] = useState<'programs' | 'curricula' | 'courses' | 'scheduling'>(
        initialTab === 'curricula' || initialTab === 'courses' || initialTab === 'scheduling'
            ? initialTab
            : 'programs',
    );
    const [search, setSearch] = useState('');

    React.useEffect(() => {
        if (
            initialTab === 'programs' ||
            initialTab === 'curricula' ||
            initialTab === 'courses' ||
            initialTab === 'scheduling'
        ) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Governance Oversight — Ascend" />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Cross-College Structural & Academic Oversight
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Ascend Academic Governance
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Institution-wide oversight of the Program Portfolio, Curriculum Versions, Canonical
                                Course Catalog, and College Scheduling Readiness—without interfering with College Admin
                                or Program Head timetable editors.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-xs">
                            {[
                                { id: 'programs', label: 'Program Portfolio', icon: GraduationCap },
                                { id: 'curricula', label: 'Curriculum Oversight', icon: LibraryBig },
                                { id: 'courses', label: 'Course Catalog Oversight', icon: BookOpen },
                                { id: 'scheduling', label: 'Scheduling Oversight', icon: CalendarDays },
                            ].map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() =>
                                            setActiveTab(
                                                t.id as 'programs' | 'curricula' | 'courses' | 'scheduling',
                                            )
                                        }
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                            activeTab === t.id
                                                ? 'bg-indigo-500 text-white shadow-sm'
                                                : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 1. Program Portfolio */}
                {activeTab === 'programs' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Institution Program Portfolio ({programs.length})
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Catalog of degree programs by Campus Entity and College, showing active curriculum
                                    versions and structural readiness.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">Program Code</th>
                                        <th className="px-4 py-3">Program Title</th>
                                        <th className="px-4 py-3">College</th>
                                        <th className="px-4 py-3">Parent Entity</th>
                                        <th className="px-4 py-3">Active Curriculum</th>
                                        <th className="px-4 py-3">Courses</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {programs.map((prog) => {
                                        const activeCurr = prog.curricula?.find((c) => c.status === 'Active');
                                        return (
                                            <tr key={prog.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {prog.code}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                    {prog.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {prog.college ? `${prog.college.code} · ${prog.college.name}` : 'CIDS'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {prog.college?.parent?.name || 'DSSC Main Campus'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {activeCurr ? (
                                                        <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                            {activeCurr.version_name} ({activeCurr.effective_year})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#0B3A67] dark:text-[#93C5FD]">No Active Curriculum</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-semibold">{prog.courses_count}</td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                        {prog.status || 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. Curriculum Oversight */}
                {activeTab === 'curricula' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Curriculum Oversight ({curricula.length} Versions)
                        </h2>
                        <p className="text-xs text-slate-500">
                            Cross-institution visibility over active, proposed, superseded, and historical curricula.
                        </p>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">Curriculum Version</th>
                                        <th className="px-4 py-3">Degree Program</th>
                                        <th className="px-4 py-3">College</th>
                                        <th className="px-4 py-3">Effective Year</th>
                                        <th className="px-4 py-3">Total Units</th>
                                        <th className="px-4 py-3">Mapped Courses</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {curricula.map((curr) => (
                                        <tr key={curr.id}>
                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                                {curr.version_name}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-indigo-600">
                                                {curr.program?.code} — {curr.program?.name}
                                            </td>
                                            <td className="px-4 py-3">{curr.program?.college?.code || 'CIDS'}</td>
                                            <td className="px-4 py-3 font-mono">{curr.effective_year}</td>
                                            <td className="px-4 py-3 font-semibold">{curr.total_units}</td>
                                            <td className="px-4 py-3 font-semibold">{curr.courses_count}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                        curr.status === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {curr.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. Course Catalog Oversight */}
                {activeTab === 'courses' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Canonical Course Catalog Oversight
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Identify duplicate course codes, shared General Education courses, and cross-college
                                    subject standards.
                                </p>
                            </div>
                            <div className="relative w-full max-w-xs">
                                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter course code or title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-xs dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3">Course Code</th>
                                        <th className="px-4 py-3">Descriptive Title</th>
                                        <th className="px-4 py-3">Program / College</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Units (Lec/Lab)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {courses
                                        .filter(
                                            (c) =>
                                                !search ||
                                                c.code.toLowerCase().includes(search.toLowerCase()) ||
                                                c.title.toLowerCase().includes(search.toLowerCase()),
                                        )
                                        .map((course) => (
                                            <tr key={course.id}>
                                                <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                                                    {course.code}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                    {course.title}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {course.program?.code || 'GE / Shared'} (
                                                    {course.program?.college?.code || 'CIDS'})
                                                </td>
                                                <td className="px-4 py-3">{course.category || 'Major / Core'}</td>
                                                <td className="px-4 py-3 font-mono">
                                                    {course.units}u ({course.lecture_hours}L / {course.lab_hours}Lab)
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. Scheduling Oversight */}
                {activeTab === 'scheduling' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Institution-Wide College Scheduling Readiness Oversight
                        </h2>
                        <p className="text-xs text-slate-500">
                            Executive readiness view across all Colleges—detects platform or configuration blockers
                            without interfering with College timetable decisions.
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {collegesScheduling.map((col) => {
                                const isPublished = col.scheduling_state === 'Published';
                                const hasConflict = col.scheduling_state.includes('Conflict');
                                return (
                                    <div
                                        key={col.id}
                                        className="flex items-center justify-between rounded-2xl border border-slate-200 p-5 shadow-2xs dark:border-slate-800"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                                    {col.code}
                                                </span>
                                                <span className="text-xs text-slate-500">{col.entity_name}</span>
                                            </div>
                                            <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                                                {col.name}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Dean: <strong>{col.dean_name}</strong> · {col.programs_count} Programs
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold ${
                                                isPublished
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : hasConflict
                                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-[#93C5FD]'
                                            }`}
                                        >
                                            {isPublished ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : hasConflict ? (
                                                <AlertTriangle className="h-4 w-4" />
                                            ) : (
                                                <Clock className="h-4 w-4" />
                                            )}
                                            {col.scheduling_state}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

