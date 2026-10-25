import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Building2,
    Monitor,
    Search,
    Plus,
    Edit3,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Wrench,
    Clock,
    Layers,
    ShieldAlert,
    Send,
    Filter,
    Info,
    Laptop,
    AirVent,
    Flame,
    Tv,
    Calendar,
    Activity,
    Check,
    X,
    ChevronRight,
    SlidersHorizontal,
    Sparkles,
    Wifi,
    Cpu,
    Zap,
    DoorClosed,
    FileSpreadsheet,
    Package,
    ArrowUpRight,
    History,
    RefreshCw,
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
    { title: 'Super Admin', href: '/dashboard' },
    { title: 'Laboratory & Facilities', href: '/facilities/rooms' },
    { title: 'Rooms & Laboratories', href: '/facilities/rooms' },
];

export interface RoomItem {
    id: number;
    room_code: string;
    room_name: string;
    building?: string;
    floor?: string;
    type: string;
    custom_type: string;
    capacity: number;
    status: 'Available' | 'In Use' | 'Maintenance' | 'Under Repair' | 'Reserved';
    operational_status: string;
    operating_hours: string;
    supported_activities?: string[];
    capabilities?: {
        has_projector?: boolean;
        num_workstations?: number;
        internet_type?: string;
        specialized_software?: string[];
        has_aircon?: boolean;
        power_redundancy?: string;
        specialized_equipment?: string;
    };
    availability_rules?: {
        regular_hours?: string;
        blocked_periods?: string[];
        recurring_maintenance?: string[];
        temporary_closures?: string[];
    };
    effective_from?: string;
    effective_until?: string;
    is_accessible: boolean;
    equipment_details?: string;
    notes?: string;
    scheduled_count: number;
    active_complaints_count: number;
    inventory_summary?: {
        total: number;
        operational: number;
        for_repair: number;
    };
    active_maintenance_count?: number;
    current_activity?: string;
    next_schedule?: {
        subject: string;
        time: string;
        faculty: string;
    } | null;
}

interface Props {
    currentPeriod: any;
    rooms: {
        data: RoomItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    faculties: Array<{ id: number; name: string; email: string }>;
    buildings: string[];
    configuredTypes: string[];
    stats: {
        totalFacilities: number;
        availableToday: number;
        inUse: number;
        underMaintenance: number;
        temporarilyUnavailable: number;
        capacityIssues: number;
    };
    filters: {
        search?: string;
        type?: string;
        building?: string;
        status?: string;
    };
    recentComplaints?: any[];
}

export default function RoomsAndLaboratoriesIndex({
    currentPeriod,
    rooms,
    faculties = [],
    buildings = [],
    configuredTypes = [],
    stats,
    filters = {},
    recentComplaints = [],
}: Props) {
    const roomList = rooms?.data || [];

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [buildingFilter, setBuildingFilter] = useState(filters.building || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    // Drawer / Workspace state
    const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
    const [workspaceTab, setWorkspaceTab] = useState<
        'overview' | 'schedule' | 'status' | 'equipment' | 'availability' | 'utilization' | 'incidents' | 'maintenance' | 'history'
    >('overview');

    // Modals
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingRoom, setDeletingRoom] = useState<RoomItem | null>(null);
    const [isFindAvailableOpen, setIsFindAvailableOpen] = useState(false);
    const [isComplaintOpen, setIsComplaintOpen] = useState(false);
    const [complaintRoom, setComplaintRoom] = useState<RoomItem | null>(null);

    // Find Available Room State
    const [findCriteria, setFindCriteria] = useState({
        capacity: '35',
        facility_type: 'all',
        require_workstations: true,
        require_projector: true,
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '11:00',
    });
    const [findResults, setFindResults] = useState<any[] | null>(null);
    const [isSearchingAvailable, setIsSearchingAvailable] = useState(false);

    // Room Create / Edit Form
    const roomForm = useForm({
        room_name: '',
        room_code: '',
        building: 'CIDS Main',
        floor: '2nd Floor',
        type: 'Laboratory',
        custom_type: 'Computer Laboratory',
        capacity: 40,
        status: 'Available',
        operational_status: 'Available',
        operating_hours: '7:00 AM - 7:00 PM',
        is_accessible: true,
        equipment_details: '',
        notes: '',
        capabilities: {
            has_projector: true,
            num_workstations: 40,
            internet_type: 'Gigabit Ethernet + Wi-Fi 6',
            specialized_software: ['VS Code', 'Node.js', 'MySQL Workbench'],
            has_aircon: true,
            power_redundancy: 'UPS Protected',
            specialized_equipment: 'Interactive Display & Whiteboard',
        },
        supported_activities: ['Laboratory', 'Lecture', 'Exam', 'Hands-on Workshop'],
        availability_rules: {
            regular_hours: 'Monday - Saturday: 7:00 AM - 7:00 PM',
            blocked_periods: [],
            recurring_maintenance: ['Friday 5:00 PM - 7:00 PM'],
            temporary_closures: [],
        },
    });

    const openAddModal = () => {
        setEditingRoom(null);
        roomForm.setData({
            room_name: '',
            room_code: '',
            building: 'CIDS Main',
            floor: '2nd Floor',
            type: 'Laboratory',
            custom_type: 'Computer Laboratory',
            capacity: 40,
            status: 'Available',
            operational_status: 'Available',
            operating_hours: '7:00 AM - 7:00 PM',
            is_accessible: true,
            equipment_details: '40 Desktop PCs, 2 Split AC, 1 Projector, 1 Whiteboard',
            notes: 'Official CIDS Facility Record',
            capabilities: {
                has_projector: true,
                num_workstations: 40,
                internet_type: 'Gigabit Ethernet + Wi-Fi 6',
                specialized_software: ['VS Code', 'Node.js', 'MySQL Workbench'],
                has_aircon: true,
                power_redundancy: 'UPS Protected',
                specialized_equipment: 'Interactive Display & Whiteboard',
            },
            supported_activities: ['Laboratory', 'Lecture', 'Exam', 'Hands-on Workshop'],
            availability_rules: {
                regular_hours: 'Monday - Saturday: 7:00 AM - 7:00 PM',
                blocked_periods: [],
                recurring_maintenance: ['Friday 5:00 PM - 7:00 PM'],
                temporary_closures: [],
            },
        });
        roomForm.clearErrors();
        setIsAddEditOpen(true);
    };

    const openEditModal = (room: RoomItem) => {
        setEditingRoom(room);
        roomForm.setData({
            room_name: room.room_name,
            room_code: room.room_code || '',
            building: room.building || 'CIDS Main',
            floor: room.floor || '2nd Floor',
            type: room.type,
            custom_type: room.custom_type || (room.type === 'Laboratory' ? 'Computer Laboratory' : 'Lecture Room'),
            capacity: room.capacity,
            status: room.status,
            operational_status: room.operational_status || 'Available',
            operating_hours: room.operating_hours || '7:00 AM - 7:00 PM',
            is_accessible: room.is_accessible,
            equipment_details: room.equipment_details || '',
            notes: room.notes || '',
            capabilities: room.capabilities || {
                has_projector: true,
                num_workstations: room.type === 'Laboratory' ? room.capacity : 0,
                internet_type: 'Gigabit Ethernet + Wi-Fi 6',
                specialized_software: [],
                has_aircon: true,
                power_redundancy: 'Standard Grid',
                specialized_equipment: '',
            },
            supported_activities: room.supported_activities || ['Lecture', 'Exam'],
            availability_rules: room.availability_rules || {
                regular_hours: '7:00 AM - 7:00 PM',
                blocked_periods: [],
                recurring_maintenance: [],
                temporary_closures: [],
            },
        });
        roomForm.clearErrors();
        setIsAddEditOpen(true);
    };

    const handleRoomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRoom) {
            roomForm.put(`/facilities/rooms/${editingRoom.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditOpen(false);
                    setEditingRoom(null);
                },
            });
        } else {
            roomForm.post('/facilities/rooms', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditOpen(false);
                    roomForm.reset();
                },
            });
        }
    };

    // Delete Room
    const deleteForm = useForm({});
    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingRoom) return;
        deleteForm.delete(`/facilities/rooms/${deletingRoom.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                if (selectedRoom?.id === deletingRoom.id) {
                    setSelectedRoom(null);
                }
                setDeletingRoom(null);
            },
        });
    };

    // Execute Find Available Room
    const executeFindAvailable = async () => {
        setIsSearchingAvailable(true);
        try {
            const params = new URLSearchParams({
                capacity: findCriteria.capacity,
                facility_type: findCriteria.facility_type,
                day_of_week: findCriteria.day_of_week,
                start_time: findCriteria.start_time,
                end_time: findCriteria.end_time,
                require_workstations: String(findCriteria.require_workstations),
                require_projector: String(findCriteria.require_projector),
            });
            const res = await fetch(`/facilities/rooms/find-available?${params.toString()}`);
            const data = await res.json();
            setFindResults(data.facilities || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearchingAvailable(false);
        }
    };

    // Filter Trigger
    const applyFilters = () => {
        router.get(
            '/facilities/rooms',
            {
                search: search || undefined,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                building: buildingFilter !== 'all' ? buildingFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const getStatusBadge = (status: string, opStatus?: string) => {
        const effective = opStatus || status;
        switch (effective) {
            case 'Available':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Available
                    </span>
                );
            case 'In Use':
            case 'In Use as Scheduled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        In Use
                    </span>
                );
            case 'Maintenance':
            case 'Under Repair':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Wrench className="w-3 h-3 text-amber-500" />
                        Maintenance
                    </span>
                );
            case 'Utility Failure':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <Flame className="w-3 h-3 text-rose-500" />
                        Utility Failure
                    </span>
                );
            case 'Closed':
            case 'Reserved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <DoorClosed className="w-3 h-3 text-slate-400" />
                        {effective}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                        {effective}
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms & Laboratories | Authoritative Facility Registry" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                {/* 1. Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                                <Building2 className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Rooms &amp; Laboratories
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Authoritative College Facility Registry · Physical Spaces, Capabilities &amp; Availability
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={() => {
                                setIsFindAvailableOpen(true);
                                executeFindAvailable();
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Find Available Room</span>
                        </button>

                        <Link
                            href="/facilities/lab-inventory"
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-xs"
                        >
                            <Monitor className="w-3.5 h-3.5 text-blue-500" />
                            <span>Lab Inventory</span>
                        </Link>

                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>+ Add Facility</span>
                        </button>
                    </div>
                </div>

                {/* 2. Summary KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Facilities</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {stats.totalFacilities}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Physical spaces</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Available Today</span>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {stats.availableToday}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Ready for classes</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">In Use</span>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                            {stats.inUse}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Active session</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Under Maintenance</span>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                            {stats.underMaintenance}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Repair or electrical</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Unavailable</span>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                            {stats.temporarilyUnavailable}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Utility failure / closed</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Capacity Issues</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {stats.capacityIssues}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Capacity &lt; 25</p>
                    </div>
                </div>

                {/* 3. Filters Toolbar */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search room code, name, building, equipment..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        {/* Facility Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                router.get('/facilities/rooms', {
                                    search: search || undefined,
                                    type: e.target.value !== 'all' ? e.target.value : undefined,
                                    building: buildingFilter !== 'all' ? buildingFilter : undefined,
                                    status: statusFilter !== 'all' ? statusFilter : undefined,
                                }, { preserveState: true });
                            }}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Facility Types</option>
                            <option value="Computer Laboratory">Computer Laboratory</option>
                            <option value="Networking Laboratory">Networking Laboratory</option>
                            <option value="Lecture Room">Lecture Room</option>
                            <option value="Conference Room">Conference Room</option>
                            <option value="Science Laboratory">Science Laboratory</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Studio">Studio</option>
                            <option value="Office">Office</option>
                        </select>

                        {/* Building Filter */}
                        <select
                            value={buildingFilter}
                            onChange={(e) => {
                                setBuildingFilter(e.target.value);
                                router.get('/facilities/rooms', {
                                    search: search || undefined,
                                    type: typeFilter !== 'all' ? typeFilter : undefined,
                                    building: e.target.value !== 'all' ? e.target.value : undefined,
                                    status: statusFilter !== 'all' ? statusFilter : undefined,
                                }, { preserveState: true });
                            }}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Buildings</option>
                            {buildings.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                router.get('/facilities/rooms', {
                                    search: search || undefined,
                                    type: typeFilter !== 'all' ? typeFilter : undefined,
                                    building: buildingFilter !== 'all' ? buildingFilter : undefined,
                                    status: e.target.value !== 'all' ? e.target.value : undefined,
                                }, { preserveState: true });
                            }}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="In Use">In Use</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Utility Failure">Utility Failure</option>
                            <option value="Reserved">Reserved</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={applyFilters}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg cursor-pointer"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                {/* 4. Main Views: Table with Facility Workspaces */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Room / Facility</th>
                                    <th className="px-4 py-3">Type &amp; Capabilities</th>
                                    <th className="px-4 py-3">Capacity</th>
                                    <th className="px-4 py-3">Operational Status</th>
                                    <th className="px-4 py-3">Current / Next Schedule</th>
                                    <th className="px-4 py-3">Inventory Summary</th>
                                    <th className="px-4 py-3">Issues</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {roomList.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                            <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                                            <p className="font-bold text-slate-600 dark:text-slate-300">No rooms or laboratories found</p>
                                            <p className="text-xs text-slate-400 mt-1">Try clearing your filters or create a new facility record.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    roomList.map((room) => (
                                        <tr
                                            key={room.id}
                                            onClick={() => {
                                                setSelectedRoom(room);
                                                setWorkspaceTab('overview');
                                            }}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                                        >
                                            {/* Room Identification */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs shrink-0 border border-amber-500/20">
                                                        {room.room_name.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 dark:text-white hover:text-amber-600 transition-colors">
                                                            {room.room_name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                                            <span>{room.building || 'CIDS'}</span>
                                                            <span>·</span>
                                                            <span>{room.floor || '2F'}</span>
                                                            <span>·</span>
                                                            <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-slate-600 dark:text-slate-300">
                                                                {room.room_code}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Facility Type & Capabilities */}
                                            <td className="px-4 py-3">
                                                <span className="inline-block font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    {room.custom_type}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 flex-wrap">
                                                    {room.capabilities?.has_projector && (
                                                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                                                            <Tv className="w-2.5 h-2.5 text-slate-400" /> Projector
                                                        </span>
                                                    )}
                                                    {room.capabilities?.num_workstations ? (
                                                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                                                            <Laptop className="w-2.5 h-2.5 text-slate-400" /> {room.capabilities.num_workstations} PCs
                                                        </span>
                                                    ) : null}
                                                    {room.capabilities?.has_aircon && (
                                                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                                                            <AirVent className="w-2.5 h-2.5 text-slate-400" /> AC
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Capacity */}
                                            <td className="px-4 py-3">
                                                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                                                    {room.capacity} seats
                                                </span>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {room.is_accessible ? 'PWD Accessible' : 'Standard Access'}
                                                </p>
                                            </td>

                                            {/* Current Operational Status */}
                                            <td className="px-4 py-3">
                                                {getStatusBadge(room.status, room.operational_status)}
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {room.operating_hours || '7:00 AM - 7:00 PM'}
                                                </p>
                                            </td>

                                            {/* Current / Next Schedule */}
                                            <td className="px-4 py-3">
                                                {room.next_schedule ? (
                                                    <div>
                                                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                            {room.next_schedule.subject}
                                                        </span>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            {room.next_schedule.time}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {room.next_schedule.faculty}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">No active classes</span>
                                                )}
                                            </td>

                                            {/* Inventory Summary */}
                                            <td className="px-4 py-3">
                                                {room.inventory_summary?.total ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                                            <Package className="w-3.5 h-3.5 text-blue-500" />
                                                            <span>{room.inventory_summary.total} Assets</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            <span className="text-emerald-600 font-bold">{room.inventory_summary.operational}</span> Good ·{' '}
                                                            <span className="text-amber-600 font-bold">{room.inventory_summary.for_repair}</span> Repair
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">0 registered items</span>
                                                )}
                                            </td>

                                            {/* Issues / Complaints */}
                                            <td className="px-4 py-3">
                                                {room.active_complaints_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                        {room.active_complaints_count} Issue{room.active_complaints_count > 1 ? 's' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                                                        <Check className="w-3.5 h-3.5" /> None
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(room)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Facility"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeletingRoom(room);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Facility"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {rooms?.links && rooms.links.length > 3 && (
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs text-slate-500">
                                Showing {rooms.data.length} of {rooms.total} total facilities
                            </span>
                            <div className="flex items-center gap-1">
                                {rooms.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-amber-500 text-white font-bold'
                                                : link.url
                                                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                                                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. SLIDE-OVER FACILITY WORKSPACE (DETAILED TABS) */}
                {selectedRoom && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
                        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-right duration-200">
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {selectedRoom.room_name}
                                        </h2>
                                        {getStatusBadge(selectedRoom.status, selectedRoom.operational_status)}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {selectedRoom.custom_type} · {selectedRoom.building} ({selectedRoom.floor}) · {selectedRoom.capacity} Capacity · Code: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedRoom.room_code}</code>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(selectedRoom)}
                                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setSelectedRoom(null)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Workspace Tabs Navigation */}
                            <div className="flex items-center gap-1 px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto text-xs font-bold">
                                {(
                                    [
                                        'overview',
                                        'schedule',
                                        'status',
                                        'equipment',
                                        'availability',
                                        'utilization',
                                        'incidents',
                                        'maintenance',
                                        'history',
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setWorkspaceTab(tab)}
                                        className={`px-3 py-2.5 border-b-2 capitalize transition-colors whitespace-nowrap cursor-pointer ${
                                            workspaceTab === tab
                                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Workspace Tab Content */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {workspaceTab === 'overview' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase">Facility Type</span>
                                                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                                                    {selectedRoom.custom_type}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase">Official Hours</span>
                                                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                                                    {selectedRoom.operating_hours || '7:00 AM - 7:00 PM'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Capabilities Card */}
                                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                                            <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                <Zap className="w-4 h-4 text-amber-500" />
                                                <span>Scheduling Capabilities</span>
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Tv className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-slate-600 dark:text-slate-400">Projector:</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {selectedRoom.capabilities?.has_projector ? 'Available' : 'None'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-slate-600 dark:text-slate-400">Workstations:</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {selectedRoom.capabilities?.num_workstations || 0} Units
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Wifi className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-slate-600 dark:text-slate-400">Network:</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {selectedRoom.capabilities?.internet_type || 'Wi-Fi'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <AirVent className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-slate-600 dark:text-slate-400">Air Conditioning:</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {selectedRoom.capabilities?.has_aircon ? 'Equipped' : 'Ventilated'}
                                                    </span>
                                                </div>
                                            </div>

                                            {selectedRoom.capabilities?.specialized_software && selectedRoom.capabilities.specialized_software.length > 0 && (
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <span className="text-[11px] font-bold text-slate-400">Specialized Software Installed:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {selectedRoom.capabilities.specialized_software.map((sw, i) => (
                                                            <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                                {sw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes & Specs */}
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">Equipment &amp; Inventory Details:</p>
                                            <p>{selectedRoom.equipment_details || 'No baseline equipment notes registered.'}</p>
                                            {selectedRoom.notes && <p className="italic text-[11px] text-slate-400 mt-1">Notes: {selectedRoom.notes}</p>}
                                        </div>
                                    </div>
                                )}

                                {workspaceTab === 'equipment' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold">Inventory System Decoupling</p>
                                                <p className="text-[11px] mt-0.5 text-blue-700 dark:text-blue-400">
                                                    Equipment details are managed authoritative in Lab Inventory Management. A room remains schedulable even if individual devices are defective.
                                                </p>
                                            </div>
                                            <Link
                                                href={`/facilities/lab-inventory?room_id=${selectedRoom.id}`}
                                                className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap ml-3"
                                            >
                                                Open Inventory
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-800/40">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Items</span>
                                                <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                                                    {selectedRoom.inventory_summary?.total || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 border rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Operational</span>
                                                <p className="text-xl font-black text-emerald-600 mt-1">
                                                    {selectedRoom.inventory_summary?.operational || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 border rounded-xl bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                                                <span className="text-[10px] font-bold text-amber-600 uppercase">In Repair</span>
                                                <p className="text-xl font-black text-amber-600 mt-1">
                                                    {selectedRoom.inventory_summary?.for_repair || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {workspaceTab === 'schedule' && (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                Semester Published Timetable: {selectedRoom.scheduled_count} Classes Sched.
                                            </span>
                                            <Link
                                                href={`/schedule/master-timetable?room=${selectedRoom.room_name}`}
                                                className="text-amber-600 hover:underline font-bold"
                                            >
                                                View Timetable Grid →
                                            </Link>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            The room operational status is independent of the timetable. If network or power fails, scheduled classes will be marked Transferred or Rescheduled rather than dropping the canonical schedule.
                                        </p>
                                    </div>
                                )}

                                {workspaceTab === 'status' && (
                                    <div className="space-y-3 text-xs">
                                        <div className="p-3 border rounded-xl space-y-2">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">Live Status Override</p>
                                            <p className="text-slate-500 text-[11px]">
                                                Current live operational state: <span className="font-bold">{selectedRoom.operational_status}</span>
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 pt-2">
                                                {['Available', 'In Use as Scheduled', 'Occupied Unexpectedly', 'Maintenance', 'Utility Failure', 'Closed'].map((st) => (
                                                    <button
                                                        key={st}
                                                        onClick={() => {
                                                            router.put(`/facilities/rooms/${selectedRoom.id}`, {
                                                                ...selectedRoom,
                                                                operational_status: st,
                                                            }, { preserveScroll: true });
                                                        }}
                                                        className={`px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer ${
                                                            selectedRoom.operational_status === st
                                                                ? 'bg-amber-500 text-white border-amber-500 font-bold'
                                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {st}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {workspaceTab === 'availability' && (
                                    <div className="space-y-3 text-xs">
                                        <div className="p-3 border rounded-xl space-y-2">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">Defined Availability Rules</p>
                                            <p className="text-slate-500">
                                                Operating Hours: {selectedRoom.availability_rules?.regular_hours || selectedRoom.operating_hours}
                                            </p>
                                            <p className="text-slate-500">
                                                Recurring Maintenance: {selectedRoom.availability_rules?.recurring_maintenance?.join(', ') || 'None scheduled'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {workspaceTab === 'utilization' && (
                                    <div className="space-y-3 text-xs">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                                            <span className="text-slate-400 font-bold uppercase text-[10px]">Estimated Seat Utilization</span>
                                            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
                                                {selectedRoom.capacity > 0 ? Math.round((selectedRoom.scheduled_count * 28) / (selectedRoom.capacity * 6) * 100) : 0}%
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Based on published weekly class hours</p>
                                        </div>
                                    </div>
                                )}

                                {workspaceTab === 'incidents' && (
                                    <div className="space-y-3 text-xs">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">Facility Disruptions &amp; Incidents</p>
                                        {selectedRoom.active_complaints_count > 0 ? (
                                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl text-amber-800 dark:text-amber-300">
                                                {selectedRoom.active_complaints_count} active reported issues under review.
                                            </div>
                                        ) : (
                                            <p className="text-slate-400 italic">No room-level disruptions reported.</p>
                                        )}
                                    </div>
                                )}

                                {workspaceTab === 'maintenance' && (
                                    <div className="space-y-3 text-xs">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">Facility Maintenance Records</p>
                                        <p className="text-slate-500">
                                            Air conditioning servicing, electrical inspection, and network cable maintenance records.
                                        </p>
                                    </div>
                                )}

                                {workspaceTab === 'history' && (
                                    <div className="space-y-3 text-xs">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">Room Activity History</p>
                                        <p className="text-slate-400 italic">Audit tracking recorded for status updates and modifications.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. MODAL: Add / Edit Facility */}
                <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-amber-500" />
                                <span>{editingRoom ? `Edit Facility: ${editingRoom.room_name}` : 'Register New Facility'}</span>
                            </DialogTitle>
                            <DialogDescription>
                                Set room attributes, custom type, capacity, scheduling capabilities, and operational rules.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRoomSubmit} className="space-y-4 py-2 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Room Name / Label</Label>
                                    <Input
                                        required
                                        placeholder="e.g. CLR 3"
                                        value={roomForm.data.room_name}
                                        onChange={(e) => roomForm.setData('room_name', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Room Code (Unique)</Label>
                                    <Input
                                        placeholder="e.g. CLR-3"
                                        value={roomForm.data.room_code}
                                        onChange={(e) => roomForm.setData('room_code', e.target.value)}
                                        className="mt-1 font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Building</Label>
                                    <Input
                                        value={roomForm.data.building}
                                        onChange={(e) => roomForm.setData('building', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Floor</Label>
                                    <Input
                                        value={roomForm.data.floor}
                                        onChange={(e) => roomForm.setData('floor', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Capacity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={500}
                                        required
                                        value={roomForm.data.capacity}
                                        onChange={(e) => roomForm.setData('capacity', Number(e.target.value))}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Base Category</Label>
                                    <select
                                        value={roomForm.data.type}
                                        onChange={(e) => roomForm.setData('type', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="Laboratory">Laboratory</option>
                                        <option value="Lecture">Lecture</option>
                                        <option value="Conference">Conference</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Custom Facility Type (Configurable)</Label>
                                    <Input
                                        placeholder="e.g. Computer Laboratory, Studio, Workshop"
                                        value={roomForm.data.custom_type}
                                        onChange={(e) => roomForm.setData('custom_type', e.target.value)}
                                        className="mt-1 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Operational Status</Label>
                                    <select
                                        value={roomForm.data.operational_status}
                                        onChange={(e) => roomForm.setData('operational_status', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="Available">Available</option>
                                        <option value="In Use as Scheduled">In Use as Scheduled</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Utility Failure">Utility Failure</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Operating Hours</Label>
                                    <Input
                                        value={roomForm.data.operating_hours}
                                        onChange={(e) => roomForm.setData('operating_hours', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Capabilities */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2.5 border border-slate-200 dark:border-slate-700">
                                <Label className="text-xs font-black uppercase text-amber-600">Capabilities for Scheduler</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={roomForm.data.capabilities.has_projector}
                                            onChange={(e) =>
                                                roomForm.setData('capabilities', {
                                                    ...roomForm.data.capabilities,
                                                    has_projector: e.target.checked,
                                                })
                                            }
                                        />
                                        <span>Has Projector</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={roomForm.data.capabilities.has_aircon}
                                            onChange={(e) =>
                                                roomForm.setData('capabilities', {
                                                    ...roomForm.data.capabilities,
                                                    has_aircon: e.target.checked,
                                                })
                                            }
                                        />
                                        <span>Air-conditioned</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={roomForm.data.is_accessible}
                                            onChange={(e) => roomForm.setData('is_accessible', e.target.checked)}
                                        />
                                        <span>PWD Accessible</span>
                                    </label>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">PC Workstations Count</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={roomForm.data.capabilities.num_workstations}
                                        onChange={(e) =>
                                            roomForm.setData('capabilities', {
                                                ...roomForm.data.capabilities,
                                                num_workstations: Number(e.target.value),
                                            })
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Equipment &amp; Inventory Baseline Summary</Label>
                                <Textarea
                                    rows={2}
                                    value={roomForm.data.equipment_details}
                                    onChange={(e) => roomForm.setData('equipment_details', e.target.value)}
                                    placeholder="e.g. 40 Desktop PCs, 2 Split AC, 1 Projector"
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={roomForm.processing} className="bg-amber-500 hover:bg-amber-600 text-white">
                                    {editingRoom ? 'Update Facility' : 'Create Facility'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 7. MODAL: Find Available Room */}
                <Dialog open={isFindAvailableOpen} onOpenChange={setIsFindAvailableOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <span>Find Available Compatible Facility</span>
                            </DialogTitle>
                            <DialogDescription>
                                Match compatible rooms with required class size, workstations, and equipment with zero timetable conflicts.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2 text-xs">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Required Class Size</Label>
                                    <Input
                                        type="number"
                                        value={findCriteria.capacity}
                                        onChange={(e) => setFindCriteria({ ...findCriteria, capacity: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Day of Week</Label>
                                    <select
                                        value={findCriteria.day_of_week}
                                        onChange={(e) => setFindCriteria({ ...findCriteria, day_of_week: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Facility Type</Label>
                                    <select
                                        value={findCriteria.facility_type}
                                        onChange={(e) => setFindCriteria({ ...findCriteria, facility_type: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="all">Any Compatible</option>
                                        <option value="Computer Laboratory">Computer Laboratory</option>
                                        <option value="Lecture Room">Lecture Room</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Start Time</Label>
                                    <Input
                                        type="time"
                                        value={findCriteria.start_time}
                                        onChange={(e) => setFindCriteria({ ...findCriteria, start_time: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">End Time</Label>
                                    <Input
                                        type="time"
                                        value={findCriteria.end_time}
                                        onChange={(e) => setFindCriteria({ ...findCriteria, end_time: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={findCriteria.require_workstations}
                                        onChange={(e) => setFindCriteria({ ...findCriteria, require_workstations: e.target.checked })}
                                    />
                                    <span>Require Workstations</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={findCriteria.require_projector}
                                        onChange={(e) => setFindCriteria({ ...findCriteria, require_projector: e.target.checked })}
                                    />
                                    <span>Require Projector</span>
                                </label>

                                <button
                                    onClick={executeFindAvailable}
                                    disabled={isSearchingAvailable}
                                    className="ml-auto px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg cursor-pointer"
                                >
                                    {isSearchingAvailable ? 'Scanning...' : 'Search Free Facilities'}
                                </button>
                            </div>

                            {/* Search Results Display */}
                            {findResults !== null && (
                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-3">
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b">
                                        Compatible Available Facilities ({findResults.length} match{findResults.length === 1 ? '' : 'es'})
                                    </div>
                                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                        {findResults.length === 0 ? (
                                            <p className="p-4 text-center text-slate-400 italic">No free compatible facilities for this time window.</p>
                                        ) : (
                                            findResults.map((r: any) => (
                                                <div key={r.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 dark:text-white">{r.room_name}</span>
                                                        <span className="ml-2 text-slate-500 text-[11px]">{r.custom_type} · {r.capacity} Seats · {r.building}</span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Free &amp; Ready
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* 8. MODAL: Delete Facility */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-600 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                <span>Delete Facility</span>
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to permanently delete "{deletingRoom?.room_name}" from the authoritative registry?
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDeleteSubmit} className="pt-2">
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="destructive" disabled={deleteForm.processing}>
                                    Delete Facility
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
