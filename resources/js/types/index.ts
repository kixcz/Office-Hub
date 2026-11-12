import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: string | number;
    description?: string;
    items?: NavItem[];
}

export interface PortalAssignment {
    id: number;
    role_id: number;
    role_name: string;
    portal_type: string;
    landing_url: string;
    tier: string;
    scope_level: string;
    scope_type: string;
    scope_id: number | null;
    scope_code: string;
    scope_name: string;
    display_label: string;
    short_label: string;
    designation_type: string;
    appointment_reference?: string | null;
    assignment_reason?: string | null;
    effective_from?: string | null;
    effective_until?: string | null;
    is_active?: boolean;
    is_default?: boolean;
}

export interface PortalContext {
    active_assignment: PortalAssignment;
    available_assignments: PortalAssignment[];
    can_switch_portal: boolean;
}

export interface ActiveBranding {
    scope_type: 'institution' | 'entity' | 'college';
    scope_id: number | null;
    scope_code: string;
    scope_name: string;
    short_name: string;
    tagline: string;
    logo_url: string;
    institution_logo_url?: string;
    institution_name?: string;
    favicon_url?: string;
    wordmark?: string;
    primary_color: string;
    primary_color_vivid?: string;
    secondary_color: string;
    accent_color: string;
    surface_color: string;
    dark_color?: string;
    preset_key?: string;
    header_style?: string;
    sidebar_style?: string;
    report_header?: string;
    report_footer?: string;
    tv_theme?: string;
    is_inherited: boolean;
    inherited_from: string;
    resolved_level: 'institution' | 'entity' | 'college';
    semantic_colors: {
        success: string;
        success_bg: string;
        warning: string;
        warning_bg: string;
        error: string;
        error_bg: string;
        info: string;
        info_bg: string;
        neutral: string;
    };
    css_variables: Record<string, string>;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    portal_context?: PortalContext;
    active_branding?: ActiveBranding;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: string[];
    is_faculty?: boolean;
    is_college_admin?: boolean;
    is_institution_super_admin?: boolean;
    is_vpaa?: boolean;
    is_vpaf?: boolean;
    can_switch_channels?: boolean;
    faculty?: {
        id: number;
        full_name?: string;
        photo_url?: string | null;
        academic_rank?: string;
        program?: {
            id: number;
            code: string;
            name: string;
        };
    };
    active_college?: {
        id: number;
        code: string;
        name: string;
        acronym?: string | null;
        dean_name?: string | null;
        contact_email?: string | null;
        logo_url?: string | null;
        color_theme?: string | null;
        branding?: {
            primary_color: string;
            secondary_color: string;
            accent_color: string;
            surface_color: string;
            preset_key?: string;
            slogan: string;
            logo_url?: string | null;
        };
    } | null;
    [key: string]: unknown; // This allows for additional properties...
}

