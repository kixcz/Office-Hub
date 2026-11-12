import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { 
    Sparkles, 
    Search, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Layers, 
    Plus, 
    Trash2, 
    Edit, 
    Check, 
    X,
    Filter
} from 'lucide-react';

interface SpecializationItem {
    id: number;
    area: string;
    level: string; // Primary, Secondary, Familiar
    order: number;
    status: string; // Verified, For Review
}

interface FacultySpecializationRow {
    id: number;
    name: string;
    avatar?: string;
    program_code: string;
    specializations: SpecializationItem[];
    total_specializations: number;
    status: string;
    reviewed_by: string;
    updated_at: string;
}

interface SpecializationsPageProps {
    currentPeriod: any;
    faculties: FacultySpecializationRow[];
}

export default function FacultySpecializationsPage({ currentPeriod, faculties }: SpecializationsPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState<FacultySpecializationRow | null>(faculties[0] || null);

    const totalFaculty = faculties.length;
    const withSpecs = faculties.filter((f) => f.total_specializations > 0).length;
    const completionRate = totalFaculty > 0 ? Math.round((withSpecs / totalFaculty) * 100) : 95;
    const forReviewCount = faculties.filter((f) => f.status === 'For Review').length;

    const filteredFaculties = faculties.filter((f) => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              f.specializations.some((s) => s.area.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const handleVerifySpecialization = (specId: number, status: 'Verified' | 'For Review') => {
        router.post(route('schedule.master-data.faculty-specializations.verify'), {
            specialization_id: specId,
            status,
        });
    };

    return (
        <SchedulingWorkspaceLayout>
            <Head title="Faculty Specializations - Master Data" />

            <div className="space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty Specializations</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Course Match Taxonomy
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Manage faculty-declared areas of expertise for CP-SAT qualification and course matching.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{totalFaculty}</div>
                            <div className="text-[11px] font-medium text-slate-500">Total Faculty</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-900 text-rose-100 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{withSpecs}</div>
                            <div className="text-[11px] font-medium text-slate-500">With Specializations</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{completionRate}%</div>
                            <div className="text-[11px] font-medium text-slate-500">Completion Rate</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{forReviewCount}</div>
                            <div className="text-[11px] font-medium text-slate-500">For Review / Pending</div>
                        </div>
                    </div>
                </div>

                {/* Filter Search Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search faculty or specialization area..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
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
                                        <th className="py-2.5 px-3">Top Specializations</th>
                                        <th className="py-2.5 px-3 text-center">Total</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredFaculties.map((f) => {
                                        const isSelected = selectedFaculty?.id === f.id;
                                        return (
                                            <tr
                                                key={f.id}
                                                onClick={() => setSelectedFaculty(f)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{f.name}</td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-700">{f.program_code}</td>
                                                <td className="py-2.5 px-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {f.specializations.slice(0, 3).map((s, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                                                {s.area}
                                                            </span>
                                                        ))}
                                                        {f.specializations.length > 3 && (
                                                            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200/70 text-slate-600 font-bold">
                                                                +{f.specializations.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-bold text-slate-900">{f.total_specializations}</td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        f.status === 'Verified'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {f.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Side Drawer */}
                    {selectedFaculty && (
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                            <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-base">{selectedFaculty.name}</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        {selectedFaculty.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">Faculty • {selectedFaculty.program_code}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    <span>Specializations ({selectedFaculty.specializations.length})</span>
                                </div>

                                <div className="space-y-2">
                                    {selectedFaculty.specializations.map((spec) => (
                                        <div key={spec.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-slate-800">{spec.area}</div>
                                                <div className="text-[10px] text-slate-500">{spec.level} Expertise</div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    spec.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {spec.status}
                                                </span>
                                                {spec.status !== 'Verified' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerifySpecialization(spec.id, 'Verified')}
                                                        className="p-1 rounded hover:bg-emerald-100 text-emerald-700"
                                                        title="Verify Specialization"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                                    <div>Reviewed by: <strong>{selectedFaculty.reviewed_by}</strong></div>
                                    <div>Last Updated: {selectedFaculty.updated_at}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SchedulingWorkspaceLayout>
    );
}

