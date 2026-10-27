import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    Plane,
    Calendar,
    Clock,
    Search,
    Filter,
    Plus,
    RefreshCw,
    CheckCircle2,
    Users,
    Building2,
    FileText,
    DollarSign,
    Briefcase,
    Eye,
    Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faculty Operations', href: '/operations/travel-orders' },
    { title: 'Travel Orders', href: '/operations/travel-orders' },
];

interface FacultyOption {
    id: number;
    name: string;
    faculty_id: string;
    program: string;
    photo_url?: string | null;
}

interface TravelOrder {
    id: number;
    tracking_number: string;
    faculty_id: number;
    faculty_name: string;
    faculty_code: string;
    program_code: string;
    photo_url?: string | null;
    destination: string;
    purpose: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    raw_start_date: string;
    raw_end_date: string;
    travel_type: string;
    status: 'Approved' | 'In Progress' | 'Completed' | 'Cancelled';
    with_per_diem: boolean;
    estimated_budget: string;
    approver_name?: string;
    approver_role?: string;
    remarks?: string;
}

interface Metrics {
    total: number;
    in_progress: number;
    approved: number;
    completed: number;
}

interface Props {
    travelOrders: TravelOrder[];
    faculties: FacultyOption[];
    metrics: Metrics;
    filters: {
        status?: string;
        faculty_id?: string;
        search?: string;
    };
}

export default function TravelOrdersIndex({ travelOrders = [], faculties = [], metrics, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [facultyFilter, setFacultyFilter] = useState(filters.faculty_id || 'all');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<TravelOrder | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Create Travel Order Form
    const { data, setData, post, processing, reset, errors } = useForm({
        faculty_id: faculties.length > 0 ? String(faculties[0].id) : '',
        destination: '',
        purpose: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        travel_type: 'Official Business',
        with_per_diem: true,
        estimated_budget: 10000,
        remarks: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/operations/travel-orders', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post('/operations/travel-orders/sync', {}, {
            onFinish: () => setIsSyncing(false),
        });
    };

    const handleStatusUpdate = (order: TravelOrder, newStatus: string) => {
        router.patch(`/operations/travel-orders/${order.id}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedOrder?.id === order.id) {
                    setSelectedOrder(null);
                }
            },
        });
    };

    const handleFilterChange = (status: string, facId: string) => {
        setStatusFilter(status);
        setFacultyFilter(facId);
        router.get('/operations/travel-orders', {
            status,
            faculty_id: facId,
            search,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const filteredOrders = useMemo(() => {
        return travelOrders.filter((item) => {
            const matchesSearch =
                !search.trim() ||
                item.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
                item.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
                item.destination.toLowerCase().includes(search.toLowerCase()) ||
                item.purpose.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesFaculty = facultyFilter === 'all' || String(item.faculty_id) === facultyFilter;

            return matchesSearch && matchesStatus && matchesFaculty;
        });
    }, [travelOrders, search, statusFilter, facultyFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Travel Orders Monitoring - OfficeHub" />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-[#F9FAFB] dark:bg-zinc-950 min-h-screen">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                            <Plane className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                    Faculty Travel Orders
                                </h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    e-HRIS Synced
                                </span>
                            </div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Monitor approved official business travels, conferences, seminars, and allowances
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="h-10 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-xs"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 mr-2 text-zinc-500 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync with e-HRIS
                        </Button>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                        >
                            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                            Create Travel Order
                        </Button>
                    </div>
                </div>

                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                            <Plane className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Total Travel Orders
                            </span>
                            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                                {metrics?.total ?? travelOrders.length}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                In Progress (On Travel)
                            </span>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                {metrics?.in_progress ?? 0}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Upcoming / Approved
                            </span>
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                {metrics?.approved ?? 0}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Completed Trips
                            </span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {metrics?.completed ?? 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <Input
                                placeholder="Search tracking # or destination..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => handleFilterChange(e.target.value, facultyFilter)}
                                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Approved">Approved</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Faculty Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase">Faculty:</span>
                            <select
                                value={facultyFilter}
                                onChange={(e) => handleFilterChange(statusFilter, e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none max-w-[200px]"
                            >
                                <option value="all">All Faculty</option>
                                {faculties.map((f) => (
                                    <option key={f.id} value={String(f.id)}>
                                        {f.name} ({f.program})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <span className="text-xs font-semibold text-zinc-400">
                        Showing <strong className="text-zinc-800 dark:text-zinc-200">{filteredOrders.length}</strong> travel order(s)
                    </span>
                </div>

                {/* Travel Orders Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                                    <th className="py-3.5 px-4">Faculty Member</th>
                                    <th className="py-3.5 px-4">Tracking #</th>
                                    <th className="py-3.5 px-4">Destination & Purpose</th>
                                    <th className="py-3.5 px-4">Inclusive Dates</th>
                                    <th className="py-3.5 px-4">Duration</th>
                                    <th className="py-3.5 px-4">Budget / Per Diem</th>
                                    <th className="py-3.5 px-3 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-zinc-400">
                                            <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-sm">No travel orders found.</p>
                                            <p className="text-xs text-zinc-400 mt-1">
                                                Create a new order or click "Sync with e-HRIS" to pull data.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((to, idx) => (
                                        <tr
                                            key={to.id}
                                            className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                        >
                                            <td className="py-3.5 px-4 text-center font-bold text-zinc-400">
                                                {idx + 1}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    {to.photo_url ? (
                                                        <img
                                                            src={to.photo_url}
                                                            alt={to.faculty_name}
                                                            className="w-8 h-8 rounded-full object-cover border border-amber-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                                                            {to.faculty_name
                                                                .split(' ')
                                                                .map((n) => n[0])
                                                                .slice(0, 2)
                                                                .join('')}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <button
                                                            onClick={() => setSelectedOrder(to)}
                                                            className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 transition-colors text-left block"
                                                        >
                                                            {to.faculty_name}
                                                        </button>
                                                        <span className="text-[10px] text-zinc-400">
                                                            {to.program_code} • {to.faculty_code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                {to.tracking_number}
                                            </td>

                                            <td className="py-3.5 px-4 max-w-xs">
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                    {to.destination}
                                                </p>
                                                <p className="text-[11px] text-zinc-400 truncate">
                                                    {to.purpose}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-4 font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                                {to.start_date} – {to.end_date}
                                            </td>

                                            <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                                {to.duration_days} day{to.duration_days > 1 ? 's' : ''}
                                            </td>

                                            <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                                                <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                                                    ₱{to.estimated_budget}
                                                </div>
                                                <span className={`text-[10px] font-semibold ${to.with_per_diem ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                                    {to.with_per_diem ? 'With Per Diem' : 'Without Per Diem'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    to.status === 'In Progress'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : to.status === 'Completed'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : to.status === 'Approved'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-zinc-100 text-zinc-500'
                                                }`}>
                                                    {to.status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {to.status === 'Approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleStatusUpdate(to, 'In Progress')}
                                                            className="h-7 px-2.5 text-[11px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        >
                                                            Start Travel
                                                        </Button>
                                                    )}
                                                    {to.status === 'In Progress' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleStatusUpdate(to, 'Completed')}
                                                            className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            Mark Completed
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setSelectedOrder(to)}
                                                        className="h-7 px-2 text-zinc-500 hover:text-amber-600"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CREATE TRAVEL ORDER MODAL */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                <Plane className="w-5 h-5 text-amber-500" />
                                Create Faculty Travel Order
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Authorize and record official business travel for a faculty member in the directory.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-2">
                            {/* Faculty Select from Directory */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Faculty Member (From College Directory) *
                                </Label>
                                <select
                                    value={data.faculty_id}
                                    onChange={(e) => setData('faculty_id', e.target.value)}
                                    required
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                >
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} — {f.program} ({f.faculty_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Destination */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Official Travel Destination *
                                </Label>
                                <Input
                                    placeholder="e.g. SMX Convention Center, Davao City / UP Diliman"
                                    value={data.destination}
                                    onChange={(e) => setData('destination', e.target.value)}
                                    required
                                    className="rounded-xl text-xs"
                                />
                            </div>

                            {/* Purpose */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Purpose of Travel *
                                </Label>
                                <textarea
                                    rows={2}
                                    placeholder="Conference paper presentation, official benchmarking, training..."
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    required
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Start Date *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        End Date *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            {/* Budget and Per Diem */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Estimated Budget (₱)
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={data.estimated_budget}
                                        onChange={(e) => setData('estimated_budget', parseFloat(e.target.value) || 0)}
                                        className="rounded-xl text-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Per Diem Allocation
                                    </Label>
                                    <select
                                        value={data.with_per_diem ? 'yes' : 'no'}
                                        onChange={(e) => setData('with_per_diem', e.target.value === 'yes')}
                                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                    >
                                        <option value="yes">With Per Diem Allowance</option>
                                        <option value="no">Without Per Diem</option>
                                    </select>
                                </div>
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs px-5 shadow-xs"
                                >
                                    {processing ? 'Creating...' : 'Create Travel Order'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DETAILS MODAL */}
                <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                    <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        {selectedOrder && (
                            <div>
                                <DialogHeader>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-zinc-400">
                                            {selectedOrder.tracking_number}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            selectedOrder.status === 'In Progress'
                                                ? 'bg-blue-50 text-blue-700'
                                                : selectedOrder.status === 'Completed'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <DialogTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">
                                        {selectedOrder.faculty_name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-zinc-400">
                                        {selectedOrder.program_code} • {selectedOrder.faculty_code} • {selectedOrder.travel_type}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 my-4 text-xs">
                                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60">
                                        <p className="font-bold text-zinc-800 dark:text-zinc-200">
                                            Destination: {selectedOrder.destination}
                                        </p>
                                        <p className="text-zinc-500 mt-1">
                                            Purpose: {selectedOrder.purpose}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Inclusive Dates</span>
                                            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                                                {selectedOrder.start_date} – {selectedOrder.end_date}
                                            </p>
                                            <p className="text-zinc-500 text-[11px]">{selectedOrder.duration_days} day(s)</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Budget Allocation</span>
                                            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                                                ₱{selectedOrder.estimated_budget}
                                            </p>
                                            <p className="text-zinc-500 text-[11px]">
                                                {selectedOrder.with_per_diem ? 'With Per Diem Allowance' : 'Without Per Diem'}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedOrder.approver_name && (
                                        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                                            <span className="text-[10px] text-amber-700 font-bold uppercase block">Approver Authority</span>
                                            <p className="text-zinc-800 dark:text-zinc-200 font-bold mt-0.5">{selectedOrder.approver_name}</p>
                                            <p className="text-zinc-500 text-[11px]">{selectedOrder.approver_role}</p>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="gap-2">
                                    {selectedOrder.status === 'Approved' && (
                                        <Button
                                            onClick={() => handleStatusUpdate(selectedOrder, 'In Progress')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                                        >
                                            Start Travel (In Progress)
                                        </Button>
                                    )}
                                    {selectedOrder.status === 'In Progress' && (
                                        <Button
                                            onClick={() => handleStatusUpdate(selectedOrder, 'Completed')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                                        >
                                            Mark Trip Completed
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedOrder(null)}
                                        className="rounded-xl text-xs font-bold"
                                    >
                                        Close
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
