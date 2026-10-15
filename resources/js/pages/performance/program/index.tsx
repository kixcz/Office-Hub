import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    BarChart3,
    GraduationCap,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    Search,
    SlidersHorizontal,
    Download,
    MoreVertical,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    PieChart,
    Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Program Performance', href: '/performance/program' },
];

interface ProgramPerformance {
    id: number;
    name: string;
    code: string;
    badge_color?: string;
    total_faculty: number;
    compliant_faculty: number;
    perfect_faculty_count: number;
    total_requirements: number;
    overdue: number;
    compliance_rate: number;
    on_time_rate: number;
    trend: 'up' | 'down';
}

interface DistributionItem {
    code: string;
    count: number;
    percentage: number;
    color: string;
}

interface KPIs {
    total_programs: number;
    total_faculty: number;
    compliant_faculty: number;
    compliance_rate: number;
    on_time_submissions: number;
    on_time_rate: number;
    overdue_count: number;
    overdue_rate: number;
}

interface AcademicPeriod {
    year: string;
    semester: string;
    date_range: string;
    label: string;
}

interface Props {
    performances: ProgramPerformance[];
    kpis: KPIs;
    distribution: DistributionItem[];
    academic_period: AcademicPeriod;
}

export default function ProgramPerformanceIndex({
    performances = [],
    kpis,
    distribution = [],
    academic_period,
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('rank');

    // Filter and Sort
    const filteredPerformances = useMemo(() => {
        let list = performances.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortBy === 'compliance') {
            list = [...list].sort((a, b) => b.compliance_rate - a.compliance_rate);
        } else if (sortBy === 'ontime') {
            list = [...list].sort((a, b) => b.on_time_rate - a.on_time_rate);
        } else if (sortBy === 'faculty') {
            list = [...list].sort((a, b) => b.total_faculty - a.total_faculty);
        }

        return list;
    }, [performances, searchTerm, sortBy]);

    // Rank Medal helper
    const renderRankBadge = (index: number) => {
        if (index === 0) {
            return (
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-300">
                    🥇
                </div>
            );
        }
        if (index === 1) {
            return (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0 border border-slate-300">
                    🥈
                </div>
            );
        }
        if (index === 2) {
            return (
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-black text-xs flex items-center justify-center shrink-0 border border-orange-300">
                    🥉
                </div>
            );
        }
        return (
            <span className="w-6 text-center font-mono text-xs text-muted-foreground font-bold">
                {index + 1}
            </span>
        );
    };

    // Program avatar badge helper
    const renderProgramBadge = (code: string) => {
        const badgeStyles: Record<string, string> = {
            BSIS: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/50',
            BSIT: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
            BLIS: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300',
            BSCS: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
        };
        const style = badgeStyles[code] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';

        return (
            <div className={cn("w-9 h-9 rounded-full font-extrabold text-[11px] flex items-center justify-center shrink-0 border", style)}>
                {code}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Program Performance - CIDS OfficeHub" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. TOP MODULE HEADER WITH PERIOD BADGE (Exact match to screenshot banner) */}
                <div className="relative rounded-2xl border border-border bg-gradient-to-r from-card via-card to-amber-50/20 dark:to-amber-950/10 p-6 shadow-xs overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-foreground">
                                    Program Performance
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                                    Compare program performance based on faculty compliance and on-time submission rates.
                                </p>
                            </div>
                        </div>

                        {/* Top Right Academic Period Pill Dropdown */}
                        <div className="bg-card/90 backdrop-blur-xs border border-border/80 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-3">
                            <div className="text-right">
                                <span className="font-extrabold text-xs text-foreground block">
                                    {academic_period?.label || 'AY 2026–2027, 1st Semester'}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block">
                                    {academic_period?.date_range || 'Aug 15, 2026 – Dec 15, 2026'}
                                </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* 2. FIVE TOP KPI METRIC CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Total Programs */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Total Programs
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.total_programs ?? performances.length}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    Academic programs monitored
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Total Faculty */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Total Faculty
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.total_faculty ?? 0}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    Across all programs
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Compliant Faculty */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Compliant Faculty
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.compliant_faculty ?? 0}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    {kpis?.compliance_rate ?? 0}% compliance rate
                                </span>
                            </div>
                        </div>
                        {/* Circular progress badge */}
                        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-muted/20"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-emerald-500"
                                    strokeDasharray={`${kpis?.compliance_rate ?? 0}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute text-[9px] font-black text-emerald-600">
                                {kpis?.compliance_rate ?? 0}%
                            </span>
                        </div>
                    </div>

                    {/* On-Time Submission */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    On-Time Submission
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.on_time_submissions ?? 0}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                    {kpis?.on_time_rate ?? 0}% on-time rate
                                </span>
                            </div>
                        </div>
                        {/* Circular progress badge */}
                        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-muted/20"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-sky-500"
                                    strokeDasharray={`${kpis?.on_time_rate ?? 0}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute text-[9px] font-black text-sky-600">
                                {kpis?.on_time_rate ?? 0}%
                            </span>
                        </div>
                    </div>

                    {/* With Overdue Outputs */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    With Overdue Outputs
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {kpis?.overdue_count ?? 0}
                                </div>
                                <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                    {kpis?.overdue_rate ?? 0}% need attention
                                </span>
                            </div>
                        </div>
                        {/* Circular progress badge */}
                        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-muted/20"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-rose-500"
                                    strokeDasharray={`${kpis?.overdue_rate ?? 0}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute text-[9px] font-black text-rose-600">
                                {kpis?.overdue_rate ?? 0}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. THREE MIDDLE COMPARISON CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Chart 1: Compliance Rate by Program (Col span 4) */}
                    <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center gap-2 pb-3 border-b border-border/70">
                            <BarChart3 className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-foreground">Compliance Rate by Program</h3>
                        </div>

                        {/* Bar chart canvas visualization */}
                        <div className="py-4">
                            <div className="flex items-end justify-around h-40 pt-4 px-2 border-b border-border gap-2">
                                {performances.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground w-full">
                                        No program data available
                                    </div>
                                ) : (
                                    performances.map((p, idx) => {
                                        const heightPercent = Math.max(p.compliance_rate > 0 ? (p.compliance_rate * 0.9) : 4, 4);
                                        const barColors = [
                                            'bg-amber-400',
                                            'bg-amber-300 dark:bg-amber-600',
                                            'bg-sky-400',
                                            'bg-emerald-400',
                                            'bg-indigo-400',
                                        ];
                                        const colorClass = p.compliance_rate === 0
                                            ? 'bg-muted'
                                            : (barColors[idx % barColors.length] || 'bg-amber-400');

                                        return (
                                            <div key={p.id} className="flex flex-col items-center flex-1 max-w-[80px] gap-1.5 h-full justify-end">
                                                <span className="text-[10px] font-bold text-foreground">{p.compliance_rate}%</span>
                                                <div
                                                    className={cn("w-full max-w-[48px] rounded-t-lg transition-all", colorClass)}
                                                    style={{ height: `${heightPercent}%` }}
                                                />
                                                <span className="text-[11px] font-bold text-muted-foreground mt-1 truncate max-w-full text-center">
                                                    {p.code}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Y-axis indicator */}
                            <div className="flex justify-between text-[9px] text-muted-foreground pt-1.5 px-1 font-mono">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart 2: On-Time Submission Rate by Program (Col span 4) */}
                    <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center gap-2 pb-3 border-b border-border/70">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-foreground">On-Time Submission Rate by Program</h3>
                        </div>

                        {/* Bar chart canvas visualization */}
                        <div className="py-4">
                            <div className="flex items-end justify-around h-40 pt-4 px-2 border-b border-border gap-2">
                                {performances.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground w-full">
                                        No program data available
                                    </div>
                                ) : (
                                    performances.map((p, idx) => {
                                        const heightPercent = Math.max(p.on_time_rate > 0 ? (p.on_time_rate * 0.9) : 4, 4);
                                        const barColors = [
                                            'bg-amber-400',
                                            'bg-amber-300 dark:bg-amber-600',
                                            'bg-sky-400',
                                            'bg-emerald-400',
                                            'bg-indigo-400',
                                        ];
                                        const colorClass = p.on_time_rate === 0
                                            ? 'bg-muted'
                                            : (barColors[idx % barColors.length] || 'bg-amber-400');

                                        return (
                                            <div key={p.id} className="flex flex-col items-center flex-1 max-w-[80px] gap-1.5 h-full justify-end">
                                                <span className="text-[10px] font-bold text-foreground">{p.on_time_rate}%</span>
                                                <div
                                                    className={cn("w-full max-w-[48px] rounded-t-lg transition-all", colorClass)}
                                                    style={{ height: `${heightPercent}%` }}
                                                />
                                                <span className="text-[11px] font-bold text-muted-foreground mt-1 truncate max-w-full text-center">
                                                    {p.code}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Y-axis indicator */}
                            <div className="flex justify-between text-[9px] text-muted-foreground pt-1.5 px-1 font-mono">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart 3: Faculty Distribution Donut (Col span 4) */}
                    <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center gap-2 pb-3 border-b border-border/70">
                            <Users className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-foreground">Faculty Distribution</h3>
                        </div>

                        <div className="py-4 flex items-center justify-center gap-6">
                            {/* Donut graphic */}
                            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-muted/20"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    {(() => {
                                        let accumulatedPercent = 0;
                                        const strokeColors = ['#f59e0b', '#fbbf24', '#0284c7', '#10b981', '#8b5cf6'];
                                        return distribution.map((item, idx) => {
                                            const strokeDash = `${item.percentage}, 100`;
                                            const strokeOffset = -accumulatedPercent;
                                            accumulatedPercent += item.percentage;
                                            return (
                                                <path
                                                    key={item.code}
                                                    stroke={item.color || strokeColors[idx % strokeColors.length]}
                                                    strokeDasharray={strokeDash}
                                                    strokeDashoffset={strokeOffset}
                                                    strokeWidth="4"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-black text-foreground leading-none">
                                        {kpis?.total_faculty ?? 0}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">Total Faculty</span>
                                </div>
                            </div>

                            {/* Dynamic Legend */}
                            <div className="space-y-2 text-xs">
                                {distribution.length === 0 ? (
                                    <span className="text-muted-foreground">No distribution data</span>
                                ) : (
                                    distribution.map((item, idx) => {
                                        const dotColors = ['bg-amber-500', 'bg-amber-300', 'bg-sky-500', 'bg-emerald-500', 'bg-indigo-500'];
                                        return (
                                            <div key={item.code} className="flex items-center gap-2">
                                                <span
                                                    className={cn("w-2.5 h-2.5 rounded-full", dotColors[idx % dotColors.length])}
                                                    style={item.color ? { backgroundColor: item.color } : undefined}
                                                />
                                                <span className="font-bold text-foreground">{item.code}</span>
                                                <span className="text-muted-foreground ml-auto pl-2">
                                                    {item.count} ({item.percentage}%)
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. MAIN RANKING TABLE SECTION */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
                    {/* Header Row: Title, Search, Sort, Export */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-foreground">Program Performance Ranking</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Performance ranking based on faculty compliance and on-time submission rates.
                                </p>
                            </div>
                        </div>

                        {/* Search, Sort Dropdown & Export Button */}
                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <div className="relative flex-1 md:w-56">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search program..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
                                />
                            </div>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs cursor-pointer"
                            >
                                <option value="rank">Sort by Rank</option>
                                <option value="compliance">Sort by Compliance</option>
                                <option value="ontime">Sort by On-Time</option>
                                <option value="faculty">Sort by Faculty</option>
                            </select>

                            <Button
                                onClick={() => {
                                    // Quick CSV export
                                    const headers = ["Rank", "Program", "Faculty Total", "Compliant Faculty", "100% Comp Faculty", "Total Reqs", "Overdue", "Comp Rate", "On-Time Rate"];
                                    const rows = filteredPerformances.map((p, idx) => [
                                        idx + 1,
                                        p.name,
                                        p.total_faculty,
                                        p.compliant_faculty,
                                        p.perfect_faculty_count,
                                        p.total_requirements,
                                        p.overdue,
                                        `${p.compliance_rate}%`,
                                        `${p.on_time_rate}%`
                                    ]);
                                    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodeURI(csvContent));
                                    link.setAttribute("download", `Program_Performance_Ranking.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="h-9 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export</span>
                            </Button>
                        </div>
                    </div>

                    {/* Table with columns matching screenshot */}
                    <div className="overflow-x-auto border border-border/80 rounded-xl">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                <tr>
                                    <th className="w-12 px-3 py-3 text-center">#</th>
                                    <th className="px-4 py-3 font-semibold">Program</th>
                                    <th className="px-3 py-3 font-semibold text-center">Faculty Total</th>
                                    <th className="px-3 py-3 font-semibold text-center">Compliant Faculty</th>
                                    <th className="px-3 py-3 font-semibold text-center">100% Comp. Faculty</th>
                                    <th className="px-3 py-3 font-semibold text-center">Total Reqs</th>
                                    <th className="px-3 py-3 font-semibold text-center">Overdue</th>
                                    <th className="px-4 py-3 font-semibold text-center min-w-[140px]">Comp. Rate</th>
                                    <th className="px-4 py-3 font-semibold text-center min-w-[140px]">On-Time Rate</th>
                                    <th className="px-3 py-3 font-semibold text-center">Trend</th>
                                    <th className="px-3 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredPerformances.map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                        {/* Rank Medal or number */}
                                        <td className="px-3 py-3.5 text-center">
                                            <div className="flex items-center justify-center">
                                                {renderRankBadge(idx)}
                                            </div>
                                        </td>

                                        {/* Program Badge and Full Name */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {renderProgramBadge(p.code)}
                                                <div>
                                                    <span className="font-bold text-foreground block">
                                                        {p.name} ({p.code})
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Faculty Total */}
                                        <td className="px-3 py-3.5 text-center font-bold text-foreground tabular-nums">
                                            {p.total_faculty}
                                        </td>

                                        {/* Compliant Faculty */}
                                        <td className="px-3 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            {p.compliant_faculty}
                                        </td>

                                        {/* 100% Comp Faculty */}
                                        <td className="px-3 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            {p.perfect_faculty_count}
                                        </td>

                                        {/* Total Reqs */}
                                        <td className="px-3 py-3.5 text-center font-bold text-foreground tabular-nums">
                                            {p.total_requirements}
                                        </td>

                                        {/* Overdue */}
                                        <td className="px-3 py-3.5 text-center font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                            {p.overdue}
                                        </td>

                                        {/* Comp. Rate with horizontal green progress bar */}
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-2.5">
                                                <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-emerald-500 h-full rounded-full transition-all"
                                                        style={{ width: `${p.compliance_rate}%` }}
                                                    />
                                                </div>
                                                <span className="font-extrabold text-foreground tabular-nums text-xs w-10 text-right">
                                                    {p.compliance_rate}%
                                                </span>
                                            </div>
                                        </td>

                                        {/* On-Time Rate with horizontal blue/amber progress bar */}
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-2.5">
                                                <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            p.on_time_rate > 50 ? "bg-sky-500" : "bg-amber-400"
                                                        )}
                                                        style={{ width: `${p.on_time_rate}%` }}
                                                    />
                                                </div>
                                                <span className="font-extrabold text-foreground tabular-nums text-xs w-12 text-right">
                                                    {p.on_time_rate}%
                                                </span>
                                            </div>
                                        </td>

                                        {/* Trend (Green wavy curve or Red down curve) */}
                                        <td className="px-3 py-3.5 text-center">
                                            <div className="flex items-center justify-center">
                                                {p.trend === 'up' ? (
                                                    <div className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                                                        <TrendingUp className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                                                        <TrendingDown className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Context Actions */}
                                        <td className="px-3 py-3.5 text-right">
                                            <button className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
