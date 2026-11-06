import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    LucideMessageSquareText,
    Save,
    Sliders,
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
    colleges?: Array<{ id: number; code: string; name: string; type?: string }>;
}

const TERMS_CATALOG = [
    {
        key: 'entity_unit',
        title: 'Entity / Campus Terminology',
        desc: 'Label used for top-level campuses or institutional branches (e.g., Main Campus, Satellite Campus, Extension Campus).',
        fallback: 'Campus / Entity',
    },
    {
        key: 'college_unit',
        title: 'College / Academic Unit Terminology',
        desc: 'Label used for academic units (e.g., College, School, Institute).',
        fallback: 'College',
    },
    {
        key: 'program_unit',
        title: 'Program / Department Terminology',
        desc: 'Label used for degree programs or academic departments.',
        fallback: 'Program',
    },
    {
        key: 'academic_leader',
        title: 'Program Head / Department Chair Terminology',
        desc: 'Title displayed for degree leaders (e.g., Program Head, Department Chair, Program Coordinator).',
        fallback: 'Program Head',
    },
    {
        key: 'faculty_member',
        title: 'Faculty / Academic Staff Terminology',
        desc: 'Title used for instructional personnel (e.g., Faculty Member, Instructor, Academic Mentor).',
        fallback: 'Faculty Member',
    },
    {
        key: 'facility_monitor',
        title: 'Lab In-Charge / Facility Monitor Terminology',
        desc: 'Label used for laboratory or facility observers (e.g., Lab In-Charge, Laboratory Technician, Classroom Coordinator).',
        fallback: 'Facility In-Charge',
    },
    {
        key: 'facility_space',
        title: 'Laboratory / Workshop / Studio Terminology',
        desc: 'Label used for specialized instructional spaces (e.g., Computer Laboratory, Engineering Workshop, Demonstration Studio).',
        fallback: 'Laboratory / Room',
    },
];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Terminology Configuration', href: '/institution/terminology' },
];

export default function TerminologyConfiguration({ terminology = {} }: Props) {
    const { data, setData, put, processing } = useForm({
        terminology: terminology || {},
    });

    const handleUpdate = (category: string, field: string, value: string) => {
        setData('terminology', {
            ...data.terminology,
            [category]: {
                ...(data.terminology[category] || {}),
                [field]: value,
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/institution/terminology', { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Terminology Configuration · Platform Configuration" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD] border border-[#0B3A67]/20">
                                Institution Default → Entity Override → College Override
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Terminology Configuration
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Define institution-wide defaults and scoped overrides for labels across Entities and Colleges while internal database schemas remain generic and reusable.
                        </p>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="bg-[#0B3A67] text-white hover:bg-[#082847] font-bold text-xs rounded-xl shadow-xs shrink-0"
                    >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        {processing ? 'Saving...' : 'Save All Terminology Mappings'}
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {TERMS_CATALOG.map((item) => (
                        <div
                            key={item.key}
                            className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#0B3A67]/10 text-[#0B3A67] dark:text-[#93C5FD]">
                                    <LucideMessageSquareText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{item.title}</h3>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">
                                        Institution Default
                                    </label>
                                    <input
                                        type="text"
                                        value={data.terminology[item.key]?.default || item.fallback}
                                        onChange={(e) => handleUpdate(item.key, 'default', e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD]">
                                        CIDS Override
                                    </label>
                                    <input
                                        type="text"
                                        value={data.terminology[item.key]?.cids || data.terminology[item.key]?.default || item.fallback}
                                        onChange={(e) => handleUpdate(item.key, 'cids', e.target.value)}
                                        className="w-full rounded-xl border border-[#0B3A67]/20 bg-[#0B3A67]/5 px-3 py-2 text-xs font-semibold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-blue-500">
                                        COE (Engineering) Override
                                    </label>
                                    <input
                                        type="text"
                                        value={data.terminology[item.key]?.coe || data.terminology[item.key]?.default || item.fallback}
                                        onChange={(e) => handleUpdate(item.key, 'coe', e.target.value)}
                                        className="w-full rounded-xl border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs font-semibold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-emerald-500">
                                        CED (Education) Override
                                    </label>
                                    <input
                                        type="text"
                                        value={data.terminology[item.key]?.ced || data.terminology[item.key]?.default || item.fallback}
                                        onChange={(e) => handleUpdate(item.key, 'ced', e.target.value)}
                                        className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </form>
            </div>
        </AppLayout>
    );
}
