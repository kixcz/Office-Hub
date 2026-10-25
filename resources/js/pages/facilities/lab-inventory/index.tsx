import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Monitor,
    Building2,
    Search,
    Plus,
    Edit3,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Wrench,
    Clock,
    Package,
    ShieldAlert,
    Filter,
    Laptop,
    Tv,
    Sparkles,
    Check,
    X,
    Barcode,
    SlidersHorizontal,
    QrCode,
    FileSpreadsheet,
    FileText,
    History,
    RefreshCw,
    Layers,
    UserCheck,
    AlertCircle,
    ArrowUpRight,
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
    { title: 'Lab Inventory Management', href: '/facilities/lab-inventory' },
];

export interface InventoryItem {
    id: number;
    room_id: number;
    room_name: string;
    asset_number: string;
    item_name: string;
    tracking_type: 'serialized' | 'non_serialized' | 'consumable';
    category: string;
    brand_model?: string;
    serial_number?: string;
    college: string;
    quantity: number;
    unit: string;
    condition:
        | 'Operational'
        | 'Operational with Minor Issue'
        | 'For Inspection'
        | 'For Repair'
        | 'Under Maintenance'
        | 'Damaged'
        | 'Missing'
        | 'Transferred'
        | 'Condemned'
        | 'Disposed';
    operational_status: string;
    custodian?: string;
    acquisition_batch?: string;
    acquisition_date?: string;
    unit_cost?: number;
    warranty_info?: string;
    last_inspected_at?: string;
    next_inspection_due?: string;
    specs_details?: string;
    remarks?: string;
    room?: {
        id: number;
        room_name: string;
        custom_type?: string;
        building?: string;
    };
}

interface Props {
    items: {
        data: InventoryItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    rooms: Array<{ id: number; room_name: string; type: string; custom_type?: string; building?: string }>;
    categories: string[];
    custodians: string[];
    batches: string[];
    stats: {
        totalAssets: number;
        operationalAssets: number;
        forRepair: number;
        damaged: number;
        missing: number;
        lowStockConsumables: number;
        pendingAdjustments: number;
        inspectionsDue: number;
        openMaintenanceRequests: number;
    };
    recentTickets: any[];
    recentAdjustments: any[];
    activeInspectionCycles: any[];
    filters: {
        search?: string;
        room_id?: string;
        category?: string;
        tracking_type?: string;
        condition?: string;
        status?: string;
    };
}

export default function LabInventoryManagementIndex({
    items,
    rooms = [],
    categories = [],
    custodians = [],
    batches = [],
    stats,
    recentTickets = [],
    recentAdjustments = [],
    activeInspectionCycles = [],
    filters = {},
}: Props) {
    const itemList = items?.data || [];

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRoomId, setSelectedRoomId] = useState(filters.room_id || 'all');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedTrackingType, setSelectedTrackingType] = useState(filters.tracking_type || 'all');
    const [selectedCondition, setSelectedCondition] = useState(filters.condition || 'all');

    // Drawer / Workspace state
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [workspaceTab, setWorkspaceTab] = useState<
        'overview' | 'location' | 'inspections' | 'maintenance' | 'transfers' | 'audit'
    >('overview');

    // Modals
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
    const [maintenanceItem, setMaintenanceItem] = useState<InventoryItem | null>(null);

    // Asset Add / Edit Form
    const itemForm = useForm({
        room_id: rooms[0]?.id || 1,
        asset_number: '',
        item_name: '',
        tracking_type: 'serialized' as 'serialized' | 'non_serialized' | 'consumable',
        category: 'Computers & Workstations',
        brand_model: '',
        serial_number: '',
        college: 'College of Information and Computing Studies (CIDS)',
        quantity: 1,
        unit: 'unit',
        condition: 'Operational' as any,
        operational_status: 'Active',
        custodian: 'Head Lab In-Charge',
        acquisition_batch: 'BATCH-2024-Q3',
        acquisition_date: '2024-08-15',
        unit_cost: 45000.0,
        warranty_info: '3 Years Standard Warranty',
        last_inspected_at: '2026-09-15',
        next_inspection_due: '2026-11-15',
        specs_details: '',
        remarks: '',
    });

    const openAddModal = () => {
        setEditingItem(null);
        itemForm.setData({
            room_id: rooms[0]?.id || 1,
            asset_number: '',
            item_name: '',
            tracking_type: 'serialized',
            category: 'Computers & Workstations',
            brand_model: 'Dell OptiPlex 7090 / Core i7 / 16GB RAM / 512GB SSD',
            serial_number: '',
            college: 'College of Information and Computing Studies (CIDS)',
            quantity: 1,
            unit: 'unit',
            condition: 'Operational',
            operational_status: 'Active',
            custodian: 'Head Lab In-Charge',
            acquisition_batch: 'BATCH-2024-Q3',
            acquisition_date: '2024-08-15',
            unit_cost: 45000.0,
            warranty_info: '3 Years On-Site Support',
            last_inspected_at: '2026-09-15',
            next_inspection_due: '2026-11-15',
            specs_details: 'Core i7-11700, 16GB DDR4, 512GB NVMe, 24" FHD Display',
            remarks: 'Official laboratory asset',
        });
        itemForm.clearErrors();
        setIsAddEditOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        itemForm.setData({
            room_id: item.room_id,
            asset_number: item.asset_number || '',
            item_name: item.item_name,
            tracking_type: item.tracking_type,
            category: item.category,
            brand_model: item.brand_model || '',
            serial_number: item.serial_number || '',
            college: item.college,
            quantity: item.quantity,
            unit: item.unit,
            condition: item.condition,
            operational_status: item.operational_status,
            custodian: item.custodian || '',
            acquisition_batch: item.acquisition_batch || '',
            acquisition_date: item.acquisition_date || '',
            unit_cost: item.unit_cost || 0,
            warranty_info: item.warranty_info || '',
            last_inspected_at: item.last_inspected_at || '',
            next_inspection_due: item.next_inspection_due || '',
            specs_details: item.specs_details || '',
            remarks: item.remarks || '',
        });
        itemForm.clearErrors();
        setIsAddEditOpen(true);
    };

    const handleItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            itemForm.put(`/facilities/lab-inventory/${editingItem.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditOpen(false);
                    setEditingItem(null);
                },
            });
        } else {
            itemForm.post('/facilities/lab-inventory', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditOpen(false);
                    itemForm.reset();
                },
            });
        }
    };

    // Delete Item
    const deleteForm = useForm({ reason: 'Decommissioned by Super Admin' });
    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingItem) return;
        deleteForm.delete(`/facilities/lab-inventory/${deletingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                if (selectedItem?.id === deletingItem.id) {
                    setSelectedItem(null);
                }
                setDeletingItem(null);
            },
        });
    };

    // Inventory Adjustment Form
    const adjustmentForm = useForm({
        item_id: null as number | null,
        type: 'Count Discrepancy' as any,
        new_quantity: 1,
        new_condition: 'Operational',
        reason: '',
    });

    const openAdjustmentModal = (item: InventoryItem) => {
        setAdjustingItem(item);
        adjustmentForm.setData({
            item_id: item.id,
            type: 'Count Discrepancy',
            new_quantity: item.quantity,
            new_condition: item.condition,
            reason: '',
        });
        adjustmentForm.clearErrors();
        setIsAdjustmentOpen(true);
    };

    const handleAdjustmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        adjustmentForm.post('/facilities/lab-inventory/adjustments', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdjustmentOpen(false);
                setAdjustingItem(null);
            },
        });
    };

    // Maintenance Ticket Form
    const maintenanceForm = useForm({
        item_id: null as number | null,
        room_id: rooms[0]?.id || 1,
        title: '',
        reported_problem: '',
        severity: 'Medium' as any,
        assigned_technician: 'Campus IT Service Desk',
        repair_status: 'Reported' as any,
        cost: 0,
    });

    const openMaintenanceModal = (item?: InventoryItem) => {
        setMaintenanceItem(item || null);
        maintenanceForm.setData({
            item_id: item ? item.id : null,
            room_id: item ? item.room_id : (rooms[0]?.id || 1),
            title: item ? `Maintenance for ${item.item_name}` : 'Laboratory Equipment Repair',
            reported_problem: item?.remarks || '',
            severity: 'Medium',
            assigned_technician: 'Campus IT Service Desk',
            repair_status: 'Reported',
            cost: 0,
        });
        maintenanceForm.clearErrors();
        setIsMaintenanceOpen(true);
    };

    const handleMaintenanceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        maintenanceForm.post('/facilities/lab-inventory/maintenance', {
            preserveScroll: true,
            onSuccess: () => {
                setIsMaintenanceOpen(false);
                setMaintenanceItem(null);
            },
        });
    };

    // Filter Trigger
    const applyFilters = () => {
        router.get(
            '/facilities/lab-inventory',
            {
                search: search || undefined,
                room_id: selectedRoomId !== 'all' ? selectedRoomId : undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                tracking_type: selectedTrackingType !== 'all' ? selectedTrackingType : undefined,
                condition: selectedCondition !== 'all' ? selectedCondition : undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const getConditionBadge = (condition: InventoryItem['condition']) => {
        switch (condition) {
            case 'Operational':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                        <Check className="w-2.5 h-2.5" /> Operational
                    </span>
                );
            case 'Operational with Minor Issue':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
                        Minor Issue
                    </span>
                );
            case 'For Repair':
            case 'Under Maintenance':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                        <Wrench className="w-2.5 h-2.5" /> {condition}
                    </span>
                );
            case 'Damaged':
            case 'Missing':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                        <AlertTriangle className="w-2.5 h-2.5" /> {condition}
                    </span>
                );
            case 'Condemned':
            case 'Disposed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {condition}
                    </span>
                );
            default:
                return <span className="text-[10px] font-semibold">{condition}</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lab Inventory Management | Authoritative Laboratory Asset System" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                {/* 1. Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20">
                                <Monitor className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Lab Inventory Management
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Authoritative Laboratory Equipment, Serialized Assets, Consumables &amp; Maintenance Tickets
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href="/facilities/rooms"
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-xs"
                        >
                            <Building2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>Rooms Registry</span>
                        </Link>

                        <button
                            onClick={() => openMaintenanceModal()}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            <span>Maintenance Ticket</span>
                        </button>

                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>+ Register Asset</span>
                        </button>
                    </div>
                </div>

                {/* 2. Executive Dashboard Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">Total Assets</span>
                        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.totalAssets}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-600">Operational</span>
                        <p className="text-xl font-black text-emerald-600 mt-1">{stats.operationalAssets}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-amber-600">For Repair</span>
                        <p className="text-xl font-black text-amber-600 mt-1">{stats.forRepair}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-rose-600">Damaged</span>
                        <p className="text-xl font-black text-rose-600 mt-1">{stats.damaged}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-rose-700">Missing</span>
                        <p className="text-xl font-black text-rose-700 mt-1">{stats.missing}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-blue-600">Low Consumables</span>
                        <p className="text-xl font-black text-blue-600 mt-1">{stats.lowStockConsumables}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-amber-600">Pending Adj.</span>
                        <p className="text-xl font-black text-amber-600 mt-1">{stats.pendingAdjustments}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <span className="text-[10px] font-bold text-purple-600">Open Tickets</span>
                        <p className="text-xl font-black text-purple-600 mt-1">{stats.openMaintenanceRequests}</p>
                    </div>
                </div>

                {/* 3. Filters Toolbar */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search asset tag, serial, item name, model..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        {/* Room / Facility Filter */}
                        <select
                            value={selectedRoomId}
                            onChange={(e) => {
                                setSelectedRoomId(e.target.value);
                                router.get('/facilities/lab-inventory', {
                                    search: search || undefined,
                                    room_id: e.target.value !== 'all' ? e.target.value : undefined,
                                    category: selectedCategory !== 'all' ? selectedCategory : undefined,
                                    tracking_type: selectedTrackingType !== 'all' ? selectedTrackingType : undefined,
                                    condition: selectedCondition !== 'all' ? selectedCondition : undefined,
                                }, { preserveState: true });
                            }}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Facilities</option>
                            {rooms.map((r) => (
                                <option key={r.id} value={r.id}>{r.room_name} ({r.building || 'CIDS'})</option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                router.get('/facilities/lab-inventory', {
                                    search: search || undefined,
                                    room_id: selectedRoomId !== 'all' ? selectedRoomId : undefined,
                                    category: e.target.value !== 'all' ? e.target.value : undefined,
                                    tracking_type: selectedTrackingType !== 'all' ? selectedTrackingType : undefined,
                                    condition: selectedCondition !== 'all' ? selectedCondition : undefined,
                                }, { preserveState: true });
                            }}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        {/* Tracking Type */}
                        <select
                            value={selectedTrackingType}
                            onChange={(e) => {
                                setSelectedTrackingType(e.target.value);
                                router.get('/facilities/lab-inventory', {
                                    search: search || undefined,
                                    room_id: selectedRoomId !== 'all' ? selectedRoomId : undefined,
                                    category: selectedCategory !== 'all' ? selectedCategory : undefined,
                                    tracking_type: e.target.value !== 'all' ? e.target.value : undefined,
                                    condition: selectedCondition !== 'all' ? selectedCondition : undefined,
                                }, { preserveState: true });
                            }}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Asset Types</option>
                            <option value="serialized">Serialized Asset</option>
                            <option value="non_serialized">Non-Serialized Equipment</option>
                            <option value="consumable">Consumable Stock</option>
                        </select>

                        {/* Condition Filter */}
                        <select
                            value={selectedCondition}
                            onChange={(e) => {
                                setSelectedCondition(e.target.value);
                                router.get('/facilities/lab-inventory', {
                                    search: search || undefined,
                                    room_id: selectedRoomId !== 'all' ? selectedRoomId : undefined,
                                    category: selectedCategory !== 'all' ? selectedCategory : undefined,
                                    tracking_type: selectedTrackingType !== 'all' ? selectedTrackingType : undefined,
                                    condition: e.target.value !== 'all' ? e.target.value : undefined,
                                }, { preserveState: true });
                            }}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Conditions</option>
                            <option value="Operational">Operational</option>
                            <option value="Operational with Minor Issue">Minor Issue</option>
                            <option value="For Repair">For Repair</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Damaged">Damaged</option>
                            <option value="Missing">Missing</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={applyFilters}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                            Filter
                        </button>
                    </div>
                </div>

                {/* 4. Inventory Assets Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Asset Number &amp; Item</th>
                                    <th className="px-4 py-3">Assigned Facility</th>
                                    <th className="px-4 py-3">Category / Model</th>
                                    <th className="px-4 py-3">Serial Number</th>
                                    <th className="px-4 py-3">Quantity</th>
                                    <th className="px-4 py-3">Condition</th>
                                    <th className="px-4 py-3">Custodian</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {itemList.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                            <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                                            <p className="font-bold text-slate-600 dark:text-slate-300">No laboratory assets found</p>
                                            <p className="text-xs text-slate-400 mt-1">Try clearing filters or register a new piece of equipment.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    itemList.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setWorkspaceTab('overview');
                                            }}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                                        >
                                            {/* Asset ID & Name */}
                                            <td className="px-4 py-3">
                                                <div>
                                                    <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                                                        {item.asset_number}
                                                    </span>
                                                    <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                                                        {item.item_name}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 capitalize">
                                                        {item.tracking_type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Assigned Facility */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {item.room_name}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {item.room?.building || 'CIDS Main'}
                                                </p>
                                            </td>

                                            {/* Category / Model */}
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                                    {item.category}
                                                </span>
                                                <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                                                    {item.brand_model || 'Standard Specification'}
                                                </p>
                                            </td>

                                            {/* Serial Number */}
                                            <td className="px-4 py-3">
                                                {item.serial_number ? (
                                                    <code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                                        {item.serial_number}
                                                    </code>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">N/A</span>
                                                )}
                                            </td>

                                            {/* Quantity */}
                                            <td className="px-4 py-3">
                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                                                    {item.quantity} {item.unit}
                                                </span>
                                            </td>

                                            {/* Condition */}
                                            <td className="px-4 py-3">
                                                {getConditionBadge(item.condition)}
                                            </td>

                                            {/* Custodian */}
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                                                {item.custodian || 'Head Lab In-Charge'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openAdjustmentModal(item)}
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Request / Record Count Adjustment"
                                                    >
                                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Asset"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeletingItem(item);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Asset"
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
                    {items?.links && items.links.length > 3 && (
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs text-slate-500">
                                Showing {items.data.length} of {items.total} total items
                            </span>
                            <div className="flex items-center gap-1">
                                {items.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white font-bold'
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

                {/* 5. SLIDE-OVER ASSET DETAIL WORKSPACE */}
                {selectedItem && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
                        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-right duration-200">
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                            {selectedItem.asset_number}
                                        </span>
                                        {getConditionBadge(selectedItem.condition)}
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                        {selectedItem.item_name}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Located in <span className="font-bold">{selectedItem.room_name}</span> · Custodian: {selectedItem.custodian || 'Head Lab In-Charge'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(selectedItem)}
                                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setSelectedItem(null)}
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
                                        'location',
                                        'inspections',
                                        'maintenance',
                                        'transfers',
                                        'audit',
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setWorkspaceTab(tab)}
                                        className={`px-3 py-2.5 border-b-2 capitalize transition-colors whitespace-nowrap cursor-pointer ${
                                            workspaceTab === tab
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Workspace Tab Content */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                                {workspaceTab === 'overview' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase">Serial Number</span>
                                                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                                                    {selectedItem.serial_number || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase">Quantity / Unit</span>
                                                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                                                    {selectedItem.quantity} {selectedItem.unit}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                                            <span className="font-bold text-slate-400 text-[10px] uppercase">Hardware Specifications &amp; Model</span>
                                            <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                                                {selectedItem.brand_model || 'Standard'}
                                            </p>
                                            {selectedItem.specs_details && (
                                                <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                                    {selectedItem.specs_details}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 border rounded-xl space-y-1">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase">Acquisition Info</span>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.acquisition_batch || 'Batch N/A'}</p>
                                                <p className="text-slate-500">Date: {selectedItem.acquisition_date || 'N/A'}</p>
                                                <p className="text-slate-500">Cost: ₱{Number(selectedItem.unit_cost || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="p-3 border rounded-xl space-y-1">
                                                <span className="font-bold text-slate-400 text-[10px] uppercase">Warranty &amp; Service</span>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.warranty_info || 'Standard institutional support'}</p>
                                                <p className="text-slate-500">Last Inspection: {selectedItem.last_inspected_at || 'Recorded'}</p>
                                                <p className="text-slate-500">Next Inspection: {selectedItem.next_inspection_due || 'Scheduled'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {workspaceTab === 'location' && (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">Assigned Facility Space</p>
                                            <p className="text-sm font-black text-blue-600">{selectedItem.room_name}</p>
                                            <p className="text-slate-500">College: {selectedItem.college}</p>
                                            <p className="text-slate-500">Custodian Accountable: {selectedItem.custodian || 'Head Lab In-Charge'}</p>
                                        </div>
                                    </div>
                                )}

                                {workspaceTab === 'maintenance' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Maintenance Tickets for Asset</span>
                                            <button
                                                onClick={() => openMaintenanceModal(selectedItem)}
                                                className="px-2.5 py-1 text-xs font-bold text-white bg-amber-500 rounded-lg"
                                            >
                                                + New Ticket
                                            </button>
                                        </div>
                                        <p className="text-slate-500 text-[11px]">
                                            Integrated repairs automatically track parts, technician assignments, costs, and resolution notes.
                                        </p>
                                    </div>
                                )}

                                {workspaceTab === 'inspections' && (
                                    <div className="space-y-3">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">Periodic Physical Inspection Results</p>
                                        <p className="text-slate-500">
                                            Physical counts comparing expected records with actual observed condition. Differences trigger discrepancy cases.
                                        </p>
                                    </div>
                                )}

                                {workspaceTab === 'transfers' && (
                                    <div className="space-y-3">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">Movement &amp; Transfer Log</p>
                                        <p className="text-slate-400 italic">No inter-laboratory transfers recorded for this asset.</p>
                                    </div>
                                )}

                                {workspaceTab === 'audit' && (
                                    <div className="space-y-3">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">Immutable Audit Trail</p>
                                        <p className="text-slate-400 italic">Every modification, condition update, and adjustment is logged with user and timestamp.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. MODAL: Register / Edit Asset */}
                <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                <span>{editingItem ? `Edit Asset: ${editingItem.item_name}` : 'Register New Asset'}</span>
                            </DialogTitle>
                            <DialogDescription>
                                Add or update serialized assets, non-serialized equipment, or consumable materials.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleItemSubmit} className="space-y-4 py-2 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Item Name / Description</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Dell OptiPlex 7090 - Station 12"
                                        value={itemForm.data.item_name}
                                        onChange={(e) => itemForm.setData('item_name', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Asset / Property Tag (Unique)</Label>
                                    <Input
                                        placeholder="e.g. AST-CLR3-PC12 (Auto if blank)"
                                        value={itemForm.data.asset_number}
                                        onChange={(e) => itemForm.setData('asset_number', e.target.value)}
                                        className="mt-1 font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Tracking Type</Label>
                                    <select
                                        value={itemForm.data.tracking_type}
                                        onChange={(e) => itemForm.setData('tracking_type', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="serialized">Serialized Asset</option>
                                        <option value="non_serialized">Non-Serialized Equipment</option>
                                        <option value="consumable">Consumable Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Assigned Facility</Label>
                                    <select
                                        value={itemForm.data.room_id}
                                        onChange={(e) => itemForm.setData('room_id', Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        {rooms.map((r) => (
                                            <option key={r.id} value={r.id}>{r.room_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Category</Label>
                                    <Input
                                        value={itemForm.data.category}
                                        onChange={(e) => itemForm.setData('category', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Brand &amp; Model</Label>
                                    <Input
                                        placeholder="e.g. Dell OptiPlex 7090 / Core i7"
                                        value={itemForm.data.brand_model}
                                        onChange={(e) => itemForm.setData('brand_model', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Serial Number</Label>
                                    <Input
                                        placeholder="e.g. SN-89241852"
                                        value={itemForm.data.serial_number}
                                        onChange={(e) => itemForm.setData('serial_number', e.target.value)}
                                        className="mt-1 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        required
                                        value={itemForm.data.quantity}
                                        onChange={(e) => itemForm.setData('quantity', Number(e.target.value))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Unit</Label>
                                    <Input
                                        value={itemForm.data.unit}
                                        onChange={(e) => itemForm.setData('unit', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Current Condition</Label>
                                    <select
                                        value={itemForm.data.condition}
                                        onChange={(e) => itemForm.setData('condition', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="Operational">Operational</option>
                                        <option value="Operational with Minor Issue">Operational with Minor Issue</option>
                                        <option value="For Inspection">For Inspection</option>
                                        <option value="For Repair">For Repair</option>
                                        <option value="Under Maintenance">Under Maintenance</option>
                                        <option value="Damaged">Damaged</option>
                                        <option value="Missing">Missing</option>
                                        <option value="Transferred">Transferred</option>
                                        <option value="Condemned">Condemned</option>
                                        <option value="Disposed">Disposed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Custodian</Label>
                                    <Input
                                        value={itemForm.data.custodian}
                                        onChange={(e) => itemForm.setData('custodian', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Unit Cost (₱)</Label>
                                    <Input
                                        type="number"
                                        value={itemForm.data.unit_cost}
                                        onChange={(e) => itemForm.setData('unit_cost', Number(e.target.value))}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Specifications / Remarks</Label>
                                <Textarea
                                    rows={2}
                                    value={itemForm.data.specs_details}
                                    onChange={(e) => itemForm.setData('specs_details', e.target.value)}
                                    placeholder="Enter technical details, port configuration, installed parts..."
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={itemForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {editingItem ? 'Update Asset' : 'Register Asset'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 7. MODAL: Controlled Adjustment Request / Discrepancy */}
                <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                                <span>Controlled Inventory Adjustment</span>
                            </DialogTitle>
                            <DialogDescription>
                                Adjust item quantity or report discrepancies with accountable justification.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAdjustmentSubmit} className="space-y-4 py-2 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">{adjustingItem?.item_name}</p>
                                <p className="text-slate-500 text-[11px]">
                                    Current Recorded Quantity: <span className="font-bold text-slate-700 dark:text-slate-300">{adjustingItem?.quantity} {adjustingItem?.unit}</span>
                                </p>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Adjustment Type</Label>
                                <select
                                    value={adjustmentForm.data.type}
                                    onChange={(e) => adjustmentForm.setData('type', e.target.value as any)}
                                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                >
                                    <option value="Count Discrepancy">Count Discrepancy (Physical Count Difference)</option>
                                    <option value="Damage Report">Damage Report</option>
                                    <option value="Missing Report">Missing Report</option>
                                    <option value="Surplus Found">Surplus Found</option>
                                    <option value="Disposal">Disposal / Condemnation</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">New Count / Quantity</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        required
                                        value={adjustmentForm.data.new_quantity}
                                        onChange={(e) => adjustmentForm.setData('new_quantity', Number(e.target.value))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">New Condition</Label>
                                    <select
                                        value={adjustmentForm.data.new_condition}
                                        onChange={(e) => adjustmentForm.setData('new_condition', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="Operational">Operational</option>
                                        <option value="For Repair">For Repair</option>
                                        <option value="Damaged">Damaged</option>
                                        <option value="Missing">Missing</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Justification / Audit Reason</Label>
                                <Textarea
                                    required
                                    rows={3}
                                    value={adjustmentForm.data.reason}
                                    onChange={(e) => adjustmentForm.setData('reason', e.target.value)}
                                    placeholder="Explain physical inspection findings, root cause, or audit report..."
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsAdjustmentOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={adjustmentForm.processing} className="bg-amber-500 hover:bg-amber-600 text-white">
                                    Submit &amp; Update Ledger
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 8. MODAL: Create Maintenance Ticket */}
                <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-amber-500" />
                                <span>Create Maintenance Ticket</span>
                            </DialogTitle>
                            <DialogDescription>
                                Dispatch technician, track repair progress, parts, and return-to-service date.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleMaintenanceSubmit} className="space-y-3.5 py-2 text-xs">
                            <div>
                                <Label className="text-xs font-bold">Ticket Title</Label>
                                <Input
                                    required
                                    placeholder="e.g. Display backlight intermittent defect"
                                    value={maintenanceForm.data.title}
                                    onChange={(e) => maintenanceForm.setData('title', e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Severity</Label>
                                    <select
                                        value={maintenanceForm.data.severity}
                                        onChange={(e) => maintenanceForm.setData('severity', e.target.value as any)}
                                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold">Assigned Technician</Label>
                                    <Input
                                        value={maintenanceForm.data.assigned_technician}
                                        onChange={(e) => maintenanceForm.setData('assigned_technician', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Reported Problem Description</Label>
                                <Textarea
                                    required
                                    rows={3}
                                    value={maintenanceForm.data.reported_problem}
                                    onChange={(e) => maintenanceForm.setData('reported_problem', e.target.value)}
                                    placeholder="Describe defect symptoms, error codes, or observed damage..."
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsMaintenanceOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={maintenanceForm.processing} className="bg-amber-500 hover:bg-amber-600 text-white">
                                    Create Ticket
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 9. MODAL: Delete Asset */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-600 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                <span>Delete Inventory Asset</span>
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to permanently delete "{deletingItem?.item_name}" ({deletingItem?.asset_number})? This action writes an irrevocable entry to the audit log.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDeleteSubmit} className="pt-2">
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="destructive" disabled={deleteForm.processing}>
                                    Permanently Delete
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
