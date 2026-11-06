import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    const { active_branding } = usePage<SharedData>().props;

    // Dynamically inject CSS variables resolved from active scope directly to document.documentElement
    // This guarantees that fixed elements, sidebars, and Radix portals (dropdowns, tooltips, dialogs)
    // inherit the active college/entity branding colors completely.
    useEffect(() => {
        if (!active_branding?.css_variables || typeof document === 'undefined') return;

        const root = document.documentElement;
        const vars = active_branding.css_variables as Record<string, string>;
        
        Object.entries(vars).forEach(([prop, val]) => {
            root.style.setProperty(prop, val);
        });
    }, [active_branding?.css_variables]);

    const brandingStyles = active_branding?.css_variables
        ? (active_branding.css_variables as unknown as React.CSSProperties)
        : undefined;

    return (
        <AppShell variant="sidebar">
            <div style={brandingStyles} className="flex flex-col min-h-screen w-full min-w-0 bg-background transition-colors duration-200">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex flex-1 w-full min-w-0">
                    <AppSidebar />
                    <AppContent variant="sidebar" className="flex-1 w-full min-w-0 max-w-full">
                        {children}
                    </AppContent>
                </div>
            </div>
        </AppShell>
    );
}
