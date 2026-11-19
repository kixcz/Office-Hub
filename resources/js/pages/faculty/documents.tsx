import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { IsoDocumentHeader } from '@/components/qms/iso-document-header';
import {
    FileText,
    Download,
    Calendar,
    Folder,
    FileCheck,
    CheckCircle2,
    Plus,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ShieldCheck,
    FileCode,
    Sparkles,
    Search,
    ExternalLink,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface QmsDocument {
    id: number;
    title: string;
    document_code: string;
    document_type_id: number;
    college_id?: number;
    scope: string;
    status: string;
    active_revision?: {
        id: number;
        revision_number: string;
        effective_date: string;
    };
    document_type?: {
        name: string;
        code: string;
    };
}

interface QmsInstance {
    id: number;
    record_reference: string;
    title: string;
    status: string;
    created_at: string;
    document: {
        title: string;
        document_code: string;
        document_type?: {
            name: string;
        };
    };
    revision?: {
        revision_number: string;
    };
    file_path?: string;
}

interface Props {
    faculty: any;
    metrics: {
        submissions: number;
        in_review: number;
        completed: number;
    };
    templates: QmsDocument[];
    instances: QmsInstance[];
    documents: any[]; // legacy submissions
    documentTypes: Array<{ id: number; name: string; code: string }>;
    colleges: Array<{ id: number; name: string; code: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Documents', href: '/faculty/documents' },
];

export default function FacultyDocumentsPage({
    faculty,
    metrics = { submissions: 12, in_review: 2, completed: 10 },
    templates = [],
    instances = [],
    documents = [],
    documentTypes = [],
    colleges = [],
}: Props) {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedTemplateForUse, setSelectedTemplateForUse] = useState<QmsDocument | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form for Requesting Code
    const { data: codeData, setData: setCodeData, post: postCodeRequest, processing: isSubmittingCode, reset: resetCodeForm } = useForm({
        title: '',
        document_type_id: documentTypes[0]?.id?.toString() || '1',
        college_id: faculty?.program?.college_id?.toString() || '1',
        scope: 'college',
        description: '',
        confidentiality: 'internal',
        review_cycle_months: 12,
        change_summary: 'Initial draft registration request.',
    });

    const handleRequestCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCodeRequest('/qms/request-code', {
            onSuccess: () => {
                setIsRequestModalOpen(false);
                resetCodeForm();
            },
        });
    };

    // Form for "Use" template (instantiating a record)
    const { data: instanceData, setData: setInstanceData, post: postInstance, processing: isRecordingInstance, reset: resetInstanceForm } = useForm({
        document_id: 0,
        title: '',
        file_path: '',
    });

    const handleUseTemplate = (template: QmsDocument) => {
        setSelectedTemplateForUse(template);
        setInstanceData({
            document_id: template.id,
            title: `${faculty ? `${faculty.first_name} ${faculty.last_name}` : 'Faculty'} - ${template.title}`,
            file_path: '',
        });
    };

    const handleConfirmInstance = (e: React.FormEvent) => {
        e.preventDefault();
        postInstance('/qms/instances', {
            onSuccess: () => {
                setSelectedTemplateForUse(null);
                resetInstanceForm();
            },
        });
    };

    const filteredTemplates = templates.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.document_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Documents - Faculty Self-Service" />

            <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1500px] mx-auto">
                {/* 1. Header with Title & Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" />
                            ISO 9001:2026 Controlled Faculty Records
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight mt-1">
                            My Documents
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Faculty Self-Service · Use approved controlled templates, track submitted records, and request document codes.
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Request Code
                    </Button>
                </div>

                {/* 2. Top Metric Cards (Submissions, In Review, Completed) as requested */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Submissions */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs relative overflow-hidden">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Submissions
                        </div>
                        <div className="text-4xl font-black text-foreground tracking-tight mt-2">
                            {metrics.submissions}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            Total documented records prepared
                        </p>
                    </div>

                    {/* In Review */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs relative overflow-hidden">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            In Review
                        </div>
                        <div className="text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-2">
                            {metrics.in_review}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Under review / endorsement
                        </p>
                    </div>

                    {/* Completed */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs relative overflow-hidden">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Completed
                        </div>
                        <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                            {metrics.completed}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Approved & verified records
                        </p>
                    </div>
                </div>

                {/* 3. Approved Document Templates Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-primary" />
                                Approved Document Templates
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Official standardized forms and SOP templates currently active and in force.
                            </p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search template..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTemplates.length > 0 ? (
                            filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="bg-card rounded-2xl border border-border hover:border-primary/40 transition-all p-5 shadow-2xs flex flex-col justify-between group space-y-4"
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-2">
                                            <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                                {template.document_code}
                                            </span>
                                            <span className="font-mono text-[11px] font-medium text-muted-foreground">
                                                Rev. {template.active_revision?.revision_number || '01'}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                                            {template.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {template.document_type?.name || 'Controlled Form'} · Scope: {template.scope.toUpperCase()}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                                        <span className="text-[11px] text-muted-foreground font-mono">
                                            {template.active_revision?.effective_date ? `Eff: ${template.active_revision.effective_date}` : 'Active'}
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => handleUseTemplate(template)}
                                            className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs h-8 px-4 rounded-lg transition-all"
                                        >
                                            Use
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-10 text-center bg-card rounded-2xl border border-border text-xs text-muted-foreground">
                                No approved templates found matching query.
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Submissions History / Controlled Records */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                            <Folder className="w-5 h-5 text-primary" />
                            Controlled Record Submissions & Instances
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Individual submissions inheriting ISO document codes and unique record references.
                        </p>
                    </div>

                    <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                                    <tr>
                                        <th className="p-3.5 pl-5">Record Ref</th>
                                        <th className="p-3.5">Document Title & Code</th>
                                        <th className="p-3.5">Revision</th>
                                        <th className="p-3.5">Date Created</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5 text-right pr-5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {instances.length > 0 ? (
                                        instances.map((inst) => (
                                            <tr key={inst.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3.5 pl-5 font-mono font-bold text-primary">
                                                    {inst.record_reference}
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-bold text-foreground">{inst.title}</div>
                                                    <div className="text-[11px] font-mono text-muted-foreground">
                                                        Template: {inst.document?.document_code}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 font-mono text-muted-foreground">
                                                    Rev. {inst.revision?.revision_number || '01'}
                                                </td>
                                                <td className="p-3.5 font-mono text-muted-foreground">
                                                    {inst.created_at ? new Date(inst.created_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                                                        inst.status === 'completed' || inst.status === 'approved'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                                    }`}>
                                                        {inst.status}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-right pr-5">
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs font-bold gap-1 text-primary">
                                                        <FileText className="w-3.5 h-3.5" /> Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                                                No controlled record instances logged yet. Click "Use" on an approved template above to initiate.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Request Document Code */}
            <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-primary" />
                            Request ISO Document Code Registration
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Submit a document for formal QMS coding and review. Codes will be generated atomically following official institutional rules.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRequestCodeSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <Label htmlFor="doc-title" className="text-xs">Document Title *</Label>
                            <Input
                                id="doc-title"
                                placeholder="e.g. Faculty Consultation Record Form"
                                value={codeData.title}
                                onChange={(e) => setCodeData('title', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Document Type *</Label>
                                <Select
                                    value={codeData.document_type_id}
                                    onValueChange={(val) => setCodeData('document_type_id', val)}
                                >
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.code} - {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Scope *</Label>
                                <Select
                                    value={codeData.scope}
                                    onValueChange={(val) => setCodeData('scope', val)}
                                >
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="college">College Level</SelectItem>
                                        <SelectItem value="program">Program Level</SelectItem>
                                        <SelectItem value="operational">Operational / Lab</SelectItem>
                                        <SelectItem value="institution">University-wide</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="doc-desc" className="text-xs">Purpose & Description</Label>
                            <Textarea
                                id="doc-desc"
                                placeholder="Briefly state the intended purpose of this controlled document..."
                                rows={3}
                                value={codeData.description}
                                onChange={(e) => setCodeData('description', e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsRequestModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmittingCode} className="font-bold">
                                {isSubmittingCode ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Use Approved Template (Create Instance) */}
            <Dialog open={!!selectedTemplateForUse} onOpenChange={(open) => !open && setSelectedTemplateForUse(null)}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Complete Record with Controlled Header
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            This record will inherit the official ISO code and revision from the template.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTemplateForUse && (
                        <div className="space-y-4 pt-1">
                            <IsoDocumentHeader
                                documentTitle={selectedTemplateForUse.title}
                                documentCode={selectedTemplateForUse.document_code}
                                revisionNumber={`Rev. ${selectedTemplateForUse.active_revision?.revision_number || '01'}`}
                                effectiveDate={selectedTemplateForUse.active_revision?.effective_date}
                                recordReference="[AUTO-ALLOCATED]"
                                status="active"
                            />

                            <form onSubmit={handleConfirmInstance} className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Record Label / Output Title</Label>
                                    <Input
                                        value={instanceData.title}
                                        onChange={(e) => setInstanceData('title', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground">
                                    <p className="font-semibold text-foreground">Standardized Association:</p>
                                    <p className="mt-0.5">
                                        Submitting this form logs a controlled record under your faculty profile with an immutable reference code and links it to the QMS Master Register.
                                    </p>
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSelectedTemplateForUse(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isRecordingInstance} className="font-bold">
                                        {isRecordingInstance ? 'Generating...' : 'Confirm & Generate Record'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
