import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Megaphone, FileCheck, CheckSquare, Trophy, Send, Calendar, Inbox, Monitor, GraduationCap, Users, ListVideo, Sliders, Settings, ClipboardCheck, Sparkles, Briefcase, CalendarRange, Table, Bot, SlidersHorizontal, UserCheck, Eye, Layers, Tv, Presentation, Projector, Activity, BookCheckIcon, ClipboardEdit, LibraryBig, Star, AlertTriangle } from 'lucide-react';
import AppLogo from './app-logo';

const navGroups: NavGroup[] = [
    {
        title: 'MAIN',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'My Workspace', url: '/faculty/workspace', icon: Folder },
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
            { title: 'Academic Periods', url: '/administration/academic-periods', icon: Calendar },
        ],
    },
    {
        title: 'OPERATIONS',
        items: [
            { title: 'Programs', url: '/programs', icon: GraduationCap },
            { title: 'Faculty', url: '/faculties', icon: Users },
            { title: 'Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Meetings', url: '/schedule/meetings', icon: Projector },
            { title: 'Activities', url: '/schedule/activities', icon: Activity },
            { title: 'Lab Monitoring', url: '/classroom-monitoring', icon: Monitor },
            { title: 'Faculty Attendance', url: '/faculty-attendance', icon: ClipboardCheck },
            { title: 'Facility Reports', url: '/operations/facility-reports', icon: AlertTriangle },
            { title: 'Tasks & Projects', url: '/tasks', icon: BookCheckIcon },
        ],
    },
    {
        title: 'SCHEDULING',
        items: [
            {
                title: 'Schedule Generator',
                url: '/schedule/generator',
                icon: Sparkles,
            },
        ],
    },
    {
        title: 'COMPLIANCE',
        items: [
            { title: 'Requirements', url: '/compliance/requirements', icon: LibraryBig },
            { title: 'Submission Records', url: '/compliance/submissions', icon: FileCheck },
            { title: 'Pending Outputs', url: '/compliance/pending-outputs', icon: ClipboardEdit, badge: 12 },
            { title: 'Compliance Tracker', url: '/compliance/tracker', icon: CheckSquare },
        ],
    },

    // {
    //     title: 'WORKFLOWS',
    //     items: [
    //         { title: 'Tasks & Projects', url: '/tasks', icon: CheckSquare },
    //         { title: 'Document Routing', url: '/documents', icon: Send },
    //         { title: 'Requests', url: '/requests', icon: Inbox },
    //         { title: 'Accomplishments', url: '/accomplishments', icon: Trophy },
    //     ],
    // },
    {
        title: 'PERFORMANCE',
        items: [
            { title: 'Faculty Performance', url: '/performance/faculty', icon: Star },
            { title: 'Program Performance', url: '/performance/program', icon: Trophy },
            { title: 'Recognition Rules', url: '/performance/rules', icon: BookOpen },
        ],
    },
    {
        title: 'TV DISPLAY STUDIO',
        items: [
            { title: 'TV Workspace', url: '/tv-config/dashboard', icon: Tv },
        ],
    },
    // {
    //     title: 'ADMINISTRATION',
    //     items: [
    //         { title: 'Academic Periods', url: '/administration/academic-periods', icon: Calendar },
    //         { title: 'Tasks & Projects', url: '/tasks', icon: CheckSquare },
    //     ],
    // }
];

const footerNavItems: NavItem[] = [
    {
        title: 'TV Display',
        url: '/tv-display',
        icon: Monitor,
    },
];

import { useEffect, useRef } from 'react';

export function AppSidebar() {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        // Restore scroll position from sessionStorage
        const savedScroll = sessionStorage.getItem('officehub_sidebar_scroll');
        if (savedScroll) {
            el.scrollTop = parseInt(savedScroll, 10);
        }

        const handleScroll = () => {
            sessionStorage.setItem('officehub_sidebar_scroll', el.scrollTop.toString());
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="top-16 h-[calc(100svh-4rem)] border-r border-border/80 bg-sidebar">
            <SidebarContent ref={contentRef} className="pt-2 scrollbar-none">
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
