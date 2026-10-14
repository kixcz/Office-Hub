import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Calendar,
    ChevronDown,
    ChevronRight,
    Search,
    BookOpen,
    GraduationCap,
    Users,
    Building2,
    SlidersHorizontal,
    Sliders,
    CheckCircle2,
    FileSpreadsheet,
    FileText,
    Clock,
    Eye,
    Sparkles,
    PanelLeftClose,
    PanelLeft,
    CheckSquare,
    Layers,
    Table,
    FileCheck,
    Cpu,
    Scale,
    ShieldCheck,
    BarChart3,
    Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface SchedulingNavItem {
    id: string;
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
}

export interface SchedulingNavGroup {
    title: string;
    items: SchedulingNavItem[];
}

export const SCHEDULING_NAV_GROUPS: SchedulingNavGroup[] = [
    {
        title: 'WORKSPACE',
        items: [
            { id: 'overview', title: 'Overview', url: '/schedule/generator', icon: Layers },
        ],
    },
    {
        title: '01 · MASTER DATA',
        items: [
            { id: 'periods', title: 'Academic Periods', url: '/schedule/master-data/academic-periods', icon: Clock },
            { id: 'calendar', title: 'Academic Calendar Import', url: '/schedule/calendar-import', icon: CalendarDays },
            { id: 'curriculum', title: 'Programs & Curriculum', url: '/schedule/master-data/programs', icon: GraduationCap },
            { id: 'sections', title: 'Sections & Offerings', url: '/schedule/sections', icon: Table },
            { id: 'faculty', title: 'Faculty & Specializations', url: '/schedule/master-data/faculty', icon: Users },
            { id: 'rooms', title: 'Rooms & Laboratories', url: '/schedule/master-data/rooms', icon: Building2 },
        ],
    },
    {
        title: '02 · FACULTY LOADING',
        items: [
            { id: 'policies', title: 'Load Policies', url: '/schedule/loading?view=policies', icon: Sliders },
            { id: 'availability', title: 'Faculty Availability', url: '/schedule/loading?view=availability', icon: CalendarCheckIcon },
            { id: 'loading', title: 'Load Assignments', url: '/schedule/loading', icon: Scale },
        ],
    },
    {
        title: '03 · TIMETABLE GENERATION',
        items: [
            { id: 'constraints', title: 'Constraint Rules', url: '/schedule/generator?tab=constraints', icon: SlidersHorizontal },
            { id: 'readiness', title: 'Readiness & Validation', url: '/schedule/generator?tab=readiness', icon: CheckCircle2 },
            { id: 'generator', title: 'Generation Settings', url: '/schedule/generator?tab=generate', icon: Cpu },
            { id: 'candidates', title: 'Candidate Comparison', url: '/schedule/generator?tab=candidates', icon: FileSpreadsheet },
            { id: 'editor', title: 'Timetable Editor', url: '/schedule/timetable', icon: Table },
            { id: 'conflicts', title: 'Conflict Center', url: '/schedule/conflicts', icon: ShieldCheck, badge: '!' },
        ],
    },
    {
        title: '04 · INSPECTION & APPROVAL',
        items: [
            { id: 'reviews', title: 'Program Head Reviews', url: '/schedule/reviews?role=program_head', icon: FileCheck },
            { id: 'dean', title: 'Dean Inspection', url: '/schedule/reviews?role=dean', icon: ShieldCheck },
            { id: 'approval', title: 'Final Approval & Publish', url: '/schedule/reviews?tab=publish', icon: CheckSquare },
            { id: 'versions', title: 'Versions & Audit Trail', url: '/schedule/reviews?tab=versions', icon: Clock },
        ],
    },
    {
        title: '05 · OFFICIAL SCHEDULES',
        items: [
            { id: 'published', title: 'Published Views', url: '/schedule/master-timetable', icon: Eye },
            { id: 'utilization', title: 'Room Utilization', url: '/schedule/master-timetable?view=room', icon: BarChart3 },
            { id: 'distribution', title: 'Faculty Distribution', url: '/schedule/master-timetable?tab=distribution', icon: Send },
        ],
    },
    {
        title: '06 · AI ASSISTANCE',
        items: [
            { id: 'assistant', title: 'Gemini Assistant', url: '/schedule/gemini', icon: Sparkles },
        ],
    },
];

function CalendarCheckIcon({ className }: { className?: string }) {
    return <Calendar className={className} />;
}

interface SchedulingWorkspaceLayoutProps {
    children: React.ReactNode;
    currentPeriod?: any;
}

export function SchedulingWorkspaceLayout({ children, currentPeriod }: SchedulingWorkspaceLayoutProps) {
    const page = usePage<any>();
    const currentUrl = page.url;
    const activePeriod = currentPeriod || page.props.currentAcademicPeriod;

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (title: string) => {
        setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    return (
        <div className="flex w-full min-h-[calc(100vh-4rem)] bg-slate-50/50">
            {/* ========================================================================= */}
            {/* PERSISTENT SCHEDULING MINI SIDEBAR                                        */}
            {/* ========================================================================= */}
            <aside
                className={cn(
                    'sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200/90 transition-all duration-200 ease-in-out shrink-0 z-20 flex flex-col',
                    isCollapsed ? 'w-16' : 'w-72'
                )}
            >
                {/* Brand / Mini Sidebar Header */}
                <div className="p-3.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 h-16">
                    <div className={cn('flex items-center gap-2.5 min-w-0', isCollapsed && 'justify-center w-full')}>
                        <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                            <CalendarDays className="w-5 h-5 text-slate-950" />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <h2 className="text-xs font-black text-slate-900 tracking-tight leading-tight truncate">
                                    Semester <span className="text-amber-500">Scheduling</span>
                                </h2>
                                <span className="text-[9px] font-bold tracking-wider text-slate-400 block uppercase">
                                    Workspace Navigation
                                </span>
                            </div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <button
                            type="button"
                            onClick={() => setIsCollapsed(true)}
                            title="Collapse to icon rail"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* If collapsed, show single expand toggle */}
                {isCollapsed && (
                    <div className="p-2 border-b border-slate-100 flex justify-center">
                        <button
                            type="button"
                            onClick={() => setIsCollapsed(false)}
                            title="Expand scheduling navigation"
                            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                        >
                            <PanelLeft className="w-4 h-4 text-amber-500" />
                        </button>
                    </div>
                )}

                {/* Academic Period Context Selector Card & Search */}
                {!isCollapsed && (
                    <div className="p-3.5 border-b border-slate-100 space-y-3 bg-slate-50/40 shrink-0">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Academic Period</span>
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Current
                            </span>
                        </div>

                        <Link
                            href="/administration/academic-periods"
                            preserveScroll
                            className="block p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/50 transition-colors"
                        >
                            <div className="text-[10px] text-slate-500 font-medium leading-none">
                                {activePeriod?.academic_year || 'AY 2026–2027'}
                            </div>
                            <div className="text-xs font-bold text-slate-900 mt-1 flex items-center justify-between">
                                <span>{activePeriod?.semester || '1st Semester'}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                        </Link>

                        {/* Quick filter input */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="Find a module..."
                                className="pl-8 h-8 text-[11px] rounded-lg border-slate-200 bg-white placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                )}

                {/* Scrollable Navigation Groups */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {SCHEDULING_NAV_GROUPS.map((group) => {
                        const isGroupClosed = collapsedGroups[group.title];
                        const filteredItems = group.items.filter((item) =>
                            !searchFilter.trim() || item.title.toLowerCase().includes(searchFilter.toLowerCase().trim())
                        );

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={group.title} className="space-y-1">
                                {!isCollapsed && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.title)}
                                        className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-400 hover:text-slate-700 tracking-wider transition-colors cursor-pointer"
                                    >
                                        <span>{group.title}</span>
                                        <ChevronDown
                                            className={cn(
                                                'w-3 h-3 text-slate-400 transition-transform duration-150',
                                                isGroupClosed && '-rotate-90'
                                            )}
                                        />
                                    </button>
                                )}

                                {!isGroupClosed && (
                                    <div className="space-y-0.5">
                                        {filteredItems.map((item) => {
                                            const isActive =
                                                currentUrl === item.url ||
                                                (item.url !== '/schedule/generator' && currentUrl.startsWith(item.url.split('?')[0]));

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.url}
                                                    preserveScroll
                                                    title={item.title}
                                                    className={cn(
                                                        'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group',
                                                        isActive
                                                            ? 'bg-amber-100/70 text-amber-950 font-bold border-l-3 border-amber-500 shadow-2xs'
                                                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                                                        isCollapsed && 'justify-center px-0'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            'w-4 h-4 shrink-0 transition-colors',
                                                            isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-700'
                                                        )}
                                                    />
                                                    {!isCollapsed && (
                                                        <span className="truncate flex-1 text-left">{item.title}</span>
                                                    )}
                                                    {!isCollapsed && item.badge && (
                                                        <span className="ml-auto inline-flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* ========================================================================= */}
            {/* ACTIVE SCHEDULING MODULE CONTENT ON THE RIGHT                             */}
            {/* ========================================================================= */}
            <div className="flex-1 min-w-0 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

export default SchedulingWorkspaceLayout;
