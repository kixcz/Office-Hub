import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Trophy, FileText, Download, Plus, Search, MoreVertical, Edit, Trash, Eye, 
    CheckCircle2, AlertCircle, Clock, Cloud, FolderTree, ShieldCheck, ExternalLink, RefreshCw 
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';
import { Button } from '@/components/ui/button';

interface FacultyInfo {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    academic_rank: string | null;
    program?: {
        id: number;
        name: string;
        code: string;
    } | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    faculty?: FacultyInfo | null;
}

interface Accomplishment {
    id: number;
    title: string;
    subtitle?: string | null;
    category: string;
    date_achieved: string;
    description: string | null;
    proof_file_path: string | null;
    status: string;
    points?: number;
    verified_by?: string | null;
    verified_at?: string | null;
    return_reason?: string | null;
    user: User;
    // Multi-dimensional fields
    functional_area?: string | null;
    scope?: string | null;
    role?: string | null;
    issuing_organization?: string | null;
    event_title?: string | null;
    venue?: string | null;
    duration?: string | null;
    credential_number?: string | null;
    expiration_date?: string | null;
    // Google Drive integration
    google_drive_file_id?: string | null;
    google_drive_folder_id?: string | null;
    google_drive_path?: string | null;
    google_drive_web_link?: string | null;
    file_checksum?: string | null;
    file_size_bytes?: number | null;
    version?: number;
}

interface Props {
    accomplishments: Accomplishment[];
    is_admin: boolean;
    user_permissions?: {
        is_super_admin: boolean;
        is_dean: boolean;
        is_program_head: boolean;
        can_verify: boolean;
    };
}

export default function AccomplishmentsIndex({ accomplishments, is_admin, user_permissions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Faculty Accomplishments', href: '/accomplishments' },
    ];

    const canVerify = user_permissions?.can_verify ?? is_admin;
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [areaFilter, setAreaFilter] = useState('all');

    const [viewingAcc, setViewingAcc] = useState<Accomplishment | null>(null);
    const [returningAcc, setReturningAcc] = useState<Accomplishment | null>(null);
    const [returnReason, setReturnReason] = useState('');
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const [deletingAcc, setDeletingAcc] = useState<Accomplishment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter accomplishments
    const filteredAccomplishments = accomplishments.filter(acc => {
        const matchesSearch = 
            acc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (acc.description && acc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (acc.credential_number && acc.credential_number.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
        const matchesArea = areaFilter === 'all' || acc.functional_area === areaFilter;

        return matchesSearch && matchesStatus && matchesArea;
    });

    const handleVerify = (acc: Accomplishment) => {
        if (!confirm(`Verify accomplishment "${acc.title}" submitted by ${acc.user?.name}? This will record official institutional evidence approval.`)) {
            return;
        }

        router.post(`/accomplishments/${acc.id}/verify`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (viewingAcc?.id === acc.id) {
                    setViewingAcc(null);
                }
            }
        });
    };

    const handleOpenReturnModal = (acc: Accomplishment) => {
        setReturningAcc(acc);
        setReturnReason('');
    };

    const handleConfirmReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!returningAcc || !returnReason.trim()) return;

        setIsSubmittingReturn(true);
        router.post(`/accomplishments/${returningAcc.id}/return`, {
            return_reason: returnReason.trim(),
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsSubmittingReturn(false);
                setReturningAcc(null);
                setReturnReason('');
                if (viewingAcc?.id === returningAcc.id) {
                    setViewingAcc(null);
                }
            }
        });
    };

    const confirmDeleteAcc = () => {
        if (!deletingAcc) return;
        setIsDeleting(true);
        router.delete(`/accomplishments/${deletingAcc.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingAcc(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Institutional Accomplishments Repository" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-foreground">Accomplishments Repository</h1>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                <Cloud className="w-3 h-3" />
                                Google Drive Synced
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Review, verify, and monitor institutional evidence across Instruction, Research, Extension, and Professional Development.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {user_permissions?.is_program_head && (
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Department Program Head Workspace
                            </span>
                        )}
                        {user_permissions?.is_dean && (
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                College Dean Oversight
                            </span>
                        )}
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[130px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="for_verification">For Verification</option>
                            <option value="verified">Verified</option>
                            <option value="returned">Returned</option>
                        </select>

                        {/* Functional Area Filter */}
                        <select
                            value={areaFilter}
                            onChange={(e) => setAreaFilter(e.target.value)}
                            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[150px]"
                        >
                            <option value="all">All Functional Areas</option>
                            <option value="Instruction">Instruction</option>
                            <option value="Research">Research</option>
                            <option value="Extension">Extension</option>
                            <option value="Professional Development">Professional Development</option>
                            <option value="Award / Recognition">Award / Recognition</option>
                            <option value="Certification">Certification</option>
                            <option value="Administration">Administration</option>
                        </select>
                    </div>

                    <div className="relative min-w-[240px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by title, faculty, credential..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-border bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                        />
                    </div>
                </div>

                {/* Accomplishments Data Table */}
                <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-2xs flex-1 overflow-hidden">
                    {filteredAccomplishments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <Trophy className="h-12 w-12 text-muted-foreground/40 mb-3" />
                            <h3 className="text-sm font-bold">No accomplishments found</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                No records match the selected status or search query.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border font-bold">
                                    <tr>
                                        <th scope="col" className="px-5 py-3.5 min-w-[260px]">Accomplishment & Faculty</th>
                                        <th scope="col" className="px-4 py-3.5">Classification & Scope</th>
                                        <th scope="col" className="px-4 py-3.5">Date & Duration</th>
                                        <th scope="col" className="px-4 py-3.5">Institutional Drive Evidence</th>
                                        <th scope="col" className="px-4 py-3.5">Status</th>
                                        <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredAccomplishments.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-muted/40 transition-colors">
                                            {/* Title & Faculty */}
                                            <td className="px-5 py-4">
                                                <div className="font-extrabold text-foreground text-sm leading-snug">
                                                    {acc.title}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{acc.user?.name}</span>
                                                    {acc.user?.faculty?.program && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] font-bold">
                                                                {acc.user.faculty.program.code}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {acc.issuing_organization && (
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        Org: <span className="font-medium text-foreground">{acc.issuing_organization}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Classification & Scope */}
                                            <td className="px-4 py-4 space-y-1">
                                                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    {acc.functional_area || acc.category}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <span>Scope:</span>
                                                    <span className="font-bold text-foreground">{acc.scope || 'Institutional'}</span>
                                                </div>
                                                {acc.role && (
                                                    <div className="text-[10px] text-muted-foreground">
                                                        Role: <span className="font-medium text-foreground">{acc.role}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Date & Duration */}
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-foreground">
                                                    {new Date(acc.date_achieved).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                {acc.duration && (
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        {acc.duration}
                                                    </div>
                                                )}
                                                {acc.points ? (
                                                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                                        {acc.points} Merit Pts
                                                    </div>
                                                ) : null}
                                            </td>

                                            {/* Google Drive Evidence */}
                                            <td className="px-4 py-4">
                                                {acc.google_drive_web_link ? (
                                                    <div className="space-y-1">
                                                        <a 
                                                            href={acc.google_drive_web_link} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 dark:text-sky-400 font-bold text-xs"
                                                        >
                                                            <Cloud className="w-3.5 h-3.5 shrink-0" />
                                                            <span>Google Drive File</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                        {acc.google_drive_path && (
                                                            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px]" title={acc.google_drive_path}>
                                                                {acc.google_drive_path}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : acc.proof_file_path ? (
                                                    <a 
                                                        href={`/storage/${acc.proof_file_path}`} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        <span>Cached Document</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-[11px]">No file attached</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-4">
                                                {acc.status === 'verified' ? (
                                                    <div className="space-y-0.5">
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Verified
                                                        </span>
                                                        {acc.verified_by && (
                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={acc.verified_by}>
                                                                by {acc.verified_by}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : acc.status === 'returned' ? (
                                                    <div className="space-y-0.5">
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            Returned
                                                        </span>
                                                        {acc.return_reason && (
                                                            <div className="text-[10px] text-rose-500 line-clamp-1 max-w-[140px]" title={acc.return_reason}>
                                                                {acc.return_reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        For Verification
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setViewingAcc(acc)}
                                                        className="h-8 px-2 text-xs font-semibold rounded-lg hover:bg-muted"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1" />
                                                        Details
                                                    </Button>

                                                    {canVerify && acc.status !== 'verified' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleVerify(acc)}
                                                            className="h-8 px-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                            Verify
                                                        </Button>
                                                    )}

                                                    {canVerify && acc.status !== 'returned' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenReturnModal(acc)}
                                                            className="h-8 px-2.5 text-xs font-bold rounded-lg text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                        >
                                                            <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                                            Return
                                                        </Button>
                                                    )}

                                                    {is_admin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeletingAcc(acc)}
                                                            className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* DETAILS MODAL */}
                <Dialog open={!!viewingAcc} onOpenChange={() => setViewingAcc(null)}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base font-black flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                <span>Institutional Evidence Record</span>
                            </DialogTitle>
                        </DialogHeader>

                        {viewingAcc && (
                            <div className="space-y-4 pt-2 text-xs">
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                                            {viewingAcc.functional_area || viewingAcc.category}
                                        </span>
                                        <span className="text-[10px] font-bold text-foreground">
                                            Submitted by: {viewingAcc.user?.name}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-extrabold text-foreground leading-snug">
                                        {viewingAcc.title}
                                    </h3>
                                    {viewingAcc.subtitle && (
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {viewingAcc.subtitle}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="p-2.5 rounded-xl border border-border bg-card">
                                        <span className="text-[10px] font-bold text-muted-foreground block">Scope</span>
                                        <span className="font-bold text-foreground mt-0.5 block truncate">
                                            {viewingAcc.scope || 'Institutional'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-xl border border-border bg-card">
                                        <span className="text-[10px] font-bold text-muted-foreground block">Role</span>
                                        <span className="font-bold text-foreground mt-0.5 block truncate">
                                            {viewingAcc.role || 'Participant'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-xl border border-border bg-card">
                                        <span className="text-[10px] font-bold text-muted-foreground block">Credit Points</span>
                                        <span className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                                            {viewingAcc.points || 0} pts
                                        </span>
                                    </div>
                                </div>

                                {/* Event & Issuer Metadata */}
                                {(viewingAcc.issuing_organization || viewingAcc.venue || viewingAcc.credential_number) && (
                                    <div className="p-3 rounded-xl border border-border bg-card space-y-1">
                                        {viewingAcc.issuing_organization && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Issuing Org:</span>
                                                <span className="font-semibold text-foreground text-right">{viewingAcc.issuing_organization}</span>
                                            </div>
                                        )}
                                        {viewingAcc.venue && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Venue:</span>
                                                <span className="font-semibold text-foreground text-right">{viewingAcc.venue}</span>
                                            </div>
                                        )}
                                        {viewingAcc.credential_number && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Credential #:</span>
                                                <span className="font-mono font-bold text-foreground text-right">{viewingAcc.credential_number}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Google Drive Storage Block */}
                                <div className="p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                            <span className="font-extrabold text-foreground text-xs">Institutional Shared Drive Evidence</span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                                            <ShieldCheck className="w-3 h-3" />
                                            v{viewingAcc.version || 1} Audited
                                        </span>
                                    </div>

                                    {viewingAcc.google_drive_path && (
                                        <div className="text-[11px] font-mono text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/60 break-all flex items-start gap-1.5">
                                            <FolderTree className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                                            <span>{viewingAcc.google_drive_path}</span>
                                        </div>
                                    )}

                                    {viewingAcc.file_checksum && (
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                            <span>SHA-256 Checksum:</span>
                                            <span className="font-mono text-foreground">{viewingAcc.file_checksum.substring(0, 16)}...</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-1">
                                        {viewingAcc.google_drive_web_link && (
                                            <a
                                                href={viewingAcc.google_drive_web_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Open in Google Drive</span>
                                            </a>
                                        )}

                                        {viewingAcc.proof_file_path && (
                                            <a
                                                href={`/storage/${viewingAcc.proof_file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-1.5 px-3 rounded-lg bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border transition-colors shadow-2xs"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Local Cached File</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Review Actions inside Modal */}
                                {canVerify && (
                                    <div className="pt-2 flex items-center gap-2">
                                        {viewingAcc.status !== 'verified' && (
                                            <Button
                                                onClick={() => handleVerify(viewingAcc)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                Verify Accomplishment
                                            </Button>
                                        )}
                                        {viewingAcc.status !== 'returned' && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleOpenReturnModal(viewingAcc)}
                                                className="flex-1 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 font-bold text-xs rounded-xl"
                                            >
                                                <AlertCircle className="w-4 h-4 mr-1.5" />
                                                Return with Reason
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setViewingAcc(null)}
                                className="font-bold text-xs rounded-xl"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* RETURN REASON MODAL */}
                <Dialog open={!!returningAcc} onOpenChange={() => setReturningAcc(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-black flex items-center gap-2 text-rose-600">
                                <AlertCircle className="w-4 h-4" />
                                <span>Return Accomplishment to Faculty</span>
                            </DialogTitle>
                        </DialogHeader>

                        {returningAcc && (
                            <form onSubmit={handleConfirmReturn} className="space-y-3 pt-2 text-xs">
                                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Accomplishment:</span>
                                    <div className="font-extrabold text-foreground text-xs mt-0.5">{returningAcc.title}</div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">Faculty: {returningAcc.user?.name}</div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground block mb-1">
                                        Audit Reason for Return <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="e.g. Incorrect scope (marked National but evidence shows Local), wrong category, insufficient proof, or duplicate submission..."
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                    />
                                    <span className="text-[10px] text-muted-foreground block mt-1">
                                        This feedback will be visible to the faculty member so they can adjust metadata or attach additional documentation.
                                    </span>
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setReturningAcc(null)}
                                        className="text-xs font-bold rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmittingReturn || !returnReason.trim()}
                                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs"
                                    >
                                        {isSubmittingReturn ? 'Returning...' : 'Confirm Return'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRM DIALOG */}
                <DeleteConfirmDialog
                    open={!!deletingAcc}
                    onOpenChange={(open) => !open && setDeletingAcc(null)}
                    title="Delete Accomplishment"
                    description="Are you sure you want to permanently delete this accomplishment record? Any uploaded certificates or proof documents will also be removed."
                    itemName={deletingAcc ? `${deletingAcc.title}` : undefined}
                    confirmLabel="Delete Accomplishment"
                    isDeleting={isDeleting}
                    onConfirm={confirmDeleteAcc}
                />
            </div>
        </AppLayout>
    );
}
