import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    FileCheck,
    FileText,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    ExternalLink
} from 'lucide-react';

interface Props {
    faculty: any;
    submissions: any;
    available_requirements: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Submissions', href: '/faculty/submissions' },
];

export default function FacultySubmissionsPage({ faculty, submissions, available_requirements = [] }: Props) {
    const list = submissions?.data || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Submissions - Status & Records" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Submission Records</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Track the review lifecycle of your submitted TOS, TQ, Syllabi, and Workload compliance files.
                        </p>
                    </div>

                    <Link
                        href="/faculty/requirements"
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs"
                    >
                        View Requirements
                    </Link>
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
                    <div className="p-5 border-b border-border/60">
                        <h3 className="text-sm font-bold text-foreground">Uploaded Documents & Review Status</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                                <tr>
                                    <th className="p-3.5 font-bold">Requirement Title</th>
                                    <th className="p-3.5 font-bold">Type</th>
                                    <th className="p-3.5 font-bold">Submission Date</th>
                                    <th className="p-3.5 font-bold">Status</th>
                                    <th className="p-3.5 font-bold">Reviewer Feedback</th>
                                    <th className="p-3.5 font-bold text-right">File</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-medium">
                                {list.length > 0 ? (
                                    list.map((sub: any) => (
                                        <tr key={sub.id} className="hover:bg-muted/30">
                                            <td className="p-3.5 font-bold text-foreground">
                                                {sub.requirement?.title || 'Academic Output'}
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {sub.requirement?.document_type || 'Document'}
                                            </td>
                                            <td className="p-3.5 font-mono text-muted-foreground">
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    sub.status === 'accepted' || sub.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : sub.status === 'revision_requested'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {sub.status === 'submitted' ? 'Pending Review' : sub.status}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {sub.reviewer_comments || 'Under administrative assessment'}
                                            </td>
                                            <td className="p-3.5 text-right">
                                                {sub.file_path ? (
                                                    <a
                                                        href={`/storage/${sub.file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                                                    >
                                                        <Download className="w-3.5 h-3.5" /> View
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground/60">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No submission records available.
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
