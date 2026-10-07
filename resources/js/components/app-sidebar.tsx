import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Megaphone, FileCheck, CheckSquare, Trophy, Send, Calendar, Inbox, Monitor, GraduationCap, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Programs',
        url: '/programs',
        icon: GraduationCap,
    },
    {
        title: 'Faculty Management',
        url: '/faculties',
        icon: Users,
    },
    {
        title: 'Announcements',
        url: '/announcements',
        icon: Megaphone,
    },
    {
        title: 'My Workspace',
        url: '/faculty/workspace',
        icon: FileCheck,
    },
    {
        title: 'Requirements',
        url: '/compliance/requirements',
        icon: FileCheck,
    },
    {
        title: 'Submission Records',
        url: '/compliance/submissions',
        icon: FileCheck,
    },
    {
        title: 'Pending Outputs',
        url: '/compliance/pending-outputs',
        icon: FileCheck,
    },
    {
        title: 'Compliance Tracker',
        url: '/compliance/tracker',
        icon: FileCheck,
    },
    {
        title: 'Tasks & Projects',
        url: '/tasks',
        icon: CheckSquare,
    },
    {
        title: 'Accomplishments',
        url: '/accomplishments',
        icon: Trophy,
    },
    {
        title: 'Document Routing',
        url: '/documents',
        icon: Send,
    },

    {
        title: 'Calendar',
        url: '/schedule/calendar',
        icon: Calendar,
    },
    {
        title: 'Meetings',
        url: '/schedule/meetings',
        icon: Users,
    },
    {
        title: 'Activities',
        url: '/schedule/activities',
        icon: Calendar,
    },
    {
        title: 'Requests',
        url: '/requests',
        icon: Inbox,
    },
    {
        title: 'Faculty Performance',
        url: '/performance/faculty',
        icon: Trophy,
    },
    {
        title: 'Program Performance',
        url: '/performance/program',
        icon: Trophy,
    },
    {
        title: 'Recognition Rules',
        url: '/performance/rules',
        icon: Trophy,
    },
    {
        title: 'TV Configuration',
        url: '#',
        icon: Monitor,
        items: [
            { title: 'Playlist', url: '/tv-config/playlist' },
            { title: 'Slide Configuration', url: '/tv-config/slides' },
            { title: 'Display Settings', url: '/tv-config/settings' },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'TV Display',
        url: '/tv',
        icon: Monitor,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
