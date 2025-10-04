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
  const { currentProject, onDownloadAll } = useProject();

  // Check if we're on an auth page
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  
  // Check if we're on the images/editor tab (should be full-width without padding)
  const isEditorPage = location.pathname.includes('/images') || location.pathname.match(/\/project\/[^/]+$/);

  // If it's an auth page, render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen className="">
      <AppSidebar onUserAvatarClick={() => setUserDialogOpen(true)} />

      <SidebarInset className="transition-[left,right,margin-left] duration-200 ease-linear peer-data-[state=expanded]:ml-[calc(var(--sidebar-width)-var(--sidebar-width-icon))] flex flex-1 flex-col" style={{ height: '100vh' }}>
        {/* Top Panel Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <TopPanel currentProject={currentProject} onDownloadAll={onDownloadAll || undefined} />
        </header>
        
        {/* Main content - padding only for non-editor pages */}
        <div className={`flex flex-1 flex-col ${isEditorPage ? '' : 'py-6 pr-6 pl-6'}`}>
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