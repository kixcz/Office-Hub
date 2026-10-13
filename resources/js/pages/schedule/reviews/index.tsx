import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    FileCheck,
    CheckCircle2,
    AlertTriangle,
    Sparkles,
    MessageSquare,
    Send,
    UserCheck,
    ShieldAlert,
    HelpCircle,
    ArrowRight,
    RefreshCw,
    Check,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Reviews & Endorsement', href: '/schedule/reviews' },
];

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    programs: any[];
}

export default function ScheduleReviewsIndex({
    currentPeriod,
    academicPeriods,
    programs = [],
}: Props) {
    const [reviewRole, setReviewRole] = useState<'program_head' | 'dean' | 'super_admin'>('program_head');
    const [isConsolidating, setIsConsolidating] = useState(false);

    // Initial Program Head flagged issues
    const [flags, setFlags] = useState([
        {
            id: 1,
            program: 'BSIT',
            reviewer: 'Dr. Evelyn Santos (Program Head - IT)',
            course: 'IT 311 - Mobile Applications',
            section: 'BSIT 3A',
            severity: 'Blocking',
            category: 'Laboratory Requirement',
            remarks: 'Scheduled in CLR 2 (Lecture Room) on Thursday 1:30 PM, but curriculum requires Android SDK & physical workstations in ComLab 1.',
            suggestedCorrection: 'Move to ComLab 1 Thursday 1:30 PM - 4:30 PM.',
            status: 'Pending Revision',
        },
        {
            id: 2,
            program: 'BSIS',
            reviewer: 'Prof. Marcus Vance (Program Head - IS)',
            course: 'IS 201 - Enterprise Architecture',
            section: '1 BSIS A',
            severity: 'Moderate',
            category: 'Faculty Consecutive Hours',
            remarks: 'Prof. De Leon is scheduled for 5 consecutive lecture hours on Tuesday from 10:30 AM to 3:30 PM without institutional break.',
            suggestedCorrection: 'Insert 1-hour lunch break or move afternoon lecture block to Wednesday.',
            status: 'Pending Revision',
        },
        {
            id: 3,
            program: 'BSIT',
            reviewer: 'Dr. Evelyn Santos (Program Head - IT)',
            course: 'IT 412 - Capstone Project 2',
            section: 'BSIT 4A',
            severity: 'Minor',
            category: 'Time Window Preference',
            remarks: 'Scheduled at 7:30 AM Monday; 4th year students request afternoon block due to off-campus industry internships.',
            suggestedCorrection: 'Swap with IT 111 on Monday 1:30 PM.',
            status: 'Resolved',
        },
    ]);

    // Simulated Gemini Consolidated Proposed Rule
    const [geminiInsights, setGeminiInsights] = useState<{
        summary: string;
        extractedRules: string[];
        contradictions: string[];
    }>({
        summary: 'Analyzed 3 Program Head submissions across BSIT and BSIS. Detected 1 critical laboratory facility mismatch and 1 faculty workload fatigue violation. No contradictory requests identified.',
        extractedRules: [
            'Constraint Rule 1: Enforce mandatory room-type tag [Laboratory] strictly for IT 311 (Mobile Applications) exclusively to ComLab 1 or ComLab 2.',
            'Constraint Rule 2: Limit continuous teaching block to max 4.0 hours for Prof. De Leon on Tuesday schedule.',
        ],
        contradictions: [
            'None detected. All suggested swaps retain valid section and instructor availability.',
        ],
    });

    const handleRunGeminiConsolidation = () => {
        setIsConsolidating(true);
        setTimeout(() => {
            setIsConsolidating(false);
            setGeminiInsights({
                summary: 'Gemini NLP entity extraction successfully refreshed. 2 high-priority schedule adjustments consolidated into solver penalty rules for Super Admin confirmation.',
                extractedRules: [
                    'IT 311 reassigned to ComLab 1 on Thursday 13:30 (Hard constraint check: Satisfied).',
                    'Prof. De Leon Tuesday schedule split with 12:00-13:00 lunch buffer (Soft constraint: 98% quality).',
                ],
                contradictions: ['Zero cross-program conflict contradictions.'],
            });
        }, 1200);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Reviews & Endorsements" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Program Head &amp; Dean Review Workflow
                            </h1>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                AI Comment Consolidation Active
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Program Heads inspect isolated program schedules and flag blocking entries with structured categories. Gemini summarizes and detects contradictions, while the Dean performs college-wide endorsement.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setReviewRole('program_head')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                reviewRole === 'program_head'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Program Head View
                        </button>
                        <button
                            onClick={() => setReviewRole('dean')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                reviewRole === 'dean'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Dean Inspection View
                        </button>
                    </div>
                </div>

                {/* Gemini AI Intelligence Banner */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-purple-800/40 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-700/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/30">
                                <Sparkles className="size-6 text-purple-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    Gemini Comment Consolidation &amp; Contradiction Detection
                                </h3>
                                <p className="text-xs text-purple-200">
                                    Intent extraction, issue deduplication, and proposed constraint formulation.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleRunGeminiConsolidation}
                            disabled={isConsolidating}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs gap-2"
                        >
                            {isConsolidating ? (
                                <>
                                    <RefreshCw className="size-3.5 animate-spin" />
                                    Analyzing Reviews...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-3.5" />
                                    Run AI Comment Consolidation
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-2">
                            <span className="font-bold text-purple-200 uppercase tracking-wider block text-[10px]">
                                Proposed Solver Constraints
                            </span>
                            <ul className="space-y-1.5 text-slate-100">
                                {geminiInsights.extractedRules.map((r, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                        <Check className="size-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                        <span>{r}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-2">
                            <span className="font-bold text-purple-200 uppercase tracking-wider block text-[10px]">
                                Contradiction &amp; Cross-Conflict Verification
                            </span>
                            <p className="text-slate-100 leading-relaxed">
                                {geminiInsights.contradictions[0]}
                            </p>
                            <span className="text-[11px] text-purple-300/80 block mt-2">
                                Requires Super Admin confirmation before updating candidate timetable.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Review Flags Matrix */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                Review Flags &amp; Suggested Corrections ({flags.length})
                            </h3>
                            <p className="text-xs text-gray-500">
                                Structured issue tracking across severity, room type, and faculty availability.
                            </p>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                            + Add Review Flag
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {flags.map((flag) => (
                            <div
                                key={flag.id}
                                className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                            >
                                <div className="space-y-1 max-w-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 text-sm">{flag.course}</span>
                                        <Badge variant="outline" className="text-[10px]">{flag.section}</Badge>
                                        <Badge
                                            className={
                                                flag.severity === 'Blocking'
                                                    ? 'bg-red-100 text-red-800 border-red-200'
                                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                            }
                                        >
                                            {flag.severity}
                                        </Badge>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-600 font-medium">{flag.category}</span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{flag.remarks}</p>
                                    <div className="text-blue-800 font-medium bg-blue-50/80 p-2 rounded-lg border border-blue-100">
                                        Suggested Fix: {flag.suggestedCorrection}
                                    </div>
                                    <div className="text-[11px] text-gray-400">Flagged by: {flag.reviewer}</div>
                                </div>

                                <div className="flex flex-col md:items-end gap-2 shrink-0">
                                    <Badge
                                        className={
                                            flag.status === 'Resolved'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-200 text-gray-700'
                                        }
                                    >
                                        {flag.status}
                                    </Badge>
                                    <Button variant="outline" size="sm" className="text-xs">
                                        Apply Correction
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dean Endorsement & Publication Card */}
                {reviewRole === 'dean' && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                                <CheckCircle2 className="size-5 text-emerald-600" />
                                Official Dean Endorsement &amp; Publication
                            </h3>
                            <p className="text-xs text-emerald-800 max-w-2xl leading-relaxed">
                                Master timetable has 0 blocking hard conflicts, 2 program head endorsements completed, and 89.2% overall room utilization. Endorsing locks Version 1.0 as the single source of truth.
                            </p>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">
                            Endorse &amp; Publish Timetable
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
