import React, { useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    LibraryBig,
    Upload,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Check
} from 'lucide-react';

interface Props {
    faculty: any;
    items: Array<any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Requirements', href: '/faculty/requirements' },
];

export default function FacultyRequirementsPage({ faculty, items = [] }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const triggerUpload = (reqId: number) => {
        setSelectedReqId(reqId);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedReqId) {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('file', file);
            router.post(`/faculty/requirements/${selectedReqId}/submit`, formData, {
                onFinish: () => {
                    setIsSubmitting(false);
                    setSelectedReqId(null);
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Requirements - Document Compliance" />

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.xlsx,.doc"
            />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Required Academic Outputs</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Documentary requirements published for your program and academic period. Upload documents directly for review.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map(({ requirement: req, submission: sub, status, is_overdue }) => (
                        <div
                            key={req.id}
                            className="bg-card rounded-2xl border border-border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                        {req.document_type}
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            status === 'accepted' || status === 'approved'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : status === 'submitted'
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                : is_overdue
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {status === 'submitted' ? 'Pending Review' : status}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-foreground leading-snug">{req.title}</h3>
                                    {req.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                                    )}
                                </div>

                                <div className="text-[11px] text-muted-foreground space-y-1 font-medium pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Due: {new Date(req.due_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Accepted: {req.accepted_format || 'PDF, DOCX, XLSX'}</span>
                                    </div>
                                    {sub?.reviewer_comments && (
                                        <div className="text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                            Feedback: {sub.reviewer_comments}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => triggerUpload(req.id)}
                                disabled={isSubmitting}
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{sub ? 'Upload New Revision' : 'Upload Output Document'}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
