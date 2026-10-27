import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    MapPin,
    Calendar,
    Clock,
    Search,
    Filter,
    Plus,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Building2,
    Users,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    Shield,
    ExternalLink,
    AlertCircle,
    UserCheck,
    Eye,
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
    { title: 'Faculty Operations', href: '/operations/locator-slips' },
    { title: 'Locator Slips', href: '/operations/locator-slips' },
];

interface FacultyOption {
    id: number;
    name: string;
    faculty_id: string;
    program: string;
    photo_url?: string | null;
}

interface Slip {
    id: number;
    slip_number: string;
    faculty_id: number;
    faculty_name: string;
    faculty_code: string;
    program_code: string;
    photo_url?: string | null;
    destination: string;
    purpose: string;
    date: string;
    raw_date: string;
    time_out: string;
    time_in: string;
    actual_time_out: string;
    actual_time_in: string;
    slip_type: string;
    status: 'Approved' | 'Departed' | 'Returned' | 'Cancelled';
    approver_name?: string;
    guard_on_duty?: string;
    guard_remarks?: string;
    remarks?: string;
}

interface Metrics {
    total: number;
    active_out: number;
    returned: number;
    approved: number;
    today_count: number;
}

interface Props {
    slips: Slip[];
    faculties: FacultyOption[];
    metrics: Metrics;
    filters: {
        status?: string;
        faculty_id?: string;
        date?: string;
        search?: string;
    };
}

export default function LocatorSlipsIndex({ slips = [], faculties = [], metrics, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [facultyFilter, setFacultyFilter] = useState(filters.faculty_id || 'all');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Create Locator Slip Form
    const { data, setData, post, processing, reset, errors } = useForm({
        faculty_id: faculties.length > 0 ? String(faculties[0].id) : '',
        destination: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
        time_out: '08:30',
        time_in: '12:00',
        slip_type: 'Official',
        remarks: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/operations/locator-slips', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post('/operations/locator-slips/sync', {}, {
            onFinish: () => setIsSyncing(false),
        });
    };

    const handleStatusUpdate = (slip: Slip, newStatus: string) => {
        router.patch(`/operations/locator-slips/${slip.id}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedSlip?.id === slip.id) {
                    setSelectedSlip(null);
                }
            },
        });
    };

    const handleFilterChange = (status: string, facId: string) => {
        setStatusFilter(status);
        setFacultyFilter(facId);
        router.get('/operations/locator-slips', {
            status,
            faculty_id: facId,
            search,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Client-side search & filtering
    const filteredSlips = useMemo(() => {
        return slips.filter((item) => {
            const matchesSearch =
                !search.trim() ||
                item.slip_number.toLowerCase().includes(search.toLowerCase()) ||
                item.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
                item.destination.toLowerCase().includes(search.toLowerCase()) ||
                item.purpose.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesFaculty = facultyFilter === 'all' || String(item.faculty_id) === facultyFilter;

            return matchesSearch && matchesStatus && matchesFaculty;
        });
    }, [slips, search, statusFilter, facultyFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locator Slips Monitoring - OfficeHub" />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-[#F9FAFB] dark:bg-zinc-950 min-h-screen">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                            <MapPin className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                    Faculty Locator Slips
                                </h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    e-HRIS Synced
                                </span>
                            </div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Track and monitor official or personal faculty campus leaves and guard logs
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
                            Create Locator Slip
                        </Button>
                    </div>
                </div>

                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Total Slips
                            </span>
                            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                                {metrics?.total ?? slips.length}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Currently Out
                            </span>
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {metrics?.active_out ?? 0}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Returned
                            </span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {metrics?.returned ?? 0}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Approved / Scheduled
                            </span>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                {metrics?.approved ?? 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <Input
                                placeholder="Search faculty or destination..."
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
                                <option value="Departed">Departed (Out)</option>
                                <option value="Returned">Returned</option>
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
                        Showing <strong className="text-zinc-800 dark:text-zinc-200">{filteredSlips.length}</strong> record(s)
                    </span>
                </div>

                {/* Locator Slips Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                                    <th className="py-3.5 px-4">Faculty Member</th>
                                    <th className="py-3.5 px-4">Slip Number</th>
                                    <th className="py-3.5 px-4">Destination & Purpose</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4">Expected Window</th>
                                    <th className="py-3.5 px-4">Actual Out / In</th>
                                    <th className="py-3.5 px-3 text-center">Type</th>
                                    <th className="py-3.5 px-3 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                                {filteredSlips.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-zinc-400">
                                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-sm">No locator slips found.</p>
                                            <p className="text-xs text-zinc-400 mt-1">
                                                Create a new slip or click "Sync with e-HRIS" to pull data.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSlips.map((slip, idx) => (
                                        <tr
                                            key={slip.id}
                                            className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                        >
                                            <td className="py-3.5 px-4 text-center font-bold text-zinc-400">
                                                {idx + 1}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    {slip.photo_url ? (
                                                        <img
                                                            src={slip.photo_url}
                                                            alt={slip.faculty_name}
                                                            className="w-8 h-8 rounded-full object-cover border border-amber-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                                                            {slip.faculty_name
                                                                .split(' ')
                                                                .map((n) => n[0])
                                                                .slice(0, 2)
                                                                .join('')}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <button
                                                            onClick={() => setSelectedSlip(slip)}
                                                            className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 transition-colors text-left block"
                                                        >
                                                            {slip.faculty_name}
                                                        </button>
                                                        <span className="text-[10px] text-zinc-400">
                                                            {slip.program_code} • {slip.faculty_code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                {slip.slip_number}
                                            </td>

                                            <td className="py-3.5 px-4 max-w-xs">
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                    {slip.destination}
                                                </p>
                                                <p className="text-[11px] text-zinc-400 truncate">
                                                    {slip.purpose}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-4 font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                                {slip.date}
                                            </td>

                                            <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                                                {slip.time_out} - {slip.time_in}
                                            </td>

                                            <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                                                <div className="text-[11px]">
                                                    <span className="text-zinc-400">Out:</span>{' '}
                                                    <strong className={slip.actual_time_out !== '—' ? 'text-rose-600' : 'text-zinc-400'}>
                                                        {slip.actual_time_out}
                                                    </strong>
                                                </div>
                                                <div className="text-[11px]">
                                                    <span className="text-zinc-400">In:</span>{' '}
                                                    <strong className={slip.actual_time_in !== '—' ? 'text-emerald-600' : 'text-zinc-400'}>
                                                        {slip.actual_time_in}
                                                    </strong>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    slip.slip_type === 'Official'
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                                }`}>
                                                    {slip.slip_type}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    slip.status === 'Departed'
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : slip.status === 'Returned'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : slip.status === 'Approved'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-zinc-100 text-zinc-500'
                                                }`}>
                                                    {slip.status === 'Departed' ? 'Out (Departed)' : slip.status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {slip.status === 'Approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleStatusUpdate(slip, 'Departed')}
                                                            className="h-7 px-2.5 text-[11px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                                                        >
                                                            Log Departure
                                                        </Button>
                                                    )}
                                                    {slip.status === 'Departed' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleStatusUpdate(slip, 'Returned')}
                                                            className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            Log Return
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setSelectedSlip(slip)}
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

                {/* CREATE LOCATOR SLIP MODAL */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-amber-500" />
                                Create Faculty Locator Slip
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Record and monitor an authorized locator slip for a faculty member from the directory.
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
                                {errors.faculty_id && (
                                    <span className="text-[11px] text-rose-500 font-semibold">{errors.faculty_id}</span>
                                )}
                            </div>

                            {/* Destination */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Destination / Location *
                                </Label>
                                <Input
                                    placeholder="e.g. DSSC Main Campus Admin, CHED Regional Office, Land Bank"
                                    value={data.destination}
                                    onChange={(e) => setData('destination', e.target.value)}
                                    required
                                    className="rounded-xl text-xs"
                                />
                                {errors.destination && (
                                    <span className="text-[11px] text-rose-500 font-semibold">{errors.destination}</span>
                                )}
                            </div>

                            {/* Purpose */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Purpose *
                                </Label>
                                <textarea
                                    rows={2}
                                    placeholder="State the specific purpose of the campus leave..."
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    required
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                                {errors.purpose && (
                                    <span className="text-[11px] text-rose-500 font-semibold">{errors.purpose}</span>
                                )}
                            </div>

                            {/* Date and Times */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Date *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Expected Time Out *
                                    </Label>
                                    <Input
                                        type="time"
                                        value={data.time_out}
                                        onChange={(e) => setData('time_out', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Expected Time In *
                                    </Label>
                                    <Input
                                        type="time"
                                        value={data.time_in}
                                        onChange={(e) => setData('time_in', e.target.value)}
                                        required
                                        className="rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            {/* Slip Type */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Leave Type
                                    </Label>
                                    <select
                                        value={data.slip_type}
                                        onChange={(e) => setData('slip_type', e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                                    >
                                        <option value="Official">Official Business</option>
                                        <option value="Personal">Personal Emergency / Matter</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        Remarks / Notes
                                    </Label>
                                    <Input
                                        placeholder="Optional filing notes..."
                                        value={data.remarks}
                                        onChange={(e) => setData('remarks', e.target.value)}
                                        className="rounded-xl text-xs"
                                    />
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
                                    {processing ? 'Filing...' : 'File Locator Slip'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* SLIP DETAILS MODAL */}
                <Dialog open={!!selectedSlip} onOpenChange={(open) => !open && setSelectedSlip(null)}>
                    <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6">
                        {selectedSlip && (
                            <div>
                                <DialogHeader>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-zinc-400">
                                            {selectedSlip.slip_number}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            selectedSlip.status === 'Departed'
                                                ? 'bg-rose-50 text-rose-700'
                                                : selectedSlip.status === 'Returned'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {selectedSlip.status}
                                        </span>
                                    </div>
                                    <DialogTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">
                                        {selectedSlip.faculty_name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-zinc-400">
                                        {selectedSlip.program_code} • {selectedSlip.faculty_code} • {selectedSlip.slip_type} Leave
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 my-4 text-xs">
                                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60">
                                        <p className="font-bold text-zinc-800 dark:text-zinc-200">
                                            Destination: {selectedSlip.destination}
                                        </p>
                                        <p className="text-zinc-500 mt-1">
                                            Purpose: {selectedSlip.purpose}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Date & Expected</span>
                                            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedSlip.date}</p>
                                            <p className="text-zinc-500 text-[11px]">{selectedSlip.time_out} – {selectedSlip.time_in}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Guard Logged Times</span>
                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                                                Out: <strong className="text-rose-600">{selectedSlip.actual_time_out}</strong>
                                            </p>
                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                                In: <strong className="text-emerald-600">{selectedSlip.actual_time_in}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {selectedSlip.guard_remarks && (
                                        <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
                                            <span className="text-[10px] text-blue-600 font-bold uppercase block">Security Guard Note</span>
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedSlip.guard_remarks}</p>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="gap-2">
                                    {selectedSlip.status === 'Approved' && (
                                        <Button
                                            onClick={() => handleStatusUpdate(selectedSlip, 'Departed')}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
                                        >
                                            Log Faculty Departure
                                        </Button>
                                    )}
                                    {selectedSlip.status === 'Departed' && (
                                        <Button
                                            onClick={() => handleStatusUpdate(selectedSlip, 'Returned')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                                        >
                                            Log Faculty Return
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedSlip(null)}
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
