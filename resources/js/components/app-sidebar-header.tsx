import { Breadcrumbs } from '@/components/breadcrumbs';
import { ConsolidatedCalendarModal } from '@/components/consolidated-calendar-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell, Calendar as CalendarIcon, ChevronDown, LayoutGrid, Monitor } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const getInitials = useInitials();

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

                    <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0">
                        <img
                            src="/CIDS_Logo.jpg"
                            alt="CIDS Logo"
                            className="h-9 w-9 rounded-full object-contain shrink-0 border border-amber-500/20 shadow-2xs"
                        />
                        <div className="hidden sm:flex flex-col text-left">
                            <div className="flex items-center gap-1 leading-none">
                                <span className="text-base font-black tracking-tight text-foreground">CIDS</span>
                                <span className="text-base font-black tracking-tight text-amber-500">OfficeHub</span>
                            </div>
                            <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase leading-none mt-1">
                                COLLEGE OF INFORMATION AND DIGITAL SCIENCES
                            </span>
                        </div>
                    </Link>

                    {/* Breadcrumbs Navigation */}
                    <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-muted-foreground ml-2 pl-3 border-l border-border/60">
                        <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                        {breadcrumbs && breadcrumbs.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                                {breadcrumbs.map((crumb, idx) => (
                                    <React.Fragment key={crumb.href || idx}>
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
                        className="relative flex items-center justify-center p-2 rounded-xl border border-border bg-background hover:bg-muted/70 transition-colors shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        title="View Calendar"
                    >
                        <CalendarIcon className="h-4 w-4 text-foreground group-hover:text-amber-500 transition-colors" />
                        {/* Indicator badge for upcoming events */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-2xs">
                            1
                        </span>
                    </button>

                    {/* Notification Bell */}
                    <button
                        type="button"
                        className="relative hidden sm:flex items-center justify-center p-2 rounded-xl border border-border bg-background hover:bg-muted/70 transition-colors shadow-2xs group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        title="Notifications"
                    >
                        <Bell className="h-4 w-4 text-foreground group-hover:text-amber-500 transition-colors" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                    </button>

                    {/* TV Display Button */}
                    <Link
                        href="/tv-display"
                        className="hidden md:flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 bg-background hover:bg-muted/60 transition-colors shadow-2xs group"
                        title="Open TV Display Screen"
                    >
                        <Monitor className="h-4 w-4 text-foreground group-hover:text-amber-500 transition-colors" />
                        <div className="flex flex-col text-left leading-none">
                            <span className="text-xs font-bold text-foreground">TV Display</span>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                Online
                            </span>
                        </div>
                    </Link>

                    {/* User Profile Dropdown Pill */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-xl border border-border px-2.5 py-1.5 bg-background hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <div className="w-6 h-6 rounded-full bg-muted-foreground/15 text-foreground font-bold text-[11px] flex items-center justify-center shrink-0">
                                    {user ? getInitials(user.name) : 'SA'}
                                </div>
                                <span className="text-xs font-semibold text-foreground max-w-[120px] truncate hidden sm:inline">
                                    {user ? user.name : 'Super Admin'}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
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
