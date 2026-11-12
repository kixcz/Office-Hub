import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { 
    Sliders, 
    Search, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    Layers, 
    Edit, 
    Check, 
    X,
    Save,
    BookOpen
} from 'lucide-react';

interface FacultyPreferenceRow {
    id: number;
    name: string;
    avatar?: string;
    program_code: string;
    subjects_count: number;
    preferred_time: string;
    avoid_time: string;
    preferred_room: string;
    preferred_min_load: number;
    preferred_max_load: number;
    preferred_preps: number;
    status: string;
}

interface PreferencesPageProps {
    currentPeriod: any;
    faculties: FacultyPreferenceRow[];
}

export default function FacultyPreferencesPage({ currentPeriod, faculties }: PreferencesPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState<FacultyPreferenceRow | null>(faculties[0] || null);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        preferred_min_load: selectedFaculty?.preferred_min_load || 9.0,
        preferred_max_load: selectedFaculty?.preferred_max_load || 15.0,
        preferred_max_preparations: selectedFaculty?.preferred_preps || 3,
        avoid_early_morning: false,
        avoid_late_evening: true,
    });

    const totalFaculty = faculties.length;
    const withPreferences = faculties.filter((f) => f.status === 'Complete').length;
    const partiallySet = faculties.filter((f) => f.status === 'Partial').length;
    const notYetSet = totalFaculty - withPreferences - partiallySet;

    const filteredFaculties = faculties.filter((f) => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.program_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSavePreferences = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFaculty) return;
        router.post(route('schedule.master-data.faculty-preferences.update'), {
            faculty_id: selectedFaculty.id,
            ...editData,
        }, {
            onSuccess: () => setIsEditing(false),
        });
    };

    return (
        <SchedulingWorkspaceLayout>
            <Head title="Faculty Preferences - Master Data" />

            <div className="space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                            <Sliders className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty Preferences</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Soft Optimization Inputs
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Capture faculty scheduling preferences, preferred time windows, and target preparations to guide CP-SAT optimization.
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
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{withPreferences}</div>
                            <div className="text-[11px] font-medium text-slate-500">Preferences Complete</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{partiallySet}</div>
                            <div className="text-[11px] font-medium text-slate-500">Partially Set</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900">{notYetSet}</div>
                            <div className="text-[11px] font-medium text-slate-500">Not Yet Set</div>
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
                            placeholder="Search faculty name or program..."
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
                                        <th className="py-2.5 px-3">Preference Summary</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
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
                                                    setEditData({
                                                        preferred_min_load: f.preferred_min_load,
                                                        preferred_max_load: f.preferred_max_load,
                                                        preferred_max_preparations: f.preferred_preps,
                                                        avoid_early_morning: false,
                                                        avoid_late_evening: true,
                                                    });
                                                    setIsEditing(false);
                                                }}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 font-bold text-slate-900">{f.name}</td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-700">{f.program_code}</td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                    <span className="flex items-center gap-2">
                                                        <span>{f.subjects_count} Subjects</span> • 
                                                        <span>{f.preferred_time.split(' ')[0]}</span> • 
                                                        <span>{f.preferred_min_load} - {f.preferred_max_load} hrs</span>
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        f.status === 'Complete'
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

                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 uppercase tracking-wider">Teaching &amp; Schedule Preferences</h4>
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="text-[11px] font-bold text-rose-900 hover:underline"
                                        >
                                            Edit Preferences
                                        </button>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <div className="space-y-2 text-slate-600">
                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                            <div className="font-bold text-slate-800">Preferred Schedule Window</div>
                                            <div className="text-[11px] text-slate-600">{selectedFaculty.preferred_time}</div>
                                            <div className="text-[10px] text-slate-400">Avoid: {selectedFaculty.avoid_time}</div>
                                        </div>

                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                            <div className="font-bold text-slate-800">Target Load Range</div>
                                            <div className="text-[11px] text-slate-600">
                                                {selectedFaculty.preferred_min_load} – {selectedFaculty.preferred_max_load} hrs/wk (Max {selectedFaculty.preferred_preps} preparations)
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSavePreferences} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-slate-500">Min Load (hrs)</label>
                                                <input
                                                    type="number"
                                                    value={editData.preferred_min_load}
                                                    onChange={(e) => setEditData({ ...editData, preferred_min_load: parseFloat(e.target.value) })}
                                                    className="w-full mt-1 p-1.5 border border-slate-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500">Max Load (hrs)</label>
                                                <input
                                                    type="number"
                                                    value={editData.preferred_max_load}
                                                    onChange={(e) => setEditData({ ...editData, preferred_max_load: parseFloat(e.target.value) })}
                                                    className="w-full mt-1 p-1.5 border border-slate-300 rounded-lg"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-slate-500">Max Course Preparations</label>
                                            <input
                                                type="number"
                                                value={editData.preferred_max_preparations}
                                                onChange={(e) => setEditData({ ...editData, preferred_max_preparations: parseInt(e.target.value) })}
                                                className="w-full mt-1 p-1.5 border border-slate-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-rose-950 text-white font-semibold"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SchedulingWorkspaceLayout>
    );
}

