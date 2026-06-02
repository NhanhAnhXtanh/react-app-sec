import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppFooter } from './AppFooter';

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen>
      <Toaster position="top-right" richColors />
      <AppSidebar />
      <SidebarInset className="flex min-h-svh min-w-0 flex-col bg-muted/60">
        <AppHeader />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="w-full min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </div>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
