import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    Building2, 
    Upload, 
    Plus, 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    Layers, 
    Monitor,
    Edit3,
    Trash2,
    Clock,
    X,
    Filter,
    Wifi,
    Cpu,
    DoorClosed,
    Users
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
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/rooms' },
    { title: 'Rooms & Laboratories', href: '/schedule/master-data/rooms' },
];

export interface WorkspaceRoomItem {
    id: number;
    room_code: string;
    room_name: string;
    building: string;
    floor: string;
    type: 'Laboratory' | 'Lecture' | 'Conference' | 'Office' | 'Other';
    custom_type: string;
    capacity: number;
    status: 'Available' | 'In Use' | 'Maintenance' | 'Under Repair' | 'Reserved';
    readiness: string;
    is_shared: boolean;
    scheduled_count: number;
    equipment_details: string;
    notes?: string | null;
}

interface WorkspaceRoomsProps {
    currentPeriod: any;
    rooms: WorkspaceRoomItem[];
}

export default function WorkspaceRoomsMasterDataPage({ currentPeriod, rooms = [] }: WorkspaceRoomsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRoom, setSelectedRoom] = useState<WorkspaceRoomItem | null>(rooms[0] || null);

    // Modals
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<WorkspaceRoomItem | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingRoom, setDeletingRoom] = useState<WorkspaceRoomItem | null>(null);

    // Form for Add/Edit
    const roomForm = useForm({
        room_name: '',
        room_code: '',
        building: 'Main Academic Hall',
        floor: '1st Floor',
        type: 'Lecture',
        capacity: 45,
        status: 'Available',
        equipment_details: '',
        is_shared: false,
    });

    const openAddModal = () => {
        setEditingRoom(null);
        roomForm.setData({
            room_name: '',
            room_code: '',
            building: 'Main Academic Hall',
            floor: '1st Floor',
            type: 'Lecture',
            capacity: 45,
            status: 'Available',
            equipment_details: '',
            is_shared: false,
        });
        setIsAddEditOpen(true);
    };

    const openEditModal = (room: WorkspaceRoomItem) => {
        setEditingRoom(room);
        roomForm.setData({
            room_name: room.room_name,
            room_code: room.room_code,
            building: room.building,
            floor: room.floor,
            type: room.type,
            capacity: room.capacity,
            status: room.status,
            equipment_details: room.equipment_details || '',
            is_shared: room.is_shared,
        });
        setIsAddEditOpen(true);
    };

    const handleSaveRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRoom) {
            roomForm.put(`/schedule/master-data/rooms/${editingRoom.id}`, {
                onSuccess: () => {
                    setIsAddEditOpen(false);
                    setEditingRoom(null);
                },
            });
        } else {
            roomForm.post('/schedule/master-data/rooms', {
                onSuccess: () => {
                    setIsAddEditOpen(false);
                },
            });
        }
    };

    const confirmDelete = (room: WorkspaceRoomItem) => {
        setDeletingRoom(room);
        setIsDeleteOpen(true);
    };

    const handleDeleteRoom = () => {
        if (!deletingRoom) return;
        router.delete(`/schedule/master-data/rooms/${deletingRoom.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingRoom(null);
            },
        });
    };

    // Filter logic
    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            const matchesSearch =
                r.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.room_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.building.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || r.type.toLowerCase() === typeFilter.toLowerCase();
            const matchesStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [rooms, searchQuery, typeFilter, statusFilter]);

    // Summary counts
    const totalRooms = rooms.length;
    const labCount = rooms.filter((r) => r.type === 'Laboratory').length;
    const lectureCount = rooms.filter((r) => r.type === 'Lecture').length;
    const readyForSolver = rooms.filter((r) => r.status === 'Available').length;
    const maintenanceCount = rooms.filter((r) => r.status === 'Maintenance' || r.status === 'Under Repair').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms & Laboratories - Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="space-y-6 p-6 font-['Poppins']">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-900/30 flex items-center justify-center text-rose-200 shadow-sm">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rooms &amp; Laboratories</h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                        Scheduling Master Data
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    Manage physical learning spaces, computer laboratories, capacity limits, and equipment profiles for automated scheduling.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-rose-950 text-white text-xs font-semibold hover:opacity-95 shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Facility</span>
                            </button>
                        </div>
                    </div>

                    {/* 4 Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900">{totalRooms}</div>
                                <div className="text-[11px] font-medium text-slate-500">Total Facilities</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-900 text-rose-100 flex items-center justify-center shrink-0">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900">{labCount}</div>
                                <div className="text-[11px] font-medium text-slate-500">Computer Labs</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900">{readyForSolver}</div>
                                <div className="text-[11px] font-medium text-slate-500">Available / Solver Ready</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900">{maintenanceCount}</div>
                                <div className="text-[11px] font-medium text-slate-500">Under Maintenance</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search room code, name, or building..."
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white text-slate-700"
                            >
                                <option value="all">All Types</option>
                                <option value="Laboratory">Laboratories</option>
                                <option value="Lecture">Lecture Rooms</option>
                                <option value="Conference">Conference / Hall</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white text-slate-700"
                            >
                                <option value="all">All Status</option>
                                <option value="Available">Available</option>
                                <option value="In Use">In Use</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    {/* Main Layout: Rooms Table & Right Side Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Rooms Table */}
                        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                                        <tr>
                                            <th className="py-3 px-4">Room / Space</th>
                                            <th className="py-3 px-4">Type</th>
                                            <th className="py-3 px-4">Capacity</th>
                                            <th className="py-3 px-4">Building &amp; Floor</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRooms.map((r) => {
                                            const isSelected = selectedRoom?.id === r.id;
                                            return (
                                                <tr
                                                    key={r.id}
                                                    onClick={() => setSelectedRoom(r)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                                                    }`}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{r.room_name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{r.room_code}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                                            r.type === 'Laboratory'
                                                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                        }`}>
                                                            {r.custom_type || r.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-700">
                                                        {r.capacity} seats
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        <div>{r.building}</div>
                                                        <div className="text-[10px] text-slate-400">{r.floor}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            r.status === 'Available'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : r.status === 'In Use'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(r)}
                                                                className="p-1 rounded hover:bg-slate-100 text-slate-600"
                                                                title="Edit Room"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => confirmDelete(r)}
                                                                className="p-1 rounded hover:bg-rose-50 text-rose-600"
                                                                title="Delete Room"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredRooms.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                                    No rooms found matching your filter criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Detail Card */}
                        {selectedRoom && (
                            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                                <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-base">{selectedRoom.room_name}</h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-rose-200 border border-rose-300/20">
                                            {selectedRoom.room_code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-200">{selectedRoom.custom_type || selectedRoom.type} • {selectedRoom.capacity} Capacity</p>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                        <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Facility Metadata</div>
                                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                                            <span className="text-slate-500">Building:</span>
                                            <span className="font-semibold text-slate-900">{selectedRoom.building}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                                            <span className="text-slate-500">Floor Level:</span>
                                            <span className="font-semibold text-slate-900">{selectedRoom.floor}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                                            <span className="text-slate-500">Sharing Scope:</span>
                                            <span className="font-semibold text-slate-900">{selectedRoom.is_shared ? 'Shared Institution-Wide' : 'College-Exclusive'}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                            <span className="text-slate-500">Scheduled Classes:</span>
                                            <span className="font-bold text-rose-950">{selectedRoom.scheduled_count} sections</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                        <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Equipment &amp; Solver Attributes</div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            {selectedRoom.equipment_details || 'Standard classroom fixtures, whiteboard, and basic AV equipment.'}
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(selectedRoom)}
                                            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                                        >
                                            Edit Facility Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add / Edit Dialog */}
                <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingRoom ? 'Edit Facility' : 'Add New Facility'}</DialogTitle>
                            <DialogDescription>
                                Set room capacity, type, and equipment specifications used by the timetable CP-SAT solver.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveRoom} className="space-y-3 py-2 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Room Name *</Label>
                                    <Input
                                        value={roomForm.data.room_name}
                                        onChange={(e) => roomForm.setData('room_name', e.target.value)}
                                        placeholder="e.g., Computer Lab 201"
                                        className="h-8 text-xs mt-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Room Code</Label>
                                    <Input
                                        value={roomForm.data.room_code}
                                        onChange={(e) => roomForm.setData('room_code', e.target.value)}
                                        placeholder="e.g., CL-201"
                                        className="h-8 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Type *</Label>
                                    <select
                                        value={roomForm.data.type}
                                        onChange={(e) => roomForm.setData('type', e.target.value as any)}
                                        className="w-full h-8 text-xs rounded-md border border-input px-2 mt-1 bg-background"
                                    >
                                        <option value="Lecture">Lecture</option>
                                        <option value="Laboratory">Laboratory</option>
                                        <option value="Conference">Conference</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs">Capacity (Seats) *</Label>
                                    <Input
                                        type="number"
                                        value={roomForm.data.capacity}
                                        onChange={(e) => roomForm.setData('capacity', parseInt(e.target.value) || 0)}
                                        min="1"
                                        className="h-8 text-xs mt-1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Building</Label>
                                    <Input
                                        value={roomForm.data.building}
                                        onChange={(e) => roomForm.setData('building', e.target.value)}
                                        placeholder="e.g., CIDS Building"
                                        className="h-8 text-xs mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Floor</Label>
                                    <Input
                                        value={roomForm.data.floor}
                                        onChange={(e) => roomForm.setData('floor', e.target.value)}
                                        placeholder="e.g., 2nd Floor"
                                        className="h-8 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">Status</Label>
                                <select
                                    value={roomForm.data.status}
                                    onChange={(e) => roomForm.setData('status', e.target.value as any)}
                                    className="w-full h-8 text-xs rounded-md border border-input px-2 mt-1 bg-background"
                                >
                                    <option value="Available">Available (Solver Ready)</option>
                                    <option value="In Use">In Use</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Under Repair">Under Repair</option>
                                    <option value="Reserved">Reserved</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs">Equipment &amp; Facilities Specification</Label>
                                <Textarea
                                    value={roomForm.data.equipment_details}
                                    onChange={(e) => roomForm.setData('equipment_details', e.target.value)}
                                    placeholder="e.g., 45 High-Spec PCs, GigE switch, ceiling projector, air-conditioned"
                                    rows={2}
                                    className="text-xs mt-1"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isSharedCheck"
                                    checked={roomForm.data.is_shared}
                                    onChange={(e) => roomForm.setData('is_shared', e.target.checked)}
                                    className="rounded border-slate-300 text-rose-950 focus:ring-rose-900"
                                />
                                <Label htmlFor="isSharedCheck" className="text-xs cursor-pointer">
                                    Share space across all colleges (Multi-College Scheduling Resource)
                                </Label>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddEditOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={roomForm.processing}
                                    className="bg-gradient-to-r from-slate-900 to-rose-950 text-white"
                                >
                                    {editingRoom ? 'Update Facility' : 'Create Facility'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-rose-900">Remove Facility</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove <strong>{deletingRoom?.room_name}</strong> from scheduling master data?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteRoom}
                            >
                                Remove
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
