import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import { 
    Component, 
    Type, 
    Image as ImageIcon, 
    Video, 
    Award, 
    QrCode, 
    Megaphone, 
    Star, 
    ClipboardList, 
    Building2, 
    Calendar, 
    Clock, 
    Trophy, 
    BarChart3, 
    ShieldCheck, 
    Search, 
    ArrowRight, 
    Sparkles,
    Database,
    Paintbrush
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'TV Studio', href: '/tv-config/dashboard' },
    { title: 'Widget Library', href: '/tv-config/widgets' },
];

interface Widget {
    id: string;
    name: string;
    desc: string;
    type: string;
    icon: string;
}

interface Category {
    name: string;
    widgets: Widget[];
}

interface Props {
    categories: Category[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Type,
    Image: ImageIcon,
    Video,
    Award,
    QrCode,
    Megaphone,
    Star,
    ClipboardList,
    Building2,
    Calendar,
    Clock,
    Trophy,
    BarChart3,
    ShieldCheck,
};

export default function TvWidgetLibraryPage({ categories }: Props) {
    const [search, setSearch] = useState('');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Widget Library - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                <Component className="w-4 h-4" />
                                <span>Component Architecture</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Data-Driven Widget Library
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Reusable dynamic widgets integrated with CIDS OfficeHub databases, ready for drag-and-drop slide composition.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/tv-config/slides/builder"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                            >
                                <Paintbrush className="w-4 h-4" />
                                <span>Open in Visual Builder</span>
                            </Link>
                        </div>
                    </div>

                    {/* Filter search */}
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search widgets by name or data source..."
                            className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    {/* Categorized Widgets */}
                    <div className="space-y-8">
                        {categories.map((category) => {
                            const filtered = category.widgets.filter((w) =>
                                !search.trim() ||
                                w.name.toLowerCase().includes(search.toLowerCase()) ||
                                w.desc.toLowerCase().includes(search.toLowerCase()) ||
                                w.type.toLowerCase().includes(search.toLowerCase())
                            );

                            if (filtered.length === 0) return null;

                            return (
                                <div key={category.name} className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                                        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                                            {category.name}
                                        </h2>
                                        <span className="text-xs text-slate-400 font-semibold">
                                            {filtered.length} {filtered.length === 1 ? 'widget' : 'widgets'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filtered.map((widget) => {
                                            const Icon = iconMap[widget.icon] || Component;

                                            return (
                                                <div
                                                    key={widget.id}
                                                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4 group"
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                                widget.type === 'Data Source'
                                                                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                            )}>
                                                                {widget.type}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                                {widget.name}
                                                            </h3>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                                {widget.desc}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                                            <Database className="w-3 h-3" />
                                                            Live Connected
                                                        </span>
                                                        <Link
                                                            href="/tv-config/slides/builder"
                                                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                        >
                                                            <span>Use on Canvas</span>
                                                            <ArrowRight className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </TvStudioLayout>
        </AppLayout>
    );
}
