import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Trophy,
    Plus,
    Search,
    Download,
    Eye,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    Award,
    BookOpen,
    GraduationCap,
    HeartHandshake,
    Sparkles,
    Trash2,
    Calendar,
    Paperclip,
    ChevronLeft,
    ChevronRight,
    FileText,
    ExternalLink,
    Cloud,
    FolderTree,
    ShieldCheck,
    Check,
    Loader2,
    Layers,
    MapPin,
    Building2,
    FileCheck2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DeleteConfirmDialog from '@/components/delete-confirm-dialog';

interface Accomplishment {
    id: number;
    title: string;
    subtitle?: string | null;
    category: 'Research Award' | 'Publication' | 'Service Accomplishment' | 'Certification' | 'Professional Development' | string;
    functional_area?: string | null;
    scope?: string | null;
    role?: string | null;
    issuing_organization?: string | null;
    event_title?: string | null;
    venue?: string | null;
    duration?: string | null;
    credential_number?: string | null;
    expiration_date?: string | null;
    date_achieved: string;
    points: number;
    status: 'verified' | 'for_verification' | 'returned' | string;
    verified_by?: string | null;
    verified_at?: string | null;
    return_reason?: string | null;
    academic_year?: string;
    description?: string | null;
    proof_file_path?: string | null;
    google_drive_file_id?: string | null;
    google_drive_folder_id?: string | null;
    google_drive_path?: string | null;
    google_drive_web_link?: string | null;
    file_checksum?: string | null;
    version?: number;
    faculty_confirmed?: boolean;
}

interface Props {
    faculty: any;
    accomplishments: Accomplishment[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Workspace', href: '/faculty/dashboard' },
    { title: 'My Accomplishments', href: '/faculty/accomplishments' },
];

const CATEGORY_MAP: Record<string, { label: string; icon: any; badgeBg: string; textBg: string }> = {
    'Research Award': {
        label: 'Research Award',
        icon: Award,
        badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
        textBg: 'text-purple-600 dark:text-purple-400',
    },
    'Publication': {
        label: 'Publication',
        icon: BookOpen,
        badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40',
        textBg: 'text-sky-600 dark:text-sky-400',
    },
    'Service Accomplishment': {
        label: 'Service Accomplishment',
        icon: HeartHandshake,
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
        textBg: 'text-emerald-600 dark:text-emerald-400',
    },
    'Certification': {
        label: 'Certification',
        icon: Award,
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40',
        textBg: 'text-rose-600 dark:text-rose-400',
    },
    'Professional Development': {
        label: 'Professional Development',
        icon: GraduationCap,
        badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40',
        textBg: 'text-sky-600 dark:text-sky-400',
    },
};

export default function FacultyAccomplishmentsPage({ faculty, accomplishments = [] }: Props) {
    // 1. Filter States
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [academicYearFilter, setAcademicYearFilter] = useState<string>('This Academic Year');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryDropdownFilter, setCategoryDropdownFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingAccomplishment, setViewingAccomplishment] = useState<Accomplishment | null>(null);
    const [deletingAccomplishment, setDeletingAccomplishment] = useState<Accomplishment | null>(null);

    // AI Document Parsing State
    const [isExtracting, setIsExtracting] = useState(false);
    const [aiSuggested, setAiSuggested] = useState<any | null>(null);

    // Form Hook
    const createForm = useForm({
        title: '',
        subtitle: '',
        category: 'Research Award',
        functional_area: 'Research',
        scope: 'National',
        role: 'Participant',
        issuing_organization: '',
        event_title: '',
        venue: '',
        duration: '',
        credential_number: '',
        expiration_date: '',
        date_achieved: new Date().toISOString().split('T')[0],
        points: 10,
        academic_year: '2026-2027',
        description: '',
        proof_file: null as File | null,
        faculty_confirmed: true,
        ai_extracted_data: null as any | null,
    });

    const handleFileSelectedForExtraction = async (file: File) => {
        createForm.setData('proof_file', file);
        setIsExtracting(true);
        setAiSuggested(null);

        const formData = new FormData();
        formData.append('evidence_file', file);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/faculty/accomplishments/extract-metadata', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.extracted) {
                    setAiSuggested(data.extracted);
                    // Pre-fill form fields for faculty review & confirmation
                    createForm.setData((prev) => ({
                        ...prev,
                        title: data.extracted.title || prev.title,
                        functional_area: data.extracted.functional_area || prev.functional_area,
                        scope: data.extracted.scope || prev.scope,
                        role: data.extracted.role || prev.role,
                        issuing_organization: data.extracted.issuing_organization || prev.issuing_organization,
                        event_title: data.extracted.event_title || prev.event_title,
                        venue: data.extracted.venue || prev.venue,
                        duration: data.extracted.duration || prev.duration,
                        credential_number: data.extracted.credential_number || prev.credential_number,
                        expiration_date: data.extracted.expiration_date || prev.expiration_date,
                        date_achieved: data.extracted.date_achieved || prev.date_achieved,
                        points: data.extracted.recommended_points || prev.points,
                        description: data.extracted.description || prev.description,
                        ai_extracted_data: data.extracted,
                        faculty_confirmed: false, // requires explicit faculty confirmation!
                    }));
                }
            }
        } catch (e) {
            console.error('AI extraction error:', e);
        } finally {
            setIsExtracting(false);
        }
    };

    // KPI Metrics
    const kpiMetrics = useMemo(() => {
        const total = accomplishments.length;
        const verified = accomplishments.filter((a) => a.status === 'verified').length;
        const forVerification = accomplishments.filter((a) => a.status === 'for_verification').length;
        const returned = accomplishments.filter((a) => a.status === 'returned').length;

        const totalPoints = accomplishments
            .filter((a) => a.status === 'verified')
            .reduce((sum, item) => sum + (item.points || 0), 0);

        const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
        const forVerificationPct = total > 0 ? Math.round((forVerification / total) * 100) : 0;
        const returnedPct = total > 0 ? Math.round((returned / total) * 100) : 0;

        return {
            total,
            verified,
            verifiedPct,
            forVerification,
            forVerificationPct,
            returned,
            returnedPct,
            totalPoints,
        };
    }, [accomplishments]);

    // Pill Tab Counts
    const categoryPills = useMemo(() => {
        const counts: Record<string, number> = {
            'Certifications': 0,
            'Research Awards': 0,
            'Publications': 0,
            'Service Accomplishments': 0,
            'Professional Development': 0,
        };

        accomplishments.forEach((a) => {
            if (a.category === 'Certification') counts['Certifications']++;
            else if (a.category === 'Research Award') counts['Research Awards']++;
            else if (a.category === 'Publication') counts['Publications']++;
            else if (a.category === 'Service Accomplishment') counts['Service Accomplishments']++;
            else if (a.category === 'Professional Development') counts['Professional Development']++;
        });

        return [
            { key: 'all', label: 'All', count: accomplishments.length, icon: null },
            { key: 'Certification', label: 'Certifications', count: counts['Certifications'], icon: Award },
            { key: 'Research Award', label: 'Research Awards', count: counts['Research Awards'], icon: Award },
            { key: 'Publication', label: 'Publications', count: counts['Publications'], icon: BookOpen },
            { key: 'Service Accomplishment', label: 'Service Accomplishments', count: counts['Service Accomplishments'], icon: HeartHandshake },
            { key: 'Professional Development', label: 'Professional Development', count: counts['Professional Development'], icon: GraduationCap },
        ];
    }, [accomplishments]);

    // Filtered accomplishments
    const filteredAccomplishments = useMemo(() => {
        return accomplishments.filter((item) => {
            // Category Pill Filter
            if (categoryFilter !== 'all' && item.category !== categoryFilter) {
                return false;
            }

            // Category Dropdown Filter
            if (categoryDropdownFilter !== 'all' && item.category !== categoryDropdownFilter) {
                return false;
            }

            // Status Dropdown Filter
            if (statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title?.toLowerCase().includes(q);
                const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
                const matchDesc = item.description?.toLowerCase().includes(q);
                const matchCat = item.category?.toLowerCase().includes(q);
                if (!matchTitle && !matchSubtitle && !matchDesc && !matchCat) {
                    return false;
                }
            }

            return true;
        });
    }, [accomplishments, categoryFilter, categoryDropdownFilter, statusFilter, searchQuery]);

    // Form handlers
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/faculty/accomplishments', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingAccomplishment) return;
        router.delete(`/faculty/accomplishments/${deletingAccomplishment.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingAccomplishment(null),
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredAccomplishments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredAccomplishments.map((a) => a.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        // Simple CSV generation of accomplishments
        const headers = ['Title', 'Subtitle/Venue', 'Category', 'Date Achieved', 'Points', 'Status', 'Verified By'];
        const rows = filteredAccomplishments.map((a) => [
            `"${a.title.replace(/"/g, '""')}"`,
            `"${(a.subtitle || '').replace(/"/g, '""')}"`,
            `"${a.category}"`,
            `"${a.date_achieved}"`,
            a.points || 0,
            `"${a.status}"`,
            `"${(a.verified_by || 'Pending').replace(/"/g, '""')}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Faculty_Accomplishments_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatReadableDate = (dateStr?: string | null) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Accomplishments - Faculty Workspace" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1550px] mx-auto w-full">
                {/* 1. TOP TITLE BANNER (Matching Screenshot) */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight">
                                My Accomplishments
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Document your achievements, certifications, research awards, publication milestones, and verified service accomplishments.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold text-xs rounded-xl px-4 py-2.5 shadow-2xs cursor-pointer flex items-center gap-2 self-start sm:self-auto shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Record Accomplishment</span>
                    </Button>
                </div>

                {/* 2. FIVE KPI STAT CARDS (Total Records, Verified, For Verification, Returned, Total Points) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* 1. Total Records */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Total Records
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {kpiMetrics.total}
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                This Academic Year
                            </span>
                        </div>
                    </div>

                    {/* 2. Verified */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Verified
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {kpiMetrics.verified}
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {kpiMetrics.verifiedPct}% of total
                            </span>
                        </div>
                    </div>

                    {/* 3. For Verification */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                For Verification
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {kpiMetrics.forVerification}
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {kpiMetrics.forVerificationPct}% of total
                            </span>
                        </div>
                    </div>

                    {/* 4. Returned */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Returned
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {kpiMetrics.returned}
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {kpiMetrics.returnedPct}% of total
                            </span>
                        </div>
                    </div>

                    {/* 5. Total Points */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                                Total Points
                            </span>
                            <div className="text-2xl font-black text-foreground tabular-nums leading-tight mt-0.5">
                                {kpiMetrics.totalPoints}
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                Based on approved records
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. CATEGORY PILL SELECTOR ROW (Exact match to screenshot) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {categoryPills.map((pill) => {
                        const Icon = pill.icon;
                        const isActive = categoryFilter === pill.key;

                        return (
                            <button
                                key={pill.key}
                                type="button"
                                onClick={() => setCategoryFilter(pill.key)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs",
                                    isActive
                                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {Icon && <Icon className="w-3.5 h-3.5" />}
                                <span>{pill.label}</span>
                                <span className={cn(
                                    "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5",
                                    isActive
                                        ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {pill.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* 4. FILTER BAR WITH SEARCH & EXPORT (Matching screenshot) */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Academic Year select */}
                        <select
                            value={academicYearFilter}
                            onChange={(e) => setAcademicYearFilter(e.target.value)}
                            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[150px]"
                        >
                            <option value="This Academic Year">This Academic Year</option>
                            <option value="AY 2026-2027">AY 2026-2027</option>
                            <option value="AY 2025-2026">AY 2025-2026</option>
                            <option value="All Academic Years">All Academic Years</option>
                        </select>

                        {/* Status select */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[125px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="verified">Verified</option>
                            <option value="for_verification">For Verification</option>
                            <option value="returned">Returned</option>
                        </select>

                        {/* Category select */}
                        <select
                            value={categoryDropdownFilter}
                            onChange={(e) => setCategoryDropdownFilter(e.target.value)}
                            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs cursor-pointer min-w-[140px]"
                        >
                            <option value="all">All Categories</option>
                            <option value="Research Award">Research Award</option>
                            <option value="Publication">Publication</option>
                            <option value="Service Accomplishment">Service Accomplishment</option>
                            <option value="Certification">Certification</option>
                            <option value="Professional Development">Professional Development</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative min-w-[220px] flex-1 md:flex-initial">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search accomplishments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-border bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                            />
                        </div>

                        {/* Export Button */}
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            className="h-9 rounded-xl text-xs font-bold border-border bg-card shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-muted"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                        </Button>
                    </div>
                </div>

                {/* 5. ACCOMPLISHMENTS TABLE (Exact match to screenshot) */}
                <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold">
                                    <th className="py-3.5 px-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={filteredAccomplishments.length > 0 && selectedIds.length === filteredAccomplishments.length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-3.5 px-4 font-extrabold text-foreground min-w-[280px]">Title / Description</th>
                                    <th className="py-3.5 px-4 font-extrabold text-foreground min-w-[160px]">Category</th>
                                    <th className="py-3.5 px-4 font-extrabold text-foreground min-w-[120px]">Date Achieved</th>
                                    <th className="py-3.5 px-4 font-extrabold text-foreground min-w-[80px]">Points</th>
                                    <th className="py-3.5 px-4 font-extrabold text-foreground min-w-[130px]">Status</th>
                                    <th className="py-3.5 px-4 font-extrabold text-foreground min-w-[180px]">Verification</th>
                                    <th className="py-3.5 px-4 font-extrabold text-foreground text-right w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredAccomplishments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                                            No accomplishment records found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccomplishments.map((item) => {
                                        const catConfig = CATEGORY_MAP[item.category] || {
                                            label: item.category,
                                            icon: Award,
                                            badgeBg: 'bg-muted text-muted-foreground border-border',
                                            textBg: 'text-foreground',
                                        };
                                        const CatIcon = catConfig.icon;
                                        const isSelected = selectedIds.includes(item.id);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={cn(
                                                    "hover:bg-muted/30 transition-colors group",
                                                    isSelected && "bg-sky-50/40 dark:bg-sky-950/20"
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <td className="py-4 px-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(item.id)}
                                                        className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                </td>

                                                {/* Title & Subtitle / Conference / Journal / Issuer */}
                                                <td className="py-4 px-4">
                                                    <div className="font-extrabold text-foreground text-xs leading-snug">
                                                        {item.title}
                                                    </div>
                                                    {item.subtitle && (
                                                        <div className="text-[11px] text-muted-foreground mt-0.5 font-medium line-clamp-1">
                                                            {item.subtitle}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                        {item.functional_area && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                                                {item.functional_area}
                                                            </span>
                                                        )}
                                                        {item.scope && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                {item.scope}
                                                            </span>
                                                        )}
                                                        {item.role && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                                {item.role}
                                                            </span>
                                                        )}
                                                        {item.google_drive_file_id && (
                                                            <span
                                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                                                title={`Archived to Google Drive: ${item.google_drive_path || 'Faculty Evidence'}`}
                                                            >
                                                                <Cloud className="w-2.5 h-2.5 text-emerald-600" />
                                                                <span>Drive Archived</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Category Pill with Icon */}
                                                <td className="py-4 px-4">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
                                                        catConfig.badgeBg
                                                    )}>
                                                        <CatIcon className="w-3 h-3" />
                                                        <span>{catConfig.label}</span>
                                                    </span>
                                                </td>

                                                {/* Date Achieved */}
                                                <td className="py-4 px-4 font-semibold text-[11px] text-muted-foreground whitespace-nowrap">
                                                    {formatReadableDate(item.date_achieved)}
                                                </td>

                                                {/* Points Badge */}
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-amber-600 dark:text-amber-400 text-xs tabular-nums">
                                                        {item.points || 0} pts
                                                    </span>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-4 px-4">
                                                    {item.status === 'verified' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                            <span>Verified</span>
                                                        </span>
                                                    ) : item.status === 'for_verification' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span>For Verification</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                            <AlertCircle className="w-3 h-3 text-rose-600" />
                                                            <span>Returned</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Verification info */}
                                                <td className="py-4 px-4 text-[11px]">
                                                    {item.status === 'verified' ? (
                                                        <div>
                                                            <div className="font-bold text-foreground">
                                                                Verified by: {item.verified_by || 'Dean / Office'}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                {formatReadableDate(item.verified_at || item.date_achieved)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-amber-600 dark:text-amber-400">
                                                                Under Review
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                Submitted: {formatReadableDate(item.date_achieved)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actions: View icon & Dropdown */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingAccomplishment(item)}
                                                            title="View Accomplishment Details"
                                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingAccomplishment(item)}
                                                            title="Delete Record"
                                                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-muted-foreground hover:text-rose-600 cursor-pointer transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Pagination Footer (Matching screenshot) */}
                    <div className="py-3 px-4 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Showing 1 to {filteredAccomplishments.length} of {accomplishments.length} records
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled
                                className="p-1 rounded-md border border-border bg-card text-muted-foreground opacity-50 cursor-not-allowed"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 h-7 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold flex items-center justify-center text-xs">
                                1
                            </span>
                            <button
                                type="button"
                                disabled
                                className="p-1 rounded-md border border-border bg-card text-muted-foreground opacity-50 cursor-not-allowed"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RECORD ACCOMPLISHMENT MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span>Record Accomplishment</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Submit an achievement, journal publication, conference paper, or certification for institutional verification and merit points.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto px-1">
                        {/* 1. Evidence Upload with OCR/AI Parsing Trigger */}
                        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                    <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <span>Upload Evidence to Google Drive with AI Parsing</span>
                                </label>
                                {isExtracting && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 animate-pulse">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Extracting metadata...
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mb-2.5">
                                Upload certificate, award, or publication proof. Gemini AI will automatically parse the document and suggest structured classifications for your confirmation.
                            </p>
                            <div className="flex items-center gap-2 border border-dashed border-amber-300 dark:border-amber-700/60 rounded-xl p-3 bg-white dark:bg-card">
                                <Paperclip className="w-4 h-4 text-amber-600 shrink-0" />
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelectedForExtraction(file);
                                    }}
                                    className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 cursor-pointer"
                                />
                            </div>

                            {/* Live Google Drive Destination Preview */}
                            <div className="mt-2.5 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 flex items-center gap-2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
                                <FolderTree className="w-3.5 h-3.5 shrink-0" />
                                <span>Drive Path: Faculty Evidence/{createForm.data.academic_year}/{createForm.data.functional_area || 'Area'}/{createForm.data.scope || 'Scope'}</span>
                            </div>
                        </div>

                        {/* AI Confirmation Notice */}
                        {aiSuggested && (
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
                                    <Sparkles className="w-4 h-4" />
                                    <span>AI Suggested Classifications Extracted</span>
                                </div>
                                <p className="text-[11px] text-purple-600/90 dark:text-purple-400">
                                    Please review, adjust, and confirm the suggested metadata below before institutional archiving.
                                </p>
                            </div>
                        )}

                        {/* Accomplishment Title */}
                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Accomplishment Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Best Paper Award or AWS Certified Solutions Architect"
                                value={createForm.data.title}
                                onChange={(e) => createForm.setData('title', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>

                        {/* Functional Area & Scope */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Functional Area <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={createForm.data.functional_area}
                                    onChange={(e) => {
                                        const area = e.target.value;
                                        createForm.setData((prev) => ({
                                            ...prev,
                                            functional_area: area,
                                            category: area === 'Research' ? 'Publication' : (area === 'Award/Recognition' ? 'Research Award' : area),
                                        }));
                                    }}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-bold cursor-pointer"
                                >
                                    <option value="Instruction">Instruction</option>
                                    <option value="Research">Research</option>
                                    <option value="Extension">Extension</option>
                                    <option value="Professional Development">Professional Development</option>
                                    <option value="Award/Recognition">Award / Recognition</option>
                                    <option value="Certification">Certification</option>
                                    <option value="Administration">Administration</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Scope <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={createForm.data.scope}
                                    onChange={(e) => createForm.setData('scope', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-bold cursor-pointer"
                                >
                                    <option value="Institutional">Institutional</option>
                                    <option value="Local">Local</option>
                                    <option value="Regional">Regional</option>
                                    <option value="National">National</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                        </div>

                        {/* Role & Issuing Organization */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Faculty Role <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-bold cursor-pointer"
                                >
                                    <option value="Participant">Participant</option>
                                    <option value="Presenter">Presenter</option>
                                    <option value="Resource Speaker">Resource Speaker</option>
                                    <option value="Organizer">Organizer</option>
                                    <option value="Awardee">Awardee</option>
                                    <option value="Researcher">Researcher / Author</option>
                                    <option value="Project Leader">Project Leader</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Issuing Organization / Host Body
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. CHED, IEEE, Microsoft, DOST"
                                    value={createForm.data.issuing_organization}
                                    onChange={(e) => createForm.setData('issuing_organization', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                            </div>
                        </div>

                        {/* Event Title & Venue */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Event / Activity Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 2026 National Computing Congress"
                                    value={createForm.data.event_title}
                                    onChange={(e) => createForm.setData('event_title', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Venue / Platform
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Manila, Philippines or Online Zoom"
                                    value={createForm.data.venue}
                                    onChange={(e) => createForm.setData('venue', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                            </div>
                        </div>

                        {/* Date Achieved, Duration & Points */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Date Achieved <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={createForm.data.date_achieved}
                                    onChange={(e) => createForm.setData('date_achieved', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Duration / Hours
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 40 hours"
                                    value={createForm.data.duration}
                                    onChange={(e) => createForm.setData('duration', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Merit Points
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={createForm.data.points}
                                    onChange={(e) => createForm.setData('points', parseInt(e.target.value) || 5)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                                />
                            </div>
                        </div>

                        {/* Credential Number & Expiration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Credential / Certificate No.
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. CERT-2026-90812 or DOI/ISBN"
                                    value={createForm.data.credential_number}
                                    onChange={(e) => createForm.setData('credential_number', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                    Expiration Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={createForm.data.expiration_date}
                                    onChange={(e) => createForm.setData('expiration_date', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Standardized Description / Citation Summary
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Abstract summary, citation details, or institutional significance..."
                                value={createForm.data.description}
                                onChange={(e) => createForm.setData('description', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                            />
                        </div>

                        {/* Faculty Confirmation Checkbox */}
                        <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
                            <input
                                type="checkbox"
                                id="faculty_confirmed_cb"
                                checked={createForm.data.faculty_confirmed}
                                onChange={(e) => createForm.setData('faculty_confirmed', e.target.checked)}
                                className="mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                            <label htmlFor="faculty_confirmed_cb" className="text-xs text-foreground cursor-pointer font-medium leading-relaxed">
                                <strong>I confirm that the above details and classifications are accurate.</strong> I take academic responsibility for verifying that this accomplishment meets institutional and accreditation guidelines.
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl shadow-2xs"
                            >
                                {createForm.processing ? 'Submitting...' : 'Record Accomplishment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* VIEW ACCOMPLISHMENT DETAILS MODAL */}
            <Dialog open={!!viewingAccomplishment} onOpenChange={() => setViewingAccomplishment(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>Accomplishment Verification Summary</span>
                        </DialogTitle>
                    </DialogHeader>

                    {viewingAccomplishment && (
                        <div className="space-y-4 pt-2 text-xs">
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    {viewingAccomplishment.category}
                                </span>
                                <h3 className="text-sm font-extrabold text-foreground leading-snug">
                                    {viewingAccomplishment.title}
                                </h3>
                                {viewingAccomplishment.subtitle && (
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {viewingAccomplishment.subtitle}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl border border-border bg-card">
                                    <span className="text-[10px] font-bold text-muted-foreground block">Date Achieved</span>
                                    <span className="font-extrabold text-foreground mt-0.5 block">
                                        {formatReadableDate(viewingAccomplishment.date_achieved)}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl border border-border bg-card">
                                    <span className="text-[10px] font-bold text-muted-foreground block">Credit Points</span>
                                    <span className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                                        {viewingAccomplishment.points || 0} pts
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl border border-border bg-card space-y-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground block">Verification Status</span>
                                <div className="flex items-center gap-2">
                                    {viewingAccomplishment.status === 'verified' ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Verified by {viewingAccomplishment.verified_by || 'Academic Office'}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600">
                                            <Clock className="w-4 h-4" />
                                            Pending Verification
                                        </span>
                                    )}
                                </div>
                            </div>

                            {viewingAccomplishment.description && (
                                <div className="p-3 rounded-xl border border-border bg-card">
                                    <span className="text-[10px] font-bold text-muted-foreground block mb-1">Description / Notes</span>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {viewingAccomplishment.description}
                                    </p>
                                </div>
                            )}

                            {/* Functional Area, Scope & Role */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl border border-border bg-card">
                                    <span className="text-[10px] font-bold text-muted-foreground block">Area</span>
                                    <span className="font-bold text-foreground mt-0.5 block truncate">
                                        {viewingAccomplishment.functional_area || 'Instruction'}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl border border-border bg-card">
                                    <span className="text-[10px] font-bold text-muted-foreground block">Scope</span>
                                    <span className="font-bold text-foreground mt-0.5 block truncate">
                                        {viewingAccomplishment.scope || 'Institutional'}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl border border-border bg-card">
                                    <span className="text-[10px] font-bold text-muted-foreground block">Role</span>
                                    <span className="font-bold text-foreground mt-0.5 block truncate">
                                        {viewingAccomplishment.role || 'Participant'}
                                    </span>
                                </div>
                            </div>

                            {/* Issuer & Venue if available */}
                            {(viewingAccomplishment.issuing_organization || viewingAccomplishment.venue) && (
                                <div className="p-3 rounded-xl border border-border bg-card space-y-1">
                                    {viewingAccomplishment.issuing_organization && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Issuing Org:</span>
                                            <span className="font-semibold text-foreground text-right">{viewingAccomplishment.issuing_organization}</span>
                                        </div>
                                    )}
                                    {viewingAccomplishment.venue && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Venue:</span>
                                            <span className="font-semibold text-foreground text-right">{viewingAccomplishment.venue}</span>
                                        </div>
                                    )}
                                    {viewingAccomplishment.credential_number && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Credential #:</span>
                                            <span className="font-mono font-bold text-foreground text-right">{viewingAccomplishment.credential_number}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Return Feedback if returned */}
                            {viewingAccomplishment.status === 'returned' && viewingAccomplishment.return_reason && (
                                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                        <span>Reviewer Return Feedback:</span>
                                    </div>
                                    <p className="text-xs font-medium pl-5 leading-relaxed">
                                        {viewingAccomplishment.return_reason}
                                    </p>
                                </div>
                            )}

                            {/* Google Drive Institutional Evidence Archiving Box */}
                            <div className="p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                        <span className="font-extrabold text-foreground text-xs">Institutional Shared Drive Evidence</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                                        <ShieldCheck className="w-3 h-3" />
                                        v{viewingAccomplishment.version || 1} Audited
                                    </span>
                                </div>

                                {viewingAccomplishment.google_drive_path && (
                                    <div className="text-[11px] font-mono text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/60 break-all flex items-start gap-1.5">
                                        <FolderTree className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                                        <span>{viewingAccomplishment.google_drive_path}</span>
                                    </div>
                                )}

                                {viewingAccomplishment.file_checksum && (
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                        <span>SHA-256 Checksum:</span>
                                        <span className="font-mono text-foreground">{viewingAccomplishment.file_checksum.substring(0, 16)}...</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-1">
                                    {viewingAccomplishment.google_drive_web_link ? (
                                        <a
                                            href={viewingAccomplishment.google_drive_web_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Open in Google Drive</span>
                                        </a>
                                    ) : null}

                                    {viewingAccomplishment.proof_file_path && (
                                        <a
                                            href={`/storage/${viewingAccomplishment.proof_file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-1.5 px-3 rounded-lg bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border transition-colors shadow-2xs"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Local Cached Copy</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            onClick={() => setViewingAccomplishment(null)}
                            className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM DIALOG */}
            <DeleteConfirmDialog
                isOpen={!!deletingAccomplishment}
                onClose={() => setDeletingAccomplishment(null)}
                onConfirm={handleDelete}
                title="Delete Accomplishment"
                description={`Are you sure you want to delete "${deletingAccomplishment?.title}"? This record and associated verification credits will be removed.`}
            />
        </AppLayout>
    );
}
