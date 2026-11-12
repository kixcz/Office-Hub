import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    Users, 
    Upload, 
    Plus, 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    BookOpen, 
    Sparkles, 
    Sliders, 
    ShieldCheck, 
    X,
    Save
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/faculty' },
    { title: 'Faculty', href: '/schedule/master-data/faculty' },
];

interface FacultyItem {
    id: number;
    name: string;
    avatar?: string;
    employee_id: string;
    email: string;
    program_code: string;
    program_name: string;
    employment_type: string;
    designation: string;
    min_load: number;
    target_load: number;
    max_load: number;
    assigned_load: number;
    specialization: string;
    specializations_count: number;
    preferences_count: number;
    availability_status: string;
    readiness: string;
    status: string;
    courses_taught_count: number;
}

interface FacultyMasterDataProps {
    currentPeriod: any;
    faculties: FacultyItem[];
}

export default function FacultyMasterDataPage({ currentPeriod, faculties }: FacultyMasterDataProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState('All');
    const [employmentFilter, setEmploymentFilter] = useState('All');
    const [selectedFaculty, setSelectedFaculty] = useState<FacultyItem | null>(faculties[0] || null);

    // Load Target Edit States for Selected Faculty
    const [isEditingBounds, setIsEditingBounds] = useState(false);
    const [loadBounds, setLoadBounds] = useState({
        min_load: selectedFaculty?.min_load || 9.0,
        target_load: selectedFaculty?.target_load || 12.0,
        max_load: selectedFaculty?.max_load || 15.0,
    });

    const totalFaculty = faculties.length;
    const fullTime = faculties.filter((f) => f.employment_type === 'Full-Time').length;
    const partTime = faculties.filter((f) => f.employment_type === 'Part-Time').length;
    const profilesComplete = faculties.filter((f) => f.readiness === 'Complete').length;
    const needsAttention = faculties.filter((f) => f.readiness !== 'Complete').length;

    const filteredFaculties = faculties.filter((f) => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              f.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProgram = programFilter === 'All' || f.program_code === programFilter;
        const matchesEmployment = employmentFilter === 'All' || f.employment_type === employmentFilter;
        return matchesSearch && matchesProgram && matchesEmployment;
    });

    const distinctPrograms = Array.from(new Set(faculties.map((f) => f.program_code)));

    const handleSaveLoadBounds = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFaculty) return;
        router.post(route('schedule.master-data.faculty.load-targets'), {
            faculty_id: selectedFaculty.id,
            min_load_hours: loadBounds.min_load,
            target_load_hours: loadBounds.target_load,
            max_load_hours: loadBounds.max_load,
        }, {
            onSuccess: () => setIsEditingBounds(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Scheduling Profiles - Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="space-y-6 p-6 font-['Poppins']">
                    {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Scheduling Profiles
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Maintain authoritative faculty scheduling profiles, workload limits, and teaching history for CP-SAT loading.
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
                            <span>Add Faculty</span>
                        </button>
                    </div>
                </div>

                {/* 5 Top Summary Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalFaculty}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Faculty</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{fullTime}</div>
                            <div className="text-[11px] font-medium text-slate-500">Full-Time</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{partTime}</div>
                            <div className="text-[11px] font-medium text-slate-500">Part-Time</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{profilesComplete}</div>
                            <div className="text-[11px] font-medium text-slate-500">Profiles Complete</div>
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

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search faculty name or ID..."
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
                        <span className="text-xs text-slate-500 font-medium">Employment:</span>
                        <select
                            value={employmentFilter}
                            onChange={(e) => setEmploymentFilter(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-white"
                        >
                            <option value="All">All Types</option>
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                        </select>
                    </div>
                </div>

                {/* Main Table & Side Drawer */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Faculty Table */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                    <tr>
                                        <th className="py-2.5 px-3">Faculty</th>
                                        <th className="py-2.5 px-3">Program</th>
                                        <th className="py-2.5 px-3">Employment</th>
                                        <th className="py-2.5 px-3 text-center">Target Load</th>
                                        <th className="py-2.5 px-3 text-center">Assigned</th>
                                        <th className="py-2.5 px-3 text-center">Readiness</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredFaculties.map((f) => {
                                        const isSelected = selectedFaculty?.id === f.id;
                                        return (
                                            <tr
                                                key={f.id}
                                                onClick={() => {
                                                    setSelectedFaculty(f);
                                                    setLoadBounds({
                                                        min_load: f.min_load,
                                                        target_load: f.target_load,
                                                        max_load: f.max_load,
                                                    });
                                                    setIsEditingBounds(false);
                                                }}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <td className="py-2.5 px-3">
                                                    <div className="font-bold text-slate-900">{f.name}</div>
                                                    <div className="text-[10px] text-slate-400">{f.employee_id} • {f.designation}</div>
                                                </td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-700">{f.program_code}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{f.employment_type}</td>
                                                <td className="py-2.5 px-3 text-center font-bold text-slate-900">{f.target_load.toFixed(1)} hrs</td>
                                                <td className="py-2.5 px-3 text-center text-slate-600">{f.assigned_load.toFixed(1)} hrs</td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        f.readiness === 'Complete'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {f.readiness}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Faculty Profile Detail Drawer */}
                    {selectedFaculty && (
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-base">{selectedFaculty.name}</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        {selectedFaculty.readiness}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">
                                    {selectedFaculty.designation} • {selectedFaculty.program_code}
                                </p>
                            </div>

                            {/* Workload Limits & Target Setting */}
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 uppercase tracking-wider">Workload Limits (Target Load)</h4>
                                    {!isEditingBounds ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingBounds(true)}
                                            className="text-[11px] font-bold text-rose-900 hover:underline"
                                        >
                                            Edit Limits
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingBounds(false)}
                                            className="text-[11px] font-medium text-slate-500 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>

                                {!isEditingBounds ? (
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                                            <div className="text-[10px] text-slate-400">Min Load</div>
                                            <div className="font-bold text-slate-800">{selectedFaculty.min_load.toFixed(1)} hrs</div>
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                                            <div className="text-[10px] text-slate-400">Target</div>
                                            <div className="font-bold text-rose-900">{selectedFaculty.target_load.toFixed(1)} hrs</div>
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                                            <div className="text-[10px] text-slate-400">Max Load</div>
                                            <div className="font-bold text-slate-800">{selectedFaculty.max_load.toFixed(1)} hrs</div>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveLoadBounds} className="space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[10px] text-slate-500">Min (hrs)</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={loadBounds.min_load}
                                                    onChange={(e) => setLoadBounds({ ...loadBounds, min_load: parseFloat(e.target.value) })}
                                                    className="w-full mt-1 p-1 text-center font-bold border border-slate-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500">Target (hrs)</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={loadBounds.target_load}
                                                    onChange={(e) => setLoadBounds({ ...loadBounds, target_load: parseFloat(e.target.value) })}
                                                    className="w-full mt-1 p-1 text-center font-bold border border-slate-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500">Max (hrs)</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={loadBounds.max_load}
                                                    onChange={(e) => setLoadBounds({ ...loadBounds, max_load: parseFloat(e.target.value) })}
                                                    className="w-full mt-1 p-1 text-center font-bold border border-slate-300 rounded-md"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-rose-950 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Save Workload Bounds</span>
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Quick Indicators */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-rose-900 shrink-0" />
                                    <div>
                                        <div className="font-bold text-slate-800">{selectedFaculty.specializations_count} Areas</div>
                                        <div className="text-[10px] text-slate-400">Specializations</div>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                        <div className="font-bold text-slate-800">{selectedFaculty.preferences_count} Subjects</div>
                                        <div className="text-[10px] text-slate-400">Preferences</div>
                                    </div>
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
