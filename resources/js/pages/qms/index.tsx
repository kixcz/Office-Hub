import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { IsoDocumentHeader } from '@/components/qms/iso-document-header';
import {
    ShieldCheck,
    FileText,
    FileCode,
    CheckCircle2,
    Clock,
    AlertCircle,
    Archive,
    Search,
    Filter,
    Plus,
    Building2,
    SlidersHorizontal,
    History,
    Layers,
    ArrowUpRight,
    Check,
    X,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface QmsDocumentItem {
    id: number;
    document_code: string;
    title: string;
    scope: string;
    status: string;
    confidentiality: string;
    college?: {
        name: string;
        code: string;
    };
    document_type?: {
        name: string;
        code: string;
    };
    active_revision?: {
        revision_number: string;
        effective_date: string;
        status: string;
    };
    creator?: {
        name: string;
    };
}

interface Props {
    metrics: {
        total_controlled_documents: number;
        pending_registrations: number;
        revision_requests: number;
        obsolete_documents: number;
    };
    documents: {
        data: QmsDocumentItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    pendingRequests: QmsDocumentItem[];
    documentTypes: Array<{ id: number; name: string; code: string; prefix: string }>;
    codeRules: Array<{ id: number; name: string; scope: string; format_pattern: string }>;
    colleges: Array<{ id: number; name: string; code: string }>;
    auditLogs: Array<any>;
    filters: {
        college_id?: number | string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Governance & Quality', href: '/qms' },
    { title: 'ISO Document Control', href: '/qms' },
];

export default function QmsMasterRegisterPage({
    metrics,
    documents,
    pendingRequests = [],
    documentTypes = [],
    codeRules = [],
    colleges = [],
    auditLogs = [],
    filters,
}: Props) {
    const [selectedCollege, setSelectedCollege] = useState<string>(filters?.college_id?.toString() || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('register');
    const [previewDoc, setPreviewDoc] = useState<QmsDocumentItem | null>(null);

    const handleFilterCollege = (val: string) => {
        setSelectedCollege(val);
        router.get('/qms', val === 'all' ? {} : { college_id: val }, { preserveState: true });
    };

    const handleTransition = (docId: number, action: string, remarks: string = '') => {
        router.post(`/qms/documents/${docId}/transition`, {
            action,
            remarks,
        });
    };

    const filteredDocs = documents.data.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.document_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="University Document Control - ISO 9001:2026" />

            <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
                {/* 1. Header as specified in prompt */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" />
                            ISO 9001:2026 Quality Management System
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight mt-1">
                            University Document Control
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Institution QMS Administrator · Master Document Register, Code Rules, Governance and Delegated College Scope.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={selectedCollege} onValueChange={handleFilterCollege}>
                            <SelectTrigger className="w-[180px] h-9 text-xs">
                                <SelectValue placeholder="All Colleges" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Colleges / Scope</SelectItem>
                                {colleges.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.code} - {c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" onClick={() => setActiveTab('rules')} className="text-xs font-bold gap-1.5 h-9">
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Manage Rules
                        </Button>
                    </div>
                </div>

                {/* 2. Top Metric Cards (1,284 Controlled Documents, 32 Pending Registrations, 47 Revision Requests, 18 Obsolete Documents) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Controlled Documents */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs relative overflow-hidden">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Controlled Documents
                        </div>
                        <div className="text-4xl font-black text-foreground tracking-tight mt-2">
                            {metrics.total_controlled_documents.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Active approved templates & policies
                        </p>
                    </div>

                    {/* Pending Registrations */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs relative overflow-hidden">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Pending Registrations
                        </div>
                        <div className="text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                            {metrics.pending_registrations}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            New documents awaiting QMS coding
                        </p>
                    </div>

                    {/* Revision Requests */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs relative overflow-hidden">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Revision Requests
                        </div>
                        <div className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-2">
                            {metrics.revision_requests}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                            Modifications in approval workflow
                        </p>
                    </div>

                    {/* Obsolete Documents */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs relative overflow-hidden">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Obsolete Documents
                        </div>
                        <div className="text-4xl font-black text-slate-500 tracking-tight mt-2">
                            {metrics.obsolete_documents}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            <Archive className="w-3.5 h-3.5 text-slate-400" />
                            Superseded or retired versions
                        </p>
                    </div>
                </div>

                {/* 3. Main Tabs Navigation */}
                <div className="space-y-6">
                    <div className="bg-muted p-1 rounded-xl inline-flex flex-wrap gap-1 border border-border">
                        <button
                            type="button"
                            onClick={() => setActiveTab('register')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'register' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" /> Master Document Register
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('pending')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'pending' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" /> Recent Registration Requests ({pendingRequests.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('rules')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'rules' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Coding Rules & Prefixes
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('audit')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'audit' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <History className="w-3.5 h-3.5" /> Audit Trail & QMS Reports
                        </button>
                    </div>

                    {/* TAB 1: Master Document Register */}
                    {activeTab === 'register' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by code or title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                                        <tr>
                                            <th className="p-3.5 pl-5">Document Code</th>
                                            <th className="p-3.5">Document Title</th>
                                            <th className="p-3.5">Office / College</th>
                                            <th className="p-3.5">Type</th>
                                            <th className="p-3.5">Revision</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5 text-right pr-5">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {filteredDocs.length > 0 ? (
                                            filteredDocs.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-3.5 pl-5 font-mono font-bold text-primary">
                                                        {doc.document_code}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-foreground">
                                                        {doc.title}
                                                    </td>
                                                    <td className="p-3.5 font-medium text-muted-foreground">
                                                        {doc.college ? doc.college.code : 'Institution-wide'}
                                                    </td>
                                                    <td className="p-3.5 text-muted-foreground">
                                                        {doc.document_type?.name}
                                                    </td>
                                                    <td className="p-3.5 font-mono text-muted-foreground">
                                                        Rev. {doc.active_revision?.revision_number || '01'}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                            {doc.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right pr-5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setPreviewDoc(doc)}
                                                            className="h-7 text-xs font-bold text-primary hover:bg-primary/10"
                                                        >
                                                            Preview Header
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                                                    No documents found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* TAB 2: Recent Registration Requests */}
                    {activeTab === 'pending' && (
                    <div className="space-y-4">
                        <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h3 className="text-sm font-extrabold text-foreground">
                                    Recent Registration Requests (All Colleges)
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Items awaiting Document Controller code assignment or review.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                                        <tr>
                                            <th className="p-3.5 pl-5">Document</th>
                                            <th className="p-3.5">Office</th>
                                            <th className="p-3.5">Allocated Code</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5 text-right pr-5">Controller Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {pendingRequests.length > 0 ? (
                                            pendingRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-3.5 pl-5">
                                                        <div className="font-bold text-foreground">{req.title}</div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {req.document_type?.name} · Requested by {req.creator?.name || 'Faculty'}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 font-bold text-muted-foreground">
                                                        {req.college ? req.college.code : 'Admin'}
                                                    </td>
                                                    <td className="p-3.5 font-mono text-primary font-bold">
                                                        {req.document_code}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                                                            {req.status === 'draft' ? 'For Coding' : 'For Review'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right pr-5 space-x-1">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleTransition(req.id, 'validate_code')}
                                                            className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            <Check className="w-3 h-3 mr-1" /> Validate Code
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleTransition(req.id, 'return')}
                                                            className="h-7 text-xs font-bold text-amber-600"
                                                        >
                                                            <RotateCcw className="w-3 h-3 mr-1" /> Return
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                                                    No pending registration requests in the queue.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* TAB 3: Coding Rules & Prefixes */}
                    {activeTab === 'rules' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Rules Card */}
                            <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs space-y-4">
                                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                                    Active Document Code Rules
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Format patterns configured for automatic and consistent document identifier generation.
                                </p>

                                <div className="space-y-3">
                                    {codeRules.map(rule => (
                                        <div key={rule.id} className="p-3.5 rounded-xl border border-border bg-muted/20">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground">{rule.name}</span>
                                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                                    {rule.scope}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 font-mono text-xs text-primary font-extrabold bg-primary/5 p-2 rounded border border-primary/10">
                                                {rule.format_pattern}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Document Types Card */}
                            <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs space-y-4">
                                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                                    <FileCode className="w-4 h-4 text-primary" />
                                    Approved Document Classifications (Types)
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Standard document acronyms utilized across institutional and collegiate scopes.
                                </p>

                                <div className="grid grid-cols-2 gap-2.5">
                                    {documentTypes.map(type => (
                                        <div key={type.id} className="p-2.5 rounded-lg border border-border bg-muted/10 flex items-center justify-between">
                                            <div>
                                                <span className="font-mono font-bold text-primary text-xs mr-2">{type.code}</span>
                                                <span className="text-xs font-semibold text-foreground">{type.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* TAB 4: Audit Trail */}
                    {activeTab === 'audit' && (
                    <div className="space-y-4">
                        <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h3 className="text-sm font-extrabold text-foreground">
                                    QMS Document Control Audit Trail
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Immutable historical log of all creation, transition, review, and obsolescence events.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                                        <tr>
                                            <th className="p-3 pl-5">Timestamp</th>
                                            <th className="p-3">User</th>
                                            <th className="p-3">Document Code</th>
                                            <th className="p-3">Action</th>
                                            <th className="p-3 pr-5">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {auditLogs.length > 0 ? (
                                            auditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-3 pl-5 font-mono text-muted-foreground">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 font-medium text-foreground">
                                                        {log.user?.name || 'System'}
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-primary">
                                                        {log.document?.document_code || '—'}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                                            {log.action}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 pr-5 text-muted-foreground">
                                                        {log.remarks || '—'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                                                    No audit trail events logged.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* Modal: Preview ISO Document Header */}
            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Official Controlled Document Header
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Standardized header layout conforming to ISO 9001:2026 documented information guidelines.
                        </DialogDescription>
                    </DialogHeader>

                    {previewDoc && (
                        <div className="pt-2">
                            <IsoDocumentHeader
                                documentTitle={previewDoc.title}
                                documentCode={previewDoc.document_code}
                                revisionNumber={`Rev. ${previewDoc.active_revision?.revision_number || '01'}`}
                                effectiveDate={previewDoc.active_revision?.effective_date}
                                status={previewDoc.status}
                                collegeName={previewDoc.college ? previewDoc.college.name : 'ALL COLLEGES & OFFICES'}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
