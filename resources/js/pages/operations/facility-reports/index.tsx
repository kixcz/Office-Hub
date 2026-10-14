import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock,
    Search,
    ShieldAlert,
    Trash2,
    UserCheck,
    Wrench,
    FileText,
    Filter,
    ArrowUpDown,
    CheckCheck,
    ExternalLink,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations/facility-reports' },
    { title: 'Facility Reports', href: '/operations/facility-reports' },
];

interface ComplaintReport {
    id: number;
    room_name: string;
    room_id?: number | null;
    faculty_id?: number | null;
    complainant_name: string;
    complainant_email?: string | null;
    issue_category: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    status: 'Submitted to Dean' | 'Under Review' | 'In Progress' | 'Resolved' | 'Dismissed';
    action_taken?: string | null;
    dean_notes?: string | null;
    resolved_by?: string | null;
    resolved_at?: string | null;
    created_at: string;
    room?: {
        id: number;
        room_name: string;
        building?: string;
        floor?: string;
        type?: string;
        status?: string;
    };
    faculty?: {
        id: number;
        name: string;
        email: string;
    };
}

interface PaginationMeta<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
    links: { url?: string | null; label: string; active: boolean }[];
}

interface Stats {
    total_reports: number;
    pending_dean_review: number;
    in_progress: number;
    resolved: number;
    critical_unresolved: number;
}

interface Props {
    complaints: PaginationMeta<ComplaintReport>;
    stats: Stats;
    filters: {
        status: string;
        urgency: string;
        category: string;
        search: string;
    };
    rooms: string[];
}

export default function FacilityReportsIndex({
    complaints,
    stats,
    filters,
    rooms = [],
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [urgencyFilter, setUrgencyFilter] = useState(filters.urgency || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');

    // Review / Resolve modal state
    const [selectedReport, setSelectedReport] = useState<ComplaintReport | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    // Delete modal state
    const [deletingReport, setDeletingReport] = useState<ComplaintReport | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Form for Dean actions
    const reviewForm = useForm({
        status: 'Under Review' as ComplaintReport['status'],
        action_taken: '',
        dean_notes: '',
        room_status: 'Under Repair',
    });

    const openReviewModal = (report: ComplaintReport) => {
        setSelectedReport(report);
        reviewForm.setData({
            status: report.status === 'Submitted to Dean' ? 'Under Review' : report.status,
            action_taken: report.action_taken || '',
            dean_notes: report.dean_notes || '',
            room_status: report.room?.status || 'Under Repair',
        });
        reviewForm.clearErrors();
        setIsReviewOpen(true);
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport) return;
        reviewForm.patch(`/operations/facility-reports/${selectedReport.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsReviewOpen(false);
                setSelectedReport(null);
            },
        });
    };

    // Delete form
    const deleteForm = useForm({});
    const openDeleteModal = (report: ComplaintReport) => {
        setDeletingReport(report);
        setIsDeleteOpen(true);
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingReport) return;
        deleteForm.delete(`/operations/facility-reports/${deletingReport.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingReport(null);
            },
        });
    };

    // Query trigger
    const applyFilters = (newStatus?: string, newUrgency?: string, newCategory?: string, newSearch?: string) => {
        router.get(
            '/operations/facility-reports',
            {
                status: newStatus !== undefined ? newStatus : statusFilter,
                urgency: newUrgency !== undefined ? newUrgency : urgencyFilter,
                category: newCategory !== undefined ? newCategory : categoryFilter,
                search: newSearch !== undefined ? newSearch : search,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(statusFilter, urgencyFilter, categoryFilter, search);
    };

    // Badge helpers
    const getUrgencyBadge = (urgency: ComplaintReport['urgency']) => {
        switch (urgency) {
            case 'Critical':
                return <Badge className="bg-rose-600 text-white border-rose-600 font-bold">Critical</Badge>;
            case 'High':
                return <Badge className="bg-amber-500 text-gray-950 border-amber-500 font-semibold">High</Badge>;
            case 'Medium':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Medium</Badge>;
            case 'Low':
                return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Low</Badge>;
            default:
                return <Badge variant="outline">{urgency}</Badge>;
        }
    };

    const getStatusBadge = (status: ComplaintReport['status']) => {
        switch (status) {
            case 'Submitted to Dean':
                return (
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-semibold flex items-center gap-1">
                        <Clock className="size-3" />
                        Submitted to Dean
                    </Badge>
                );
            case 'Under Review':
                return (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
                        Under Review
                    </Badge>
                );
            case 'In Progress':
                return (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-medium">
                        In Progress
                    </Badge>
                );
            case 'Resolved':
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Resolved
                    </Badge>
                );
            case 'Dismissed':
                return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Dismissed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Facility & Room Reports - Dean Office" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                                <AlertTriangle className="size-6" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Facility &amp; Room Reports
                                    </h1>
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                        Super Admin / Dean Operations
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Faculty submitted complaints regarding non-working air conditioners, computers, projectors, electrical faults, and room equipment.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="text-xs">
                            <Link href="/schedule/master-data/rooms">
                                <Building2 className="size-4 mr-1.5" />
                                Rooms Inventory &rarr;
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Total Reports</span>
                        <div className="text-2xl font-black text-gray-900">{stats.total_reports}</div>
                        <span className="text-[11px] text-gray-500">Historical facility tickets</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-1 bg-amber-50/20">
                        <span className="text-xs font-semibold text-amber-700 uppercase flex items-center gap-1">
                            <Clock className="size-3.5" />
                            Submitted to Dean
                        </span>
                        <div className="text-2xl font-black text-amber-700">{stats.pending_dean_review}</div>
                        <span className="text-[11px] text-amber-700">Awaiting Dean action</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
                        <span className="text-xs font-semibold text-purple-600 uppercase">Under Action / Repair</span>
                        <div className="text-2xl font-black text-purple-700">{stats.in_progress}</div>
                        <span className="text-[11px] text-gray-500">Active maintenance tickets</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                        <span className="text-xs font-semibold text-emerald-600 uppercase">Resolved</span>
                        <div className="text-2xl font-black text-emerald-600">{stats.resolved}</div>
                        <span className="text-[11px] text-emerald-600">Restored to available</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs space-y-1 bg-rose-50/20">
                        <span className="text-xs font-semibold text-rose-600 uppercase flex items-center gap-1">
                            <ShieldAlert className="size-3.5" />
                            Critical Unresolved
                        </span>
                        <div className="text-2xl font-black text-rose-600">{stats.critical_unresolved}</div>
                        <span className="text-[11px] text-rose-600 font-semibold">Immediate attention</span>
                    </div>
                </div>

                {/* Filter and Table Container */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                    {/* Filter bar */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search room, faculty, description..."
                                className="pl-9 h-9 text-xs rounded-xl"
                            />
                        </form>

                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    applyFilters(e.target.value, urgencyFilter, categoryFilter, search);
                                }}
                                className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Submitted to Dean">Submitted to Dean</option>
                                <option value="Under Review">Under Review</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Dismissed">Dismissed</option>
                            </select>

                            <select
                                value={urgencyFilter}
                                onChange={(e) => {
                                    setUrgencyFilter(e.target.value);
                                    applyFilters(statusFilter, e.target.value, categoryFilter, search);
                                }}
                                className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                            >
                                <option value="all">All Urgency</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    applyFilters(statusFilter, urgencyFilter, e.target.value, search);
                                }}
                                className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                            >
                                <option value="all">All Categories</option>
                                <option value="Air Conditioning">Air Conditioning</option>
                                <option value="Computers / Peripherals">Computers / Peripherals</option>
                                <option value="Projector / Audio Visual">Projector / Audio Visual</option>
                                <option value="Electrical / Lighting">Electrical / Lighting</option>
                                <option value="Furniture / Seating">Furniture / Seating</option>
                                <option value="Internet / LAN Connectivity">Internet / LAN</option>
                                <option value="Cleanliness / Facilities">Cleanliness / Facilities</option>
                                <option value="Other">Other</option>
                            </select>

                            {(statusFilter !== 'all' || urgencyFilter !== 'all' || categoryFilter !== 'all' || search !== '') && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setUrgencyFilter('all');
                                        setCategoryFilter('all');
                                        setSearch('');
                                        applyFilters('all', 'all', 'all', '');
                                    }}
                                    className="text-xs h-9 text-gray-500 hover:text-gray-800"
                                >
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="py-3 px-4">Room / Facility</th>
                                    <th className="py-3 px-4">Urgency</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Problem Summary</th>
                                    <th className="py-3 px-4">Reported By</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Date Logged</th>
                                    <th className="py-3 px-4 text-right">Dean Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {complaints.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CheckCircle2 className="size-8 text-emerald-500/70" />
                                                <p className="font-semibold text-gray-700">No facility complaints reported</p>
                                                <p className="text-xs text-gray-400">All room conditions are operational and nominal.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    complaints.data.map((report) => (
                                        <tr key={report.id} className="hover:bg-amber-50/20 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
                                                        <Building2 className="size-3.5" />
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-gray-900 text-sm">
                                                            {report.room_name}
                                                        </span>
                                                        {report.room && (
                                                            <div className="text-[10px] text-gray-400">
                                                                {report.room.type} • {report.room.building}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getUrgencyBadge(report.urgency)}
                                            </td>

                                            <td className="py-3.5 px-4 font-medium text-gray-800">
                                                {report.issue_category}
                                            </td>

                                            <td className="py-3.5 px-4 max-w-sm">
                                                <p className="text-xs text-gray-800 line-clamp-2" title={report.description}>
                                                    {report.description}
                                                </p>
                                                {report.action_taken && (
                                                    <div className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                                                        <strong>Action:</strong> {report.action_taken}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-gray-900">{report.complainant_name}</div>
                                                {report.complainant_email && (
                                                    <div className="text-[11px] text-gray-400">{report.complainant_email}</div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(report.status)}
                                            </td>

                                            <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap text-[11px]">
                                                {new Date(report.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openReviewModal(report)}
                                                        className="h-7 px-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold text-xs gap-1 shadow-2xs"
                                                    >
                                                        <Wrench className="size-3" />
                                                        Review &amp; Act
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openDeleteModal(report)}
                                                        className="h-7 px-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Delete report"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {complaints.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
                            <div>
                                Showing <span className="font-semibold text-gray-800">{complaints.data.length}</span> of{' '}
                                <span className="font-semibold text-gray-800">{complaints.total}</span> facility reports
                            </div>
                            <div className="flex items-center gap-1">
                                {complaints.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                                            link.active
                                                ? 'bg-amber-500 text-gray-950 border-amber-500 font-bold'
                                                : link.url
                                                ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* REVIEW / RESOLVE / DEAN ACTIONS MODAL */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="sm:max-w-lg font-['Poppins']">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                <Wrench className="size-5" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900">
                                    Dean Action: Facility Complaint #{selectedReport?.id}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500">
                                    Facility: <strong className="text-gray-900">{selectedReport?.room_name}</strong> • Reported by {selectedReport?.complainant_name}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedReport && (
                        <form onSubmit={handleReviewSubmit} className="space-y-4 py-2">
                            {/* Incident recap box */}
                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">
                                        Category: {selectedReport.issue_category}
                                    </span>
                                    <span>{getUrgencyBadge(selectedReport.urgency)}</span>
                                </div>
                                <p className="text-gray-800 italic bg-white p-2.5 rounded-lg border border-gray-100">
                                    "{selectedReport.description}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Report Status *</Label>
                                    <select
                                        value={reviewForm.data.status}
                                        onChange={(e) => reviewForm.setData('status', e.target.value as any)}
                                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800 font-semibold"
                                        required
                                    >
                                        <option value="Submitted to Dean">Submitted to Dean</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="In Progress">In Progress (Maintenance Dispatched)</option>
                                        <option value="Resolved">Resolved (Facility Fixed)</option>
                                        <option value="Dismissed">Dismissed (False Alarm)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Set Room Status</Label>
                                    <select
                                        value={reviewForm.data.room_status}
                                        onChange={(e) => reviewForm.setData('room_status', e.target.value)}
                                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                    >
                                        <option value="Available">Available (Operational)</option>
                                        <option value="Under Repair">Under Repair</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="In Use">In Use</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700">
                                    Action Taken / Maintenance Dispatched
                                </Label>
                                <Input
                                    value={reviewForm.data.action_taken}
                                    onChange={(e) => reviewForm.setData('action_taken', e.target.value)}
                                    placeholder="e.g. IT support replaced motherboard on PC 12; Facilities cleaned filter."
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700">
                                    Dean / Administrative Notes
                                </Label>
                                <Textarea
                                    value={reviewForm.data.dean_notes}
                                    onChange={(e) => reviewForm.setData('dean_notes', e.target.value)}
                                    placeholder="Add internal remarks from the Dean's office or instructions for scheduling officers..."
                                    className="text-xs rounded-xl min-h-[70px]"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsReviewOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={reviewForm.processing}
                                    className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold text-xs gap-1.5 shadow-xs"
                                >
                                    <CheckCheck className="size-3.5" />
                                    {reviewForm.processing ? 'Saving...' : 'Update & Record Action'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-sm font-['Poppins']">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600">
                            <Trash2 className="size-5" />
                            Delete Problem Report
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Are you sure you want to delete report #{deletingReport?.id} for room {deletingReport?.room_name}?
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeleteSubmit}>
                        <DialogFooter className="gap-2 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsDeleteOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={deleteForm.processing}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                            >
                                {deleteForm.processing ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
