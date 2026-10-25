import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    FileCheck,
    CheckCircle2,
    Play,
    Clock,
    AlertTriangle,
    BarChart3,
    AlertCircle,
    ChevronDown,
    Activity,
    Layers,
    Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface LabDashboardModuleProps {
    assignedRooms: any[];
    sessionsList?: any[];
    timetablesByRoom?: Record<string, any[]>;
    allDiscrepancies?: any[];
    openDiscrepancies?: any[];
    historicalSessions?: any[];
    todayName?: string;
    todayDate?: string;
    todayDateStr?: string;
    kpi?: {
        sessions_today: number;
        in_progress: number;
        completed: number;
        upcoming: number;
        unmonitored: number;
        late_starts: number;
        disruptions: number;
        discrepancies: number;
    };
    onNavigateTab?: (tab: string) => void;
}

export default function LabDashboardModule({
    assignedRooms = [],
    sessionsList = [],
    timetablesByRoom = {},
    allDiscrepancies = [],
    openDiscrepancies = [],
    historicalSessions = [],
    todayName = 'Monday',
    todayDate = '',
    todayDateStr = '',
    kpi,
    onNavigateTab,
}: LabDashboardModuleProps) {
    // Top Period Selection state (Week / Month navigation)
    const [selectedPeriodOffset, setSelectedPeriodOffset] = useState<number>(0);
    const [statusDistFilter, setStatusDistFilter] = useState<'All Assigned Labs' | string>('All Assigned Labs');
    const [utilizationFilter, setUtilizationFilter] = useState<'Today' | 'Weekly Schedule'>('Weekly Schedule');
    const [incidentFilter, setIncidentFilter] = useState<'All Assigned Labs' | string>('All Assigned Labs');
    const [sessionByLabFilter, setSessionByLabFilter] = useState<'All Labs' | string>('All Labs');

    // Canonical list of assigned room names
    const assignedRoomNames = useMemo(() => {
        return assignedRooms.map((r) => r.room_name || r.name || `Room ${r.id}`);
    }, [assignedRooms]);

    // Flatten all weekly timetable sessions from database
    const allWeeklyTimetableSessions = useMemo(() => {
        const list: any[] = [];
        Object.values(timetablesByRoom).forEach((roomSchedules) => {
            if (Array.isArray(roomSchedules)) {
                list.push(...roomSchedules);
            }
        });
        return list;
    }, [timetablesByRoom]);

    // Combined all monitoring sessions (historical + today's sessionsList)
    const allKnownSessions = useMemo(() => {
        const combined = [...sessionsList];
        const seenIds = new Set(combined.map((s) => s.verified_schedule_id || s.id));

        historicalSessions.forEach((h) => {
            if (!seenIds.has(h.id)) {
                combined.push({
                    verified_schedule_id: h.id,
                    room_name: h.room_name,
                    course_code: h.course_code,
                    section: h.section,
                    expected_faculty: h.expected_faculty,
                    observation_status: h.session_outcome || 'Completed',
                    has_discrepancy: h.has_discrepancy || false,
                    is_historical: true,
                    monitoring_date: h.monitoring_date,
                    scheduled_time: h.scheduled_time,
                });
            }
        });
        return combined;
    }, [sessionsList, historicalSessions]);

    // Period display label
    const selectedPeriodLabel = useMemo(() => {
        if (selectedPeriodOffset === 0) {
            return todayDate ? `This Week · ${todayDate}` : 'Current Academic Week';
        }
        if (selectedPeriodOffset === -1) {
            return 'Previous Week (Retrospective)';
        }
        return `Week Offset: ${selectedPeriodOffset > 0 ? `+${selectedPeriodOffset}` : selectedPeriodOffset}`;
    }, [selectedPeriodOffset, todayDate]);

    // 1. KPI CARDS (Calculated dynamically from real data)
    const kpiMetrics = useMemo(() => {
        const totalScheduledToday = sessionsList.length;
        const totalWeeklyScheduled = allWeeklyTimetableSessions.length;
        const totalSessionsDisplay = totalWeeklyScheduled > 0 ? totalWeeklyScheduled : totalScheduledToday;

        const inProgress = sessionsList.filter((s) =>
            ['In Progress', 'Started On Time'].includes(s.observation_status)
        ).length;

        const completedToday = sessionsList.filter((s) => s.observation_status === 'Completed').length;
        const completedTotal = completedToday + historicalSessions.filter((h) =>
            (h.session_outcome || '').toLowerCase().includes('completed') || (h.session_outcome || '').toLowerCase().includes('conducted')
        ).length;

        const upcoming = sessionsList.filter((s) =>
            ['Upcoming', 'Ready to Monitor'].includes(s.observation_status)
        ).length;

        const unmonitored = sessionsList.filter((s) => s.observation_status === 'Unmonitored').length;
        const disruptions = (openDiscrepancies && openDiscrepancies.length > 0)
            ? openDiscrepancies.length
            : (allDiscrepancies || []).filter((d) => ['Open', 'Active', 'Under Review'].includes(d.resolution_status)).length;

        const completedPct = totalSessionsDisplay > 0
            ? Math.round((completedToday / (totalScheduledToday || 1)) * 100)
            : 0;

        return {
            totalSessions: totalSessionsDisplay,
            completed: completedToday,
            completedTotal,
            completedPct,
            inProgress,
            upcoming,
            unmonitored,
            disruptions,
        };
    }, [sessionsList, allWeeklyTimetableSessions, historicalSessions, openDiscrepancies, allDiscrepancies]);

    const kpiCards = useMemo(() => [
        {
            title: 'Total Scheduled Sessions',
            value: kpiMetrics.totalSessions,
            subtitle: `${allWeeklyTimetableSessions.length > 0 ? 'Weekly Timetable' : 'Today\'s Schedule'}`,
            trend: allWeeklyTimetableSessions.length > 0 ? 'Verified' : 'Active',
            trendLabel: 'in assigned laboratories',
            trendType: 'positive',
            icon: CalendarIcon,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40',
        },
        {
            title: 'Verified / Completed',
            value: kpiMetrics.completed,
            subtitle: `${kpiMetrics.completedPct}% of today's schedule`,
            trend: `${kpiMetrics.completedTotal} total`,
            trendLabel: 'historic & today',
            trendType: 'positive',
            icon: CheckCircle2,
            iconColor: 'text-emerald-500',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40',
        },
        {
            title: 'In Progress',
            value: kpiMetrics.inProgress,
            subtitle: kpiMetrics.inProgress > 0 ? 'Currently conducted in lab' : 'No ongoing sessions now',
            trend: kpiMetrics.inProgress > 0 ? 'Active' : 'Standby',
            trendLabel: 'live monitoring',
            trendType: kpiMetrics.inProgress > 0 ? 'positive' : 'neutral',
            icon: Play,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40',
        },
        {
            title: 'Upcoming',
            value: kpiMetrics.upcoming,
            subtitle: 'Scheduled later today',
            trend: 'Next',
            trendLabel: 'pending start',
            trendType: 'neutral',
            icon: Clock,
            iconColor: 'text-amber-500',
            iconBg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40',
        },
        {
            title: 'Unmonitored',
            value: kpiMetrics.unmonitored,
            subtitle: kpiMetrics.unmonitored > 0 ? 'Requires observation audit' : 'All sessions audited',
            trend: kpiMetrics.unmonitored === 0 ? 'Clean' : 'Attention',
            trendLabel: 'shift audits',
            trendType: kpiMetrics.unmonitored === 0 ? 'positive' : 'negative',
            icon: AlertCircle,
            iconColor: 'text-rose-500',
            iconBg: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40',
        },
        {
            title: 'Room Disruptions',
            value: kpiMetrics.disruptions,
            subtitle: kpiMetrics.disruptions > 0 ? 'Open incident reports' : 'Zero reported issues',
            trend: kpiMetrics.disruptions === 0 ? '0 Open' : `${kpiMetrics.disruptions} Active`,
            trendLabel: 'laboratory status',
            trendType: kpiMetrics.disruptions === 0 ? 'positive' : 'negative',
            icon: AlertTriangle,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40',
        },
    ], [kpiMetrics, allWeeklyTimetableSessions]);

    // 2. MONITORING STATUS DISTRIBUTION (Filtered by laboratory)
    const statusDistributionData = useMemo(() => {
        let pool = sessionsList;
        if (statusDistFilter !== 'All Assigned Labs') {
            pool = pool.filter((s) => s.room_name === statusDistFilter);
        }

        const total = pool.length;
        if (total === 0) {
            return {
                total: 0,
                distribution: [
                    { label: 'Completed', count: 0, pct: '0%', color: '#10b981' },
                    { label: 'In Progress', count: 0, pct: '0%', color: '#3b82f6' },
                    { label: 'Upcoming', count: 0, pct: '0%', color: '#f59e0b' },
                    { label: 'Unmonitored', count: 0, pct: '0%', color: '#ef4444' },
                    { label: 'Disruptions', count: 0, pct: '0%', color: '#a855f7' },
                ],
                strokeSegments: [],
            };
        }

        const completed = pool.filter((s) => s.observation_status === 'Completed').length;
        const inProgress = pool.filter((s) => ['In Progress', 'Started On Time'].includes(s.observation_status)).length;
        const upcoming = pool.filter((s) => ['Upcoming', 'Ready to Monitor'].includes(s.observation_status)).length;
        const unmonitored = pool.filter((s) => s.observation_status === 'Unmonitored').length;
        const disruptions = pool.filter((s) => s.has_discrepancy || ['Occupied by Another Class', 'Room Closed'].includes(s.room_condition)).length;

        const distribution = [
            { label: 'Completed', count: completed, pct: `${Math.round((completed / total) * 100)}%`, color: '#10b981' },
            { label: 'In Progress', count: inProgress, pct: `${Math.round((inProgress / total) * 100)}%`, color: '#3b82f6' },
            { label: 'Upcoming', count: upcoming, pct: `${Math.round((upcoming / total) * 100)}%`, color: '#f59e0b' },
            { label: 'Unmonitored', count: unmonitored, pct: `${Math.round((unmonitored / total) * 100)}%`, color: '#ef4444' },
            { label: 'Disruptions', count: disruptions, pct: `${Math.round((disruptions / total) * 100)}%`, color: '#a855f7' },
        ];

        // Compute SVG circle stroke-dasharray (circumference = 2 * PI * 38 ≈ 238.76)
        const C = 238.76;
        let runningOffset = 0;
        const strokeSegments = distribution.map((item) => {
            const arcLength = (item.count / total) * C;
            const segment = {
                color: item.color,
                dashArray: `${arcLength} ${C}`,
                dashOffset: -runningOffset,
            };
            runningOffset += arcLength;
            return segment;
        });

        return { total, distribution, strokeSegments };
    }, [sessionsList, statusDistFilter]);

    // 3. DAILY SESSION TREND (Monday through Sunday)
    const dailyTrendsData = useMemo(() => {
        const daysMap = [
            { key: 'Monday', short: 'Mon' },
            { key: 'Tuesday', short: 'Tue' },
            { key: 'Wednesday', short: 'Wed' },
            { key: 'Thursday', short: 'Thu' },
            { key: 'Friday', short: 'Fri' },
            { key: 'Saturday', short: 'Sat' },
            { key: 'Sunday', short: 'Sun' },
        ];

        return daysMap.map((d) => {
            // Find total scheduled on this day of week from timetablesByRoom
            const scheduledForDay = allWeeklyTimetableSessions.filter((s) => {
                const day = (s.day_of_week || '').toLowerCase();
                return day.includes(d.key.toLowerCase()) || day.includes(d.short.toLowerCase());
            });

            // If today matches, use sessionsList verified sessions; if past day, use historicalSessions
            const isToday = (todayName || '').toLowerCase().includes(d.key.toLowerCase());
            let verifiedCount = 0;

            if (isToday) {
                verifiedCount = sessionsList.filter((s) => s.observation_status === 'Completed').length;
            } else {
                verifiedCount = historicalSessions.filter((h) => {
                    const hDay = (h.monitoring_date || '').toLowerCase();
                    return hDay.includes(d.short.toLowerCase()) && (h.session_outcome || '').toLowerCase().includes('conducted');
                }).length;
            }

            return {
                day: d.short,
                fullDay: d.key,
                isToday,
                total: scheduledForDay.length > 0 ? scheduledForDay.length : (isToday ? sessionsList.length : 0),
                verified: verifiedCount,
            };
        });
    }, [allWeeklyTimetableSessions, sessionsList, historicalSessions, todayName]);

    // 4. LABORATORY UTILIZATION (Filtered by Today vs Weekly Schedule)
    const labUtilizationData = useMemo(() => {
        return assignedRooms.map((room) => {
            const roomName = room.room_name || room.name || `Room ${room.id}`;

            let usedCount = 0;
            let maxCapacity = 0;

            if (utilizationFilter === 'Today') {
                // Number of sessions today in this lab
                const todayInLab = sessionsList.filter((s) => s.room_id === room.id || s.room_name === roomName);
                usedCount = todayInLab.length;
                maxCapacity = 7; // Max possible sessions in a day (7:30 AM to 7:00 PM standard slots)
            } else {
                // Weekly schedule sessions in this lab
                const weeklyInLab = (timetablesByRoom[room.id] || []).length;
                usedCount = weeklyInLab;
                maxCapacity = 35; // Standard 35 weekly laboratory slots (6 days * ~6 slots)
            }

            const pct = maxCapacity > 0 ? Math.min(100, Math.round((usedCount / maxCapacity) * 100)) : 0;

            let color = 'bg-blue-500';
            if (pct >= 80) color = 'bg-amber-500';
            else if (pct >= 60) color = 'bg-emerald-500';
            else if (pct >= 30) color = 'bg-blue-400';
            else color = 'bg-slate-300 dark:bg-slate-600';

            return {
                room: roomName,
                used: usedCount,
                max: maxCapacity,
                pct,
                color,
            };
        });
    }, [assignedRooms, sessionsList, timetablesByRoom, utilizationFilter]);

    // 5. INCIDENT TYPES (Filtered by All Labs or Specific Lab)
    const incidentTypesData = useMemo(() => {
        let pool = allDiscrepancies;
        if (incidentFilter !== 'All Assigned Labs') {
            pool = pool.filter((d) => {
                const rName = d.room?.room_name || d.room?.name || '';
                return rName === incidentFilter;
            });
        }

        const countsByType: Record<string, number> = {};
        pool.forEach((d) => {
            const type = d.discrepancy_type || 'Unspecified Incident';
            countsByType[type] = (countsByType[type] || 0) + 1;
        });

        const list = Object.entries(countsByType).map(([type, count]) => {
            let color = 'bg-amber-500';
            let iconBg = 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';

            if (type.toLowerCase().includes('occupied') || type.toLowerCase().includes('absent')) {
                color = 'bg-rose-500';
                iconBg = 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
            } else if (type.toLowerCase().includes('equipment') || type.toLowerCase().includes('hardware')) {
                color = 'bg-amber-500';
                iconBg = 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
            } else if (type.toLowerCase().includes('power') || type.toLowerCase().includes('network')) {
                color = 'bg-blue-500';
                iconBg = 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400';
            } else if (type.toLowerCase().includes('maintenance')) {
                color = 'bg-slate-400';
                iconBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            }

            return { type, count, color, iconBg };
        });

        // Sort descending by count
        list.sort((a, b) => b.count - a.count);

        const maxCount = list.length > 0 ? Math.max(...list.map((x) => x.count), 1) : 1;

        return { list, maxCount };
    }, [allDiscrepancies, incidentFilter]);

    // 6. SESSION STATUS BY LABORATORY (Stacked bars per lab)
    const sessionByLabData = useMemo(() => {
        let rooms = assignedRooms;
        if (sessionByLabFilter !== 'All Labs') {
            rooms = rooms.filter((r) => (r.room_name || r.name) === sessionByLabFilter);
        }

        return rooms.map((room) => {
            const roomName = room.room_name || room.name || `Room ${room.id}`;
            const inLab = sessionsList.filter((s) => s.room_id === room.id || s.room_name === roomName);

            const completed = inLab.filter((s) => s.observation_status === 'Completed').length;
            const inProgress = inLab.filter((s) => ['In Progress', 'Started On Time'].includes(s.observation_status)).length;
            const upcoming = inLab.filter((s) => ['Upcoming', 'Ready to Monitor'].includes(s.observation_status)).length;
            const unmonitored = inLab.filter((s) => s.observation_status === 'Unmonitored').length;
            const disruptions = inLab.filter((s) => s.has_discrepancy).length;

            const total = completed + inProgress + upcoming + unmonitored + disruptions;

            return {
                room: roomName,
                completed,
                inProgress,
                upcoming,
                unmonitored,
                disruptions,
                total,
            };
        });
    }, [assignedRooms, sessionsList, sessionByLabFilter]);

    // 7. RECENT ACTIVITY (Derived from today's actual updates & open discrepancies)
    const recentActivities = useMemo(() => {
        const events: { time: string; title: string; detail: string; dotColor: string }[] = [];

        // Add monitored sessions today
        sessionsList.forEach((s) => {
            if (s.observation_status === 'Completed') {
                events.push({
                    time: s.actual_end_time || s.scheduled_end || 'Today',
                    title: 'Session verified & completed',
                    detail: `${s.room_name} – ${s.course_code} (${s.expected_faculty})`,
                    dotColor: 'bg-emerald-500',
                });
            } else if (s.observation_status === 'In Progress') {
                events.push({
                    time: s.actual_start_time || s.scheduled_start || 'Live',
                    title: 'Session started & monitoring active',
                    detail: `${s.room_name} – ${s.course_code} (${s.section})`,
                    dotColor: 'bg-blue-500',
                });
            } else if (s.has_discrepancy) {
                events.push({
                    time: s.scheduled_start || 'Today',
                    title: 'Discrepancy logged',
                    detail: `${s.room_name} – ${s.room_condition}`,
                    dotColor: 'bg-rose-500',
                });
            }
        });

        // Add latest discrepancies
        allDiscrepancies.slice(0, 3).forEach((d) => {
            events.push({
                time: d.created_at ? new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
                title: `${d.discrepancy_type}`,
                detail: `${d.room?.room_name || 'Lab'} – ${d.resolution_status}`,
                dotColor: d.severity === 'Blocking' ? 'bg-rose-500' : 'bg-amber-500',
            });
        });

        return events.slice(0, 5);
    }, [sessionsList, allDiscrepancies]);

    return (
        <div className="space-y-4">
            {/* 1. MODULE-SPECIFIC HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
                        <BarChart3 className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                            Live overview of laboratory operations, timetable utilization, and active alerts.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Period Navigator with functional offset */}
                    <div className="inline-flex items-center rounded-lg border bg-background px-1 py-1 text-xs shadow-2xs">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedPeriodOffset((prev) => prev - 1)}
                            title="Previous week"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1.5 px-2 font-semibold text-foreground text-xs whitespace-nowrap">
                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{selectedPeriodLabel}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedPeriodOffset((prev) => prev + 1)}
                            title="Next week"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* End-of-Day Closing Report Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-xs border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold gap-1.5 shadow-2xs shrink-0"
                        onClick={() => router.get('/monitoring/lab-in-charge/end-of-day')}
                    >
                        <FileCheck className="h-4 w-4 text-amber-600" />
                        <span>End-of-Day Closing Report</span>
                    </Button>
                </div>
            </div>

            {/* 2. TOP METRIC CARDS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {kpiCards.map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                        <Card key={idx} className="border bg-card shadow-2xs rounded-xl overflow-hidden p-3.5 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                    <span className="text-[11px] font-semibold text-muted-foreground leading-tight line-clamp-1">
                                        {card.title}
                                    </span>
                                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-0.5">
                                        {card.value}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {card.subtitle}
                                    </div>
                                </div>
                                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', card.iconBg)}>
                                    <CardIcon className={cn('h-4 w-4', card.iconColor)} />
                                </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-1.5 text-[10px]">
                                <span
                                    className={cn(
                                        'font-bold inline-flex items-center px-1.5 py-0.5 rounded text-[10px]',
                                        card.trendType === 'positive' && 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
                                        card.trendType === 'negative' && 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
                                        card.trendType === 'neutral' && 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40'
                                    )}
                                >
                                    {card.trend}
                                </span>
                                <span className="text-muted-foreground truncate">{card.trendLabel}</span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* 3. MIDDLE GRID (3 CARDS): Monitoring Status Distribution, Daily Session Trend, Laboratory Utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 3A. Monitoring Status Distribution (Donut Chart) */}
                <Card className="border bg-card shadow-2xs rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Monitoring Status Distribution</h3>
                            <p className="text-[11px] text-muted-foreground">
                                {statusDistFilter === 'All Assigned Labs'
                                    ? "Distribution of today's scheduled sessions."
                                    : `Sessions in ${statusDistFilter}.`}
                            </p>
                        </div>
                        <div className="relative">
                            <select
                                value={statusDistFilter}
                                onChange={(e) => setStatusDistFilter(e.target.value)}
                                className="h-6.5 text-[11px] font-semibold rounded-md border border-input bg-background pl-2 pr-6 shadow-2xs appearance-none cursor-pointer focus:outline-hidden"
                            >
                                <option value="All Assigned Labs">All Labs</option>
                                {assignedRoomNames.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center py-3">
                        {/* SVG Donut Chart with center label */}
                        <div className="sm:col-span-6 flex items-center justify-center relative">
                            {statusDistributionData.total === 0 ? (
                                <div className="h-36 w-36 rounded-full border-4 border-dashed border-muted flex flex-col items-center justify-center text-center p-2">
                                    <span className="text-xs font-bold text-muted-foreground">No Sessions</span>
                                    <span className="text-[9.5px] text-muted-foreground">Recorded</span>
                                </div>
                            ) : (
                                <>
                                    <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
                                        {statusDistributionData.strokeSegments.map((seg, idx) => (
                                            <circle
                                                key={idx}
                                                cx="50"
                                                cy="50"
                                                r="38"
                                                stroke={seg.color}
                                                strokeWidth="12"
                                                strokeDasharray={seg.dashArray}
                                                strokeDashoffset={seg.dashOffset}
                                                fill="transparent"
                                                className="transition-all duration-500"
                                            />
                                        ))}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-xl font-black text-foreground leading-none">{statusDistributionData.total}</span>
                                        <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">Sessions</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="sm:col-span-6 space-y-1.5 text-xs">
                            {statusDistributionData.distribution.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-1 text-[11px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-muted-foreground font-medium truncate">{item.label}</span>
                                    </div>
                                    <div className="font-bold text-foreground tabular-nums shrink-0">
                                        {item.count} <span className="font-normal text-muted-foreground text-[10px]">({item.pct})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* 3B. Daily Session Trend */}
                <Card className="border bg-card shadow-2xs rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Daily Session Trend</h3>
                            <p className="text-[11px] text-muted-foreground">Scheduled timetable vs. verified sessions.</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="h-2 w-2 rounded-xs bg-slate-300 dark:bg-slate-600" />
                                <span>Scheduled</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="h-2 w-2 rounded-xs bg-emerald-500" />
                                <span>Verified</span>
                            </div>
                        </div>
                    </div>

                    {/* Trend Bars */}
                    <div className="py-2">
                        {dailyTrendsData.every((d) => d.total === 0) ? (
                            <div className="h-36 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Activity className="h-6 w-6 stroke-[1.5] mb-1.5 text-muted-foreground/60" />
                                <span className="text-xs font-semibold">No timetable trend data found</span>
                            </div>
                        ) : (
                            <>
                                <div className="h-36 flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-border/40">
                                    {dailyTrendsData.map((d, i) => {
                                        const maxDailyVal = Math.max(...dailyTrendsData.map((x) => x.total), 1);
                                        const totalHeightPct = (d.total / maxDailyVal) * 100;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                                                <div
                                                    className="w-full max-w-[24px] relative flex flex-col items-center justify-end"
                                                    style={{ height: `${totalHeightPct}%` }}
                                                >
                                                    {/* Scheduled background bar */}
                                                    <div className={cn(
                                                        'w-full rounded-t-sm absolute inset-0',
                                                        d.isToday ? 'bg-amber-200/80 dark:bg-amber-950/60' : 'bg-slate-200 dark:bg-slate-700/60'
                                                    )} />
                                                    {/* Verified green bar */}
                                                    <div
                                                        className="w-full bg-emerald-500 rounded-t-sm relative z-10 transition-all"
                                                        style={{ height: `${(d.verified / (d.total || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Day Labels */}
                                <div className="flex justify-between text-center pt-1.5 px-1">
                                    {dailyTrendsData.map((d, i) => (
                                        <div key={i} className="flex-1">
                                            <div className={cn('text-[10px] font-bold', d.isToday ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-foreground')}>
                                                {d.day}
                                            </div>
                                            <div className="text-[8.5px] text-muted-foreground leading-none">
                                                {d.verified}/{d.total}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                {/* 3C. Laboratory Utilization */}
                <Card className="border bg-card shadow-2xs rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Laboratory Utilization</h3>
                            <p className="text-[11px] text-muted-foreground">
                                {utilizationFilter === 'Today' ? 'Room utilization for today.' : 'Full weekly timetable utilization.'}
                            </p>
                        </div>
                        <div className="relative">
                            <select
                                value={utilizationFilter}
                                onChange={(e) => setUtilizationFilter(e.target.value as any)}
                                className="h-6.5 text-[11px] font-semibold rounded-md border border-input bg-background pl-2 pr-6 shadow-2xs appearance-none cursor-pointer focus:outline-hidden"
                            >
                                <option value="Weekly Schedule">Weekly Timetable</option>
                                <option value="Today">Today Only</option>
                            </select>
                            <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2.5 py-1">
                        {labUtilizationData.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                No assigned laboratories found.
                            </div>
                        ) : (
                            labUtilizationData.map((lab, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="font-bold text-[11px] text-foreground w-12 shrink-0 truncate">{lab.room}</span>
                                    <div className="flex-1 bg-muted/40 h-2.5 rounded-full overflow-hidden">
                                        <div className={cn('h-full rounded-full transition-all', lab.color)} style={{ width: `${lab.pct}%` }} />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono w-10 text-right tabular-nums">
                                        {lab.used}/{lab.max}
                                    </span>
                                    <span className="text-[10px] font-bold text-foreground font-mono w-7 text-right tabular-nums">
                                        {lab.pct}%
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* 4. BOTTOM GRID (3 CARDS): Incident Types, Session Status by Laboratory, Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 4A. Incident Types */}
                <Card className="border bg-card shadow-2xs rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Incident Types</h3>
                            <p className="text-[11px] text-muted-foreground">
                                {incidentFilter === 'All Assigned Labs' ? 'Issues reported across assigned laboratories.' : `Issues reported in ${incidentFilter}.`}
                            </p>
                        </div>
                        <div className="relative">
                            <select
                                value={incidentFilter}
                                onChange={(e) => setIncidentFilter(e.target.value)}
                                className="h-6.5 text-[11px] font-semibold rounded-md border border-input bg-background pl-2 pr-6 shadow-2xs appearance-none cursor-pointer focus:outline-hidden"
                            >
                                <option value="All Assigned Labs">All Labs</option>
                                {assignedRoomNames.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2.5 py-2">
                        {incidentTypesData.list.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center">
                                <CheckCircle2 className="h-6 w-6 stroke-[1.8] text-emerald-500 mb-1" />
                                <span className="font-semibold text-foreground">No Incidents Reported</span>
                                <span className="text-[11px]">All laboratories operating without logged discrepancies.</span>
                            </div>
                        ) : (
                            incidentTypesData.list.map((item, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className={cn('h-4 w-4 rounded flex items-center justify-center text-[10px] shrink-0 font-bold', item.iconBg)}>
                                            !
                                        </span>
                                        <span className="text-[11px] font-medium text-foreground truncate">{item.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 w-32 shrink-0">
                                        <div className="flex-1 bg-muted/40 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full', item.color)}
                                                style={{ width: `${(item.count / incidentTypesData.maxCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-bold text-foreground w-3 text-right tabular-nums">{item.count}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* 4B. Session Status by Laboratory */}
                <Card className="border bg-card shadow-2xs rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Session Status by Laboratory</h3>
                            <p className="text-[11px] text-muted-foreground">Today's monitoring status breakdown per lab.</p>
                        </div>
                        <div className="relative">
                            <select
                                value={sessionByLabFilter}
                                onChange={(e) => setSessionByLabFilter(e.target.value)}
                                className="h-6.5 text-[11px] font-semibold rounded-md border border-input bg-background pl-2 pr-6 shadow-2xs appearance-none cursor-pointer focus:outline-hidden"
                            >
                                <option value="All Labs">All Labs</option>
                                {assignedRoomNames.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="py-2">
                        {sessionByLabData.length === 0 || sessionByLabData.every((item) => item.total === 0) ? (
                            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center">
                                <Layers className="h-6 w-6 stroke-[1.8] text-muted-foreground/60 mb-1" />
                                <span className="font-semibold text-foreground">No Sessions To Display</span>
                                <span className="text-[11px]">No active scheduled sessions for selected laboratory scope.</span>
                            </div>
                        ) : (
                            <>
                                {/* Stacked Bars Container */}
                                <div className="h-36 flex items-end justify-between gap-2 px-1 border-b border-border/40">
                                    {sessionByLabData.map((item, idx) => {
                                        const total = item.total;
                                        const maxVal = Math.max(...sessionByLabData.map((x) => x.total), 1);
                                        const heightPct = (total / maxVal) * 100;

                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                                                <div
                                                    className="w-full max-w-[20px] rounded-t-sm flex flex-col-reverse overflow-hidden shadow-2xs"
                                                    style={{ height: `${heightPct}%` }}
                                                >
                                                    {total > 0 ? (
                                                        <>
                                                            {/* Completed (green) */}
                                                            <div style={{ height: `${(item.completed / total) * 100}%` }} className="bg-emerald-500 w-full" />
                                                            {/* In Progress (blue) */}
                                                            <div style={{ height: `${(item.inProgress / total) * 100}%` }} className="bg-blue-500 w-full" />
                                                            {/* Upcoming (amber) */}
                                                            <div style={{ height: `${(item.upcoming / total) * 100}%` }} className="bg-amber-400 w-full" />
                                                            {/* Unmonitored (red) */}
                                                            <div style={{ height: `${(item.unmonitored / total) * 100}%` }} className="bg-rose-500 w-full" />
                                                            {/* Disruptions (purple) */}
                                                            <div style={{ height: `${(item.disruptions / total) * 100}%` }} className="bg-purple-500 w-full" />
                                                        </>
                                                    ) : (
                                                        <div className="bg-muted/30 w-full h-full" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Lab labels */}
                                <div className="flex justify-between text-center pt-1.5 px-1">
                                    {sessionByLabData.map((item, idx) => (
                                        <div key={idx} className="flex-1 text-[10px] font-bold text-foreground truncate">
                                            {item.room}
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/40 text-[9.5px] text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-xs bg-emerald-500" /> Completed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-xs bg-blue-500" /> In Progress
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-xs bg-amber-400" /> Upcoming
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-xs bg-rose-500" /> Unmonitored
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-xs bg-purple-500" /> Disruptions
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                {/* 4C. Recent Activity */}
                <Card className="border bg-card shadow-2xs rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
                            <p className="text-[11px] text-muted-foreground">Latest events in assigned laboratories.</p>
                        </div>
                        <Button
                            variant="link"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 p-0 h-auto font-bold text-xs"
                            onClick={() => (onNavigateTab ? onNavigateTab('history') : router.get('/monitoring/lab-in-charge?tab=history'))}
                        >
                            View All
                        </Button>
                    </div>

                    <div className="space-y-3 py-2">
                        {recentActivities.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center">
                                <Activity className="h-6 w-6 stroke-[1.8] text-muted-foreground/60 mb-1" />
                                <span className="font-semibold text-foreground">No Recent Events</span>
                                <span className="text-[11px]">Audit activity will appear as sessions are monitored.</span>
                            </div>
                        ) : (
                            recentActivities.map((act, i) => (
                                <div key={i} className="flex items-start justify-between gap-2 text-xs">
                                    <div className="flex items-start gap-2 min-w-0">
                                        <span className={cn('h-2 w-2 rounded-full mt-1 shrink-0', act.dotColor)} />
                                        <div className="min-w-0">
                                            <div className="font-bold text-[11px] text-foreground leading-tight">{act.title}</div>
                                            <div className="text-[10px] text-muted-foreground truncate">{act.detail}</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0 mt-0.5">
                                        {act.time}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
