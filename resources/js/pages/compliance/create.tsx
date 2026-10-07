import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Compliance Matrix',
        href: '/compliance-matrix',
    },
    {
        title: 'Assign Requirement',
        href: '/requirements/create',
    },
];

interface User {
    id: number;
    name: string;
}

interface Props {
    users: User[];
}

export default function AssignRequirement({ users }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        document_type: 'Syllabus',
        academic_year: '2026-2027',
        semester: '1st Semester',
        course_section: '',
        due_date: '',
        accepted_format: 'pdf',
        user_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/requirements');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assign Requirement" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Assign Requirement</h1>
                        <p className="text-sm text-muted-foreground">Create a new requirement for faculty members to submit.</p>
                    </div>
                    
                    <Link
                        href="/compliance-matrix"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Matrix
                    </Link>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow flex-1">
                    <form onSubmit={submit} className="p-6 space-y-8 max-w-3xl">
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <label htmlFor="title" className="text-sm font-medium">Title *</label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="e.g. Midterm Questionnaire"
                                    />
                                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="document_type" className="text-sm font-medium">Document Type *</label>
                                    <select
                                        id="document_type"
                                        value={data.document_type}
                                        onChange={(e) => setData('document_type', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="Syllabus">Syllabus</option>
                                        <option value="TOS">Table of Specifications (TOS)</option>
                                        <option value="Test Questionnaire">Test Questionnaire</option>
                                        <option value="Grades">Grades</option>
                                        <option value="Report">Report</option>
                                        <option value="Workload">Workload Document</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.document_type && <p className="text-sm text-destructive">{errors.document_type}</p>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Any specific instructions for this requirement..."
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <label htmlFor="academic_year" className="text-sm font-medium">Academic Year *</label>
                                    <input
                                        id="academic_year"
                                        type="text"
                                        value={data.academic_year}
                                        onChange={(e) => setData('academic_year', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    {errors.academic_year && <p className="text-sm text-destructive">{errors.academic_year}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="semester" className="text-sm font-medium">Semester *</label>
                                    <select
                                        id="semester"
                                        value={data.semester}
                                        onChange={(e) => setData('semester', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                    {errors.semester && <p className="text-sm text-destructive">{errors.semester}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="course_section" className="text-sm font-medium">Course/Section (Optional)</label>
                                    <input
                                        id="course_section"
                                        type="text"
                                        value={data.course_section}
                                        onChange={(e) => setData('course_section', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="e.g. CS101 - A"
                                    />
                                    {errors.course_section && <p className="text-sm text-destructive">{errors.course_section}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <label htmlFor="due_date" className="text-sm font-medium">Due Date *</label>
                                    <input
                                        id="due_date"
                                        type="datetime-local"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    {errors.due_date && <p className="text-sm text-destructive">{errors.due_date}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="user_id" className="text-sm font-medium">Assign To</label>
                                    <select
                                        id="user_id"
                                        value={data.user_id}
                                        onChange={(e) => setData('user_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">All Faculty (Global)</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                    {errors.user_id && <p className="text-sm text-destructive">{errors.user_id}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="accepted_format" className="text-sm font-medium">Accepted Format</label>
                                    <select
                                        id="accepted_format"
                                        value={data.accepted_format}
                                        onChange={(e) => setData('accepted_format', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="docx">Word (DOCX)</option>
                                        <option value="xlsx">Excel (XLSX)</option>
                                        <option value="any">Any Format</option>
                                    </select>
                                    {errors.accepted_format && <p className="text-sm text-destructive">{errors.accepted_format}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                {processing ? 'Assigning...' : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Assign Requirement
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
