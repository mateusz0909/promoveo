import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from './ui/sidebar';
import { DevicePhoneMobileIcon, DeviceTabletIcon } from '@heroicons/react/24/solid';
import { Separator } from './ui/separator';

interface CurrentProject {
  id: string;
  name: string;
  device: string;
}

interface TopPanelProps {
  currentProject?: CurrentProject | null;
}

export function TopPanel({ currentProject }: TopPanelProps) {
  const location = useLocation();
  
  // Determine what to show on the left side
  const getLeftContent = () => {
    // If we're on a new project page
    if (location.pathname === '/new-project') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">New project</span>
        </div>
      );
    }

    // If we have a current project, show project info
    if (currentProject) {
      return (
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">{currentProject.name}</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {currentProject.device === 'iPad' ? (
              <>
                <DeviceTabletIcon className="h-4 w-4" />
                <span>iPad</span>
              </>
            ) : (
              <>
                <DevicePhoneMobileIcon className="h-4 w-4" />
                <span>iPhone</span>
              </>
            )}
          </div>
        </div>
      );
    }

    // Default fallback - no content needed since sidebar shows app name
    return null;
  };

  return (
    <>
      {/* Left side - Mobile trigger, App name/device or "New project" */}
      <div className="flex items-center gap-3">
        
        <SidebarTrigger className="" />


        {getLeftContent()}
      </div>
    </>
  );
}