import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    FlaskConical,
    Sprout,
    Calendar,
    Users,
    FileText,
    Award
} from 'lucide-react';

interface Props {
    faculty: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Research & Extension', href: '/faculty/research-extension' },
];

export default function FacultyResearchExtensionPage({ faculty }: Props) {
    const research = [
        {
            id: 1,
            title: 'AI-driven Student Performance Analytics and Early Intervention Framework',
            program: 'CIDS College Research Program',
            duration: 'June 2026 – May 2027',
            status: 'Active',
            role: 'Lead Researcher',
            milestone: 'Milestone 2 - Data Pipeline & Model Prototyping (75% completed)',
            deliverables: 'Research Paper draft, Ethics clearance, Source repository',
        },
    ];

    const extension = [
        {
            id: 1,
            title: 'Community Tech Literacy and Basic Coding Skills Program',
            program: 'Institutional Extension Program',
            duration: 'August 2026 – December 2026',
            status: 'Active',
            role: 'Program Coordinator',
            milestone: 'Module 3 of 5 Delivered',
            deliverables: 'Attendance logs, Module syllabi, Community beneficiary feedback',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Research & Extension - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Research & Extension Engagements</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Document your institutional research outputs, community extension programs, verified roles, and milestones.
                    </p>
                </div>

                {/* Research Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-rose-500" />
                        <h2 className="text-lg font-black text-foreground">Research Projects & Publications</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {research.map((r) => (
                            <div key={r.id} className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        {r.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-semibold">{r.duration}</span>
                                </div>
                                <h3 className="text-sm font-black text-foreground leading-snug">{r.title}</h3>
                                <div className="text-xs text-muted-foreground">
                                    <div>Program: <span className="font-semibold text-foreground">{r.program}</span></div>
                                    <div>Role: <span className="font-semibold text-foreground">{r.role}</span></div>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                                    <div className="font-bold text-foreground">Current Milestone:</div>
                                    <div className="text-muted-foreground mt-0.5">{r.milestone}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extension Section */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-teal-500" />
                        <h2 className="text-lg font-black text-foreground">Community Extension Engagements</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {extension.map((e) => (
                            <div key={e.id} className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        {e.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-semibold">{e.duration}</span>
                                </div>
                                <h3 className="text-sm font-black text-foreground leading-snug">{e.title}</h3>
                                <div className="text-xs text-muted-foreground">
                                    <div>Program: <span className="font-semibold text-foreground">{e.program}</span></div>
                                    <div>Role: <span className="font-semibold text-foreground">{e.role}</span></div>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                                    <div className="font-bold text-foreground">Activities & Deliverables:</div>
                                    <div className="text-muted-foreground mt-0.5">{e.deliverables}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
