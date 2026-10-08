import { 
    SidebarGroup, 
    SidebarGroupLabel, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const page = usePage();

    return (
        <div className="flex flex-col gap-4 p-4 font-['Poppins']">
            {groups.map((group) => (
                <SidebarGroup key={group.title} className="px-0 py-0 gap-1">
                    <SidebarGroupLabel className="text-xs font-semibold text-gray-400 mb-2">{group.title}</SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {group.items.map((item) => {
                            const hasItems = item.items && item.items.length > 0;
                            
                            if (hasItems) {
                                return (
                                    <Collapsible key={item.title} asChild defaultOpen={false} className="group/collapsible">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip={item.title} className="text-[14px]">
                                                    {item.icon && <item.icon className="size-[20px]" />}
                                                    <span>{item.title}</span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items?.map((subItem) => (
                                                        <SidebarMenuSubItem key={subItem.title}>
                                                            <SidebarMenuSubButton asChild isActive={subItem.url === page.url} className="text-[14px]">
                                                                <Link href={subItem.url} prefetch className="flex items-center justify-between w-full">
                                                                    <span>{subItem.title}</span>
                                                                    {subItem.badge !== undefined && (
                                                                        <span className="ml-auto inline-flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                            {subItem.badge}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                );
                            }

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={item.url === page.url} className="text-[14px]">
                                        <Link href={item.url} prefetch className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                {item.icon && <item.icon className="size-[20px]" />}
                                                <span>{item.title}</span>
                                            </div>
                                            {item.badge !== undefined && (
                                                <span className="ml-auto inline-flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </div>
    );
}
