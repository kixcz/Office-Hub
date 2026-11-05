import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Edit3,
    GitBranch,
    Lock,
    Plus,
    RotateCcw,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Workflow Builder & Pipelines', href: '/institution/workflows' },
];

interface WorkflowStep {
    step: number;
    label: string;
    role: string;
    scope: string;
    action: string;
    escalation_hours: number;
}

interface WorkflowDefinition {
    id: number;
    code: string;
    name: string;
    module: string;
    scope_level: 'Institution' | 'Entity' | 'College';
    version: string;
    status: 'Draft' | 'Active' | 'Archived';
    return_behavior: 'Return to Previous Step' | 'Return to Submitter';
    allow_delegation: boolean;
    separation_of_duties_enforced: boolean;
    final_state: string;
    description: string | null;
    steps: WorkflowStep[];
    updated_at?: string;
}

interface RoleOption {
    id: number;
    name: string;
    tier: string;
}

interface Props {
    workflows: WorkflowDefinition[];
    roles: RoleOption[];
}

export default function InstitutionWorkflows({ workflows = [], roles = [] }: Props) {
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(workflows[0] ?? null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | null>(null);

    const createForm = useForm({
        code: 'WF-CUST-07',
        name: '',
        module: 'Semester Scheduling',
        scope_level: 'College' as 'Institution' | 'Entity' | 'College',
        version: 'v1.0',
        status: 'Active' as 'Draft' | 'Active' | 'Archived',
        return_behavior: 'Return to Previous Step' as 'Return to Previous Step' | 'Return to Submitter',
        allow_delegation: true,
        separation_of_duties_enforced: true,
        final_state: 'Approved & Published',
        description: '',
        steps: [
            {
                step: 1,
                label: 'Initial Preparation & Submission',
                role: 'Faculty Member',
                scope: 'Program',
                action: 'Submit',
                escalation_hours: 48,
            },
            {
                step: 2,
                label: 'Program Academic Review',
                role: 'Program Head',
                scope: 'Program',
                action: 'Review & Endorse',
                escalation_hours: 48,
            },
            {
                step: 3,
                label: 'Final College Approval',
                role: 'Dean',
                scope: 'College',
                action: 'Approve & Publish',
                escalation_hours: 72,
            },
        ] as WorkflowStep[],
    });

    const editForm = useForm({
        name: '',
        version: '',
        status: 'Active' as 'Draft' | 'Active' | 'Archived',
        return_behavior: 'Return to Previous Step' as 'Return to Previous Step' | 'Return to Submitter',
        allow_delegation: true,
        separation_of_duties_enforced: true,
        final_state: '',
        steps: [] as WorkflowStep[],
    });

    const openEditModal = (wf: WorkflowDefinition) => {
        setEditingWorkflow(wf);
        editForm.setData({
            name: wf.name,
            version: wf.version,
            status: wf.status,
            return_behavior: wf.return_behavior,
            allow_delegation: wf.allow_delegation,
            separation_of_duties_enforced: wf.separation_of_duties_enforced,
            final_state: wf.final_state,
            steps: wf.steps.map((s, idx) => ({ ...s, step: idx + 1 })),
        });
    };

    const addStepToCreate = () => {
        createForm.setData('steps', [
            ...createForm.data.steps,
            {
                step: createForm.data.steps.length + 1,
                label: 'Verification Step',
                role: roles[0]?.name || 'College Admin',
                scope: 'College',
                action: 'Verify',
                escalation_hours: 48,
            },
        ]);
    };

    const removeStepFromCreate = (index: number) => {
        if (createForm.data.steps.length <= 1) {
            return;
        }
        const updated = createForm.data.steps
            .filter((_, idx) => idx !== index)
            .map((s, idx) => ({ ...s, step: idx + 1 }));
        createForm.setData('steps', updated);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/institution/workflows', {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWorkflow) {
            return;
        }
        editForm.put(`/institution/workflows/${editingWorkflow.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingWorkflow(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Workflow Builder & Verification Pipelines — Velora Governance" />

            <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                                <GitBranch className="h-3.5 w-3.5" />
                                Reusable Approval & Verification Pipelines
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Institutional Workflow Builder
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
                                Standardize multi-step submission, review, verification, and publication pipelines across
                                Entities and Colleges. Enforce <strong>Separation of Duties</strong> so no user can verify or
                                approve their own operational submission.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
                            >
                                <Plus className="h-4 w-4" />
                                Define New Workflow Pipeline
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Registered Pipelines</span>
                            <GitBranch className="h-4 w-4 text-indigo-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{workflows.length}</p>
                        <p className="mt-1 text-xs text-slate-500">
                            {workflows.filter((w) => w.status === 'Active').length} active in production
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Separation of Duties</span>
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                            {workflows.filter((w) => w.separation_of_duties_enforced).length} / {workflows.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Blocks self-approval & self-verification</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Acting / Delegation Ready</span>
                            <UserCheck className="h-4 w-4 text-[#5B21B6]" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                            {workflows.filter((w) => w.allow_delegation).length} Pipelines
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Honors Acting & Replacement designations</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Avg. Escalation SLA</span>
                            <Clock className="h-4 w-4 text-sky-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">24h – 72h</p>
                        <p className="mt-1 text-xs text-slate-500">Automated step reminder & SLA tracking</p>
                    </div>
                </div>

                {/* Master-Detail Split */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Catalog */}
                    <div className="space-y-3 lg:col-span-4">
                        <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                            Standard Approval Pipelines ({workflows.length})
                        </h2>
                        {workflows.map((wf) => {
                            const isSelected = selectedWorkflow?.id === wf.id;
                            return (
                                <div
                                    key={wf.id}
                                    onClick={() => setSelectedWorkflow(wf)}
                                    className={`cursor-pointer rounded-xl border p-4 transition ${
                                        isSelected
                                            ? 'border-indigo-600 bg-indigo-50/60 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/30'
                                            : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-slate-700">
                                                    {wf.code}
                                                </span>
                                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                                    {wf.version}
                                                </span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                        wf.status === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {wf.status}
                                                </span>
                                            </div>
                                            <h3 className="mt-2 font-bold text-slate-900 dark:text-white">{wf.name}</h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Module: <strong className="text-slate-700 dark:text-slate-300">{wf.module}</strong> · Scope:{' '}
                                                <strong>{wf.scope_level}</strong>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(wf);
                                            }}
                                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                                            title="Configure Workflow Pipeline"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {wf.steps?.length || 0} Stages
                                        </span>
                                        {wf.separation_of_duties_enforced && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                <Lock className="h-3 w-3" /> SoD Enforced
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950/50 dark:text-[#A78BFA]">
                                            <RotateCcw className="h-3 w-3" /> {wf.return_behavior}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Visual Pipeline Inspector */}
                    <div className="lg:col-span-8">
                        {selectedWorkflow ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center dark:border-slate-800">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-md bg-indigo-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                                                {selectedWorkflow.code}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-500">
                                                {selectedWorkflow.module} · {selectedWorkflow.scope_level} Scope
                                            </span>
                                        </div>
                                        <h2 className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">
                                            {selectedWorkflow.name}
                                        </h2>
                                        {selectedWorkflow.description && (
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                {selectedWorkflow.description}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openEditModal(selectedWorkflow)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Edit Pipeline Stages
                                    </button>
                                </div>

                                {/* Governance Rules Banner */}
                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                                            Return / Revision Behavior
                                        </span>
                                        <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {selectedWorkflow.return_behavior}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                                            Separation of Duties
                                        </span>
                                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                            <ShieldCheck className="h-4 w-4" />
                                            {selectedWorkflow.separation_of_duties_enforced
                                                ? 'Strict (Submitter ≠ Approver)'
                                                : 'Advisory Only'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                                            Terminal State
                                        </span>
                                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                            <Sparkles className="h-4 w-4" />
                                            {selectedWorkflow.final_state}
                                        </p>
                                    </div>
                                </div>

                                {/* Step-by-Step Visual Chain */}
                                <div className="mt-6 space-y-4">
                                    <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Sequential Approval & Verification Stages
                                    </h3>

                                    <div className="relative space-y-4">
                                        {(selectedWorkflow.steps || []).map((step, index) => (
                                            <div key={step.step} className="relative">
                                                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
                                                    <div className="flex items-start gap-3.5">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-xs">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="font-bold text-slate-900 dark:text-white">
                                                                    {step.label}
                                                                </h4>
                                                                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                                    Action: {step.action}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                                Assigned Role:{' '}
                                                                <strong className="text-slate-900 dark:text-white">
                                                                    {step.role}
                                                                </strong>{' '}
                                                                · Scope Boundary:{' '}
                                                                <strong className="text-slate-900 dark:text-white">
                                                                    {step.scope}
                                                                </strong>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs">
                                                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            <Clock className="h-3.5 w-3.5 text-[#7C3AED]" />
                                                            SLA: {step.escalation_hours}h
                                                        </span>
                                                    </div>
                                                </div>

                                                {index < selectedWorkflow.steps.length - 1 && (
                                                    <div className="my-1.5 flex justify-center">
                                                        <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Final Terminal Badge */}
                                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                                <div>
                                                    <p className="text-xs font-semibold text-emerald-800 uppercase dark:text-emerald-300">
                                                        Workflow Completion State
                                                    </p>
                                                    <p className="text-sm font-bold text-emerald-950 dark:text-white">
                                                        {selectedWorkflow.final_state}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                                Immutable Audit Logged
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Create Workflow Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Define New Reusable Workflow Pipeline
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Configure stages, responsible roles, escalation timers, and separation-of-duties rules.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Pipeline Code
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.code}
                                        onChange={(e) => createForm.setData('code', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Target Module
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.module}
                                        onChange={(e) => createForm.setData('module', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Scope Level
                                    </label>
                                    <select
                                        value={createForm.data.scope_level}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'scope_level',
                                                e.target.value as 'Institution' | 'Entity' | 'College',
                                            )
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <option value="College">College</option>
                                        <option value="Entity">Entity / Campus</option>
                                        <option value="Institution">Institution</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Workflow Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Make-Up Class Verification Pipeline"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Final Completion State Label
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.final_state}
                                        onChange={(e) => createForm.setData('final_state', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <label className="flex items-center gap-2 text-xs font-medium">
                                    <input
                                        type="checkbox"
                                        checked={createForm.data.separation_of_duties_enforced}
                                        onChange={(e) =>
                                            createForm.setData('separation_of_duties_enforced', e.target.checked)
                                        }
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                    Enforce Separation of Duties (Submitter ≠ Approver)
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium">
                                    <input
                                        type="checkbox"
                                        checked={createForm.data.allow_delegation}
                                        onChange={(e) => createForm.setData('allow_delegation', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                    Allow Acting / Delegated Role Sign-off
                                </label>
                            </div>

                            {/* Steps Editor */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Approval Stages ({createForm.data.steps.length})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={addStepToCreate}
                                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Stage
                                    </button>
                                </div>

                                {createForm.data.steps.map((st, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-700"
                                    >
                                        <div className="sm:col-span-4">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase">
                                                Stage {idx + 1} Label
                                            </label>
                                            <input
                                                type="text"
                                                value={st.label}
                                                onChange={(e) => {
                                                    const next = [...createForm.data.steps];
                                                    next[idx].label = e.target.value;
                                                    createForm.setData('steps', next);
                                                }}
                                                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase">
                                                Responsible Role
                                            </label>
                                            <select
                                                value={st.role}
                                                onChange={(e) => {
                                                    const next = [...createForm.data.steps];
                                                    next[idx].role = e.target.value;
                                                    createForm.setData('steps', next);
                                                }}
                                                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                            >
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.name}>
                                                        {r.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-3">
                                            <label className="text-[10px] font-semibold text-slate-500 uppercase">
                                                Action Verb
                                            </label>
                                            <input
                                                type="text"
                                                value={st.action}
                                                onChange={(e) => {
                                                    const next = [...createForm.data.steps];
                                                    next[idx].action = e.target.value;
                                                    createForm.setData('steps', next);
                                                }}
                                                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                            />
                                        </div>
                                        <div className="flex items-end justify-between gap-1 sm:col-span-2">
                                            <div className="w-full">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase">
                                                    SLA (Hrs)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={st.escalation_hours}
                                                    onChange={(e) => {
                                                        const next = [...createForm.data.steps];
                                                        next[idx].escalation_hours = Number(e.target.value);
                                                        createForm.setData('steps', next);
                                                    }}
                                                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeStepFromCreate(idx)}
                                                className="rounded p-1.5 text-rose-500 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                                >
                                    Save Workflow Pipeline
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Workflow Modal */}
            {editingWorkflow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Configure {editingWorkflow.code} — {editingWorkflow.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Changes are versioned and recorded in the immutable Institution Audit Log.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingWorkflow(null)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Version Tag
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.version}
                                        onChange={(e) => editForm.setData('version', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Status
                                    </label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) =>
                                            editForm.setData('status', e.target.value as 'Draft' | 'Active' | 'Archived')
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Archived">Archived</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Return Behavior
                                    </label>
                                    <select
                                        value={editForm.data.return_behavior}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'return_behavior',
                                                e.target.value as 'Return to Previous Step' | 'Return to Submitter',
                                            )
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <option value="Return to Previous Step">Return to Previous Step</option>
                                        <option value="Return to Submitter">Return to Submitter</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <label className="flex items-center gap-2 text-xs font-medium">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.separation_of_duties_enforced}
                                        onChange={(e) =>
                                            editForm.setData('separation_of_duties_enforced', e.target.checked)
                                        }
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                    Enforce Separation of Duties (Submitter ≠ Approver)
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.allow_delegation}
                                        onChange={(e) => editForm.setData('allow_delegation', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                    Allow Acting / Delegated Role Sign-off
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingWorkflow(null)}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                                >
                                    Update Pipeline
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
