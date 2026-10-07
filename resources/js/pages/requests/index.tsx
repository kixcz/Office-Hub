import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { ClipboardList, Plus, Search, Hammer, Package, Monitor, FileQuestion, UserCircle } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface OfficeRequest {
    id: number;
    title: string;
    description: string;
    type: 'supplies' | 'maintenance' | 'technical' | 'other';
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    requester: User;
    resolver: User | null;
    resolution_notes: string | null;
    created_at: string;
}

interface Props {
    requests: OfficeRequest[];
}

export default function RequestsIndex({ requests }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Office Requests', href: '/requests' },
    ];

    const [isCreating, setIsCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const { data: createData, setData: setCreateData, post, processing: createProcessing, reset: resetCreate } = useForm({
        title: '',
        description: '',
        type: 'supplies',
    });

    const { data: updateData, setData: setUpdateData, patch, processing: updateProcessing } = useForm({
        status: 'pending',
        resolution_notes: '',
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/requests', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreating(false);
                resetCreate();
            }
        });
    };

    const startUpdate = (req: OfficeRequest) => {
        setUpdatingId(req.id);
        setUpdateData({
            status: req.status,
            resolution_notes: req.resolution_notes || '',
        });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatingId) {
            patch(`/requests/${updatingId}`, {
                preserveScroll: true,
                onSuccess: () => setUpdatingId(null)
            });
        }
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'supplies': return <Package className="w-4 h-4 text-blue-500" />;
            case 'maintenance': return <Hammer className="w-4 h-4 text-orange-500" />;
            case 'technical': return <Monitor className="w-4 h-4 text-purple-500" />;
            default: return <FileQuestion className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office Requests" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Office Requests</h1>
                        <p className="text-sm text-muted-foreground">Submit and track administrative, technical, and supply requests.</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        {isCreating ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> New Request</>}
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-card border rounded-xl p-6 shadow-sm mb-4">
                        <h2 className="text-lg font-semibold mb-4">Submit Office Request</h2>
                        <form onSubmit={submitCreate} className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title / Subject</label>
                                <input type="text" value={createData.title} onChange={e => setCreateData('title', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Request Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                    {[
                                        { id: 'supplies', icon: Package, label: 'Supplies' },
                                        { id: 'maintenance', icon: Hammer, label: 'Maintenance' },
                                        { id: 'technical', icon: Monitor, label: 'Technical Support' },
                                        { id: 'other', icon: FileQuestion, label: 'Other' },
                                    ].map((type) => (
                                        <div 
                                            key={type.id}
                                            onClick={() => setCreateData('type', type.id as any)}
                                            className={`cursor-pointer rounded-md border p-3 flex flex-col items-center justify-center text-center gap-2 transition-colors ${createData.type === type.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                                        >
                                            <type.icon className={`h-6 w-6 ${createData.type === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <span className="text-xs font-medium">{type.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Detailed Description</label>
                                <textarea value={createData.description} onChange={e => setCreateData('description', e.target.value)} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required placeholder="Provide details about what you need..." />
                            </div>

                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setIsCreating(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 py-2">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createProcessing} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50">
                                    {createProcessing ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-4 flex-1 auto-rows-max">
                    {requests.length === 0 ? (
                        <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col items-center justify-center p-12 text-center h-64">
                            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No office requests</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Submit a request when you need supplies, maintenance, or technical support.
                            </p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden flex flex-col sm:flex-row">
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-muted rounded-md">
                                                {getTypeIcon(request.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg leading-none">{request.title}</h3>
                                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{request.type} Request</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusStyle(request.status)}`}>
                                            {request.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-foreground/80 mt-4 whitespace-pre-wrap">
                                        {request.description}
                                    </p>

                                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center">
                                            <UserCircle className="w-4 h-4 mr-1" />
                                            Requested by: <span className="font-medium text-foreground ml-1">{request.requester.name}</span>
                                        </div>
                                        {request.resolver && (
                                            <div className="flex items-center">
                                                <UserCircle className="w-4 h-4 mr-1 text-primary/70" />
                                                Resolved by: <span className="font-medium text-foreground ml-1">{request.resolver.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {request.resolution_notes && (
                                        <div className="mt-3 bg-muted/50 p-3 rounded-md text-sm border">
                                            <span className="font-medium text-xs text-muted-foreground block mb-1">Resolution Notes:</span>
                                            {request.resolution_notes}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-muted/30 p-4 sm:w-64 border-t sm:border-t-0 sm:border-l flex flex-col justify-center">
                                    {updatingId === request.id ? (
                                        <form onSubmit={submitUpdate} className="flex flex-col gap-3">
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Status</label>
                                                <select value={updateData.status} onChange={e => setUpdateData('status', e.target.value)} className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                                    <option value="pending">Pending</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Resolution Notes</label>
                                                <textarea value={updateData.resolution_notes} onChange={e => setUpdateData('resolution_notes', e.target.value)} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Optional notes..." />
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <button type="submit" disabled={updateProcessing} className="flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium bg-primary text-primary-foreground h-8 px-3 disabled:opacity-50">Save</button>
                                                <button type="button" onClick={() => setUpdatingId(null)} className="flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium border bg-background hover:bg-accent h-8 px-3">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs text-center text-muted-foreground mb-2">Admin Actions</p>
                                            <button 
                                                onClick={() => startUpdate(request)} 
                                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
                                            >
                                                Update Status
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
