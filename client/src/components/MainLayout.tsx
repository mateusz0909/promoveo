import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from './Sidebar';
import { TopPanel } from './TopPanel';
import { UserAvatarDialog } from './UserAvatarDialog';
import { SidebarProvider, SidebarInset } from './ui/sidebar';
import { useProject } from '@/context/ProjectContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const { currentProject } = useProject();

  // Check if we're on an auth page
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // If it's an auth page, render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen className="">
      <AppSidebar onUserAvatarClick={() => setUserDialogOpen(true)} />

      <SidebarInset className="transition-[left,right,margin-left] duration-200 ease-linear peer-data-[state=expanded]:ml-[calc(var(--sidebar-width)-var(--sidebar-width-icon))] flex h-full flex-1 flex-col">
        {/* Top Panel Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <TopPanel currentProject={currentProject} />
        </header>
        
        {/* Main content */}
        <div className="flex flex-1 flex-col gap-4 p-12">
          {children}
        </div>
      </SidebarInset>

      {/* User Avatar Dialog */}
      <UserAvatarDialog 
        open={userDialogOpen} 
        onOpenChange={setUserDialogOpen} 
      />
    </SidebarProvider>
  );
}