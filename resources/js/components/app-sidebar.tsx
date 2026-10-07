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
        title: 'Compliance',
        url: '#',
        icon: FileCheck,
        isActive: true,
        items: [
            {
                title: 'Requirements',
                url: '/compliance/requirements',
            },
            {
                title: 'Submission Records',
                url: '/compliance/submissions',
            },
            {
                title: 'Pending Outputs',
                url: '/compliance/pending-outputs',
            },
            {
                title: 'Compliance Tracker',
                url: '/compliance/tracker',
            },
        ],
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
        title: 'Meetings & Activities',
        url: '/meetings',
        icon: Calendar,
    },
    {
        title: 'Requests',
        url: '/requests',
        icon: Inbox,
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
