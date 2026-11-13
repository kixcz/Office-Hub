import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Table,
    Lock,
    Save,
    RotateCcw,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Search,
    Filter,
    Eye,
    ChevronRight,
    Send,
    Edit3,
    History,
    Users,
    Building2,
    Calendar,
    Clock,
    X,
    Check,
    AlertCircle,
    UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Timetable Generation', href: '/schedule/timetable/generator' },
    { title: 'Timetable Editor', href: '/schedule/timetable/editor' },
];

interface ScheduleItem {
    id: number;
    course_code: string;
    course_title?: string;
    section: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_name: string;
    faculty_id?: number | null;
    instructor?: string;
    display_instructor?: string;
    faculty?: {
        id: number;
        full_name: string;
        title_name?: string;
        academic_rank?: string;
    } | null;
}

interface AuditLogEntry {
    id: number;
    user_name: string;
    action: string;
    target_id: number;
    details: string;
    payload?: any;
    created_at: string;
    relative_time: string;
}

interface TimetableEditorProps {
    currentPeriod: any;
    loadingGate: any;
    schedules: ScheduleItem[];
    editAuditLogs?: AuditLogEntry[];
    availableRooms?: string[];
    availableFaculty?: Array<{
        id: number;
        name: string;
        academic_rank?: string;
    }>;
}

export default function TimetableEditorPage({
    currentPeriod,
    loadingGate,
    schedules = [],
    editAuditLogs = [],
    availableRooms = [],
    availableFaculty = [],
}: TimetableEditorProps) {
    const [selectedView, setSelectedView] = useState<'grid' | 'table' | 'history'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDay, setFilterDay] = useState('All');
    const [filterRoom, setFilterRoom] = useState('All');

    // Selected class for inspector & drawer
    const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(schedules[0] || null);

    // Editing modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
    const [editForm, setEditForm] = useState({
        day_of_week: 'Monday',
        start_time: '07:30:00',
        end_time: '09:00:00',
        room_name: '',
        faculty_id: '' as string | number,
        change_reason: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [validationResult, setValidationResult] = useState<{ is_valid: boolean; conflicts: string[] } | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const timeSlots = [
        { label: '7:30 - 9:00 AM', start: '07:30:00', end: '09:00:00' },
        { label: '9:00 - 10:30 AM', start: '09:00:00', end: '10:30:00' },
        { label: '10:30 - 12:00 PM', start: '10:30:00', end: '12:00:00' },
        { label: '1:00 - 2:30 PM', start: '13:00:00', end: '14:30:00' },
        { label: '2:30 - 4:00 PM', start: '14:30:00', end: '16:00:00' },
        { label: '4:00 - 5:30 PM', start: '16:00:00', end: '17:30:00' },
        { label: '5:30 - 7:00 PM', start: '17:30:00', end: '19:00:00' },
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Filter schedules
    const filteredSchedules = useMemo(() => {
        return schedules.filter((s) => {
            if (filterDay !== 'All' && s.day_of_week !== filterDay) return false;
            if (filterRoom !== 'All' && s.room_name !== filterRoom) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const instructor = s.faculty?.title_name || s.display_instructor || s.instructor || '';
                return (
                    s.course_code.toLowerCase().includes(q) ||
                    (s.course_title && s.course_title.toLowerCase().includes(q)) ||
                    s.section.toLowerCase().includes(q) ||
                    s.room_name.toLowerCase().includes(q) ||
                    instructor.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [schedules, filterDay, filterRoom, searchQuery]);

    const handleOpenEdit = (item: ScheduleItem) => {
        setEditingItem(item);
        setEditForm({
            day_of_week: item.day_of_week || 'Monday',
            start_time: item.start_time || '07:30:00',
            end_time: item.end_time || '09:00:00',
            room_name: item.room_name || '',
            faculty_id: item.faculty_id || '',
            change_reason: '',
        });
        setValidationResult(null);
        setShowEditModal(true);
    };

    const handleValidateMove = async () => {
        if (!editingItem) return;
        setIsValidating(true);
        try {
            const res = await fetch('/schedule/timetable/editor/validate-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
                body: JSON.stringify({
                    schedule_id: editingItem.id,
                    day_of_week: editForm.day_of_week,
                    start_time: editForm.start_time,
                    end_time: editForm.end_time,
                    room_name: editForm.room_name,
                    faculty_id: editForm.faculty_id || null,
                }),
            });
            const data = await res.json();
            setValidationResult(data);
        } catch (e) {
            console.error('Validation error:', e);
        } finally {
            setIsValidating(false);
        }
    };

    const handleSaveSchedule = () => {
        if (!editingItem) return;
        setIsSaving(true);
        router.post(
            '/schedule/timetable/editor/save-changes',
            {
                schedule_id: editingItem.id,
                day_of_week: editForm.day_of_week,
                start_time: editForm.start_time,
                end_time: editForm.end_time,
                room_name: editForm.room_name,
                faculty_id: editForm.faculty_id || null,
                change_reason: editForm.change_reason,
            },
            {
                onSuccess: () => {
                    setShowEditModal(false);
                    setIsSaving(false);
                },
                onError: () => {
                    setIsSaving(false);
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Timetable Editor - Timetable Generation" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="space-y-6 p-4 sm:p-6 font-['Poppins']">
                    {/* Permanent Faculty Loading Status Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-rose-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5 text-rose-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">Faculty Loading</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                        Locked v3
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300">
                                    Live timetable editor with real-time collision detection and audit-traced edits.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href="/schedule/loading-review"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 shrink-0"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Loading Reference</span>
                            </a>
                        </div>
                    </div>

                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                                <Table className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Timetable Editor
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        Active Editor
                                    </span>
                                    {editAuditLogs.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#8B1E3F] border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                                            {editAuditLogs.length} Edits Traced
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    Interactive schedule editor. Every day, time, room, or faculty change is checked for conflicts and attributed to your user account.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedView('grid')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        selectedView === 'grid'
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                                            : 'hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    Weekly Grid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedView('table')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        selectedView === 'table'
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                                            : 'hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    Class List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedView('history')}
                                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                        selectedView === 'history'
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                                            : 'hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <History className="w-3.5 h-3.5" />
                                    <span>Audit Trail ({editAuditLogs.length})</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs">
                            <div className="text-[11px] text-slate-500">Total Classes</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{schedules.length}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs">
                            <div className="text-[11px] text-slate-500">Assigned Faculty</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                                {schedules.filter((s) => s.faculty_id).length}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs">
                            <div className="text-[11px] text-slate-500">Unassigned Faculty</div>
                            <div className="text-lg font-bold text-amber-600 mt-0.5">
                                {schedules.filter((s) => !s.faculty_id).length}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs">
                            <div className="text-[11px] text-slate-500">Assigned Rooms</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                                {schedules.filter((s) => s.room_name && s.room_name !== '—').length}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs">
                            <div className="text-[11px] text-slate-500">Editor Traceability</div>
                            <div className="text-lg font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Enabled
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span>Day:</span>
                                <select
                                    value={filterDay}
                                    onChange={(e) => setFilterDay(e.target.value)}
                                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    <option value="All">All Days</option>
                                    {days.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span>Room:</span>
                                <select
                                    value={filterRoom}
                                    onChange={(e) => setFilterRoom(e.target.value)}
                                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    <option value="All">All Rooms</option>
                                    {Array.from(new Set(schedules.map((s) => s.room_name).filter(Boolean))).map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="relative min-w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search course, section, instructor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    {/* View 1: Weekly Grid View with interactive clickable schedule blocks */}
                    {selectedView === 'grid' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Calendar Grid */}
                            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Interactive Timetable Grid
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        Click any class box to edit time, room, or faculty
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-center text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="py-2.5 px-3 text-left w-28">Time Slot</th>
                                                {days.map((d) => (
                                                    <th key={d} className="py-2.5 px-3">{d}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {timeSlots.map((slot) => (
                                                <tr key={slot.start} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                                                    <td className="py-2.5 px-3 text-left text-[11px] font-medium text-slate-500 whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/20">
                                                        {slot.label}
                                                    </td>
                                                    {days.map((day) => {
                                                        const matches = filteredSchedules.filter((s) => {
                                                            if (s.day_of_week !== day) return false;
                                                            return (
                                                                (s.start_time >= slot.start && s.start_time < slot.end) ||
                                                                (s.start_time <= slot.start && s.end_time > slot.start)
                                                            );
                                                        });

                                                        return (
                                                            <td key={day} className="p-1.5 align-top min-w-[120px]">
                                                                <div className="space-y-1.5">
                                                                    {matches.map((item) => {
                                                                        const isSelected = selectedClass?.id === item.id;
                                                                        const instructor = item.faculty?.title_name || item.display_instructor || item.instructor || 'Unassigned';

                                                                        return (
                                                                            <div
                                                                                key={item.id}
                                                                                onClick={() => {
                                                                                    setSelectedClass(item);
                                                                                }}
                                                                                className={`p-2 rounded-xl text-left cursor-pointer transition-all border ${
                                                                                    isSelected
                                                                                        ? 'bg-rose-50 border-[#8B1E3F] text-slate-900 shadow-sm ring-1 ring-[#8B1E3F]'
                                                                                        : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center justify-between font-bold text-[11px]">
                                                                                    <span>{item.course_code}</span>
                                                                                    <span className="text-[9px] px-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                                                                        {item.room_name || 'No Room'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-500 truncate">
                                                                                    {item.section}
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                                                                                    {instructor}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Side Inspector & Edit Panel */}
                            {selectedClass ? (
                                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
                                    <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-base">{selectedClass.course_code}</h3>
                                            <Badge variant="outline" className="border-white/20 text-white text-[10px]">
                                                {selectedClass.section}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-300">
                                            {selectedClass.course_title || 'Course Offering'}
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500">Day & Time:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {selectedClass.day_of_week}, {selectedClass.start_time} - {selectedClass.end_time}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500">Room:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {selectedClass.room_name || 'Unassigned'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-500">Assigned Faculty:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {selectedClass.faculty?.title_name || selectedClass.display_instructor || selectedClass.instructor || 'Unassigned'}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleOpenEdit(selectedClass)}
                                        className="w-full gap-2 bg-[#8B1E3F] text-xs font-semibold text-white hover:bg-[#721833]"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit Time, Room or Faculty</span>
                                    </Button>

                                    {/* Recent edit history for this item */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <History className="w-3.5 h-3.5 text-[#8B1E3F]" />
                                            <span>Recent Edits Trace</span>
                                        </div>
                                        {editAuditLogs.filter((log) => log.target_id === selectedClass.id).length > 0 ? (
                                            <div className="space-y-2">
                                                {editAuditLogs
                                                    .filter((log) => log.target_id === selectedClass.id)
                                                    .map((log) => (
                                                        <div
                                                            key={log.id}
                                                            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between font-bold">
                                                                <span className="text-slate-900 dark:text-white">{log.user_name}</span>
                                                                <span className="text-slate-400">{log.relative_time}</span>
                                                            </div>
                                                            <p className="text-slate-600 dark:text-slate-300 text-[10px]">
                                                                {log.details}
                                                            </p>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 italic">
                                                No edits logged for this class yet. Edits made will appear here with user attribution.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
                                    Select a class on the grid to inspect details or make changes.
                                </div>
                            )}
                        </div>
                    )}

                    {/* View 2: Class List Table with Direct Edit Buttons */}
                    {selectedView === 'table' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                    <tr>
                                        <th className="px-4 py-3">Course Code</th>
                                        <th className="px-4 py-3">Course Title</th>
                                        <th className="px-3 py-3 text-center">Section</th>
                                        <th className="px-3 py-3">Day</th>
                                        <th className="px-3 py-3">Time</th>
                                        <th className="px-3 py-3">Room</th>
                                        <th className="px-4 py-3">Instructor</th>
                                        <th className="px-3 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredSchedules.map((item) => {
                                        const instructor = item.faculty?.title_name || item.display_instructor || item.instructor || 'Unassigned';
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                                                    {item.course_code}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                    {item.course_title || '—'}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                                                    {item.section}
                                                </td>
                                                <td className="px-3 py-2.5 font-medium">{item.day_of_week}</td>
                                                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                                    {item.start_time} - {item.end_time}
                                                </td>
                                                <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    {item.room_name || '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                                                    {instructor}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="h-7 text-xs gap-1 border-slate-200 text-slate-700 hover:text-[#8B1E3F] hover:border-[#8B1E3F]"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        <span>Edit</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* View 3: Audit Trail Log (Traceability View) */}
                    {selectedView === 'history' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <History className="w-4 h-4 text-[#8B1E3F]" />
                                        <span>Timetable Change Audit Trail</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Complete log of every human modification made to the timetable, showing who edited what, when, and why.
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {editAuditLogs.length} Total Logged Actions
                                </Badge>
                            </div>

                            {editAuditLogs.length > 0 ? (
                                <div className="space-y-3">
                                    {editAuditLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                                    <UserCheck className="w-4 h-4 text-[#8B1E3F]" />
                                                    <span>{log.user_name}</span>
                                                    <span className="font-normal text-slate-400">•</span>
                                                    <Badge variant="outline" className="text-[10px] font-semibold">
                                                        {log.action}
                                                    </Badge>
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {log.created_at} ({log.relative_time})
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                                {log.details}
                                            </div>

                                            {log.payload?.reason && (
                                                <div className="text-[11px] text-slate-500 italic">
                                                    Stated Reason: "{log.payload.reason}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400 text-xs">
                                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    No timetable edits have been recorded yet. Click on any schedule to edit time, room, or faculty to test the live audit tracer.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Edit Schedule Modal */}
                {showEditModal && editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Edit Timetable Schedule
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {editingItem.course_code} • {editingItem.section} ({editingItem.course_title || 'Class'})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4 text-xs">
                                {/* Day of week */}
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Day of the Week
                                    </label>
                                    <select
                                        value={editForm.day_of_week}
                                        onChange={(e) => setEditForm({ ...editForm, day_of_week: e.target.value })}
                                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        {days.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Time slot */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={editForm.start_time.slice(0, 5)}
                                            onChange={(e) => setEditForm({ ...editForm, start_time: `${e.target.value}:00` })}
                                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={editForm.end_time.slice(0, 5)}
                                            onChange={(e) => setEditForm({ ...editForm, end_time: `${e.target.value}:00` })}
                                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                </div>

                                {/* Room */}
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Assigned Room
                                    </label>
                                    <select
                                        value={editForm.room_name}
                                        onChange={(e) => setEditForm({ ...editForm, room_name: e.target.value })}
                                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <option value="">— Select Room —</option>
                                        {availableRooms.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Faculty */}
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Assigned Faculty
                                    </label>
                                    <select
                                        value={editForm.faculty_id}
                                        onChange={(e) => setEditForm({ ...editForm, faculty_id: e.target.value })}
                                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <option value="">— Unassigned Faculty —</option>
                                        {availableFaculty.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name} ({f.academic_rank || 'Faculty'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason for Edit (Traceability) */}
                                <div>
                                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Reason for Modification (Audit Trail)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Deconflicting laboratory, requested by Dean..."
                                        value={editForm.change_reason}
                                        onChange={(e) => setEditForm({ ...editForm, change_reason: e.target.value })}
                                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#8B1E3F] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    />
                                </div>

                                {/* Live Validation Section */}
                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Pre-Save Conflict Verification
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleValidateMove}
                                            disabled={isValidating}
                                            className="text-[11px] font-bold text-[#8B1E3F] hover:underline"
                                        >
                                            {isValidating ? 'Checking...' : 'Check Conflicts'}
                                        </button>
                                    </div>

                                    {validationResult && (
                                        <div
                                            className={`p-3 rounded-xl text-xs space-y-1 ${
                                                validationResult.is_valid
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                            }`}
                                        >
                                            <div className="font-bold flex items-center gap-1.5">
                                                {validationResult.is_valid ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        <span>No scheduling conflicts detected! Safe to save.</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-4 h-4 text-rose-600" />
                                                        <span>Conflicts detected:</span>
                                                    </>
                                                )}
                                            </div>
                                            {!validationResult.is_valid && (
                                                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                                                    {validationResult.conflicts.map((c, idx) => (
                                                        <li key={idx}>{c}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEditModal(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveSchedule}
                                    disabled={isSaving}
                                    className="bg-[#8B1E3F] text-xs font-semibold text-white hover:bg-[#721833] gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSaving ? 'Saving...' : 'Save & Trace Edit'}</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
