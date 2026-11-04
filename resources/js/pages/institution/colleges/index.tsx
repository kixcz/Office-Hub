import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Archive,
    ArrowRightLeft,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock,
    GraduationCap,
    History,
    Layers,
    MapPin,
    Network,
    Phone,
    Plus,
    School,
    ShieldCheck,
    Sliders,
    Tv,
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
    color_theme: string | null;
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

    React.useEffect(() => {
        if (initialView === 'entities' || initialView === 'colleges' || initialView === 'tree') {
            setViewMode(initialView);
        }
    }, [initialView]);

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
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
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

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Institution Super Admin Exclusive Authority
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                                Institution → Campus Entity → College → Program
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Organization Management & Structure Tree
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Only the Institution Super Admin may create, archive, deactivate, move, or structurally reorganize Entities and Colleges. Programs are operationally managed by College Admins within their scope.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('tree')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'tree'
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Organization Structure
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('entities')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'entities'
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Entities & Campuses ({entities.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('colleges')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'colleges'
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Colleges ({colleges.length})
                            </button>
                        </div>

                        <Button
                            onClick={() => openCreateModal('Entity')}
                            variant="outline"
                            className="font-bold text-xs rounded-xl border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Create Entity / Campus
                        </Button>
                        <Button
                            onClick={() => openCreateModal('College')}
                            className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl shadow-xs"
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
                                    <Network className="w-4 h-4 text-amber-500" />
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
                                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-amber-950 text-white border border-amber-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
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
                                        className="text-[11px] font-bold text-amber-300 hover:underline"
                                    >
                                        Institution Profile →
                                    </Link>
                                </div>

                                {/* Entities & Child Colleges */}
                                <div className="space-y-4 pl-4 border-l-2 border-amber-500/30">
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
                                                            ? 'border-amber-500 bg-amber-500/10 shadow-xs'
                                                            : 'border-border bg-muted/20 hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
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
                                                                            ? 'border-amber-500 bg-amber-500/10 shadow-xs'
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
                                                                                    <GraduationCap className="w-3 h-3 inline mr-1 text-amber-500" />
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
                                            <span className="text-[10px] font-bold uppercase text-amber-500">
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
                                                                ? 'border-amber-500 bg-amber-500/10'
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
                                                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 font-mono font-extrabold text-xs border border-amber-500/30">
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
                                            <span className="font-mono font-bold text-amber-500 mt-0.5 block">
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
                                                className="text-[11px] font-bold text-amber-500 hover:underline"
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
                                                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold text-[10px] border border-amber-500/20">
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
                                            <span className="text-xs font-bold">Enabled Velora Modules</span>
                                            <Link
                                                href={`/institution/colleges/setup?college=${activeUnit.id}`}
                                                className="text-[11px] font-bold text-amber-500 hover:underline"
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
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:underline"
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
                    /* Entities & Campuses OR Colleges Directory View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(viewMode === 'entities' ? entities : colleges).map((unit) => (
                            <div
                                key={unit.id}
                                className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 font-extrabold flex items-center justify-center text-xs border border-amber-500/20">
                                                {unit.acronym || unit.code}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-foreground">{unit.name}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {unit.type === 'Entity' ? unit.entity_type || 'Entity' : unit.type}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${getStatusBadge(
                                                unit.status
                                            )}`}
                                        >
                                            {unit.status}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                                        <div className="flex items-center justify-between">
                                            <span>Lead / Dean:</span>
                                            <span className="font-semibold text-foreground">
                                                {unit.dean_name || 'Unassigned'}
                                            </span>
                                        </div>
                                        {unit.parent && (
                                            <div className="flex items-center justify-between">
                                                <span>Parent Entity:</span>
                                                <span className="font-semibold text-amber-500">
                                                    {unit.parent.name}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span>Setup Readiness:</span>
                                            <span className="font-mono font-bold text-foreground">
                                                {unit.setup_progress}% ({unit.setup_stage})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between">
                                    <Link
                                        href={`/institution/colleges/setup?college=${unit.id}`}
                                        className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
                                    >
                                        <Sliders className="w-3.5 h-3.5" />
                                        Configure
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => openReorgModal(unit)}
                                        className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    >
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                        Move / Archive
                                    </button>
                                </div>
                            </div>
                        ))}
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
                                            : 'Select Parent Entity, enter College Name, Code, Dean, initial College Admin, and enabled Velora modules.'}
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
                                            className="rounded text-amber-500"
                                        />
                                        <span className="font-semibold">Enable Campus / Unit TV Signage Workspace</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.allow_local_overrides}
                                            onChange={(e) => setData('allow_local_overrides', e.target.checked)}
                                            className="rounded text-amber-500"
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
                                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs"
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
                                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs"
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
