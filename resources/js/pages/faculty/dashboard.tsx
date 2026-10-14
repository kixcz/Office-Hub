import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    CheckSquare,
    FlaskConical,
    Sprout,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ExternalLink,
    Megaphone,
    FileText,
    MapPin,
    AlertCircle,
    Info,
    ChevronDown,
    Building2,
    Users
} from 'lucide-react';

interface Props {
    faculty: any;
    kpis: {
        compliance_rate: number;
        compliance_fraction: string;
        compliance_trend: string;
        attendance_rate: number;
        attendance_fraction: string;
        attendance_trend: string;
        tasks_rate: number;
        tasks_fraction: string;
        tasks_trend: string;
        research_count: number;
        research_label: string;
        extension_count: number;
        extension_label: string;
        extension_trend: string;
    };
    today_schedule: Array<{
        id: number;
        time_slot: string;
        title: string;
        course_code: string;
        room: string;
        type: string;
    }>;
    my_tasks: Array<{
        id: number;
        title: string;
        priority: string;
        due_date: string;
        status: string;
    }>;
    notifications: Array<{
        id: number;
        type: string;
        title: string;
        description: string;
        time_ago: string;
        icon: string;
    }>;
    teaching_load: {
        total_units: number;
        academic_period: string;
        breakdown: Array<{
            label: string;
            units: number;
            color: string;
        }>;
    };
    submission_compliance: Array<{
        title: string;
        frequency: string;
        status: string;
        rate: number;
        color: string;
    }>;
    research_projects: Array<any>;
    extension_programs: Array<any>;
    upcoming_events: Array<{
        date: string;
        time: string;
        title: string;
        venue: string;
        type: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Dashboard', href: '/faculty/dashboard' },
];

export default function FacultyDashboard({
    faculty,
    kpis,
    today_schedule,
    my_tasks,
    notifications,
    teaching_load,
    submission_compliance,
    research_projects,
    extension_programs,
    upcoming_events,
}: Props) {
    const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
    const [tasksList, setTasksList] = useState(my_tasks || []);
    const [researchTab, setResearchTab] = useState<'research' | 'extension'>('research');

    const toggleTask = (taskId: number) => {
        setTasksList((prev) =>
            prev.map((t) =>
                t.id === taskId
                    ? {
                          ...t,
                          status: t.status === 'completed' ? 'pending' : 'completed',
                      }
                    : t
            )
        );
    };

    const filteredTasks = tasksList.filter((task) => {
        if (taskFilter === 'all') return true;
        if (taskFilter === 'pending') return task.status === 'pending';
        if (taskFilter === 'in_progress') return task.status === 'in_progress';
        if (taskFilter === 'completed') return task.status === 'completed';
        return true;
    });

    const pendingCount = tasksList.filter((t) => t.status === 'pending').length;
    const inProgressCount = tasksList.filter((t) => t.status === 'in_progress').length;
    const completedCount = tasksList.filter((t) => t.status === 'completed').length;

    // Greeting determination based on current hour
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Dashboard - CIDS OfficeHub" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans">
                {/* 1. Header Hero Banner matching screenshot */}
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-linear-to-r from-slate-100 via-sky-50/50 to-blue-50/40 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 p-6 md:p-8 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-xl font-black text-slate-700 dark:text-slate-200 overflow-hidden shrink-0">
                                {faculty?.photo_url ? (
                                    <img src={faculty.photo_url} alt={faculty.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    faculty ? `${faculty.first_name[0]}${faculty.last_name[0]}` : 'JV'
                                )}
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {greeting}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                                        {faculty?.title_name || 'Instr. Jerick Erie Vicente'}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40">
                                        {faculty?.academic_rank || 'Instructor I'}
                                    </span>
                                </div>
                                <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-2">
                                    <span>{faculty?.program?.name || 'BSIT'}</span>
                                    <span>•</span>
                                    <span>College of Information and Digital Sciences</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side banner quote / photo background */}
                        <div className="hidden lg:flex items-center gap-4 bg-background/80 dark:bg-background/40 backdrop-blur-md px-5 py-3 rounded-xl border border-border/60 text-right">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold italic text-foreground tracking-wide">
                                    "Educating today, innovating tomorrow."
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                    CIDS Academic Excellence 2026–2027
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Top Metric Cards (5 Cards matching screenshot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Compliance Rate */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground">Compliance Rate</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.compliance_rate}%
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-1">
                                {kpis.compliance_fraction}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {kpis.compliance_trend}
                            </div>
                        </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground">Attendance Rate</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.attendance_rate}%
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-1">
                                {kpis.attendance_fraction}
                            </div>
                            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                {kpis.attendance_trend}
                            </div>
                        </div>
                    </div>

                    {/* Tasks Completion */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <CheckSquare className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground">Tasks Completion</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.tasks_rate}%
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-1">
                                {kpis.tasks_fraction}
                            </div>
                            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                                {kpis.tasks_trend}
                            </div>
                        </div>
                    </div>

                    {/* Research Involvement */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                <FlaskConical className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground">Research Involvement</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.research_count}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-1">
                                {kpis.research_label}
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">
                                — No change
                            </div>
                        </div>
                    </div>

                    {/* Extension Involvement */}
                    <div className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                <Sprout className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground">Extension Involvement</div>
                            <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                                {kpis.extension_count}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-1">
                                {kpis.extension_label}
                            </div>
                            <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                                {kpis.extension_trend}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Middle Section: Today's Schedule | My Tasks | Notifications */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Today's Schedule (4 cols) */}
                    <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-sm font-bold text-foreground">Today's Schedule</h3>
                                </div>
                                <Link
                                    href="/faculty/schedule"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                >
                                    View Full Schedule <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {/* Date selector header */}
                            <div className="flex items-center justify-between py-3 text-xs font-semibold text-muted-foreground border-b border-border/40">
                                <div className="flex items-center gap-1 text-foreground">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Wed, Oct 14, 2026</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-muted text-foreground">
                                        Today
                                    </span>
                                    <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Schedule Timeline */}
                            <div className="mt-4 space-y-4">
                                {today_schedule.map((item, idx) => (
                                    <div key={item.id || idx} className="flex items-start gap-3 relative">
                                        {/* Timeline vertical line */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950 mt-1" />
                                            {idx < today_schedule.length - 1 && (
                                                <div className="w-0.5 h-12 bg-border my-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-mono font-bold text-muted-foreground">
                                                {item.time_slot}
                                            </div>
                                            <div className="text-xs font-bold text-foreground truncate mt-0.5">
                                                {item.title}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" />
                                                <span>{item.room}</span>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            item.type === 'Laboratory'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                                : item.type === 'Meeting'
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                        }`}>
                                            {item.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* My Tasks (4 cols) */}
                    <div className="lg:col-span-5 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-sm font-bold text-foreground">My Tasks</h3>
                                </div>
                                <Link
                                    href="/faculty/tasks"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                >
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {/* Task Tabs */}
                            <div className="flex items-center gap-2 py-2.5 border-b border-border/40 text-xs font-semibold">
                                <button
                                    onClick={() => setTaskFilter('all')}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        taskFilter === 'all'
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    All ({tasksList.length})
                                </button>
                                <button
                                    onClick={() => setTaskFilter('pending')}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        taskFilter === 'pending'
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Pending ({pendingCount})
                                </button>
                                <button
                                    onClick={() => setTaskFilter('in_progress')}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        taskFilter === 'in_progress'
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    In Progress ({inProgressCount})
                                </button>
                                <button
                                    onClick={() => setTaskFilter('completed')}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        taskFilter === 'completed'
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Completed ({completedCount})
                                </button>
                            </div>

                            {/* Tasks Checkbox List */}
                            <div className="mt-3 space-y-2.5">
                                {filteredTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/60 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={task.status === 'completed'}
                                                onChange={() => {}}
                                                className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span
                                                className={`text-xs font-semibold truncate ${
                                                    task.status === 'completed'
                                                        ? 'line-through text-muted-foreground'
                                                        : 'text-foreground'
                                                }`}
                                            >
                                                {task.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                    task.priority === 'High'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                        : task.priority === 'Medium'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                }`}
                                            >
                                                {task.priority}
                                            </span>
                                            <span className="text-[11px] font-medium text-muted-foreground">
                                                {task.due_date}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notifications (3 cols) */}
                    <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <Megaphone className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                                </div>
                                <Link
                                    href="/faculty/notifications"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                >
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="mt-3 space-y-3">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                            {notif.icon === 'megaphone' ? (
                                                <Megaphone className="w-4 h-4" />
                                            ) : notif.icon === 'file' ? (
                                                <FileText className="w-4 h-4" />
                                            ) : notif.icon === 'map-pin' ? (
                                                <MapPin className="w-4 h-4" />
                                            ) : notif.icon === 'flask-conical' ? (
                                                <FlaskConical className="w-4 h-4" />
                                            ) : (
                                                <Calendar className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-foreground truncate">
                                                    {notif.title}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                                                    {notif.time_ago}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                                {notif.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Bottom Section: Current Teaching Load | Submission Compliance | Research & Extension | Upcoming Events */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Current Teaching Load */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-sm font-bold text-foreground">Current Teaching Load</h3>
                                </div>
                                <Link
                                    href="/faculty/loading"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                >
                                    View Details <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="mt-3">
                                <div className="text-2xl font-black text-foreground">
                                    {teaching_load.total_units} units
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium">
                                    {teaching_load.academic_period}
                                </div>
                            </div>

                            {/* Doughnut representation & Breakdown */}
                            <div className="mt-5 flex items-center gap-5">
                                <div className="relative w-24 h-24 rounded-full border-8 border-blue-500 flex items-center justify-center shrink-0">
                                    <div className="text-center">
                                        <div className="text-base font-extrabold text-foreground leading-none">15</div>
                                        <div className="text-[9px] text-muted-foreground font-semibold">Units</div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-1.5 text-xs">
                                    {teaching_load.breakdown.map((b) => (
                                        <div key={b.label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: b.color }}
                                                />
                                                <span className="text-muted-foreground">{b.label}</span>
                                            </div>
                                            <span className="font-bold text-foreground">
                                                {b.units > 0 ? `${b.units} units` : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submission Compliance */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-sm font-bold text-foreground">Submission Compliance</h3>
                                </div>
                                <Link
                                    href="/faculty/requirements"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                >
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="mt-4 space-y-3">
                                {submission_compliance.map((item) => (
                                    <div key={item.title} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <div>
                                                <span className="font-bold text-foreground">{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground ml-1.5">
                                                    {item.frequency}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                                        item.status === 'On Track'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                    }`}
                                                >
                                                    ● {item.status}
                                                </span>
                                                <span className="font-mono font-bold text-foreground">
                                                    {item.rate}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${item.rate}%`,
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Research & Extension */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <FlaskConical className="w-4 h-4 text-purple-500" />
                                    <h3 className="text-sm font-bold text-foreground">Research & Extension</h3>
                                </div>
                                <Link
                                    href="/faculty/research-extension"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                >
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-2 mt-3 pb-2 border-b border-border/40 text-xs font-semibold">
                                <button
                                    onClick={() => setResearchTab('research')}
                                    className={`px-3 py-1 rounded-lg transition-colors ${
                                        researchTab === 'research'
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Research ({research_projects.length})
                                </button>
                                <button
                                    onClick={() => setResearchTab('extension')}
                                    className={`px-3 py-1 rounded-lg transition-colors ${
                                        researchTab === 'extension'
                                            ? 'bg-primary text-primary-foreground font-bold'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Extension ({extension_programs.length})
                                </button>
                            </div>

                            <div className="mt-3 space-y-3">
                                {(researchTab === 'research' ? research_projects : extension_programs).map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                {item.status}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {item.period}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-foreground mt-1.5 leading-snug">
                                            {item.title}
                                        </h4>
                                        <div className="text-[11px] text-muted-foreground mt-1">
                                            {item.program} • {item.role}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Events & Meetings */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-sm font-bold text-foreground">Upcoming Events & Meetings</h3>
                                </div>
                                <Link
                                    href="/faculty/calendar"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                >
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="mt-3 space-y-3">
                                {upcoming_events.map((event, idx) => (
                                    <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-muted/40 transition-colors">
                                        <div>
                                            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                {event.date} • {event.time}
                                            </div>
                                            <div className="text-xs font-bold text-foreground mt-0.5">
                                                {event.title}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                <span>{event.venue}</span>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            event.type === 'Meeting'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                : event.type === 'Workshop'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        }`}>
                                            {event.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
