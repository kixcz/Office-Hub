import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    GraduationCap, 
    Layers, 
    BookOpen, 
    Clock, 
    Plus, 
    Upload, 
    Copy, 
    Download, 
    Map, 
    ChevronRight, 
    CheckCircle2, 
    AlertTriangle, 
    Search,
    ShieldCheck,
    History
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/programs' },
    { title: 'Programs & Curriculum', href: '/schedule/master-data/programs' },
];

interface CourseItem {
    id: number;
    code: string;
    title: string;
    units: number;
    lec: number;
    lab: number;
    year_level: number;
    semester: string;
    prerequisite: string;
    status: string;
    has_credit_mapping: boolean;
}

interface CurriculumItem {
    id: number;
    name: string;
    year_effective: string;
    version: string;
    status: string;
    total_units: number;
    total_courses: number;
    courses: CourseItem[];
}

interface ProgramItem {
    id: number;
    code: string;
    name: string;
    program_type: string;
    degree_level: string;
    status: string;
    curricula_count: number;
    active_curricula_count: number;
    courses_count: number;
    offerings_count: number;
    program_head: string;
    curricula: CurriculumItem[];
}

interface ProgramsCurriculumProps {
    currentPeriod: any;
    programs: ProgramItem[];
}

export default function ProgramsCurriculumPage({ currentPeriod, programs }: ProgramsCurriculumProps) {
    const [selectedProgramId, setSelectedProgramId] = useState<number>(programs[0]?.id || 1);
    const [searchProgram, setSearchProgram] = useState('');
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'overview' | 'curriculum' | 'map' | 'prereq' | 'history'>('curriculum');
    const [selectedYearLevel, setSelectedYearLevel] = useState<number>(1);
    const [selectedSemester, setSelectedSemester] = useState<string>('1st Semester');

    const selectedProgram = programs.find((p) => p.id === selectedProgramId) || programs[0];
    const activeCurriculum = selectedProgram?.curricula?.[0] || {
        name: 'Curriculum 2026 (v1)',
        total_units: 132,
        total_courses: 45,
        courses: [],
    };

    // Filter courses by selected year level and semester
    const filteredCourses = activeCurriculum.courses?.filter(
        (c) => c.year_level === selectedYearLevel && c.semester.includes(selectedSemester.split(' ')[0])
    ) || [];

    const totalPrograms = programs.length;
    const totalCurriculaVersions = programs.reduce((acc, p) => acc + (p.curricula?.length || 1), 0);
    const totalActiveCurricula = programs.filter((p) => p.status === 'Active').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Programs & Curriculum - Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="space-y-6 p-6 font-['Poppins']">
                    {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Programs &amp; Curriculum</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Academic Blueprint
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Manage academic programs, curriculum versions, course structures, and year/semester maps for academic planning and semester scheduling.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
                        >
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>Import CSV</span>
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white text-xs font-semibold hover:opacity-95 shadow-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Program</span>
                        </button>
                    </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalPrograms}</div>
                            <div className="text-[11px] font-medium text-slate-500">Degree Programs</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-900 text-rose-100 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalCurriculaVersions}</div>
                            <div className="text-[11px] font-medium text-slate-500">Curriculum Versions</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalActiveCurricula}</div>
                            <div className="text-[11px] font-medium text-slate-500">Active Curricula</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">1</div>
                            <div className="text-[11px] font-medium text-slate-500">For Review / Draft</div>
                        </div>
                    </div>
                </div>

                {/* 2-Column Split: Program Selector (Left) & Large Workspace (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Panel: Academic Programs List */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Academic Programs</h3>
                            <p className="text-[11px] text-slate-500">Select a program to view and configure its active curricula.</p>
                        </div>

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchProgram}
                                onChange={(e) => setSearchProgram(e.target.value)}
                                placeholder="Filter by code or name..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            {programs
                                .filter((p) => p.code.toLowerCase().includes(searchProgram.toLowerCase()) || p.name.toLowerCase().includes(searchProgram.toLowerCase()))
                                .map((prog) => {
                                    const isSelected = prog.id === selectedProgramId;
                                    return (
                                        <div
                                            key={prog.id}
                                            onClick={() => setSelectedProgramId(prog.id)}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-slate-900 to-rose-950 text-white border-transparent shadow-md'
                                                    : 'bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm tracking-tight">{prog.code}</span>
                                                        <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                            4 yrs • {prog.degree_level}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                prog.status === 'Active'
                                                                    ? isSelected ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : isSelected ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                             }`}>
                                                            {prog.status}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs font-semibold mt-1 line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                        {prog.name}
                                                    </p>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-rose-300' : 'text-slate-400'}`} />
                                            </div>

                                            <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] ${isSelected ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
                                                <span>Curricula: <strong>{prog.curricula_count}</strong> ({prog.active_curricula_count} active)</span>
                                                <span>Courses: <strong>{prog.courses_count}</strong></span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Right Panel: Selected Program Curriculum Workspace */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Program Header Box */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-slate-900">{selectedProgram?.code} – {selectedProgram?.name}</h2>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {selectedProgram?.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Program Code: {selectedProgram?.code} | Program Type: {selectedProgram?.program_type} | Level: {selectedProgram?.degree_level}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Copy Version</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                                    >
                                        <Download className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Export</span>
                                    </button>
                                </div>
                            </div>

                            {/* Curriculum Workspace Tabs */}
                            <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold text-slate-600">
                                <button
                                    type="button"
                                    onClick={() => setActiveWorkspaceTab('overview')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeWorkspaceTab === 'overview'
                                            ? 'border-rose-900 text-rose-950 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <span>Overview</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveWorkspaceTab('curriculum')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeWorkspaceTab === 'curriculum'
                                            ? 'border-rose-900 text-rose-950 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Curriculum Matrix</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveWorkspaceTab('map')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeWorkspaceTab === 'map'
                                            ? 'border-rose-900 text-rose-950 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <Map className="w-3.5 h-3.5" />
                                    <span>Year &amp; Semester Map</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveWorkspaceTab('prereq')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeWorkspaceTab === 'prereq'
                                            ? 'border-rose-900 text-rose-950 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <span>Prerequisites</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveWorkspaceTab('history')}
                                    className={`px-3.5 py-2.5 border-b-2 -mb-px flex items-center gap-1.5 ${
                                        activeWorkspaceTab === 'history'
                                            ? 'border-rose-900 text-rose-950 font-bold'
                                            : 'border-transparent hover:text-slate-900'
                                    }`}
                                >
                                    <History className="w-3.5 h-3.5" />
                                    <span>Version History</span>
                                </button>
                            </div>

                            {/* Matrix Year & Semester Filter Bar */}
                            {activeWorkspaceTab === 'curriculum' && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                                            {[1, 2, 3, 4].map((year) => (
                                                <button
                                                    key={year}
                                                    type="button"
                                                    onClick={() => setSelectedYearLevel(year)}
                                                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                                        selectedYearLevel === year
                                                            ? 'bg-gradient-to-r from-slate-900 to-rose-950 text-white shadow-xs'
                                                            : 'hover:text-slate-900'
                                                    }`}
                                                >
                                                    {year === 1 ? '1st Year' : year === 2 ? '2nd Year' : year === 3 ? '3rd Year' : '4th Year'}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                                            {['1st Semester', '2nd Semester'].map((sem) => (
                                                <button
                                                    key={sem}
                                                    type="button"
                                                    onClick={() => setSelectedSemester(sem)}
                                                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                                        selectedSemester === sem
                                                            ? 'bg-white text-slate-900 shadow-xs'
                                                            : 'hover:text-slate-900'
                                                    }`}
                                                >
                                                    {sem}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Matrix Structured Table */}
                                    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                                <tr>
                                                    <th className="py-2.5 px-3">Code</th>
                                                    <th className="py-2.5 px-3">Course Title</th>
                                                    <th className="py-2.5 px-3 text-center">Units</th>
                                                    <th className="py-2.5 px-3 text-center">Lec</th>
                                                    <th className="py-2.5 px-3 text-center">Lab</th>
                                                    <th className="py-2.5 px-3">Prerequisite</th>
                                                    <th className="py-2.5 px-3 text-center">Status</th>
                                                    <th className="py-2.5 px-3 text-center">Credit Mapping</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredCourses.length > 0 ? (
                                                    filteredCourses.map((c) => (
                                                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="py-2.5 px-3 font-bold text-slate-900">{c.code}</td>
                                                            <td className="py-2.5 px-3 font-semibold text-slate-800">{c.title}</td>
                                                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{c.units}</td>
                                                            <td className="py-2.5 px-3 text-center text-slate-600">{c.lec}</td>
                                                            <td className="py-2.5 px-3 text-center text-slate-600">{c.lab}</td>
                                                            <td className="py-2.5 px-3 text-slate-500">{c.prerequisite}</td>
                                                            <td className="py-2.5 px-3 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                    <span>Mapped</span>
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="py-8 text-center text-slate-400">
                                                            No courses configured for {selectedYearLevel === 1 ? '1st Year' : `${selectedYearLevel}nd Year`}, {selectedSemester}.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeWorkspaceTab !== 'curriculum' && (
                                <div className="py-12 text-center text-slate-400 text-xs">
                                    Displaying {activeWorkspaceTab.toUpperCase()} configuration for {selectedProgram?.code}.
                                </div>
                            )}
                        </div>

                        {/* Program Summary Card Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2 text-xs">
                                <h4 className="font-bold text-slate-800 uppercase tracking-wider">Program Summary</h4>
                                <div className="space-y-1.5 text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Program Code:</span>
                                        <span className="font-bold text-slate-900">{selectedProgram?.code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Program Name:</span>
                                        <span className="font-bold text-slate-900">{selectedProgram?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Required Units:</span>
                                        <span className="font-bold text-slate-900">132 Units</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Courses:</span>
                                        <span className="font-bold text-slate-900">45 Courses</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2 text-xs">
                                <h4 className="font-bold text-slate-800 uppercase tracking-wider">Assigned Program Head</h4>
                                <div className="flex items-center gap-3 pt-1">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                        DR
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{selectedProgram?.program_head}</div>
                                        <div className="text-[11px] text-slate-500">Program Head, {selectedProgram?.code}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
