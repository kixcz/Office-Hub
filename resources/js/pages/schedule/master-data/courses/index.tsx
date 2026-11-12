import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { 
    BookOpen, 
    Upload, 
    Plus, 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    Layers, 
    FlaskConical,
    X,
    Sparkles,
    ShieldCheck,
    Clock
} from 'lucide-react';

interface CourseItem {
    id: number;
    code: string;
    title: string;
    program_code: string;
    program_name: string;
    units: number;
    lec: number;
    lab: number;
    type: string;
    prerequisite: string;
    credit_mapping: string;
    readiness: string;
    description?: string;
    historical_faculty: string[];
}

interface CoursesCatalogProps {
    currentPeriod: any;
    courses: CourseItem[];
}

export default function CoursesCatalogPage({ currentPeriod, courses }: CoursesCatalogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [readinessFilter, setReadinessFilter] = useState('All');
    const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(courses[0] || null);

    const totalCourses = courses.length;
    const lectureOnly = courses.filter((c) => c.type === 'Lecture').length;
    const withLab = courses.filter((c) => c.type === 'Laboratory').length;
    const readyForScheduling = courses.filter((c) => c.readiness === 'Ready').length;
    const needsAttention = courses.filter((c) => c.readiness !== 'Ready').length;

    const filteredCourses = courses.filter((c) => {
        const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProgram = programFilter === 'All' || c.program_code === programFilter;
        const matchesType = typeFilter === 'All' || c.type === typeFilter;
        const matchesReadiness = readinessFilter === 'All' || c.readiness === readinessFilter;
        return matchesSearch && matchesProgram && matchesType && matchesReadiness;
    });

    const distinctPrograms = Array.from(new Set(courses.map((c) => c.program_code)));

    return (
        <SchedulingWorkspaceLayout>
            <Head title="Courses Catalog - Master Data" />

            <div className="space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Courses</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    College Course Catalog
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Manage the college-wide course catalog and ensure each course is ready for scheduling.
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
                            <span>Add Course</span>
                        </button>
                    </div>
                </div>

                {/* 5 Top Summary Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalCourses}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Courses</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{lectureOnly}</div>
                            <div className="text-[11px] font-medium text-slate-500">Lecture Only</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{withLab}</div>
                            <div className="text-[11px] font-medium text-slate-500">With Laboratory</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{readyForScheduling}</div>
                            <div className="text-[11px] font-medium text-slate-500">Scheduling Ready</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{needsAttention}</div>
                            <div className="text-[11px] font-medium text-slate-500">Needs Attention</div>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search course code or title..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Program:</span>
                        <select
                            value={programFilter}
                            onChange={(e) => setProgramFilter(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                            <option value="All">All Programs</option>
                            {distinctPrograms.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Course Type:</span>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                            <option value="All">All Types</option>
                            <option value="Lecture">Lecture</option>
                            <option value="Laboratory">Laboratory</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Readiness:</span>
                        <select
                            value={readinessFilter}
                            onChange={(e) => setReadinessFilter(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                            <option value="All">All</option>
                            <option value="Ready">Ready</option>
                            <option value="Missing Mapping">Needs Mapping</option>
                        </select>
                    </div>
                </div>

                {/* Main Table & Side Drawer */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Courses Table */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-2.5 px-3">Code</th>
                                        <th className="py-2.5 px-3">Course Title</th>
                                        <th className="py-2.5 px-3 text-center">Units</th>
                                        <th className="py-2.5 px-3 text-center">Lec</th>
                                        <th className="py-2.5 px-3 text-center">Lab</th>
                                        <th className="py-2.5 px-3">Type</th>
                                        <th className="py-2.5 px-3">Prerequisites</th>
                                        <th className="py-2.5 px-3 text-center">Readiness</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCourses.map((c) => {
                                        const isSelected = selectedCourse?.id === c.id;
                                        return (
                                            <tr
                                                key={c.id}
                                                onClick={() => setSelectedCourse(c)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{c.code}</td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-800">{c.title}</td>
                                                <td className="py-2.5 px-3 text-center font-bold text-slate-900">{c.units}</td>
                                                <td className="py-2.5 px-3 text-center text-slate-600">{c.lec}</td>
                                                <td className="py-2.5 px-3 text-center text-slate-600">{c.lab}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                        c.type === 'Laboratory' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                        {c.type}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-500">{c.prerequisite}</td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        c.readiness === 'Ready'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {c.readiness}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right-Side Course Detail Drawer */}
                    {selectedCourse && (
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-base">{selectedCourse.code}</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        {selectedCourse.readiness}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">{selectedCourse.title}</p>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Owning Program</span>
                                    <span className="font-bold text-slate-900">{selectedCourse.program_name} ({selectedCourse.program_code})</span>
                                </div>

                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Units (Lec/Lab)</span>
                                    <span className="font-bold text-slate-900">{selectedCourse.units} ({selectedCourse.lec} Lec, {selectedCourse.lab} Lab)</span>
                                </div>

                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Course Type</span>
                                    <span className="font-bold text-slate-900">{selectedCourse.type}</span>
                                </div>

                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Prerequisite</span>
                                    <span className="font-bold text-slate-900">{selectedCourse.prerequisite}</span>
                                </div>

                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Credit Mapping</span>
                                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>{selectedCourse.credit_mapping}</span>
                                    </span>
                                </div>

                                {/* Historical Faculty Teaching Match (Signal for CP-SAT) */}
                                <div className="pt-2">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Historical Teaching Experience
                                    </div>
                                    {selectedCourse.historical_faculty.length > 0 ? (
                                        <div className="space-y-1">
                                            {selectedCourse.historical_faculty.map((f, i) => (
                                                <div key={i} className="p-2 rounded-lg bg-slate-50 text-slate-700 flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span>{f} (Previous Instructor)</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 italic text-[11px]">No previous semester records logged.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SchedulingWorkspaceLayout>
    );
}

