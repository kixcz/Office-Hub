import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Recognition Rules', href: '/performance/rules' },
];

export default function RulesIndex({ rules, recognitions }: any) {
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        type: 'faculty',
        min_requirements: 0,
        min_on_time_rate: 0,
        min_compliance_rate: 0,
        allow_overdue: false,
    });

    const submit = (e: any) => {
        e.preventDefault();
        post('/performance/rules', {
            onSuccess: () => reset()
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recognition Rules" />
            <div className="p-4 flex flex-col gap-8">
                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Create Recognition Rule</h2>
                    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                        <div>
                            <Label>Title</Label>
                            <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. Top Performing Faculty" />
                        </div>
                        <div>
                            <Label>Type</Label>
                            <select className="w-full border-gray-300 rounded-md shadow-sm" value={data.type} onChange={e => setData('type', e.target.value)}>
                                <option value="faculty">Faculty</option>
                                <option value="program">Program</option>
                            </select>
                        </div>
                        <div>
                            <Label>Min. Requirements (count)</Label>
                            <Input type="number" value={data.min_requirements} onChange={e => setData('min_requirements', Number(e.target.value))} />
                        </div>
                        <div>
                            <Label>Min. On-Time Rate (%)</Label>
                            <Input type="number" step="0.01" value={data.min_on_time_rate} onChange={e => setData('min_on_time_rate', Number(e.target.value))} />
                        </div>
                        <div>
                            <Label>Min. Compliance Rate (%)</Label>
                            <Input type="number" step="0.01" value={data.min_compliance_rate} onChange={e => setData('min_compliance_rate', Number(e.target.value))} />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Checkbox id="allow_overdue" checked={data.allow_overdue} onCheckedChange={(c) => setData('allow_overdue', c as boolean)} />
                            <Label htmlFor="allow_overdue">Allow Overdue Outputs?</Label>
                        </div>
                        <Button type="submit" disabled={processing} className="w-fit md:col-span-2">Create Rule</Button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-md shadow">
                    <h2 className="text-xl font-bold mb-4">Recognition Winners</h2>
                    <div className="flex flex-col gap-6">
                        {recognitions.map((rec: any, idx: number) => (
                            <div key={idx} className="border rounded-md p-4 bg-gray-50">
                                <h3 className="font-bold text-lg text-blue-800">{rec.rule.title} <span className="text-sm font-normal text-gray-500">({rec.rule.type.toUpperCase()})</span></h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    Min Reqs: {rec.rule.min_requirements} | Min On-Time: {rec.rule.min_on_time_rate}% | Min Comp: {rec.rule.min_compliance_rate}% | Allow Overdue: {rec.rule.allow_overdue ? 'Yes' : 'No'}
                                </p>
                                
                                {rec.winners.length > 0 ? (
                                    <ul className="list-disc ml-6 mt-2">
                                        {rec.winners.map((winner: any, i: number) => (
                                            <li key={i}>
                                                <strong>{winner.name}</strong> - On-Time: {winner.on_time_rate}% | Compliance: {winner.compliance_rate}%
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 italic">No eligible candidates currently.</p>
                                )}
                            </div>
                        ))}
                        {recognitions.length === 0 && <p className="text-gray-500">No recognition rules created yet.</p>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
