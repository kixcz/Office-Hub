import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
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

export interface RoomItem {
    id: number;
    room_name: string;
    building?: string;
    floor?: string;
    type: 'Laboratory' | 'Lecture' | 'Conference' | 'Office' | 'Other';
    capacity: number;
    status: 'Available' | 'In Use' | 'Maintenance' | 'Under Repair' | 'Reserved';
    equipment_details?: string;
    notes?: string;
    scheduled_count: number;
    active_complaints_count: number;
}

interface FacultyItem {
    id: number;
    name: string;
    email: string;
}

interface ComplaintItem {
    id: number;
    room_name: string;
    complainant_name: string;
    issue_category: string;
    urgency: string;
    description: string;
    status: string;
    created_at: string;
}

interface Props {
    currentPeriod: any;
    rooms: RoomItem[];
    faculties: FacultyItem[];
    recentComplaints?: ComplaintItem[];
}

export default function MasterDataRoomsIndex({
    currentPeriod,
    rooms = [],
    faculties = [],
    recentComplaints = [],
}: Props) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals state
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingRoom, setDeletingRoom] = useState<RoomItem | null>(null);

    const [isComplaintOpen, setIsComplaintOpen] = useState(false);
    const [complaintRoom, setComplaintRoom] = useState<RoomItem | null>(null);

    // Filtered rooms
    const filtered = useMemo(() => {
        return rooms.filter((r) => {
            const matchesSearch =
                r.room_name.toLowerCase().includes(search.toLowerCase()) ||
                (r.building && r.building.toLowerCase().includes(search.toLowerCase())) ||
                (r.equipment_details && r.equipment_details.toLowerCase().includes(search.toLowerCase()));
            const matchesType = typeFilter === 'all' || r.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [rooms, search, typeFilter, statusFilter]);

    // Room Add/Edit Form
    const roomForm = useForm({
        room_name: '',
        building: 'CIDS Main',
        floor: '2nd Floor',
        type: 'Laboratory' as RoomItem['type'],
        capacity: 40,
        status: 'Available' as RoomItem['status'],
        equipment_details: '',
        notes: '',
    });

    const openAddModal = () => {
        setEditingRoom(null);
        roomForm.setData({
            room_name: '',
            building: 'CIDS Main',
            floor: '2nd Floor',
            type: 'Laboratory',
            capacity: 40,
            status: 'Available',
            equipment_details: '40 Desktop PCs, 2 Split AC units, 1 Projector, 1 Whiteboard',
            notes: '',
        });
        roomForm.clearErrors();
        setIsAddEditOpen(true);
    };

    const openEditModal = (room: RoomItem) => {
        setEditingRoom(room);
        roomForm.setData({
            room_name: room.room_name,
            building: room.building || 'CIDS Main',
            floor: room.floor || '2nd Floor',
            type: room.type,
            capacity: room.capacity,
            status: room.status,
            equipment_details: room.equipment_details || '',
            notes: room.notes || '',
        });
        roomForm.clearErrors();
        setIsAddEditOpen(true);
    };

    const handleRoomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRoom) {
            roomForm.put(`/schedule/master-data/rooms/${editingRoom.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditOpen(false);
                    setEditingRoom(null);
                },
            });
        } else {
            roomForm.post('/schedule/master-data/rooms', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditOpen(false);
                    roomForm.reset();
                },
            });
        }
    };

    // Room Delete Form
    const deleteForm = useForm({});
    const openDeleteModal = (room: RoomItem) => {
        setDeletingRoom(room);
        setIsDeleteOpen(true);
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingRoom) return;
        deleteForm.delete(`/schedule/master-data/rooms/${deletingRoom.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingRoom(null);
            },
        });
    };

    // Problem Complaint Report Form
    const complaintForm = useForm({
        room_name: '',
        room_id: null as number | null,
        faculty_id: null as number | null,
        complainant_name: '',
        complainant_email: '',
        issue_category: 'Air Conditioning',
        urgency: 'Medium',
        description: '',
    });

    const openComplaintModal = (room?: RoomItem) => {
        setComplaintRoom(room || null);
        complaintForm.setData({
            room_name: room ? room.room_name : rooms[0]?.room_name || '',
            room_id: room ? room.id : (rooms[0]?.id || null),
            faculty_id: faculties[0]?.id || null,
            complainant_name: faculties[0]?.name || '',
            complainant_email: faculties[0]?.email || '',
            issue_category: 'Air Conditioning',
            urgency: 'Medium',
            description: '',
        });
        complaintForm.clearErrors();
        setIsComplaintOpen(true);
    };

    const handleComplaintSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        complaintForm.post('/schedule/master-data/rooms/report-problem', {
            preserveScroll: true,
            onSuccess: () => {
                setIsComplaintOpen(false);
                complaintForm.reset();
            },
        });
    };

    // Helpers
    const getStatusBadge = (status: RoomItem['status']) => {
        switch (status) {
            case 'Available':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Available</Badge>;
            case 'In Use':
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200">In Use</Badge>;
            case 'Maintenance':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Maintenance</Badge>;
            case 'Under Repair':
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Under Repair</Badge>;
            case 'Reserved':
                return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Reserved</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeBadge = (type: RoomItem['type']) => {
        switch (type) {
            case 'Laboratory':
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Laboratory</Badge>;
            case 'Lecture':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Lecture Room</Badge>;
            case 'Conference':
                return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Conference</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms & Laboratories Inventory - CIDS" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                                    <Building2 className="size-6" />
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            Rooms &amp; Laboratories Inventory
                                        </h1>
                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                            CIDS Facilities
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Manage room capacities, equipment specifications, and enable faculty problem reports submitted directly to the Dean.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Problem Reporting Button for Faculty */}
                            <Button
                                onClick={() => openComplaintModal()}
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1.5 shadow-2xs"
                            >
                                <AlertTriangle className="size-4 text-rose-600" />
                                Report Facility Problem
                            </Button>

                            {/* Add New Room Button */}
                            <Button
                                onClick={openAddModal}
                                className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold text-xs gap-1.5 shadow-xs"
                            >
                                <Plus className="size-4" />
                                Add New Room
                            </Button>

                            <Button asChild variant="outline" size="sm" className="text-xs">
                                <Link href="/operations/facility-reports">
                                    Dean Reports View &rarr;
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Facility Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Registered Facilities</span>
                            <div className="text-2xl font-black text-gray-900">{rooms.length}</div>
                            <span className="text-[11px] text-gray-500">Assignable rooms &amp; laboratories</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Computer Laboratories</span>
                            <div className="text-2xl font-black text-blue-600">
                                {rooms.filter((r) => r.type === 'Laboratory').length}
                            </div>
                            <span className="text-[11px] text-gray-500">Equipped with desktop machines</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Lecture Theaters &amp; Rooms</span>
                            <div className="text-2xl font-black text-amber-600">
                                {rooms.filter((r) => r.type === 'Lecture').length}
                            </div>
                            <span className="text-[11px] text-gray-500">General instructional classrooms</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-rose-500 uppercase flex items-center gap-1">
                                <AlertTriangle className="size-3.5" />
                                Pending Complaints
                            </span>
                            <div className="text-2xl font-black text-rose-600">
                                {rooms.reduce((acc, r) => acc + (r.active_complaints_count || 0), 0)}
                            </div>
                            <span className="text-[11px] text-rose-600 font-medium">Forwarded to Dean for review</span>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search room, building, equipment..."
                                    className="pl-9 h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                >
                                    <option value="all">All Room Types</option>
                                    <option value="Laboratory">Laboratory</option>
                                    <option value="Lecture">Lecture Room</option>
                                    <option value="Conference">Conference Room</option>
                                    <option value="Office">Office</option>
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-medium"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Available">Available</option>
                                    <option value="In Use">In Use</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Under Repair">Under Repair</option>
                                    <option value="Reserved">Reserved</option>
                                </select>

                                <Button asChild size="sm" variant="outline" className="text-xs h-9">
                                    <Link href="/schedule/master-timetable?view=room">
                                        Room Grid &rarr;
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3 px-4">Room &amp; Location</th>
                                        <th className="py-3 px-4">Classification</th>
                                        <th className="py-3 px-4">Seating Capacity</th>
                                        <th className="py-3 px-4">Status &amp; Health</th>
                                        <th className="py-3 px-4">Equipment &amp; Facilities</th>
                                        <th className="py-3 px-4 text-center">Active Issues</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-10 text-gray-400">
                                                No rooms or laboratories match your search criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((room) => (
                                            <tr key={room.id} className="hover:bg-amber-50/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="p-2 rounded-lg bg-gray-100 text-gray-600">
                                                            <Building2 className="size-4" />
                                                        </span>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm">
                                                                {room.room_name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-400">
                                                                {room.building || 'Main Building'} • {room.floor || 'Floor'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getTypeBadge(room.type)}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                                                    {room.capacity} seats
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getStatusBadge(room.status)}
                                                </td>
                                                <td className="py-3 px-4 max-w-xs">
                                                    <p className="text-xs text-gray-600 truncate" title={room.equipment_details}>
                                                        {room.equipment_details || 'Standard classroom equipment'}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {room.active_complaints_count > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[11px]">
                                                            <AlertTriangle className="size-3" />
                                                            {room.active_complaints_count} reported
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px]">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Normal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Report problem for this specific room */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openComplaintModal(room)}
                                                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                            title="Report issue with room"
                                                        >
                                                            <AlertTriangle className="size-3.5" />
                                                        </Button>

                                                        {/* Edit room */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditModal(room)}
                                                            className="h-8 px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                                            title="Edit Room"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>

                                                        {/* Delete room */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openDeleteModal(room)}
                                                            className="h-8 px-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                                            title="Delete Room"
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
                    </div>
                </div>

                {/* ADD / EDIT ROOM MODAL */}
                <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                    <DialogContent className="sm:max-w-md font-['Poppins']">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                                <Building2 className="size-5 text-amber-500" />
                                {editingRoom ? `Edit Room: ${editingRoom.room_name}` : 'Add New Room / Laboratory'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                {editingRoom
                                    ? 'Update capacity, classification, and equipment inventory details.'
                                    : 'Create a new assignable facility in the CIDS scheduling inventory.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRoomSubmit} className="space-y-3.5 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Room Identifier *</Label>
                                    <Input
                                        value={roomForm.data.room_name}
                                        onChange={(e) => roomForm.setData('room_name', e.target.value)}
                                        placeholder="e.g. CLR 201, LAB 302"
                                        className="h-9 text-xs rounded-xl"
                                        required
                                    />
                                    {roomForm.errors.room_name && (
                                        <p className="text-[11px] text-rose-500">{roomForm.errors.room_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Classification *</Label>
                                    <select
                                        value={roomForm.data.type}
                                        onChange={(e) => roomForm.setData('type', e.target.value as any)}
                                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                    >
                                        <option value="Laboratory">Laboratory</option>
                                        <option value="Lecture">Lecture Room</option>
                                        <option value="Conference">Conference Room</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Building</Label>
                                    <Input
                                        value={roomForm.data.building}
                                        onChange={(e) => roomForm.setData('building', e.target.value)}
                                        placeholder="e.g. CIDS Main"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Floor Level</Label>
                                    <Input
                                        value={roomForm.data.floor}
                                        onChange={(e) => roomForm.setData('floor', e.target.value)}
                                        placeholder="e.g. 2nd Floor"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Seating Capacity *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={roomForm.data.capacity}
                                        onChange={(e) => roomForm.setData('capacity', parseInt(e.target.value) || 0)}
                                        className="h-9 text-xs rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Operational Status *</Label>
                                    <select
                                        value={roomForm.data.status}
                                        onChange={(e) => roomForm.setData('status', e.target.value as any)}
                                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                    >
                                        <option value="Available">Available</option>
                                        <option value="In Use">In Use</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Under Repair">Under Repair</option>
                                        <option value="Reserved">Reserved</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700">Equipment Inventory &amp; Specifications</Label>
                                <Textarea
                                    value={roomForm.data.equipment_details}
                                    onChange={(e) => roomForm.setData('equipment_details', e.target.value)}
                                    placeholder="e.g. 40 Desktop PCs, 2 Split Type ACs, Projector, HDMI input..."
                                    className="text-xs rounded-xl min-h-[60px]"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700">Internal Notes (Optional)</Label>
                                <Input
                                    value={roomForm.data.notes}
                                    onChange={(e) => roomForm.setData('notes', e.target.value)}
                                    placeholder="Optional notes for scheduling officers..."
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddEditOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={roomForm.processing}
                                    className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold text-xs"
                                >
                                    {roomForm.processing ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Room'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DELETE ROOM CONFIRMATION MODAL */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-sm font-['Poppins']">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600">
                                <Trash2 className="size-5" />
                                Confirm Room Deletion
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Are you sure you want to delete room{' '}
                                <strong className="text-gray-900">{deletingRoom?.room_name}</strong>? This action will remove it from scheduling master data.
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

                {/* FACULTY REPORT ROOM PROBLEM MODAL (Submitted to Dean) */}
                <Dialog open={isComplaintOpen} onOpenChange={setIsComplaintOpen}>
                    <DialogContent className="sm:max-w-lg font-['Poppins']">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                                    <AlertTriangle className="size-5" />
                                </span>
                                <div>
                                    <DialogTitle className="text-base font-bold text-gray-900">
                                        Report Room / Laboratory Problem
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-gray-500">
                                        Forward incident or defective facility report directly to the <strong className="text-amber-700">Office of the Dean</strong>.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleComplaintSubmit} className="space-y-3.5 py-2">
                            {/* Room Selector */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Room / Facility *</Label>
                                    <select
                                        value={complaintForm.data.room_name}
                                        onChange={(e) => {
                                            const selectedRoom = rooms.find((r) => r.room_name === e.target.value);
                                            complaintForm.setData({
                                                ...complaintForm.data,
                                                room_name: e.target.value,
                                                room_id: selectedRoom ? selectedRoom.id : null,
                                            });
                                        }}
                                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800 font-semibold"
                                        required
                                    >
                                        {rooms.map((r) => (
                                            <option key={r.id} value={r.room_name}>
                                                {r.room_name} ({r.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Issue Category *</Label>
                                    <select
                                        value={complaintForm.data.issue_category}
                                        onChange={(e) => complaintForm.setData('issue_category', e.target.value)}
                                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-800"
                                        required
                                    >
                                        <option value="Air Conditioning">Air Conditioning (Not cooling / leaking)</option>
                                        <option value="Computers / Peripherals">Computers / Peripherals (PCs, keyboards)</option>
                                        <option value="Projector / Audio Visual">Projector / Audio Visual / TV</option>
                                        <option value="Electrical / Lighting">Electrical / Lighting / Outlets</option>
                                        <option value="Furniture / Seating">Furniture / Armchairs / Desks</option>
                                        <option value="Internet / LAN Connectivity">Internet / LAN Connectivity</option>
                                        <option value="Cleanliness / Facilities">Cleanliness / Door / Lock</option>
                                        <option value="Other">Other Issue</option>
                                    </select>
                                </div>
                            </div>

                            {/* Urgency */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700">Urgency Level *</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['Low', 'Medium', 'High', 'Critical'] as const).map((lvl) => {
                                        const isSelected = complaintForm.data.urgency === lvl;
                                        return (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => complaintForm.setData('urgency', lvl)}
                                                className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                                                    isSelected
                                                        ? lvl === 'Critical'
                                                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                            : lvl === 'High'
                                                            ? 'bg-amber-500 text-gray-950 border-amber-500 shadow-xs'
                                                            : lvl === 'Medium'
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                            : 'bg-gray-800 text-white border-gray-800 shadow-xs'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {lvl}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700">
                                    Problem Description &amp; Specific Details *
                                </Label>
                                <Textarea
                                    value={complaintForm.data.description}
                                    onChange={(e) => complaintForm.setData('description', e.target.value)}
                                    placeholder="e.g. AC unit #2 on the left side is leaking water on the floor and blowing warm air. 3 student PCs (PC 12, 13, 14) fail to turn on."
                                    className="text-xs rounded-xl min-h-[90px]"
                                    required
                                />
                                {complaintForm.errors.description && (
                                    <p className="text-[11px] text-rose-500">{complaintForm.errors.description}</p>
                                )}
                            </div>

                            {/* Faculty Complainant info */}
                            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Faculty / Reporting Staff *</Label>
                                    <Input
                                        value={complaintForm.data.complainant_name}
                                        onChange={(e) => complaintForm.setData('complainant_name', e.target.value)}
                                        placeholder="Full name of faculty member"
                                        className="h-9 text-xs rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Contact Email</Label>
                                    <Input
                                        type="email"
                                        value={complaintForm.data.complainant_email}
                                        onChange={(e) => complaintForm.setData('complainant_email', e.target.value)}
                                        placeholder="faculty@cids.edu"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                                <ShieldAlert className="size-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    This report will be marked as <strong>Submitted to Dean</strong> and logged in the Super Admin Facility Reports module. Critical urgency issues automatically notify maintenance personnel.
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsComplaintOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={complaintForm.processing}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
                                >
                                    <Send className="size-3.5" />
                                    {complaintForm.processing ? 'Submitting...' : 'Submit to Dean'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
