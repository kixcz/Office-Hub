import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { SchedulingWorkspaceLayout } from '@/components/scheduling-workspace-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    RefreshCw,
    CheckCircle2,
    Sliders,
    Search,
    AlertCircle,
    Eye,
    ShieldCheck,
    ArrowRight,
    FileSpreadsheet,
    Database,
    Sparkles,
    CheckCheck,
    Layers,
    Tag,
} from 'lucide-react';

interface AcademicPeriod {
    id: number;
    name: string;
    code: string;
    academic_year: string;
    semester: string;
    is_active: boolean;
}

interface StagingRecord {
    id: number;
    sync_batch_id: number;
    source_row_number: number;
    sheet_tab: string;
    raw_subject: string;
    raw_faculty: string;
    raw_section: string;
    raw_room: string;
    raw_day: string;
    raw_time: string;
    norm_subject: string | null;
    norm_faculty: string | null;
    norm_section: string | null;
    norm_room: string | null;
    norm_day: string | null;
    norm_start_time: string | null;
    norm_end_time: string | null;
    scheduled_minutes: number;
    mapped_course_id: number | null;
    mapped_faculty_id: number | null;
    mapped_section_id: number | null;
    mapped_room_id: number | null;
    mapped_course?: { id: number; code: string; title: string };
    mapped_faculty?: { id: number; first_name: string; last_name: string };
    mapped_section?: { id: number; code: string };
    mapped_room?: { id: number; name: string };
    course_confidence: number;
    faculty_confidence: number;
    section_confidence: number;
    room_confidence: number;
    overall_confidence: number;
    mapping_evidence: Record<string, string>;
    has_date_conflict?: boolean;
    conflict_reason?: string | null;
    resolution_status: 'Unresolved' | 'Suggested' | 'Manual_Mapped' | 'Approved' | 'Ignored' | 'Duplicate';
    change_status: 'New' | 'Unchanged' | 'Modified' | 'Removed' | 'Mapping_Conflict';
}

interface SyncBatch {
    id: number;
    batch_reference: string;
    source_type: string;
    spreadsheet_id: string | null;
    sheet_name: string | null;
    status: 'Pending_Review' | 'Partially_Approved' | 'Approved' | 'Committed' | 'Failed';
    total_rows: number;
    high_confidence_count: number;
    needs_review_count: number;
    conflict_count: number;
    approved_count: number;
    created_at: string;
}

interface SourceAlias {
    id: number;
    entity_type: 'Course' | 'Faculty' | 'Section' | 'Room';
    source_raw_string: string;
    canonical_id: number;
    canonical_label: string;
    alias_type: string;
    times_used: number;
}

interface CanonicalItem {
    id: number;
    code?: string;
    title?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
}

interface Props {
    currentPeriod: AcademicPeriod;
    batches: SyncBatch[];
    activeBatch: SyncBatch | null;
    stagingRecords: StagingRecord[];
    aliases: SourceAlias[];
    verifiedCount: number;
    canonicalCourses: { id: number; code: string; title: string }[];
    canonicalFaculty: { id: number; first_name: string; last_name: string }[];
    canonicalSections: { id: number; code: string }[];
    canonicalRooms: { id: number; name: string }[];
}

export default function ScheduleReconciliation({
    currentPeriod,
    batches,
    activeBatch,
    stagingRecords,
    aliases,
    verifiedCount,
    canonicalCourses,
    canonicalFaculty,
    canonicalSections,
    canonicalRooms,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState<'staging' | 'aliases' | 'audit'>('staging');

    // Change Mapping Modal State
    const [selectedRecord, setSelectedRecord] = useState<StagingRecord | null>(null);
    const [editCourseId, setEditCourseId] = useState<string>('');
    const [editFacultyId, setEditFacultyId] = useState<string>('');
    const [editSectionId, setEditSectionId] = useState<string>('');
    const [editRoomId, setEditRoomId] = useState<string>('');
    const [saveAlias, setSaveAlias] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openEditModal = (record: StagingRecord) => {
        setSelectedRecord(record);
        setEditCourseId(record.mapped_course_id ? String(record.mapped_course_id) : '');
        setEditFacultyId(record.mapped_faculty_id ? String(record.mapped_faculty_id) : '');
        setEditSectionId(record.mapped_section_id ? String(record.mapped_section_id) : '');
        setEditRoomId(record.mapped_room_id ? String(record.mapped_room_id) : '');
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post(
            route('schedule.reconciliation.sync'),
            {},
            {
                onFinish: () => setIsSyncing(false),
            }
        );
    };

    const handleApproveRow = (recordId: number) => {
        router.post(
            route('schedule.reconciliation.update-record', { record: recordId }),
            {
                decision: 'Approve',
            },
            { preserveScroll: true }
        );
    };

    const handleSaveMapping = () => {
        if (!selectedRecord) return;
        setIsSubmitting(true);

        router.post(
            route('schedule.reconciliation.update-record', { record: selectedRecord.id }),
            {
                decision: 'Manual_Mapped',
                mapped_course_id: editCourseId ? Number(editCourseId) : null,
                mapped_faculty_id: editFacultyId ? Number(editFacultyId) : null,
                mapped_section_id: editSectionId ? Number(editSectionId) : null,
                mapped_room_id: editRoomId ? Number(editRoomId) : null,
                save_alias: saveAlias,
            },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedRecord(null),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleBulkApprove = () => {
        if (!activeBatch) return;
        if (confirm('Approve all records with overall confidence ≥ 90%?')) {
            router.post(
                route('schedule.reconciliation.bulk-approve', { batch: activeBatch.id }),
                {},
                { preserveScroll: true }
            );
        }
    };

    const handleCommit = () => {
        if (!activeBatch) return;
        if (
            confirm(
                'Publish approved rows to Verified Schedules? This will make them the authoritative schedule driving Attendance, Room Utilization, and Lab Monitoring.'
            )
        ) {
            router.post(
                route('schedule.reconciliation.commit', { batch: activeBatch.id }),
                {},
                { preserveScroll: true }
            );
        }
    };

    const filteredRecords = useMemo(() => {
        return stagingRecords.filter((rec) => {
            const matchesQuery =
                (rec.raw_subject?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (rec.raw_faculty?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (rec.raw_section?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (rec.raw_room?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (rec.mapped_course?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (rec.mapped_faculty?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

            if (statusFilter === 'all') return matchesQuery;
            if (statusFilter === 'approved') return matchesQuery && rec.resolution_status === 'Approved';
            if (statusFilter === 'suggested') return matchesQuery && rec.resolution_status === 'Suggested';
            if (statusFilter === 'unresolved') return matchesQuery && rec.resolution_status === 'Unresolved';
            if (statusFilter === 'high') return matchesQuery && rec.overall_confidence >= 90;
            if (statusFilter === 'needs_review') return matchesQuery && rec.overall_confidence < 90;
            return matchesQuery;
        });
    }, [stagingRecords, searchQuery, statusFilter]);

    const getConfidenceBadge = (score: number) => {
        if (score >= 90) return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono">{score}%</Badge>;
        if (score >= 70) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-mono">{score}%</Badge>;
        return <Badge variant="destructive" className="font-mono">{score}%</Badge>;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
                return <Badge className="bg-emerald-600 text-white">Approved</Badge>;
            case 'Manual_Mapped':
                return <Badge className="bg-blue-600 text-white">Manual Match</Badge>;
            case 'Suggested':
                return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Suggested</Badge>;
            case 'Unresolved':
                return <Badge variant="destructive">Unresolved</Badge>;
            case 'Ignored':
                return <Badge variant="secondary">Ignored</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <SchedulingWorkspaceLayout currentPeriod={currentPeriod}>
            <Head title="Schedule Sync & Reconciliation" />

            <div className="space-y-6">
                {/* Header & Primary Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Schedule Sync & Reconciliation</h1>
                            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                                External ➔ Canonical Bridge
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Synchronize raw Google Spreadsheet data, normalize formatting, map source aliases to canonical records, and approve verified schedules.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Spreadsheet
                        </Button>
                        {activeBatch && activeBatch.approved_count > 0 && (
                            <Button
                                onClick={handleCommit}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Publish Verified Schedules ({activeBatch.approved_count})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Imported Rows</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{activeBatch?.total_rows ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Staging batch reference #{activeBatch?.batch_reference ?? 'None'}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">High Confidence (≥90%)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-600">{activeBatch?.high_confidence_count ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Eligible for bulk approval</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Needs Human Review</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-amber-600">{activeBatch?.needs_review_count ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Fuzzy matches or missing aliases</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Reusable Aliases</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-purple-600">{aliases.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Rules learned across syncs</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-teal-500 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Verified Master Schedules</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-teal-600">{verifiedCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Driving attendance & lab monitoring</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b space-x-6 text-sm font-medium">
                    <button
                        onClick={() => setActiveTab('staging')}
                        className={`pb-3 border-b-2 flex items-center gap-2 ${
                            activeTab === 'staging'
                                ? 'border-indigo-600 text-indigo-600 font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Staging & Reconciliation ({filteredRecords.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('aliases')}
                        className={`pb-3 border-b-2 flex items-center gap-2 ${
                            activeTab === 'aliases'
                                ? 'border-indigo-600 text-indigo-600 font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Tag className="h-4 w-4" />
                        Alias Management & Rename Rules ({aliases.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`pb-3 border-b-2 flex items-center gap-2 ${
                            activeTab === 'audit'
                                ? 'border-indigo-600 text-indigo-600 font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Layers className="h-4 w-4" />
                        Sync Batch History ({batches.length})
                    </button>
                </div>

                {activeTab === 'staging' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search subject, faculty, section, room..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 bg-background"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-44 bg-background">
                                        <SelectValue placeholder="Filter status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Records</SelectItem>
                                        <SelectItem value="suggested">Needs Review / Suggested</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="high">High Confidence (≥90%)</SelectItem>
                                        <SelectItem value="needs_review">Low Confidence (&lt;90%)</SelectItem>
                                        <SelectItem value="unresolved">Unresolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                {activeBatch && activeBatch.high_confidence_count > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBulkApprove}
                                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                        Bulk Approve High Confidence ({activeBatch.high_confidence_count})
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Staging & Mapping Table */}
                        <Card className="shadow-sm">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-12 text-center">Row</TableHead>
                                            <TableHead className="w-72">Raw Source Value</TableHead>
                                            <TableHead className="w-80">Canonical Mapping</TableHead>
                                            <TableHead className="w-36 text-center">Confidence</TableHead>
                                            <TableHead>Mapping Evidence</TableHead>
                                            <TableHead className="w-28 text-center">Status</TableHead>
                                            <TableHead className="w-36 text-right">Decision</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRecords.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                                    No schedule staging rows found. Click "Sync Spreadsheet" to import from Google Sheets.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRecords.map((record) => (
                                                <TableRow key={record.id} className="hover:bg-muted/20">
                                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                        #{record.source_row_number}
                                                    </TableCell>

                                                    {/* Raw Source Preserved */}
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                                                <span className="font-mono bg-muted/60 px-1 py-0.5 rounded text-xs">Subj:</span>
                                                                {record.raw_subject}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                                <span className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[11px]">Fac:</span>
                                                                {record.raw_faculty}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                <span>Sec: <strong>{record.raw_section}</strong></span>
                                                                <span>•</span>
                                                                <span>Room: <strong>{record.raw_room}</strong></span>
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground/80 font-mono">
                                                                {record.raw_day} | {record.raw_time}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Canonical OfficeHub Record Binding */}
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-semibold text-sm text-indigo-700 flex items-center gap-1">
                                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                {record.mapped_course ? (
                                                                    <span>
                                                                        {record.mapped_course.code} – {record.mapped_course.title}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-destructive font-normal italic">Unmapped Course</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-foreground flex items-center gap-1">
                                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                {record.mapped_faculty ? (
                                                                    <span>
                                                                        {record.mapped_faculty.first_name} {record.mapped_faculty.last_name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-destructive italic">Unmapped Faculty</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                                                                <span>Sec: <strong>{record.mapped_section?.code ?? '—'}</strong></span>
                                                                <span>Room: <strong>{record.mapped_room?.name ?? '—'}</strong></span>
                                                                <span className="font-mono bg-indigo-50 text-indigo-700 px-1 rounded text-[11px]">
                                                                    {record.scheduled_minutes} mins
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Granular & Overall Confidence */}
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {getConfidenceBadge(record.overall_confidence)}
                                                            <div className="grid grid-cols-2 gap-x-1.5 text-[10px] text-muted-foreground font-mono">
                                                                <span>C: {record.course_confidence}%</span>
                                                                <span>F: {record.faculty_confidence}%</span>
                                                                <span>S: {record.section_confidence}%</span>
                                                                <span>R: {record.room_confidence}%</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Evidence Reason */}
                                                    <TableCell>
                                                        <div className="text-xs space-y-0.5 text-muted-foreground">
                                                            {Object.entries(record.mapping_evidence || {}).map(([key, val]) => (
                                                                <div key={key} className="flex items-center gap-1">
                                                                    <span className="capitalize font-medium text-foreground">{key}:</span>
                                                                    <span className="truncate max-w-[200px]">{String(val)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    {/* Status Badge */}
                                                    <TableCell className="text-center">
                                                        <div className="space-y-1 flex flex-col items-center">
                                                            {record.has_date_conflict ? (
                                                                <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] whitespace-normal text-center font-bold px-1.5 py-0.5 leading-tight">
                                                                    Employment-Date Conflict / Requires Mapping Review
                                                                </Badge>
                                                            ) : (
                                                                getStatusBadge(record.resolution_status)
                                                            )}
                                                            {record.has_date_conflict && (
                                                                <span className="text-[10px] text-amber-700 font-medium leading-none block">
                                                                    Effective date mismatch
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Human Actions */}
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {record.resolution_status !== 'Approved' && !record.has_date_conflict && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleApproveRow(record.id)}
                                                                    className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2"
                                                                    title="Approve Match"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openEditModal(record)}
                                                                className="h-8 px-2 gap-1 text-xs"
                                                            >
                                                                <Sliders className="h-3.5 w-3.5" />
                                                                Map / Alias
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tab 2: Alias Library / Rename Rules */}
                {activeTab === 'aliases' && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Tag className="h-5 w-5 text-indigo-600" />
                                Reusable Source Alias Library
                            </CardTitle>
                            <CardDescription>
                                These mappings connect historical or informal spreadsheet naming to canonical OfficeHub records. Future syncs automatically resolve these aliases with 100% confidence.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="w-32">Entity Type</TableHead>
                                        <TableHead className="w-72">Raw Source Value</TableHead>
                                        <TableHead className="w-80">Canonical OfficeHub Record</TableHead>
                                        <TableHead className="w-32">Rule Type</TableHead>
                                        <TableHead className="w-24 text-center">Hits</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aliases.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                No aliases configured yet. When you change mappings in the reconciliation table, check "Save as Reusable Alias" to teach the system.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        aliases.map((alias) => (
                                            <TableRow key={alias.id}>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {alias.entity_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono font-medium text-sm text-foreground">
                                                    "{alias.source_raw_string}"
                                                </TableCell>
                                                <TableCell className="text-sm font-semibold text-indigo-700">
                                                    {alias.canonical_label}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {alias.alias_type}
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {alias.times_used}x
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Tab 3: Batch History */}
                {activeTab === 'audit' && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Layers className="h-5 w-5 text-indigo-600" />
                                Ingestion & Reconciliation Batch History
                            </CardTitle>
                            <CardDescription>
                                Complete audit trail of spreadsheet imports, reconciliation approvals, and publication commits.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="w-44">Batch Reference</TableHead>
                                        <TableHead className="w-40">Import Timestamp</TableHead>
                                        <TableHead className="w-32">Status</TableHead>
                                        <TableHead className="w-28 text-center">Total Rows</TableHead>
                                        <TableHead className="w-28 text-center">Approved</TableHead>
                                        <TableHead className="w-28 text-center">Review Needed</TableHead>
                                        <TableHead className="w-32 text-right">Switch Batch</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batches.map((b) => (
                                        <TableRow key={b.id} className={activeBatch?.id === b.id ? 'bg-indigo-50/50' : ''}>
                                            <TableCell className="font-mono font-medium text-xs">
                                                {b.batch_reference}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(b.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{b.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs">{b.total_rows}</TableCell>
                                            <TableCell className="text-center font-mono text-xs text-emerald-600 font-bold">{b.approved_count}</TableCell>
                                            <TableCell className="text-center font-mono text-xs text-amber-600">{b.needs_review_count}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => router.get(route('schedule.reconciliation.index', { batch_id: b.id }))}
                                                    disabled={activeBatch?.id === b.id}
                                                    className="text-xs h-7"
                                                >
                                                    {activeBatch?.id === b.id ? 'Active' : 'Load'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Change Mapping & Alias Dialog */}
            <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sliders className="h-5 w-5 text-indigo-600" />
                            Explicit Mapping & Alias Binding
                        </DialogTitle>
                        <DialogDescription>
                            Bind raw spreadsheet values to canonical OfficeHub records without altering source provenance.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRecord && (
                        <div className="space-y-4 py-2">
                            {/* Raw Source Summary Box */}
                            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5 border">
                                <div className="font-semibold text-muted-foreground uppercase text-[10px]">Raw Spreadsheet Provenance (Row #{selectedRecord.source_row_number})</div>
                                <div className="grid grid-cols-2 gap-2 text-foreground font-mono">
                                    <div>Subject: <strong>{selectedRecord.raw_subject}</strong></div>
                                    <div>Faculty: <strong>{selectedRecord.raw_faculty}</strong></div>
                                    <div>Section: <strong>{selectedRecord.raw_section}</strong></div>
                                    <div>Room: <strong>{selectedRecord.raw_room}</strong></div>
                                </div>
                            </div>

                            {selectedRecord.has_date_conflict && (
                                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1 text-amber-900">
                                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                                        Employment-Date Conflict / Requires Mapping Review
                                    </div>
                                    <p className="text-[11px] leading-relaxed">
                                        {selectedRecord.conflict_reason ||
                                            'The spreadsheet attributes this course offering to this faculty member for the entire term, but official employment or assignment records indicate they were not yet appointed during earlier dates. Map the earlier period to the previous instructor or mark as Not Yet Employed.'}
                                    </p>
                                </div>
                            )}

                            {/* Selectors */}
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs">Canonical Course</Label>
                                    <Select value={editCourseId} onValueChange={setEditCourseId}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select canonical course..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-56">
                                            {canonicalCourses.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.code} – {c.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Canonical Faculty</Label>
                                    <Select value={editFacultyId} onValueChange={setEditFacultyId}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select canonical faculty..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-56">
                                            {canonicalFaculty.map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    {f.first_name} {f.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Section</Label>
                                        <Select value={editSectionId} onValueChange={setEditSectionId}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select section..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {canonicalSections.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        {s.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label className="text-xs">Room / Lab</Label>
                                        <Select value={editRoomId} onValueChange={setEditRoomId}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select room..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {canonicalRooms.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Reusable Alias Checkbox */}
                                <div className="flex items-start gap-2 pt-2 border-t">
                                    <input
                                        type="checkbox"
                                        id="saveAliasCheckbox"
                                        checked={saveAlias}
                                        onChange={(e) => setSaveAlias(e.target.checked)}
                                        className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="saveAliasCheckbox" className="text-xs text-muted-foreground leading-snug">
                                        <strong className="text-foreground">Save as Reusable Alias / Rename Mapping</strong>
                                        <br />
                                        Store this mapping in the alias library so future imports automatically resolve "{selectedRecord.raw_subject}" and "{selectedRecord.raw_faculty}".
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveMapping}
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Save & Approve Match
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SchedulingWorkspaceLayout>
    );
}
