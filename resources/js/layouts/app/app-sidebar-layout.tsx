import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import React from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    const { active_branding } = usePage<SharedData>().props;

    // Dynamically inject CSS variables resolved from active scope (Institution -> Entity -> College -> Active Scope)
    // Ensures semantic system colors (error/warning/success) remain unperturbed while brand colors drive UI components.
    const brandingStyles = active_branding?.css_variables
        ? (active_branding.css_variables as unknown as React.CSSProperties)
        : undefined;

    return (
        <AppShell variant="sidebar">
            <div style={brandingStyles} className="flex flex-col min-h-screen w-full bg-background transition-colors duration-200">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex flex-1 w-full">
                    <AppSidebar />
                    <AppContent variant="sidebar" className="flex-1 w-full min-w-0">
                        {children}
                    </AppContent>
                </div>
            </div>
        </AppShell>
    );
}
