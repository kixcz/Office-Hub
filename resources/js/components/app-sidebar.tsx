import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Megaphone, FileCheck, CheckSquare, Trophy, Send, Calendar, Inbox, Monitor, GraduationCap, Users } from 'lucide-react';
import AppLogo from './app-logo';

const navGroups: NavGroup[] = [
    {
        title: 'MAIN',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'My Workspace', url: '/faculty/workspace', icon: Folder },
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
        ],
    },
    {
        title: 'COMPLIANCE',
        items: [
            { title: 'Requirements', url: '/compliance/requirements', icon: FileCheck },
            { title: 'Submission Records', url: '/compliance/submissions', icon: FileCheck },
            { title: 'Pending Outputs', url: '/compliance/pending-outputs', icon: FileCheck, badge: 12 },
            { title: 'Compliance Tracker', url: '/compliance/tracker', icon: CheckSquare },
        ],
    },
    {
        title: 'OPERATIONS',
        items: [
            { title: 'Programs', url: '/programs', icon: GraduationCap },
            { title: 'Faculty Management', url: '/faculties', icon: Users },
            { title: 'Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Meetings', url: '/schedule/meetings', icon: Users },
            { title: 'Activities', url: '/schedule/activities', icon: Calendar },
            { title: 'Classroom Monitoring', url: '/classroom-monitoring', icon: Monitor },
        ],
    },
    {
        title: 'WORKFLOWS',
        items: [
            { title: 'Tasks & Projects', url: '/tasks', icon: CheckSquare },
            { title: 'Document Routing', url: '/documents', icon: Send },
            { title: 'Requests', url: '/requests', icon: Inbox },
            { title: 'Accomplishments', url: '/accomplishments', icon: Trophy },
        ],
    },
    {
        title: 'PERFORMANCE',
        items: [
            { title: 'Faculty Performance', url: '/performance/faculty', icon: Trophy },
            { title: 'Program Performance', url: '/performance/program', icon: Trophy },
            { title: 'Recognition Rules', url: '/performance/rules', icon: BookOpen },
        ],
    },
    {
        title: 'TV CONFIGURATION',
        items: [
            {
                title: 'TV Configuration',
                url: '/tv-config/playlist',
                icon: Monitor,
                items: [
                    { title: 'Playlist', url: '/tv-config/playlist' },
                    { title: 'Slide Configuration', url: '/tv-config/slides' },
                    { title: 'Display Settings', url: '/tv-config/settings' },
                ],
            }
        ],
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'TV Display',
        url: '/tv-display',
        icon: Monitor,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-[#fcfcfc]">
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
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
