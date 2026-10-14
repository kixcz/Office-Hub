import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    FileText,
    Download,
    Calendar,
    Folder,
    FileCheck,
    CheckCircle2
} from 'lucide-react';

interface Props {
    faculty: any;
    documents: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Documents', href: '/faculty/documents' },
];

export default function FacultyDocumentsPage({ faculty, documents = [] }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Documents - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Faculty Document Archive</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Access official submitted documents, certificates, syllabi, TOS/TQ files, and authorized records.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {documents.length > 0 ? (
                        documents.map((doc) => (
                            <div key={doc.id} className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        Verified
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-foreground leading-snug">
                                        {doc.requirement?.title || 'Academic Output Document'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Type: {doc.requirement?.document_type || 'General'}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        {doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString() : '—'}
                                    </span>
                                    <a
                                        href={`/storage/${doc.file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:underline font-bold flex items-center gap-1"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
                            No stored documents currently available in your faculty archive.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
