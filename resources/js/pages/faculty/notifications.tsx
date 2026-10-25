import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Megaphone,
    FileText,
    MapPin,
    Calendar,
    Clock,
    CheckCircle2,
    CheckCheck,
    Filter,
    ExternalLink,
    AlertCircle,
    Info,
    Inbox,
} from 'lucide-react';

export interface NotificationItem {
    id: string | number;
    title: string;
    description: string;
    time: string;
    created_at?: string;
    type: string;
    action_url?: string | null;
    read: boolean;
    is_db?: boolean;
}

interface Props {
    faculty?: any;
    notifications: NotificationItem[];
    unreadCount?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Workspace', href: '/faculty/dashboard' },
    { title: 'Notifications', href: '/faculty/notifications' },
];

export default function FacultyNotificationsPage({ faculty, notifications = [], unreadCount = 0 }: Props) {
    const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'announcements' | 'deadlines' | 'system'>('all');
    const [items, setItems] = useState<NotificationItem[]>(notifications);

    // Sync if props change
    React.useEffect(() => {
        setItems(notifications);
    }, [notifications]);

    const filteredItems = items.filter((n) => {
        if (selectedTab === 'unread') return !n.read;
        if (selectedTab === 'announcements') return n.type === 'announcement';
        if (selectedTab === 'deadlines') return n.type === 'deadline' || n.type === 'requirement';
        if (selectedTab === 'system') return n.type !== 'announcement' && n.type !== 'deadline' && n.type !== 'requirement';
        return true;
    });

    const activeUnreadCount = items.filter((n) => !n.read).length;

    const handleMarkAsRead = (n: NotificationItem) => {
        if (n.read) return;

        // Optimistically update
        setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));

        if (n.is_db) {
            router.post(`/faculty/notifications/${n.id}/read`, {}, { preserveScroll: true });
        }
    };

    const handleMarkAllAsRead = () => {
        setItems((prev) => prev.map((item) => ({ ...item, read: true })));
        router.post('/faculty/notifications/read-all', {}, { preserveScroll: true });
    };

    const getIconAndStyle = (type: string) => {
        switch (type) {
            case 'announcement':
                return {
                    icon: Megaphone,
                    badge: 'Announcement',
                    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
                    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                };
            case 'deadline':
            case 'requirement':
                return {
                    icon: FileText,
                    badge: 'Deadline',
                    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
                    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                };
            case 'schedule':
            case 'schedule_faculty_reassignment':
                return {
                    icon: MapPin,
                    badge: 'Schedule',
                    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
                    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                };
            case 'research':
                return {
                    icon: Calendar,
                    badge: 'Research',
                    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
                    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                };
            case 'meeting':
                return {
                    icon: Clock,
                    badge: 'Meeting',
                    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
                    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                };
            default:
                return {
                    icon: Bell,
                    badge: 'System Alert',
                    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
                    iconBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
                };
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications - OfficeHub" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
                {/* Header Banner */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                                    Notifications & Alerts
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Real-time administrative broadcasts, deadline reminders, schedule adjustments, and system activity.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start md:self-auto">
                        {activeUnreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-all shadow-2xs cursor-pointer"
                            >
                                <CheckCheck className="w-4 h-4 text-emerald-500" />
                                Mark all as read
                            </button>
                        )}
                        <span className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-semibold text-muted-foreground">
                            <strong className="text-foreground">{items.length}</strong> total • <strong className="text-amber-500">{activeUnreadCount}</strong> unread
                        </span>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border">
                    <button
                        type="button"
                        onClick={() => setSelectedTab('all')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            selectedTab === 'all'
                                ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        All
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            selectedTab === 'all' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-muted text-muted-foreground'
                        }`}>
                            {items.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab('unread')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            selectedTab === 'unread'
                                ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        Unread
                        {activeUnreadCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                selectedTab === 'unread' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-amber-500 text-slate-950 font-bold'
                            }`}>
                                {activeUnreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab('announcements')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            selectedTab === 'announcements'
                                ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        Announcements
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab('deadlines')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            selectedTab === 'deadlines'
                                ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        Deadlines
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab('system')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            selectedTab === 'system'
                                ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        System & Schedules
                    </button>
                </div>

                {/* Notifications List */}
                {filteredItems.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-2xs">
                        <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-3">
                            <Inbox className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">No notifications found</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            {selectedTab === 'unread'
                                ? "You're all caught up! There are no unread notifications right now."
                                : 'There are no active notifications in this category.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-border divide-y divide-border/60 overflow-hidden shadow-2xs">
                        {filteredItems.map((n) => {
                            const { icon: Icon, badge, color, iconBg } = getIconAndStyle(n.type);

                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleMarkAsRead(n)}
                                    className={`p-4 md:p-5 hover:bg-muted/30 transition-all flex items-start gap-4 cursor-pointer relative ${
                                        !n.read ? 'bg-amber-500/[0.03]' : ''
                                    }`}
                                >
                                    {/* Unread indicator dot */}
                                    {!n.read && (
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-amber-500" />
                                    )}

                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-sm font-bold text-foreground ${!n.read ? 'font-black' : ''}`}>
                                                    {n.title}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${color}`}>
                                                    {badge}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono shrink-0">
                                                {n.time}
                                            </span>
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            {n.description}
                                        </p>

                                        {/* Action link if available */}
                                        {n.action_url && (
                                            <div className="mt-3 flex items-center gap-3">
                                                <Link
                                                    href={n.action_url}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(n);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                                >
                                                    View Details
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Read indicator */}
                                    <div className="shrink-0 self-center pl-2">
                                        {n.read ? (
                                            <span title="Read">
                                                <CheckCircle2 className="w-4 h-4 text-muted-foreground/40" />
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(n);
                                                }}
                                                className="text-[11px] font-bold text-amber-500 hover:text-amber-600 px-2 py-1 rounded-md hover:bg-amber-500/10 transition-colors"
                                                title="Mark as read"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
