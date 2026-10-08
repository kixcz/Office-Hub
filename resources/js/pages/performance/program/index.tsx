import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { MoreVertical, Edit, Trash, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Program Performance', href: '/performance/program' },
];

export default function ProgramPerformanceIndex({ performances }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Program Performance" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Program Performance Ranking</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Rank</th>
                                <th className="p-2">Program</th>
                                <th className="p-2">Faculty Total</th>
                                <th className="p-2">100% Comp. Faculty</th>
                                <th className="p-2">Total Reqs</th>
                                <th className="p-2">Overdue</th>
                                <th className="p-2">Comp. Rate</th>
                                <th className="p-2">On-Time Rate</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performances.map((perf: any, index: number) => (
                                <tr key={perf.id} className="border-b">
                                    <td className="p-2 font-bold text-gray-500">#{index + 1}</td>
                                    <td className="p-2 font-semibold">{perf.name} ({perf.code})</td>
                                    <td className="p-2">{perf.total_faculty}</td>
                                    <td className="p-2 text-green-600 font-bold">{perf.perfect_faculty_count}</td>
                                    <td className="p-2">{perf.total_requirements}</td>
                                    <td className="p-2 text-red-600">{perf.overdue}</td>
                                    <td className="p-2 font-bold">{perf.compliance_rate}%</td>
                                    <td className="p-2 font-bold text-blue-600">{perf.on_time_rate}%</td>
                                    <td className="p-2 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 hover:bg-gray-100 rounded-md">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
