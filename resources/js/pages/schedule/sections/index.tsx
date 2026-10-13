import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Users,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Search,
    Clock,
    GraduationCap,
    SlidersHorizontal,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '/schedule/generator' },
    { title: 'Sections & Offerings', href: '/schedule/sections' },
];

interface SectionMatrixItem {
    section_code: string;
    program: string;
    offerings_count: number;
    contact_hours: number;
    unassigned_count: number;
    status: 'Ready' | 'Incomplete';
    offerings: Array<{
        id: number;
        course_code: string;
        course_title: string;
        day_of_week: string;
        start_time: string;
        end_time: string;
        room_name: string;
        instructor: string;
        faculty_id?: number | null;
    }>;
}

interface Props {
    currentPeriod: any;
    academicPeriods: any[];
    programs: any[];
    sectionsMatrix: SectionMatrixItem[];
}

export default function SectionsOfferingsIndex({
    currentPeriod,
    academicPeriods,
    programs = [],
    sectionsMatrix = [],
}: Props) {
    const [search, setSearch] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('all');
    const [activeSection, setActiveSection] = useState<SectionMatrixItem | null>(null);

    const filteredSections = useMemo(() => {
        return sectionsMatrix.filter((s) => {
            const matchesSearch = s.section_code.toLowerCase().includes(search.toLowerCase());
            const matchesProg = selectedProgram === 'all' || s.program === selectedProgram;
            return matchesSearch && matchesProg;
        });
    }, [sectionsMatrix, search, selectedProgram]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sections & Course Offerings - CIDS OfficeHub" />

            <div className="flex flex-col gap-6 p-6 font-['Poppins']">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Sections &amp; Course Offerings Module
                            </h1>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                Section Readiness Matrix
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-500 max-w-2xl">
                            Manages student cohorts (BSIT-1A to 4th Year) and verifies that every section has its expected curriculum course offerings, required contact hours, and eligible faculty assignments.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button asChild variant="outline" className="text-xs">
                            <Link href="/schedule/generator">
                                Scheduling Overview
                            </Link>
                        </Button>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                            <Link href="/schedule/loading">
                                Faculty Loading <ArrowRight className="size-3.5 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                    <div className="relative w-full sm:w-72">
                        <Search className="size-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter section code..."
                            className="pl-8 text-xs h-8"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-gray-500 font-medium">Program:</span>
                        <select
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
                        >
                            <option value="all">All Programs</option>
                            <option value="BSIT">BSIT</option>
                            <option value="BSIS">BSIS</option>
                        </select>
                    </div>
                </div>

                {/* Section Readiness Matrix Table */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[11px]">
                                    <th className="py-3 px-4">Section Code</th>
                                    <th className="py-3 px-4">Program Track</th>
                                    <th className="py-3 px-4 text-center">Configured Offerings</th>
                                    <th className="py-3 px-4 text-center">Weekly Contact Hours</th>
                                    <th className="py-3 px-4 text-center">Unassigned Instructors</th>
                                    <th className="py-3 px-4 text-center">Readiness Status</th>
                                    <th className="py-3 px-4 text-right">Offerings Roster</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSections.map((s) => (
                                    <tr key={s.section_code} className="hover:bg-blue-50/20">
                                        <td className="py-3 px-4 font-bold text-gray-900">
                                            {s.section_code}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                            {s.program}
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-gray-900">
                                            {s.offerings_count} subjects
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium text-gray-700">
                                            {s.contact_hours} hrs/wk
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {s.unassigned_count > 0 ? (
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                                                    {s.unassigned_count} unassigned
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                                    All Assigned
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {s.status === 'Ready' ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                                    <CheckCircle2 className="size-3.5" /> Scheduling Ready
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                                                    <AlertCircle className="size-3.5" /> Pending Faculty
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Button
                                                onClick={() => setActiveSection(s)}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7"
                                            >
                                                Inspect Subjects
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Inspect Section Modal */}
                {activeSection && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Section {activeSection.section_code} Course Offerings
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        {activeSection.program} • {activeSection.offerings_count} subjects • {activeSection.contact_hours} total contact hours
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveSection(null)}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="space-y-2.5">
                                {activeSection.offerings.map((c) => (
                                    <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-gray-900 block">{c.course_code} - {c.course_title}</span>
                                            <span className="text-gray-500 text-[11px]">
                                                Instructor: {c.instructor || 'TBA'} • Room: {c.room_name}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-semibold text-blue-700 block">{c.day_of_week}</span>
                                            <span className="text-gray-500 text-[11px]">{c.start_time} - {c.end_time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t flex justify-end">
                                <Button onClick={() => setActiveSection(null)} className="text-xs">
                                    Close Window
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
