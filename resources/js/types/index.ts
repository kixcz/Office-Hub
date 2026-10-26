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
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
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
    [key: string]: unknown; // This allows for additional properties...
}

