import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Requirements', href: '/compliance/requirements' },
];

export default function RequirementsIndex({ requirements, programs }: any) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        document_type: '',
        academic_year: '',
        semester: '',
        due_date: '',
        program_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/compliance/requirements', {
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Requirements" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Create Requirement</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
                        <div>
                            <Label>Title</Label>
                            <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. TOS" />
                            {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                        </div>
                        <div>
                            <Label>Document Type</Label>
                            <Input value={data.document_type} onChange={e => setData('document_type', e.target.value)} placeholder="e.g. Exam" />
                            {errors.document_type && <div className="text-red-500 text-sm mt-1">{errors.document_type}</div>}
                        </div>
                        <div>
                            <Label>Academic Year</Label>
                            <Input value={data.academic_year} onChange={e => setData('academic_year', e.target.value)} placeholder="e.g. 2026-2027" />
                            {errors.academic_year && <div className="text-red-500 text-sm mt-1">{errors.academic_year}</div>}
                        </div>
                        <div>
                            <Label>Semester</Label>
                            <Input value={data.semester} onChange={e => setData('semester', e.target.value)} placeholder="e.g. 1st Semester" />
                            {errors.semester && <div className="text-red-500 text-sm mt-1">{errors.semester}</div>}
                        </div>
                        <div>
                            <Label>Due Date</Label>
                            <Input type="datetime-local" value={data.due_date} onChange={e => setData('due_date', e.target.value)} />
                            {errors.due_date && <div className="text-red-500 text-sm mt-1">{errors.due_date}</div>}
                        </div>
                        <div>
                            <Label>Program</Label>
                            <select 
                                className="w-full border-gray-300 rounded-md shadow-sm"
                                value={data.program_id} 
                                onChange={e => setData('program_id', e.target.value)}
                            >
                                <option value="">Select a Program</option>
                                {programs.map((program: any) => (
                                    <option key={program.id} value={program.id}>{program.name}</option>
                                ))}
                            </select>
                            {errors.program_id && <div className="text-red-500 text-sm mt-1">{errors.program_id}</div>}
                        </div>
                        <Button type="submit" disabled={processing} className="w-fit">Create</Button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Requirements List</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="p-2">Title</th>
                                <th className="p-2">Doc Type</th>
                                <th className="p-2">Program</th>
                                <th className="p-2">Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requirements.map((req: any) => (
                                <tr key={req.id} className="border-b">
                                    <td className="p-2">{req.title}</td>
                                    <td className="p-2">{req.document_type}</td>
                                    <td className="p-2">{req.program?.code}</td>
                                    <td className="p-2">{new Date(req.due_date).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
