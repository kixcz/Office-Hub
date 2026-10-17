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
    Paintbrush,
    Minus,
    CalendarRange,
    Users,
    Activity,
    ShieldAlert,
    Laptop,
    DoorOpen,
    ListFilter,
    AlertTriangle,
    UserCheck,
    CheckCircle2,
    Sliders
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
    supported_slots?: string[];
    config_schema?: string[];
}

interface Category {
    name: string;
    domain: string;
    description: string;
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
    CalendarRange,
    Clock,
    Trophy,
    BarChart3,
    ShieldCheck,
    Minus,
    Users,
    Activity,
    ShieldAlert,
    Laptop,
    DoorOpen,
    ListFilter,
    AlertTriangle,
    UserCheck,
    Sparkles,
};

export default function TvWidgetLibraryPage({ categories }: Props) {
    const [search, setSearch] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);

    const domains = [
        { id: 'all', label: 'All Domains' },
        { id: 'general', label: 'General & QR' },
        { id: 'announcements', label: 'Announcements' },
        { id: 'compliance', label: 'Compliance' },
        { id: 'scheduling', label: 'Scheduling' },
        { id: 'faculty', label: 'Faculty' },
        { id: 'performance', label: 'Performance' },
        { id: 'facility', label: 'Facility' },
    ];

    const filteredCategories = categories
        .filter((cat) => selectedDomain === 'all' || cat.domain === selectedDomain)
        .map((cat) => ({
            ...cat,
            widgets: cat.widgets.filter((w) =>
                w.name.toLowerCase().includes(search.toLowerCase()) ||
                w.desc.toLowerCase().includes(search.toLowerCase()) ||
                w.type.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((cat) => cat.widgets.length > 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Widget Library - TV Studio Workspace" />

            <TvStudioLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                <Component className="w-4 h-4" />
                                <span>Predefined TV Content Blocks</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Widget Library Catalog
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                                Standardized TV content blocks linked to OfficeHub database schemas with controlled query options, slot compatibility rules, and full QR digital access support.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/tv-config/slides/builder"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                            >
                                <Paintbrush className="w-4 h-4" />
                                <span>Compose Slide with Widgets</span>
                            </Link>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                            {domains.map((dom) => (
                                <button
                                    key={dom.id}
                                    type="button"
                                    onClick={() => setSelectedDomain(dom.id)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border',
                                        selectedDomain === dom.id
                                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    )}
                                >
                                    {dom.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative md:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                placeholder="Search widgets or schemas..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 text-xs font-semibold"
                            />
                        </div>
                    </div>

                    {/* QR Code Highlight Callout */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0">
                                <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Interactive QR Code Digital Access Widget</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold uppercase">Featured</span>
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Allows viewers to scan the TV screen from across the room and open Faculty Schedules, Program Rosters, Survey Forms, or Detailed Announcements on their phones. Enforces minimum size and contrast standards.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const qr = categories.flatMap(c => c.widgets).find(w => w.id === 'general_qr');
                                if (qr) setSelectedWidget(qr);
                            }}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                        >
                            Inspect QR Schema
                        </button>
                    </div>

                    {/* Categories and Widgets Grid */}
                    <div className="space-y-8">
                        {filteredCategories.map((category) => (
                            <div key={category.name} className="space-y-3">
                                <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>{category.name}</span>
                                        <span className="text-xs font-normal text-slate-400">({category.widgets.length} widgets)</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {category.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {category.widgets.map((widget) => {
                                        const Icon = iconMap[widget.icon] || Database;

                                        return (
                                            <div
                                                key={widget.id}
                                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 p-4 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3 group"
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                            {widget.type}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                                            {widget.name}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                                            {widget.desc}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Supported Slots and Configuration tags */}
                                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                                                    <div className="flex items-center justify-between text-slate-400">
                                                        <span>Compatible Slots:</span>
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                            {widget.supported_slots?.includes('all') ? 'All Slots' : widget.supported_slots?.slice(0, 2).join(', ') + '...'}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedWidget(widget)}
                                                        className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                                    >
                                                        <Sliders className="w-3.5 h-3.5 text-amber-500" />
                                                        <span>View Configuration Schema</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Widget Configuration Schema Inspector Dialog */}
                {selectedWidget && (
                    <Dialog open={!!selectedWidget} onOpenChange={() => setSelectedWidget(null)}>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <DialogHeader>
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                    <Component className="w-4 h-4" />
                                    <span>Widget Configuration Schema</span>
                                </div>
                                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                                    {selectedWidget.name}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-2 text-xs">
                                <p className="text-slate-600 dark:text-slate-300">
                                    {selectedWidget.desc}
                                </p>

                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 block uppercase text-[10px] tracking-wide">
                                        Controlled Query Parameters
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedWidget.config_schema?.map((field) => (
                                            <span
                                                key={field}
                                                className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold"
                                            >
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 pt-1">
                                        Users configure data via these parameters; arbitrary raw database queries outside these controlled options are strictly restricted.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 block uppercase text-[10px] tracking-wide">
                                        Compatible Layout Slots
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedWidget.supported_slots?.map((slot) => (
                                            <span
                                                key={slot}
                                                className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-semibold"
                                            >
                                                {slot}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <button
                                    type="button"
                                    onClick={() => setSelectedWidget(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    Close
                                </button>
                                <Link
                                    href="/tv-config/slides/builder"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
                                >
                                    <span>Insert in Slide Composer</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </TvStudioLayout>
        </AppLayout>
    );
}
