import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import {
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    Globe,
    Mail,
    MapPin,
    Save,
    Shield,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileData {
    name: string;
    acronym: string;
    address: string;
    timezone: string;
    email: string;
    website: string;
    logo_url: string;
    report_header: string;
    report_footer: string;
}

interface Props {
    profile: ProfileData;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Institution Governance', href: '/institution/dashboard' },
    { title: 'Institution Management', href: '/institution/profile' },
    { title: 'Institution Profile', href: '/institution/profile' },
];

export default function InstitutionProfile({ profile }: Props) {
    const { data, setData, put, processing } = useForm({
        name: profile.name,
        acronym: profile.acronym,
        address: profile.address,
        timezone: profile.timezone,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/institution/profile');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Institution Profile · Platform Governance" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Institution Profile & Identity</h1>
                    <p className="text-sm text-muted-foreground">
                        Global identity, official address, time standards, and reporting letterheads inherited by all colleges.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Identity Card */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-2 flex items-center justify-center overflow-hidden shadow-md">
                            <img
                                src={profile.logo_url}
                                alt="Institutional Seal"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                            <Building2 className="w-10 h-10 text-amber-500 hidden" />
                        </div>

                        <div>
                            <h3 className="font-extrabold text-base">{data.name}</h3>
                            <span className="inline-block mt-1 px-3 py-1 text-xs font-mono font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {data.acronym}
                            </span>
                        </div>

                        <div className="w-full text-xs text-muted-foreground space-y-2 pt-4 border-t border-border/60 text-left">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="line-clamp-2">{data.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{data.timezone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{profile.website}</span>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="text-base font-bold">Institutional Configuration Parameters</h3>

                            <div className="space-y-1">
                                <label className="text-xs font-bold">Full Legal Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold">Acronym / Abbreviation *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.acronym}
                                        onChange={(e) => setData('acronym', e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold">System Timezone *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.timezone}
                                        onChange={(e) => setData('timezone', e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold">Official Campus Address *</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                                <h4 className="text-xs font-bold flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                                    Standard Global Report Layout Block
                                </h4>
                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground block">Report Header Letterhead:</span>
                                    <p className="text-xs font-mono bg-background p-2 rounded-lg border border-border/60">
                                        {profile.report_header}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground block">Accreditation Footer Notice:</span>
                                    <p className="text-xs font-mono bg-background p-2 rounded-lg border border-border/60">
                                        {profile.report_footer}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-3">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl shadow-xs"
                                >
                                    <Save className="w-3.5 h-3.5 mr-1.5" />
                                    {processing ? 'Saving...' : 'Save Institution Profile'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
