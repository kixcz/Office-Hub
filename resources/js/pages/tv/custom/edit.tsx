import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { TvStudioLayout } from '@/components/tv-studio-layout';
import {
    FileText,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Eye,
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    Table,
    Columns,
    QrCode,
    Image as ImageIcon,
    List,
    Palette,
    Layers,
    Calendar,
    Clock,
    Tv,
    Maximize2,
    X,
    Save
} from 'lucide-react';
import {
    CustomContentSlideHero,
    CustomContentSlideData,
    ContentBlock,
    ManualTableColumn,
    ManualTableRow,
    CUSTOM_THEMES
} from '@/components/custom-slide-hero';

interface Device {
    id: number;
    name: string;
    device_code: string;
}

interface Props {
    slide: CustomContentSlideData;
    devices: Device[];
}

const PREDEFINED_LAYOUTS = [
    {
        id: 'title_table',
        name: 'Title + Manual Table',
        description: 'Ideal for weekly cleaning rosters, room assignment notices, and structured schedules.',
        icon: Table,
        color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
    },
    {
        id: 'bulletin',
        name: 'Office Bulletin Notice',
        description: 'Clean noticeboard for quick announcements, visitor rules, and highlighted bulletins.',
        icon: FileText,
        color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
        id: 'two_column',
        name: 'Two-Column Split',
        description: 'Side-by-side panels for split duty rosters, rules on one side and notes on the other.',
        icon: Columns,
        color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    },
    {
        id: 'qr_instructions',
        name: 'QR Code + Steps',
        description: 'Prominent scannable QR code hero with sequential instructions for registrations or feedback.',
        icon: QrCode,
        color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
    {
        id: 'image_text',
        name: 'Image + Text Panel',
        description: 'Custom photo or graphic on one side paired with structured text blocks.',
        icon: ImageIcon,
        color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    },
    {
        id: 'full_image',
        name: 'Full Image Poster',
        description: 'Full-bleed 16:9 poster graphic with floating TV caption bar.',
        icon: Maximize2,
        color: 'from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400',
    },
    {
        id: 'blank',
        name: 'Blank / Free Blocks',
        description: 'Flexible canvas to assemble text, callout boxes, and manual tables freely.',
        icon: Layers,
        color: 'from-slate-500/20 to-zinc-500/10 border-slate-500/30 text-slate-400',
    },
];

const THEME_OPTIONS = [
    { id: 'slate-clean', name: 'Slate Clean', bg: 'bg-slate-900 border-slate-700' },
    { id: 'navy-professional', name: 'Navy Professional', bg: 'bg-sky-950 border-sky-800' },
    { id: 'emerald-accent', name: 'Emerald Focus', bg: 'bg-emerald-950 border-emerald-800' },
    { id: 'amber-warm', name: 'Amber Notice', bg: 'bg-stone-900 border-amber-800' },
    { id: 'ruby-urgent', name: 'Ruby Urgent', bg: 'bg-rose-950 border-rose-800' },
    { id: 'dark-modern', name: 'Dark Monolith', bg: 'bg-zinc-950 border-zinc-800' },
];

export default function CustomSlideEdit({ slide, devices }: Props) {
    const breadcrumbs = [
        { title: 'TV Workspace', href: '/tv-config/dashboard' },
        { title: 'Custom Manual Slides', href: '/tv-config/custom' },
        { title: `Edit: ${slide.title}`, href: `/tv-config/custom/${slide.id}/edit` },
    ];

    const [activeTab, setActiveTab] = useState<'type' | 'blocks' | 'media' | 'design' | 'display'>('blocks');

    // Slide Core State
    const [title, setTitle] = useState(slide.title || '');
    const [subtitle, setSubtitle] = useState(slide.subtitle || '');
    const [badge, setBadge] = useState(slide.badge || '');
    const [layout, setLayout] = useState<CustomContentSlideData['layout']>(slide.layout || 'title_table');
    const [theme, setTheme] = useState(slide.theme || 'slate-clean');
    const [headerAlignment, setHeaderAlignment] = useState<'left' | 'center'>(slide.header_alignment || 'left');

    // Media & QR State
    const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
    const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(slide.primary_image_url || null);
    const [primaryImageFit, setPrimaryImageFit] = useState<'cover' | 'contain' | 'fill'>(slide.primary_image_fit || 'cover');
    const [qrUrl, setQrUrl] = useState(slide.qr_url || '');
    const [qrLabel, setQrLabel] = useState(slide.qr_label || 'Scan for complete guidelines');

    // Display & Schedule State
    const [durationSeconds, setDurationSeconds] = useState(slide.duration_seconds || 20);
    const [playlist, setPlaylist] = useState(slide.playlist || 'Main Entrance Displays');
    const [targetDisplayId, setTargetDisplayId] = useState(slide.target_display_id || 'all');
    const [priority, setPriority] = useState(slide.priority || 1);
    const [fullscreenTakeover, setFullscreenTakeover] = useState(!!slide.fullscreen_takeover);
    const [startAt, setStartAt] = useState(slide.start_at ? slide.start_at.slice(0, 16) : '');
    const [endAt, setEndAt] = useState(slide.end_at ? slide.end_at.slice(0, 16) : '');
    const [autoExpire, setAutoExpire] = useState(slide.auto_expire !== false);
    const [status, setStatus] = useState<'draft' | 'published'>((slide.status as any) || 'published');

    // Content Blocks State
    const [blocks, setBlocks] = useState<ContentBlock[]>(slide.content_blocks || []);

    const [showFullscreenModal, setShowFullscreenModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPrimaryImageFile(file);
            const url = URL.createObjectURL(file);
            setPrimaryImagePreview(url);
        }
    };

    // Block Handlers
    const addBlock = (type: ContentBlock['type']) => {
        const newId = `block_${type}_${Date.now()}`;
        let newBlock: ContentBlock;

        if (type === 'table') {
            newBlock = {
                id: newId,
                type: 'table',
                title: 'Schedule / Roster Table',
                tableData: {
                    columns: [
                        { id: 'col_1', label: 'Day / Area' },
                        { id: 'col_2', label: 'Assigned Personnel' },
                        { id: 'col_3', label: 'Status / Notes' },
                    ],
                    rows: [
                        { id: 'r_1', cells: { col_1: 'Monday', col_2: 'Team Lead A', col_3: 'Confirmed' } },
                        { id: 'r_2', cells: { col_1: 'Tuesday', col_2: 'Staff Member B', col_3: 'Pending' } },
                    ],
                    rowDensity: 'normal',
                },
                slot: layout === 'two_column' ? 'column1' : 'main',
            };
        } else if (type === 'bullet_list') {
            newBlock = {
                id: newId,
                type: 'bullet_list',
                title: 'Key Guidelines',
                bulletListData: {
                    items: ['Ensure safety standards', 'Keep venue clean', 'Report any concerns'],
                },
                slot: layout === 'two_column' ? 'column2' : 'main',
            };
        } else if (type === 'callout') {
            newBlock = {
                id: newId,
                type: 'callout',
                calloutData: {
                    title: 'Advisory',
                    content: 'Room reservation required 24 hours in advance.',
                    type: 'info',
                },
                slot: 'main',
            };
        } else if (type === 'text') {
            newBlock = {
                id: newId,
                type: 'text',
                content: 'Custom notice description goes here.',
                slot: 'main',
            };
        } else {
            newBlock = {
                id: newId,
                type: 'divider',
                slot: 'main',
            };
        }

        setBlocks([...blocks, newBlock]);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter((b) => b.id !== id));
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= blocks.length) return;
        const updated = [...blocks];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        setBlocks(updated);
    };

    const addTableColumn = (blockIndex: number) => {
        const block = blocks[blockIndex];
        if (!block.tableData) return;
        const newColId = `col_${Date.now()}`;
        const newCol: ManualTableColumn = { id: newColId, label: `Col ${block.tableData.columns.length + 1}` };
        const updatedColumns = [...block.tableData.columns, newCol];
        const updatedRows = (block.tableData.rows || []).map((row) => ({
            ...row,
            cells: { ...row.cells, [newColId]: '—' },
        }));
        const updatedBlocks = [...blocks];
        updatedBlocks[blockIndex] = {
            ...block,
            tableData: { ...block.tableData, columns: updatedColumns, rows: updatedRows },
        };
        setBlocks(updatedBlocks);
    };

    const addTableRow = (blockIndex: number) => {
        const block = blocks[blockIndex];
        if (!block.tableData) return;
        const newRowId = `row_${Date.now()}`;
        const cells: Record<string, string> = {};
        block.tableData.columns.forEach((c) => {
            cells[c.id] = 'New entry';
        });
        const newRow: ManualTableRow = { id: newRowId, cells };
        const updatedBlocks = [...blocks];
        updatedBlocks[blockIndex] = {
            ...block,
            tableData: { ...block.tableData, rows: [...(block.tableData.rows || []), newRow] },
        };
        setBlocks(updatedBlocks);
    };

    const updateTableCell = (blockIndex: number, rowId: string, colId: string, val: string) => {
        const block = blocks[blockIndex];
        if (!block.tableData) return;
        const updatedRows = block.tableData.rows.map((r) => {
            if (r.id === rowId) {
                return { ...r, cells: { ...r.cells, [colId]: val } };
            }
            return r;
        });
        const updatedBlocks = [...blocks];
        updatedBlocks[blockIndex] = {
            ...block,
            tableData: { ...block.tableData, rows: updatedRows },
        };
        setBlocks(updatedBlocks);
    };

    const toggleRowHighlight = (blockIndex: number, rowId: string) => {
        const block = blocks[blockIndex];
        if (!block.tableData) return;
        const updatedRows = block.tableData.rows.map((r) => {
            if (r.id === rowId) {
                return { ...r, isHighlighted: !r.isHighlighted };
            }
            return r;
        });
        const updatedBlocks = [...blocks];
        updatedBlocks[blockIndex] = {
            ...block,
            tableData: { ...block.tableData, rows: updatedRows },
        };
        setBlocks(updatedBlocks);
    };

    const removeTableRow = (blockIndex: number, rowIndex: number) => {
        const block = blocks[blockIndex];
        if (!block.tableData) return;
        const updatedRows = [...block.tableData.rows];
        updatedRows.splice(rowIndex, 1);
        const updatedBlocks = [...blocks];
        updatedBlocks[blockIndex] = {
            ...block,
            tableData: { ...block.tableData, rows: updatedRows },
        };
        setBlocks(updatedBlocks);
    };

    // Live preview object
    const liveSlide: CustomContentSlideData = {
        id: slide.id,
        title,
        subtitle,
        badge,
        layout,
        theme,
        header_alignment: headerAlignment,
        content_blocks: blocks,
        primary_image_path: primaryImagePreview,
        primary_image_fit: primaryImageFit,
        qr_url: qrUrl || (layout === 'qr_instructions' ? 'https://cids.institution.edu' : null),
        qr_label: qrLabel,
        duration_seconds: durationSeconds,
        playlist,
        priority,
        fullscreen_takeover: fullscreenTakeover,
        start_at: startAt || null,
        end_at: endAt || null,
        auto_expire: autoExpire,
        status,
        creator: slide.creator || { name: 'Admin' },
    };

    const handleSubmit = (finalStatus?: 'draft' | 'published') => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append('title', title);
        if (subtitle) formData.append('subtitle', subtitle);
        if (badge) formData.append('badge', badge);
        formData.append('layout', layout);
        formData.append('theme', theme);
        formData.append('header_alignment', headerAlignment);
        formData.append('duration_seconds', String(durationSeconds));
        formData.append('playlist', playlist);
        if (targetDisplayId) formData.append('target_display_id', targetDisplayId);
        formData.append('priority', String(priority));
        formData.append('fullscreen_takeover', fullscreenTakeover ? '1' : '0');
        if (startAt) formData.append('start_at', startAt);
        if (endAt) formData.append('end_at', endAt);
        formData.append('auto_expire', autoExpire ? '1' : '0');
        formData.append('status', finalStatus || status);

        if (primaryImageFile) {
            formData.append('primary_image', primaryImageFile);
        }
        formData.append('primary_image_fit', primaryImageFit);
        if (qrUrl) formData.append('qr_url', qrUrl);
        if (qrLabel) formData.append('qr_label', qrLabel);

        formData.append('content_blocks', JSON.stringify(blocks));

        router.post(`/tv-config/custom/${slide.id}`, formData as any, {
            forceFormData: true,
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <TvStudioLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${slide.title} - Custom Manual Slide`} />

            <div className="space-y-6 pb-20">
                {/* Header Back Bar */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/tv-config/custom"
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Editing Manual Slide #{slide.id}</span>
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-1">
                                {title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleSubmit('draft')}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                        >
                            Save Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit('published')}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Update Slide</span>
                        </button>
                    </div>
                </div>

                {/* Main Two-Column Workspace: 60% Form & 40% Sticky Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Form & Step Tabs (60%) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Sticky Step Navigation */}
                        <div className="sticky top-[80px] z-30 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1.5 shadow-xl">
                            <nav className="flex items-center gap-1 overflow-x-auto text-xs font-bold">
                                {[
                                    { id: 'type', label: '1. Layout & Header', icon: Layers },
                                    { id: 'blocks', label: '2. Content Blocks', icon: Table },
                                    { id: 'media', label: '3. Media & QR', icon: ImageIcon },
                                    { id: 'design', label: '4. Design & Style', icon: Palette },
                                    { id: 'display', label: '5. Display & Rotation', icon: Clock },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                                                isActive
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Step 1: Layout & Core Header */}
                        {activeTab === 'type' && (
                            <div className="space-y-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-indigo-400" />
                                        <span>Predefined Slide Layout</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Switch the structural arrangement while preserving your manually entered data.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {PREDEFINED_LAYOUTS.map((lo) => {
                                        const Icon = lo.icon;
                                        const isSelected = layout === lo.id;
                                        return (
                                            <div
                                                key={lo.id}
                                                onClick={() => setLayout(lo.id as any)}
                                                className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-gradient-to-br ' + lo.color + ' ring-2 ring-indigo-500 shadow-lg'
                                                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="font-bold text-sm text-white">{lo.name}</div>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                                    {lo.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-800">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                            Slide Title (Headline) <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                Header Category Badge
                                            </label>
                                            <input
                                                type="text"
                                                value={badge}
                                                onChange={(e) => setBadge(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                Header Subtitle / Department
                                            </label>
                                            <input
                                                type="text"
                                                value={subtitle}
                                                onChange={(e) => setSubtitle(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Content Blocks Manager */}
                        {activeTab === 'blocks' && (
                            <div className="space-y-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                                            <Table className="w-4 h-4 text-indigo-400" />
                                            <span>Manual Content Blocks</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Manage your tables, lists, and callout advisories.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => addBlock('table')}
                                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-[11px] border border-blue-500/30 transition-colors flex items-center gap-1"
                                        >
                                            <Table className="w-3 h-3" />
                                            <span>+ Table</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addBlock('bullet_list')}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition-colors flex items-center gap-1"
                                        >
                                            <List className="w-3 h-3" />
                                            <span>+ List</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addBlock('callout')}
                                            className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-bold text-[11px] border border-amber-500/30 transition-colors flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3" />
                                            <span>+ Callout</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addBlock('text')}
                                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors flex items-center gap-1"
                                        >
                                            <FileText className="w-3 h-3" />
                                            <span>+ Text</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {blocks.map((block, idx) => (
                                        <div
                                            key={block.id}
                                            className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-400">#{idx + 1}</span>
                                                    <span className="font-bold uppercase tracking-wider text-indigo-400">
                                                        {block.type.replace('_', ' ')}
                                                    </span>
                                                    {layout === 'two_column' && (
                                                        <select
                                                            value={block.slot || 'column1'}
                                                            onChange={(e) => {
                                                                const updated = [...blocks];
                                                                updated[idx].slot = e.target.value as any;
                                                                setBlocks(updated);
                                                            }}
                                                            className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-0.5"
                                                        >
                                                            <option value="column1">Left Column</option>
                                                            <option value="column2">Right Column</option>
                                                        </select>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                                                    >
                                                        <MoveUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(idx, 'down')}
                                                        disabled={idx === blocks.length - 1}
                                                        className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                                                    >
                                                        <MoveDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBlock(block.id)}
                                                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {block.type === 'table' && block.tableData && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <input
                                                            type="text"
                                                            value={block.title || ''}
                                                            onChange={(e) => {
                                                                const updated = [...blocks];
                                                                updated[idx].title = e.target.value;
                                                                setBlocks(updated);
                                                            }}
                                                            placeholder="Table Title"
                                                            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-bold w-64"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => addTableColumn(idx)}
                                                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                                                            >
                                                                + Add Column
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => addTableRow(idx)}
                                                                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold"
                                                            >
                                                                + Add Row
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto border border-slate-800 rounded-lg">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-slate-900 border-b border-slate-800">
                                                                <tr>
                                                                    {block.tableData.columns.map((col, cIdx) => (
                                                                        <th key={col.id} className="p-2 text-left">
                                                                            <input
                                                                                type="text"
                                                                                value={col.label}
                                                                                onChange={(e) => {
                                                                                    const updated = [...blocks];
                                                                                    updated[idx].tableData!.columns[cIdx].label = e.target.value;
                                                                                    setBlocks(updated);
                                                                                }}
                                                                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-bold text-slate-200 w-full"
                                                                            />
                                                                        </th>
                                                                    ))}
                                                                    <th className="p-2 w-16 text-center text-slate-500">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-800">
                                                                {block.tableData.rows.map((row, rIdx) => (
                                                                    <tr key={row.id} className={row.isHighlighted ? 'bg-indigo-950/20' : ''}>
                                                                        {block.tableData!.columns.map((col) => (
                                                                            <td key={col.id} className="p-1.5">
                                                                                <input
                                                                                    type="text"
                                                                                    value={row.cells[col.id] || ''}
                                                                                    onChange={(e) => updateTableCell(idx, row.id, col.id, e.target.value)}
                                                                                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white w-full outline-none focus:border-indigo-500"
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                        <td className="p-1.5 text-center">
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleRowHighlight(idx, row.id)}
                                                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                                        row.isHighlighted
                                                                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                                                                            : 'text-slate-500 hover:text-slate-300'
                                                                                    }`}
                                                                                >
                                                                                    ★
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeTableRow(idx, rIdx)}
                                                                                    className="text-slate-500 hover:text-rose-400 p-1"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {block.type === 'callout' && (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            value={block.calloutData?.title || ''}
                                                            onChange={(e) => {
                                                                const updated = [...blocks];
                                                                updated[idx].calloutData = { ...updated[idx].calloutData, title: e.target.value, content: updated[idx].calloutData?.content || '' };
                                                                setBlocks(updated);
                                                            }}
                                                            placeholder="Callout Header"
                                                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                                                        />
                                                        <select
                                                            value={block.calloutData?.type || 'info'}
                                                            onChange={(e) => {
                                                                const updated = [...blocks];
                                                                updated[idx].calloutData = { ...updated[idx].calloutData, type: e.target.value as any, content: updated[idx].calloutData?.content || '' };
                                                                setBlocks(updated);
                                                            }}
                                                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                                                        >
                                                            <option value="info">Info (Blue)</option>
                                                            <option value="warning">Warning / Alert (Amber)</option>
                                                            <option value="urgent">Urgent Notice (Rose)</option>
                                                            <option value="success">Success / Ready (Emerald)</option>
                                                        </select>
                                                    </div>
                                                    <textarea
                                                        value={block.calloutData?.content || ''}
                                                        onChange={(e) => {
                                                            const updated = [...blocks];
                                                            updated[idx].calloutData = { ...updated[idx].calloutData, content: e.target.value };
                                                            setBlocks(updated);
                                                        }}
                                                        rows={2}
                                                        placeholder="Enter callout message..."
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            )}

                                            {(block.type === 'bullet_list' || block.type === 'numbered_list') && (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value={block.title || ''}
                                                        onChange={(e) => {
                                                            const updated = [...blocks];
                                                            updated[idx].title = e.target.value;
                                                            setBlocks(updated);
                                                        }}
                                                        placeholder="List Header"
                                                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold w-64"
                                                    />
                                                    <textarea
                                                        value={
                                                            block.type === 'bullet_list'
                                                                ? (block.bulletListData?.items || []).join('\n')
                                                                : (block.numberedListData?.items || []).join('\n')
                                                        }
                                                        onChange={(e) => {
                                                            const lines = e.target.value.split('\n');
                                                            const updated = [...blocks];
                                                            if (block.type === 'bullet_list') {
                                                                updated[idx].bulletListData = { items: lines };
                                                            } else {
                                                                updated[idx].numberedListData = { items: lines };
                                                            }
                                                            setBlocks(updated);
                                                        }}
                                                        rows={3}
                                                        placeholder="One item per line..."
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'text' && (
                                                <textarea
                                                    value={block.content || ''}
                                                    onChange={(e) => {
                                                        const updated = [...blocks];
                                                        updated[idx].content = e.target.value;
                                                        setBlocks(updated);
                                                    }}
                                                    rows={3}
                                                    placeholder="Enter descriptive text..."
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Media & QR Code */}
                        {activeTab === 'media' && (
                            <div className="space-y-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-indigo-400" />
                                        <span>Poster Media & Interactive QR</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Update graphic poster or scannable smartphone QR link.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Primary Graphic / Poster Image
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="relative w-40 h-24 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                            {primaryImagePreview ? (
                                                <img
                                                    src={primaryImagePreview}
                                                    alt="Preview"
                                                    className={`w-full h-full ${primaryImageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                                                />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-slate-600" />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                                            />
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[11px] text-slate-400">Fit Mode:</span>
                                                {(['cover', 'contain', 'fill'] as const).map((mode) => (
                                                    <button
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => setPrimaryImageFit(mode)}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            primaryImageFit === mode
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-slate-800 text-slate-400'
                                                        }`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Scan-to-Action QR Code
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] text-slate-400 mb-1">Target URL</label>
                                            <input
                                                type="text"
                                                value={qrUrl}
                                                onChange={(e) => setQrUrl(e.target.value)}
                                                placeholder="https://forms.institution.edu/duty-report"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-slate-400 mb-1">QR Label</label>
                                            <input
                                                type="text"
                                                value={qrLabel}
                                                onChange={(e) => setQrLabel(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Design & Style */}
                        {activeTab === 'design' && (
                            <div className="space-y-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-indigo-400" />
                                        <span>Color Theme & Layout Options</span>
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {THEME_OPTIONS.map((th) => {
                                        const isSelected = theme === th.id;
                                        return (
                                            <div
                                                key={th.id}
                                                onClick={() => setTheme(th.id)}
                                                className={`cursor-pointer p-3.5 rounded-xl border text-left transition-all ${
                                                    isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:border-slate-700'
                                                } ${th.bg}`}
                                            >
                                                <div className="font-bold text-xs text-white">{th.name}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">Preset Tokens</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-4 border-t border-slate-800">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Header Alignment
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setHeaderAlignment('left')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold ${
                                                headerAlignment === 'left'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Left Aligned
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setHeaderAlignment('center')}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold ${
                                                headerAlignment === 'center'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Centered
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Display Behavior */}
                        {activeTab === 'display' && (
                            <div className="space-y-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-400" />
                                        <span>Display Duration & Expiration Rules</span>
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                            Display Duration (Seconds)
                                        </label>
                                        <input
                                            type="number"
                                            min={5}
                                            max={120}
                                            value={durationSeconds}
                                            onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10) || 20)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                            Target TV Playlist
                                        </label>
                                        <select
                                            value={playlist}
                                            onChange={(e) => setPlaylist(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300"
                                        >
                                            <option value="Main Entrance Displays">Main Entrance Displays</option>
                                            <option value="Faculty Lounge TV">Faculty Lounge TV</option>
                                            <option value="Dean's Hallway">Dean's Hallway</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-sm text-white flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-amber-400" />
                                                <span>Auto-Expiration Safeguard</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Automatically disappear from TV when end date passes.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={autoExpire}
                                            onChange={(e) => setAutoExpire(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                                        <div>
                                            <label className="block text-[11px] text-slate-400 mb-1">Start Display Date/Time</label>
                                            <input
                                                type="datetime-local"
                                                value={startAt}
                                                onChange={(e) => setStartAt(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-slate-400 mb-1">End / Expiration Date/Time</label>
                                            <input
                                                type="datetime-local"
                                                value={endAt}
                                                onChange={(e) => setEndAt(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-sm text-white">Featured Fullscreen Takeover</div>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Prominently interrupts normal playlist for urgent notices.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={fullscreenTakeover}
                                            onChange={(e) => setFullscreenTakeover(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sticky Live 16:9 Preview (40%) */}
                    <div className="lg:col-span-5 sticky top-[80px] space-y-4">
                        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl backdrop-blur-md space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Live 16:9 TV Preview</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFullscreenModal(true)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>Fullscreen QA</span>
                                </button>
                            </div>

                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                                <CustomContentSlideHero slide={liveSlide} isPreview={true} />
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800 text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Live edits synchronizing</span>
                                </div>
                                <span>{durationSeconds}s TV rotation</span>
                            </div>

                            <div className="pt-2 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('draft')}
                                    disabled={isSaving}
                                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                                >
                                    Save Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('published')}
                                    disabled={isSaving}
                                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                                >
                                    Update Slide
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Fullscreen 16:9 QA Preview */}
            {showFullscreenModal && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in">
                    <div className="relative w-full max-w-6xl flex flex-col gap-4">
                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-bold text-lg">{title}</h3>
                            </div>
                            <button
                                onClick={() => setShowFullscreenModal(false)}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl">
                            <CustomContentSlideHero slide={liveSlide} isPreview={false} />
                        </div>
                    </div>
                </div>
            )}
        </TvStudioLayout>
    );
}
