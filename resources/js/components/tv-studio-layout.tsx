import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    ListVideo,
    Sliders,
    LayoutTemplate,
    Paintbrush,
    Component,
    Settings,
    Eye,
    History,
    Tv,
    Search,
    ChevronDown,
    ChevronRight,
    PanelLeftClose,
    PanelLeft,
    CheckCircle2,
    Clock,
    Sparkles,
    FileText,
    ExternalLink,
    Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface TvStudioNavItem {
    id: string;
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    external?: boolean;
}

export interface TvStudioNavGroup {
    title: string;
    items: TvStudioNavItem[];
}

export const TV_STUDIO_NAV_GROUPS: TvStudioNavGroup[] = [
    {
        title: 'OVERVIEW',
        items: [
            { id: 'dashboard', title: 'TV Studio Dashboard', url: '/tv-config/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'PLAYLIST & CONTENT',
        items: [
            { id: 'playlist', title: 'Playlist', url: '/tv-config/playlist', icon: ListVideo },
            { id: 'slides', title: 'Slide Configuration', url: '/tv-config/slides', icon: Sliders },
            { id: 'spotlight', title: 'Spotlight Slides', url: '/tv-config/spotlight', icon: Sparkles, badge: 'New' },
            { id: 'custom', title: 'Custom Manual Slides', url: '/tv-config/custom', icon: FileText, badge: 'New' },
            { id: 'cleaners', title: 'Cleaners Schedule', url: '/tv-config/cleaners', icon: Sparkles, badge: 'Duty' },
            { id: 'templates', title: 'Templates', url: '/tv-config/templates', icon: LayoutTemplate },
        ],
    },
    {
        title: 'SLIDE DESIGN',
        items: [
            { id: 'builder', title: 'Slide Composer', url: '/tv-config/slides/builder', icon: Paintbrush },
            { id: 'widgets', title: 'Widget Library', url: '/tv-config/widgets', icon: Component },
        ],
    },
    {
        title: 'DISPLAY & PUBLISHING',
        items: [
            { id: 'settings', title: 'Display Settings', url: '/tv-config/settings', icon: Settings },
            { id: 'preview', title: 'Preview & Testing', url: '/tv-config/preview', icon: Eye },
            { id: 'history', title: 'Publication History', url: '/tv-config/history', icon: History },
        ],
    },
    {
        title: 'LIVE DISPLAY',
        items: [
            { id: 'live-tv', title: 'Open TV Display', url: '/tv-display', icon: Tv, external: true, badge: 'Live' },
        ],
    },
];

interface TvStudioLayoutProps {
    children: React.ReactNode;
    defaultCollapsed?: boolean;
    hideSidebar?: boolean;
}

export function TvStudioLayout({ children, defaultCollapsed = false, hideSidebar = false }: TvStudioLayoutProps) {
    const page = usePage<any>();
    const currentUrl = page.url;

    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tv_studio_mini_sidebar_collapsed');
            if (saved !== null) {
                return saved === 'true';
            }
        }
        return defaultCollapsed;
    });

    const setCollapsedState = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tv_studio_mini_sidebar_collapsed', collapsed ? 'true' : 'false');
        }
    };

    const [searchFilter, setSearchFilter] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (title: string) => {
        setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Restore scroll position on mount or url change
    React.useLayoutEffect(() => {
        if (typeof window !== 'undefined' && scrollContainerRef.current) {
            const savedScroll = sessionStorage.getItem('tv_studio_mini_sidebar_scroll');
            if (savedScroll !== null) {
                scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10) || 0;
            }
        }
    }, [currentUrl]);

    const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('tv_studio_mini_sidebar_scroll', String(e.currentTarget.scrollTop));
        }
    };

    if (hideSidebar) {
        return <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950">{children}</div>;
    }

    return (
        <div className="flex w-full min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950">
            {/* ========================================================================= */}
            {/* PERSISTENT TV STUDIO MINI SIDEBAR                                         */}
            {/* ========================================================================= */}
            <aside
                className={cn(
                    'sticky top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-200 ease-in-out shrink-0 z-20 flex flex-col',
                    isCollapsed ? 'w-16' : 'w-72'
                )}
            >
                {/* Brand / Mini Sidebar Header */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 h-16">
                    <div className={cn('flex items-center gap-2.5 min-w-0', isCollapsed && 'justify-center w-full')}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black border border-amber-300">
                            <Tv className="w-5 h-5 text-slate-950" />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                                    TV Display <span className="text-amber-600 dark:text-amber-400">Studio</span>
                                </h2>
                                <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-500 block uppercase">
                                    Workspace Navigation
                                </span>
                            </div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <button
                            type="button"
                            onClick={() => setCollapsedState(true)}
                            title="Collapse to icon rail"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* If collapsed, show single expand toggle */}
                {isCollapsed && (
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex justify-center">
                        <button
                            type="button"
                            onClick={() => setCollapsedState(false)}
                            title="Expand TV studio navigation"
                            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                        >
                            <PanelLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </button>
                    </div>
                )}

                {/* Active TV Status Card & Filter */}
                {!isCollapsed && (
                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <span>Display Connectivity</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                            </span>
                        </div>

                        <Link
                            href="/tv-display"
                            target="_blank"
                            className="block p-2.5 rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors group"
                        >
                            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium leading-none flex items-center justify-between">
                                <span>CIDS Main Hallway 4K TV</span>
                                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 flex items-center justify-between">
                                <span className="truncate">Active Playlist: Official Rotation</span>
                                <span className="text-[10px] font-normal text-slate-500 ml-1">16:9</span>
                            </div>
                        </Link>

                        {/* Quick filter input */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="Find TV module..."
                                className="pl-8 h-8 text-[11px] rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                )}

                {/* Scrollable Navigation Groups */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleSidebarScroll}
                    className="flex-1 overflow-y-auto p-2 space-y-4"
                >
                    {TV_STUDIO_NAV_GROUPS.map((group) => {
                        const isGroupClosed = collapsedGroups[group.title];
                        const filteredItems = group.items.filter((item) =>
                            !searchFilter.trim() || item.title.toLowerCase().includes(searchFilter.toLowerCase().trim())
                        );

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={group.title} className="space-y-1">
                                {!isCollapsed && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.title)}
                                        className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 tracking-wider transition-colors cursor-pointer"
                                    >
                                        <span>{group.title}</span>
                                        <ChevronDown
                                            className={cn(
                                                'w-3 h-3 text-slate-400 transition-transform duration-150',
                                                isGroupClosed && '-rotate-90'
                                            )}
                                        />
                                    </button>
                                )}

                                {(!isGroupClosed || isCollapsed) && (
                                    <div className="space-y-0.5">
                                        {filteredItems.map((item) => {
                                            const Icon = item.icon;
                                            const isActive =
                                                item.url === '/tv-config/slides'
                                                    ? currentUrl.startsWith('/tv-config/slides') && !currentUrl.includes('/builder')
                                                    : item.url === '/tv-config/slides/builder'
                                                        ? currentUrl.includes('/tv-config/slides/builder')
                                                        : currentUrl.startsWith(item.url);

                                            if (isCollapsed) {
                                                return (
                                                    <Link
                                                        key={item.id}
                                                        href={item.url}
                                                        target={item.external ? '_blank' : undefined}
                                                        title={item.title}
                                                        preserveScroll={!item.external}
                                                        className={cn(
                                                            'w-full h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative',
                                                            isActive
                                                                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs border border-amber-500/40'
                                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        )}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {item.badge && (
                                                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                                                        )}
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.url}
                                                    target={item.external ? '_blank' : undefined}
                                                    preserveScroll={!item.external}
                                                    className={cn(
                                                        'w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer group',
                                                        isActive
                                                            ? 'bg-amber-400 text-slate-950 shadow-xs font-bold border border-amber-500/40'
                                                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Icon
                                                            className={cn(
                                                                'w-4 h-4 shrink-0 transition-colors',
                                                                isActive
                                                                    ? 'text-slate-950'
                                                                    : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                                                            )}
                                                        />
                                                        <span className="truncate">{item.title}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {item.badge && (
                                                            <span
                                                                className={cn(
                                                                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider',
                                                                    isActive
                                                                        ? 'bg-amber-500/30 text-slate-950'
                                                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                                )}
                                                            >
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                        {item.external && (
                                                            <ExternalLink
                                                                className={cn(
                                                                    'w-3 h-3',
                                                                    isActive ? 'text-slate-950/80' : 'text-slate-400'
                                                                )}
                                                            />
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Quick Action */}
                {!isCollapsed ? (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <Link
                            href="/tv-display"
                            target="_blank"
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all shadow-xs border border-amber-500/40 cursor-pointer"
                        >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Launch Live Display</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                        </Link>
                    </div>
                ) : (
                    <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex justify-center shrink-0">
                        <Link
                            href="/tv-display"
                            target="_blank"
                            title="Launch Live TV Display"
                            className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                            <Tv className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </aside>

            {/* ========================================================================= */}
            {/* WORKSPACE CONTENT AREA                                                    */}
            {/* ========================================================================= */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
