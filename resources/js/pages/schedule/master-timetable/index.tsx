import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Table,
    Download,
    Share2,
    Mail,
    Calendar,
    Monitor,
    Building2,
    Users,
    GraduationCap,
    CheckCircle2,
    Printer,
    FileSpreadsheet,
    FileText,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Master Timetable Views', href: '/schedule/master-timetable' },
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

export default function MasterTimetableIndex({
    currentPeriod,
    academicPeriods,
    schedules = [],
    rooms = [],
    sections = [],
    faculties = [],
}: Props) {
    const [viewMode, setViewMode] = useState<
        'college' | 'program' | 'year' | 'section' | 'faculty' | 'room' | 'lab'
    >('college');
    const [filterSection, setFilterSection] = useState<string>('all');
    const [filterRoom, setFilterRoom] = useState<string>('all');
    const [filterFaculty, setFilterFaculty] = useState<string>('all');

    const filteredSchedules = useMemo(() => {
        return schedules.filter((s) => {
            const matchesRoom = filterRoom === 'all' || s.room_name === filterRoom;
            const matchesSection = filterSection === 'all' || s.section === filterSection;
            const matchesFaculty =
                filterFaculty === 'all' ||
                (s.faculty_id && s.faculty_id.toString() === filterFaculty);
            return matchesRoom && matchesSection && matchesFaculty;
        });
    }, [schedules, filterRoom, filterSection, filterFaculty]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Official Master Semester Timetable" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Master Semester Timetable
                            </h1>
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                Single Source of Truth • Version 1.0 (Official)
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Automatically drives all dependent institutional feeds: Faculty syllabi schedules, Section &amp; Year-level rosters, Classroom &amp; Laboratory Monitoring, and the Campus TV Display.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" className="text-xs gap-1.5">
                            <Printer className="size-3.5" /> Print Timetable
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5">
                            <Mail className="size-3.5" /> Email Faculty .ics
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5">
                            <Download className="size-3.5" /> Export PDF / CSV
                        </Button>
                    </div>
                </div>

                {/* Perspective View Switcher */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-400 mr-2 uppercase">Derived Views:</span>
                        {[
                            { key: 'college', label: 'College-Wide' },
                            { key: 'program', label: 'Program View' },
                            { key: 'year', label: 'Year Levels (1st - 4th)' },
                            { key: 'section', label: 'Section Schedules' },
                            { key: 'faculty', label: 'Individual Faculty' },
                            { key: 'room', label: 'Classroom Utilization' },
                            { key: 'lab', label: 'Laboratory Blocks' },
                        ].map((v) => (
                            <button
                                key={v.key}
                                onClick={() => setViewMode(v.key as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    viewMode === v.key
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <select
                            value={filterRoom}
                            onChange={(e) => setFilterRoom(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
                        >
                            <option value="all">All Rooms &amp; Labs</option>
                            {rooms.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>

                        <select
                            value={filterSection}
                            onChange={(e) => setFilterSection(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
                        >
                            <option value="all">All Sections</option>
                            {sections.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Master Schedule Table */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-sm">
                            Official Course Offerings Timetable ({filteredSchedules.length} entries)
                        </span>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-blue-600" /> Connected to TV Display
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-emerald-600" /> Linked to Lab Monitoring
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-100/60 text-gray-600 font-bold uppercase text-[11px]">
                                    <th className="py-3 px-4">Course</th>
                                    <th className="py-3 px-4">Section / Year</th>
                                    <th className="py-3 px-4">Day &amp; Time Window</th>
                                    <th className="py-3 px-4">Assigned Facility</th>
                                    <th className="py-3 px-4">Faculty In-Charge</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSchedules.slice(0, 50).map((s) => (
                                    <tr key={s.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-gray-900 block text-xs">
                                                {s.course_code || 'TBA'}
                                            </span>
                                            <span className="text-[11px] text-gray-500 truncate max-w-xs block">
                                                {s.course_title || 'General Course'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className="text-[10px] font-semibold text-gray-800">
                                                {s.section || 'All Sections'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-semibold text-blue-700 block">
                                                {s.day_of_week}
                                            </span>
                                            <span className="text-gray-500 text-[11px]">
                                                {s.start_time} - {s.end_time}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="size-3.5 text-gray-400" />
                                                <span className="font-semibold text-gray-900">
                                                    {s.room_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="size-3.5 text-gray-400" />
                                                <span className="text-gray-800 font-medium">
                                                    {s.faculty?.title_name || s.faculty?.first_name ? `${s.faculty.first_name} ${s.faculty.last_name}` : s.instructor || 'TBA'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                Official
                                            </Badge>
                                        </td>
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
