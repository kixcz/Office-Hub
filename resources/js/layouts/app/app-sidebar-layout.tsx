import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <AppShell variant="sidebar">
            <div className="flex flex-col min-h-screen w-full bg-background">
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
