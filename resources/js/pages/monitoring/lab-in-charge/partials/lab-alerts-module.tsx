import React, { useState, useMemo } from 'react';
import {
    AlertTriangle,
    Plus,
    Clock,
    CheckCircle2,
    FileText,
    BarChart3,
    Calendar,
    Search,
    Filter,
    ChevronDown,
    MoreHorizontal,
    X,
    ExternalLink,
    ShieldAlert,
    Building2,
    Users,
    Check,
    ArrowUpRight,
    Camera,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { DiscrepancyItem } from '../index';

export interface IncidentRecord {
    id: string; // e.g. "INC-2026-015"
    db_id?: number;
    date_time: string; // "Oct 24, 2026 · 08:15 AM"
    date_formatted: string; // "Oct 24, 2026"
    time_formatted: string; // "08:15 AM"
    laboratory: string; // "CLR 2"
    related_session: {
        code_section: string; // "IT 622 · BSIT 2A"
        time_slot: string; // "07:30 – 09:00 AM"
        faculty: string; // "Renzel Villegas"
        session_type: string; // "Regular Laboratory Class"
    };
    incident_type: string; // "Occupied by Another Class"
    incident_detail: string; // "Different program using the lab."
    status: 'Active' | 'For Verification' | 'Resolved';
    reported_by: {
        name: string; // "Ace Fuentes"
        role_label: string; // "Ace Fuentes (Lab In-Charge)"
        time: string; // "08:15 AM"
    };
    remarks: string;
    photo_url?: string | null;
}

interface LabAlertsModuleProps {
    assignedRooms: any[];
    openDiscrepancies: DiscrepancyItem[];
    allDiscrepancies?: DiscrepancyItem[];
    currentUserName?: string;
    onOpenDisruptionModal: () => void;
}

export default function LabAlertsModule({
    assignedRooms = [],
    openDiscrepancies = [],
    allDiscrepancies = [],
    currentUserName = 'Ace Fuentes',
    onOpenDisruptionModal,
}: LabAlertsModuleProps) {
    // 1. Initial State / Filter Controls
    const [statusTab, setStatusTab] = useState<'All' | 'Active' | 'For Verification' | 'Resolved'>('All');
    const [dateRange, setDateRange] = useState('Oct 19 - Oct 25, 2026');
    const [selectedLab, setSelectedLab] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
    const [selectedReporterFilter, setSelectedReporterFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

    // Drawer State
    const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'details' | 'session' | 'resolution'>('details');
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    // 2. Map server discrepancies from the backend into IncidentRecord format
    const incidentsList: IncidentRecord[] = useMemo(() => {
        const sourceData = (allDiscrepancies && allDiscrepancies.length > 0)
            ? allDiscrepancies
            : openDiscrepancies;

        if (!sourceData || sourceData.length === 0) {
            return [];
        }

        return sourceData.map((d, index) => {
            const rawStatus = (d.resolution_status || 'Active').toLowerCase();
            let status: 'Active' | 'For Verification' | 'Resolved' = 'Active';
            if (rawStatus.includes('resolve') || rawStatus.includes('verif') || rawStatus.includes('close')) {
                status = 'Resolved';
            } else if (rawStatus.includes('review') || rawStatus.includes('clarif')) {
                status = 'For Verification';
            }

            const labName = d.room?.room_name || d.room?.name || 'Laboratory';
            const idCode = `INC-2026-${String(d.id || index + 1).padStart(3, '0')}`;

            return {
                id: idCode,
                db_id: d.id,
                date_time: d.created_at || 'Recent',
                date_formatted: d.created_at ? d.created_at.split('·')[0].trim() : 'Recent',
                time_formatted: d.created_at && d.created_at.includes('·') ? d.created_at.split('·')[1].trim() : '',
                laboratory: labName,
                related_session: {
                    code_section: (d as any).verified_schedule?.course?.code
                        ? `${(d as any).verified_schedule.course.code} · ${(d as any).verified_schedule.section?.code || 'Sec'}`
                        : 'Scheduled Session',
                    time_slot: (d as any).verified_schedule?.scheduled_time || 'Session Hours',
                    faculty: (d as any).verified_schedule?.faculty
                        ? `${(d as any).verified_schedule.faculty.first_name} ${(d as any).verified_schedule.faculty.last_name}`
                        : 'Faculty In-Charge',
                    session_type: 'Regular Laboratory Class',
                },
                incident_type: d.discrepancy_type || 'Discrepancy / Disruption',
                incident_detail: d.remarks || d.observed_state || 'Operational incident logged.',
                status,
                reported_by: {
                    name: d.reporter?.name || currentUserName,
                    role_label: `${d.reporter?.name || currentUserName} (Lab In-Charge)`,
                    time: d.created_at && d.created_at.includes('·') ? d.created_at.split('·')[1].trim() : 'Logged',
                },
                remarks: d.remarks || d.evidence_details || d.observed_state || 'No additional remarks provided.',
                photo_url: d.photo_url || null,
            };
        });
    }, [allDiscrepancies, openDiscrepancies, currentUserName]);

    // 4. Counts for KPI Cards and Filter Tabs
    const activeCount = useMemo(() => incidentsList.filter((i) => i.status === 'Active').length, [incidentsList]);
    const forVerificationCount = useMemo(() => incidentsList.filter((i) => i.status === 'For Verification').length, [incidentsList]);
    const resolvedCount = useMemo(() => incidentsList.filter((i) => i.status === 'Resolved').length, [incidentsList]);
    const totalCount = incidentsList.length;

    // Calculate most common issue dynamically
    const mostCommonIssue = useMemo(() => {
        if (incidentsList.length === 0) {
            return { title: 'None', count: 0, percentage: 0 };
        }
        const counts: Record<string, number> = {};
        incidentsList.forEach((item) => {
            counts[item.incident_type] = (counts[item.incident_type] || 0) + 1;
        });
        let topIssue = 'None';
        let maxCount = 0;
        Object.entries(counts).forEach(([issue, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topIssue = issue;
            }
        });
        const pct = Math.round((maxCount / incidentsList.length) * 100);
        return { title: topIssue, count: maxCount, percentage: pct };
    }, [incidentsList]);

    // Check if any filter is active
    const hasActiveFilters = useMemo(() => {
        return (
            statusTab !== 'all' ||
            selectedLab !== 'all' ||
            selectedStatusFilter !== 'all' ||
            selectedTypeFilter !== 'all' ||
            selectedReporterFilter !== 'all' ||
            searchQuery.trim().length > 0
        );
    }, [statusTab, selectedLab, selectedStatusFilter, selectedTypeFilter, selectedReporterFilter, searchQuery]);

    const handleClearFilters = () => {
        setStatusTab('all');
        setSelectedLab('all');
        setSelectedStatusFilter('all');
        setSelectedTypeFilter('all');
        setSelectedReporterFilter('all');
        setSearchQuery('');
    };

    // 5. Filtering and Searching
    const filteredIncidents = useMemo(() => {
        return incidentsList.filter((item) => {
            // Tab Pill filter
            if (statusTab === 'Active' && item.status !== 'Active') return false;
            if (statusTab === 'For Verification' && item.status !== 'For Verification') return false;
            if (statusTab === 'Resolved' && item.status !== 'Resolved') return false;

            // Lab filter
            if (selectedLab !== 'all' && item.laboratory !== selectedLab) return false;

            // Status select filter
            if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) return false;

            // Type filter
            if (selectedTypeFilter !== 'all' && item.incident_type !== selectedTypeFilter) return false;

            // Reporter filter
            if (selectedReporterFilter !== 'all' && !item.reported_by.name.toLowerCase().includes(selectedReporterFilter.toLowerCase())) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchId = item.id.toLowerCase().includes(q);
                const matchLab = item.laboratory.toLowerCase().includes(q);
                const matchType = item.incident_type.toLowerCase().includes(q);
                const matchDetail = item.incident_detail.toLowerCase().includes(q);
                const matchSession = item.related_session.code_section.toLowerCase().includes(q);
                const matchFaculty = item.related_session.faculty.toLowerCase().includes(q);
                const matchReporter = item.reported_by.name.toLowerCase().includes(q);
                if (!matchId && !matchLab && !matchType && !matchDetail && !matchSession && !matchFaculty && !matchReporter) {
                    return false;
                }
            }

            return true;
        });
    }, [incidentsList, statusTab, selectedLab, selectedStatusFilter, selectedTypeFilter, selectedReporterFilter, searchQuery]);

    // Helper for Incident Type Icon and Colors
    const getIncidentTypeConfig = (type: string) => {
        switch (type) {
            case 'Occupied by Another Class':
            case 'Occupied by Unscheduled Activity':
                return {
                    icon: AlertTriangle,
                    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
                    dotColor: 'bg-rose-500',
                };
            case 'Equipment Failure':
                return {
                    icon: Clock,
                    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
                    dotColor: 'bg-amber-500',
                };
            case 'Network/Power Issue':
                return {
                    icon: AlertTriangle,
                    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
                    dotColor: 'bg-rose-500',
                };
            case 'Switched to Online':
                return {
                    icon: CheckCircle2,
                    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
                    dotColor: 'bg-blue-500',
                };
            case 'Maintenance':
            case 'Room Temporarily Closed':
                return {
                    icon: CheckCircle2,
                    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
                    dotColor: 'bg-emerald-500',
                };
            case 'Special Activity':
            case 'Transferred Room':
                return {
                    icon: CheckCircle2,
                    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
                    dotColor: 'bg-emerald-500',
                };
            case 'No Faculty Observed':
                return {
                    icon: AlertTriangle,
                    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
                    dotColor: 'bg-rose-500',
                };
            default:
                return {
                    icon: AlertTriangle,
                    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                    dotColor: 'bg-slate-400',
                };
        }
    };

    // Helper for Status Badge Styling
    const renderStatusBadge = (status: 'Active' | 'For Verification' | 'Resolved') => {
        switch (status) {
            case 'Active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Active
                    </span>
                );
            case 'For Verification':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        For Verification
                    </span>
                );
            case 'Resolved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Resolved
                    </span>
                );
        }
    };

    // Row Click to Open Drawer
    const handleRowClick = (item: IncidentRecord) => {
        setSelectedIncident(item);
        setIsDrawerOpen(true);
        setDrawerTab('details');
    };

    // Resolve / Status transition action
    const handleResolveIncident = (incident: IncidentRecord) => {
        if (incident.db_id) {
            router.post(
                route('lab-in-charge.discrepancy.status', { discrepancy: incident.db_id }),
                { resolution_status: 'Resolved' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSelectedIncident((prev) => (prev ? { ...prev, status: 'Resolved' } : null));
                    },
                }
            );
        } else {
            // Local optimistic state update
            setSelectedIncident((prev) => (prev ? { ...prev, status: 'Resolved' } : null));
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. MODULE-SPECIFIC HEADER (Red alert rounded icon + "Alerts & Incidents" + Subtitle + "+ Report New Incident" button) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-sm shrink-0">
                        <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                            Alerts & Incidents
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Track, report, and resolve laboratory-related issues that affect scheduled sessions or room operations.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <Button
                        onClick={onOpenDisruptionModal}
                        className="h-10 px-4 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs rounded-xl gap-2 transition-all"
                    >
                        <Plus className="h-4 w-4 stroke-[2.5]" />
                        Report New Incident
                    </Button>
                </div>
            </div>

            {/* 2. 5 KPI CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Active Incidents */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-rose-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{activeCount}</div>
                        <div className="text-xs font-bold text-foreground">Active Incidents</div>
                        <div className="text-[11px] text-muted-foreground">Require immediate action</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-500 border border-rose-200/60 flex items-center justify-center shrink-0 dark:bg-rose-950/40 dark:border-rose-900/40">
                        <AlertTriangle className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>

                {/* 2. For Verification */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{forVerificationCount}</div>
                        <div className="text-xs font-bold text-foreground">For Verification</div>
                        <div className="text-[11px] text-muted-foreground">Awaiting confirmation</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/60 flex items-center justify-center shrink-0 dark:bg-amber-950/40 dark:border-amber-900/40">
                        <Clock className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>

                {/* 3. Resolved Today */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-blue-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{resolvedCount}</div>
                        <div className="text-xs font-bold text-foreground">Resolved Today</div>
                        <div className="text-[11px] text-muted-foreground">Closed incidents</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-500 border border-blue-200/60 flex items-center justify-center shrink-0 dark:bg-blue-950/40 dark:border-blue-900/40">
                        <CheckCircle2 className="h-5 w-5 stroke-[2.2]" />
                    </div>
                </div>

                {/* 4. Total Incidents */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-slate-400 transition-all">
                    <div className="space-y-1">
                        <div className="text-2xl font-black tracking-tight text-foreground">{totalCount}</div>
                        <div className="text-xs font-bold text-foreground">Total Incidents</div>
                        <div className="text-[11px] text-muted-foreground">This week</div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                        <FileText className="h-5 w-5 stroke-[2]" />
                    </div>
                </div>

                {/* 5. Most Common Issue */}
                <div className="bg-card border rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden group hover:border-slate-400 transition-all">
                    <div className="space-y-1 min-w-0 pr-2">
                        <div className="text-[11px] text-muted-foreground font-medium">Most Common Issue</div>
                        <div className="text-sm font-black tracking-tight text-foreground truncate" title={mostCommonIssue.title}>
                            {mostCommonIssue.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                            {mostCommonIssue.count} {mostCommonIssue.count === 1 ? 'incident' : 'incidents'}{' '}
                            {mostCommonIssue.count > 0 ? `(${mostCommonIssue.percentage}%)` : ''}
                        </div>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                        <BarChart3 className="h-5 w-5 stroke-[2]" />
                    </div>
                </div>
            </div>

            {/* 3. SECONDARY FILTER ROW */}
            <div className="bg-card border rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                    {/* Date Range Picker */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-semibold shadow-2xs">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{dateRange}</span>
                    </div>

                    {/* Laboratory Select */}
                    <div className="relative">
                        <select
                            value={selectedLab}
                            onChange={(e) => setSelectedLab(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Assigned Labs (7)</option>
                            <option value="CHS">CHS</option>
                            <option value="CLR 1">CLR 1</option>
                            <option value="CLR 2">CLR 2</option>
                            <option value="CLR 3">CLR 3</option>
                            <option value="CLR 4">CLR 4</option>
                            <option value="CLR 5">CLR 5</option>
                            <option value="COM 1">COM 1</option>
                            <option value="COM 2">COM 2</option>
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Status Select */}
                    <div className="relative">
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="For Verification">For Verification</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Incident Type Select */}
                    <div className="relative">
                        <select
                            value={selectedTypeFilter}
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Types</option>
                            <option value="Occupied by Another Class">Occupied by Another Class</option>
                            <option value="Equipment Failure">Equipment Failure</option>
                            <option value="Network/Power Issue">Network/Power Issue</option>
                            <option value="Switched to Online">Switched to Online</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Room Temporarily Closed">Room Temporarily Closed</option>
                            <option value="Special Activity">Special Activity</option>
                            <option value="No Faculty Observed">No Faculty Observed</option>
                            <option value="Transferred Room">Transferred Room</option>
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Reported By Select */}
                    <div className="relative">
                        <select
                            value={selectedReporterFilter}
                            onChange={(e) => setSelectedReporterFilter(e.target.value)}
                            className="h-8.5 text-xs font-semibold rounded-xl border border-input bg-background pl-3 pr-8 shadow-2xs appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Users</option>
                            <option value="Ace Fuentes">Ace Fuentes</option>
                            <option value="Jerry Oriente">Jerry Oriente</option>
                            <option value="Kaye Panaligan">Kaye Panaligan</option>
                            <option value="Domingo Origines">Domingo Origines</option>
                            <option value="Arbeah Sayadi">Arbeah Sayadi</option>
                            <option value="Renzel Villegas">Renzel Villegas</option>
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* Search Bar + Filters Toggle */}
                <div className="flex items-center gap-2">
                    <div className="relative w-48 sm:w-60">
                        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Search incidents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8.5 pl-8.5 text-xs rounded-xl shadow-2xs bg-background"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-2xs"
                        onClick={() => {
                            setSelectedLab('all');
                            setSelectedStatusFilter('all');
                            setSelectedTypeFilter('all');
                            setSelectedReporterFilter('all');
                            setSearchQuery('');
                            setStatusTab('All');
                        }}
                    >
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                    </Button>
                </div>
            </div>

            {/* 4. MAIN TABLE AREA WITH PILL TABS */}
            <div className="space-y-3">
                {/* Tabs & Sort Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* All Incidents */}
                        <button
                            type="button"
                            onClick={() => setStatusTab('All')}
                            className={cn(
                                'h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5',
                                statusTab === 'All'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-950 inline-block" />
                            All Incidents ({totalCount})
                        </button>

                        {/* Active */}
                        <button
                            type="button"
                            onClick={() => setStatusTab('Active')}
                            className={cn(
                                'h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border',
                                statusTab === 'Active'
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                    : 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/20'
                            )}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                            Active ({activeCount})
                        </button>

                        {/* For Verification */}
                        <button
                            type="button"
                            onClick={() => setStatusTab('For Verification')}
                            className={cn(
                                'h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border',
                                statusTab === 'For Verification'
                                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                    : 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20'
                            )}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                            For Verification ({forVerificationCount})
                        </button>

                        {/* Resolved */}
                        <button
                            type="button"
                            onClick={() => setStatusTab('Resolved')}
                            className={cn(
                                'h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border',
                                statusTab === 'Resolved'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/20'
                            )}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            Resolved ({resolvedCount})
                        </button>
                    </div>

                    {/* Sort Order Selector */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as any)}
                            className="h-8 text-xs font-semibold rounded-xl border border-input bg-background px-3 shadow-2xs appearance-none cursor-pointer focus:outline-hidden"
                        >
                            <option value="latest">Latest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {/* Incidents Table */}
                <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="py-3 px-3 text-center w-8">#</th>
                                    <th className="py-3 px-3">ID</th>
                                    <th className="py-3 px-3">Date & Time</th>
                                    <th className="py-3 px-3">Laboratory</th>
                                    <th className="py-3 px-3">Related Session</th>
                                    <th className="py-3 px-3">Incident Type</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3">Reported By</th>
                                    <th className="py-3 px-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {filteredIncidents.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-xs">
                                                    <AlertTriangle className="h-7 w-7 stroke-[1.8]" />
                                                </div>
                                                <h3 className="text-sm font-bold text-foreground mb-1">
                                                    {hasActiveFilters ? 'No Matching Incidents Found' : 'No Alerts or Incidents Logged'}
                                                </h3>
                                                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                                    {hasActiveFilters
                                                        ? 'No incident reports match your current filter criteria. Try adjusting or resetting your filters to see more results.'
                                                        : 'All monitored laboratories are currently operating smoothly with no discrepancies or disruptions reported.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleClearFilters}
                                                        className="h-8 text-xs font-semibold rounded-xl"
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIncidents.map((incident) => {
                                        const typeCfg = getIncidentTypeConfig(incident.incident_type);
                                        const TypeIcon = typeCfg.icon;

                                        return (
                                            <tr
                                                key={incident.id}
                                                onClick={() => handleRowClick(incident)}
                                                className="hover:bg-muted/40 transition-colors cursor-pointer group"
                                            >
                                                {/* Status Dot */}
                                                <td className="py-3 px-3 text-center">
                                                    <span
                                                        className={cn(
                                                            'h-2 w-2 rounded-full inline-block',
                                                            incident.status === 'Active' && 'bg-rose-500',
                                                            incident.status === 'For Verification' && 'bg-amber-500',
                                                            incident.status === 'Resolved' && 'bg-emerald-500'
                                                        )}
                                                    />
                                                </td>

                                                {/* ID */}
                                                <td className="py-3 px-3 font-black text-foreground whitespace-nowrap">
                                                    {incident.id}
                                                </td>

                                                {/* Date & Time */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="font-semibold text-foreground">{incident.date_formatted}</div>
                                                    <div className="text-[11px] text-muted-foreground">{incident.time_formatted}</div>
                                                </td>

                                                {/* Laboratory */}
                                                <td className="py-3 px-3 font-black text-foreground whitespace-nowrap">
                                                    {incident.laboratory}
                                                </td>

                                                {/* Related Session */}
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-foreground truncate max-w-[170px]">
                                                        {incident.related_session.code_section}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground font-mono">
                                                        {incident.related_session.time_slot}
                                                    </div>
                                                </td>

                                                {/* Incident Type */}
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn('h-6 w-6 rounded-md flex items-center justify-center shrink-0 text-xs', typeCfg.iconBg)}>
                                                            <TypeIcon className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-foreground text-xs truncate max-w-[210px]">
                                                                {incident.incident_type}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground truncate max-w-[210px]">
                                                                {incident.incident_detail}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {renderStatusBadge(incident.status)}
                                                </td>

                                                {/* Reported By */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="font-semibold text-foreground">{incident.reported_by.name}</div>
                                                    <div className="text-[11px] text-muted-foreground">{incident.reported_by.time}</div>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRowClick(incident)}
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
                            Showing 1 to {Math.min(filteredIncidents.length, 10)} of {filteredIncidents.length} incidents
                        </div>
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
                                className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-foreground"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. INCIDENT DETAILS SLIDE-OVER DRAWER (Matches Right Panel in screenshot) */}
            {isDrawerOpen && selectedIncident && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                    />

                    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md bg-card border-l shadow-2xl flex flex-col">
                            {/* Drawer Header */}
                            <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
                                <div>
                                    <h2 className="text-base font-black text-foreground">Incident Details</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                                {/* Incident ID and Status */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-lg font-black text-foreground tracking-tight">
                                            {selectedIncident.id}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {renderStatusBadge(selectedIncident.status)}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Reported on {selectedIncident.date_time}
                                    </div>
                                </div>

                                {/* Alert Banner */}
                                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3">
                                    <div className="p-1 rounded-md bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 shrink-0 mt-0.5">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                                            {selectedIncident.incident_type}
                                        </div>
                                        <div className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                                            {selectedIncident.incident_detail}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs: Details | Related Session | Resolution */}
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
                                        onClick={() => setDrawerTab('session')}
                                        className={cn(
                                            'pb-2.5 transition-colors relative',
                                            drawerTab === 'session'
                                                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        Related Session
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDrawerTab('resolution')}
                                        className={cn(
                                            'pb-2.5 transition-colors relative',
                                            drawerTab === 'resolution'
                                                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        Resolution
                                    </button>
                                </div>

                                {/* Tab 1: Details */}
                                {drawerTab === 'details' && (
                                    <div className="space-y-3 text-xs divide-y">
                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                Laboratory
                                            </span>
                                            <span className="font-bold text-foreground">{selectedIncident.laboratory}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                Course / Section
                                            </span>
                                            <span className="font-bold text-foreground">{selectedIncident.related_session.code_section}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground">Expected Faculty</span>
                                            <span className="font-bold text-foreground">{selectedIncident.related_session.faculty}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                Scheduled Time
                                            </span>
                                            <span className="font-mono font-semibold text-foreground">{selectedIncident.related_session.time_slot}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground">Session Type</span>
                                            <span className="font-medium text-foreground">{selectedIncident.related_session.session_type}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground">Reported By</span>
                                            <span className="font-medium text-foreground">{selectedIncident.reported_by.role_label}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground">Reported At</span>
                                            <span className="font-mono text-foreground">{selectedIncident.date_time}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground">Incident Type</span>
                                            <span className="font-bold text-foreground">{selectedIncident.incident_type}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-muted-foreground">Current Status</span>
                                            <div>{renderStatusBadge(selectedIncident.status)}</div>
                                        </div>

                                        <div className="py-2 space-y-1">
                                            <span className="text-muted-foreground block">Remarks</span>
                                            <div className="p-2.5 rounded-lg bg-muted/40 text-foreground text-xs leading-relaxed">
                                                {selectedIncident.remarks}
                                            </div>
                                        </div>

                                        {/* Photo Evidence Section */}
                                        <div className="py-2 space-y-2">
                                            <span className="text-muted-foreground block">Photo / Evidence</span>
                                            {selectedIncident.photo_url ? (
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={selectedIncident.photo_url}
                                                        alt="Evidence"
                                                        className="h-12 w-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => setImagePreviewUrl(selectedIncident.photo_url!)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setImagePreviewUrl(selectedIncident.photo_url!)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        View Photo
                                                        <ExternalLink className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-lg border border-dashed text-center text-muted-foreground text-xs">
                                                    No photographic evidence attached for this incident report.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tab 2: Related Session */}
                                {drawerTab === 'session' && (
                                    <div className="space-y-3 text-xs bg-muted/20 p-3.5 rounded-xl border">
                                        <div className="font-bold text-foreground text-sm">Timetable Session Context</div>
                                        <p className="text-muted-foreground text-xs">
                                            This incident is tied to regular academic class verification in laboratory {selectedIncident.laboratory}.
                                        </p>
                                        <div className="space-y-2 pt-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Class Offering:</span>
                                                <span className="font-bold text-foreground">{selectedIncident.related_session.code_section}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Instructor:</span>
                                                <span className="font-semibold text-foreground">{selectedIncident.related_session.faculty}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Allocated Room:</span>
                                                <span className="font-semibold text-foreground">{selectedIncident.laboratory}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Slot Time:</span>
                                                <span className="font-mono font-semibold text-foreground">{selectedIncident.related_session.time_slot}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 3: Resolution */}
                                {drawerTab === 'resolution' && (
                                    <div className="space-y-3 text-xs">
                                        <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                                            <div className="font-bold text-foreground">Current Lifecycle Stage</div>
                                            <div className="text-muted-foreground">
                                                Status: <strong>{selectedIncident.status}</strong>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Marking this incident as resolved will record your timestamp, update room state indicators, and log the closure into the End-of-Day closing report audit matrices.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-4 sm:p-5 border-t bg-muted/10 space-y-2">
                                {/* Update Incident */}
                                <Button
                                    className="w-full h-9.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs rounded-xl"
                                    onClick={() => {
                                        setIsDrawerOpen(false);
                                        onOpenDisruptionModal();
                                    }}
                                >
                                    Update Incident
                                </Button>

                                {/* Mark as Resolved */}
                                <Button
                                    variant="outline"
                                    className="w-full h-9.5 text-xs font-bold border-border hover:bg-muted text-foreground rounded-xl gap-1.5"
                                    onClick={() => handleResolveIncident(selectedIncident)}
                                    disabled={selectedIncident.status === 'Resolved'}
                                >
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    {selectedIncident.status === 'Resolved' ? 'Incident Already Resolved' : 'Mark as Resolved'}
                                </Button>

                                {/* Escalate to Administrator */}
                                <Button
                                    variant="outline"
                                    className="w-full h-9.5 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-xl gap-1.5"
                                    onClick={() => {
                                        alert(`Incident ${selectedIncident.id} has been escalated to the College Dean and Super Administrator.`);
                                    }}
                                >
                                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                    Escalate to Administrator
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Preview Modal */}
            {imagePreviewUrl && (
                <div
                    className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setImagePreviewUrl(null)}
                >
                    <div className="relative max-w-2xl max-h-[85vh] bg-background rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-3 border-b">
                            <span className="text-xs font-bold text-foreground">Incident Photo Evidence</span>
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
                                alt="Incident Evidence High Resolution"
                                className="max-h-[60vh] w-auto mx-auto object-contain rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
