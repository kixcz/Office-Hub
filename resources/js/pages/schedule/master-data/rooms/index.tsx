import AppLayout from '@/layouts/app-layout';
import SchedulingWorkspaceLayout from '@/components/scheduling-workspace-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Monitor,
    Armchair,
    Search,
    CheckCircle2,
    Sliders,
    Layers,
    Clock,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Data', href: '/schedule/master-data/rooms' },
    { title: 'Rooms & Laboratories', href: '/schedule/master-data/rooms' },
];

interface RoomItem {
    room_name: string;
    type: 'Laboratory' | 'Lecture';
    capacity: number;
    scheduled_count: number;
}

interface Props {
    currentPeriod: any;
    rooms: RoomItem[];
}

export default function MasterDataRoomsIndex({
    currentPeriod,
    rooms = [],
}: Props) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const filtered = useMemo(() => {
        return rooms.filter((r) => {
            const matchesSearch = r.room_name.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === 'all' || r.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [rooms, search, typeFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rooms & Laboratories - Scheduling Master Data" />

            <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
                <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                    <Building2 className="size-5" />
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Rooms &amp; Laboratories Inventory
                                </h1>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                    Master Data 06
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 max-w-2xl">
                                Assignable facilities, seating capacities, and equipment classifications enforced as non-waivable hard constraints during timetable generation.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="text-xs">
                                <Link href="/classroom-monitoring">
                                    Classroom Live Monitoring &rarr;
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Facility Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            <span className="text-[11px] text-gray-500">Isolated equipment facilities</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Lecture Theaters &amp; Rooms</span>
                            <div className="text-2xl font-black text-amber-600">
                                {rooms.filter((r) => r.type === 'Lecture').length}
                            </div>
                            <span className="text-[11px] text-gray-500">General instructional classrooms</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search room code or lab..."
                                    className="pl-9 h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="h-9 px-3 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white font-semibold"
                                >
                                    <option value="all">All Room Types</option>
                                    <option value="Laboratory">Laboratory</option>
                                    <option value="Lecture">Lecture Room</option>
                                </select>
                                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                                    <Link href="/schedule/master-timetable?view=room">
                                        View Room Utilization &rarr;
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3 px-4">Room Identifier</th>
                                        <th className="py-3 px-4">Classification</th>
                                        <th className="py-3 px-4">Seating Capacity</th>
                                        <th className="py-3 px-4">Assigned Offerings</th>
                                        <th className="py-3 px-4 text-center">Solver Constraint</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((room) => (
                                        <tr key={room.room_name} className="hover:bg-amber-50/40 transition-colors">
                                            <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                                                <Building2 className="size-4 text-gray-400" />
                                                <span>{room.room_name}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    className={
                                                        room.type === 'Laboratory'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }
                                                >
                                                    {room.type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                                                {room.capacity} seats
                                            </td>
                                            <td className="py-3 px-4 text-gray-700">
                                                <span className="font-semibold">{room.scheduled_count}</span> course offerings
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                                    Feasible
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button asChild variant="outline" size="sm" className="text-xs h-7">
                                                    <Link href="/schedule/timetable">
                                                        View Grid &rarr;
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </SchedulingWorkspaceLayout>
        </AppLayout>
    );
}
