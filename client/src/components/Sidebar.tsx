import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { UserAvatar } from './UserAvatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PhotoIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  HomeIcon,
  GlobeAltIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import logoBlack from '@/assets/logo_black.png';
import logoWhite from '@/assets/logo_white.png';

interface Project {
  id: string;
  name: string;
  inputAppName: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  device: string;
}

interface AppSidebarProps {
  onUserAvatarClick?: () => void; // now optional, not used
}

const studioSubItems = [
  {
    title: "Images",
    url: "/images",
    icon: PhotoIcon,
  },
  {
    title: "Text content",
    url: "/text-content",
    icon: DocumentTextIcon,
  },
  {
    title: "Landing page",
    url: "/landing-page",
    icon: GlobeAltIcon,
  },
  {
    title: "Project overview",
    url: "/overview",
    icon: InformationCircleIcon,
  },
];

export function AppSidebar({ }: AppSidebarProps) {
  const { user, session, signOut } = useAuth();
  const { currentProject } = useProject();
  const location = useLocation();
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Check if we're in a project context (should show expanded studio navigation)
  const isInProject = () => {
    const isProjectRoute = location.pathname.startsWith('/project/') && location.pathname !== '/project/';
    return isProjectRoute;
  };

  // Check if Studio section should be highlighted
  const isStudioActive = () => {
    return location.pathname === '/' || 
           location.pathname === '/new-project' ||
           location.pathname.startsWith('/project/') ||
           ['/images', '/text-content', '/overview', '/landing-page'].some(route => 
             location.pathname === route
           );
  };

  // Check if specific studio item is active
  const isStudioItemActive = (url: string) => {
    if (!isInProject()) return false;
    
    const currentPath = location.pathname;
    
    // Extract project ID to build expected paths
    const match = currentPath.match(/\/project\/([^/]+)/);
    if (!match) return false;
    const projectId = match[1];
    
    // For project context, check the exact sub-path
    if (url === '/images') {
      // Images is active for base project route or explicit images route
      return currentPath === `/project/${projectId}` || 
             currentPath === `/project/${projectId}/images`;
    }
    if (url === '/text-content') {
      return currentPath === `/project/${projectId}/text-content`;
    }
    if (url === '/overview') {
      return currentPath === `/project/${projectId}/overview`;
    }
    if (url === '/landing-page') {
      return currentPath === `/project/${projectId}/landing-page`;
    }
    
    return false;
  };

  // Handle studio navigation - if not in project, go to dashboard
  const handleStudioNavigation = (url: string) => {
    if (!isInProject()) {
      // If not in a project, go to dashboard
      navigate('/');
      return;
    }
    
    // Extract project ID from current path
    const match = location.pathname.match(/\/project\/([^/]+)/);
    const projectId = match ? match[1] : null;
    
    if (!projectId) {
      console.error('Could not extract project ID from path:', location.pathname);
      navigate('/');
      return;
    }
    
    // In project context, navigate to the sub-section
    const newPath = `/project/${projectId}${url}`;
    navigate(newPath);
  };

  // Get display name from user
  const getDisplayName = (user: any): string => {
    if (!user) return "Unknown User";

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;

    if (fullName) return fullName;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    
    return user.email || "Unknown User";
  };

  // Fetch recent projects
  useEffect(() => {
    if (!session) return;

    const fetchRecentProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch('/api/projects?limit=5&sortBy=updatedAt&order=desc', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const projects = await response.json();
          setRecentProjects(projects);
        }
      } catch (error) {
        console.error('Error fetching recent projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchRecentProjects();
  }, [session, location]);

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const displayName = getDisplayName(user);

  return (
    <TooltipProvider delayDuration={2000}>
      <Sidebar variant='sidebar'>
      <SidebarHeader className="p-4 flex items-center justify-center">
        <Link to="/" className="flex items-center">
          <img 
            src={logoBlack} 
            alt="Lemmi Studio Logo" 
            className="h-8 dark:hidden" 
          />
          <img 
            src={logoWhite} 
            alt="Lemmi Studio Logo" 
            className="h-8 hidden dark:block" 
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Studio Section */}
        <SidebarGroup>
          <SidebarGroupLabel 
            className={cn(
              "text-sm font-medium mb-2",
              isStudioActive() && "text-primary"
            )}
          >
            Studio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Main Studio Link */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={cn(
                    "w-full justify-start",
                    (location.pathname === '/' || location.pathname === '/new-project') && 
                    "bg-accent text-accent-foreground"
                  )}
                >
                  <Link to="/">
                    <HomeIcon className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Sub-navigation - only show when in project context */}
              <div 
                className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden",
                  isInProject() && currentProject 
                    ? "max-h-96 opacity-100" 
                    : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-1">
                  {studioSubItems.map((item, index) => (
                    <SidebarMenuItem 
                      key={item.title} 
                      className={cn(
                        "ml-4 transform transition-all duration-300 ease-in-out",
                        isInProject() && currentProject
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-4 opacity-0"
                      )}
                      style={{
                        transitionDelay: isInProject() && currentProject 
                          ? `${index * 50}ms` 
                          : `${(studioSubItems.length - index - 1) * 30}ms`
                      }}
                    >
                      <SidebarMenuButton 
                        onClick={() => handleStudioNavigation(item.url)}
                        className={cn(
                          "w-full justify-start cursor-pointer transition-all duration-200",
                          isStudioItemActive(item.url) && "bg-accent text-accent-foreground "
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        {/* History Section */}
        <SidebarGroup>
          <SidebarGroupLabel 
            className={cn(
              "text-sm font-medium mb-2 cursor-pointer hover:text-primary transition-colors",
              location.pathname === '/history' && "text-primary"
            )}
            onClick={() => navigate('/history')}
          >
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Recent projects
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingProjects ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <SidebarMenuItem key={`skeleton-${i}`}>
                    <div className="flex items-center space-x-2 p-2">
                      <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
                    </div>
                  </SidebarMenuItem>
                ))
              ) : recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <Tooltip delayDuration={800}>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => handleProjectSelect(project.id)}
                          className={cn(
                            "w-full min-w-0 justify-start cursor-pointer text-left",
                            location.pathname === `/project/${project.id}` && 
                            "bg-accent text-accent-foreground"
                          )}
                        >
                          <span
                            className="max-w-35 truncate"
                            title={project.inputAppName}
                          >
                            {project.inputAppName}
                          </span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p className="max-w-[220px] break-words">{project.inputAppName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <div className="text-xs text-muted-foreground p-2">
                    No recent projects
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        {/* Settings Button */}
        <Button variant="ghost" size="md" asChild className="justify-start mb-2">
          <Link to="/settings">
            <Cog6ToothIcon className="h-8 w-8 mr-2" />
            Settings
          </Link>
        </Button>

        {/* User Avatar Dropdown */}
        {user && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start p-2 h-auto w-full">
                <div className="flex items-center space-x-3 w-full">
                  <UserAvatar user={user} size="sm" />
                  <div className="flex flex-col items-start text-left">
                    <p className="text-sm font-medium leading-none truncate max-w-[120px]">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none mt-1 truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex flex-col items-center gap-2 py-4">
                <UserAvatar user={user} size="lg" />
                <div className="text-center">
                  <div className="font-semibold text-base">{displayName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/privacy" className="w-full">Privacy Policy</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/terms" className="w-full">Terms of Service</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => {
                await signOut();
                navigate('/login');
              }} className="text-destructive font-semibold w-full flex items-center gap-2">
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}