import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Layers,
    Shield,
    Sliders,
    AlertTriangle,
    CheckCircle2,
    Info,
    Search,
    ChevronDown,
    ChevronRight,
    X,
    Check,
    Lock,
    Unlock,
    HelpCircle,
    ArrowRight,
    Sparkles,
    Calendar,
    BookOpen,
    Users,
    Building2,
    ClipboardCheck,
    FlaskConical,
    Tv,
    Bot,
    FolderKanban,
    Award,
    FileText,
    Settings,
    MoreHorizontal,
    Wrench,
    Clock,
    RefreshCw,
    Download,
    Eye,
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

export interface CatalogModule {
    id: string;
    name: string;
    category: string;
    short_purpose: string;
    purpose_details: string;
    key_features: string[];
    is_required: boolean;
    dependencies: string[];
    dependency_labels: string[];
    available_roles: string[];
    access_matrix: Record<string, string>;
    institution_policy: string;
    can_college_admin_disable: boolean;
    global_enabled?: boolean;
}

interface Props {
    college: {
        id: number;
        name: string;
        code: string;
        enabled_modules?: Record<string, boolean> | null;
        inheritance_settings?: Record<string, any> | null;
    };
    modulesCatalog: CatalogModule[];
}

export default function ModulesConfigurationStage({ college, modulesCatalog = [] }: Props) {
    // Enabled modules dictionary
    const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = { ...(college.enabled_modules || {}) };
        // Ensure required modules default to true if unassigned
        modulesCatalog.forEach((m) => {
            if (m.is_required && initial[m.id] === undefined) {
                initial[m.id] = true;
            }
        });
        return initial;
    });

    // Governance settings
    const [allowAdminConfigureOptional, setAllowAdminConfigureOptional] = useState<boolean>(
        college.inheritance_settings?.allow_admin_configure_optional ?? true
    );
    const [allowAdminDisableRequired, setAllowAdminDisableRequired] = useState<boolean>(
        college.inheritance_settings?.allow_admin_disable_required ?? false
    );
    const [isSaving, setIsSaving] = useState(false);

    // Selected tab: catalog | category | dependencies | policies
    const [activeTab, setActiveTab] = useState<'catalog' | 'category' | 'dependencies' | 'policies'>('catalog');

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Domains');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Modules');

    // Selected module for drawer
    const [selectedModule, setSelectedModule] = useState<CatalogModule | null>(() => {
        return modulesCatalog.find((m) => m.id === 'scheduling') || modulesCatalog[0] || null;
    });

    // Category accordion expansion
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Academic Operations': true,
        'Faculty & Workforce': false,
        'Facilities & Resources': false,
        'Compliance & Quality': false,
        'Research, Extension & Engagement': false,
        'Reports & Analytics': false,
        'TV & Communications': false,
        'AI & Automation': false,
    });

    // Group modules by Category
    const categories = useMemo(() => {
        const set = new Set<string>();
        modulesCatalog.forEach((m) => set.add(m.category));
        return Array.from(set);
    }, [modulesCatalog]);

    const modulesByCategory = useMemo(() => {
        const groups: Record<string, CatalogModule[]> = {};
        categories.forEach((cat) => {
            groups[cat] = modulesCatalog.filter((m) => m.category === cat);
        });
        return groups;
    }, [modulesCatalog, categories]);

    // Compute Metrics Ribbon
    const metrics = useMemo(() => {
        const total = modulesCatalog.length;
        const required = modulesCatalog.filter((m) => m.is_required).length;
        const enabled = modulesCatalog.filter((m) => !!enabledModules[m.id]).length;
        const optional = total - required;

        // Check dependency issues: an enabled module whose dependencies are not all enabled
        let dependencyIssuesCount = 0;
        modulesCatalog.forEach((m) => {
            if (enabledModules[m.id]) {
                const missingDep = m.dependencies.some((depId) => {
                    const depModule = modulesCatalog.find((cat) => cat.id === depId);
                    // If dependency is a registered module, check if enabled
                    if (depModule && !enabledModules[depModule.id]) {
                        return true;
                    }
                    return false;
                });
                if (missingDep) {
                    dependencyIssuesCount++;
                }
            }
        });

        return {
            total,
            required,
            enabled,
            optional,
            dependencyIssues: dependencyIssuesCount,
        };
    }, [modulesCatalog, enabledModules]);

    // Toggle a module state
    const handleToggleModule = (mod: CatalogModule) => {
        if (mod.is_required && !allowAdminDisableRequired) {
            // Cannot disable institution required module
            return;
        }

        const willEnable = !enabledModules[mod.id];

        // If enabling, check if dependencies need auto-enabling
        if (willEnable) {
            const next = { ...enabledModules, [mod.id]: true };
            // Auto-enable any direct module dependencies
            mod.dependencies.forEach((depId) => {
                if (modulesCatalog.some((m) => m.id === depId)) {
                    next[depId] = true;
                }
            });
            setEnabledModules(next);
        } else {
            // Disabling
            setEnabledModules({ ...enabledModules, [mod.id]: false });
        }
    };

    // Auto-resolve all dependency issues
    const handleResolveDependencies = () => {
        const next = { ...enabledModules };
        modulesCatalog.forEach((m) => {
            if (next[m.id]) {
                m.dependencies.forEach((depId) => {
                    if (modulesCatalog.some((mod) => mod.id === depId)) {
                        next[depId] = true;
                    }
                });
            }
        });
        setEnabledModules(next);
    };

    // Save All Modules Configuration
    const handleSaveModules = () => {
        setIsSaving(true);
        router.post(
            `/institution/colleges/${college.id}/modules/update`,
            {
                enabled_modules: enabledModules,
                allow_admin_configure_optional: allowAdminConfigureOptional,
                allow_admin_disable_required: allowAdminDisableRequired,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                },
                onError: (err) => {
                    alert('Error saving module configuration: ' + Object.values(err)[0]);
                    setIsSaving(false);
                },
            }
        );
    };

    // Apply bundle template
    const handleApplyTemplate = (key: string) => {
        if (!confirm(`Apply the '${key.replace('_', ' ').toUpperCase()}' module template to ${college.code}?`)) {
            return;
        }

        router.post(
            `/institution/colleges/${college.id}/modules/apply-template`,
            { template_key: key },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Page reloads with fresh props
                },
            }
        );
    };

    // Filter modules for Catalog & Category tabs
    const filteredModules = useMemo(() => {
        return modulesCatalog.filter((m) => {
            const matchesSearch =
                searchQuery === '' ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.short_purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.category.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategoryFilter === 'All Domains' || m.category === selectedCategoryFilter;

            const isEnabled = !!enabledModules[m.id];
            let matchesStatus = true;
            if (selectedStatusFilter === 'Enabled') {
                matchesStatus = isEnabled;
            } else if (selectedStatusFilter === 'Required') {
                matchesStatus = m.is_required;
            } else if (selectedStatusFilter === 'Disabled') {
                matchesStatus = !isEnabled;
            }

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [modulesCatalog, searchQuery, selectedCategoryFilter, selectedStatusFilter, enabledModules]);

    // Get Icon for Category
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Academic Operations':
                return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
            case 'Faculty & Workforce':
                return <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
            case 'Facilities & Resources':
                return <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
            case 'Compliance & Quality':
                return <ClipboardCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
            case 'Research, Extension & Engagement':
                return <FlaskConical className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
            case 'Reports & Analytics':
                return <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
            case 'TV & Communications':
                return <Tv className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
            case 'AI & Automation':
                return <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
            default:
                return <Layers className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stage Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs">
                <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] shrink-0 shadow-xs">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-extrabold text-[#17152E] dark:text-white">
                                Stage 3: Modules Configuration
                            </h2>
                            <span className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-[#8B1E3F]/30">
                                Capability Governance
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Select and configure the Velora capabilities for {college.code}. Enable required modules, choose optional ones, and manage access policies.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                    <div className="relative group">
                        <Button
                            type="button"
                            variant="outline"
                            className="text-xs font-bold rounded-xl border-border hover:bg-muted/80 flex items-center gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                            <span>Module Templates</span>
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#1E1B38] border border-border rounded-xl shadow-lg p-1.5 hidden group-hover:block z-30 space-y-1">
                            <button
                                type="button"
                                onClick={() => handleApplyTemplate('full_tech')}
                                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-muted/80 flex items-center justify-between cursor-pointer"
                            >
                                <span>Full Technology College</span>
                                <span className="text-[10px] text-muted-foreground">All Tools</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyTemplate('standard_academic')}
                                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-muted/80 flex items-center justify-between cursor-pointer"
                            >
                                <span>Standard Academic Unit</span>
                                <span className="text-[10px] text-muted-foreground">Recommended</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyTemplate('minimal_lecture')}
                                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-muted/80 flex items-center justify-between cursor-pointer"
                            >
                                <span>Minimal Lecture College</span>
                                <span className="text-[10px] text-muted-foreground">Core Only</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyTemplate('research_focused')}
                                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-muted/80 flex items-center justify-between cursor-pointer"
                            >
                                <span>Research & Engagement</span>
                                <span className="text-[10px] text-muted-foreground">R&D Stack</span>
                            </button>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleSaveModules}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] hover:from-[#082847] hover:to-[#0B3A67] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </div>

            {/* Metrics Ribbon (Mockup visual fidelity) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                {/* Enabled Modules */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.enabled}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Enabled Modules
                        </div>
                    </div>
                </div>

                {/* Required (Institution) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.required}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Required (Institution)
                        </div>
                    </div>
                </div>

                {/* Optional */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.optional}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Optional
                        </div>
                    </div>
                </div>

                {/* Dependency Issues */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3">
                    <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            metrics.dependencyIssues > 0
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div
                            className={`text-xl font-extrabold leading-tight ${
                                metrics.dependencyIssues > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                            }`}
                        >
                            {metrics.dependencyIssues}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Dependency Issues
                        </div>
                    </div>
                </div>

                {/* Total Modules */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/70 shadow-xs flex items-center gap-3 col-span-2 md:col-span-1">
                    <div className="w-11 h-11 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-extrabold text-[#17152E] dark:text-white leading-tight">
                            {metrics.total}
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                            Total Modules
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/60 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('catalog')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'catalog'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Module Catalog</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('category')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'category'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span>By Category</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('dependencies')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'dependencies'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Dependencies</span>
                        {metrics.dependencyIssues > 0 && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('policies')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'policies'
                                ? 'bg-gradient-to-r from-[#0B3A67] to-[#1F5D9B] text-white shadow-2xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Access Policies</span>
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search modules (e.g., attendance, scheduling...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-border bg-background text-xs font-medium focus:ring-1 focus:ring-[#0B3A67] focus:outline-hidden"
                        />
                    </div>

                    <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="h-8 rounded-xl border border-border bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer"
                    >
                        <option value="All Modules">All Modules</option>
                        <option value="Enabled">Enabled Only</option>
                        <option value="Required">Required Only</option>
                        <option value="Disabled">Disabled Only</option>
                    </select>
                </div>
            </div>

            {/* TAB 1: MODULE CATALOG (Split View with Module Details Drawer matching Image Mockup) */}
            {activeTab === 'catalog' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Accordion Column (8 Cols) */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
                        {categories.map((cat) => {
                            const catModules = modulesByCategory[cat] || [];
                            const enabledInCat = catModules.filter((m) => !!enabledModules[m.id]).length;
                            const isExpanded = !!expandedCategories[cat];
                            const allRequiredEnabled = catModules
                                .filter((m) => m.is_required)
                                .every((m) => !!enabledModules[m.id]);

                            return (
                                <div
                                    key={cat}
                                    className="rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs overflow-hidden"
                                >
                                    {/* Category Header */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedCategories({
                                                ...expandedCategories,
                                                [cat]: !isExpanded,
                                            })
                                        }
                                        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-muted/60">
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-extrabold text-[#17152E] dark:text-white">
                                                    {cat}{' '}
                                                    <span className="text-muted-foreground font-medium">
                                                        ({enabledInCat}/{catModules.length} enabled)
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            {allRequiredEnabled ? (
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                    <Check className="w-2.5 h-2.5" /> All Required Enabled
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                                    <AlertTriangle className="w-2.5 h-2.5" /> Required Missing
                                                </span>
                                            )}

                                            <ChevronDown
                                                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                                    isExpanded ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </div>
                                    </button>

                                    {/* Category Module Cards Grid */}
                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-border/60">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                                                {catModules.map((mod) => {
                                                    const isEnabled = !!enabledModules[mod.id];
                                                    const isSelected = selectedModule?.id === mod.id;

                                                    return (
                                                        <div
                                                            key={mod.id}
                                                            onClick={() => setSelectedModule(mod)}
                                                            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                                                                isSelected
                                                                    ? 'ring-2 ring-[#7C3AED] border-transparent bg-[#F1F5F9] dark:bg-slate-800'
                                                                    : isEnabled
                                                                    ? 'border-border/80 bg-white dark:bg-[#1E1B38] hover:border-[#0B3A67]/20'
                                                                    : 'border-border/50 bg-muted/20 opacity-80 hover:opacity-100'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className="p-1.5 rounded-lg bg-muted/60 text-[#0B3A67] dark:text-[#93C5FD] mt-0.5">
                                                                        {getCategoryIcon(mod.category)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-extrabold text-xs text-[#17152E] dark:text-white">
                                                                                {mod.name}
                                                                            </span>
                                                                            {mod.is_required && (
                                                                                <span className="text-[9px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-1.5 py-0.2 rounded-full border border-[#8B1E3F]/30">
                                                                                    Required
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[10px] mt-0.5">
                                                                            {isEnabled ? (
                                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                                    Enabled
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground font-medium flex items-center gap-1">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                                                    Disabled
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Module Toggle Switch */}
                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleModule(mod);
                                                                    }}
                                                                    className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                                                                        isEnabled
                                                                            ? 'bg-[#10B981]'
                                                                            : 'bg-muted-foreground/30'
                                                                    }`}
                                                                >
                                                                    <div
                                                                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                                        }`}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                                                                {mod.short_purpose}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Details Drawer (4 Cols - matching UI Mockup) */}
                    <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
                        {selectedModule ? (
                            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD]">
                                            {getCategoryIcon(selectedModule.category)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                                    {selectedModule.name}
                                                </h4>
                                                {selectedModule.is_required && (
                                                    <span className="text-[9px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-1.5 py-0.2 rounded-full border border-[#8B1E3F]/30">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px]">
                                                {enabledModules[selectedModule.id] ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedModule(null)}
                                        className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Purpose */}
                                <div className="space-y-1">
                                    <div className="text-[11px] font-bold text-[#17152E] dark:text-white flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                        Purpose
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {selectedModule.purpose_details}
                                    </p>
                                </div>

                                {/* Key Features */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] font-bold text-[#17152E] dark:text-white flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                        Key Capabilities
                                    </div>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        {selectedModule.key_features.map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-1.5">
                                                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Dependencies */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] font-bold text-[#17152E] dark:text-white flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                        Prerequisite Dependencies
                                    </div>
                                    {selectedModule.dependency_labels.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">
                                            No prerequisites. This is an independent core module.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedModule.dependency_labels.map((dep, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-foreground border border-border"
                                                >
                                                    ✓ {dep}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Available Roles */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] font-bold text-[#17152E] dark:text-white flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                                        Authorized Operational Roles
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedModule.available_roles.map((r, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 rounded-lg bg-[#F1F5F9] dark:bg-slate-800 text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] text-[10px] font-bold border border-[#8B1E3F]/30"
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Institution Policy Note */}
                                <div className="p-3 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 border border-[#8B1E3F]/30 space-y-1 text-xs">
                                    <div className="font-extrabold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] flex items-center gap-1">
                                        <Shield className="w-3.5 h-3.5" />
                                        Institution Policy
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {selectedModule.institution_policy}
                                    </p>
                                    <div className="text-[10px] font-bold text-foreground pt-1">
                                        College Admin may disable:{' '}
                                        <span className={selectedModule.can_college_admin_disable ? 'text-emerald-600' : 'text-rose-600'}>
                                            {selectedModule.can_college_admin_disable ? 'Yes (Optional)' : 'No (Institution Locked)'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-white dark:bg-[#1E1B38] border border-dashed border-border text-center space-y-2">
                                <Info className="w-6 h-6 text-muted-foreground mx-auto" />
                                <div className="text-xs font-bold text-foreground">Select a Module</div>
                                <p className="text-[11px] text-muted-foreground">
                                    Click any module card on the left to inspect its capabilities, dependencies, and role governance.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: BY CATEGORY (Grouped Domain Capabilities Planning) */}
            {activeTab === 'category' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => {
                        const catModules = modulesByCategory[cat] || [];
                        const enabledInCat = catModules.filter((m) => !!enabledModules[m.id]).length;
                        const hasRequired = catModules.some((m) => m.is_required);

                        return (
                            <div
                                key={cat}
                                className="p-5 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-3"
                            >
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-muted/60">
                                            {getCategoryIcon(cat)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                                {cat}
                                            </h4>
                                            <div className="text-[11px] text-muted-foreground">
                                                {enabledInCat} of {catModules.length} capabilities active
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = { ...enabledModules };
                                                catModules.forEach((m) => {
                                                    next[m.id] = true;
                                                });
                                                setEnabledModules(next);
                                            }}
                                            className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline cursor-pointer"
                                        >
                                            Enable All
                                        </button>
                                        <span className="text-muted-foreground">·</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = { ...enabledModules };
                                                catModules.forEach((m) => {
                                                    if (!m.is_required || allowAdminDisableRequired) {
                                                        next[m.id] = false;
                                                    }
                                                });
                                                setEnabledModules(next);
                                            }}
                                            className="text-[11px] font-bold text-muted-foreground hover:text-rose-600 cursor-pointer"
                                        >
                                            Disable Optional
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {catModules.map((m) => {
                                        const isEnabled = !!enabledModules[m.id];
                                        return (
                                            <div
                                                key={m.id}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/50 text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground">
                                                        {m.name}
                                                    </span>
                                                    {m.is_required && (
                                                        <span className="text-[9px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-1.5 py-0.2 rounded-full border border-[#8B1E3F]/30">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            isEnabled
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {isEnabled ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleModule(m)}
                                                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0B3A67] dark:text-[#93C5FD] cursor-pointer"
                                                    >
                                                        <RefreshCw className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 3: DEPENDENCIES & HEALTH (Validation Matrix) */}
            {activeTab === 'dependencies' && (
                <div className="space-y-4">
                    {/* Health Summary Banner */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-2.5 rounded-xl ${
                                    metrics.dependencyIssues > 0
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                }`}
                            >
                                <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white">
                                    Dependency Health:{' '}
                                    {metrics.dependencyIssues > 0
                                        ? `${metrics.dependencyIssues} Issues Detected`
                                        : 'All System Dependencies Satisfied'}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Velora validates technical prerequisites and downstream operational linkages before college activation.
                                </p>
                            </div>
                        </div>

                        {metrics.dependencyIssues > 0 && (
                            <Button
                                type="button"
                                onClick={handleResolveDependencies}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Auto-Enable Missing Dependencies
                            </Button>
                        )}
                    </div>

                    {/* Dependencies Table */}
                    <div className="rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-bold">
                                        <th className="p-3.5 pl-4">Target Module</th>
                                        <th className="p-3.5">Prerequisite Dependencies</th>
                                        <th className="p-3.5">Dependency Type</th>
                                        <th className="p-3.5">Health Status</th>
                                        <th className="p-3.5 pr-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {modulesCatalog.map((m) => {
                                        const isEnabled = !!enabledModules[m.id];
                                        const hasMissing = m.dependencies.some((depId) => {
                                            const dep = modulesCatalog.find((x) => x.id === depId);
                                            return dep && !enabledModules[dep.id];
                                        });

                                        return (
                                            <tr key={m.id} className="hover:bg-muted/20">
                                                <td className="p-3.5 pl-4 font-bold text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <span>{m.name}</span>
                                                        <span
                                                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                                                isEnabled
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {isEnabled ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-3.5">
                                                    {m.dependency_labels.length === 0 ? (
                                                        <span className="text-muted-foreground text-[11px] italic">
                                                            Independent Core Module
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {m.dependency_labels.map((d, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium"
                                                                >
                                                                    {d}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="p-3.5 text-muted-foreground text-[11px]">
                                                    {m.dependencies.length > 0 ? 'Technical & Master Data' : 'Core'}
                                                </td>

                                                <td className="p-3.5">
                                                    {!isEnabled ? (
                                                        <span className="text-muted-foreground text-[11px]">
                                                            Module Disabled
                                                        </span>
                                                    ) : hasMissing ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                                            <AlertTriangle className="w-3 h-3" /> Missing Dependency
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                                            <Check className="w-3 h-3" /> Valid & Executable
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="p-3.5 pr-4 text-right">
                                                    {isEnabled && hasMissing ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleResolveDependencies}
                                                            className="text-xs font-bold text-[#0B3A67] dark:text-[#93C5FD] hover:underline cursor-pointer"
                                                        >
                                                            Fix Dependencies
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[11px]">OK</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: ACCESS POLICIES (Matrix of Roles and Scope Grants) */}
            {activeTab === 'policies' && (
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-extrabold text-[#17152E] dark:text-white flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#0B3A67] dark:text-[#93C5FD]" />
                                College Scope Role-Module Access Policy Matrix
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Defines the functional permission tier granted to roles specifically within {college.code} scope.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-[#0B3A67] dark:text-[#93C5FD] dark:text-[#93C5FD] bg-[#F1F5F9] dark:bg-slate-800 px-3 py-1 rounded-full border border-[#8B1E3F]/30">
                            Inherited from Institution Standard
                        </span>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-bold">
                                        <th className="p-3.5 pl-4">Module</th>
                                        <th className="p-3.5">College Admin</th>
                                        <th className="p-3.5">College Dean</th>
                                        <th className="p-3.5">Program Head</th>
                                        <th className="p-3.5">Faculty Member</th>
                                        <th className="p-3.5 pr-4">VPAF Oversight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {modulesCatalog.map((m) => {
                                        const mat = m.access_matrix || {};
                                        return (
                                            <tr key={m.id} className="hover:bg-muted/20">
                                                <td className="p-3.5 pl-4 font-bold text-foreground">
                                                    <div>{m.name}</div>
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        {m.category}
                                                    </span>
                                                </td>

                                                {/* College Admin */}
                                                <td className="p-3.5">
                                                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold text-[10px] border border-purple-200">
                                                        {mat['College Admin'] || 'Full Control'}
                                                    </span>
                                                </td>

                                                {/* College Dean */}
                                                <td className="p-3.5">
                                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold text-[10px] border border-blue-200">
                                                        {mat['Dean'] || 'Approve & Review'}
                                                    </span>
                                                </td>

                                                {/* Program Head */}
                                                <td className="p-3.5">
                                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium text-[10px] border border-emerald-200">
                                                        {mat['Program Head'] || 'Departmental Scope'}
                                                    </span>
                                                </td>

                                                {/* Faculty */}
                                                <td className="p-3.5">
                                                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                                                        {mat['Faculty'] || 'Own Records Only'}
                                                    </span>
                                                </td>

                                                {/* VPAF */}
                                                <td className="p-3.5 pr-4">
                                                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-semibold border border-amber-200">
                                                        {mat['VPAF'] || 'Read-Only Audit'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Section: Dependency Checker Bar + Governance Delegation Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dependency Checker */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2.5 rounded-xl ${
                                metrics.dependencyIssues > 0
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-emerald-50 text-emerald-600'
                            }`}
                        >
                            {metrics.dependencyIssues > 0 ? (
                                <AlertTriangle className="w-5 h-5" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h4 className="text-xs font-extrabold text-[#17152E] dark:text-white">
                                Dependency Checker
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                                {metrics.dependencyIssues > 0
                                    ? `${metrics.dependencyIssues} dependency conflict(s) require resolution.`
                                    : 'All selected modules have their required dependencies satisfied.'}
                            </p>
                        </div>
                    </div>

                    {metrics.dependencyIssues > 0 && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleResolveDependencies}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                            Resolve All
                        </Button>
                    )}
                </div>

                {/* Module Configuration Settings */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B38] border border-border/80 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#17152E] dark:text-white">
                        <Sliders className="w-3.5 h-3.5 text-[#0B3A67] dark:text-[#93C5FD]" />
                        <span>Module Configuration Settings</span>
                    </div>

                    <div className="space-y-2 text-xs">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-muted-foreground text-[11px]">
                                Allow College Admin to configure optional modules
                            </span>
                            <input
                                type="checkbox"
                                checked={allowAdminConfigureOptional}
                                onChange={(e) => setAllowAdminConfigureOptional(e.target.checked)}
                                className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67]"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-muted-foreground text-[11px]">
                                Allow College Admin to disable institution-required modules
                            </span>
                            <input
                                type="checkbox"
                                checked={allowAdminDisableRequired}
                                onChange={(e) => setAllowAdminDisableRequired(e.target.checked)}
                                className="rounded border-border text-[#0B3A67] dark:text-[#93C5FD] focus:ring-[#0B3A67]"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

