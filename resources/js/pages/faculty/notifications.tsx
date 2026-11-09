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
                    color: 'bg-[#0B3A67]/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
                    iconBg: 'bg-[#0B3A67]/10 text-amber-600 dark:text-amber-400',
                };
            case 'schedule':
            case 'schedule_faculty_reassignment':
                return {
                    icon: MapPin,
                    badge: 'Schedule',
                    color: 'bg-[#8B1E3F]/10 text-[#8B1E3F] dark:text-rose-400 border-[#8B1E3F]/20 dark:border-[#8B1E3F]/40',
                    iconBg: 'bg-[#8B1E3F]/10 text-[#8B1E3F] dark:text-rose-400',
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
                {/* Header Banner with Deep Blue & Maroon gradient */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0B3A67] via-[#175C94] to-[#8B1E3F] p-6 md:p-7 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs shadow-xs">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-xs">
                                    Notifications & Alerts
                                </h1>
                                <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
                                    Real-time administrative broadcasts, deadline reminders, schedule adjustments, and system activity.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start md:self-auto relative z-10 shrink-0">
                        {activeUnreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-white/90 text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer"
                            >
                                <CheckCheck className="w-4 h-4 text-emerald-600" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                        <span className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/25 text-xs font-semibold text-white backdrop-blur-xs shadow-2xs">
                            <strong className="text-white">{items.length}</strong> total • <strong className="text-white underline">{activeUnreadCount}</strong> unread
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
                                ? 'bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#8B1E3F] text-white shadow-xs font-bold'
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
                                ? 'bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#8B1E3F] text-white shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        Unread
                        {activeUnreadCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                selectedTab === 'unread' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#8B1E3F] text-white font-bold'
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
                                ? 'bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#8B1E3F] text-white shadow-xs font-bold'
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
                                ? 'bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#8B1E3F] text-white shadow-xs font-bold'
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
                                ? 'bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#8B1E3F] text-white shadow-xs font-bold'
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
                                        !n.read ? 'bg-[#0B3A67]/[0.04]' : ''
                                    }`}
                                >
                                    {/* Unread indicator dot */}
                                    {!n.read && (
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-[#0B3A67]" />
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
                                                className="text-[11px] font-bold text-[#0B3A67] hover:text-amber-600 px-2 py-1 rounded-md hover:bg-[#0B3A67]/10 transition-colors"
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
