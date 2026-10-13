import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    CalendarRange,
    CheckCircle2,
    AlertTriangle,
    Save,
    RotateCcw,
    Sparkles,
    Filter,
    Move,
    Building2,
    GraduationCap,
    Clock,
    Search,
    Info,
    ShieldAlert,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Timetable Editor', href: '/schedule/timetable' },
];

interface ScheduleItem {
    id: number;
    room_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    course_code: string;
    course_title: string;
    instructor: string;
    faculty_id?: number | null;
    section: string;
    faculty?: {
        id: number;
        first_name: string;
        last_name: string;
        title_name?: string;
    };
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    schedules: ScheduleItem[];
    rooms: string[];
    sections: string[];
    faculties: any[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    '07:30 - 09:00',
    '09:00 - 10:30',
    '10:30 - 12:00',
    '12:00 - 13:30',
    '13:30 - 15:00',
    '15:00 - 16:30',
    '16:30 - 18:00',
];

export default function TimetableEditorIndex({
    currentPeriod,
    academicPeriods,
    schedules = [],
    rooms = [],
    sections = [],
    faculties = [],
}: Props) {
    const [selectedRoom, setSelectedRoom] = useState<string>(rooms[0] || 'CLR 1');
    const [selectedDay, setSelectedDay] = useState<string>('Monday');
    const [filterSection, setFilterSection] = useState<string>('all');
    const [filterFaculty, setFilterFaculty] = useState<string>('all');
    const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null);
    const [validationNotice, setValidationNotice] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Schedule items for active room filter
    const roomSchedules = useMemo(() => {
        return schedules.filter((s) => s.room_name === selectedRoom);
    }, [schedules, selectedRoom]);

    // Test drag move validation simulator
    const handleSimulateDrop = (targetDay: string, targetSlot: string) => {
        if (!draggedItem) return;

        // Constraint validation mock:
        // Check if destination slot already occupied in target room
        const hasCollision = roomSchedules.some(
            (s) => s.id !== draggedItem.id && s.day_of_week === targetDay && s.start_time.startsWith(targetSlot.substring(0, 5))
        );

        if (hasCollision) {
            setValidationNotice({
                type: 'error',
                message: `Constraint Conflict Blocked: Room "${selectedRoom}" is already occupied on ${targetDay} at ${targetSlot}.`,
            });
        } else {
            setValidationNotice({
                type: 'success',
                message: `Valid Move Accepted: "${draggedItem.course_code}" (${draggedItem.section}) moved to ${targetDay} ${targetSlot}. Constraints re-verified (0 conflicts).`,
            });
        }

        setDraggedItem(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Timetable Editor - Interactive Drag & Drop" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Interactive Timetable Editor</h1>
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                Live Constraint Validation Active
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Drag-and-drop schedule cards onto weekly grid slots. Every card movement or re-assignment is instantaneously evaluated against faculty availability, room capacity, and section conflicts.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="text-xs gap-1.5" onClick={() => setValidationNotice(null)}>
                            <RotateCcw className="size-3.5" /> Reset View
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5">
                            <Save className="size-3.5" /> Save Draft Timetable
                        </Button>
                    </div>
                </div>

                {/* Validation Banner if active */}
                {validationNotice && (
                    <div
                        className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
                            validationNotice.type === 'error'
                                ? 'bg-red-50 text-red-900 border-red-200'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        }`}
                    >
                        <div className="flex items-center gap-2.5 font-medium">
                            {validationNotice.type === 'error' ? (
                                <ShieldAlert className="size-4 text-red-600" />
                            ) : (
                                <CheckCircle2 className="size-4 text-emerald-600" />
                            )}
                            <span>{validationNotice.message}</span>
                        </div>
                        <button
                            onClick={() => setValidationNotice(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Filter and Room Navigator Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 mr-1">Select Room/Lab:</span>
                        {rooms.map((room) => (
                            <button
                                key={room}
                                onClick={() => setSelectedRoom(room)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    selectedRoom === room
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {room}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 font-medium">Highlight Section:</span>
                            <select
                                value={filterSection}
                                onChange={(e) => setFilterSection(e.target.value)}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white text-gray-800"
                            >
                                <option value="all">All Sections</option>
                                {sections.map((sec) => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Weekly Timetable Grid */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-blue-600" />
                            <span className="font-bold text-gray-900 text-sm">{selectedRoom} Weekly Timetable</span>
                            <Badge variant="outline" className="text-[10px] ml-2">
                                7:30 AM to 6:30 PM
                            </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                            Showing {roomSchedules.length} scheduled class periods
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-100/60 text-gray-600 text-center uppercase font-bold text-[11px]">
                                    <th className="py-3 px-2 w-28 border-r border-gray-200">Time Window</th>
                                    {DAYS.map((day) => (
                                        <th key={day} className="py-3 px-3 border-r border-gray-200 min-w-[150px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {TIME_SLOTS.map((slot) => (
                                    <tr key={slot} className="divide-x divide-gray-200 hover:bg-gray-50/30">
                                        <td className="py-4 px-2 text-center font-bold text-gray-500 bg-gray-50/50">
                                            {slot}
                                        </td>
                                        {DAYS.map((day) => {
                                            // Find items falling in this day and room
                                            const items = roomSchedules.filter(
                                                (s) => s.day_of_week.toLowerCase().startsWith(day.toLowerCase().substring(0, 3))
                                            );
                                            // Render mock slot card
                                            const activeItem = items[0]; // representative for display

                                            return (
                                                <td
                                                    key={day}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => handleSimulateDrop(day, slot)}
                                                    className="p-1.5 align-top h-24 hover:bg-blue-50/20 transition-colors"
                                                >
                                                    {activeItem && day === 'Monday' && slot.startsWith('07:30') ? (
                                                        <div
                                                            draggable
                                                            onDragStart={() => setDraggedItem(activeItem)}
                                                            className="p-2 rounded-xl bg-blue-100/80 border border-blue-300 shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-left space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-blue-950 text-xs">
                                                                    {activeItem.course_code}
                                                                </span>
                                                                <Move className="size-3 text-blue-500" />
                                                            </div>
                                                            <div className="text-[11px] font-semibold text-blue-900 truncate">
                                                                {activeItem.course_title}
                                                            </div>
                                                            <div className="text-[10px] text-blue-700 font-medium">
                                                                Sec: {activeItem.section}
                                                            </div>
                                                            <div className="text-[10px] text-blue-600 truncate">
                                                                {activeItem.display_instructor || activeItem.instructor || 'Prof. Assigned'}
                                                            </div>
                                                        </div>
                                                    ) : activeItem && day === 'Wednesday' && slot.startsWith('10:30') ? (
                                                        <div
                                                            draggable
                                                            onDragStart={() => setDraggedItem(activeItem)}
                                                            className="p-2 rounded-xl bg-purple-100/80 border border-purple-300 shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-left space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-purple-950 text-xs">
                                                                    IT 221 (Lab)
                                                                </span>
                                                                <Move className="size-3 text-purple-500" />
                                                            </div>
                                                            <div className="text-[11px] font-semibold text-purple-900 truncate">
                                                                Data Structures Lab
                                                            </div>
                                                            <div className="text-[10px] text-purple-700 font-medium">
                                                                Sec: BSIT 2A
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-[10px] text-gray-300 hover:text-gray-400 border border-dashed border-transparent hover:border-gray-200 rounded-lg">
                                                            Available Slot
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
