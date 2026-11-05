import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    GraduationCap,
    Users,
    BookOpen,
    AlertTriangle,
    Plus,
    Upload,
    Copy,
    Download,
    Search,
    Filter,
    Edit2,
    Trash2,
    MoreHorizontal,
    Check,
    X,
    FileSpreadsheet,
    HelpCircle,
    Info,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

export interface SetupProgram {
    id: number;
    college_id: number;
    code: string;
    name: string;
    degree_level: string;
    department?: string | null;
    duration_years: number;
    year_levels: number;
    status: string;
    description?: string | null;
    program_head?: {
        user_id: number;
        name: string;
        email: string;
    } | null;
    curriculum_status: string;
    has_curriculum: boolean;
}

export interface CandidateUser {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

export interface TemplateProgram {
    id: number;
    college_id: number;
    college_code?: string;
    college_name?: string;
    code: string;
    name: string;
    degree_level: string;
    duration_years: number;
}

interface ParsedCsvRow {
    row_num: number;
    program_code: string;
    program_name: string;
    degree_level: string;
    department: string;
    duration_years: number;
    year_levels: number;
    program_head_email: string;
    effective_academic_year: string;
    status: string;
    validation_status: 'ready' | 'warning' | 'error';
    validation_message: string;
    matched_user_name?: string | null;
}

interface Props {
    college: {
        id: number;
        name: string;
        code: string;
        inheritance_settings?: Record<string, any> | null;
    };
    programs: SetupProgram[];
    candidateProgramHeads: CandidateUser[];
    otherCollegesPrograms: TemplateProgram[];
}

export default function ProgramsConfigurationStage({
    college,
    programs = [],
    candidateProgramHeads = [],
    otherCollegesPrograms = [],
}: Props) {
    // Search, Filter, Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDegreeLevel, setSelectedDegreeLevel] = useState('All Levels');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [activeTab, setActiveTab] = useState<'registry' | 'import' | 'templates'>('registry');

    // Modals
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<SetupProgram | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<SetupProgram | null>(null);
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [isCopyTemplateModalOpen, setIsCopyTemplateModalOpen] = useState(false);

    // Add/Edit Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        degree_level: 'Bachelor',
        department: college.name,
        duration_years: 4,
        program_head_id: '' as string | number,
        effective_academic_year: '2026-2027',
        status: 'Active',
        notes: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // CSV Import State
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
    const [isParsingCsv, setIsParsingCsv] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Copy Template State
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
    const [isCopying, setIsCopying] = useState(false);

    // Settings State
    const [allowAdminModify, setAllowAdminModify] = useState<boolean>(
        college.inheritance_settings?.allow_admin_modify_programs ?? true,
    );
    const [requireHeadBeforeActivation, setRequireHeadBeforeActivation] = useState<boolean>(
        college.inheritance_settings?.require_head_before_activation ?? false,
    );

    // Calculation of Summary Metrics
    const summaryMetrics = useMemo(() => {
        const total = programs.length;
        const headsAssigned = programs.filter((p) => p.program_head && p.program_head.user_id).length;
        const curriculaConfigured = programs.filter((p) => p.has_curriculum).length;
        // Issues: missing program head when required, or unassigned head
        const issues = programs.filter((p) => !p.program_head).length;

        return {
            total,
            headsAssigned,
            curriculaConfigured,
            issues,
        };
    }, [programs]);

    // Filtered Programs for Table
    const filteredPrograms = useMemo(() => {
        return programs.filter((p) => {
            const matchesSearch =
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDegree =
                selectedDegreeLevel === 'All Levels' ||
                p.degree_level.toLowerCase().includes(selectedDegreeLevel.toLowerCase());
            const matchesStatus =
                selectedStatus === 'All Status' || p.status.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesDegree && matchesStatus;
        });
    }, [programs, searchQuery, selectedDegreeLevel, selectedStatus]);

    // Handle Open Add Modal
    const handleOpenAddModal = () => {
        setEditingProgram(null);
        setFormData({
            code: '',
            name: '',
            degree_level: 'Bachelor',
            department: college.name,
            duration_years: 4,
            program_head_id: '',
            effective_academic_year: '2026-2027',
            status: 'Active',
            notes: '',
        });
        setFormErrors({});
        setIsAddEditModalOpen(true);
    };

    // Handle Open Edit Modal
    const handleOpenEditModal = (prog: SetupProgram) => {
        setEditingProgram(prog);
        setFormData({
            code: prog.code,
            name: prog.name,
            degree_level: prog.degree_level,
            department: prog.department || college.name,
            duration_years: prog.duration_years || 4,
            program_head_id: prog.program_head?.user_id || '',
            effective_academic_year: '2026-2027',
            status: prog.status || 'Active',
            notes: prog.description || '',
        });
        setFormErrors({});
        setIsAddEditModalOpen(true);
    };

    // Save Program (Add / Edit)
    const handleSaveProgram = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!formData.code.trim()) errors.code = 'Program Code is required (e.g. BSIT).';
        if (!formData.name.trim()) errors.name = 'Program Name is required.';
        if (!formData.duration_years || formData.duration_years < 1) errors.duration_years = 'Duration must be between 1 and 8 years.';

        // Duplicate code validation within the college (excluding itself on edit)
        const duplicate = programs.find(
            (p) => p.code.toUpperCase() === formData.code.trim().toUpperCase() && p.id !== editingProgram?.id,
        );
        if (duplicate) {
            errors.code = `Program code "${formData.code.toUpperCase()}" already exists in this college.`;
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        if (editingProgram) {
            router.put(
                `/institution/colleges/${college.id}/programs/${editingProgram.id}`,
                {
                    ...formData,
                    program_head_id: formData.program_head_id ? Number(formData.program_head_id) : null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsAddEditModalOpen(false);
                        setIsSubmitting(false);
                    },
                    onError: (errs) => {
                        setFormErrors(errs as Record<string, string>);
                        setIsSubmitting(false);
                    },
                },
            );
        } else {
            router.post(
                `/institution/colleges/${college.id}/programs`,
                {
                    ...formData,
                    program_head_id: formData.program_head_id ? Number(formData.program_head_id) : null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsAddEditModalOpen(false);
                        setIsSubmitting(false);
                    },
                    onError: (errs) => {
                        setFormErrors(errs as Record<string, string>);
                        setIsSubmitting(false);
                    },
                },
            );
        }
    };

    // Delete Program
    const handleConfirmDelete = () => {
        if (!programToDelete) return;
        setIsSubmitting(true);
        router.delete(`/institution/colleges/${college.id}/programs/${programToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setProgramToDelete(null);
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    // Download Sample CSV
    const handleDownloadTemplate = () => {
        const headers = [
            'program_code',
            'program_name',
            'degree_level',
            'department',
            'duration_years',
            'year_levels',
            'program_head_email',
            'effective_academic_year',
            'status',
        ];
        const rows = [
            [
                'BSIT',
                'Bachelor of Science in Information Technology',
                'Bachelor',
                college.code,
                '4',
                '4',
                candidateProgramHeads[0]?.email || 'prof1@dssc.edu.ph',
                '2026-2027',
                'Active',
            ],
            [
                'BSIS',
                'Bachelor of Science in Information Systems',
                'Bachelor',
                college.code,
                '4',
                '4',
                candidateProgramHeads[1]?.email || 'prof2@dssc.edu.ph',
                '2026-2027',
                'Active',
            ],
            [
                'DIT',
                'Diploma in Information Technology',
                'Diploma',
                college.code,
                '2',
                '2',
                '',
                '2026-2027',
                'Active',
            ],
        ];

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `velora_${college.code.toLowerCase()}_programs_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Parse CSV File with Real-time Validation and Candidate Head Matching
    const handleCsvUpload = (file: File) => {
        setCsvFile(file);
        setIsParsingCsv(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = (e.target?.result as string) || '';
            const lines = text
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter((l) => l.length > 0);

            if (lines.length <= 1) {
                setIsParsingCsv(false);
                return;
            }

            const headerLine = lines[0].toLowerCase().replace(/["']/g, '');
            const rawHeaders = headerLine.split(',').map((h) => h.trim());

            const codeIdx = rawHeaders.indexOf('program_code');
            const nameIdx = rawHeaders.indexOf('program_name');
            const degreeIdx = rawHeaders.indexOf('degree_level');
            const deptIdx = rawHeaders.indexOf('department');
            const durIdx = rawHeaders.indexOf('duration_years');
            const yrsIdx = rawHeaders.indexOf('year_levels');
            const emailIdx = rawHeaders.indexOf('program_head_email');
            const ayIdx = rawHeaders.indexOf('effective_academic_year');
            const statusIdx = rawHeaders.indexOf('status');

            const parsed: ParsedCsvRow[] = [];
            const seenCodes = new Set<string>();

            // Check existing codes in this college
            const existingCodes = new Set(programs.map((p) => p.code.toUpperCase()));

            for (let i = 1; i < lines.length; i++) {
                // simple CSV token split handling quotes
                const rowTokens = lines[i].split(',').map((item) => item.replace(/^["']|["']$/g, '').trim());
                const programCode = (rowTokens[codeIdx >= 0 ? codeIdx : 0] || '').toUpperCase();
                const programName = rowTokens[nameIdx >= 0 ? nameIdx : 1] || '';
                const degreeLevel = rowTokens[degreeIdx >= 0 ? degreeIdx : 2] || 'Bachelor';
                const department = rowTokens[deptIdx >= 0 ? deptIdx : 3] || college.name;
                const duration = parseInt(rowTokens[durIdx >= 0 ? durIdx : 4] || '4', 10) || 4;
                const yearLevels = parseInt(rowTokens[yrsIdx >= 0 ? yrsIdx : 5] || String(duration), 10) || duration;
                const headEmail = (rowTokens[emailIdx >= 0 ? emailIdx : 6] || '').toLowerCase();
                const ay = rowTokens[ayIdx >= 0 ? ayIdx : 7] || '2026-2027';
                const status = rowTokens[statusIdx >= 0 ? statusIdx : 8] || 'Active';

                let validationStatus: 'ready' | 'warning' | 'error' = 'ready';
                let validationMsg = 'Ready for onboarding';

                if (!programCode || !programName) {
                    validationStatus = 'error';
                    validationMsg = 'Missing Program Code or Name';
                } else if (seenCodes.has(programCode)) {
                    validationStatus = 'error';
                    validationMsg = `Duplicate code "${programCode}" in this upload batch`;
                } else if (existingCodes.has(programCode)) {
                    validationStatus = 'warning';
                    validationMsg = `Will update existing "${programCode}" in ${college.code}`;
                }

                seenCodes.add(programCode);

                // Match Program Head by Email
                let matchedHead: CandidateUser | undefined;
                if (headEmail) {
                    matchedHead = candidateProgramHeads.find((c) => c.email.toLowerCase() === headEmail);
                    if (!matchedHead && validationStatus !== 'error') {
                        validationStatus = 'warning';
                        validationMsg = `Unrecognized email: ${headEmail} (Will be left unassigned)`;
                    }
                }

                parsed.push({
                    row_num: i,
                    program_code: programCode,
                    program_name: programName,
                    degree_level: degreeLevel,
                    department,
                    duration_years: duration,
                    year_levels: yearLevels,
                    program_head_email: headEmail,
                    effective_academic_year: ay,
                    status,
                    validation_status: validationStatus,
                    validation_message: validationMsg,
                    matched_user_name: matchedHead ? matchedHead.name : null,
                });
            }

            setParsedRows(parsed);
            setIsParsingCsv(false);
        };
        reader.readAsText(file);
    };

    // Inline edit of parsed CSV rows
    const handleUpdateParsedRow = (index: number, field: keyof ParsedCsvRow, value: any) => {
        setParsedRows((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            // re-validate code
            if (field === 'program_code') {
                const code = String(value).toUpperCase().trim();
                next[index].program_code = code;
                if (!code) {
                    next[index].validation_status = 'error';
                    next[index].validation_message = 'Program code cannot be empty';
                } else {
                    next[index].validation_status = 'ready';
                    next[index].validation_message = 'Ready';
                }
            }
            return next;
        });
    };

    // Execute Bulk Import
    const handleExecuteImport = () => {
        const validRows = parsedRows.filter((r) => r.validation_status !== 'error');
        if (validRows.length === 0) return;

        setIsImporting(true);
        router.post(
            `/institution/colleges/${college.id}/programs/bulk-import`,
            {
                programs: validRows.map((r) => ({
                    program_code: r.program_code,
                    program_name: r.program_name,
                    degree_level: r.degree_level,
                    department: r.department,
                    duration_years: r.duration_years,
                    program_head_email: r.program_head_email,
                    status: r.status,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCsvModalOpen(false);
                    setParsedRows([]);
                    setCsvFile(null);
                    setIsImporting(false);
                },
                onError: () => setIsImporting(false),
            },
        );
    };

    // Copy Selected Templates
    const handleExecuteCopyTemplates = () => {
        if (selectedTemplateIds.length === 0) return;
        setIsCopying(true);
        router.post(
            `/institution/colleges/${college.id}/programs/copy-template`,
            {
                source_program_ids: selectedTemplateIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCopyTemplateModalOpen(false);
                    setSelectedTemplateIds([]);
                    setIsCopying(false);
                },
                onError: () => setIsCopying(false),
            },
        );
    };

    // Update Stage Settings Checkboxes
    const handleToggleSetting = (field: 'allow_admin_modify_programs' | 'require_head_before_activation', val: boolean) => {
        if (field === 'allow_admin_modify_programs') setAllowAdminModify(val);
        if (field === 'require_head_before_activation') setRequireHeadBeforeActivation(val);

        router.post(
            `/institution/colleges/${college.id}/programs/settings`,
            {
                [field]: val,
            },
            { preserveScroll: true },
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. STAGE HEADER & DESCRIPTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/70">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                            <GraduationCap className="w-4 h-4" />
                        </span>
                        <h2 className="text-lg font-black text-foreground">Stage 5: Programs Configuration</h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            ✓ Stage Complete
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl">
                        Define the academic programs offered by this college. Programs can be added manually, imported in bulk from CSV, or copied from an existing college template.
                    </p>
                </div>
            </div>

            {/* 2. PROGRAM SETUP SUMMARY METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Total Programs */}
                <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-black text-foreground leading-tight">{summaryMetrics.total}</div>
                        <div className="text-[11px] font-semibold text-muted-foreground">Total Programs</div>
                    </div>
                </div>

                {/* Program Heads Assigned */}
                <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-black text-foreground leading-tight">
                            {summaryMetrics.headsAssigned} / {summaryMetrics.total}
                        </div>
                        <div className="text-[11px] font-semibold text-muted-foreground">Program Heads Assigned</div>
                    </div>
                </div>

                {/* Curricula Configured */}
                <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-lg font-black text-foreground leading-tight">
                            {summaryMetrics.curriculaConfigured} / {summaryMetrics.total}
                        </div>
                        <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <span>Curricula Configured</span>
                            <span title="College Admin handles curriculum mapping after onboarding">
                                <HelpCircle className="w-3 h-3 text-muted-foreground" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Needs Attention / Issues */}
                <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-lg font-black text-foreground leading-tight">{summaryMetrics.issues}</div>
                        <div className="text-[11px] font-semibold text-muted-foreground">Needs Attention</div>
                    </div>
                </div>
            </div>

            {/* 3. FUNCTIONAL TOOLBAR: TABS & ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Stage Navigation Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/80">
                    <button
                        type="button"
                        onClick={() => setActiveTab('registry')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'registry'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span>Program Registry ({programs.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCsvModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import & Bulk Setup</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCopyTemplateModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Program Templates</span>
                    </button>
                </div>

                {/* Main Action: + Add Program */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="h-9 px-4 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add Program</span>
                    </Button>
                </div>
            </div>

            {/* 4. SEARCH & FILTER CONTROLS */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5 relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search programs (name or code)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    />
                </div>

                <div className="sm:col-span-3">
                    <select
                        value={selectedDegreeLevel}
                        onChange={(e) => setSelectedDegreeLevel(e.target.value)}
                        className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                    >
                        <option value="All Levels">All Degree Levels</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Diploma">Diploma / Associate</option>
                        <option value="Master">Master's</option>
                        <option value="Doctoral">Doctoral</option>
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                    >
                        <option value="All Status">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Phased Out">Phased Out</option>
                    </select>
                </div>

                <div className="sm:col-span-2 flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedDegreeLevel('All Levels');
                            setSelectedStatus('All Status');
                        }}
                        className="h-9 px-3 text-xs font-semibold rounded-xl border-border bg-card hover:bg-muted text-foreground flex items-center gap-1.5"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                    </Button>
                </div>
            </div>

            {/* 5. PROGRAM REGISTRY PREVIEW TABLE */}
            <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                <th className="py-3 px-4 w-10 text-center">
                                    <input type="checkbox" className="rounded border-border" />
                                </th>
                                <th className="py-3 px-4">Program</th>
                                <th className="py-3 px-3">Code</th>
                                <th className="py-3 px-3">Degree Level</th>
                                <th className="py-3 px-3">Duration</th>
                                <th className="py-3 px-4">Program Head</th>
                                <th className="py-3 px-4">Curriculum</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {filteredPrograms.length > 0 ? (
                                filteredPrograms.map((prog) => (
                                    <tr key={prog.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="py-3 px-4 text-center">
                                            <input type="checkbox" className="rounded border-border" />
                                        </td>
                                        <td className="py-3 px-4 font-bold text-foreground">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <GraduationCap className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-foreground">{prog.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{prog.department || college.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 font-mono font-bold text-primary">
                                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10.5px]">
                                                {prog.code}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-foreground font-medium">
                                            <span className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[10.5px]">
                                                {prog.degree_level}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-muted-foreground font-semibold">
                                            {prog.duration_years} Years
                                        </td>
                                        <td className="py-3 px-4">
                                            {prog.program_head ? (
                                                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                                                    <Users className="w-3.5 h-3.5 text-primary" />
                                                    <span>{prog.program_head.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-[11px]">
                                                    — Not Assigned —
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                    prog.has_curriculum
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                {prog.curriculum_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>{prog.status}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(prog)}
                                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Edit Program Blueprint"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProgramToDelete(prog);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors"
                                                    title="Remove Program"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <GraduationCap className="w-8 h-8 text-muted-foreground/60" />
                                            <p className="text-sm font-semibold">No academic programs registered yet for {college.name}.</p>
                                            <p className="text-xs text-muted-foreground max-w-sm">
                                                Add the college's programs manually, upload via bulk CSV, or copy from existing institutional templates.
                                            </p>
                                            <div className="pt-2 flex items-center gap-2">
                                                <Button size="sm" onClick={handleOpenAddModal} className="h-8 text-xs font-bold bg-primary text-primary-foreground">
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Program
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setIsCsvModalOpen(true)} className="h-8 text-xs font-bold">
                                                    <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV
                                                </Button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer Pagination Bar */}
                <div className="p-3 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                    <div>
                        Showing 1–{filteredPrograms.length} of {programs.length} programs
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-bold">1</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 6. IMPORT TOOLS BANNER & GOVERNANCE SETTINGS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                {/* Left Card: Bulk Import Programs */}
                <div className="md:col-span-6 p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Bulk Import Programs (CSV)</h4>
                            <p className="text-[11px] text-muted-foreground">Quickly add multiple programs using a validated CSV file.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadTemplate}
                            className="h-8 px-3 text-xs font-semibold rounded-xl border-border bg-card hover:bg-muted text-foreground flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download CSV Template</span>
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setIsCsvModalOpen(true)}
                            className="h-8 px-3 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Import CSV</span>
                        </Button>
                    </div>
                </div>

                {/* Right Card: College Governance & Delegation Settings */}
                <div className="md:col-span-6 p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Settings & Permissions</h4>
                            <p className="text-[11px] text-muted-foreground">Control what the College Admin can modify after college activation.</p>
                        </div>
                    </div>

                    <div className="space-y-2.5 pt-1 text-xs">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                                <span>Allow College Admin to modify program definitions after activation</span>
                                <span title="When enabled, College Admin can rename programs and update course descriptions">
                                    <Info className="w-3 h-3 text-muted-foreground" />
                                </span>
                            </span>
                            <input
                                type="checkbox"
                                checked={allowAdminModify}
                                onChange={(e) => handleToggleSetting('allow_admin_modify_programs', e.target.checked)}
                                className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                                <span>Require Program Head assignment before program activation</span>
                                <span title="Programs without an appointed head will remain in In Setup status">
                                    <Info className="w-3 h-3 text-muted-foreground" />
                                </span>
                            </span>
                            <input
                                type="checkbox"
                                checked={requireHeadBeforeActivation}
                                onChange={(e) => handleToggleSetting('require_head_before_activation', e.target.checked)}
                                className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* MODAL 1: ADD / EDIT PROGRAM DIALOG                                        */}
            {/* ========================================================================= */}
            <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <form onSubmit={handleSaveProgram}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-black text-foreground">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4" />
                                </span>
                                <span>{editingProgram ? 'Edit Academic Program Blueprint' : 'Add New Academic Program'}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Establish the program identity and duration for {college.name}. Detailed curricula and course offerings will be configured in the College Admin portal.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
                            {/* Program Code */}
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Program Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. BSIT"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full h-9 px-3 rounded-xl border border-border bg-card text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                    required
                                />
                                {formErrors.code && <p className="text-[10px] text-rose-500 mt-0.5 font-medium">{formErrors.code}</p>}
                            </div>

                            {/* Degree Level */}
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Degree Type / Level <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.degree_level}
                                    onChange={(e) => setFormData({ ...formData, degree_level: e.target.value })}
                                    className="w-full h-9 px-3 rounded-xl border border-border bg-card text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                                >
                                    <option value="Bachelor">Bachelor's Degree</option>
                                    <option value="Diploma">Diploma / Associate (2 Years)</option>
                                    <option value="Master">Master's Degree</option>
                                    <option value="Doctoral">Doctoral Degree</option>
                                    <option value="Certificate">Certificate Program</option>
                                </select>
                            </div>

                            {/* Program Name */}
                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Program Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bachelor of Science in Information Technology"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-9 px-3 rounded-xl border border-border bg-card text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                    required
                                />
                                {formErrors.name && <p className="text-[10px] text-rose-500 mt-0.5 font-medium">{formErrors.name}</p>}
                            </div>

                            {/* Program Duration & Year Levels */}
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Duration (Years) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={8}
                                    value={formData.duration_years}
                                    onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) || 4 })}
                                    className="w-full h-9 px-3 rounded-xl border border-border bg-card text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                    required
                                />
                                {formErrors.duration_years && <p className="text-[10px] text-rose-500 mt-0.5 font-medium">{formErrors.duration_years}</p>}
                            </div>

                            {/* Department */}
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder={college.name}
                                    className="w-full h-9 px-3 rounded-xl border border-border bg-card text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                />
                            </div>

                            {/* Program Head Designation (Optional) */}
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Program Head <span className="text-muted-foreground font-normal">(Optional)</span>
                                </label>
                                <select
                                    value={formData.program_head_id}
                                    onChange={(e) => setFormData({ ...formData, program_head_id: e.target.value })}
                                    className="w-full h-9 px-3 rounded-xl border border-border bg-card text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                                >
                                    <option value="">— Assign Later by College Admin —</option>
                                    {candidateProgramHeads.map((cand) => (
                                        <option key={cand.id} value={cand.id}>
                                            {cand.name} ({cand.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full h-9 px-3 rounded-xl border border-border bg-card text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Phased Out">Phased Out</option>
                                </select>
                            </div>

                            {/* Notes / Description */}
                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-bold text-foreground block mb-1">Notes / Description</label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Specialization tracks, accreditation notes, or board exam alignment..."
                                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-bold">
                                {isSubmitting ? 'Saving...' : editingProgram ? 'Update Program' : 'Establish Program'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 2: BULK CSV IMPORT PREVIEW & INLINE VALIDATION DIALOG                */}
            {/* ========================================================================= */}
            <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-black text-foreground">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <FileSpreadsheet className="w-4 h-4" />
                            </span>
                            <span>Bulk Import Academic Programs from CSV</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Upload a CSV file containing academic programs. Inspect and fix any records inline before committing changes.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Drag-and-drop or File Input */}
                    <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center text-center space-y-2">
                        <Upload className="w-7 h-7 text-primary" />
                        <div className="text-xs font-semibold text-foreground">
                            {csvFile ? (
                                <span className="text-primary font-bold">Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
                            ) : (
                                <span>Drag and drop your programs CSV file here, or browse</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="h-8 px-3 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 cursor-pointer shadow-xs">
                                <span>Browse File</span>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleCsvUpload(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="h-8 text-xs font-semibold">
                                <Download className="w-3.5 h-3.5 mr-1" /> Template
                            </Button>
                        </div>
                    </div>

                    {/* Live CSV Validation Table */}
                    {parsedRows.length > 0 && (
                        <div className="flex-1 overflow-y-auto rounded-xl border border-border mt-3">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-muted/50 sticky top-0 border-b border-border text-[11px] font-bold text-muted-foreground">
                                    <tr>
                                        <th className="py-2.5 px-3">Row</th>
                                        <th className="py-2.5 px-3">Code</th>
                                        <th className="py-2.5 px-3">Program Title</th>
                                        <th className="py-2.5 px-3">Duration</th>
                                        <th className="py-2.5 px-3">Program Head Email</th>
                                        <th className="py-2.5 px-3">Validation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {parsedRows.map((row, idx) => (
                                        <tr key={idx} className={row.validation_status === 'error' ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                                            <td className="py-2 px-3 font-mono text-muted-foreground">#{row.row_num}</td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    value={row.program_code}
                                                    onChange={(e) => handleUpdateParsedRow(idx, 'program_code', e.target.value)}
                                                    className="w-20 h-7 px-2 font-mono font-bold uppercase rounded border border-border bg-card text-foreground text-xs"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    value={row.program_name}
                                                    onChange={(e) => handleUpdateParsedRow(idx, 'program_name', e.target.value)}
                                                    className="w-full h-7 px-2 rounded border border-border bg-card text-foreground text-xs font-semibold"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className="text-muted-foreground font-semibold">{row.duration_years} yrs</span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[11px] text-foreground">{row.program_head_email || '—'}</span>
                                                    {row.matched_user_name && (
                                                        <span className="text-[10px] text-emerald-600 font-bold">✓ Matched: {row.matched_user_name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        row.validation_status === 'ready'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : row.validation_status === 'warning'
                                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {row.validation_message}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-3 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsCsvModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={parsedRows.length === 0 || isImporting || parsedRows.every((r) => r.validation_status === 'error')}
                            onClick={handleExecuteImport}
                            className="bg-primary text-primary-foreground font-bold"
                        >
                            {isImporting ? 'Importing...' : `Confirm & Import (${parsedRows.filter((r) => r.validation_status !== 'error').length} Programs)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 3: COPY PROGRAMS FROM TEMPLATE DIALOG                               */}
            {/* ========================================================================= */}
            <Dialog open={isCopyTemplateModalOpen} onOpenChange={setIsCopyTemplateModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-black text-foreground">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Copy className="w-4 h-4" />
                            </span>
                            <span>Copy Programs from Existing College / Template</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Select existing academic program definitions from other colleges to replicate into {college.code}. Only blueprints are copied (not faculty or operational data).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[350px] overflow-y-auto space-y-2 py-2">
                        {otherCollegesPrograms.length > 0 ? (
                            otherCollegesPrograms.map((tmpl) => {
                                const isSelected = selectedTemplateIds.includes(tmpl.id);
                                return (
                                    <div
                                        key={tmpl.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedTemplateIds(selectedTemplateIds.filter((id) => id !== tmpl.id));
                                            } else {
                                                setSelectedTemplateIds([...selectedTemplateIds, tmpl.id]);
                                            }
                                        }}
                                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border bg-card hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
                                            />
                                            <div>
                                                <div className="font-bold text-xs text-foreground flex items-center gap-2">
                                                    <span>{tmpl.name}</span>
                                                    <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">
                                                        {tmpl.code}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    Source: {tmpl.college_name} ({tmpl.college_code}) · {tmpl.degree_level} · {tmpl.duration_years} Years
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-6">No other college programs available to clone.</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCopyTemplateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={selectedTemplateIds.length === 0 || isCopying}
                            onClick={handleExecuteCopyTemplates}
                            className="bg-primary text-primary-foreground font-bold"
                        >
                            {isCopying ? 'Copying...' : `Copy Selected (${selectedTemplateIds.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 4: DELETE CONFIRMATION DIALOG                                       */}
            {/* ========================================================================= */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-black text-rose-600">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Remove Program Blueprint?</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Are you sure you want to remove <strong className="text-foreground">{programToDelete?.code} - {programToDelete?.name}</strong> from {college.name}? Any unassigned draft curricula or head assignments will be detached.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleConfirmDelete} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                            {isSubmitting ? 'Removing...' : 'Confirm Remove'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

