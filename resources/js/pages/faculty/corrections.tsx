import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Inbox,
    Plus,
    Check,
    Calendar,
    Paperclip,
    AlertCircle,
    Clock,
    FileText
} from 'lucide-react';

interface Props {
    faculty: any;
    corrections: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'Requests & Corrections', href: '/faculty/corrections' },
];

export default function FacultyCorrectionsPage({ faculty, corrections }: Props) {
    const list = corrections?.data || [];
    const [isCreating, setIsCreating] = useState(false);

    const { data, setData, post, processing, reset, recentlySuccessful } = useForm({
        type: 'attendance',
        title: '',
        explanation: '',
        affected_date: '',
        affected_session: '',
        attachment: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/faculty/corrections', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Requests & Corrections - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Requests & Corrections</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Submit formal requests for attendance dispute adjustments, teaching schedule changes, workload reviews, and profile updates.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCreating ? 'Cancel' : 'New Correction Request'}</span>
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                        <h3 className="text-sm font-bold text-foreground mb-4">File Formal Adjustment Request</h3>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-w-2xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-foreground block mb-1">Request Category</label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    >
                                        <option value="attendance">Attendance Record Correction</option>
                                        <option value="schedule">Teaching Schedule Change</option>
                                        <option value="workload">Workload Credit Review</option>
                                        <option value="profile">Profile Qualification Update</option>
                                        <option value="other">Other Administrative Request</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-foreground block mb-1">Request Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. Official Travel during Oct 12 Session"
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-foreground block mb-1">Affected Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={data.affected_date}
                                        onChange={(e) => setData('affected_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-foreground block mb-1">Affected Class Session (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.affected_session}
                                        onChange={(e) => setData('affected_session', e.target.value)}
                                        placeholder="e.g. IT 301 - BSIT 3A (1:00 PM)"
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-foreground block mb-1">Detailed Explanation & Justification</label>
                                <textarea
                                    value={data.explanation}
                                    onChange={(e) => setData('explanation', e.target.value)}
                                    rows={4}
                                    placeholder="Explain the circumstances and reference the authorized offline activity, locator slip, or travel order..."
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-bold text-foreground block mb-1">Supporting Document / Proof File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('attachment', e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-2xs cursor-pointer"
                            >
                                Submit Request for Review
                            </button>
                        </form>
                    </div>
                )}

                {/* Correction requests history table */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
                    <div className="p-5 border-b border-border/60">
                        <h3 className="text-sm font-bold text-foreground">Submitted Correction & Review Requests</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="p-3.5 font-bold">Category</th>
                                    <th className="p-3.5 font-bold">Title</th>
                                    <th className="p-3.5 font-bold">Affected Date/Session</th>
                                    <th className="p-3.5 font-bold">Status</th>
                                    <th className="p-3.5 font-bold">Reviewer Feedback</th>
                                    <th className="p-3.5 font-bold">Submitted Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-medium">
                                {list.length > 0 ? (
                                    list.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-muted/30">
                                            <td className="p-3.5 font-bold uppercase text-[10px] text-muted-foreground">
                                                {c.type}
                                            </td>
                                            <td className="p-3.5 font-bold text-foreground">{c.title}</td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {c.affected_date || c.affected_session || 'General'}
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    c.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : c.status === 'rejected'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {c.reviewer_notes || 'Pending administrator review'}
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No correction requests filed.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
