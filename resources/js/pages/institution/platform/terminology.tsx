import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Building2,
    CheckCircle2,
    LucideMessageSquareText,
    Save,
    Sliders,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TerminologyConfig {
    [key: string]: {
        default: string;
        [collegeCode: string]: string;
    };
}

interface Props {
    terminology: TerminologyConfig;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Platform Configuration', href: '/institution/terminology' },
    { title: 'Terminology Configuration', href: '/institution/terminology' },
];

export default function TerminologyConfiguration({ terminology }: Props) {
    const { data, setData, put, processing } = useForm({
        terminology: terminology || {},
    });

    const handleUpdate = (category: string, field: string, value: string) => {
        setData('terminology', {
            ...data.terminology,
            [category]: {
                ...data.terminology[category],
                [field]: value,
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/institution/terminology');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Terminology Configuration · Platform Configuration" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Terminology Configuration</h1>
                        <p className="text-sm text-muted-foreground">
                            Customize UI labels and role terminology across colleges without modifying source code.
                        </p>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl shadow-xs"
                    >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        {processing ? 'Saving...' : 'Save Terminology'}
                    </Button>
                </div>

                {/* Terminology Overrides Cards */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Facility Monitor Terminology */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                <LucideMessageSquareText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Facility Monitor / Laboratory Role Terminology</h3>
                                <p className="text-xs text-muted-foreground">
                                    Label used when displaying lab supervisors, monitors, or facility coordinators.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground">
                                    Institution Default Label
                                </label>
                                <input
                                    type="text"
                                    value={data.terminology['facility_monitor']?.default || 'Facility In-Charge'}
                                    onChange={(e) =>
                                        handleUpdate('facility_monitor', 'default', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-amber-500">
                                    CIDS College Override
                                </label>
                                <input
                                    type="text"
                                    value={data.terminology['facility_monitor']?.cids || 'Lab In-Charge'}
                                    onChange={(e) => handleUpdate('facility_monitor', 'cids', e.target.value)}
                                    className="w-full rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-blue-500">
                                    COE (Engineering) Override
                                </label>
                                <input
                                    type="text"
                                    value={data.terminology['facility_monitor']?.coe || 'Laboratory Technician'}
                                    onChange={(e) => handleUpdate('facility_monitor', 'coe', e.target.value)}
                                    className="w-full rounded-xl border border-blue-500/40 bg-blue-500/5 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-emerald-500">
                                    CED (Education) Override
                                </label>
                                <input
                                    type="text"
                                    value={data.terminology['facility_monitor']?.ced || 'Classroom Coordinator'}
                                    onChange={(e) => handleUpdate('facility_monitor', 'ced', e.target.value)}
                                    className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Academic Leader Terminology */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                <Sliders className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Academic Leadership Terminology</h3>
                                <p className="text-xs text-muted-foreground">
                                    Title assigned to degree leaders (e.g. Program Head, Program Chair, Department Head).
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground">
                                    Institution Default
                                </label>
                                <input
                                    type="text"
                                    value={data.terminology['academic_leader']?.default || 'Program Head'}
                                    onChange={(e) =>
                                        handleUpdate('academic_leader', 'default', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground">
                                    CIDS College Override
                                </label>
                                <input
                                    type="text"
                                    value={data.terminology['academic_leader']?.cids || 'Program Head'}
                                    onChange={(e) =>
                                        handleUpdate('academic_leader', 'cids', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
