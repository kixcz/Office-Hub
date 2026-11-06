import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Building2,
    Monitor,
    FlaskConical,
    Tv,
    Layers,
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
    Settings,
    Clock,
    MapPin,
    Users,
    Sliders,
    Wifi,
    Projector,
    CheckCircle2,
    AlertCircle,
    Share2,
    CheckSquare,
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

export interface SetupFacility {
    id: number;
    college_id: number;
    facility_code: string;
    facility_name: string;
    facility_type: string;
    custom_type?: string | null;
    building: string;
    floor: string;
    capacity: number;
    is_shared: boolean;
    status: string;
    condition: string;
    operational_status: string;
    setup_readiness: 'Ready' | 'Incomplete' | 'Needs Attention';
    operating_hours: string;
    supported_activities?: string[];
    capabilities?: {
        has_projector?: boolean;
        num_workstations?: number;
        internet_type?: string;
        specialized_software?: string[];
        has_aircon?: boolean;
        power_redundancy?: string;
        specialized_equipment?: string;
    };
    is_accessible?: boolean;
    notes?: string | null;
}

export interface TemplateFacility {
    id: number;
    college_id: number;
    college_code?: string;
    college_name?: string;
    facility_code: string;
    facility_name: string;
    facility_type: string;
    building?: string | null;
    floor?: string | null;
    capacity: number;
    condition?: string;
    status?: string;
}

interface ParsedCsvFacilityRow {
    row_num: number;
    facility_code: string;
    facility_name: string;
    facility_type: string;
    building: string;
    floor: string;
    capacity: number;
    operating_start: string;
    operating_end: string;
    status: string;
    condition: string;
    shared: boolean;
    notes: string;
    validation_status: 'ready' | 'warning' | 'error';
    validation_message: string;
}

interface Props {
    college: {
        id: number;
        name: string;
        code: string;
        inheritance_settings?: Record<string, any> | null;
    };
    facilities: SetupFacility[];
    otherCollegesFacilities: TemplateFacility[];
}

const STANDARD_FACILITY_TYPES = [
    'Classroom',
    'Computer Lab',
    'Laboratory',
    'Studio',
    'Workshop',
    'Conference Room',
    'Simulation Room',
    'Lecture Hall',
    'Other / Custom',
];

const INSTITUTION_STANDARDS = [
    {
        type: 'Classroom',
        standardCapacity: '40 - 50 students',
        specs: 'Whiteboard, standard electrical outlets, natural/AC ventilation, minimum 1.5 sq.m per student.',
        inheritedFrom: 'Davao Del Sur State College Academic Standards Code 2025',
    },
    {
        type: 'Computer Lab',
        standardCapacity: '30 - 40 stations',
        specs: '1:1 computer ratio, Gigabit LAN / Campus Wi-Fi, 2x 2.5HP Inverter AC units, dedicated AVR/UPS subpanel.',
        inheritedFrom: 'DSSC IT Resource Infrastructure Policy 2024-B',
    },
    {
        type: 'Science & Engineering Lab',
        standardCapacity: '24 - 30 students',
        specs: 'Chemical wash stations, safety goggles storage, fire blanket, dedicated fume hoods, emergency shutoffs.',
        inheritedFrom: 'Commission on Higher Education (CHED) CMO Lab Safety Guidelines',
    },
    {
        type: 'Media / TV Studio',
        standardCapacity: '15 - 20 crew/students',
        specs: 'Acoustic wall panelling, ceiling lighting grid, 3x HDMI studio capture links, SDI monitoring.',
        inheritedFrom: 'DSSC Institutional Media & Broadcasting Standard',
    },
    {
        type: 'Conference / Defense Room',
        standardCapacity: '12 - 20 seats',
        specs: 'Display monitor or projector, video conferencing camera bar, power table hubs, teleconference phone.',
        inheritedFrom: 'DSSC Graduate School & Administrative Governance Standards',
    },
];

export default function FacilitiesConfigurationStage({
    college,
    facilities = [],
    otherCollegesFacilities = [],
}: Props) {
    // Search, Filter, Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFacilityType, setSelectedFacilityType] = useState('All Types');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [selectedCondition, setSelectedCondition] = useState('All Conditions');
    const [activeTab, setActiveTab] = useState<'registry' | 'import' | 'templates' | 'standards'>('registry');

    // Selected rows for bulk operations
    const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([]);

    // Modals
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<SetupFacility | null>(null);

    // Add/Edit Form State
    const [facilityForm, setFacilityForm] = useState({
        facility_code: '',
        facility_name: '',
        facility_type: 'Classroom',
        custom_type: '',
        building: `${college.code} Main Building`,
        floor: '1st Floor',
        capacity: 40,
        is_shared: false,
        status: 'Available',
        condition: 'Good',
        operational_status: 'Available',
        operating_hours: '7:00 AM - 7:00 PM',
        is_accessible: true,
        notes: '',
        // Capabilities
        has_projector: true,
        num_workstations: 0,
        internet_type: 'Campus Wi-Fi',
        has_aircon: true,
        power_redundancy: 'Standard Grid',
        specialized_equipment: '',
        supported_activities: ['Lecture', 'Laboratory'],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // CSV Import State
    const [csvRows, setCsvRows] = useState<ParsedCsvFacilityRow[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [csvFileName, setCsvFileName] = useState<string | null>(null);

    // Template Copy State
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
    const [isCopyingTemplates, setIsCopyingTemplates] = useState(false);

    // Governance settings state
    const [allowAdminModifyFacilities, setAllowAdminModifyFacilities] = useState<boolean>(
        college.inheritance_settings?.allow_admin_modify_facilities ?? true
    );
    const [requireCapacityBeforeScheduling, setRequireCapacityBeforeScheduling] = useState<boolean>(
        college.inheritance_settings?.require_capacity_before_scheduling ?? true
    );
    const [requireRoomTypeForScheduling, setRequireRoomTypeForScheduling] = useState<boolean>(
        college.inheritance_settings?.require_room_type_for_scheduling ?? true
    );
    const [allowSharedFacilitiesAcrossColleges, setAllowSharedFacilitiesAcrossColleges] = useState<boolean>(
        college.inheritance_settings?.allow_shared_facilities_across_colleges ?? true
    );
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Delete confirmation
    const [facilityToDelete, setFacilityToDelete] = useState<SetupFacility | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Summary Metrics
    const metrics = useMemo(() => {
        const total = facilities.length;
        const classrooms = facilities.filter((f) => f.facility_type === 'Classroom' || f.facility_type === 'Lecture Hall').length;
        const labs = facilities.filter((f) => f.facility_type === 'Laboratory' || f.facility_type === 'Science Laboratory').length;
        const computerLabs = facilities.filter((f) => f.facility_type === 'Computer Lab').length;
        const studio = facilities.filter((f) => f.facility_type === 'Studio' || f.facility_type === 'Media Studio' || f.facility_type === 'Workshop').length;
        const ready = facilities.filter((f) => f.setup_readiness === 'Ready').length;
        const needsAttention = facilities.filter((f) => f.setup_readiness === 'Needs Attention' || f.setup_readiness === 'Incomplete' || f.condition === 'Needs Repair' || f.capacity <= 0).length;

        return {
            total,
            classrooms,
            labs,
            computerLabs,
            studio,
            ready,
            needsAttention,
        };
    }, [facilities]);

    // Filtered facilities
    const filteredFacilities = useMemo(() => {
        return facilities.filter((f) => {
            const matchesSearch =
                searchQuery === '' ||
                f.facility_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.building.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType =
                selectedFacilityType === 'All Types' || f.facility_type === selectedFacilityType;

            const matchesStatus =
                selectedStatus === 'All Status' || f.status === selectedStatus;

            const matchesCondition =
                selectedCondition === 'All Conditions' || f.condition === selectedCondition;

            return matchesSearch && matchesType && matchesStatus && matchesCondition;
        });
    }, [facilities, searchQuery, selectedFacilityType, selectedStatus, selectedCondition]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage) || 1;
    const paginatedFacilities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredFacilities.slice(start, start + itemsPerPage);
    }, [filteredFacilities, currentPage]);

    // Open Add Modal
    const handleOpenAddModal = () => {
        setEditingFacility(null);
        setFacilityForm({
            facility_code: '',
            facility_name: '',
            facility_type: 'Classroom',
            custom_type: '',
            building: `${college.code} Building A`,
            floor: '1st Floor',
            capacity: 40,
            is_shared: false,
            status: 'Available',
            condition: 'Good',
            operational_status: 'Available',
            operating_hours: '7:00 AM - 7:00 PM',
            is_accessible: true,
            notes: '',
            has_projector: true,
            num_workstations: 0,
            internet_type: 'Campus Wi-Fi',
            has_aircon: true,
            power_redundancy: 'Standard Grid',
            specialized_equipment: '',
            supported_activities: ['Lecture', 'Laboratory'],
        });
        setFormError(null);
        setIsAddEditModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (f: SetupFacility) => {
        setEditingFacility(f);
        setFacilityForm({
            facility_code: f.facility_code,
            facility_name: f.facility_name,
            facility_type: f.facility_type,
            custom_type: f.custom_type || '',
            building: f.building,
            floor: f.floor,
            capacity: f.capacity,
            is_shared: f.is_shared,
            status: f.status,
            condition: f.condition,
            operational_status: f.operational_status,
            operating_hours: f.operating_hours || '7:00 AM - 7:00 PM',
            is_accessible: f.is_accessible ?? true,
            notes: f.notes || '',
            has_projector: f.capabilities?.has_projector ?? false,
            num_workstations: f.capabilities?.num_workstations ?? 0,
            internet_type: f.capabilities?.internet_type || 'Campus Wi-Fi',
            has_aircon: f.capabilities?.has_aircon ?? true,
            power_redundancy: f.capabilities?.power_redundancy || 'Standard Grid',
            specialized_equipment: f.capabilities?.specialized_equipment || '',
            supported_activities: f.supported_activities || ['Lecture'],
        });
        setFormError(null);
        setIsAddEditModalOpen(true);
    };

    // Save Facility (Store or Update)
    const handleSaveFacility = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!facilityForm.facility_code.trim()) {
            setFormError('Facility Code is required.');
            return;
        }
        if (!facilityForm.facility_name.trim()) {
            setFormError('Facility Name is required.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            facility_code: facilityForm.facility_code.trim(),
            facility_name: facilityForm.facility_name.trim(),
            facility_type: facilityForm.facility_type,
            custom_type: facilityForm.custom_type.trim() || null,
            building: facilityForm.building.trim(),
            floor: facilityForm.floor.trim(),
            capacity: Number(facilityForm.capacity) || 0,
            is_shared: facilityForm.is_shared,
            status: facilityForm.status,
            condition: facilityForm.condition,
            operational_status: facilityForm.operational_status,
            operating_hours: facilityForm.operating_hours,
            is_accessible: facilityForm.is_accessible,
            notes: facilityForm.notes.trim() || null,
            supported_activities: facilityForm.supported_activities,
            capabilities: {
                has_projector: facilityForm.has_projector,
                num_workstations: Number(facilityForm.num_workstations) || 0,
                internet_type: facilityForm.internet_type,
                has_aircon: facilityForm.has_aircon,
                power_redundancy: facilityForm.power_redundancy,
                specialized_equipment: facilityForm.specialized_equipment,
            },
        };

        if (editingFacility) {
            router.put(`/institution/colleges/${college.id}/facilities/${editingFacility.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditModalOpen(false);
                    setEditingFacility(null);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setFormError(Object.values(errors)[0] as string);
                    setIsSubmitting(false);
                },
            });
        } else {
            router.post(`/institution/colleges/${college.id}/facilities`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddEditModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setFormError(Object.values(errors)[0] as string);
                    setIsSubmitting(false);
                },
            });
        }
    };

    // Delete Facility
    const handleConfirmDelete = () => {
        if (!facilityToDelete) return;
        setIsDeleting(true);

        router.delete(`/institution/colleges/${college.id}/facilities/${facilityToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setFacilityToDelete(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    // Download CSV Template
    const handleDownloadTemplate = () => {
        const headers = [
            'facility_code',
            'facility_name',
            'facility_type',
            'building',
            'floor',
            'capacity',
            'operating_start',
            'operating_end',
            'status',
            'condition',
            'shared',
            'notes',
        ];

        const sampleRows = [
            [
                `${college.code}-CL01`,
                'Classroom 101',
                'Classroom',
                `${college.code} Building A`,
                '1st Floor',
                '40',
                '7:00 AM',
                '7:00 PM',
                'Available',
                'Good',
                'false',
                'Standard lecture classroom with ceiling projector',
            ],
            [
                `${college.code}-CPL01`,
                'Computer Laboratory 1',
                'Computer Lab',
                `${college.code} Building B`,
                '2nd Floor',
                '30',
                '7:30 AM',
                '8:00 PM',
                'Available',
                'Good',
                'false',
                '30 workstations with high-speed campus fiber link',
            ],
            [
                `${college.code}-LAB01`,
                'IT Specialty Lab',
                'Laboratory',
                `${college.code} Building B`,
                '3rd Floor',
                '24',
                '8:00 AM',
                '6:00 PM',
                'Available',
                'Fair',
                'true',
                'Shared laboratory for networking & hardware experiments',
            ],
            [
                `${college.code}-ST01`,
                'Media Studio',
                'Studio',
                `${college.code} Building C`,
                'Ground Floor',
                '15',
                '8:00 AM',
                '5:00 PM',
                'Available',
                'Good',
                'false',
                'Acoustically treated multimedia and streaming studio',
            ],
        ];

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...sampleRows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${college.code}_Facilities_Import_Template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CSV File Selection & Parser
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCsvFileName(file.name);
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
            if (lines.length <= 1) {
                alert('The uploaded CSV file is empty or missing data rows.');
                return;
            }

            const headerLine = lines[0];
            const headers = headerLine.split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

            const existingCodes = new Set(facilities.map((f) => f.facility_code.toLowerCase()));
            const seenFileCodes = new Set<string>();

            const parsedRows: ParsedCsvFacilityRow[] = [];

            for (let i = 1; i < lines.length; i++) {
                // simple split supporting quotes
                const rowValues: string[] = [];
                let inQuote = false;
                let currentVal = '';

                for (let c = 0; c < lines[i].length; c++) {
                    const char = lines[i][c];
                    if (char === '"' || char === "'") {
                        inQuote = !inQuote;
                    } else if (char === ',' && !inQuote) {
                        rowValues.push(currentVal.trim());
                        currentVal = '';
                    } else {
                        currentVal += char;
                    }
                }
                rowValues.push(currentVal.trim());

                const rowData: Record<string, string> = {};
                headers.forEach((h, idx) => {
                    rowData[h] = rowValues[idx]?.replace(/^["']|["']$/g, '').trim() || '';
                });

                const code = rowData['facility_code'] || rowData['code'] || '';
                const name = rowData['facility_name'] || rowData['name'] || '';
                const type = rowData['facility_type'] || rowData['type'] || 'Classroom';
                const building = rowData['building'] || `${college.code} Main`;
                const floor = rowData['floor'] || 'Ground Floor';
                const capacity = parseInt(rowData['capacity'] || '40', 10) || 0;
                const opStart = rowData['operating_start'] || '7:00 AM';
                const opEnd = rowData['operating_end'] || '7:00 PM';
                const status = rowData['status'] || 'Available';
                const condition = rowData['condition'] || 'Good';
                const shared = rowData['shared'] === 'true' || rowData['shared'] === '1' || rowData['shared'] === 'yes';
                const notes = rowData['notes'] || '';

                let validationStatus: 'ready' | 'warning' | 'error' = 'ready';
                let validationMsg = 'Valid & ready to import';

                if (!code || !name) {
                    validationStatus = 'error';
                    validationMsg = 'Missing required Facility Code or Name';
                } else if (capacity <= 0 || isNaN(capacity)) {
                    validationStatus = 'warning';
                    validationMsg = 'Capacity is 0 or invalid (Scheduling engine requires capacity)';
                } else if (seenFileCodes.has(code.toLowerCase())) {
                    validationStatus = 'error';
                    validationMsg = `Duplicate facility code '${code}' in this file`;
                } else if (existingCodes.has(code.toLowerCase())) {
                    validationStatus = 'warning';
                    validationMsg = `Will update existing facility '${code}'`;
                }

                if (code) {
                    seenFileCodes.add(code.toLowerCase());
                }

                parsedRows.push({
                    row_num: i,
                    facility_code: code,
                    facility_name: name,
                    facility_type: type,
                    building,
                    floor,
                    capacity,
                    operating_start: opStart,
                    operating_end: opEnd,
                    status,
                    condition,
                    shared,
                    notes,
                    validation_status: validationStatus,
                    validation_message: validationMsg,
                });
            }

            setCsvRows(parsedRows);
            setIsImportModalOpen(true);
        };

        reader.readAsText(file);
    };

    // Update row cell in CSV preview
    const handleUpdateCsvCell = (
        rowIndex: number,
        field: keyof ParsedCsvFacilityRow,
        value: any
    ) => {
        setCsvRows((prev) => {
            const next = [...prev];
            const updated = { ...next[rowIndex], [field]: value };

            if (!updated.facility_code || !updated.facility_name) {
                updated.validation_status = 'error';
                updated.validation_message = 'Missing required Facility Code or Name';
            } else if (updated.capacity <= 0) {
                updated.validation_status = 'warning';
                updated.validation_message = 'Capacity must be greater than 0 for scheduling';
            } else {
                updated.validation_status = 'ready';
                updated.validation_message = 'Valid & ready to import';
            }

            next[rowIndex] = updated;
            return next;
        });
    };

    // Confirm Bulk CSV Import
    const handleConfirmImport = () => {
        const validRows = csvRows.filter((r) => r.validation_status !== 'error');
        if (validRows.length === 0) {
            alert('No valid facility rows to import. Please correct the errors in the preview table.');
            return;
        }

        setIsImporting(true);
        router.post(
            `/institution/colleges/${college.id}/facilities/bulk-import`,
            { rows: validRows },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsImportModalOpen(false);
                    setCsvRows([]);
                    setCsvFileName(null);
                    setIsImporting(false);
                },
                onError: (err) => {
                    alert('Failed to import facilities: ' + Object.values(err)[0]);
                    setIsImporting(false);
                },
            }
        );
    };

    // Confirm Copy from Templates
    const handleConfirmCopyTemplates = () => {
        if (selectedTemplateIds.length === 0) return;
        setIsCopyingTemplates(true);

        router.post(
            `/institution/colleges/${college.id}/facilities/copy-template`,
            { source_room_ids: selectedTemplateIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTemplateModalOpen(false);
                    setSelectedTemplateIds([]);
                    setIsCopyingTemplates(false);
                },
                onError: (err) => {
                    alert('Error copying facilities: ' + Object.values(err)[0]);
                    setIsCopyingTemplates(false);
                },
            }
        );
    };

    // Save Governance Delegation Settings
    const handleSaveSettings = () => {
        setIsSavingSettings(true);
        router.post(
            `/institution/colleges/${college.id}/facilities/settings`,
            {
                allow_admin_modify_facilities: allowAdminModifyFacilities,
                require_capacity_before_scheduling: requireCapacityBeforeScheduling,
                require_room_type_for_scheduling: requireRoomTypeForScheduling,
                allow_shared_facilities_across_colleges: allowSharedFacilitiesAcrossColleges,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSavingSettings(false);
                },
                onError: () => {
                    setIsSavingSettings(false);
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Header Stage Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs">
                <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] shrink-0 shadow-xs">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-extrabold text-[#17152E] dark:text-white">
                                Stage 6: Facilities Configuration
                            </h2>
                            <span className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-[#8B1E3F]/30">
                                Physical Baseline
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Register and manage the college’s physical and operational facilities such as classrooms, computer labs, laboratories, studios, and specialty rooms.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Stage Complete</span>
                    </div>
                </div>
            </div>

            {/* Metrics Ribbon (Mockup visual fidelity) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                {/* Total Facilities */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.total}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Total Facilities
                        </div>
                    </div>
                </div>

                {/* Classrooms */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.classrooms}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Classrooms
                        </div>
                    </div>
                </div>

                {/* Laboratories */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.labs}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Laboratories
                        </div>
                    </div>
                </div>

                {/* Computer Labs */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.computerLabs}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Computer Labs
                        </div>
                    </div>
                </div>

                {/* Studio / Specialty */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3 col-span-2 md:col-span-1">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Tv className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.studio}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Studio / Specialty
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs & Actions Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/60 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('registry')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'registry'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Facilities Registry ({facilities.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('import');
                            document.getElementById('facility-csv-upload-trigger')?.click();
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'import'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import & Bulk Setup</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('templates');
                            setIsTemplateModalOpen(true);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'templates'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Facility Templates</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('standards')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'standards'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Facility Types & Standards</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        id="facility-csv-upload-trigger"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCsvUpload}
                    />

                    <Button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        + Add Facility
                    </Button>
                </div>
            </div>

            {/* Standards Subtab */}
            {activeTab === 'standards' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div>
                            <h3 className="text-sm font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Inherited Institution Facility Types & Standards
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Established by Institution Super Admin. The College Admin can later extend these facility types if allowed in delegation settings.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-3 py-1 rounded-full border border-[#8B1E3F]/30">
                            Institutional Policy Enforced
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {INSTITUTION_STANDARDS.map((std, idx) => (
                            <div
                                key={idx}
                                className="p-3.5 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60 space-y-1.5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-[#17152E] dark:text-white">
                                        {std.type}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground bg-white dark:bg-[#1E1B38] px-2 py-0.5 rounded-md border border-border">
                                        Capacity: {std.standardCapacity}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">{std.specs}</p>
                                <div className="text-[10px] text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] font-medium pt-1">
                                    Source: {std.inheritedFrom}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Bar (Mockup exact style) */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search facility (name, code, or type)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-xs font-medium focus:ring-1 focus:ring-[#0B3A67] focus:outline-hidden"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Facility Type Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground">Facility Type:</span>
                        <select
                            value={selectedFacilityType}
                            onChange={(e) => setSelectedFacilityType(e.target.value)}
                            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer"
                        >
                            <option value="All Types">All Types</option>
                            <option value="Classroom">Classroom</option>
                            <option value="Computer Lab">Computer Lab</option>
                            <option value="Laboratory">Laboratory</option>
                            <option value="Studio">Studio</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Conference Room">Conference Room</option>
                            <option value="Simulation Room">Simulation Room</option>
                            <option value="Lecture Hall">Lecture Hall</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground">Status:</span>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer"
                        >
                            <option value="All Status">All Status</option>
                            <option value="Available">Available</option>
                            <option value="In Use">In Use</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Under Repair">Under Repair</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>

                    {/* Condition Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground">Condition:</span>
                        <select
                            value={selectedCondition}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer"
                        >
                            <option value="All Conditions">All Conditions</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Needs Repair">Needs Repair</option>
                            <option value="For Replacement">For Replacement</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Facilities Registry Table */}
            <div className="rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-bold">
                                <th className="p-3.5 pl-4 w-9">
                                    <input
                                        type="checkbox"
                                        checked={
                                            paginatedFacilities.length > 0 &&
                                            paginatedFacilities.every((f) => selectedFacilityIds.includes(f.id))
                                        }
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const ids = paginatedFacilities.map((f) => f.id);
                                                setSelectedFacilityIds(Array.from(new Set([...selectedFacilityIds, ...ids])));
                                            } else {
                                                const ids = new Set(paginatedFacilities.map((f) => f.id));
                                                setSelectedFacilityIds(selectedFacilityIds.filter((id) => !ids.has(id)));
                                            }
                                        }}
                                        className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67]"
                                    />
                                </th>
                                <th className="p-3.5 font-bold">Facility Code ⇅</th>
                                <th className="p-3.5 font-bold">Facility Name</th>
                                <th className="p-3.5 font-bold">Type</th>
                                <th className="p-3.5 font-bold">Capacity</th>
                                <th className="p-3.5 font-bold">Location / Building</th>
                                <th className="p-3.5 font-bold">Condition</th>
                                <th className="p-3.5 font-bold">Status</th>
                                <th className="p-3.5 font-bold text-center">Readiness</th>
                                <th className="p-3.5 pr-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {paginatedFacilities.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Building2 className="w-8 h-8 text-muted-foreground/50" />
                                            <p className="font-semibold text-xs">No facilities match your search criteria.</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleOpenAddModal}
                                                className="mt-1 text-xs font-bold rounded-xl"
                                            >
                                                + Add First Facility
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedFacilities.map((f) => {
                                    const isSelected = selectedFacilityIds.includes(f.id);

                                    // Type badge color
                                    let typeBadgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200';
                                    if (f.facility_type === 'Computer Lab') {
                                        typeBadgeClass = 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200';
                                    } else if (f.facility_type === 'Laboratory') {
                                        typeBadgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200';
                                    } else if (f.facility_type === 'Studio' || f.facility_type === 'Workshop') {
                                        typeBadgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200';
                                    }

                                    // Condition badge
                                    let conditionDot = 'bg-emerald-500';
                                    let conditionText = 'text-emerald-700 dark:text-emerald-400';
                                    if (f.condition === 'Fair') {
                                        conditionDot = 'bg-amber-500';
                                        conditionText = 'text-amber-700 dark:text-amber-400';
                                    } else if (f.condition === 'Needs Repair' || f.condition === 'For Replacement') {
                                        conditionDot = 'bg-rose-500';
                                        conditionText = 'text-rose-700 dark:text-rose-400';
                                    }

                                    return (
                                        <tr
                                            key={f.id}
                                            className="hover:bg-muted/20 transition-colors group text-foreground"
                                        >
                                            <td className="p-3.5 pl-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedFacilityIds([...selectedFacilityIds, f.id]);
                                                        } else {
                                                            setSelectedFacilityIds(selectedFacilityIds.filter((id) => id !== f.id));
                                                        }
                                                    }}
                                                    className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67]"
                                                />
                                            </td>

                                            {/* Code */}
                                            <td className="p-3.5 font-bold font-mono text-[11px] text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                                {f.facility_code}
                                            </td>

                                            {/* Name */}
                                            <td className="p-3.5 font-semibold text-[#17152E] dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1.5 rounded-lg bg-muted/60 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD]">
                                                        {f.facility_type === 'Computer Lab' ? (
                                                            <Monitor className="w-3.5 h-3.5" />
                                                        ) : f.facility_type === 'Laboratory' ? (
                                                            <FlaskConical className="w-3.5 h-3.5" />
                                                        ) : f.facility_type === 'Studio' ? (
                                                            <Tv className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Building2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </span>
                                                    <div>
                                                        <div>{f.facility_name}</div>
                                                        {f.is_shared && (
                                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                                <Share2 className="w-2.5 h-2.5" /> Shared Facility
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="p-3.5">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${typeBadgeClass}`}
                                                >
                                                    {f.custom_type || f.facility_type}
                                                </span>
                                            </td>

                                            {/* Capacity */}
                                            <td className="p-3.5 font-bold text-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3 h-3 text-muted-foreground" />
                                                    <span>{f.capacity}</span>
                                                </div>
                                            </td>

                                            {/* Building / Location */}
                                            <td className="p-3.5 text-muted-foreground text-[11px]">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                                    <span>{f.building} ({f.floor})</span>
                                                </div>
                                            </td>

                                            {/* Condition */}
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${conditionDot}`} />
                                                    <span className={`text-[11px] font-bold ${conditionText}`}>
                                                        {f.condition}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-3.5">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {f.status}
                                                </span>
                                            </td>

                                            {/* Readiness */}
                                            <td className="p-3.5 text-center">
                                                {f.setup_readiness === 'Ready' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                                                        <Check className="w-2.5 h-2.5" /> Ready
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-bold border border-amber-200">
                                                        <AlertCircle className="w-2.5 h-2.5" /> Incomplete
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3.5 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(f)}
                                                        title="Edit Facility"
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0B3A67] dark:text-[#93C5FD] hover:bg-[#F1F5F9] dark:hover:bg-[#262246] transition-colors cursor-pointer"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setFacilityToDelete(f)}
                                                        title="Remove Facility"
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls (matching mockup) */}
                <div className="p-3.5 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div>
                        Showing{' '}
                        <span className="font-bold text-foreground">
                            {filteredFacilities.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                            {Math.min(currentPage * itemsPerPage, filteredFacilities.length)}
                        </span>{' '}
                        of <span className="font-bold text-foreground">{filteredFacilities.length}</span> facilities
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentPage(idx + 1)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currentPage === idx + 1
                                        ? 'bg-[#0B3A67] text-white shadow-2xs'
                                        : 'text-foreground hover:bg-muted border border-transparent'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom 2-Column Section (Bulk Import Banner + Guidelines & Settings) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bulk Import Programs / Facilities (CSV) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] shrink-0">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                Bulk Import Facilities (CSV)
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Quickly add multiple physical rooms, classrooms, and specialized laboratories using a CSV file.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadTemplate}
                            className="text-xs font-bold rounded-xl cursor-pointer border-border hover:bg-muted/80"
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                            Download CSV Template
                        </Button>

                        <Button
                            type="button"
                            onClick={() => document.getElementById('facility-csv-upload-trigger')?.click()}
                            className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Import CSV
                        </Button>
                    </div>
                </div>

                {/* Import Guidelines & Operational Scope Disclaimer */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            <Info className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                            Import Guidelines & Operational Scope
                        </h4>
                    </div>

                    <ul className="text-xs space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                                <strong>Supported fields:</strong> facility_code, facility_name, facility_type, building, floor, capacity, operating_start, operating_end, status, condition, shared, notes.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                                <strong>Automated validation:</strong> Ascend validates duplicate codes, invalid capacities, unrecognized facility types, and malformed operating hours before importing.
                            </span>
                        </li>
                        <li className="flex items-start gap-2 text-[11px] text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 p-2 rounded-xl border border-[#8B1E3F]/30">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                                Detailed inventory items, maintenance ticketing, live occupancy, and utilization analytics are managed inside the College Admin’s Rooms & Laboratories module after onboarding.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Governance Delegation Settings Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD]">
                            <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                Facilities Governance & Scheduling Constraints
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                                Delegation policies and scheduling engine prerequisites for {college.code} facilities.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                        {isSavingSettings ? 'Saving...' : 'Save Facility Settings'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Toggle 1 */}
                    <div className="flex items-start justify-between p-3 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60">
                        <div className="space-y-0.5 pr-4">
                            <div className="font-bold text-[#17152E] dark:text-white">
                                Allow College Admin to modify facilities after activation
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Enables College Admin to add classrooms, update capacities, and edit capabilities.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={allowAdminModifyFacilities}
                            onChange={(e) => setAllowAdminModifyFacilities(e.target.checked)}
                            className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67] mt-1 cursor-pointer"
                        />
                    </div>

                    {/* Toggle 2 */}
                    <div className="flex items-start justify-between p-3 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60">
                        <div className="space-y-0.5 pr-4">
                            <div className="font-bold text-[#17152E] dark:text-white">
                                Require capacity before scheduling
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Prevents classes and exams from booking facilities with unconfigured capacity.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={requireCapacityBeforeScheduling}
                            onChange={(e) => setRequireCapacityBeforeScheduling(e.target.checked)}
                            className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67] mt-1 cursor-pointer"
                        />
                    </div>

                    {/* Toggle 3 */}
                    <div className="flex items-start justify-between p-3 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60">
                        <div className="space-y-0.5 pr-4">
                            <div className="font-bold text-[#17152E] dark:text-white">
                                Require room type for scheduling
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Mandatory type classification (e.g. Computer Lab vs Lecture) for automated conflict resolution.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={requireRoomTypeForScheduling}
                            onChange={(e) => setRequireRoomTypeForScheduling(e.target.checked)}
                            className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67] mt-1 cursor-pointer"
                        />
                    </div>

                    {/* Toggle 4 */}
                    <div className="flex items-start justify-between p-3 rounded-xl bg-[#F7F7FB] dark:bg-slate-800 border border-border/60">
                        <div className="space-y-0.5 pr-4">
                            <div className="font-bold text-[#17152E] dark:text-white">
                                Allow shared facilities across colleges
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Permits other colleges in the institution to request inter-unit scheduling into designated shared spaces.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={allowSharedFacilitiesAcrossColleges}
                            onChange={(e) => setAllowSharedFacilitiesAcrossColleges(e.target.checked)}
                            className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67] mt-1 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* ================= MODAL: ADD / EDIT FACILITY ================= */}
            <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            {editingFacility ? 'Edit Facility Baseline' : '+ Add Academic Facility'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Establish physical space parameters, room capabilities, and scheduling readiness for {college.code}.
                        </DialogDescription>
                    </DialogHeader>

                    {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSaveFacility} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* Facility Code */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">
                                    Facility Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. CIDS-CL01 or COM-1"
                                    value={facilityForm.facility_code}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, facility_code: e.target.value.toUpperCase() })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 font-mono font-bold focus:ring-1 focus:ring-[#0B3A67]"
                                    required
                                />
                            </div>

                            {/* Facility Name */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">
                                    Facility Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Classroom 101 or Computer Lab 1"
                                    value={facilityForm.facility_name}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, facility_name: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 font-semibold focus:ring-1 focus:ring-[#0B3A67]"
                                    required
                                />
                            </div>

                            {/* Facility Type */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Facility Type</label>
                                <select
                                    value={facilityForm.facility_type}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, facility_type: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 font-semibold focus:ring-1 focus:ring-[#0B3A67]"
                                >
                                    {STANDARD_FACILITY_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Type (if Other / Custom or specialty) */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">
                                    Specialized / Sub-Classification (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Cisco Networking Lab, Mock Court"
                                    value={facilityForm.custom_type}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, custom_type: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 focus:ring-1 focus:ring-[#0B3A67]"
                                />
                            </div>

                            {/* Building */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Building / Wing</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CIDS Building A"
                                    value={facilityForm.building}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, building: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 focus:ring-1 focus:ring-[#0B3A67]"
                                />
                            </div>

                            {/* Floor */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Floor / Level</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1st Floor, 2nd Floor"
                                    value={facilityForm.floor}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, floor: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 focus:ring-1 focus:ring-[#0B3A67]"
                                />
                            </div>

                            {/* Capacity */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">
                                    Seating / Student Capacity <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={1000}
                                    value={facilityForm.capacity}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, capacity: parseInt(e.target.value) || 0 })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 font-bold focus:ring-1 focus:ring-[#0B3A67]"
                                    required
                                />
                            </div>

                            {/* Operating Hours */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Operating Hours</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 7:00 AM - 7:00 PM"
                                    value={facilityForm.operating_hours}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, operating_hours: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 focus:ring-1 focus:ring-[#0B3A67]"
                                />
                            </div>

                            {/* Condition */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Physical Condition</label>
                                <select
                                    value={facilityForm.condition}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, condition: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 font-semibold focus:ring-1 focus:ring-[#0B3A67]"
                                >
                                    <option value="Good">Good (Operational standard)</option>
                                    <option value="Fair">Fair (Minor wear, usable)</option>
                                    <option value="Needs Repair">Needs Repair (Pending service)</option>
                                    <option value="For Replacement">For Replacement</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Operational Status</label>
                                <select
                                    value={facilityForm.status}
                                    onChange={(e) => setFacilityForm({ ...facilityForm, status: e.target.value })}
                                    className="w-full h-9 rounded-xl border border-border bg-background px-3 font-semibold focus:ring-1 focus:ring-[#0B3A67]"
                                >
                                    <option value="Available">Available (Open for booking)</option>
                                    <option value="In Use">In Use</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Under Repair">Under Repair</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        {/* Capabilities & Equipment Toggles */}
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-2.5">
                            <div className="font-extrabold text-[#17152E] dark:text-white flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                Facility Equipment & Capability Highlights
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={facilityForm.has_projector}
                                        onChange={(e) => setFacilityForm({ ...facilityForm, has_projector: e.target.checked })}
                                        className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD]"
                                    />
                                    <span className="font-semibold text-[11px]">Ceiling Projector</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={facilityForm.has_aircon}
                                        onChange={(e) => setFacilityForm({ ...facilityForm, has_aircon: e.target.checked })}
                                        className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD]"
                                    />
                                    <span className="font-semibold text-[11px]">Air Conditioned</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={facilityForm.is_accessible}
                                        onChange={(e) => setFacilityForm({ ...facilityForm, is_accessible: e.target.checked })}
                                        className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD]"
                                    />
                                    <span className="font-semibold text-[11px]">PWD Accessible</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={facilityForm.is_shared}
                                        onChange={(e) => setFacilityForm({ ...facilityForm, is_shared: e.target.checked })}
                                        className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD]"
                                    />
                                    <span className="font-semibold text-[11px]">Shared across Units</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">Workstations Count (if Lab)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={200}
                                        value={facilityForm.num_workstations}
                                        onChange={(e) => setFacilityForm({ ...facilityForm, num_workstations: parseInt(e.target.value) || 0 })}
                                        className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">Specialized Equipment Summary</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 40 Desktop PCs, 3D Printer, Audio Mixer"
                                        value={facilityForm.specialized_equipment}
                                        onChange={(e) => setFacilityForm({ ...facilityForm, specialized_equipment: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Operational Notes / Scheduling Guidance</label>
                            <textarea
                                rows={2}
                                placeholder="Add specific scheduling notes, maintenance reservations, or facility instructions..."
                                value={facilityForm.notes}
                                onChange={(e) => setFacilityForm({ ...facilityForm, notes: e.target.value })}
                                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:ring-1 focus:ring-[#0B3A67]"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddEditModalOpen(false)}
                                className="text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer"
                            >
                                {isSubmitting ? 'Saving...' : editingFacility ? 'Update Facility' : 'Save Facility'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL: CSV BULK IMPORT PREVIEW & EDIT ================= */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            Review & Validate Facilities CSV Import
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {csvFileName ? `File: ${csvFileName} — ` : ''}
                            Review parsed records, edit invalid cells inline, and confirm bulk insertion into {college.code}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="overflow-x-auto border border-border rounded-xl">
                            <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border font-bold text-muted-foreground">
                                        <th className="p-2 w-8">#</th>
                                        <th className="p-2">Code *</th>
                                        <th className="p-2">Name *</th>
                                        <th className="p-2">Type</th>
                                        <th className="p-2">Building</th>
                                        <th className="p-2">Floor</th>
                                        <th className="p-2">Capacity</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Validation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {csvRows.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            className={
                                                row.validation_status === 'error'
                                                    ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                                    : row.validation_status === 'warning'
                                                    ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                                    : 'hover:bg-muted/20'
                                            }
                                        >
                                            <td className="p-2 text-muted-foreground font-mono">{idx + 1}</td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.facility_code}
                                                    onChange={(e) => handleUpdateCsvCell(idx, 'facility_code', e.target.value.toUpperCase())}
                                                    className="w-24 h-7 rounded border border-border bg-background px-1.5 font-mono font-bold text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.facility_name}
                                                    onChange={(e) => handleUpdateCsvCell(idx, 'facility_name', e.target.value)}
                                                    className="w-36 h-7 rounded border border-border bg-background px-1.5 font-semibold text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.facility_type}
                                                    onChange={(e) => handleUpdateCsvCell(idx, 'facility_type', e.target.value)}
                                                    className="w-24 h-7 rounded border border-border bg-background px-1.5 text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.building}
                                                    onChange={(e) => handleUpdateCsvCell(idx, 'building', e.target.value)}
                                                    className="w-28 h-7 rounded border border-border bg-background px-1.5 text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.floor}
                                                    onChange={(e) => handleUpdateCsvCell(idx, 'floor', e.target.value)}
                                                    className="w-20 h-7 rounded border border-border bg-background px-1.5 text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={row.capacity}
                                                    onChange={(e) => handleUpdateCsvCell(idx, 'capacity', parseInt(e.target.value) || 0)}
                                                    className="w-16 h-7 rounded border border-border bg-background px-1.5 font-bold text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.status}
                                                    onChange={(e) => handleUpdateCsvCell(idx, 'status', e.target.value)}
                                                    className="w-20 h-7 rounded border border-border bg-background px-1.5 text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2">
                                                {row.validation_status === 'ready' && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Ready
                                                    </span>
                                                )}
                                                {row.validation_status === 'warning' && (
                                                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1" title={row.validation_message}>
                                                        <AlertCircle className="w-3 h-3" /> Warning
                                                    </span>
                                                )}
                                                {row.validation_status === 'error' && (
                                                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1" title={row.validation_message}>
                                                        <X className="w-3 h-3" /> Error
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsImportModalOpen(false)}
                            className="text-xs font-bold rounded-xl cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isImporting || csvRows.length === 0}
                            onClick={handleConfirmImport}
                            className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                            {isImporting ? 'Importing Facilities...' : `Confirm Import (${csvRows.length} facilities)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL: COPY TEMPLATES ================= */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                            <Copy className="w-5 h-5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            Copy Facility Blueprints from Existing Colleges
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Select standard room templates from other colleges or shared campus facilities to clone into {college.code}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {otherCollegesFacilities.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-xs">
                                No other facilities available in other colleges to copy.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto border border-border p-2 rounded-xl">
                                {otherCollegesFacilities.map((src) => {
                                    const isChecked = selectedTemplateIds.includes(src.id);
                                    return (
                                        <label
                                            key={src.id}
                                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                                isChecked
                                                    ? 'bg-[#F1F5F9] border-[#0B3A67]/20'
                                                    : 'bg-background border-border hover:bg-muted/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedTemplateIds([...selectedTemplateIds, src.id]);
                                                        } else {
                                                            setSelectedTemplateIds(selectedTemplateIds.filter((id) => id !== src.id));
                                                        }
                                                    }}
                                                    className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD]"
                                                />
                                                <div>
                                                    <div className="font-extrabold text-[#17152E] dark:text-white">
                                                        {src.facility_name} ({src.facility_code})
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {src.college_name || src.college_code} · {src.facility_type} · Capacity: {src.capacity}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-bold text-[#0B3A67] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                {src.facility_type}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTemplateModalOpen(false)}
                            className="text-xs font-bold rounded-xl cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isCopyingTemplates || selectedTemplateIds.length === 0}
                            onClick={handleConfirmCopyTemplates}
                            className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                            {isCopyingTemplates ? 'Copying...' : `Copy Selected (${selectedTemplateIds.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL: DELETE CONFIRMATION ================= */}
            <Dialog open={!!facilityToDelete} onOpenChange={(open) => !open && setFacilityToDelete(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-rose-600" />
                            Remove Facility
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Are you sure you want to remove{' '}
                            <strong className="text-foreground">
                                {facilityToDelete?.facility_code} ({facilityToDelete?.facility_name})
                            </strong>{' '}
                            from {college.code} onboarding baseline?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFacilityToDelete(null)}
                            className="text-xs font-bold rounded-xl cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                            {isDeleting ? 'Removing...' : 'Remove Facility'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

