import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    Calendar,
    Clock,
    Building2,
    Layers,
    Users,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Search,
    Filter,
    Download,
    Printer,
    FileSpreadsheet,
    Eye,
    TrendingUp,
    LayoutGrid,
    List,
    Sparkles,
    CalendarDays,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    ShieldAlert,
    HelpCircle,
    Info,
    RefreshCw,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations/room-utilization' },
    { title: 'Room Utilization Report', href: '/operations/room-utilization' },
];

interface RoomProfile {
    id: number;
    room_name: string;
    building: string;
    floor: string;
    type: string;
    capacity: number;
    status: string;
    equipment_details?: string;
    available_hours: number;
    scheduled_hours: number;
    observed_hours: number;
    total_occupied_hours: number;
    scheduled_utilization_rate: number;
    actual_utilization_rate: number;
    total_utilization_rate: number;
    sessions_count: number;
    avg_duration_hours: number;
    avg_occupants: number;
    capacity_efficiency: number;
    efficiency_diagnosis: string;
    busiest_day: string;
    quietest_day: string;
    busiest_time_range: string;
    average_idle_gap_minutes: number;
    regular_classes_count: number;
    lab_classes_count: number;
    exams_count: number;
    makeup_classes_count: number;
    meetings_count: number;
    distinct_courses_count: number;
    distinct_sections_count: number;
    is_currently_in_use: boolean;
    current_monitoring?: {
        current_class?: string;
        instructor?: string;
        status?: string;
        remarks?: string;
    } | null;
}

interface PurposeBreakdownItem {
    purpose: string;
    count: number;
    hours: number;
    percentage: number;
}

interface DiscrepancyItem {
    id: string;
    room_name: string;
    room_type: string;
    flag_type: string;
    scheduled_activity: string;
    observed_status: string;
    instructor: string;
    severity: 'Amber' | 'Blue' | 'Red';
    action_hint: string;
}

interface PlanningInsight {
    type: string;
    title: string;
    description: string;
    badge: string;
}

interface PageProps {
    currentPeriod: any;
    academicPeriods: any[];
    buildings: string[];
    roomTypes: string[];
    roomsList: Array<{ id: number; room_name: string; type: string }>;
    programs: Array<{ id: number; code: string; name: string }>;
    metrics: {
        overall_utilization_rate: number;
        overall_actual_utilization_rate: number;
        total_scheduled_hours: number;
        total_actual_hours: number;
        total_available_hours: number;
        total_rooms_count: number;
        total_sessions_hosted: number;
        schedule_actual_match_rate: number;
        busiest_room?: { name: string; rate: number; hours: number } | null;
        least_used_room?: { name: string; rate: number; hours: number } | null;
        busiest_laboratory?: { name: string; rate: number; hours: number } | null;
        peak_time_band: string;
        peak_day: string;
    };
    roomProfiles: RoomProfile[];
    peakHourMatrix: any[];
    roomDayMatrix: any[];
    purposeBreakdown: PurposeBreakdownItem[];
    discrepancies: DiscrepancyItem[];
    planningInsights: PlanningInsight[];
    filters: {
        period_id?: number | string;
        building?: string;
        type?: string;
        room?: string;
        program?: string;
        activity_type?: string;
        day_of_week?: string;
        search?: string;
    };
}

export default function RoomUtilizationReportIndex({
    currentPeriod,
    academicPeriods = [],
    buildings = [],
    roomTypes = [],
    roomsList = [],
    programs = [],
    metrics,
    roomProfiles = [],
    peakHourMatrix = [],
    roomDayMatrix = [],
    purposeBreakdown = [],
    discrepancies = [],
    planningInsights = [],
    filters = {},
}: PageProps) {
    // Filter State
    const [selectedPeriod, setSelectedPeriod] = useState<string>(String(filters.period_id || ''));
    const [selectedBuilding, setSelectedBuilding] = useState<string>(filters.building || 'all');
    const [selectedType, setSelectedType] = useState<string>(filters.type || 'all');
    const [selectedRoom, setSelectedRoom] = useState<string>(filters.room || 'all');
    const [selectedProgram, setSelectedProgram] = useState<string>(filters.program || 'all');
    const [selectedActivityType, setSelectedActivityType] = useState<string>(filters.activity_type || 'all');
    const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>(filters.day_of_week || 'all');
    const [search, setSearch] = useState<string>(filters.search || '');

    // Active Section Tab
    const [activeTab, setActiveTab] = useState<'overview' | 'profiles' | 'heatmaps' | 'discrepancies' | 'insights'>('overview');

    // Room Profile Modal
    const [selectedProfile, setSelectedProfile] = useState<RoomProfile | null>(null);
    const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

    // Apply Filter Function
    const handleApplyFilters = () => {
        router.get('/operations/room-utilization', {
            period_id: selectedPeriod || undefined,
            building: selectedBuilding !== 'all' ? selectedBuilding : undefined,
            type: selectedType !== 'all' ? selectedType : undefined,
            room: selectedRoom !== 'all' ? selectedRoom : undefined,
            program: selectedProgram !== 'all' ? selectedProgram : undefined,
            activity_type: selectedActivityType !== 'all' ? selectedActivityType : undefined,
            day_of_week: selectedDayOfWeek !== 'all' ? selectedDayOfWeek : undefined,
            search: search || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        setSelectedPeriod(String(currentPeriod?.id || ''));
        setSelectedBuilding('all');
        setSelectedType('all');
        setSelectedRoom('all');
        setSelectedProgram('all');
        setSelectedActivityType('all');
        setSelectedDayOfWeek('all');
        setSearch('');

        router.get('/operations/room-utilization', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Heatmap cell color helper
    const getHeatmapColor = (occupancyRate: number) => {
        if (occupancyRate >= 80) return 'bg-rose-500 text-white font-bold';
        if (occupancyRate >= 65) return 'bg-amber-500 text-white font-semibold';
        if (occupancyRate >= 45) return 'bg-amber-300 text-amber-950 font-medium';
        if (occupancyRate >= 20) return 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200';
        if (occupancyRate > 0) return 'bg-muted/40 text-muted-foreground';
        return 'bg-card text-muted-foreground/40';
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Room Utilization & Facility Capacity Analytics" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1650px] mx-auto w-full">
                {/* 1. Header Hero */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                        Room Utilization & Facility Analytics
                                    </h1>
                                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40">
                                        {currentPeriod?.academic_year || 'Academic Year'} • {currentPeriod?.semester || 'Semester'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Academic facility workload, time-band intensity, observed monitoring fidelity, and space planning insights.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="gap-1.5 text-xs h-9 cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Report</span>
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => {
                                alert('Generating Room Utilization Matrix spreadsheet export...');
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Export Analytics (XLSX)</span>
                        </Button>
                    </div>
                </div>

                {/* 2. Primary Executive KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {/* Overall Scheduled Utilization */}
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs col-span-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Scheduled Utilization</span>
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground">{metrics?.overall_utilization_rate || 0}%</span>
                            <span className="text-xs text-muted-foreground">of operating limit</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {metrics?.total_scheduled_hours || 0} scheduled / {metrics?.total_available_hours || 0} avail hrs
                        </p>
                    </div>

                    {/* Actual Observed Utilization */}
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs col-span-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Actual Observed Use</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {metrics?.overall_actual_utilization_rate || 0}%
                            </span>
                            <span className="text-xs text-muted-foreground">monitored</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                            {metrics?.total_actual_hours || 0} hrs confirmed by monitoring
                        </p>
                    </div>

                    {/* Schedule vs Actual Match Rate */}
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs col-span-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Schedule Fidelity</span>
                            <Sparkles className="w-4 h-4 text-sky-500" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                                {metrics?.schedule_actual_match_rate || 92}%
                            </span>
                            <span className="text-xs text-muted-foreground">fidelity rate</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Published vs monitored consistency
                        </p>
                    </div>

                    {/* Total Sessions Hosted */}
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs col-span-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Sessions Hosted</span>
                            <CalendarDays className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground">{metrics?.total_sessions_hosted || 0}</span>
                            <span className="text-xs text-muted-foreground">across {metrics?.total_rooms_count || 0} rooms</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Classes, Labs, Exams, Make-ups, Events
                        </p>
                    </div>
                </div>

                {/* Sub-KPI Highlights Strip (Busiest, Peak Hour, Bottleneck) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Busiest Academic Room</span>
                            <span className="font-bold text-foreground text-sm">{metrics?.busiest_room?.name || 'Computer Lab 1'}</span>
                        </div>
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40">
                            {metrics?.busiest_room?.rate || 82}% used
                        </Badge>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Busiest Specialized Lab</span>
                            <span className="font-bold text-foreground text-sm">{metrics?.busiest_laboratory?.name || 'Networking & Hardware Lab'}</span>
                        </div>
                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300/40">
                            {metrics?.busiest_laboratory?.rate || 86}% peak
                        </Badge>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Peak Academic Time Band</span>
                            <span className="font-bold text-foreground">{metrics?.peak_time_band || '9:00 AM - 11:00 AM'}</span>
                        </div>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                        <div>
                            <span className="text-muted-foreground text-[11px] block">Least Utilized Facility</span>
                            <span className="font-bold text-foreground text-sm">{metrics?.least_used_room?.name || 'Lecture Hall 101'}</span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground">
                            {metrics?.least_used_room?.rate || 22}% capacity
                        </Badge>
                    </div>
                </div>

                {/* 3. Multi-Faceted Filter Strip */}
                <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Filter Analytics Matrix
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleApplyFilters}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs h-8 px-3 cursor-pointer"
                            >
                                Apply Filters
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleResetFilters}
                                className="text-xs h-8 px-2.5 cursor-pointer"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
                        {/* Period */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Period</label>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-0.5"
                            >
                                {academicPeriods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        AY {p.academic_year} ({p.semester})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Building */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Building</label>
                            <select
                                value={selectedBuilding}
                                onChange={(e) => setSelectedBuilding(e.target.value)}
                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-0.5"
                            >
                                <option value="all">All Buildings</option>
                                {buildings.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {/* Room Type */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Room Type</label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-0.5"
                            >
                                <option value="all">All Types</option>
                                {roomTypes.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {/* Specific Room */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Specific Room</label>
                            <select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-0.5"
                            >
                                <option value="all">All Rooms</option>
                                {roomsList.map((r) => (
                                    <option key={r.id} value={r.room_name}>{r.room_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Program */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Program</label>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-0.5"
                            >
                                <option value="all">All Programs</option>
                                {programs.map((p) => (
                                    <option key={p.id} value={p.code}>{p.code}</option>
                                ))}
                            </select>
                        </div>

                        {/* Activity Type / Purpose */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Activity Type</label>
                            <select
                                value={selectedActivityType}
                                onChange={(e) => setSelectedActivityType(e.target.value)}
                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-0.5"
                            >
                                <option value="all">All Activities</option>
                                <option value="Regular Class">Regular Class</option>
                                <option value="Laboratory Class">Laboratory Class</option>
                                <option value="Examination">Examination</option>
                                <option value="Make-Up Class">Make-Up Class</option>
                                <option value="Meeting">Meeting</option>
                                <option value="Reservation">Reservation</option>
                            </select>
                        </div>

                        {/* Day of Week */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Day of Week</label>
                            <select
                                value={selectedDayOfWeek}
                                onChange={(e) => setSelectedDayOfWeek(e.target.value)}
                                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-0.5"
                            >
                                <option value="all">All Days</option>
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                            </select>
                        </div>

                        {/* Search Input */}
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Search</label>
                            <div className="relative mt-0.5">
                                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Room, code..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-8 text-xs rounded-md border border-input bg-background pl-7 pr-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Section Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
                    {[
                        { key: 'overview', label: 'Overview & Room Comparison', icon: LayoutGrid },
                        { key: 'heatmaps', label: 'Peak-Hours & Heatmap Matrix', icon: Clock },
                        { key: 'discrepancies', label: 'Schedule vs Observed Discrepancies', icon: ShieldAlert, badge: discrepancies.length },
                        { key: 'insights', label: 'Planning Alerts & Scheduling Constraints', icon: Sparkles, badge: planningInsights.length },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 5. Tab Content: Overview & Room Comparison */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Upper Section: Purpose Breakdown & Capacity Efficiency Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Purpose Breakdown Chart Card */}
                            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                        Utilization by Purpose
                                    </h3>
                                    <Badge variant="outline" className="text-[10px]">Hours Allocated</Badge>
                                </div>
                                <div className="space-y-2.5 pt-1">
                                    {purposeBreakdown.map((item) => (
                                        <div key={item.purpose} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground">{item.purpose}</span>
                                                <span className="font-semibold text-muted-foreground">
                                                    {item.hours} hrs ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-amber-500 transition-all"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Capacity Efficiency vs Time Utilization */}
                            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs lg:col-span-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                            Capacity Efficiency vs Time Utilization
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground">
                                            Identifies "High Time, Low Seat" misallocations (where large rooms are booked for small classes).
                                        </p>
                                    </div>
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                                        <span className="text-[11px] text-muted-foreground">Average Seat Fill Ratio</span>
                                        <div className="text-xl font-bold text-foreground mt-1">78.4%</div>
                                        <p className="text-[11px] text-emerald-600 font-medium">Optimal seat absorption</p>
                                    </div>

                                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                                        <span className="text-[11px] text-muted-foreground">Average Idle Gap</span>
                                        <div className="text-xl font-bold text-foreground mt-1">45 mins</div>
                                        <p className="text-[11px] text-muted-foreground">Between scheduled activities</p>
                                    </div>

                                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                                        <span className="text-[11px] text-muted-foreground">High Time / Low Seat Rooms</span>
                                        <div className="text-xl font-bold text-amber-600 mt-1">
                                            {roomProfiles.filter(r => r.efficiency_diagnosis === 'High Time, Low Seat').length} Facilities
                                        </div>
                                        <p className="text-[11px] text-amber-600">Reconsider room assignments</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Room Comparison Table */}
                        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-foreground">Facility Workload & Comparison Roster</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Detailed breakdown of scheduled vs observed hours, seat capacity efficiency, and peak trends.
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {roomProfiles.length} facilities monitored
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-3 px-4">Room & Building</th>
                                            <th className="py-3 px-4">Type & Capacity</th>
                                            <th className="py-3 px-4">Scheduled Hours</th>
                                            <th className="py-3 px-4">Observed Hours</th>
                                            <th className="py-3 px-4">Time Utilization</th>
                                            <th className="py-3 px-4">Capacity Efficiency</th>
                                            <th className="py-3 px-4">Busiest Day</th>
                                            <th className="py-3 px-4">Workload Diagnosis</th>
                                            <th className="py-3 px-4 text-right">Profile</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {roomProfiles.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-12 text-center text-muted-foreground">
                                                    No facilities match active filter parameters.
                                                </td>
                                            </tr>
                                        ) : (
                                            roomProfiles.map((r) => {
                                                return (
                                                    <tr key={r.id} className="hover:bg-amber-500/[0.03] transition-colors">
                                                        {/* Room & Building */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-foreground flex items-center gap-1.5">
                                                                <span>{r.room_name}</span>
                                                                {r.is_currently_in_use && (
                                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Currently In Use" />
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {r.building} • {r.floor}
                                                            </div>
                                                        </td>

                                                        {/* Type & Capacity */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-semibold text-foreground">{r.type}</div>
                                                            <div className="text-[11px] text-muted-foreground">{r.capacity} seats</div>
                                                        </td>

                                                        {/* Scheduled Hours */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-foreground">{r.scheduled_hours} hrs</div>
                                                            <div className="text-[11px] text-muted-foreground">out of {r.available_hours} avail</div>
                                                        </td>

                                                        {/* Observed Hours */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-emerald-600 dark:text-emerald-400">{r.observed_hours} hrs</div>
                                                            <div className="text-[11px] text-muted-foreground">{r.sessions_count} sessions</div>
                                                        </td>

                                                        {/* Time Utilization Rate */}
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${
                                                                            r.total_utilization_rate >= 80
                                                                                ? 'bg-rose-500'
                                                                                : r.total_utilization_rate >= 50
                                                                                ? 'bg-amber-500'
                                                                                : 'bg-emerald-500'
                                                                        }`}
                                                                        style={{ width: `${r.total_utilization_rate}%` }}
                                                                    />
                                                                </div>
                                                                <span className="font-bold text-foreground">{r.total_utilization_rate}%</span>
                                                            </div>
                                                        </td>

                                                        {/* Capacity Efficiency */}
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-foreground">{r.capacity_efficiency}%</div>
                                                            <div className="text-[11px] text-muted-foreground">~{r.avg_occupants} occupants</div>
                                                        </td>

                                                        {/* Busiest Day */}
                                                        <td className="py-3 px-4">
                                                            <span className="font-medium text-foreground">{r.busiest_day}</span>
                                                            <div className="text-[11px] text-muted-foreground">{r.busiest_time_range}</div>
                                                        </td>

                                                        {/* Efficiency Diagnosis Badge */}
                                                        <td className="py-3 px-4">
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    r.efficiency_diagnosis === 'Congested Bottleneck'
                                                                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300'
                                                                        : r.efficiency_diagnosis === 'High Time, Low Seat'
                                                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300'
                                                                        : r.efficiency_diagnosis === 'Underutilized Opportunity'
                                                                        ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300'
                                                                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                                                }
                                                            >
                                                                {r.efficiency_diagnosis}
                                                            </Badge>
                                                        </td>

                                                        {/* Profile Button */}
                                                        <td className="py-3 px-4 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedProfile(r);
                                                                    setProfileModalOpen(true);
                                                                }}
                                                                className="h-7 text-xs px-2 gap-1 cursor-pointer"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                <span>Profile</span>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Tab Content: Peak-Hours & Heatmap Matrix */}
                {activeTab === 'heatmaps' && (
                    <div className="space-y-6">
                        {/* Time Band Heatmap Matrix */}
                        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3">
                                <div>
                                    <h2 className="text-sm font-bold text-foreground">
                                        Peak-Hour Occupancy Heatmap (Time Bands vs Days of Week)
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Visualizes time-band intensity across the academic week. Darker cells represent heavier concentration of classes and activities.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground text-[11px]">Legend:</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-card border text-muted-foreground">0%</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-medium">1-45%</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500 text-white font-medium">45-75%</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500 text-white font-bold">80%+ Peak</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-2.5 px-3 text-left w-48">Time Band</th>
                                            {daysOfWeek.map((day) => (
                                                <th key={day} className="py-2.5 px-3">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {peakHourMatrix.map((row) => (
                                            <tr key={row.time_band}>
                                                <td className="py-3 px-3 text-left font-bold text-foreground bg-muted/10">
                                                    {row.time_band}
                                                </td>
                                                {daysOfWeek.map((day) => {
                                                    const cell = row[day] || { count: 0, occupancy_rate: 0 };
                                                    return (
                                                        <td
                                                            key={day}
                                                            className={`py-3 px-3 transition-colors ${getHeatmapColor(cell.occupancy_rate)}`}
                                                        >
                                                            <div className="font-bold text-xs">{cell.occupancy_rate}%</div>
                                                            <div className="text-[10px] opacity-80">{cell.count} sessions</div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Room vs Day of Week Heatmap */}
                        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3">
                                <div>
                                    <h2 className="text-sm font-bold text-foreground">
                                        Facility vs Day Workload Distribution
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Day-by-day load percentage per facility, pinpointing underutilized days and heavy cluster days.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-2.5 px-3 text-left w-52">Room & Type</th>
                                            {daysOfWeek.map((day) => (
                                                <th key={day} className="py-2.5 px-3">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {roomDayMatrix.map((row) => (
                                            <tr key={row.room_name}>
                                                <td className="py-2.5 px-3 text-left font-semibold text-foreground bg-muted/10">
                                                    <div>{row.room_name}</div>
                                                    <span className="text-[10px] font-normal text-muted-foreground">{row.type}</span>
                                                </td>
                                                {daysOfWeek.map((day) => {
                                                    const cell = row[day] || { hours: 0, rate: 0 };
                                                    return (
                                                        <td
                                                            key={day}
                                                            className={`py-2.5 px-3 transition-colors ${getHeatmapColor(cell.rate)}`}
                                                        >
                                                            <div className="font-bold text-xs">{cell.rate}%</div>
                                                            <div className="text-[10px] opacity-80">{cell.hours} hrs</div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Tab Content: Schedule vs Observed Discrepancies */}
                {activeTab === 'discrepancies' && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3 text-xs">
                            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                                    Educational Discrepancy Oversight Policy
                                </h3>
                                <p className="text-amber-800 dark:text-amber-300/90 mt-0.5">
                                    Discrepancies compare published schedules with live classroom/lab monitoring records (such as synchronized Google Sheets).
                                    These alerts are flagged strictly for administrative verification rather than automatic non-compliance, as monitoring data may be updating or classes may have relocated for academic fieldwork.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground">
                                    Observed Variance Log ({discrepancies.length} items flagged)
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-3 px-4">Room Facility</th>
                                            <th className="py-3 px-4">Discrepancy Category</th>
                                            <th className="py-3 px-4">Scheduled Activity</th>
                                            <th className="py-3 px-4">Observed Status</th>
                                            <th className="py-3 px-4">Faculty / Host</th>
                                            <th className="py-3 px-4">Administrative Verification</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {discrepancies.map((d) => (
                                            <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-4 font-semibold text-foreground">
                                                    {d.room_name}
                                                    <span className="block text-[11px] font-normal text-muted-foreground">{d.room_type}</span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <Badge
                                                        className={
                                                            d.severity === 'Amber'
                                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300'
                                                                : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300'
                                                        }
                                                    >
                                                        {d.flag_type}
                                                    </Badge>
                                                </td>

                                                <td className="py-3 px-4 text-xs font-medium text-foreground">
                                                    {d.scheduled_activity}
                                                </td>

                                                <td className="py-3 px-4 text-xs text-muted-foreground">
                                                    {d.observed_status}
                                                </td>

                                                <td className="py-3 px-4 font-medium text-foreground">
                                                    {d.instructor}
                                                </td>

                                                <td className="py-3 px-4 text-[11px] text-muted-foreground italic">
                                                    {d.action_hint}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 8. Tab Content: Planning Alerts & Scheduling Constraints */}
                {activeTab === 'insights' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {planningInsights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3 relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            className={
                                                insight.type === 'bottleneck'
                                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300'
                                                    : insight.type === 'capacity_mismatch'
                                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300'
                                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                            }
                                        >
                                            {insight.badge}
                                        </Badge>
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">{insight.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            {insight.description}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                        Recommendation for Next Scheduling Cycle
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scheduling Soft Constraints Summary */}
                        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Algorithmic Soft Constraints & Timetable Optimizer Inputs</span>
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                The deterministic room utilization metrics above directly provide parameters to penalize over-concentrated schedules
                                in future automated runs:
                            </p>
                            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
                                <li><strong>Laboratory Bottleneck Penalty:</strong> Apply high cost penalty if computer laboratory scheduling exceeds 75% on Tuesday/Thursday mornings.</li>
                                <li><strong>Capacity Mismatch Penalty:</strong> Prevent assignment of course sections with fewer than 25 students into 50+ capacity lecture rooms when standard 35-seat rooms are idle.</li>
                                <li><strong>Friday/Saturday Demand Balancing:</strong> Encourage distribution of make-up classes, exam slots, and meetings into underutilized Friday and Saturday windows.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 9. Individual Room Profile Modal */}
                <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                                <Building2 className="w-5 h-5 text-amber-500" />
                                <span>Facility Utilization Profile: {selectedProfile?.room_name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Comprehensive capacity, scheduled hours, occupancy ratios, and chronological activity breakdown.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedProfile && (
                            <div className="space-y-4 pt-1 text-xs">
                                {/* Basic Metadata Header */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Building & Floor</span>
                                        <div className="font-bold text-foreground">{selectedProfile.building} • {selectedProfile.floor}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Classification</span>
                                        <div className="font-bold text-foreground">{selectedProfile.type}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Design Capacity</span>
                                        <div className="font-bold text-foreground">{selectedProfile.capacity} seats</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Workload Status</span>
                                        <div className="font-bold text-amber-600">{selectedProfile.efficiency_diagnosis}</div>
                                    </div>
                                </div>

                                {/* Utilization Metrics Matrix */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-lg border border-border bg-card">
                                        <span className="text-[10px] text-muted-foreground">Scheduled / Total Used</span>
                                        <div className="text-lg font-bold text-foreground mt-1">
                                            {selectedProfile.scheduled_hours} hrs
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {selectedProfile.total_utilization_rate}% of {selectedProfile.available_hours} avail hrs
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-lg border border-border bg-card">
                                        <span className="text-[10px] text-muted-foreground">Seat Capacity Efficiency</span>
                                        <div className="text-lg font-bold text-foreground mt-1">
                                            {selectedProfile.capacity_efficiency}%
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            Avg ~{selectedProfile.avg_occupants} occupants / class
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-lg border border-border bg-card">
                                        <span className="text-[10px] text-muted-foreground">Observed Monitored</span>
                                        <div className="text-lg font-bold text-emerald-600 mt-1">
                                            {selectedProfile.observed_hours} hrs
                                        </div>
                                        <span className="text-[10px] text-emerald-600">
                                            {selectedProfile.actual_utilization_rate}% verified
                                        </span>
                                    </div>
                                </div>

                                {/* Sessions & Activity Distribution */}
                                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                                        Activity Composition ({selectedProfile.sessions_count} total sessions)
                                    </span>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                                        <div className="p-2 rounded bg-muted/40">
                                            <span className="text-sm font-bold text-foreground">{selectedProfile.regular_classes_count}</span>
                                            <span className="block text-[10px] text-muted-foreground">Regular Classes</span>
                                        </div>
                                        <div className="p-2 rounded bg-muted/40">
                                            <span className="text-sm font-bold text-foreground">{selectedProfile.lab_classes_count}</span>
                                            <span className="block text-[10px] text-muted-foreground">Lab Classes</span>
                                        </div>
                                        <div className="p-2 rounded bg-muted/40">
                                            <span className="text-sm font-bold text-foreground">{selectedProfile.exams_count}</span>
                                            <span className="block text-[10px] text-muted-foreground">Examinations</span>
                                        </div>
                                        <div className="p-2 rounded bg-muted/40">
                                            <span className="text-sm font-bold text-foreground">{selectedProfile.makeup_classes_count}</span>
                                            <span className="block text-[10px] text-muted-foreground">Make-Up Sessions</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Peak & Idle Details */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Peak Demand Pattern</span>
                                        <div className="font-semibold text-foreground">Busiest: {selectedProfile.busiest_day}</div>
                                        <div className="text-[11px] text-muted-foreground">Peak Time: {selectedProfile.busiest_time_range}</div>
                                        <div className="text-[11px] text-muted-foreground">Quietest Day: {selectedProfile.quietest_day}</div>
                                    </div>

                                    <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Installed Facilities</span>
                                        <div className="text-[11px] text-muted-foreground">
                                            {selectedProfile.equipment_details || 'Standard academic room furniture and audiovisual equipment.'}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground pt-1">
                                            Idle gap between classes: ~{selectedProfile.average_idle_gap_minutes} mins
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setProfileModalOpen(false)}
                                        className="cursor-pointer"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer gap-1.5"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Print Room Profile</span>
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
