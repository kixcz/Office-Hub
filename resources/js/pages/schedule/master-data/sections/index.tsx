import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { 
    Table as TableIcon, 
    Upload, 
    Plus, 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    Users, 
    Layers, 
    ChevronRight,
    RefreshCw,
    BookOpen
} from 'lucide-react';

interface RequiredCourse {
    id: number;
    code: string;
    title: string;
    units: number;
    instructor: string;
}

interface SectionItem {
    id: number;
    section: string;
    program_code: string;
    year_level: string;
    students: number;
    curriculum: string;
    adviser: string;
    status: string;
    readiness: string;
    required_courses: RequiredCourse[];
}

interface SectionsPageProps {
    currentPeriod: any;
    programs: any[];
    sections: SectionItem[];
}

export default function SectionsMasterDataPage({ currentPeriod, programs, sections }: SectionsPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('All');
    const [selectedSection, setSelectedSection] = useState<SectionItem | null>(sections[0] || null);

    const totalSections = sections.length;
    const totalStudents = sections.reduce((acc, s) => acc + s.students, 0);
    const readyForScheduling = sections.filter((s) => s.readiness === 'Ready').length;
    const incompleteSections = sections.filter((s) => s.readiness !== 'Ready').length;

    const filteredSections = sections.filter((s) => {
        const matchesSearch = s.section.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.adviser.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProgram = selectedProgram === 'All' || s.program_code === selectedProgram;
        return matchesSearch && matchesProgram;
    });

    const distinctPrograms = Array.from(new Set(sections.map((s) => s.program_code)));

    return (
        <SchedulingWorkspaceLayout>
            <Head title="Sections - Master Data" />

            <div className="space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <TableIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sections</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Student Cohorts
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Manage student cohorts and sections per program, year level, and curriculum for semester timetable generation.
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
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
                        >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Generate Sections</span>
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white text-xs font-semibold hover:opacity-95 shadow-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Section</span>
                        </button>
                    </div>
                </div>

                {/* 5 Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <TableIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalSections}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Sections</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-900 text-rose-100 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{distinctPrograms.length}</div>
                            <div className="text-[11px] font-medium text-slate-500">Programs Represented</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalStudents}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Students</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{readyForScheduling}</div>
                            <div className="text-[11px] font-medium text-slate-500">Ready for Scheduling</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{incompleteSections}</div>
                            <div className="text-[11px] font-medium text-slate-500">Incomplete Sections</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search section (e.g., 1A, 2B)..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Program:</span>
                        <select
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                            <option value="All">All Programs</option>
                            {distinctPrograms.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main Content & Right Drawer */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Sections Table */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-2.5 px-3">Section</th>
                                        <th className="py-2.5 px-3">Program</th>
                                        <th className="py-2.5 px-3">Year Level</th>
                                        <th className="py-2.5 px-3 text-center">Students</th>
                                        <th className="py-2.5 px-3">Curriculum</th>
                                        <th className="py-2.5 px-3">Adviser</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                        <th className="py-2.5 px-3 text-center">Readiness</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSections.map((s) => {
                                        const isSelected = selectedSection?.id === s.id;
                                        return (
                                            <tr
                                                key={s.id}
                                                onClick={() => setSelectedSection(s)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{s.section}</td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-700">{s.program_code}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{s.year_level}</td>
                                                <td className="py-2.5 px-3 text-center font-bold text-slate-900">{s.students}</td>
                                                <td className="py-2.5 px-3 text-slate-500">{s.curriculum}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{s.adviser}</td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        s.readiness === 'Ready'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {s.readiness}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section Detail & Demand Courses Drawer */}
                    {selectedSection && (
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-base">{selectedSection.section}</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        {selectedSection.readiness}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">
                                    {selectedSection.program_code} • {selectedSection.year_level} ({selectedSection.students} Enrolled)
                                </p>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Curriculum Version</span>
                                    <span className="font-bold text-slate-900">{selectedSection.curriculum}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Section Adviser</span>
                                    <span className="font-bold text-slate-900">{selectedSection.adviser}</span>
                                </div>
                            </div>

                            {/* Required Courses (Demand Dataset for Scheduler) */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    <span>Required Courses Demand</span>
                                    <span className="text-[11px] text-slate-400 font-normal">
                                        {selectedSection.required_courses.length} courses
                                    </span>
                                </div>

                                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                    {selectedSection.required_courses.map((rc) => (
                                        <div key={rc.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-slate-800">{rc.code}</div>
                                                <div className="text-[11px] text-slate-500 line-clamp-1">{rc.title}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-bold text-slate-900">{rc.units} units</div>
                                                <div className="text-[10px] text-slate-400">{rc.instructor}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SchedulingWorkspaceLayout>
    );
}

