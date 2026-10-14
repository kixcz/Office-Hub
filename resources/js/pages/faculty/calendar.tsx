import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Clock,
    Filter
} from 'lucide-react';

interface Props {
    faculty: any;
    calendarData: any;
    schedules: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Calendar', href: '/faculty/calendar' },
];

export default function FacultyCalendarPage({ faculty, calendarData, schedules = [] }: Props) {
    const events = calendarData?.events || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Calendar - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Personal Academic Calendar</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Consolidated view of teaching schedules, committee meetings, submission deadlines, and college activities.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/faculty/schedule"
                            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                        >
                            View Weekly Timetable
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map((ev: any) => (
                        <div key={ev.id} className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    ev.type === 'meeting'
                                        ? 'bg-blue-100 text-blue-800'
                                        : ev.type === 'deadline'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-purple-100 text-purple-800'
                                }`}>
                                    {ev.type?.toUpperCase()}
                                </span>
                                <span className="text-xs font-mono font-bold text-muted-foreground">
                                    {ev.date}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-foreground">{ev.title}</h3>
                                {ev.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                                )}
                            </div>

                            <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                                <span className="font-mono">{ev.start_time} - {ev.end_time}</span>
                                <span className="font-semibold text-foreground">{ev.venue}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
