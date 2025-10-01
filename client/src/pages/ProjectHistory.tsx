import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ClockIcon, 
  PhotoIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  inputAppName: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  device: string;
}

export const ProjectHistory: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all projects
  useEffect(() => {
    if (!session) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const projectsData = await response.json();
          setProjects(projectsData);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [session]);

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.inputAppName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Project History</h1>
          <p className="text-muted-foreground">
            Manage all your App Store marketing projects
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/new-project">
            <PlusIcon className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            All Projects
            {filteredProjects.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredProjects.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Click on any project to continue editing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-center space-x-4 p-4 border-b last:border-b-0">
                  <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="space-y-0">
              {filteredProjects.map((project) => {
                const DeviceIcon = project.device?.toLowerCase().includes('ipad') 
                  ? DeviceTabletIcon 
                  : DevicePhoneMobileIcon;
                
                return (
                  <div
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="flex items-center space-x-4 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <DeviceIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {project.inputAppName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Updated {formatDate(project.updatedAt)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {project.device}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.language}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <PhotoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first App Store marketing project to get started'
                }
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link to="/new-project">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create New Project
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};