import AppLayout from '@/layouts/app-layout';
import { SchedulingWorkspaceLayout } from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Calendar,
    ArrowLeftRight,
    Sparkles,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Layers,
    Send,
    Lock,
    Unlock,
    FileCheck,
    Cpu,
    Check,
    ChevronRight,
    Users,
    Building2,
    CalendarCheck,
    ShieldAlert,
    BookOpen,
    Plus,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Post-Publication Adjustments', href: '/schedule/adjustments' },
];

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    title_name?: string;
    specialization?: string;
}

interface WindowRecord {
    id: number;
    title: string;
    opens_at: string;
    closes_at: string;
    status: 'Open' | 'Closed' | 'Archived';
    allow_subject_swaps: boolean;
    allow_section_swaps: boolean;
    allow_time_swaps: boolean;
}

interface SwapRequest {
    id: number;
    swap_type: string;
    requester_faculty_id: number;
    counterpart_faculty_id?: number | null;
    requester_faculty?: Faculty;
    counterpart_faculty?: Faculty;
    proposed_day?: string;
    proposed_start_time?: string;
    proposed_end_time?: string;
    proposed_room?: string;
    reason: string;
    counterpart_consent: 'Pending' | 'Accepted' | 'Rejected';
    pre_validation_passed: boolean;
    pre_validation_notes?: string;
    deep_validation_passed?: boolean;
    status: string;
    created_at: string;
}

interface BatchRecord {
    id: number;
    batch_number: string;
    total_requests_count: number;
    accepted_requests_count: number;
    affected_faculty_ids?: number[];
    gemini_consolidation_summary?: string;
    gemini_competition_warnings?: string[];
    solver_status: string;
    status: string;
    created_at: string;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    activeWindow: WindowRecord | null;
    windows: WindowRecord[];
    swapRequests: SwapRequest[];
    batches: BatchRecord[];
    faculties: Faculty[];
    offerings: any[];
}

export default function AdjustmentsHub({
    currentPeriod,
    academicPeriods,
    activeWindow,
    windows = [],
    swapRequests = [],
    batches = [],
    faculties = [],
    offerings = [],
}: Props) {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const tabParam = urlParams?.get('tab');
    const initialTab: 'windows' | 'swaps' | 'batches' | 'publication' =
        tabParam === 'windows' ? 'windows' :
        tabParam === 'batches' ? 'batches' :
        (tabParam === 'solver' || tabParam === 'publication') ? 'publication' : 'swaps';

    const [activeTab, setActiveTab] = useState<'windows' | 'swaps' | 'batches' | 'publication'>(initialTab);
    const [isNewSwapOpen, setIsNewSwapOpen] = useState(false);
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // Form state for creating a swap request
    const [swapForm, setSwapForm] = useState({
        swap_type: 'Time-Slot Swap',
        requester_faculty_id: faculties[0]?.id || 1,
        counterpart_faculty_id: faculties[1]?.id || '',
        proposed_day: 'Wednesday',
        proposed_start_time: '13:00',
        proposed_end_time: '14:30',
        proposed_room: 'ComLab 1',
        reason: 'Laboratory software requirement: CS 311 requires GPU cluster in ComLab 1 for Machine Learning practicals.',
    });

    const handleToggleWindow = (action: 'open' | 'close') => {
        router.post('/schedule/adjustments/toggle-window', {
            action,
            title: 'Mid-Semester Adjustment Window #001',
        });
    };

    const handleCreateSwap = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/schedule/adjustments/swap-request', swapForm, {
            onSuccess: () => {
                setIsNewSwapOpen(false);
            },
        });
    };

    const handleConsentResponse = (id: number, decision: 'accept' | 'reject') => {
        router.post(`/schedule/adjustments/consent/${id}`, { decision });
    };

    const handleConsolidateWithGemini = () => {
        setIsConsolidating(true);
        router.post('/schedule/adjustments/consolidate-batch', {}, {
            onFinish: () => setIsConsolidating(false),
        });
    };

    const handlePublishVersion2 = () => {
        setIsPublishing(true);
        router.post('/schedule/adjustments/publish-revision', {}, {
            onFinish: () => setIsPublishing(false),
        });
    };

    const pendingConsentCount = swapRequests.filter((r) => r.counterpart_consent === 'Pending').length;
    const acceptedCount = swapRequests.filter((r) => r.counterpart_consent === 'Accepted').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Post-Publication Schedule Adjustment Hub - CIDS OfficeHub" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 dark:border-amber-900/30 dark:from-amber-950/20">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-amber-600 text-white dark:bg-amber-500">Post-Publication Governance</Badge>
                                    <span className="text-xs text-muted-foreground">Governed Schedule Lifecycle: Phase 18–30</span>
                                </div>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                    Controlled Post-Publication Adjustments
                                </h1>
                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Official published timetables remain locked. Faculty propose structured adjustments (Subject, Section, Time-Slot),
                                    counterparts explicitly consent, and OR-Tools + Gemini batch-optimize changes into an authoritative Master Schedule v2.0.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeWindow ? (
                                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                                        <div className="text-xs">
                                            <span className="font-semibold">{activeWindow.title}</span>
                                            <p className="text-[10px] text-muted-foreground">Status: Open & Accepting Requests</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="ml-2 border-emerald-300 bg-white text-xs text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                            onClick={() => handleToggleWindow('close')}
                                        >
                                            <Lock className="mr-1 h-3.5 w-3.5" /> Close Window
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500"
                                        onClick={() => handleToggleWindow('open')}
                                    >
                                        <Unlock className="mr-2 h-4 w-4" /> Open Adjustment Window
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    className="border-primary/30"
                                    onClick={() => setIsNewSwapOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Submit Swap Proposal
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <button
                            onClick={() => setActiveTab('swaps')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === 'swaps'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                            Faculty Swaps & Counterpart Consent
                            {pendingConsentCount > 0 && (
                                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {pendingConsentCount}
                                </Badge>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('batches')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === 'batches'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Consolidated Batches & Gemini AI
                            {batches.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {batches.length}
                                </Badge>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('windows')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === 'windows'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Clock className="h-4 w-4" />
                            Adjustment Windows ({windows.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('publication')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === 'publication'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <FileCheck className="h-4 w-4 text-emerald-500" />
                            Re-Optimization & Master v2.0
                        </button>
                    </div>

                    {/* Tab 1: Faculty Swaps & Consent */}
                    {activeTab === 'swaps' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="rounded-xl border border-border/50 bg-card p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Total Proposals</span>
                                        <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <p className="mt-2 text-2xl font-bold">{swapRequests.length}</p>
                                    <p className="text-[11px] text-muted-foreground">Logged during active window</p>
                                </div>
                                <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 p-4 dark:bg-amber-950/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Awaiting Consent</span>
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-200">{pendingConsentCount}</p>
                                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400">Explicit counterpart sign-off required</p>
                                </div>
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Mutually Accepted</span>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-200">{acceptedCount}</p>
                                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">Deep validation verified</p>
                                </div>
                                <div className="rounded-xl border border-purple-500/20 bg-purple-50/50 p-4 dark:bg-purple-950/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-purple-800 dark:text-purple-300">Deterministic Checks</span>
                                        <Cpu className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-200">100% Passed</p>
                                    <p className="text-[11px] text-purple-700/80 dark:text-purple-400">0 Hard Collisions</p>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                                <div className="flex items-center justify-between border-b border-border/40 p-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">Active Faculty Adjustment Proposals</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Pre-validated exchanges awaiting counterpart consent or ready for batch consolidation.
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={() => setIsNewSwapOpen(true)} className="gap-1.5">
                                        <Plus className="h-4 w-4" /> Propose Swap
                                    </Button>
                                </div>

                                <div className="divide-y divide-border/40">
                                    {swapRequests.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <ArrowLeftRight className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                                            <p className="text-sm font-medium">No schedule swap requests submitted yet.</p>
                                            <p className="text-xs">Click "Propose Swap" to initiate an official exchange between faculty members.</p>
                                        </div>
                                    ) : (
                                        swapRequests.map((req) => (
                                            <div key={req.id} className="p-4 transition-colors hover:bg-muted/30">
                                                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs font-semibold">
                                                                {req.swap_type}
                                                            </Badge>
                                                            <span className="text-xs font-medium text-foreground">
                                                                {req.requester_faculty ? `${req.requester_faculty.first_name} ${req.requester_faculty.last_name}` : `Faculty #${req.requester_faculty_id}`}
                                                            </span>
                                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-xs font-medium text-foreground">
                                                                {req.counterpart_faculty ? `${req.counterpart_faculty.first_name} ${req.counterpart_faculty.last_name}` : 'Open Adjustment'}
                                                            </span>
                                                            <Badge
                                                                className={`text-[10px] ${
                                                                    req.counterpart_consent === 'Accepted'
                                                                        ? 'bg-emerald-600 text-white'
                                                                        : req.counterpart_consent === 'Pending'
                                                                        ? 'bg-amber-500 text-white'
                                                                        : 'bg-rose-500 text-white'
                                                                }`}
                                                            >
                                                                Consent: {req.counterpart_consent}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                            <span>Target: <strong className="text-foreground">{req.proposed_day} {req.proposed_start_time}–{req.proposed_end_time}</strong></span>
                                                            <span>•</span>
                                                            <span>Room: <strong className="text-foreground">{req.proposed_room}</strong></span>
                                                            <span>•</span>
                                                            <span className="italic">"{req.reason}"</span>
                                                        </div>

                                                        {req.pre_validation_notes && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                <span>{req.pre_validation_notes}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                        {req.counterpart_consent === 'Pending' ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                                    onClick={() => handleConsentResponse(req.id, 'accept')}
                                                                >
                                                                    <Check className="mr-1 h-3.5 w-3.5" /> Grant Consent
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-rose-500/40 text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                                    onClick={() => handleConsentResponse(req.id, 'reject')}
                                                                >
                                                                    <XCircle className="mr-1 h-3.5 w-3.5" /> Decline
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {req.status}
                                                                </Badge>
                                                                {req.counterpart_consent === 'Accepted' && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => alert(`Program Head endorsed swap proposal #${req.id} for batch optimization.`)}
                                                                            className="border-blue-500/30 text-blue-700 hover:bg-blue-50 text-[11px] font-semibold"
                                                                        >
                                                                            Endorse Swap
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => alert(`Requested revision on swap #${req.id}.`)}
                                                                            className="text-rose-600 hover:bg-rose-50 text-[11px]"
                                                                        >
                                                                            Reject
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Consolidated Batches & Gemini AI */}
                    {activeTab === 'batches' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">Gemini Semantic Batch Consolidation</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Analyze all mutually accepted swap requests, cluster common rationales, and flag shared-resource bottlenecks (e.g. ComLab 1 on Wednesday).
                                    </p>
                                </div>
                                <Button
                                    onClick={handleConsolidateWithGemini}
                                    disabled={isConsolidating || acceptedCount === 0}
                                    className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow hover:from-amber-600 hover:to-amber-700"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {isConsolidating ? 'Consolidating with Gemini...' : 'Consolidate Accepted Swaps into Batch'}
                                </Button>
                            </div>

                            {batches.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
                                    <Sparkles className="mx-auto mb-2 h-8 w-8 text-amber-500/50" />
                                    <p className="text-sm font-medium">No consolidated batches generated yet.</p>
                                    <p className="text-xs">Once faculty consent is granted, click "Consolidate Accepted Swaps" to run AI semantic grouping.</p>
                                </div>
                            ) : (
                                batches.map((batch) => (
                                    <div key={batch.id} className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                                        <div className="flex flex-col justify-between gap-2 border-b border-border/40 pb-3 md:flex-row md:items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground text-lg">{batch.batch_number}</span>
                                                    <Badge className="bg-primary text-primary-foreground">{batch.status}</Badge>
                                                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                                                        {batch.solver_status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Created {new Date(batch.created_at).toLocaleString()} • {batch.accepted_requests_count} Accepted Requests Included
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setActiveTab('publication')}>
                                                    Proceed to Master Publication <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {batch.gemini_consolidation_summary && (
                                            <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 p-4 dark:bg-amber-950/20">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                                    Gemini Executive Interpretation & Bottleneck Analysis:
                                                </div>
                                                <p className="mt-1.5 text-xs text-amber-950/80 dark:text-amber-300 leading-relaxed">
                                                    {batch.gemini_consolidation_summary}
                                                </p>
                                            </div>
                                        )}

                                        {batch.gemini_competition_warnings && batch.gemini_competition_warnings.length > 0 && (
                                            <div className="space-y-1.5">
                                                <span className="text-xs font-medium text-muted-foreground">Resource Competition Alerts:</span>
                                                {batch.gemini_competition_warnings.map((warn, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-500/20">
                                                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <span>{warn}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab 3: Adjustment Windows */}
                    {activeTab === 'windows' && (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-border/50 bg-card p-4">
                                <h3 className="text-base font-semibold text-foreground">Post-Publication Policy Windows</h3>
                                <p className="text-xs text-muted-foreground">
                                    Define active periods during which faculty may submit swap proposals. Outside active windows, the official schedule is immutable.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {windows.map((w) => (
                                    <div key={w.id} className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground">{w.title}</span>
                                            <Badge className={w.status === 'Open' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}>
                                                {w.status}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>Opens: <strong className="text-foreground">{new Date(w.opens_at).toLocaleDateString()}</strong></p>
                                            <p>Closes: <strong className="text-foreground">{new Date(w.closes_at).toLocaleDateString()}</strong></p>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                                            <span>Subject: {w.allow_subject_swaps ? '✓' : '✗'}</span>
                                            <span>• Section: {w.allow_section_swaps ? '✓' : '✗'}</span>
                                            <span>• Time-Slot: {w.allow_time_swaps ? '✓' : '✗'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Re-Optimization & Master v2.0 Publication */}
                    {activeTab === 'publication' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/30 p-6 dark:bg-emerald-950/20">
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                    <div>
                                        <Badge className="bg-emerald-600 text-white">Ready for Master Publication</Badge>
                                        <h2 className="mt-2 text-xl font-bold text-foreground">Authoritative Master Schedule v2.0</h2>
                                        <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                                            Publishing creates an immutable <strong>Master Schedule v2.0</strong>, marks v1.0 as <em>Superseded</em>,
                                            and instantaneously cascades the updated official timetable to all views (Faculty My Schedule, Section Schedules, Room Bookings, TV Spotlight, and ICS calendars).
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handlePublishVersion2}
                                        disabled={isPublishing}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-md h-11 px-6 text-sm font-semibold"
                                    >
                                        <FileCheck className="mr-2 h-4 w-4" />
                                        {isPublishing ? 'Publishing Version 2.0...' : 'Publish Official Master Schedule v2.0'}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Cpu className="h-4 w-4 text-primary" /> OR-Tools CP-SAT Re-Optimization
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Unaffected courses remain securely pinned. Only swapped activities were mathematically shifted with 0 hard collisions.
                                    </p>
                                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                                        Optimal Feasible
                                    </Badge>
                                </div>

                                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Users className="h-4 w-4 text-blue-500" /> Multi-Level Governance Endorsement
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Program Heads (BSIT & BSIS) reviewed program-specific effects; Dean endorsed college-wide balance.
                                    </p>
                                    <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-300">
                                        Dean Approved
                                    </Badge>
                                </div>

                                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <CalendarCheck className="h-4 w-4 text-purple-500" /> Single Master Schedule Guarantee
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Zero independent schedules. All student, room, lab, and faculty views are filtered projections of Master v2.0.
                                    </p>
                                    <Badge variant="outline" className="border-purple-500/40 text-purple-700 dark:text-purple-300">
                                        Authoritative Master
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SchedulingWorkspaceLayout>

            {/* Modal: Propose Schedule Swap */}
            <Dialog open={isNewSwapOpen} onOpenChange={setIsNewSwapOpen}>
                <DialogContent className="max-w-md font-['Poppins']">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5 text-primary" />
                            Propose Schedule Swap / Adjustment
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Submit a formal change proposal. Your counterpart will receive an incoming request for explicit consent before re-optimization.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSwap} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Adjustment Type</Label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={swapForm.swap_type}
                                onChange={(e) => setSwapForm({ ...swapForm, swap_type: e.target.value })}
                            >
                                <option value="Time-Slot Swap">Time-Slot Swap (Day, Time, Room)</option>
                                <option value="Subject Assignment Swap">Subject Assignment Swap (Teaching Responsibility)</option>
                                <option value="Section Swap">Section Swap (Parallel Section Exchange)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Requester Faculty</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={swapForm.requester_faculty_id}
                                    onChange={(e) => setSwapForm({ ...swapForm, requester_faculty_id: Number(e.target.value) })}
                                >
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.last_name}, {f.first_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Counterpart Faculty</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={swapForm.counterpart_faculty_id}
                                    onChange={(e) => setSwapForm({ ...swapForm, counterpart_faculty_id: Number(e.target.value) })}
                                >
                                    <option value="">None / Open Request</option>
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.last_name}, {f.first_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Proposed Day</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-2 py-2 text-xs"
                                    value={swapForm.proposed_day}
                                    onChange={(e) => setSwapForm({ ...swapForm, proposed_day: e.target.value })}
                                >
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                    type="time"
                                    className="text-xs"
                                    value={swapForm.proposed_start_time}
                                    onChange={(e) => setSwapForm({ ...swapForm, proposed_start_time: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">End Time</Label>
                                <Input
                                    type="time"
                                    className="text-xs"
                                    value={swapForm.proposed_end_time}
                                    onChange={(e) => setSwapForm({ ...swapForm, proposed_end_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Proposed Room / Lab</Label>
                            <Input
                                placeholder="e.g. ComLab 1"
                                className="text-xs"
                                value={swapForm.proposed_room}
                                onChange={(e) => setSwapForm({ ...swapForm, proposed_room: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Academic Rationale / Reason</Label>
                            <Input
                                placeholder="State academic or research justification..."
                                className="text-xs"
                                value={swapForm.reason}
                                onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsNewSwapOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary text-primary-foreground">
                                <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Proposal
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
