import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Calendar,
    Megaphone,
    GraduationCap,
    Users,
    Monitor,
    ClipboardCheck,
    Sparkles,
    CheckSquare,
    Tv,
    Projector,
    Activity,
    BookCheckIcon,
    ClipboardEdit,
    LibraryBig,
    Star,
    AlertTriangle,
    FileCheck,
    BookOpen,
    Trophy,
    UserCircle,
    Clock,
    FileText,
    Inbox,
    Bell,
    Bot,
    FolderKanban,
    CalendarDays,
    FileUp,
    Briefcase
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const adminNavGroups: NavGroup[] = [
    {
        title: 'MAIN',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Faculty Portal', url: '/faculty/dashboard', icon: UserCircle },
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
];

// 7 Organized Groups with 17 Modules as specified for Faculty Account
const facultyNavGroups: NavGroup[] = [
    {
        title: 'MY WORK',
        items: [
            { title: 'Dashboard', url: '/faculty/dashboard', icon: LayoutGrid },
            { title: 'My Profile', url: '/faculty/profile', icon: UserCircle },
            { title: 'Teaching Load', url: '/faculty/loading', icon: Briefcase },
            { title: 'Class Schedule', url: '/faculty/schedule', icon: CalendarDays },
            { title: 'My Attendance', url: '/faculty/attendance', icon: ClipboardCheck },
            { title: 'Faculty Availability', url: '/faculty/availability', icon: Clock },
            { title: 'My Calendar', url: '/faculty/calendar', icon: Calendar },
        ],
    },
    {
        title: 'SUBMISSIONS & COMPLIANCE',
        items: [
            { title: 'My Requirements', url: '/faculty/requirements', icon: LibraryBig },
            { title: 'My Submissions', url: '/faculty/submissions', icon: FileUp },
        ],
    },
    {
        title: 'PROJECTS & ENGAGEMENT',
        items: [
            { title: 'Tasks & Projects', url: '/faculty/tasks', icon: BookCheckIcon },
            { title: 'Research & Extension', url: '/faculty/research-extension', icon: FolderKanban },
            { title: 'Meetings & Events', url: '/faculty/meetings', icon: Projector },
            { title: 'Accomplishments', url: '/faculty/accomplishments', icon: Trophy },
        ],
    },
    {
        title: 'RECORDS & SERVICES',
        items: [
            { title: 'My Documents', url: '/faculty/documents', icon: FileText },
            { title: 'Requests & Corrections', url: '/faculty/corrections', icon: Inbox },
        ],
    },
    {
        title: 'COMMUNICATION',
        items: [
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
            { title: 'Notifications', url: '/faculty/notifications', icon: Bell },
        ],
    },
    {
        title: 'TOOLS',
        items: [
            { title: 'Gemini Assistant', url: '/dashboard', icon: Bot },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'TV Display',
        url: '/tv-display',
        icon: Monitor,
    },
];

export function AppSidebar() {
    const contentRef = useRef<HTMLDivElement>(null);
    const { url, props } = usePage<SharedData>();
    const isFacultyUser = (props.auth?.user as any)?.is_faculty || (props.auth?.user as any)?.roles?.includes('Faculty Member') || url.startsWith('/faculty/');

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

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

    const groups = isFacultyUser ? facultyNavGroups : adminNavGroups;

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="top-16 h-[calc(100svh-4rem)] border-r border-border/80 bg-sidebar">
            <SidebarContent ref={contentRef} className="pt-2 scrollbar-none">
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
