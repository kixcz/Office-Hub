import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Clock,
    BookOpen,
    Download
} from 'lucide-react';

interface Props {
    faculty: any;
    schedules: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Teaching Schedule', href: '/faculty/schedule' },
];

export default function FacultySchedulePage({ faculty, schedules = [] }: Props) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [selectedDay, setSelectedDay] = useState('All');

    const filtered = selectedDay === 'All' ? schedules : schedules.filter((s) => s.day_of_week === selectedDay);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Teaching Schedule - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Teaching Schedule</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Published class timetable for AY 2026–2027, 1st Semester.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export PDF / Print</span>
                        </button>
                    </div>
                </div>

                {/* Day filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setSelectedDay('All')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedDay === 'All'
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        All Days
                    </button>
                    {days.map((d) => (
                        <button
                            key={d}
                            onClick={() => setSelectedDay(d)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                selectedDay === d
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                {/* Schedule Table / Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.length > 0 ? (
                        filtered.map((s) => (
                            <div key={s.id} className="bg-card rounded-2xl border border-border p-5 shadow-2xs hover:shadow-xs transition-all space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        {s.day_of_week}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-muted-foreground">
                                        {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                                    </span>
                                </div>

                                <div>
                                    <div className="text-sm font-extrabold text-foreground leading-snug">
                                        {s.course_code ? `${s.course_code} - ` : ''}{s.course_title || 'Subject Class'}
                                    </div>
                                    <div className="text-xs font-semibold text-muted-foreground mt-1">
                                        Section: {s.section || 'All Sections'}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{s.room_name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600">
                                        Confirmed
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-muted-foreground text-xs font-medium bg-card rounded-2xl border border-border">
                            No scheduled classes found for selected filter.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
