import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    FileStack,
    Lock,
    Plus,
    ShieldCheck,
    Sliders,
    Unlock,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PolicyTemplate {
    id: number;
    code: string;
    title: string;
    category: string;
    version: string;
    status: string;
    effective_from?: string | null;
    effective_until?: string | null;
    inheritance_mode: string;
    allow_entity_override: boolean;
    allow_college_override: boolean;
    parameters?: Record<string, any> | null;
    description?: string | null;
}

interface Props {
    policies: PolicyTemplate[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Policy & Standards Management', href: '/institution/policies' },
];

export default function PolicyTemplatesIndex({ policies = [] }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        code: `POL-STD-00${policies.length + 1}`,
        title: '',
        category: 'Workload',
        version: 'v1.0',
        status: 'Active',
        effective_from: '2026-08-01',
        effective_until: '',
        inheritance_mode: 'Allow College Override',
        allow_entity_override: true,
        allow_college_override: true,
        description: '',
        parameters: {
            default_threshold: 90,
            require_verification: true,
        } as Record<string, any>,
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/institution/policies', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Policy & Standards Management · Platform Configuration" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                                Precedence: Institution Default → Entity Override (if allowed) → College Override (if allowed)
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Policy & Standards Management
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Define versioned institution-level policy templates for Faculty Workload, Three-Way Attendance Reconciliation, Official Business/Travel Orders/Locator Slips, Make-Up Classes, Facility Monitoring, Inventory, Research Evidence, Compliance, and Retention.
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-[#5B21B6] text-white hover:bg-[#4C1D95] font-bold text-xs rounded-xl shrink-0"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create Policy Template
                    </Button>
                </div>

                {/* Policy Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {policies.map((pol) => {
                        const isLocked = pol.inheritance_mode === 'Mandatory Locked';
                        return (
                            <div
                                key={pol.id}
                                className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                                                    {pol.code}
                                                </span>
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                                                    {pol.category}
                                                </span>
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    {pol.version}
                                                </span>
                                            </div>
                                            <h3 className="font-extrabold text-sm text-foreground mt-1.5">
                                                {pol.title}
                                            </h3>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${
                                                isLocked
                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            }`}
                                        >
                                            {isLocked ? (
                                                <Lock className="w-3 h-3" />
                                            ) : (
                                                <Unlock className="w-3 h-3" />
                                            )}
                                            {pol.inheritance_mode}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {pol.description}
                                    </p>

                                    {/* Parameters Key-Value Snapshot */}
                                    {pol.parameters && Object.keys(pol.parameters).length > 0 && (
                                        <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                                                Institutional Rule Parameters
                                            </span>
                                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                                {Object.entries(pol.parameters).map(([k, v]) => (
                                                    <div key={k} className="flex items-center justify-between bg-background px-2.5 py-1 rounded border border-border/50">
                                                        <span className="text-muted-foreground capitalize">
                                                            {k.replace(/_/g, ' ')}:
                                                        </span>
                                                        <span className="font-mono font-bold text-foreground">
                                                            {String(v)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>
                                        Effective: <strong className="font-mono text-foreground">{pol.effective_from ? String(pol.effective_from).slice(0, 10) : '2026-08-01'}</strong>
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span>Entity Override: <strong>{pol.allow_entity_override ? 'Yes' : 'Locked'}</strong></span>
                                        <span>College Override: <strong>{pol.allow_college_override ? 'Yes' : 'Locked'}</strong></span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Create Policy Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold">Create Institutional Policy Template</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Define versioned standards and override inheritance rules.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-3.5">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Policy Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Category *</label>
                                        <select
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="Workload">Workload Rules</option>
                                            <option value="Attendance">Attendance Computation</option>
                                            <option value="Official Business">Travel Order / Locator Slip</option>
                                            <option value="Make-Up Classes">Make-Up Classes</option>
                                            <option value="Facility Monitoring">Facility Monitoring</option>
                                            <option value="Inventory">Inventory Adjustments</option>
                                            <option value="Research & Extension">Research & Extension</option>
                                            <option value="Compliance">Compliance Rules</option>
                                            <option value="Retention">Report Retention</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Version *</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.version}
                                            onChange={(e) => setData('version', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Policy Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. Institutional Overload & Deloading Thresholds"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Inheritance & Override Precedence *</label>
                                    <select
                                        value={data.inheritance_mode}
                                        onChange={(e) => {
                                            const mode = e.target.value;
                                            setData((prev) => ({
                                                ...prev,
                                                inheritance_mode: mode,
                                                allow_entity_override: mode !== 'Mandatory Locked',
                                                allow_college_override: mode === 'Allow College Override',
                                            }));
                                        }}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                    >
                                        <option value="Allow College Override">
                                            Institution Default → Entity Override → College Override Allowed
                                        </option>
                                        <option value="Allow Entity Override">
                                            Institution Default → Entity Override Allowed (Locked for Colleges)
                                        </option>
                                        <option value="Mandatory Locked">
                                            Mandatory Locked (Uniform Across All Entities & Colleges)
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Policy Description & Governance Rationale</label>
                                    <textarea
                                        rows={2}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#5B21B6] text-white hover:bg-[#4C1D95] font-bold text-xs"
                                    >
                                        Publish Policy Template
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

