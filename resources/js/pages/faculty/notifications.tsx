import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Bell,
    Megaphone,
    FileText,
    MapPin,
    Calendar,
    Clock,
    CheckCircle2
} from 'lucide-react';

interface Props {
    faculty: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Notifications', href: '/faculty/notifications' },
];

export default function FacultyNotificationsPage({ faculty }: Props) {
    const notifications = [
        {
            id: 1,
            title: 'Midterm Exam Guidelines Published',
            description: 'The Dean’s office has released the examination schedule and proctoring assignments for AY 2026–2027.',
            time: '2 hours ago',
            type: 'announcement',
            icon: Megaphone,
            color: 'bg-blue-100 text-blue-700',
        },
        {
            id: 2,
            title: 'Requirement Deadline Reminder',
            description: 'Class Attendance Report (Week 6) is due today by 5:00 PM. Please ensure submissions are uploaded.',
            time: '4 hours ago',
            type: 'deadline',
            icon: FileText,
            color: 'bg-amber-100 text-amber-700',
        },
        {
            id: 3,
            title: 'Classroom Reassignment',
            description: 'BSIT 2B Data Structures has been reassigned to Room 302 due to network equipment maintenance.',
            time: '6 hours ago',
            type: 'schedule',
            icon: MapPin,
            color: 'bg-purple-100 text-purple-700',
        },
        {
            id: 4,
            title: 'Call for Research Proposals',
            description: 'Institutional research grants are now accepting submissions for the upcoming academic cycle.',
            time: '1 day ago',
            type: 'research',
            icon: Calendar,
            color: 'bg-rose-100 text-rose-700',
        },
        {
            id: 5,
            title: 'Faculty Meeting Tomorrow',
            description: 'General faculty meeting scheduled for tomorrow at 9:00 AM in Conference Room A.',
            time: '1 day ago',
            type: 'meeting',
            icon: Clock,
            color: 'bg-emerald-100 text-emerald-700',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">System & Administrative Notifications</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Alerts regarding deadlines, submission approvals, schedule changes, and college announcements.
                    </p>
                </div>

                <div className="bg-card rounded-2xl border border-border divide-y divide-border/60 overflow-hidden shadow-2xs">
                    {notifications.map((n) => {
                        const Icon = n.icon;
                        return (
                            <div key={n.id} className="p-4.5 hover:bg-muted/40 transition-colors flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl ${n.color} flex items-center justify-center shrink-0`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                                        <span className="text-xs text-muted-foreground font-mono">{n.time}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        {n.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
