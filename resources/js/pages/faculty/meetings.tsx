import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Users,
    Activity,
    Projector,
    ExternalLink
} from 'lucide-react';

interface Props {
    faculty: any;
    meetings: Array<any>;
    activities: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Meetings & Events', href: '/faculty/meetings' },
];

export default function FacultyMeetingsPage({ faculty, meetings = [], activities = [] }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meetings & Activities - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Meetings & Institutional Activities</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Official college conferences, department meetings, workshops, and student academic events.
                        </p>
                    </div>

                    <Link
                        href="/faculty/calendar"
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs"
                    >
                        View Calendar Grid
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Meetings List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Projector className="w-5 h-5 text-blue-500" />
                            <h2 className="text-base font-black text-foreground">Official Meetings</h2>
                        </div>

                        <div className="space-y-3">
                            {meetings.length > 0 ? (
                                meetings.map((m) => (
                                    <div key={m.id} className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                Meeting
                                            </span>
                                            <span className="text-xs font-mono font-bold text-muted-foreground">
                                                {m.date} • {m.start_time} - {m.end_time}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground">{m.title}</h3>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Venue: {m.venue || 'Main Conference Room'}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
                                    No scheduled meetings.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Institutional Activities List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-500" />
                            <h2 className="text-base font-black text-foreground">College Activities & Events</h2>
                        </div>

                        <div className="space-y-3">
                            {activities.length > 0 ? (
                                activities.map((a) => (
                                    <div key={a.id} className="bg-card rounded-2xl border border-border p-4.5 shadow-2xs space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                                {a.category || 'Event'}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-muted-foreground">
                                                {a.date} • {a.start_time} - {a.end_time}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Venue: {a.venue || 'University Campus'}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
                                    No upcoming college activities.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
