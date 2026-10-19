import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 group-data-[collapsible=icon]:size-7 shrink-0 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white text-xs">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-semibold text-foreground text-xs">{user.name}</span>
                    {(user as any)?.roles?.[0] && (
                        <span className="shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {(user as any).roles[0] === 'System Administrator' ? 'Admin' : (user as any).roles[0]}
                        </span>
                    )}
                </div>
                {showEmail && <span className="text-muted-foreground truncate text-[11px] mt-0.5">{user.email}</span>}
            </div>
        </>
    );
}
