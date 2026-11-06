import React, { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Archive,
    ArrowRightLeft,
    BarChart3,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    GraduationCap,
    History,
    Info,
    Layers,
    LayoutGrid,
    List,
    MapPin,
    Network,
    Phone,
    Plus,
    School,
    Search,
    Settings,
    ShieldCheck,
    Sliders,
    Target,
    Tv,
    User,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScopedRoleItem {
    id: number;
    designation_type?: string;
    status: string;
    user?: { id: number; name: string; email: string };
    role?: { id: number; name: string };
}

interface ProgramItem {
    id: number;
    code: string;
    name: string;
    degree_level?: string;
    status?: string;
}

interface Unit {
    id: number;
    code: string;
    name: string;
    acronym: string | null;
    type: string;
    entity_type?: string | null;
    parent_id?: number | null;
    dean_name: string | null;
    contact_email: string | null;
    address?: string | null;
    contact_phone?: string | null;
    logo_url?: string | null;
    color_theme: string | null;
    branding?: {
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        surface_color: string;
        slogan: string;
        logo_url?: string | null;
    };
    status: 'Not Configured' | 'In Setup' | 'Ready' | 'Active' | 'Suspended' | 'Archived';
    effective_from?: string | null;
    effective_until?: string | null;
    setup_stage: string;
    setup_progress: number;
    entity_tv_enabled?: boolean;
    allow_local_overrides?: boolean;
    enabled_modules?: Record<string, boolean>;
    parent?: { id: number; code: string; name: string } | null;
    children?: Unit[];
    programs?: ProgramItem[];
    scoped_roles?: ScopedRoleItem[];
    entity_scoped_roles?: ScopedRoleItem[];
}

interface Props {
    entities: Unit[];
    colleges: Unit[];
    allUnits?: Unit[];
    users?: Array<{ id: number; name: string; email: string; institutional_id?: string }>;
    modulesCatalog?: Array<{ id: string; name: string; category: string }>;
    unitHistory?: Array<{
        id: number;
        action: string;
        target_name: string;
        actor_name: string;
        reason?: string;
        created_at: string;
    }>;
    initialView?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Organization Management & Structure Tree', href: '/institution/colleges' },
];

export default function CollegesIndex({
    entities = [],
    colleges = [],
    allUnits = [],
    users = [],
    modulesCatalog = [],
    unitHistory = [],
    initialView = 'tree',
}: Props) {
    const unitsList = allUnits.length > 0 ? allUnits : [...entities, ...colleges];
    const [viewMode, setViewMode] = useState<'tree' | 'entities' | 'colleges'>(
        initialView === 'entities' ? 'entities' : initialView === 'colleges' ? 'colleges' : 'tree',
    );
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(colleges[0] || entities[0] || null);
    const [createModalMode, setCreateModalMode] = useState<'Entity' | 'College' | null>(null);
    const [reorgUnit, setReorgUnit] = useState<Unit | null>(null);

    // Directory Filter, Sort & Layout Controls (matching reference UI)
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [campusTypeFilter, setCampusTypeFilter] = useState('All Campus Types');
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'readiness-desc' | 'status'>('name-asc');
    const [displayLayout, setDisplayLayout] = useState<'grid' | 'list'>('grid');

    React.useEffect(() => {
        if (initialView === 'entities' || initialView === 'colleges' || initialView === 'tree') {
            setViewMode(initialView);
        }
    }, [initialView]);

    const currentDirectorySource = viewMode === 'entities' ? entities : colleges;

    const kpiMetrics = useMemo(() => {
        const list = viewMode === 'colleges' ? colleges : entities;
        const total = list.length;
        const activeCount = list.filter((u) => u.status === 'Active').length;
        const avgReadiness =
            total > 0 ? Math.round(list.reduce((sum, u) => sum + (Number(u.setup_progress) || 0), 0) / total) : 0;
        const pendingSetupCount = list.filter(
            (u) => u.status !== 'Active',
        ).length;

        return {
            total,
            activeCount,
            avgReadiness,
            pendingSetupCount,
        };
    }, [viewMode, entities, colleges]);

    const filteredUnits = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return [...currentDirectorySource]
            .filter((u) => {
                if (q) {
                    const hay = `${u.name} ${u.code} ${u.acronym || ''} ${u.dean_name || ''} ${u.entity_type || ''} ${u.address || ''}`.toLowerCase();
                    if (!hay.includes(q)) {
                        return false;
                    }
                }
                if (statusFilter !== 'All Statuses' && u.status !== statusFilter) {
                    return false;
                }
                if (campusTypeFilter !== 'All Campus Types') {
                    if (viewMode === 'entities') {
                        const eType = u.entity_type || 'Main Campus';
                        if (eType !== campusTypeFilter) {
                            return false;
                        }
                    } else {
                        const parentName = u.parent?.name || u.parent?.code || '';
                        if (parentName !== campusTypeFilter && u.type !== campusTypeFilter) {
                            return false;
                        }
                    }
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'name-asc') {
                    return a.name.localeCompare(b.name);
                }
                if (sortBy === 'name-desc') {
                    return b.name.localeCompare(a.name);
                }
                if (sortBy === 'readiness-desc') {
                    return (b.setup_progress || 0) - (a.setup_progress || 0);
                }
                return a.status.localeCompare(b.status);
            });
    }, [currentDirectorySource, searchQuery, statusFilter, campusTypeFilter, sortBy, viewMode]);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        acronym: '',
        type: 'College',
        entity_type: 'Main Campus',
        parent_id: entities[0]?.id ? String(entities[0].id) : '',
        dean_name: '',
        contact_email: '',
        address: '',
        contact_phone: '',
        status: 'Active',
        effective_from: '2026-08-01',
        effective_until: '',
        color_theme: 'amber',
        entity_tv_enabled: true,
        allow_local_overrides: true,
        admin_user_id: '',
        enabled_modules: {
            scheduling: true,
            faculty_attendance: true,
            lab_monitoring: true,
            lab_inventory: true,
            compliance: true,
            research_extension: true,
            tv_studio: true,
            performance: true,
        } as Record<string, boolean>,
    });

    const reorgForm = useForm({
        parent_id: '',
        status: 'Active',
        entity_tv_enabled: true,
        allow_local_overrides: true,
        reason: '',
    });

    const openCreateModal = (mode: 'Entity' | 'College') => {
        setCreateModalMode(mode);
        setData((prev) => ({
            ...prev,
            type: mode,
            parent_id: mode === 'College' && entities[0] ? String(entities[0].id) : '',
            status: mode === 'Entity' ? 'Active' : 'In Setup',
        }));
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/institution/colleges', {
            onSuccess: () => {
                setCreateModalMode(null);
                reset();
            },
        });
    };

    const openReorgModal = (unit: Unit) => {
        setReorgUnit(unit);
        reorgForm.setData({
            parent_id: unit.parent_id ? String(unit.parent_id) : '',
            status: unit.status,
            entity_tv_enabled: unit.entity_tv_enabled ?? true,
            allow_local_overrides: unit.allow_local_overrides ?? true,
            reason: '',
        });
    };

    const handleReorgSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reorgUnit) return;
        reorgForm.post(`/institution/colleges/${reorgUnit.id}/reorganize`, {
            onSuccess: () => setReorgUnit(null),
        });
    };

    const getStatusBadge = (status: Unit['status']) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Ready':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'In Setup':
                return 'bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] border-[#0B3A67]/20';
            case 'Suspended':
            case 'Archived':
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            case 'Not Configured':
            default:
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        }
    };

    const activeUnit = unitsList.find((u) => u.id === selectedUnit?.id) || selectedUnit;
    const activeUnitAdmins = [
        ...(activeUnit?.scoped_roles || []),
        ...(activeUnit?.entity_scoped_roles || []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization Management & Structure Tree · Platform Governance" />

            <div className="relative flex flex-col gap-5 p-4 md:p-7 max-w-7xl mx-auto w-full overflow-hidden">
                {/* Soft decorative lavender wave in top-right background */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-96 rounded-full bg-gradient-to-bl from-[#A78BFA]/20 via-[#7C3AED]/10 to-transparent blur-3xl" />

                {/* Top Authority Pill & Hierarchy Path */}
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD] border border-[#8B1E3F]/30 shadow-2xs">
                        Institution Super Admin Exclusive Authority
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span>Institution</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>Campus Entity</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>College</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>Program</span>
                    </div>
                </div>

                {/* Page Title Block with Rounded Lavender Icon Box */}
                <div className="relative z-10 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] flex items-center justify-center shrink-0 border border-[#8B1E3F]/30 shadow-2xs">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-[26px] font-extrabold tracking-tight text-[#17152E] dark:text-white leading-tight">
                            Organization Management & Structure Tree
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                            Only the Institution Super Admin may create, archive, deactivate, move, or structurally reorganize Entities and Colleges. Programs are operationally managed by College Admins within their scope.
                        </p>
                    </div>
                </div>

                {/* 4 Summary KPI Cards Strip */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Entities / Campuses */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                {viewMode === 'colleges' ? 'Total Colleges' : 'Total Entities / Campuses'}
                            </p>
                            <p className="text-2xl font-black text-[#17152E] dark:text-white leading-tight mt-0.5">
                                {kpiMetrics.total}
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Active Campuses */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                {viewMode === 'colleges' ? 'Active Colleges' : 'Active Campuses'}
                            </p>
                            <p className="text-2xl font-black text-[#17152E] dark:text-white leading-tight mt-0.5">
                                {kpiMetrics.activeCount}
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Readiness Average */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] flex items-center justify-center shrink-0">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Readiness Average</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-2xl font-black text-[#17152E] dark:text-white leading-tight">
                                    {kpiMetrics.avgReadiness}%
                                </span>
                                <span
                                    title="Average guided onboarding readiness across all units in this view"
                                    className="text-muted-foreground hover:text-[#0B3A67] dark:text-[#93C5FD] cursor-help"
                                >
                                    <Info className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Pending Setup */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Pending Setup</p>
                            <p className="text-2xl font-black text-[#17152E] dark:text-white leading-tight mt-0.5">
                                {kpiMetrics.pendingSetupCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Segmented Mode Switcher Bar + Action Buttons */}
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="inline-flex flex-wrap items-center rounded-2xl border border-border/80 bg-card p-1 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('tree')}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'tree'
                                    ? 'bg-[#0B3A67] text-white shadow-sm'
                                    : 'text-[#17152E] dark:text-slate-200 hover:bg-muted/60'
                            }`}
                        >
                            <Network className="w-4 h-4" />
                            Organization Structure
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('entities');
                                setCampusTypeFilter('All Campus Types');
                            }}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'entities'
                                    ? 'bg-[#0B3A67] text-white shadow-sm'
                                    : 'text-[#17152E] dark:text-slate-200 hover:bg-muted/60'
                            }`}
                        >
                            <MapPin className="w-4 h-4" />
                            Entities & Campuses ({entities.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('colleges');
                                setCampusTypeFilter('All Campus Types');
                            }}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'colleges'
                                    ? 'bg-[#0B3A67] text-white shadow-sm'
                                    : 'text-[#17152E] dark:text-slate-200 hover:bg-muted/60'
                            }`}
                        >
                            <School className="w-4 h-4" />
                            Colleges ({colleges.length})
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            onClick={() => openCreateModal('Entity')}
                            variant="outline"
                            className="h-10 px-4 font-bold text-xs rounded-xl border-[#0B3A67]/20 bg-card text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] hover:bg-[#F1F5F9]/60 dark:hover:bg-[#262246] cursor-pointer shadow-2xs"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Create Entity / Campus
                        </Button>
                        <Button
                            onClick={() => openCreateModal('College')}
                            className="h-10 px-4 bg-[#0B3A67] text-white hover:bg-[#082847] font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Create College
                        </Button>
                    </div>
                </div>

                {/*Interactive Organization Structure Tree + Inspector Panel */}
                {viewMode === 'tree' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left 7 Cols: Hierarchical Tree */}
                        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <Network className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                                    <h3 className="text-sm font-extrabold">
                                        Davao Del Sur State College (DSSC) — Hierarchy Tree
                                    </h3>
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    Click any Entity or College to inspect
                                </span>
                            </div>

                            {/* Root Institution Node */}
                            <div className="space-y-4">
                                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0B3A67] via-[#1F5D9B] to-[#68152E] text-white border border-[#8B1E3F]/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-[#0B3A67] text-white font-black text-xs">
                                            DSSC
                                        </div>
                                        <div>
                                            <p className="text-xs font-extrabold">
                                                Davao Del Sur State College (Root Institution)
                                            </p>
                                            <p className="text-[11px] text-slate-300">
                                                {entities.length} Entities/Campuses · {colleges.length} Colleges
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/institution/profile"
                                        className="text-[11px] font-bold text-[#93C5FD] hover:underline"
                                    >
                                        Institution Profile →
                                    </Link>
                                </div>

                                {/* Entities & Child Colleges */}
                                <div className="space-y-4 pl-4 border-l-2 border-[#0B3A67]/20">
                                    {entities.map((entity) => {
                                        const childColleges = colleges.filter((c) => c.parent_id === entity.id);
                                        const isEntitySelected = activeUnit?.id === entity.id;
                                        return (
                                            <div key={entity.id} className="space-y-2.5">
                                                {/* Entity Row */}
                                                <div
                                                    onClick={() => setSelectedUnit(entity)}
                                                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                        isEntitySelected
                                                            ? 'border-[#0B3A67] bg-[#0B3A67]/10 shadow-xs'
                                                            : 'border-border bg-muted/20 hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-[#0B3A67]/15 text-[#0B3A67] dark:text-[#93C5FD] border border-[#0B3A67]/20">
                                                            <Building2 className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold text-xs">
                                                                    {entity.name}
                                                                </span>
                                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border">
                                                                    {entity.entity_type || 'Campus Entity'}
                                                                </span>
                                                                <span
                                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                                                                        entity.status
                                                                    )}`}
                                                                >
                                                                    {entity.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                                Code: <strong className="font-mono">{entity.code}</strong> · {childColleges.length} College(s) · {entity.address || 'Davao del Sur'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                                </div>

                                                {/* Child Colleges under this Entity */}
                                                {childColleges.length > 0 && (
                                                    <div className="pl-6 space-y-2 border-l-2 border-border/80 ml-4">
                                                        {childColleges.map((col) => {
                                                            const isColSelected = activeUnit?.id === col.id;
                                                            return (
                                                                <div
                                                                    key={col.id}
                                                                    onClick={() => setSelectedUnit(col)}
                                                                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 ${
                                                                        isColSelected
                                                                            ? 'border-[#0B3A67] bg-[#0B3A67]/10 shadow-xs'
                                                                            : 'border-border/70 bg-card hover:bg-muted/30'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <School className="w-4 h-4 text-blue-500 shrink-0" />
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-extrabold text-xs">
                                                                                        {col.code} — {col.name}
                                                                                    </span>
                                                                                    <span
                                                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                                                                                            col.status
                                                                                        )}`}
                                                                                    >
                                                                                        {col.status}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[11px] text-muted-foreground">
                                                                                    Dean: {col.dean_name || 'Unassigned'} · Onboarding: {col.setup_progress}% ({col.setup_stage})
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                                            {col.programs?.length || 0} Programs
                                                                        </span>
                                                                    </div>

                                                                    {/* Programs Pills inside College */}
                                                                    {col.programs && col.programs.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1.5 pl-6 pt-1">
                                                                            {col.programs.map((prog) => (
                                                                                <span
                                                                                    key={prog.id}
                                                                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted/60 border border-border text-foreground"
                                                                                >
                                                                                    <GraduationCap className="w-3 h-3 inline mr-1 text-[#0B3A67] dark:text-[#93C5FD]" />
                                                                                    {prog.code}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Unassigned / Root-Attached Colleges */}
                                    {colleges.filter((c) => !c.parent_id).length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <span className="text-[10px] font-bold uppercase text-[#0B3A67] dark:text-[#93C5FD]">
                                                Colleges Pending Parent Entity Assignment
                                            </span>
                                            {colleges
                                                .filter((c) => !c.parent_id)
                                                .map((col) => (
                                                    <div
                                                        key={col.id}
                                                        onClick={() => setSelectedUnit(col)}
                                                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                                                            activeUnit?.id === col.id
                                                                ? 'border-[#0B3A67] bg-[#0B3A67]/10'
                                                                : 'border-border bg-card'
                                                        }`}
                                                    >
                                                        <div>
                                                            <span className="font-bold text-xs">
                                                                {col.code} — {col.name}
                                                            </span>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Click to assign Parent Campus Entity
                                                            </p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openReorgModal(col);
                                                            }}
                                                            className="text-[11px] h-7"
                                                        >
                                                            Move / Assign Entity
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right 5 Cols: Selected Unit Inspector Drawer */}
                        <div className="lg:col-span-5 space-y-5">
                            {activeUnit ? (
                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5 sticky top-20">
                                    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-md bg-[#0B3A67]/15 text-[#0B3A67] dark:text-[#93C5FD] font-mono font-extrabold text-xs border border-[#0B3A67]/20">
                                                    {activeUnit.code}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-semibold">
                                                    {activeUnit.type === 'Entity'
                                                        ? activeUnit.entity_type || 'Campus Entity'
                                                        : activeUnit.type}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                                                        activeUnit.status
                                                    )}`}
                                                >
                                                    {activeUnit.status}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-extrabold mt-1.5">{activeUnit.name}</h3>
                                            {activeUnit.parent && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Parent Entity: <strong className="text-foreground">{activeUnit.parent.name} ({activeUnit.parent.code})</strong>
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openReorgModal(activeUnit)}
                                            className="text-xs font-bold shrink-0"
                                        >
                                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                                            Reorganize / Status
                                        </Button>
                                    </div>

                                    {/* Metadata Details */}
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                                {activeUnit.type === 'Entity' ? 'Campus Head / Director' : 'College Dean'}
                                            </span>
                                            <span className="font-bold text-foreground mt-0.5 block">
                                                {activeUnit.dean_name || 'Unassigned'}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                                Effective Dates
                                            </span>
                                            <span className="font-mono text-[11px] font-semibold text-foreground mt-0.5 block">
                                                {activeUnit.effective_from || '2020-08-01'} → {activeUnit.effective_until || 'Present'}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                                TV Signage & Local Config
                                            </span>
                                            <span className="font-semibold text-foreground mt-0.5 block">
                                                TV: {activeUnit.entity_tv_enabled !== false ? 'Enabled' : 'Disabled'} · Overrides: {activeUnit.allow_local_overrides !== false ? 'Allowed' : 'Locked'}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                                                Onboarding Readiness
                                            </span>
                                            <span className="font-mono font-bold text-[#0B3A67] dark:text-[#93C5FD] mt-0.5 block">
                                                {activeUnit.setup_progress}% ({activeUnit.setup_stage})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Assigned Administrators */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold">
                                                Scoped Administrators ({activeUnitAdmins.length})
                                            </span>
                                            <Link
                                                href="/institution/scoped-roles"
                                                className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline"
                                            >
                                                + Assign Admin
                                            </Link>
                                        </div>
                                        {activeUnitAdmins.length === 0 ? (
                                            <div className="p-3 rounded-xl border border-dashed border-rose-500/40 bg-rose-500/5 text-[11px] text-rose-500 font-medium">
                                                No active Entity Admin or College Admin bound to {activeUnit.code}.
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {activeUnitAdmins.map((sr) => (
                                                    <div
                                                        key={sr.id}
                                                        className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between text-xs"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-foreground block">
                                                                {sr.user?.name}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                {sr.user?.email}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="px-2 py-0.5 rounded bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD] font-bold text-[10px] border border-[#0B3A67]/20">
                                                                {sr.role?.name}
                                                            </span>
                                                            {sr.designation_type && (
                                                                <span className="block text-[10px] text-muted-foreground mt-0.5">
                                                                    {sr.designation_type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Enabled Modules Snapshot */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold">Enabled Ascend Modules</span>
                                            <Link
                                                href={`/institution/colleges/setup?college=${activeUnit.id}`}
                                                className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline"
                                            >
                                                Configure Modules →
                                            </Link>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(activeUnit.enabled_modules || {}).map(([modKey, enabled]) =>
                                                enabled ? (
                                                    <span
                                                        key={modKey}
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize"
                                                    >
                                                        {modKey.replace(/_/g, ' ')}
                                                    </span>
                                                ) : null
                                            )}
                                        </div>
                                    </div>

                                    {/* Programs Overview (Delegated to College Admin) */}
                                    {activeUnit.type !== 'Entity' && (
                                        <div className="space-y-2 pt-2 border-t border-border/60">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold">
                                                    Programs Overview ({activeUnit.programs?.length || 0})
                                                </span>
                                                <span className="text-[10px] text-muted-foreground italic">
                                                    Operated by College Admin
                                                </span>
                                            </div>
                                            {activeUnit.programs && activeUnit.programs.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-1.5">
                                                    {activeUnit.programs.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between text-xs"
                                                        >
                                                            <span className="font-bold">
                                                                {p.code} — {p.name}
                                                            </span>
                                                            <span className="text-[10px] text-emerald-500 font-bold">
                                                                {p.status || 'Active'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-muted-foreground">
                                                    No degree programs registered under {activeUnit.code} yet.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                                        <Link
                                            href={`/institution/colleges/setup?college=${activeUnit.id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline"
                                        >
                                            <Sliders className="w-3.5 h-3.5" />
                                            Open 11-Stage Guided Setup
                                        </Link>
                                        <Link
                                            href="/institution/audit"
                                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <History className="w-3.5 h-3.5" />
                                            Unit Change History
                                        </Link>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    /* Entities & Campuses OR Colleges Directory View (Matching Attached Reference Pic) */
                    <div className="relative z-10 space-y-5">
                        {/* Filter, Search & Layout Control Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={
                                        viewMode === 'entities'
                                            ? 'Search entities or campuses...'
                                            : 'Search colleges, codes, or deans...'
                                    }
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/80 bg-card text-xs font-medium text-[#17152E] dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0B3A67]/30 focus:border-[#0B3A67] shadow-2xs"
                                />
                            </div>

                            {/* Status Floating-Label Select */}
                            <div className="relative min-w-[165px]">
                                <span className="absolute -top-2 left-3 px-1 bg-background text-[10px] font-semibold text-muted-foreground z-10">
                                    Status
                                </span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border/80 bg-card text-xs font-bold text-[#17152E] dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B3A67]/30 focus:border-[#0B3A67] shadow-2xs cursor-pointer"
                                >
                                    <option value="All Statuses">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Ready">Ready</option>
                                    <option value="In Setup">In Setup</option>
                                    <option value="Not Configured">Not Configured</option>
                                    <option value="Suspended">Suspended</option>
                                    <option value="Archived">Archived</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* Campus Type / Parent Entity Floating-Label Select */}
                            <div className="relative min-w-[185px]">
                                <span className="absolute -top-2 left-3 px-1 bg-background text-[10px] font-semibold text-muted-foreground z-10">
                                    {viewMode === 'entities' ? 'Campus Type' : 'Parent Campus'}
                                </span>
                                <select
                                    value={campusTypeFilter}
                                    onChange={(e) => setCampusTypeFilter(e.target.value)}
                                    className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border/80 bg-card text-xs font-bold text-[#17152E] dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B3A67]/30 focus:border-[#0B3A67] shadow-2xs cursor-pointer"
                                >
                                    <option value="All Campus Types">
                                        {viewMode === 'entities' ? 'All Campus Types' : 'All Parent Campuses'}
                                    </option>
                                    {viewMode === 'entities' ? (
                                        <>
                                            <option value="Main Campus">Main Campus</option>
                                            <option value="Satellite Campus">Satellite Campus</option>
                                            <option value="Extension Campus">Extension Campus</option>
                                            <option value="Custom">Custom Entity</option>
                                        </>
                                    ) : (
                                        entities.map((ent) => (
                                            <option key={ent.id} value={ent.name}>
                                                {ent.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* Sort By Floating-Label Select */}
                            <div className="relative min-w-[195px]">
                                <span className="absolute -top-2 left-3 px-1 bg-background text-[10px] font-semibold text-muted-foreground z-10">
                                    Sort By
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border/80 bg-card text-xs font-bold text-[#17152E] dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B3A67]/30 focus:border-[#0B3A67] shadow-2xs cursor-pointer"
                                >
                                    <option value="name-asc">
                                        {viewMode === 'entities' ? 'Campus Name (A - Z)' : 'College Name (A - Z)'}
                                    </option>
                                    <option value="name-desc">
                                        {viewMode === 'entities' ? 'Campus Name (Z - A)' : 'College Name (Z - A)'}
                                    </option>
                                    <option value="readiness-desc">Readiness (High - Low)</option>
                                    <option value="status">Operating Status</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* Grid / List View Switcher */}
                            <div className="inline-flex items-center rounded-xl border border-border/80 bg-card p-1 h-11 shrink-0 shadow-2xs self-start lg:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setDisplayLayout('grid')}
                                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                        displayLayout === 'grid'
                                            ? 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD] shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDisplayLayout('list')}
                                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                        displayLayout === 'list'
                                            ? 'bg-[#F1F5F9] text-[#0B3A67] dark:text-[#93C5FD] dark:bg-slate-800 dark:text-[#93C5FD] shadow-2xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="List View"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Cards Grid or List */}
                        {filteredUnits.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center space-y-2">
                                <Building2 className="w-8 h-8 text-[#0B3A67] dark:text-[#93C5FD] mx-auto opacity-70" />
                                <p className="text-sm font-bold text-[#17152E] dark:text-white">
                                    No matching {viewMode === 'entities' ? 'entities or campuses' : 'colleges'} found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try clearing your search or adjusting the status and campus type filters.
                                </p>
                            </div>
                        ) : (
                            <div
                                className={
                                    displayLayout === 'grid'
                                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                                        : 'flex flex-col gap-3.5'
                                }
                            >
                                {filteredUnits.map((unit) => {
                                    const progress = Math.max(0, Math.min(100, Number(unit.setup_progress) || 0));
                                    const stageLabel = unit.setup_stage || (unit.status === 'Active' ? 'Active' : 'Setup');
                                    const unitSubtitle =
                                        unit.type === 'Entity'
                                            ? unit.entity_type || 'Main Campus'
                                            : unit.parent?.name || unit.code;

                                    return (
                                        <div
                                            key={unit.id}
                                            className="relative overflow-hidden rounded-2xl border border-[#8B1E3F]/30 bg-card p-5 pt-6 shadow-xs hover:shadow-md hover:border-[#0B3A67]/20 transition-all flex flex-col justify-between"
                                        >
                                            {/* Top Deep Indigo / Violet Accent Bar */}
                                            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#5B21B6] via-[#7C3AED] to-[#A78BFA]" />

                                            <div className="space-y-4">
                                                {/* Card Header: Lavender Icon + Title/Type + Status Pill */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3.5 min-w-0">
                                                        <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] flex items-center justify-center shrink-0 border border-[#8B1E3F]/30 overflow-hidden p-1.5">
                                                            {unit.logo_url ? (
                                                                <img
                                                                    src={unit.logo_url}
                                                                    alt={unit.code}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            ) : unit.type === 'Entity' ? (
                                                                <Building2 className="w-6 h-6" />
                                                            ) : (
                                                                <School className="w-6 h-6" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-extrabold text-[15px] text-[#17152E] dark:text-white leading-snug">
                                                                {unit.name}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                                <Layers className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                                                                <span className="truncate font-medium">{unitSubtitle}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`text-[11px] px-3 py-1 rounded-full font-bold border shrink-0 ${getStatusBadge(
                                                            unit.status,
                                                        )}`}
                                                    >
                                                        {unit.status}
                                                    </span>
                                                </div>

                                                {/* Divider */}
                                                <div className="border-t border-border/60" />

                                                {/* Lead / Dean Block */}
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 text-muted-foreground shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-medium text-muted-foreground block">
                                                            Lead / Dean
                                                        </span>
                                                        <p className="text-xs sm:text-[13px] font-extrabold text-[#17152E] dark:text-white leading-snug mt-0.5">
                                                            {unit.dean_name || 'Unassigned Administrator'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Setup Readiness & Progress Bar */}
                                                <div className="space-y-2 pt-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                                                            <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                                                            Setup Readiness
                                                        </span>
                                                        <span className="font-extrabold text-[#17152E] dark:text-white">
                                                            {progress}% ({stageLabel})
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] transition-all duration-300"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Footer Actions: Configure | Move / Archive */}
                                            <div className="pt-4 mt-5 border-t border-border/60 grid grid-cols-2 items-center divide-x divide-border/70">
                                                <Link
                                                    href={`/institution/colleges/setup?college=${unit.id}`}
                                                    className="inline-flex items-center justify-start gap-2 text-xs font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] hover:text-[#0B3A67] transition-colors pr-3"
                                                >
                                                    <Settings className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                                                    Configure
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => openReorgModal(unit)}
                                                    className="inline-flex items-center justify-end gap-2 text-xs font-semibold text-[#17152E]/80 dark:text-slate-300 hover:text-[#0B3A67] dark:text-[#93C5FD] transition-colors pl-3 cursor-pointer"
                                                >
                                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                                    Move / Archive
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Create Entity / College Modal */}
                {createModalMode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                        <div className="w-full max-w-2xl rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 my-8">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div>
                                    <h3 className="text-lg font-extrabold">
                                        {createModalMode === 'Entity'
                                            ? 'Create Campus / Organizational Entity'
                                            : 'Create Academic College Under Entity'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {createModalMode === 'Entity'
                                            ? 'Configure Entity Name, Code, Campus Type, address, effective dates, TV availability, local override policy, and assign an Entity Admin.'
                                            : 'Select Parent Entity, enter College Name, Code, Dean, initial College Admin, and enabled Ascend modules.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCreateModalMode(null)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">
                                            {createModalMode === 'Entity' ? 'Entity Code *' : 'College Code *'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            placeholder={createModalMode === 'Entity' ? 'DSSC-MATANAO' : 'CAFS'}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs uppercase font-bold"
                                        />
                                        {errors.code && <p className="text-[11px] text-rose-500">{errors.code}</p>}
                                    </div>

                                    {createModalMode === 'Entity' ? (
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-xs font-bold">Entity Classification *</label>
                                            <select
                                                value={data.entity_type}
                                                onChange={(e) => setData('entity_type', e.target.value)}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                            >
                                                <option value="Main Campus">Main Campus</option>
                                                <option value="Satellite Campus">Satellite Campus</option>
                                                <option value="Extension Campus">Extension Campus</option>
                                                <option value="Custom">Custom Organizational Entity</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-xs font-bold">Parent Entity / Campus *</label>
                                            <select
                                                required
                                                value={data.parent_id}
                                                onChange={(e) => setData('parent_id', e.target.value)}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                            >
                                                <option value="">Select Parent Campus Entity...</option>
                                                {entities.map((ent) => (
                                                    <option key={ent.id} value={ent.id}>
                                                        {ent.code} — {ent.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Full Official Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder={
                                            createModalMode === 'Entity'
                                                ? 'e.g. DSSC Matanao Satellite Campus'
                                                : 'e.g. College of Agriculture and Forestry Sciences'
                                        }
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">
                                            {createModalMode === 'Entity' ? 'Campus Director / Head' : 'College Dean (if known)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={data.dean_name}
                                            onChange={(e) => setData('dean_name', e.target.value)}
                                            placeholder="e.g. Dr. Roberto Mendoza"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">
                                            Assign Primary {createModalMode === 'Entity' ? 'Entity Admin' : 'College Admin'}
                                        </label>
                                        <select
                                            value={data.admin_user_id}
                                            onChange={(e) => setData('admin_user_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        >
                                            <option value="">Assign later in Scoped Roles...</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Contact Email</label>
                                        <input
                                            type="email"
                                            value={data.contact_email}
                                            onChange={(e) => setData('contact_email', e.target.value)}
                                            placeholder="unit@dssc.edu.ph"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Effective From</label>
                                        <input
                                            type="date"
                                            value={data.effective_from}
                                            onChange={(e) => setData('effective_from', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Operating Status</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Ready">Ready</option>
                                            <option value="In Setup">In Setup</option>
                                            <option value="Not Configured">Not Configured</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Physical Address / Campus Location</label>
                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Brgy. Matti, Digos City, Davao del Sur"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.entity_tv_enabled}
                                            onChange={(e) => setData('entity_tv_enabled', e.target.checked)}
                                            className="rounded text-[#0B3A67] dark:text-[#93C5FD]"
                                        />
                                        <span className="font-semibold">Enable Campus / Unit TV Signage Workspace</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.allow_local_overrides}
                                            onChange={(e) => setData('allow_local_overrides', e.target.checked)}
                                            className="rounded text-[#0B3A67] dark:text-[#93C5FD]"
                                        />
                                        <span className="font-semibold">Allow Local Policy & Report Signatory Overrides</span>
                                    </label>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => setCreateModalMode(null)} className="text-xs">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#0B3A67] text-white hover:bg-[#082847] font-bold text-xs"
                                    >
                                        {processing ? 'Registering...' : `Create ${createModalMode}`}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reorganize / Move / Archive Modal */}
                {reorgUnit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold">
                                        Reorganize or Change Lifecycle: {reorgUnit.code}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Move between parent entities, suspend, or archive with mandatory audit reason.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReorgUnit(null)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleReorgSubmit} className="space-y-4">
                                {reorgUnit.type !== 'Entity' && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Parent Entity / Campus</label>
                                        <select
                                            value={reorgForm.data.parent_id}
                                            onChange={(e) => reorgForm.setData('parent_id', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="">Select Parent Entity...</option>
                                            {entities.map((ent) => (
                                                <option key={ent.id} value={ent.id}>
                                                    {ent.code} — {ent.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Lifecycle Status</label>
                                    <select
                                        value={reorgForm.data.status}
                                        onChange={(e) => reorgForm.setData('status', e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                    >
                                        <option value="Active">Active (Operational)</option>
                                        <option value="Ready">Ready</option>
                                        <option value="In Setup">In Setup</option>
                                        <option value="Suspended">Suspended (Freeze Operations)</option>
                                        <option value="Archived">Archived (Historical Read-Only)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Governance / Board Resolution Reason *</label>
                                    <textarea
                                        rows={2}
                                        required
                                        value={reorgForm.data.reason}
                                        onChange={(e) => reorgForm.setData('reason', e.target.value)}
                                        placeholder="e.g. Realigned under Sulop Satellite Campus per BOR Resolution No. 2026-44"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setReorgUnit(null)} className="text-xs">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={reorgForm.processing}
                                        className="bg-[#0B3A67] text-white hover:bg-[#082847] font-bold text-xs"
                                    >
                                        Confirm Structural Change
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
