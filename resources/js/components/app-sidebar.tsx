import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Megaphone, FileCheck, CheckSquare, Trophy, Send, Calendar, Inbox, Monitor, GraduationCap, Users, ListVideo, Sliders, Settings, ClipboardCheck, Sparkles, Briefcase, CalendarRange, Table, Bot, SlidersHorizontal, UserCheck, Eye, Layers } from 'lucide-react';
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
        title: 'OPERATIONS',
        items: [
            { title: 'Programs', url: '/programs', icon: GraduationCap },
            { title: 'Faculty', url: '/faculties', icon: Users },
            { title: 'Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Meetings', url: '/schedule/meetings', icon: Users },
            { title: 'Activities', url: '/schedule/activities', icon: Calendar },
            { title: 'Lab Monitoring', url: '/classroom-monitoring', icon: Monitor },
            { title: 'Faculty Attendance', url: '/faculty-attendance', icon: ClipboardCheck },
            { title: 'Academic Periods', url: '/administration/academic-periods', icon: Calendar },
            { title: 'Tasks & Projects', url: '/tasks', icon: CheckSquare },
        ],
    },
    {
        title: 'SCHEDULING',
        items: [
            {
                title: 'Schedule Generator',
                url: '/schedule/generator',
                icon: Calendar,
                items: [
                    { title: 'Overview', url: '/schedule/generator' },
                    { title: 'Academic Calendar Import', url: '/schedule/calendar-import' },
                    { title: 'Academic Periods', url: '/administration/academic-periods' },
                    { title: 'Programs & Curriculum', url: '/programs' },
                    { title: 'Sections & Offerings', url: '/schedule/sections' },
                    { title: 'Faculty & Specializations', url: '/faculties' },
                    { title: 'Rooms & Laboratories', url: '/classroom-monitoring' },
                    { title: 'Load Policies', url: '/schedule/loading?view=policies' },
                    { title: 'Faculty Availability', url: '/schedule/loading?view=availability' },
                    { title: 'Load Assignments', url: '/schedule/loading' },
                    { title: 'Constraint Rules', url: '/schedule/generator?tab=constraints' },
                    { title: 'Readiness & Validation', url: '/schedule/generator?tab=readiness' },
                    { title: 'Generation Settings', url: '/schedule/generator?tab=generate' },
                    { title: 'Candidate Comparison', url: '/schedule/generator?tab=candidates' },
                    { title: 'Timetable Editor', url: '/schedule/timetable' },
                    { title: 'Conflict Center', url: '/schedule/conflicts' },
                    { title: 'Program Head Reviews', url: '/schedule/reviews?role=program_head' },
                    { title: 'Dean Inspection', url: '/schedule/reviews?role=dean' },
                    { title: 'Final Approval & Publish', url: '/schedule/reviews?tab=publish' },
                    { title: 'Versions & Audit Trail', url: '/schedule/reviews?tab=versions' },
                    { title: 'Published Views', url: '/schedule/master-timetable' },
                    { title: 'Room Utilization', url: '/schedule/master-timetable?view=room' },
                    { title: 'Faculty Distribution', url: '/schedule/master-timetable?tab=distribution' },
                    { title: 'Gemini Assistant', url: '/schedule/gemini' },
                ],
            },
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
            { title: 'Faculty Performance', url: '/performance/faculty', icon: Trophy },
            { title: 'Program Performance', url: '/performance/program', icon: Trophy },
            { title: 'Recognition Rules', url: '/performance/rules', icon: BookOpen },
        ],
    },
    {
        title: 'TV CONFIGURATION',
        items: [
            { title: 'Playlist', url: '/tv-config/playlist', icon: ListVideo },
            { title: 'Slide Configuration', url: '/tv-config/slides', icon: Sliders },
            { title: 'Display Settings', url: '/tv-config/settings', icon: Settings },
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

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar" className="top-16 h-[calc(100svh-4rem)] border-r border-border/80 bg-sidebar">
            <SidebarContent className="pt-2">
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
