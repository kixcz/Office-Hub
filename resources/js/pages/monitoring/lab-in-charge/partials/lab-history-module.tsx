import React, { useState, useMemo } from 'react';
import {
    History,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    Search,
    Filter,
    ChevronDown,
    MoreHorizontal,
    X,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Users,
    Table as TableIcon,
    LayoutGrid,
    CalendarDays,
    Radio,
    BookOpen,
    Building2,
    ArrowUpRight,
    Eye,
    ShieldAlert,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HistoricalSessionItem } from '../index';

export interface MonitoringHistoryRecord {
    id: number;
    date: string; // "Oct 24, 2026"
    time: string; // "07:30 – 09:00 AM"
    actual_time?: string; // "09:05 AM – 10:30 AM"
    duration?: string; // "1 hour 25 minutes"
    lab: string; // "CLR 1"
    course_code: string; // "IT 635"
    course_title?: string; // "Capstone Project 3"
    section: string; // "DIT 2A"
    program: string; // "BSIT"
    faculty: string; // "Carl Ohmar Montoya"
    monitoring_status: 'In Progress' | 'Completed' | 'Late Start' | 'Unmonitored' | 'Transferred' | 'No Faculty Observed' | 'Switched Online';
    observed_by: string; // "Ace Fuentes"
    observed_at?: string; // "08:12 AM"
    session_type: string; // "Laboratory Class"
    schedule_source: string; // "Master Timetable v1"
    academic_period: string; // "AY 2026–2027 · 1st Sem"
    expected_students: number; // 40
    room_status_note: string; // "In Use (as scheduled)"
    attendance: string; // "Present"
    remarks: string; // "Class ongoing normally."
    photo_url?: string | null;
}

interface LabHistoryModuleProps {
    assignedRooms: any[];
    historicalSessions: HistoricalSessionItem[];
    currentUserName?: string;
    onRequestCorrection?: (session: HistoricalSessionItem) => void;
}

export default function LabHistoryModule({
    assignedRooms = [],
    historicalSessions = [],
    currentUserName = 'Ace Fuentes',
    onRequestCorrection,
}: LabHistoryModuleProps) {
    // 1. Controls & Filter States
    const [dateRange, setDateRange] = useState('Oct 19 – Oct 25, 2026');
    const [viewMode, setViewMode] = useState<'table' | 'timeline' | 'calendar'>('table');
    const [selectedLab, setSelectedLab] = useState('all');
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'details' | 'monitoring' | 'history'>('details');
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    // 2. Map server historicalSessions
    const recordsList: MonitoringHistoryRecord[] = useMemo(() => {
        if (!historicalSessions || historicalSessions.length === 0) {
            return [];
        }

        return historicalSessions.map((h, i) => {
            let status: MonitoringHistoryRecord['monitoring_status'] = 'Completed';
            const outcome = (h.session_outcome || '').toLowerCase();
            if (outcome.includes('progress')) status = 'In Progress';
            else if (outcome.includes('late') || h.late_minutes > 0) status = 'Late Start';
            else if (outcome.includes('unmonitored') || outcome.includes('no record')) status = 'Unmonitored';
            else if (outcome.includes('transfer')) status = 'Transferred';
            else if (outcome.includes('online')) status = 'Switched Online';
            else if (outcome.includes('absent') || outcome.includes('no faculty')) status = 'No Faculty Observed';

            return {
                id: h.id || i + 100,
                date: h.monitoring_date,
                time: h.scheduled_time,
                actual_time: h.actual_time,
                duration: `${h.observed_minutes || 90} minutes`,
                lab: h.room_name,
                course_code: h.course_code,
                course_title: h.course_code,
                section: h.section,
                program: h.section.includes('BSIT') ? 'BSIT' : h.section.includes('BSIS') ? 'BSIS' : 'DIT',
                faculty: h.expected_faculty,
                monitoring_status: status,
                observed_by: h.monitored_by || currentUserName,
                observed_at: h.actual_time ? h.actual_time.split('–')[0].trim() : '08:00 AM',
                session_type: 'Laboratory Class',
                schedule_source: 'Master Timetable v1',
                academic_period: 'AY 2026–2027 · 1st Sem',
                expected_students: 40,
                room_status_note: h.room_condition || 'In Use (as scheduled)',
                attendance: h.late_minutes > 0 ? `Late (+${h.late_minutes}m)` : 'Present',
                remarks: h.remarks || 'Session audit record recorded.',
                photo_url: h.photo_url || null,
            };
        });
    }, [historicalSessions, currentUserName]);

    // Dynamic Filter Option Lists from actual data & assigned rooms
    const availableLabs = useMemo(() => {
        const set = new Set<string>();
        assignedRooms.forEach((r) => set.add(r.name));
        recordsList.forEach((r) => set.add(r.lab));
        return Array.from(set).sort();
    }, [assignedRooms, recordsList]);

    const availableFaculties = useMemo(() => {
        const set = new Set<string>();
        recordsList.forEach((r) => {
            if (r.faculty) set.add(r.faculty);
        });
        return Array.from(set).sort();
    }, [recordsList]);

    const availableCourses = useMemo(() => {
        const set = new Set<string>();
        recordsList.forEach((r) => {
            if (r.course_code) set.add(r.course_code);
        });
        return Array.from(set).sort();
    }, [recordsList]);

    // KPI Metrics derived dynamically from recordsList
    const kpiMetrics = useMemo(() => {
        const total = recordsList.length;
        const verified = recordsList.filter((r) => r.monitoring_status === 'Completed').length;
        const pending = recordsList.filter((r) => r.monitoring_status === 'In Progress' || r.monitoring_status === 'Unmonitored').length;
        const discrepancies = recordsList.filter((r) =>
            r.monitoring_status === 'Transferred' ||
            r.monitoring_status === 'No Faculty Observed' ||
            r.monitoring_status === 'Late Start' ||
            r.monitoring_status === 'Switched Online'
        ).length;
        const monitoredByYou = recordsList.filter((r) =>
            r.observed_by.toLowerCase().trim() === currentUserName.toLowerCase().trim()
        ).length;

        const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
        const byYouPct = total > 0 ? Math.round((monitoredByYou / total) * 100) : 0;

        return {
            total,
            verified,
            verifiedPct,
            pending,
            discrepancies,
            monitoredByYou,
            byYouPct,
        };
    }, [recordsList, currentUserName]);

    // 4. Filtering
    const filteredRecords = useMemo(() => {
        return recordsList.filter((item) => {
            if (selectedLab !== 'all' && item.lab !== selectedLab) return false;
            if (selectedFaculty !== 'all' && item.faculty !== selectedFaculty) return false;
            if (selectedCourse !== 'all' && item.course_code !== selectedCourse) return false;
            if (selectedStatus !== 'all' && item.monitoring_status !== selectedStatus) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchLab = item.lab.toLowerCase().includes(q);
                const matchCourse = item.course_code.toLowerCase().includes(q);
                const matchSec = item.section.toLowerCase().includes(q);
                const matchFac = item.faculty.toLowerCase().includes(q);
                const matchStatus = item.monitoring_status.toLowerCase().includes(q);
                const matchObserved = item.observed_by.toLowerCase().includes(q);
                if (!matchLab && !matchCourse && !matchSec && !matchFac && !matchStatus && !matchObserved) {
                    return false;
                }
            }

            return true;
        });
    }, [recordsList, selectedLab, selectedFaculty, selectedCourse, selectedStatus, searchQuery]);

    // Filter check and reset helper
    const hasActiveFilters = useMemo(() => {
        return (
            selectedLab !== 'all' ||
            selectedFaculty !== 'all' ||
            selectedCourse !== 'all' ||
            selectedStatus !== 'all' ||
            searchQuery.trim().length > 0
        );
    }, [selectedLab, selectedFaculty, selectedCourse, selectedStatus, searchQuery]);

    const handleClearFilters = () => {
        setSelectedLab('all');
        setSelectedFaculty('all');
        setSelectedCourse('all');
        setSelectedStatus('all');
        setSearchQuery('');
    };

    // Active record for the slide-over drawer
    const activeRecord = useMemo(() => {
        if (!selectedRecordId) return null;
        return recordsList.find((r) => r.id === selectedRecordId) || null;
    }, [selectedRecordId, recordsList]);

    // Helper for Status Badge Rendering
    const renderStatusBadge = (status: MonitoringHistoryRecord['monitoring_status']) => {
        switch (status) {
            case 'In Progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        In Progress
                    </span>
                );
            case 'Completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Completed
                    </span>
                );
            case 'Late Start':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Late Start
                    </span>
                );
            case 'Unmonitored':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Unmonitored
                    </span>
                );
            case 'Transferred':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        Transferred
                    </span>
                );
            case 'No Faculty Observed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        No Faculty Observed
                    </span>
                );
            case 'Switched Online':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Switched Online
                    </span>
                );
        }
    };

    // Export handler
    const handleExport = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* 1. MODULE-SPECIFIC HEADER (Orange rounded history icon + "Monitoring History" + Subtitle + Date Stepper + Export button) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
                        <History className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                            Monitoring History
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            View the complete audit trail of all recorded observations in your assigned laboratories.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    {/* Date Stepper */}
                    <div className="flex items-center bg-background border border-input rounded-xl shadow-2xs p-1">
                        <button
                            type="button"
                            onClick={() => setDateRange('Oct 12 – Oct 18, 2026')}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-2 px-2.5 text-xs font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{dateRange}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDateRange('Oct 26 – Nov 01, 2026')}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Export Button */}
                    <Button
                        onClick={handleExport}
                        className="h-10 px-4 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs rounded-xl gap-2 transition-all"
                    >
                        <Download className="h-4 w-4 stroke-[2.5]" />
                        Export
                    </Button>
                </div>
            </div>

            {/* 2. FILTER DROPDOWNS ROW */}
            <div className="bg-card border rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                    {/* Date Range Select */}
                    <div className="relative">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-semibold shadow-2xs">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{dateRange}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                        </div>
                    </div>

                    {/* Laboratory Select */}
                    <div className="relative">
                        <select
                            value={selectedLab}
                            onChange={(e) => setSelectedLab(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Assigned Labs ({availableLabs.length})</option>
                            {availableLabs.map((lab) => (
                                <option key={lab} value={lab}>
                                    {lab}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Faculty Select */}
                    <div className="relative">
                        <select
                            value={selectedFaculty}
                            onChange={(e) => setSelectedFaculty(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Faculty ({availableFaculties.length})</option>
                            {availableFaculties.map((fac) => (
                                <option key={fac} value={fac}>
                                    {fac}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Course / Section Select */}
                    <div className="relative">
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Courses ({availableCourses.length})</option>
                            {availableCourses.map((crs) => (
                                <option key={crs} value={crs}>
                                    {crs}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Monitoring Status Select */}
                    <div className="relative">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Completed">Completed</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Late Start">Late Start</option>
                            <option value="Unmonitored">Unmonitored</option>
                            <option value="Transferred">Transferred</option>
                            <option value="No Faculty Observed">No Faculty Observed</option>
                            <option value="Switched Online">Switched Online</option>
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* More Filters Button */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-2xs"
                        onClick={handleClearFilters}
                    >
                        <Filter className="h-3.5 w-3.5" />
                        {hasActiveFilters ? 'Reset Filters' : 'All Filters'}
                    </Button>
                </div>
            </div>

            {/* 3. 5 KPI CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Records */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-blue-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{kpiMetrics.total}</div>
                        <div className="text-xs font-bold text-foreground">Total Records</div>
                        <div className="text-[11px] text-muted-foreground">observations recorded</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-500 border border-blue-200/60 flex items-center justify-center shrink-0 dark:bg-blue-950/40 dark:border-blue-900/40">
                        <FileText className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>

                {/* 2. Verified Records */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-emerald-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{kpiMetrics.verified}</div>
                        <div className="text-xs font-bold text-foreground">Verified Records</div>
                        <div className="text-[11px] text-muted-foreground">{kpiMetrics.verifiedPct}% of total</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-200/60 flex items-center justify-center shrink-0 dark:bg-emerald-950/40 dark:border-emerald-900/40">
                        <CheckCircle2 className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>

                {/* 3. Pending Verification */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{kpiMetrics.pending}</div>
                        <div className="text-xs font-bold text-foreground">Pending Verification</div>
                        <div className="text-[11px] text-muted-foreground">in progress / unmonitored</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center shrink-0 dark:bg-amber-950/40 dark:border-amber-900/40">
                        <Clock className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>

                {/* 4. Discrepancies */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-rose-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{kpiMetrics.discrepancies}</div>
                        <div className="text-xs font-bold text-foreground">Discrepancies</div>
                        <div className="text-[11px] text-muted-foreground">exceptions noted</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-500 border border-rose-200/60 flex items-center justify-center shrink-0 dark:bg-rose-950/40 dark:border-rose-900/40">
                        <AlertTriangle className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>

                {/* 5. Monitored by You */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-blue-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{kpiMetrics.monitoredByYou}</div>
                        <div className="text-xs font-bold text-foreground">Monitored by You</div>
                        <div className="text-[11px] text-muted-foreground">{kpiMetrics.byYouPct}% of total records</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-500 border border-blue-200/60 flex items-center justify-center shrink-0 dark:bg-blue-950/40 dark:border-blue-900/40">
                        <Users className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>
            </div>

            {/* 4. MAIN CONTENT AREA: TABLE AND SLIDE-OVER DRAWER */}
            <div className="flex flex-col xl:flex-row items-start gap-4">
                {/* Left: Table Container */}
                <div className="flex-1 w-full space-y-3 min-w-0">
                    {/* Section Header with View Mode Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <FileText className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-foreground">Monitoring Records</h2>
                                <p className="text-[11px] text-muted-foreground">
                                    Complete list of session observations and their verification status.
                                </p>
                            </div>
                        </div>

                        {/* View Switcher: Table View | Timeline View | Calendar View */}
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    'h-7.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                                    viewMode === 'table'
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <TableIcon className="h-3.5 w-3.5" />
                                Table View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('timeline')}
                                className={cn(
                                    'h-7.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                                    viewMode === 'timeline'
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                Timeline View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('calendar')}
                                className={cn(
                                    'h-7.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                                    viewMode === 'calendar'
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Calendar View
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <th className="py-3 px-3 text-center w-8">
                                            <input type="checkbox" className="rounded border-input text-amber-500 focus:ring-amber-500" />
                                        </th>
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Time</th>
                                        <th className="py-3 px-3">Lab</th>
                                        <th className="py-3 px-3">Course / Section</th>
                                        <th className="py-3 px-3">Faculty</th>
                                        <th className="py-3 px-3">Monitoring Status</th>
                                        <th className="py-3 px-3">Observed By</th>
                                        <th className="py-3 px-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-xs">
                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 flex items-center justify-center mb-3 shadow-xs">
                                                        <History className="h-7 w-7 stroke-[1.8]" />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-foreground mb-1">
                                                        {hasActiveFilters ? 'No Matching Records Found' : 'No Monitoring History Recorded'}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                                        {hasActiveFilters
                                                            ? 'No historical monitoring logs match your active filter criteria. Try resetting or adjusting your filters.'
                                                            : 'Historical observation logs and lab monitoring records will appear here as sessions are completed and verified.'}
                                                    </p>
                                                    {hasActiveFilters && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleClearFilters}
                                                            className="h-8 text-xs font-semibold rounded-xl"
                                                        >
                                                            Reset All Filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map((record) => {
                                            const isSelected = selectedRecordId === record.id;

                                            return (
                                                <tr
                                                    key={record.id}
                                                    onClick={() => {
                                                        setSelectedRecordId(record.id);
                                                        setIsDrawerOpen(true);
                                                    }}
                                                    className={cn(
                                                        'transition-colors cursor-pointer group',
                                                        isSelected
                                                            ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500'
                                                            : 'hover:bg-muted/40'
                                                    )}
                                                >
                                                    {/* Checkbox */}
                                                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                setSelectedRecordId(record.id);
                                                                setIsDrawerOpen(true);
                                                            }}
                                                            className="rounded border-input text-amber-500 focus:ring-amber-500"
                                                        />
                                                    </td>

                                                    {/* Date */}
                                                    <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">
                                                        {record.date}
                                                    </td>

                                                    {/* Time */}
                                                    <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                                        {record.time}
                                                    </td>

                                                    {/* Lab */}
                                                    <td className="py-3 px-3 font-black text-foreground whitespace-nowrap">
                                                        {record.lab}
                                                    </td>

                                                    {/* Course / Section */}
                                                    <td className="py-3 px-3">
                                                        <div className="font-bold text-foreground">{record.course_code}</div>
                                                        <div className="text-[11px] text-muted-foreground">{record.section}</div>
                                                    </td>

                                                    {/* Faculty */}
                                                    <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">
                                                        {record.faculty}
                                                    </td>

                                                    {/* Monitoring Status */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        {renderStatusBadge(record.monitoring_status)}
                                                    </td>

                                                    {/* Observed By */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <div className="font-semibold text-foreground">{record.observed_by}</div>
                                                        {record.observed_at && (
                                                            <div className="text-[11px] text-muted-foreground font-mono">{record.observed_at}</div>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedRecordId(record.id);
                                                                setIsDrawerOpen(true);
                                                            }}
                                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-3.5 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div>
                                Showing 1 to {Math.min(filteredRecords.length, rowsPerPage)} of {filteredRecords.length} records
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled
                                        className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground/50 cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        className="h-7 w-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-2xs"
                                    >
                                        1
                                    </button>
                                    <button
                                        type="button"
                                        className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground font-semibold"
                                    >
                                        2
                                    </button>
                                    <button
                                        type="button"
                                        className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground font-semibold"
                                    >
                                        3
                                    </button>
                                    <button
                                        type="button"
                                        className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground font-semibold"
                                    >
                                        4
                                    </button>
                                    <button
                                        type="button"
                                        className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground font-semibold"
                                    >
                                        5
                                    </button>
                                    <button
                                        type="button"
                                        className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs">
                                    <span>Rows per page</span>
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                        className="h-7 text-xs font-semibold rounded-lg border border-input bg-background px-2"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Slide-Over / Static Details Panel (Matches Right Panel in screenshot) */}
                {isDrawerOpen && activeRecord && (
                    <div className="w-full xl:w-[380px] bg-card border rounded-2xl shadow-xs overflow-hidden shrink-0">
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                            <div>
                                <h2 className="text-base font-black text-foreground">Session Details</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 sm:p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {/* Top Badge & Time */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    {renderStatusBadge(activeRecord.monitoring_status)}
                                    <span className="text-[11px] font-mono text-muted-foreground">
                                        {activeRecord.date} · {activeRecord.time}
                                    </span>
                                </div>
                                <div className="text-2xl font-black tracking-tight text-foreground pt-1">
                                    {activeRecord.course_code}
                                </div>
                                <div className="text-xs font-semibold text-muted-foreground">
                                    {activeRecord.course_title}
                                </div>
                                <div className="flex items-center gap-1.5 pt-1">
                                    <Badge className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5">
                                        {activeRecord.section}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] text-purple-700 border-purple-300 dark:text-purple-400 dark:border-purple-800">
                                        {activeRecord.session_type}
                                    </Badge>
                                </div>
                            </div>

                            {/* Tabs: Details | Monitoring | History */}
                            <div className="flex items-center border-b text-xs font-bold gap-6">
                                <button
                                    type="button"
                                    onClick={() => setDrawerTab('details')}
                                    className={cn(
                                        'pb-2.5 transition-colors relative',
                                        drawerTab === 'details'
                                            ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Details
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDrawerTab('monitoring')}
                                    className={cn(
                                        'pb-2.5 transition-colors relative',
                                        drawerTab === 'monitoring'
                                            ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Monitoring
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDrawerTab('history')}
                                    className={cn(
                                        'pb-2.5 transition-colors relative',
                                        drawerTab === 'history'
                                            ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    History
                                </button>
                            </div>

                            {/* Key-Value Fields */}
                            <div className="space-y-2.5 text-xs divide-y divide-border/60">
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        Laboratory
                                    </span>
                                    <span className="font-bold text-foreground">{activeRecord.lab} (Main)</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                        Faculty
                                    </span>
                                    <span className="font-bold text-foreground">{activeRecord.faculty}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Program</span>
                                    <span className="font-semibold text-foreground">{activeRecord.program}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        Scheduled Time
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">{activeRecord.time}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Actual Time</span>
                                    <span className="font-mono font-semibold text-foreground">{activeRecord.actual_time}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-medium text-foreground">{activeRecord.duration}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Session Type</span>
                                    <span className="font-medium text-foreground">{activeRecord.session_type}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Schedule Source</span>
                                    <span className="font-semibold text-foreground inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer">
                                        {activeRecord.schedule_source}
                                        <ExternalLink className="h-3 w-3" />
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Academic Period</span>
                                    <span className="font-medium text-foreground">{activeRecord.academic_period}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Expected Students</span>
                                    <span className="font-bold text-foreground">{activeRecord.expected_students}</span>
                                </div>
                            </div>

                            {/* Monitoring Status Banner */}
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3">
                                <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Monitoring Status</div>
                                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                                        {activeRecord.monitoring_status}
                                    </div>
                                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                        Class was conducted as scheduled.
                                    </div>
                                </div>
                            </div>

                            {/* Observation Summary */}
                            <div className="space-y-2 text-xs pt-1">
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                                    Observation Summary
                                </div>
                                <div className="space-y-1.5 divide-y divide-border/60">
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-muted-foreground">Observed By</span>
                                        <span className="font-bold text-foreground">{activeRecord.observed_by}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-muted-foreground">Observed At</span>
                                        <span className="font-mono text-foreground">{activeRecord.observed_at}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-muted-foreground">Room Status</span>
                                        <span className="font-medium text-foreground">{activeRecord.room_status_note}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-muted-foreground">Attendance</span>
                                        <span className="font-bold text-emerald-600">{activeRecord.attendance}</span>
                                    </div>
                                    <div className="py-1.5 space-y-1">
                                        <span className="text-muted-foreground block">Remarks</span>
                                        <div className="p-2 rounded-lg bg-muted/40 text-foreground text-xs leading-relaxed">
                                            {activeRecord.remarks}
                                        </div>
                                    </div>

                                    {/* Photo Evidence */}
                                    <div className="py-2 space-y-1.5">
                                        <span className="text-muted-foreground block">Photo / Evidence</span>
                                        {activeRecord.photo_url ? (
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={activeRecord.photo_url}
                                                    alt="Observation Evidence"
                                                    className="h-12 w-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setImagePreviewUrl(activeRecord.photo_url!)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setImagePreviewUrl(activeRecord.photo_url!)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    View Photo
                                                    <ExternalLink className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-2.5 rounded-lg border border-dashed text-center text-muted-foreground text-xs">
                                                No photographic evidence attached for this session.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* View Full Record Button */}
                            <div className="pt-2">
                                <Button
                                    variant="outline"
                                    className="w-full h-9.5 text-xs font-bold border-border hover:bg-muted text-foreground rounded-xl gap-1.5 shadow-2xs"
                                    onClick={() => {
                                        alert(`Opening full audit trail record for ${activeRecord.course_code} (${activeRecord.date}).`);
                                    }}
                                >
                                    View Full Record
                                    <ExternalLink className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Photo Preview Modal */}
            {imagePreviewUrl && (
                <div
                    className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setImagePreviewUrl(null)}
                >
                    <div className="relative max-w-2xl max-h-[85vh] bg-background rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-3 border-b">
                            <span className="text-xs font-bold text-foreground">Session Photo Evidence</span>
                            <button
                                type="button"
                                onClick={() => setImagePreviewUrl(null)}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-3">
                            <img
                                src={imagePreviewUrl}
                                alt="Observation Evidence High Resolution"
                                className="max-h-[60vh] w-auto mx-auto object-contain rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
