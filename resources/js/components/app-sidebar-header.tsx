import { Breadcrumbs } from '@/components/breadcrumbs';
import { ConsolidatedCalendarModal } from '@/components/consolidated-calendar-modal';
import { PortalSwitcher } from '@/components/portal-switcher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell, Calendar as CalendarIcon, ChevronDown, LayoutGrid, Monitor, Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth, portal_context, active_branding } = usePage<SharedData>().props;
    const user = auth.user;
    const getInitials = useInitials();
    const { appearance, updateAppearance } = useAppearance();

    // Scope branding resolution
    const activeAssignment = portal_context?.active_assignment;
    const isCollegeScope = activeAssignment?.scope_type === 'College' || activeAssignment?.portal_type === 'college_admin' || activeAssignment?.portal_type === 'faculty' || activeAssignment?.portal_type === 'dean' || activeAssignment?.portal_type === 'program_head' || activeAssignment?.portal_type === 'lab_in_charge';
    const isInstitutionScope = !isCollegeScope;
    
    // Resolve dynamic header visual identity
    const brandPrimary = active_branding?.primary_color || (isInstitutionScope ? '#0B3A67' : '#1F5D9B');
    const brandLogo = active_branding?.logo_url || '/Ascend.png';
    const brandSubtitle = active_branding?.short_name || (isInstitutionScope ? (activeAssignment?.portal_type === 'vpaf' ? 'Executive' : 'Governance') : 'CIDS');
    const brandFullName = active_branding?.scope_name || (isInstitutionScope ? 'DAVAO DEL SUR STATE COLLEGE · CENTRAL PLATFORM AUTHORITY' : 'COLLEGE OF INFORMATION AND DIGITAL SCIENCES');
    const brandTagline = active_branding?.tagline || '';

    // Rotating logos state for outside-college scope (Ascend <-> DSSC every 4 seconds)
    // For college-wide scope: includes College Logo, Ascend Logo, and DSSC Logo (every 3.5 seconds)
    const [logoIndex, setLogoIndex] = useState(0);

    const logoList = React.useMemo(() => {
        if (!isCollegeScope) {
            // Outside college: Ascend and DSSC
            return ['/Ascend.png', '/DSSC.jpg'];
        }
        // College-wide: College logo, Ascend, DSSC
        const list = [];
        if (brandLogo && brandLogo !== '/Ascend.png' && brandLogo !== '/DSSC.jpg') {
            list.push(brandLogo);
        }
        list.push('/Ascend.png');
        list.push('/DSSC.jpg');
        return list;
    }, [isCollegeScope, brandLogo]);

    useEffect(() => {
        if (logoList.length <= 1) return;
        const interval = setInterval(() => {
            setLogoIndex((prev) => (prev + 1) % logoList.length);
        }, 3800);
        return () => clearInterval(interval);
    }, [logoList]);

    const activeHeaderLogo = logoList[logoIndex] || brandLogo;

    // Live clock state
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Listen for custom event to trigger calendar modal from dashboard or other components
    useEffect(() => {
        const handleOpenCalendar = () => setIsCalendarOpen(true);
        window.addEventListener('open-consolidated-calendar', handleOpenCalendar);
        return () => window.removeEventListener('open-consolidated-calendar', handleOpenCalendar);
    }, []);

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return (
        <>
            <header className="border-b border-border/80 bg-background/95 backdrop-blur sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between px-3 md:px-5 gap-3 transition-[width,height] ease-linear">
                {/* Left Section: Sidebar Toggle, Logo, College Title & Breadcrumbs */}
                <div className="flex items-center gap-3 min-w-0">
                    <SidebarTrigger className="h-8 w-8 text-foreground hover:bg-muted" />

                    <Link
                        href={activeAssignment?.landing_url || (user?.roles?.includes('Institution Super Admin') ? '/institution/dashboard' : '/dashboard')}
                        className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
                    >
                        <div
                            className="h-9 w-9 rounded-xl bg-[#F7F7FB] dark:bg-[#1E1B38] p-1 flex items-center justify-center shrink-0 border shadow-2xs transition-all duration-500 overflow-hidden"
                            style={{
                                borderColor: `${brandPrimary}66`,
                            }}
                        >
                            <img
                                key={activeHeaderLogo}
                                src={activeHeaderLogo}
                                alt={`${brandSubtitle} Logo`}
                                className="h-full w-full object-contain animate-in fade-in zoom-in-95 duration-500"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <div className="flex items-center gap-1 leading-none">
                                <span className="text-base font-black tracking-tight text-[#111827] dark:text-white">Ascend</span>
                                <span
                                    className="text-base font-black tracking-tight transition-colors duration-200"
                                    style={{
                                        color: brandPrimary,
                                    }}
                                >
                                    {brandSubtitle}
                                </span>
                            </div>
                            <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase leading-none mt-1 truncate max-w-[260px]">
                                {brandFullName.toUpperCase()}
                            </span>
                        </div>
                    </Link>

                    {/* Breadcrumbs Navigation */}
                    <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-muted-foreground ml-2 pl-3 border-l border-border/60">
                        <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                        {breadcrumbs && breadcrumbs.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                                {breadcrumbs.map((crumb, idx) => (
                                    <React.Fragment key={`${crumb.title}-${crumb.href || idx}-${idx}`}>
                                        {idx > 0 && <span className="text-muted-foreground/50 font-normal">&gt;</span>}
                                        {idx === breadcrumbs.length - 1 ? (
                                            <span className="font-bold text-foreground">{crumb.title}</span>
                                        ) : (
                                            <Link href={crumb.href} className="hover:text-foreground transition-colors">
                                                {crumb.title}
                                            </Link>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground">Dashboard</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Live Date & Clock, Calendar Trigger with Badge, TV Display, User Profile */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Live Date & Time */}
                    <div className="hidden md:flex flex-col items-end text-right mr-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground leading-none">
                            {formattedDate}
                        </span>
                        <span className="text-base sm:text-lg font-extrabold text-foreground tracking-tight leading-tight mt-0.5 font-mono tabular-nums">
                            {formattedTime}
                        </span>
                    </div>

                    {/* Consolidated Calendar Icon Trigger with Upcoming Event Indicator */}
                    <button
                        type="button"
                        onClick={() => setIsCalendarOpen(true)}
                        className="relative flex items-center justify-center p-2 rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        title="View Calendar"
                    >
                        <CalendarIcon className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
                        {/* Indicator badge for upcoming events */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-2xs">
                            1
                        </span>
                    </button>

                    {/* Light / Dark Mode Toggle */}
                    <button
                        type="button"
                        onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
                        className="flex items-center justify-center p-2 rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        title={appearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme mode"
                    >
                        {appearance === 'dark' ? (
                            <Sun className="h-4 w-4 text-primary group-hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <Moon className="h-4 w-4 text-primary group-hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {/* Notification Bell */}
                    <Link
                        href="/faculty/notifications"
                        className="relative hidden sm:flex items-center justify-center p-2 rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        title="Notifications"
                    >
                        <Bell className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                    </Link>

                    {/* TV Display Button */}
                    <Link
                        href="/tv-display"
                        className="hidden md:flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 bg-card hover:bg-muted/60 transition-colors shadow-2xs group"
                        title="Open TV Display Screen"
                    >
                        <Monitor className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
                        <div className="flex flex-col text-left leading-none">
                            <span className="text-xs font-bold text-foreground">TV Display</span>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                Online
                            </span>
                        </div>
                    </Link>

                    {/* Persistent Multi-Role Portal Switcher */}
                    <PortalSwitcher />

                    {/* User / Faculty Profile Dropdown Pill */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 px-3 py-1.5 bg-white hover:bg-gradient-to-r hover:from-[#F8FAFC] hover:to-[#EFF6FF] transition-all shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#175C94]/20 data-[state=open]:bg-gradient-to-r data-[state=open]:from-[#EFF6FF] data-[state=open]:to-[#E0F2FE] data-[state=open]:border-[#175C94] group"
                            >
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#0B3A67] dark:bg-slate-800 dark:text-[#93C5FD] font-bold text-xs flex items-center justify-center overflow-hidden border border-[#175C94]/20 shadow-2xs">
                                        {(user as any)?.faculty?.photo_url ? (
                                            <img src={(user as any).faculty.photo_url} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user ? getInitials(user.name) : 'CA'
                                        )}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F172A]" />
                                </div>
                                <div className="hidden sm:flex flex-col text-left leading-none max-w-[140px]">
                                    <span className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                                        {(user as any)?.faculty?.full_name || user?.name || 'College Admin'}
                                    </span>
                                    <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium truncate mt-0.5">
                                        {(user as any)?.faculty?.academic_rank || (user as any)?.roles?.[0] || 'Faculty Member'}
                                    </span>
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 text-[#64748B] ml-0.5 group-hover:text-[#175C94] transition-colors" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-auto p-0 rounded-2xl shadow-xl border border-border bg-card overflow-hidden" sideOffset={8}>
                            {user && <UserMenuContent user={user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Consolidated Calendar Modal */}
            <ConsolidatedCalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
            />
        </>
    );
}
