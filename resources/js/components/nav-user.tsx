import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronUp } from 'lucide-react';
import React from 'react';

export function NavUser() {
    const { auth, portal_context } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const getInitials = useInitials();

    const user = auth.user;
    const photoUrl = (user as any)?.faculty?.photo_url || user.avatar;
    const initials = getInitials(user.name);

    const activeAssignment = portal_context?.active_assignment;
    const subtitle =
        (user as any)?.faculty?.academic_rank ||
        activeAssignment?.role_name ||
        (user as any)?.roles?.[0] ||
        (user.is_institution_super_admin
            ? 'Institution Super Admin'
            : user.is_vpaf
            ? 'VPAF Executive'
            : user.is_college_admin
            ? 'College Admin'
            : 'Faculty Member');

    return (
        <SidebarMenu>
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="rounded-2xl border border-border/80 bg-card/60 hover:bg-card p-2 text-foreground data-[state=open]:bg-sidebar-accent transition-all shadow-2xs group cursor-pointer"
                        >
                            {/* Avatar with active green dot */}
                            <div className="relative shrink-0">
                                <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shadow-2xs">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span>{initials}</span>
                                    )}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#17152E]" />
                            </div>

                            {/* User details */}
                            <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden min-w-0">
                                <span className="truncate font-bold text-foreground text-xs">
                                    {user.name}
                                </span>
                                <span className="truncate text-[10px] text-muted-foreground font-medium mt-0.5">
                                    {subtitle}
                                </span>
                            </div>

                            {/* Upward chevron when collapsed at bottom */}
                            <ChevronUp className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0 group-hover:text-primary transition-colors" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-auto p-0 rounded-2xl shadow-xl border border-border bg-card overflow-hidden"
                        align="start"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'right' : 'top'}
                        sideOffset={10}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
