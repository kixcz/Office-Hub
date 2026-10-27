import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Building2,
    CheckCircle2,
    GraduationCap,
    Layers,
    Mail,
    Plus,
    School,
    Sliders,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface College {
    id: number;
    code: string;
    name: string;
    acronym: string | null;
    type: string;
    dean_name: string | null;
    contact_email: string | null;
    color_theme: string | null;
    status: 'Not Configured' | 'In Setup' | 'Ready' | 'Active' | 'Suspended' | 'Archived';
    setup_stage: string;
    setup_progress: number;
    parent?: {
        id: number;
        code: string;
        name: string;
    } | null;
    scoped_roles?: Array<{
        id: number;
        user: { name: string; email: string };
        role: { name: string };
    }>;
}

interface Props {
    colleges: College[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Colleges & Organizational Units', href: '/institution/colleges' },
];

export default function CollegesIndex({ colleges }: Props) {
    const [isAddOpen, setIsAddOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        acronym: '',
        type: 'College',
        dean_name: '',
        contact_email: '',
        color_theme: 'amber',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/institution/colleges', {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            },
        });
    };

    const getStatusBadge = (status: College['status']) => {
        switch (status) {
            case 'Active':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Ready':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'In Setup':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'Not Configured':
            default:
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Colleges & Organizational Units · Platform Governance" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Colleges & Organizational Units</h1>
                        <p className="text-sm text-muted-foreground">
                            Define institutional hierarchy, colleges, satellite campuses, institutes, deans, and enabled capabilities.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/institution/colleges/setup"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 transition-colors border border-border"
                        >
                            <Sliders className="w-4 h-4" />
                            Guided Onboarding
                        </Link>
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl shadow-xs"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add College / Unit
                        </Button>
                    </div>
                </div>

                {/* Units Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {colleges.map((college) => (
                        <div
                            key={college.id}
                            className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center text-sm border border-amber-500/20">
                                            {college.code}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm text-foreground">{college.name}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{college.type}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${getStatusBadge(
                                            college.status
                                        )}`}
                                    >
                                        {college.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                                    <div className="flex items-center justify-between">
                                        <span>Dean / Academic Lead:</span>
                                        <span className="font-semibold text-foreground">
                                            {college.dean_name || 'Unassigned'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Contact Email:</span>
                                        <span className="font-mono text-[11px] text-foreground">
                                            {college.contact_email || '—'}
                                        </span>
                                    </div>
                                    {college.parent && (
                                        <div className="flex items-center justify-between">
                                            <span>Parent Campus:</span>
                                            <span className="font-medium text-foreground">{college.parent.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Setup Progress Bar */}
                                <div className="space-y-1.5 pt-2 border-t border-border/50">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground">Setup Stage: <strong className="text-foreground">{college.setup_stage}</strong></span>
                                        <span className="font-mono font-bold">{college.setup_progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full transition-all"
                                            style={{ width: `${college.setup_progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between">
                                <Link
                                    href={`/institution/colleges/setup?college=${college.id}`}
                                    className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                    Configure Unit
                                </Link>
                                <Link
                                    href="/institution/scoped-roles"
                                    className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    Admins
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Unit Modal */}
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Add College or Organizational Unit</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Register a college, campus, school, or institute into the institutional directory.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsAddOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Unit Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            placeholder="e.g. CIDS"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs uppercase font-bold focus:ring-1 focus:ring-amber-500"
                                        />
                                        {errors.code && <p className="text-[11px] text-rose-500">{errors.code}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Unit Type *</label>
                                        <select
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="College">College</option>
                                            <option value="Campus">Campus</option>
                                            <option value="School">School</option>
                                            <option value="Institute">Institute</option>
                                            <option value="Department">Department</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Full Unit Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. College of Information and Computing Studies"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                    />
                                    {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Dean / Unit Head</label>
                                        <input
                                            type="text"
                                            value={data.dean_name}
                                            onChange={(e) => setData('dean_name', e.target.value)}
                                            placeholder="e.g. Dr. Jane Doe"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">Official Contact Email</label>
                                        <input
                                            type="email"
                                            value={data.contact_email}
                                            onChange={(e) => setData('contact_email', e.target.value)}
                                            placeholder="dean.cids@dssc.edu.ph"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddOpen(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs"
                                    >
                                        {processing ? 'Creating...' : 'Create Unit'}
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
