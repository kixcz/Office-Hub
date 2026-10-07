import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Send, Plus, Search, FileSignature, CheckCircle2, Clock, MapPin, Hash } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface DocumentRoute {
    id: number;
    tracking_number: string;
    title: string;
    type: 'incoming' | 'outgoing' | 'internal';
    status: 'received' | 'in_review' | 'signed' | 'released';
    current_location: string | null;
    remarks: string | null;
    logger: User;
    created_at: string;
}

interface Props {
    documents: DocumentRoute[];
}

export default function DocumentRoutingIndex({ documents }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Document Routing', href: '/documents' },
    ];

    const [isCreating, setIsCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const { data: createData, setData: setCreateData, post, processing: createProcessing, reset: resetCreate } = useForm({
        title: '',
        type: 'incoming',
        status: 'received',
        current_location: '',
        remarks: '',
    });

    const { data: updateData, setData: setUpdateData, patch, processing: updateProcessing } = useForm({
        status: 'received',
        current_location: '',
        remarks: '',
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/documents', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreating(false);
                resetCreate();
            }
        });
    };

    const startUpdate = (doc: DocumentRoute) => {
        setUpdatingId(doc.id);
        setUpdateData({
            status: doc.status,
            current_location: doc.current_location || '',
            remarks: doc.remarks || '',
        });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatingId) {
            patch(`/documents/${updatingId}`, {
                preserveScroll: true,
                onSuccess: () => setUpdatingId(null)
            });
        }
    };

    const getStatusDisplay = (status: string) => {
        switch(status) {
            case 'received': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3 h-3 mr-1" /> Received</span>;
            case 'in_review': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><Search className="w-3 h-3 mr-1" /> In Review</span>;
            case 'signed': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><FileSignature className="w-3 h-3 mr-1" /> Signed</span>;
            case 'released': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"><Send className="w-3 h-3 mr-1" /> Released</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Document Routing" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Document Routing</h1>
                        <p className="text-sm text-muted-foreground">Track incoming and outgoing physical or digital documents.</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        {isCreating ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Log Document</>}
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-card border rounded-xl p-6 shadow-sm mb-4">
                        <h2 className="text-lg font-semibold mb-4">Log New Document</h2>
                        <form onSubmit={submitCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Document Title/Subject</label>
                                <input type="text" value={createData.title} onChange={e => setCreateData('title', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select value={createData.type} onChange={e => setCreateData('type', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="incoming">Incoming</option>
                                    <option value="outgoing">Outgoing</option>
                                    <option value="internal">Internal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Initial Status</label>
                                <select value={createData.status} onChange={e => setCreateData('status', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="received">Received</option>
                                    <option value="in_review">In Review</option>
                                    <option value="signed">Signed</option>
                                    <option value="released">Released</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Current Location (Optional)</label>
                                <input type="text" placeholder="e.g. Dean's Office, HR Dept" value={createData.current_location} onChange={e => setCreateData('current_location', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
                                <textarea value={createData.remarks} onChange={e => setCreateData('remarks', e.target.value)} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setIsCreating(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 py-2">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createProcessing} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50">
                                    {createProcessing ? 'Saving...' : 'Log Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1 overflow-hidden">
                    {documents?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No documents tracked</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Log incoming or outgoing documents to start tracking them.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Tracking #</th>
                                        <th className="px-6 py-3 font-medium">Document Details</th>
                                        <th className="px-6 py-3 font-medium">Status & Location</th>
                                        <th className="px-6 py-3 font-medium">Logged By</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/50">
                                            {updatingId === doc.id ? (
                                                <td colSpan={5} className="p-4 bg-muted/30">
                                                    <form onSubmit={submitUpdate} className="flex flex-col gap-4 max-w-3xl">
                                                        <div className="flex justify-between items-center mb-2 border-b pb-2">
                                                            <div className="font-medium flex items-center"><Hash className="w-4 h-4 mr-1 text-muted-foreground"/> {doc.tracking_number}</div>
                                                            <div className="text-sm">{doc.title}</div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Update Status</label>
                                                                <select value={updateData.status} onChange={e => setUpdateData('status', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                                                    <option value="received">Received</option>
                                                                    <option value="in_review">In Review</option>
                                                                    <option value="signed">Signed</option>
                                                                    <option value="released">Released</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Current Location</label>
                                                                <input type="text" value={updateData.current_location} onChange={e => setUpdateData('current_location', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-medium mb-1">Remarks</label>
                                                                <textarea value={updateData.remarks} onChange={e => setUpdateData('remarks', e.target.value)} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button type="button" onClick={() => setUpdatingId(null)} className="text-xs hover:underline">Cancel</button>
                                                            <button type="submit" disabled={updateProcessing} className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-primary text-primary-foreground h-8 px-3 disabled:opacity-50">Save Update</button>
                                                        </div>
                                                    </form>
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-mono text-xs">
                                                        <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded inline-block">
                                                            <Hash className="w-3 h-3 text-muted-foreground"/> {doc.tracking_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-foreground">{doc.title}</div>
                                                        <div className="text-xs text-muted-foreground mt-1 capitalize">{doc.type} Document</div>
                                                        <div className="text-[10px] text-muted-foreground mt-1">{new Date(doc.created_at).toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="mb-2">{getStatusDisplay(doc.status)}</div>
                                                        {doc.current_location && (
                                                            <div className="flex items-center text-xs text-muted-foreground">
                                                                <MapPin className="w-3 h-3 mr-1" /> {doc.current_location}
                                                            </div>
                                                        )}
                                                        {doc.remarks && <div className="text-[10px] mt-1 line-clamp-1 italic text-muted-foreground">"{doc.remarks}"</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        {doc.logger?.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => startUpdate(doc)} className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                                                            Update Status
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
