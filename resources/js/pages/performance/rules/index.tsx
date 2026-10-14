import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Trophy,
    CheckCircle2,
    Users,
    Building2,
    Plus,
    Search,
    ChevronDown,
    MoreVertical,
    BarChart3,
    ListOrdered,
    Award,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Trash2,
    Eye,
    SlidersHorizontal,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Recognition Rules', href: '/performance/rules' },
];

interface RecognitionRuleItem {
    id: number;
    title: string;
    description?: string;
    type: 'faculty' | 'program';
    metric: string;
    criteria_detail?: string;
    target: string;
    display_format: string;
    min_requirements: number;
    min_on_time_rate: number;
    min_compliance_rate: number;
    allow_overdue: boolean;
    is_active: boolean;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    rules: RecognitionRuleItem[];
    recognitions?: any[];
}

export default function RulesIndex({ rules = [], recognitions = [] }: Props) {
    const [selectedTab, setSelectedTab] = useState<'all' | 'faculty' | 'program'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Create / Edit modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<RecognitionRuleItem | null>(null);

    // Form handling
    const { data, setData, post, put, processing, reset, errors } = useForm({
        title: '',
        description: '',
        type: 'faculty' as 'faculty' | 'program',
        metric: 'Compliance Rate',
        criteria_detail: 'Based on verified submissions',
        target: 'Top 5',
        display_format: 'Leaderboard',
        min_requirements: 1,
        min_on_time_rate: 80,
        min_compliance_rate: 85,
        allow_overdue: false,
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingRule(null);
        reset();
        setData({
            title: '',
            description: '',
            type: 'faculty',
            metric: 'Compliance Rate',
            criteria_detail: 'Based on verified submissions',
            target: 'Top 5',
            display_format: 'Leaderboard',
            min_requirements: 1,
            min_on_time_rate: 80,
            min_compliance_rate: 85,
            allow_overdue: false,
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rule: RecognitionRuleItem) => {
        setEditingRule(rule);
        setData({
            title: rule.title,
            description: rule.description || '',
            type: rule.type,
            metric: rule.metric || 'Compliance Rate',
            criteria_detail: rule.criteria_detail || '',
            target: rule.target || 'Top 5',
            display_format: rule.display_format || 'Leaderboard',
            min_requirements: rule.min_requirements,
            min_on_time_rate: rule.min_on_time_rate,
            min_compliance_rate: rule.min_compliance_rate,
            allow_overdue: rule.allow_overdue,
            is_active: rule.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRule) {
            put(`/performance/rules/${editingRule.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/performance/rules', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggleActive = (rule: RecognitionRuleItem) => {
        router.put(`/performance/rules/${rule.id}`, {
            is_active: !rule.is_active,
        }, {
            preserveScroll: true,
        });
    };

    const [deletingRule, setDeletingRule] = useState<RecognitionRuleItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteRule = (rule: RecognitionRuleItem) => {
        setDeletingRule(rule);
    };

    const confirmDeleteRule = () => {
        if (!deletingRule) return;
        setIsDeleting(true);
        router.delete(`/performance/rules/${deletingRule.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingRule(null);
            },
        });
    };

    // Calculate metrics matching the 4 top summary cards in the user image
    const totalRules = rules.length;
    const activeRules = rules.filter(r => r.is_active).length;
    const facultyRules = rules.filter(r => r.type === 'faculty').length;
    const programRules = rules.filter(r => r.type === 'program').length;

    // Filter rules
    const filteredRules = useMemo(() => {
        return rules.filter(rule => {
            if (selectedTab !== 'all' && rule.type !== selectedTab) {
                return false;
            }
            if (statusFilter === 'active' && !rule.is_active) {
                return false;
            }
            if (statusFilter === 'inactive' && rule.is_active) {
                return false;
            }
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchTitle = rule.title.toLowerCase().includes(q);
                const matchDesc = (rule.description || '').toLowerCase().includes(q);
                const matchMetric = (rule.metric || '').toLowerCase().includes(q);
                return matchTitle || matchDesc || matchMetric;
            }
            return true;
        });
    }, [rules, selectedTab, statusFilter, searchQuery]);

    // Format updated date (e.g. "Oct 10, 2026")
    const formatRuleDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        } catch {
            return 'Oct 10, 2026';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recognition Rules - CIDS OfficeHub" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* 1. HERO BANNER (Exact layout matching reference mockup) */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-100/90 via-amber-50/70 to-amber-100/60 dark:from-amber-950/30 dark:via-background dark:to-amber-950/20 p-6 md:p-8 shadow-xs">
                    {/* Background subtle architectural watermark pattern */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                                <Star className="w-7 h-7 fill-white text-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                                    Recognition Rules
                                </h1>
                                <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1">
                                    Manage the criteria and rules used to identify and display faculty and program recognition.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={openCreateModal}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-amber-400/30 cursor-pointer flex items-center gap-2 text-xs md:text-sm shrink-0"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Create Recognition Rule</span>
                        </Button>
                    </div>
                </div>

                {/* 2. FOUR KPI SUMMARY CARDS (Exact match to reference mockup) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Rules */}
                    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Total Rules
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {totalRules}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">
                                    Active recognition rules
                                </span>
                            </div>
                        </div>
                        {/* Mini bar chart visual */}
                        <div className="flex items-end gap-1 h-8 text-amber-500">
                            <span className="w-1.5 h-3 bg-amber-400/50 rounded-t-sm" />
                            <span className="w-1.5 h-5 bg-amber-400/80 rounded-t-sm" />
                            <span className="w-1.5 h-7 bg-amber-400 rounded-t-sm" />
                        </div>
                    </div>

                    {/* Active Rules */}
                    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Active Rules
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {activeRules}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">
                                    Currently enabled
                                </span>
                            </div>
                        </div>
                        {/* Mini bar chart visual */}
                        <div className="flex items-end gap-1 h-8 text-emerald-500">
                            <span className="w-1.5 h-2.5 bg-emerald-400/50 rounded-t-sm" />
                            <span className="w-1.5 h-6 bg-emerald-400/80 rounded-t-sm" />
                            <span className="w-1.5 h-5 bg-emerald-400 rounded-t-sm" />
                        </div>
                    </div>

                    {/* Faculty-Based Rules */}
                    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Faculty-Based Rules
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {facultyRules}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">
                                    Individual recognition
                                </span>
                            </div>
                        </div>
                        {/* Mini bar chart visual */}
                        <div className="flex items-end gap-1 h-8 text-blue-500">
                            <span className="w-1.5 h-4 bg-blue-400/50 rounded-t-sm" />
                            <span className="w-1.5 h-6 bg-blue-400/80 rounded-t-sm" />
                            <span className="w-1.5 h-5 bg-blue-400 rounded-t-sm" />
                        </div>
                    </div>

                    {/* Program-Based Rules */}
                    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Program-Based Rules
                                </span>
                                <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                    {programRules}
                                </div>
                                <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">
                                    Program recognition
                                </span>
                            </div>
                        </div>
                        {/* Mini bar chart visual */}
                        <div className="flex items-end gap-1 h-8 text-purple-500">
                            <span className="w-1.5 h-3 bg-purple-400/50 rounded-t-sm" />
                            <span className="w-1.5 h-4 bg-purple-400/80 rounded-t-sm" />
                            <span className="w-1.5 h-6 bg-purple-400 rounded-t-sm" />
                        </div>
                    </div>
                </div>

                {/* 3. FILTER TABS & SEARCH CONTROLS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 border-b sm:border-b-0 border-border pb-2 sm:pb-0">
                        <button
                            type="button"
                            onClick={() => setSelectedTab('all')}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                selectedTab === 'all'
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>All Rules</span>
                            <span className={cn(
                                "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                                selectedTab === 'all'
                                    ? "bg-amber-400 text-slate-900"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {totalRules}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedTab('faculty')}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                selectedTab === 'faculty'
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Faculty Recognition</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground">
                                {facultyRules}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedTab('program')}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                selectedTab === 'program'
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Program Recognition</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground">
                                {programRules}
                            </span>
                        </button>
                    </div>

                    {/* Search & Status Filter */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search rules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-input bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-xs"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold gap-2 border-border shadow-xs cursor-pointer"
                                >
                                    <span>
                                        {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                    <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                                    All Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                                    Active Only
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                                    Inactive Only
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* 4. RECOGNITION RULES TABLE (Exact table headers and row items matching reference mockup) */}
                <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4">Rule Name</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Criteria / Metric</th>
                                    <th className="py-3 px-4">Target</th>
                                    <th className="py-3 px-4">Display Format</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4">Last Updated</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredRules.map((rule, index) => {
                                    return (
                                        <tr
                                            key={rule.id}
                                            className="hover:bg-muted/20 transition-colors group"
                                        >
                                            {/* Number */}
                                            <td className="py-4 px-4 text-center font-bold text-foreground text-xs tabular-nums">
                                                {index + 1}
                                            </td>

                                            {/* Rule Name & Description */}
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-foreground text-sm tracking-tight">
                                                    {rule.title}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                                    {rule.description || 'Recognize criteria based on compliance performance'}
                                                </div>
                                            </td>

                                            {/* Type Badge */}
                                            <td className="py-4 px-4">
                                                {rule.type === 'faculty' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                        <Users className="w-3.5 h-3.5" />
                                                        <span>Faculty</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        <span>Program</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Criteria / Metric */}
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-foreground text-xs">
                                                    {rule.metric || 'Compliance Rate'}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                                    {rule.criteria_detail || 'Based on verified submissions'}
                                                </div>
                                            </td>

                                            {/* Target */}
                                            <td className="py-4 px-4 font-bold text-foreground text-xs">
                                                {rule.target || 'Top 5'}
                                            </td>

                                            {/* Display Format Badge */}
                                            <td className="py-4 px-4">
                                                {rule.display_format === 'Leaderboard' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                                        <BarChart3 className="w-3.5 h-3.5" />
                                                        <span>Leaderboard</span>
                                                    </span>
                                                )}
                                                {rule.display_format === 'Ranked List' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                                        <ListOrdered className="w-3.5 h-3.5" />
                                                        <span>Ranked List</span>
                                                    </span>
                                                )}
                                                {rule.display_format === 'Highlight Card' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                                        <Trophy className="w-3.5 h-3.5" />
                                                        <span>Highlight Card</span>
                                                    </span>
                                                )}
                                                {rule.display_format === 'Progress Card' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400">
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                        <span>Progress Card</span>
                                                    </span>
                                                )}
                                                {!['Leaderboard', 'Ranked List', 'Highlight Card', 'Progress Card'].includes(rule.display_format) && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground">
                                                        <Award className="w-3.5 h-3.5" />
                                                        <span>{rule.display_format}</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status Switch (Amber rounded toggle matching mockup) */}
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(rule)}
                                                    className={cn(
                                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer",
                                                        rule.is_active ? "bg-amber-400" : "bg-slate-300 dark:bg-slate-700"
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs",
                                                            rule.is_active ? "translate-x-6" : "translate-x-1"
                                                        )}
                                                    />
                                                </button>
                                            </td>

                                            {/* Last Updated */}
                                            <td className="py-4 px-4 text-xs">
                                                <div className="font-semibold text-foreground">
                                                    {formatRuleDate(rule.updated_at || rule.created_at)}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                                    by {rule.updated_by || 'System Admin'}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => openEditModal(rule)}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span>Edit Rule</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleActive(rule)}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span>{rule.is_active ? 'Disable Rule' : 'Enable Rule'}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteRule(rule)}
                                                            className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete Rule</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredRules.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                                            No recognition rules found matching the selected filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer with Pagination matching mockup */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/80 text-xs text-muted-foreground bg-card">
                        <div>
                            Showing 1 to {filteredRules.length} of {filteredRules.length} recognition rules
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground border-border/80"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold shadow-xs"
                            >
                                1
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground border-border/80"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. CREATE / EDIT RECOGNITION RULE DIALOG MODAL                            */}
            {/* ========================================================================= */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editingRule ? 'Edit Recognition Rule' : 'Create Recognition Rule'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Define the metrics, target capacity, and visual presentation format for TV display recognition and rankings.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
                        {/* Title & Description */}
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Rule Name
                                </Label>
                                <Input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Top Performing Faculty"
                                    className="h-9 text-xs"
                                    required
                                />
                                {errors.title && <p className="text-rose-500 text-[11px] mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Description / Subtitle
                                </Label>
                                <Input
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="e.g. Recognize faculty with highest compliance rate"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        {/* Type, Metric & Target */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Recognition Type
                                </Label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value as 'faculty' | 'program')}
                                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-xs"
                                >
                                    <option value="faculty">Faculty-Based</option>
                                    <option value="program">Program-Based</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Criteria / Metric
                                </Label>
                                <select
                                    value={data.metric}
                                    onChange={(e) => setData('metric', e.target.value)}
                                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-xs"
                                >
                                    <option value="Compliance Rate">Compliance Rate</option>
                                    <option value="On-Time Submission Rate">On-Time Submission Rate</option>
                                    <option value="Overdue Count">Overdue Count</option>
                                    <option value="Improvement Rate">Improvement Rate</option>
                                    <option value="Program Compliance Rate">Program Compliance Rate</option>
                                    <option value="Total Submissions">Total Submissions</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Target Capacity
                                </Label>
                                <select
                                    value={data.target}
                                    onChange={(e) => setData('target', e.target.value)}
                                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-xs"
                                >
                                    <option value="Top 3">Top 3</option>
                                    <option value="Top 5">Top 5</option>
                                    <option value="Top 10">Top 10</option>
                                    <option value="All Qualified">All Qualified</option>
                                </select>
                            </div>
                        </div>

                        {/* Criteria detail & Display Format */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Criteria Details
                                </Label>
                                <Input
                                    value={data.criteria_detail}
                                    onChange={(e) => setData('criteria_detail', e.target.value)}
                                    placeholder="e.g. Based on verified submissions"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Display Format
                                </Label>
                                <select
                                    value={data.display_format}
                                    onChange={(e) => setData('display_format', e.target.value)}
                                    className="w-full h-9 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 shadow-xs"
                                >
                                    <option value="Leaderboard">Leaderboard</option>
                                    <option value="Ranked List">Ranked List</option>
                                    <option value="Highlight Card">Highlight Card</option>
                                    <option value="Progress Card">Progress Card</option>
                                </select>
                            </div>
                        </div>

                        {/* Thresholds */}
                        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Threshold Parameters
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Min. Requirements
                                    </Label>
                                    <Input
                                        type="number"
                                        value={data.min_requirements}
                                        onChange={(e) => setData('min_requirements', Number(e.target.value))}
                                        className="h-8 text-xs font-mono"
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Min. On-Time (%)
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.min_on_time_rate}
                                        onChange={(e) => setData('min_on_time_rate', Number(e.target.value))}
                                        className="h-8 text-xs font-mono"
                                        min={0}
                                        max={100}
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Min. Compliance (%)
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.min_compliance_rate}
                                        onChange={(e) => setData('min_compliance_rate', Number(e.target.value))}
                                        className="h-8 text-xs font-mono"
                                        min={0}
                                        max={100}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="allow_overdue"
                                    checked={data.allow_overdue}
                                    onCheckedChange={(c) => setData('allow_overdue', c as boolean)}
                                />
                                <Label htmlFor="allow_overdue" className="text-xs font-semibold cursor-pointer">
                                    Allow candidates with overdue outputs?
                                </Label>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold"
                            >
                                {editingRule ? 'Save Changes' : 'Create Rule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Rule Confirmation Modal */}
            <DeleteConfirmDialog
                open={!!deletingRule}
                onOpenChange={(open) => !open && setDeletingRule(null)}
                title="Delete Recognition Rule"
                description="Are you sure you want to permanently delete this faculty/program performance rule? Historical evaluations using this rule will remain recorded."
                itemName={deletingRule ? deletingRule.title : undefined}
                confirmLabel="Delete Rule"
                isDeleting={isDeleting}
                onConfirm={confirmDeleteRule}
            />
        </AppLayout>
    );
}
