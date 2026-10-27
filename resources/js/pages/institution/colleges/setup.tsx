import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Award,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    FileCheck,
    Layers,
    Monitor,
    Radio,
    Save,
    School,
    Shield,
    Sliders,
    Sparkles,
    Tv,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface College {
    id: number;
    code: string;
    name: string;
    type: string;
    status: 'Not Configured' | 'In Setup' | 'Ready' | 'Active' | 'Suspended' | 'Archived';
    setup_stage: string;
    setup_progress: number;
    enabled_modules: Record<string, boolean>;
    dean_name?: string;
    contact_email?: string;
}

interface Props {
    colleges: College[];
    currentCollege: College;
}

const STAGES = [
    { id: 'Identity', label: '1. Identity', desc: 'Name, code, dean, contacts' },
    { id: 'Branding', label: '2. Branding', desc: 'Theme, college logos, badges' },
    { id: 'Modules', label: '3. Modules', desc: 'Enable/disable platform tools' },
    { id: 'Admins', label: '4. Admins', desc: 'College Admin designations' },
    { id: 'Programs', label: '5. Programs', desc: 'Academic departments & degrees' },
    { id: 'Facilities', label: '6. Facilities', desc: 'Classrooms, labs, studios' },
    { id: 'Policies', label: '7. Policies', desc: 'Inherited institutional rules' },
    { id: 'Workflows', label: '8. Workflows', desc: 'Approval routing matrices' },
    { id: 'Reports', label: '9. Reports', desc: 'Signatories & document headers' },
    { id: 'TV', label: '10. TV Studio', desc: 'Digital signage displays' },
    { id: 'Activation', label: '11. Activation', desc: 'Operational status launch' },
];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Colleges & Organizational Units', href: '/institution/colleges' },
    { title: 'College Setup & Configuration', href: '/institution/colleges/setup' },
];

export default function CollegeSetup({ colleges, currentCollege }: Props) {
    const [activeStage, setActiveStage] = useState(currentCollege.setup_stage || 'Identity');

    const { data, setData, put, processing } = useForm({
        setup_stage: currentCollege.setup_stage || 'Identity',
        setup_progress: currentCollege.setup_progress || 20,
        status: currentCollege.status || 'In Setup',
        enabled_modules: currentCollege.enabled_modules || {
            scheduling: true,
            compliance: true,
            attendance: true,
            facilities: true,
            tv_studio: false,
        },
    });

    const handleStageClick = (stageId: string, progressScore: number) => {
        setActiveStage(stageId);
        setData((prev) => ({
            ...prev,
            setup_stage: stageId,
            setup_progress: Math.max(prev.setup_progress, progressScore),
        }));
    };

    const handleSaveSetup = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/institution/colleges/${currentCollege.id}/setup`, {
            preserveScroll: true,
        });
    };

    const toggleModule = (moduleKey: string) => {
        setData('enabled_modules', {
            ...data.enabled_modules,
            [moduleKey]: !data.enabled_modules[moduleKey],
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Setup · ${currentCollege.code} · Platform Governance`} />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header & College Picker */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                                Guided Onboarding Workspace
                            </span>
                            <span className="text-xs text-muted-foreground">College Setup & Configuration</span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight mt-1">
                            {currentCollege.name} ({currentCollege.code})
                        </h1>
                    </div>

                    {/* Switch target college */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-muted-foreground">Select Unit:</label>
                        <select
                            value={currentCollege.id}
                            onChange={(e) => router.get(`/institution/colleges/setup?college=${e.target.value}`)}
                            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-amber-500"
                        >
                            {colleges.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.code} — {c.name} ({c.setup_progress}%)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Progress bar overview */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">Setup Completion Status</span>
                        <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">Status: <strong className="text-foreground">{data.status}</strong></span>
                            <span className="font-mono font-extrabold text-amber-500 text-sm">{data.setup_progress}%</span>
                        </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${data.setup_progress}%` }}
                        />
                    </div>
                </div>

                {/* 11-Stage Setup Wizard Container */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Stage Navigator (Left column) */}
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-1.5">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                            Onboarding Steps
                        </h3>
                        {STAGES.map((stage, idx) => {
                            const isCurrent = activeStage === stage.id;
                            const progressScore = Math.round(((idx + 1) / STAGES.length) * 100);
                            return (
                                <button
                                    key={stage.id}
                                    type="button"
                                    onClick={() => handleStageClick(stage.id, progressScore)}
                                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                                        isCurrent
                                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                            : 'hover:bg-muted text-foreground'
                                    }`}
                                >
                                    <div>
                                        <p className="text-xs font-bold leading-tight">{stage.label}</p>
                                        <p className={`text-[10px] ${isCurrent ? 'text-slate-800' : 'text-muted-foreground'}`}>
                                            {stage.desc}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-3.5 h-3.5 ${isCurrent ? 'text-slate-950' : 'text-muted-foreground'}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Stage Detail & Configuration Form (Right 3 cols) */}
                    <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
                        <form onSubmit={handleSaveSetup} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold">Stage: {activeStage} Configuration</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Configure parameters, operational modules, and governance requirements for {currentCollege.code}.
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl"
                                >
                                    <Save className="w-3.5 h-3.5 mr-1.5" />
                                    {processing ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </div>

                            {/* Stage: Identity */}
                            {activeStage === 'Identity' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold">College Code</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={currentCollege.code}
                                                className="w-full mt-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-mono font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold">Unit Type</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={currentCollege.type}
                                                className="w-full mt-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold">Full Name</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={currentCollege.name}
                                            className="w-full mt-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold">Dean / Unit Head</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={currentCollege.dean_name || 'Dr. Jane Doe'}
                                                className="w-full mt-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold">Dean Email Address</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={currentCollege.contact_email || 'dean@dssc.edu.ph'}
                                                className="w-full mt-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stage: Modules */}
                            {activeStage === 'Modules' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        Select which COMPASS capability modules are accessible to this college.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { key: 'scheduling', label: 'Semester Timetable & Generator', desc: 'Timetables, rooms, and AI loading' },
                                            { key: 'compliance', label: 'Compliance & Submissions', desc: 'Faculty syllabus and report submissions' },
                                            { key: 'attendance', label: 'Faculty Attendance Oversight', desc: 'Class check-ins & make-up classes' },
                                            { key: 'facilities', label: 'Lab & Facility Monitoring', desc: 'Laboratory in-charge schedules' },
                                            { key: 'tv_studio', label: 'Campus TV Studio Feed', desc: 'Digital signage highlights' },
                                            { key: 'performance', label: 'Faculty Recognition & Portfolios', desc: 'Accomplishment records' },
                                        ].map((mod) => (
                                            <div
                                                key={mod.key}
                                                onClick={() => toggleModule(mod.key)}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                                                    data.enabled_modules[mod.key]
                                                        ? 'border-amber-500/50 bg-amber-500/10'
                                                        : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                                                }`}
                                            >
                                                <div className="space-y-1">
                                                    <span className="font-bold text-xs block">{mod.label}</span>
                                                    <span className="text-[11px] text-muted-foreground block">{mod.desc}</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={!!data.enabled_modules[mod.key]}
                                                    onChange={() => {}}
                                                    className="rounded border-border text-amber-500 focus:ring-amber-500 shrink-0 mt-0.5"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stage: Activation */}
                            {activeStage === 'Activation' && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                                        <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400">
                                            Platform Readiness Check
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Activating this college allows assigned College Admins, Deans, and Faculty to access their respective operational portals.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold">Operational Lifecycle Status</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value as College['status'])}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="In Setup">In Setup (Configuration ongoing)</option>
                                            <option value="Ready">Ready (Pre-flight verified)</option>
                                            <option value="Active">Active (Live in COMPASS)</option>
                                            <option value="Suspended">Suspended (Temporarily restricted)</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold">Completion Progress (%)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={data.setup_progress}
                                            onChange={(e) => setData('setup_progress', parseInt(e.target.value) || 0)}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* General / Other Stages placeholder */}
                            {activeStage !== 'Identity' && activeStage !== 'Modules' && activeStage !== 'Activation' && (
                                <div className="p-6 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                                        <Sliders className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm">Stage: {activeStage} Baseline Ready</h4>
                                        <p className="text-xs text-muted-foreground max-w-md">
                                            Default institutional configuration rules for {activeStage} are inherited from Davao Del Sur State College global defaults.
                                        </p>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-mono">
                                        Rule Scope: Inherited from Institution Super Admin Defaults
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
