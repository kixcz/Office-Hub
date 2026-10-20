import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
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
    Building2,
    Bell,
    Bot,
    FolderKanban,
    CalendarDays,
    FileUp,
    Briefcase,
    RefreshCw,
    BarChart3,
    ArrowLeftRight,
    ShieldAlert,
    Send,
    Award,
    History,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Super Admin Navigation Groups (System-wide configuration, master data, TV display studio, system admin)
const adminNavGroups: NavGroup[] = [
    {
        title: 'SYSTEM MAIN',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
            { title: 'Academic Periods', url: '/administration/academic-periods', icon: Calendar },
        ],
    },
    {
        title: 'OPERATIONS',
        items: [
            { title: 'Programs', url: '/programs', icon: GraduationCap },
            { title: 'Faculty Directory', url: '/faculties', icon: Users },
            { title: 'College Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Meetings', url: '/schedule/meetings', icon: Projector },
            { title: 'Activities', url: '/schedule/activities', icon: Activity },
            { title: 'Lab Monitoring', url: '/classroom-monitoring', icon: Monitor },
            { title: 'Exam Monitoring', url: '/operations/exam-monitoring', icon: CalendarDays },
            { title: 'Faculty Workload', url: '/operations/faculty-workload', icon: Briefcase },
            { title: 'Make-Up Classes', url: '/operations/make-up-classes', icon: RefreshCw },
            { title: 'Rooms & Laboratories', url: '/schedule/master-data/rooms', icon: Building2 },
            { title: 'Room Utilization', url: '/operations/room-utilization', icon: BarChart3 },
            { title: 'Faculty Attendance', url: '/faculty-attendance', icon: ClipboardCheck },
            { title: 'Facility Reports', url: '/operations/facility-reports', icon: AlertTriangle },
            { title: 'Tasks & Projects', url: '/tasks', icon: BookCheckIcon },
        ],
    },
    {
        title: 'SCHEDULING & OR-TOOLS',
        items: [
            { title: 'Schedule Generator', url: '/schedule/generator', icon: Sparkles },
            { title: 'Faculty Loading', url: '/schedule/loading', icon: Briefcase },
            { title: 'Master Timetable', url: '/schedule/master-timetable?view=college', icon: CalendarDays },
            { title: 'Reviews & Endorsement', url: '/schedule/reviews', icon: FileCheck },
            { title: 'Swap Requests Hub', url: '/schedule/adjustments', icon: ArrowLeftRight },
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
        title: 'PERFORMANCE & RECOGNITION',
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
            { title: 'Spotlight Slides', url: '/tv-config/spotlight', icon: Sparkles },
            { title: 'Custom Manual Slides', url: '/tv-config/custom', icon: FileText },
        ],
    },
];

// Program Head Navigation Groups (Program Operational Command Center)
const programHeadNavGroups: NavGroup[] = [
    {
        title: 'PROGRAM OPERATIONS',
        items: [
            { title: 'Command Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Program Faculty', url: '/faculties', icon: Users },
            { title: 'Faculty Attendance', url: '/faculty-attendance', icon: ClipboardCheck },
            { title: 'Program Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Meetings & Activities', url: '/schedule/meetings', icon: Projector },
            { title: 'Classroom & Lab Mon.', url: '/classroom-monitoring', icon: Monitor },
            { title: 'Facility Reports', url: '/operations/facility-reports', icon: AlertTriangle },
        ],
    },
    {
        title: 'PROGRAM SCHEDULING',
        items: [
            { title: 'Faculty Loading', url: '/schedule/loading', icon: Briefcase },
            { title: 'Schedule Candidates', url: '/schedule/generator?tab=candidates', icon: Sparkles },
            { title: 'Program Head Review', url: '/schedule/reviews?role=program_head', icon: FileCheck },
            { title: 'Review Flags & Notes', url: '/schedule/reviews?tab=flags', icon: ShieldAlert },
            { title: 'Program Master Schedule', url: '/schedule/master-timetable?view=program', icon: CalendarDays },
            { title: 'Swap Requests Review', url: '/schedule/adjustments?tab=requests', icon: ArrowLeftRight },
        ],
    },
    {
        title: 'ACADEMIC MONITORING',
        items: [
            { title: 'Compliance Tracker', url: '/compliance/tracker', icon: CheckSquare },
            { title: 'Pending Outputs', url: '/compliance/pending-outputs', icon: ClipboardEdit },
            { title: 'Make-Up Classes', url: '/operations/make-up-classes', icon: RefreshCw },
            { title: 'Exam Monitoring', url: '/operations/exam-monitoring', icon: CalendarDays },
            { title: 'Lab / Room Utilization', url: '/operations/room-utilization', icon: BarChart3 },
        ],
    },
    {
        title: 'RESEARCH & EXCELLENCE',
        items: [
            { title: 'Faculty Accomplishments', url: '/accomplishments', icon: Award },
            { title: 'Program Performance', url: '/performance/program', icon: Trophy },
            { title: 'Recommend Spotlight', url: '/tv-config/spotlight', icon: Sparkles },
            { title: 'Program Reports', url: '/performance/faculty/report', icon: FileText },
        ],
    },
];

// Dean Navigation Groups (College-Wide Executive Oversight & Approvals)
const deanNavGroups: NavGroup[] = [
    {
        title: 'COLLEGE EXECUTIVE',
        items: [
            { title: 'College Executive Dash.', url: '/dashboard', icon: LayoutGrid },
            { title: 'College Faculty Directory', url: '/faculties', icon: Users },
            { title: 'College Programs', url: '/programs', icon: GraduationCap },
            { title: 'College Calendar', url: '/schedule/calendar', icon: Calendar },
            { title: 'Executive Meetings', url: '/schedule/meetings', icon: Projector },
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
        ],
    },
    {
        title: 'COLLEGE SCHEDULING',
        items: [
            { title: 'Faculty Loading Oversight', url: '/operations/faculty-workload', icon: Briefcase },
            { title: 'Candidate Consultation', url: '/schedule/generator?tab=candidates', icon: Sparkles },
            { title: 'Dean Schedule Review', url: '/schedule/reviews?role=dean', icon: FileCheck },
            { title: 'Review Flags & AI Summary', url: '/schedule/reviews?tab=flags', icon: ShieldAlert },
            { title: 'Master College Timetable', url: '/schedule/master-timetable?view=college', icon: CalendarDays },
            { title: 'Adjustment Batch Approval', url: '/schedule/adjustments?tab=batches', icon: ArrowLeftRight },
        ],
    },
    {
        title: 'COLLEGE OVERSIGHT',
        items: [
            { title: 'College Compliance Overview', url: '/compliance/tracker', icon: CheckSquare },
            { title: 'Faculty Attendance Monitor', url: '/faculty-attendance', icon: ClipboardCheck },
            { title: 'Make-Up Class Approvals', url: '/operations/make-up-classes', icon: RefreshCw },
            { title: 'College Exam Monitoring', url: '/operations/exam-monitoring', icon: CalendarDays },
            { title: 'Room & Lab Utilization', url: '/operations/room-utilization', icon: BarChart3 },
            { title: 'Facility Issues', url: '/operations/facility-reports', icon: AlertTriangle },
        ],
    },
    {
        title: 'PERFORMANCE & ACCREDITATION',
        items: [
            { title: 'College Performance', url: '/performance/program', icon: Trophy },
            { title: 'Faculty Performance', url: '/performance/faculty', icon: Star },
            { title: 'Accomplishment Portfolios', url: '/accomplishments', icon: Award },
            { title: 'Institutional Spotlights', url: '/tv-config/spotlight', icon: Sparkles },
            { title: 'College Reports', url: '/performance/faculty/report', icon: FileText },
        ],
    },
];

// Faculty Self-Service Navigation Groups
const facultyNavGroups: NavGroup[] = [
    {
        title: 'MY WORK',
        items: [
            { title: 'Dashboard', url: '/faculty/dashboard', icon: LayoutGrid },
            { title: 'My Profile', url: '/faculty/profile', icon: UserCircle },
            { title: 'Teaching Load', url: '/faculty/loading', icon: Briefcase },
            { title: 'Class Schedule', url: '/faculty/schedule', icon: CalendarDays },
            { title: 'My Exam Schedules', url: '/faculty/exam-schedules', icon: BookOpen },
            { title: 'My Attendance', url: '/faculty/attendance', icon: ClipboardCheck },
            { title: 'Make-Up Classes', url: '/faculty/make-up-classes', icon: RefreshCw },
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

// Lab In-Charge Navigation Groups (Operational Workspace)
const labInChargeNavGroups: NavGroup[] = [
    {
        title: 'LAB OPERATIONS',
        items: [
            { title: 'Operational Dashboard', url: '/monitoring/lab-in-charge?tab=dashboard', icon: LayoutGrid },
            { title: "Today's Lab Schedule", url: '/monitoring/lab-in-charge?tab=today', icon: CalendarDays },
            { title: 'Room Status Board', url: '/monitoring/lab-in-charge?tab=rooms', icon: Monitor },
            { title: 'Lab Timetables', url: '/monitoring/lab-in-charge?tab=timetables', icon: Calendar },
            { title: 'End-of-Day Closing Report', url: '/monitoring/lab-in-charge?tab=end_of_day', icon: FileCheck },
        ],
    },
    {
        title: 'MONITORING & INCIDENTS',
        items: [
            { title: 'Discrepancies & Incidents', url: '/monitoring/lab-in-charge?tab=discrepancies', icon: AlertTriangle },
            { title: 'Action Required', url: '/monitoring/lab-in-charge?tab=action_required', icon: Bell },
            { title: 'Historical Monitoring', url: '/monitoring/lab-in-charge?tab=historical', icon: History },
            { title: 'Monitoring Audit History', url: '/monitoring/lab-in-charge?tab=history', icon: ClipboardCheck },
            { title: 'My Assigned Labs', url: '/monitoring/lab-in-charge?tab=assigned_labs', icon: Building2 },
        ],
    },
    {
        title: 'COMMUNICATION',
        items: [
            { title: 'Announcements', url: '/announcements', icon: Megaphone },
        ],
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const contentRef = useRef<HTMLDivElement>(null);
    const { url, props } = usePage<SharedData>();
    const user = props.auth?.user as any;

    const roles: string[] = user?.roles || [];
    const isProgramHead = roles.includes('Program Head');
    const isDean = roles.includes('Dean');
    const isSuperAdmin = roles.includes('System Administrator') || roles.includes('Super Admin');
    const isLabInCharge = roles.includes('Lab In-Charge');
    const isFaculty = user?.is_faculty || roles.includes('Faculty Member');

    const canSwitchWorkspace = (isProgramHead || isDean || isSuperAdmin) && isFaculty;

    // Workspace mode state: 'management' | 'faculty'
    const [workspaceMode, setWorkspaceMode] = useState<'management' | 'faculty'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('officehub_workspace_mode');
            if (saved === 'faculty' || saved === 'management') return saved;
        }
        if (url.startsWith('/faculty/')) return 'faculty';
        return 'management';
    });

    // Update localStorage when mode changes
    const toggleWorkspace = (mode: 'management' | 'faculty') => {
        setWorkspaceMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('officehub_workspace_mode', mode);
        }
    };

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

    // Resolve active navigation group
    let groups: NavGroup[] = adminNavGroups;

    if (canSwitchWorkspace && workspaceMode === 'faculty') {
        groups = facultyNavGroups;
    } else if (isProgramHead) {
        groups = programHeadNavGroups;
    } else if (isDean) {
        groups = deanNavGroups;
    } else if (isLabInCharge && !isSuperAdmin) {
        groups = labInChargeNavGroups;
    } else if (isFaculty && !isSuperAdmin) {
        groups = facultyNavGroups;
    } else {
        groups = adminNavGroups;
    }

    const managementTitle = isProgramHead
        ? 'Program Head Workspace'
        : isDean
        ? 'Dean Executive Workspace'
        : 'Admin Management';

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="top-16 h-[calc(100svh-4rem)] border-r border-border/80 bg-sidebar">
            {/* Seamless Dual-Role Workspace Switcher for Program Heads & Deans */}
            {canSwitchWorkspace && (
                <div className="p-3 border-b border-border/60 group-data-[collapsible=icon]:p-1 shrink-0 bg-muted/30">
                    <div className="flex flex-col gap-1.5 group-data-[collapsible=icon]:items-center">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
                            <span>Workspace View</span>
                            <span className="text-amber-500 font-extrabold">
                                {workspaceMode === 'faculty' ? 'Faculty Portal' : (isProgramHead ? 'Program Head' : 'Dean')}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-background border border-border group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col">
                            <button
                                type="button"
                                onClick={() => toggleWorkspace('management')}
                                className={`text-[11px] font-bold py-1 px-2 rounded-md transition-all text-center truncate ${
                                    workspaceMode === 'management'
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title={managementTitle}
                            >
                                <span className="group-data-[collapsible=icon]:hidden">
                                    {isProgramHead ? 'Program Head' : isDean ? 'Dean Oversight' : 'Management'}
                                </span>
                                <span className="hidden group-data-[collapsible=icon]:inline text-xs font-bold">
                                    {isProgramHead ? 'PH' : isDean ? 'DN' : 'MG'}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleWorkspace('faculty')}
                                className={`text-[11px] font-bold py-1 px-2 rounded-md transition-all text-center truncate ${
                                    workspaceMode === 'faculty'
                                        ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Faculty Self-Service Portal"
                            >
                                <span className="group-data-[collapsible=icon]:hidden">Faculty Portal</span>
                                <span className="hidden group-data-[collapsible=icon]:inline text-xs font-bold">FAC</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
