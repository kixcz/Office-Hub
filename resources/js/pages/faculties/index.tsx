import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Plus,
    Users,
    MoreVertical,
    Edit,
    Trash,
    GraduationCap,
    UserCheck,
    Camera,
    Upload,
    X,
    Search,
    User,
    ArrowRight,
    Briefcase,
    ShieldCheck,
    Building2,
    Mail,
} from 'lucide-react';
import React, { useState, useMemo, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Faculty Management',
        href: '/faculties',
    },
];

interface Program {
    id: number;
    code: string;
    name: string;
}

interface Faculty {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
    title_name?: string;
    employee_id?: string;
    faculty_id?: string | null;
    academic_rank?: string | null;
    employment_type?: string | null;
    status?: string | null;
    highest_qualification?: string | null;
    specialization?: string | null;
    email?: string | null;
    phone?: string | null;
    office_room?: string | null;
    profile_picture?: string | null;
    photo_url?: string | null;
    program_id?: number | null;
    program?: Program;
    spreadsheet_name?: string | null;
}

interface Props {
    faculties: Faculty[];
    programs: Program[];
}

export default function FacultiesIndex({ faculties = [], programs = [] }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState('all');

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [spreadsheetName, setSpreadsheetName] = useState('');
    const [academicRank, setAcademicRank] = useState('Instructor I');
    const [employmentType, setEmploymentType] = useState('Full-time');
    const [status, setStatus] = useState('Active');
    const [programId, setProgramId] = useState('');
    const [highestQualification, setHighestQualification] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [officeRoom, setOfficeRoom] = useState('');
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const openAddDialog = () => {
        setEditingFaculty(null);
        setFirstName('');
        setLastName('');
        setFacultyId('');
        setSpreadsheetName('');
        setAcademicRank('Instructor I');
        setEmploymentType('Full-time');
        setStatus('Active');
        setProgramId(programs.length > 0 ? String(programs[0].id) : '');
        setHighestQualification('');
        setSpecialization('');
        setEmail('');
        setPhone('');
        setOfficeRoom('');
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        setRemovePhoto(false);
        setFormErrors({});
        setIsDialogOpen(true);
    };

    const openEditDialog = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        setFirstName(faculty.first_name);
        setLastName(faculty.last_name);
        setFacultyId(faculty.faculty_id || faculty.employee_id || '');
        setSpreadsheetName(faculty.spreadsheet_name || '');
        setAcademicRank(faculty.academic_rank || 'Instructor I');
        setEmploymentType(faculty.employment_type || 'Full-time');
        setStatus(faculty.status || 'Active');
        setProgramId(faculty.program_id ? String(faculty.program_id) : (programs[0] ? String(programs[0].id) : ''));
        setHighestQualification(faculty.highest_qualification || '');
        setSpecialization(faculty.specialization || '');
        setEmail(faculty.email || '');
        setPhone(faculty.phone || '');
        setOfficeRoom(faculty.office_room || '');
        setSelectedPhotoFile(null);
        setPhotoPreview(faculty.photo_url || null);
        setRemovePhoto(false);
        setFormErrors({});
        setIsDialogOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setRemovePhoto(false);
        }
    };

    const handleRemovePhoto = () => {
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        setRemovePhoto(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const commonPayload: any = {
            first_name: firstName,
            last_name: lastName,
            program_id: programId,
            faculty_id: facultyId,
            spreadsheet_name: spreadsheetName,
            academic_rank: academicRank,
            employment_type: employmentType,
            status: status,
            highest_qualification: highestQualification,
            specialization: specialization,
            email: email,
            phone: phone,
            office_room: officeRoom,
        };

        if (editingFaculty) {
            const payload: any = {
                _method: 'put',
                ...commonPayload,
            };

            if (selectedPhotoFile) {
                payload.profile_picture = selectedPhotoFile;
            } else if (removePhoto) {
                payload.remove_photo = 1;
            }

            router.post(`/faculties/${editingFaculty.id}`, payload, {
                forceFormData: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingFaculty(null);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        } else {
            const payload: any = {
                ...commonPayload,
            };

            if (selectedPhotoFile) {
                payload.profile_picture = selectedPhotoFile;
            }

            router.post('/faculties', payload, {
                forceFormData: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        }
    };

    // Filter faculties
    const filteredFaculties = useMemo(() => {
        return faculties.filter((faculty) => {
            const fullName = `${faculty.first_name} ${faculty.last_name}`.toLowerCase();
            const idNumber = (faculty.faculty_id || faculty.employee_id || '').toLowerCase();
            const rank = (faculty.academic_rank || '').toLowerCase();
            const programCode = (faculty.program?.code || '').toLowerCase();
            const searchLower = searchQuery.toLowerCase();

            const matchesSearch =
                !searchQuery ||
                fullName.includes(searchLower) ||
                idNumber.includes(searchLower) ||
                rank.includes(searchLower) ||
                programCode.includes(searchLower);

            const matchesProgram =
                programFilter === 'all' ||
                String(faculty.program_id) === programFilter;

            return matchesSearch && matchesProgram;
        });
    }, [faculties, searchQuery, programFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Faculty Management" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Users className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Faculty Management</h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Click any faculty member to open their complete profile, teaching workload, requirements tracker, and performance dossier.
                        </p>
                    </div>

                    <button
                        onClick={openAddDialog}
                        className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Faculty
                    </button>
                </div>

                {/* Filters and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
                    <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, rank, or program..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="w-full sm:w-56">
                            <select
                                value={programFilter}
                                onChange={(e) => setProgramFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="all">All Programs</option>
                                {programs.map((prog) => (
                                    <option key={prog.id} value={String(prog.id)}>
                                        {prog.code} — {prog.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Showing {filteredFaculties.length} of {faculties.length} faculty members</span>
                    </div>
                </div>

                {/* Add / Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-primary" />
                                {editingFaculty ? 'Edit Faculty Member' : 'Register New Faculty Member'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
                            {/* Profile Picture Upload Section */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 border border-border">
                                <div className="relative group">
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Faculty preview"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border-4 border-background shadow-md">
                                            {firstName ? firstName[0] : ''}
                                            {lastName ? lastName[0] : (firstName ? '' : <Users className="w-8 h-8 opacity-40" />)}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-transform hover:scale-105"
                                        title="Upload photo"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />

                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        {photoPreview ? 'Change Photo' : 'Upload Profile Picture'}
                                    </button>

                                    {photoPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1 ml-2"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <p className="text-[11px] text-muted-foreground mt-1 text-center">
                                    Shown across TV screens, faculty profile dossiers, and schedule displays. PNG, JPG up to 5MB.
                                </p>
                                {formErrors.profile_picture && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.profile_picture}</p>
                                )}
                            </div>

                            {/* Core Identity Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Maria"
                                        required
                                    />
                                    {formErrors.first_name && (
                                        <p className="text-xs text-red-500">{formErrors.first_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Santos"
                                        required
                                    />
                                    {formErrors.last_name && (
                                        <p className="text-xs text-red-500">{formErrors.last_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Faculty ID Number
                                    </label>
                                    <input
                                        type="text"
                                        value={facultyId}
                                        onChange={(e) => setFacultyId(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. CIDS-2026-001"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            Spreadsheet / Schedule Name Alias
                                        </label>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            Google Sheets Match
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={spreadsheetName}
                                        onChange={(e) => setSpreadsheetName(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono text-xs"
                                        placeholder="e.g. ROXAS or Santos, M. (optional alias)"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Allows editing official names in OfficeHub without affecting or breaking auto-sync with the Google spreadsheet.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Program Assignment <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={programId}
                                        onChange={(e) => setProgramId(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={prog.id}>
                                                {prog.code} — {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.program_id && (
                                        <p className="text-xs text-red-500">{formErrors.program_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Academic Rank
                                    </label>
                                    <input
                                        type="text"
                                        value={academicRank}
                                        onChange={(e) => setAcademicRank(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Assistant Professor I"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Employment Type
                                    </label>
                                    <select
                                        value={employmentType}
                                        onChange={(e) => setEmploymentType(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="Full-time">Full-time Faculty</option>
                                        <option value="Part-time">Part-time Faculty</option>
                                        <option value="Guest Lecturer">Guest Lecturer</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Highest Qualification
                                    </label>
                                    <input
                                        type="text"
                                        value={highestQualification}
                                        onChange={(e) => setHighestQualification(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Master of Information Technology"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Specialization / Domain
                                    </label>
                                    <input
                                        type="text"
                                        value={specialization}
                                        onChange={(e) => setSpecialization(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Software Engineering"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Institutional Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. maria.santos@cids.edu.ph"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Office Room / Consultation Desk
                                    </label>
                                    <input
                                        type="text"
                                        value={officeRoom}
                                        onChange={(e) => setOfficeRoom(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. CIDS Faculty Room 302"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Faculty Listing Table */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex-1 flex flex-col">
                    {filteredFaculties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full my-auto">
                            <div className="p-4 rounded-full bg-muted/60 mb-3">
                                <Users className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">No faculty members found</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                {searchQuery || programFilter !== 'all'
                                    ? 'No faculty match your search filter. Try clearing filters.'
                                    : 'Click the "Add Faculty" button above to register your first faculty member and upload their photo.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 font-semibold">Faculty Dossier & ID</th>
                                        <th scope="col" className="px-6 py-3.5 font-semibold">Academic Rank</th>
                                        <th scope="col" className="px-6 py-3.5 font-semibold">Assigned Program</th>
                                        <th scope="col" className="px-6 py-3.5 font-semibold">Employment Status</th>
                                        <th scope="col" className="px-6 py-3.5 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredFaculties.map((faculty) => (
                                        <tr
                                            key={faculty.id}
                                            onClick={() => router.visit(`/faculties/${faculty.id}`)}
                                            className="hover:bg-muted/40 transition-colors cursor-pointer group"
                                            title={`Click to view ${faculty.first_name} ${faculty.last_name}'s complete profile`}
                                        >
                                            {/* Photo & Faculty Identity */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {faculty.photo_url ? (
                                                        <img
                                                            src={faculty.photo_url}
                                                            alt={`${faculty.first_name} ${faculty.last_name}`}
                                                            className="w-11 h-11 rounded-full object-cover border-2 border-primary/20 shrink-0 shadow-xs group-hover:border-primary transition-colors"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary transition-colors">
                                                            {faculty.first_name?.[0]}
                                                            {faculty.last_name?.[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                            <span>{faculty.title_name || `Prof. ${faculty.first_name} ${faculty.last_name}`}</span>
                                                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs font-mono text-muted-foreground">
                                                                {faculty.faculty_id || faculty.employee_id || `CIDS-FAC-${faculty.id.toString().padStart(4, '0')}`}
                                                            </span>
                                                            {faculty.spreadsheet_name && (
                                                                <span
                                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                                                    title="Linked Google Sheets Alias"
                                                                >
                                                                    Sheet: {faculty.spreadsheet_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rank & Qualification */}
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-medium text-foreground">
                                                    {faculty.academic_rank || 'Faculty Member'}
                                                </div>
                                                {faculty.highest_qualification && (
                                                    <div className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={faculty.highest_qualification}>
                                                        {faculty.highest_qualification}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Program */}
                                            <td className="px-6 py-4">
                                                {faculty.program ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                        <GraduationCap className="w-3.5 h-3.5" />
                                                        <span className="font-semibold">{faculty.program.code}</span>
                                                        <span className="text-muted-foreground">·</span>
                                                        <span className="truncate max-w-[140px]" title={faculty.program.name}>{faculty.program.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>

                                            {/* Employment & Status */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                                        {faculty.status || 'Active'}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {faculty.employment_type || 'Full-time'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Action Menu */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => router.visit(`/faculties/${faculty.id}`)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors"
                                                        title="Open Profile"
                                                    >
                                                        <User className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Profile</span>
                                                    </button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                                                                title="More actions"
                                                            >
                                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem onClick={() => router.visit(`/faculties/${faculty.id}`)}>
                                                                <User className="h-4 w-4 mr-2 text-primary" />
                                                                View Full Profile
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditDialog(faculty)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Quick Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                onClick={() => {
                                                                    if (confirm(`Are you sure you want to delete ${faculty.first_name} ${faculty.last_name}?`)) {
                                                                        router.delete(`/faculties/${faculty.id}`);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
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
