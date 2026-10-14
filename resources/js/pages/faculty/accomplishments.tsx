import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Trophy,
    Plus,
    Calendar,
    Paperclip,
    Award,
    CheckCircle2
} from 'lucide-react';

interface Props {
    faculty: any;
    accomplishments: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Accomplishments', href: '/faculty/accomplishments' },
];

export default function FacultyAccomplishmentsPage({ faculty, accomplishments = [] }: Props) {
    const [isCreating, setIsCreating] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        title: '',
        category: 'research',
        date_achieved: '',
        description: '',
        proof_file: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/faculty/accomplishments', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Accomplishments - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Personal Accomplishment Records</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Document certifications, research awards, publication milestones, and verified service accomplishments.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCreating ? 'Cancel' : 'Record Accomplishment'}</span>
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                        <h3 className="text-sm font-bold text-foreground mb-4">Record New Accomplishment</h3>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-w-2xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-foreground block mb-1">Title of Achievement</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. Published Scopus Paper on Educational AI"
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-foreground block mb-1">Category</label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    >
                                        <option value="research">Research Output / Publication</option>
                                        <option value="certification">Professional Certification</option>
                                        <option value="award">Academic Award / Distinction</option>
                                        <option value="seminar">Seminar / Resource Speaker</option>
                                        <option value="other">Institutional Service Contribution</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-foreground block mb-1">Date Achieved</label>
                                    <input
                                        type="date"
                                        value={data.date_achieved}
                                        onChange={(e) => setData('date_achieved', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-foreground block mb-1">Proof File / Certificate</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setData('proof_file', e.target.files?.[0] || null)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-foreground block mb-1">Description & Verification Notes</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    placeholder="Provide bibliographic details, issuing organization, or program context..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-2xs cursor-pointer"
                            >
                                Save Accomplishment
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {accomplishments.length > 0 ? (
                        accomplishments.map((a) => (
                            <div key={a.id} className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                                        {a.category}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-semibold">
                                        {a.date_achieved}
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-foreground">{a.title}</h3>
                                {a.description && (
                                    <p className="text-xs text-muted-foreground">{a.description}</p>
                                )}
                                <div className="pt-2 border-t border-border/50 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified for Institutional Reporting
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
                            No accomplishments recorded yet. Click "Record Accomplishment" to document your achievements.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
