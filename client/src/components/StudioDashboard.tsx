import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PlusIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  ArrowRightIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon
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

interface StudioDashboardProps {
  className?: string;
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({ className }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

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

  const onboardingSteps = [
    {
      icon: PhotoIcon,
      title: "Upload Screenshots",
      description: "Add your app screenshots to get started"
    },
    {
      icon: SparklesIcon,
      title: "AI Generation",
      description: "Let AI create compelling App Store content"
    },
    {
      icon: DocumentTextIcon,
      title: "Customize & Export",
      description: "Fine-tune and download your marketing materials"
    }
  ];

  return (
    <div className={cn("space-y-8 max-w-3xl mx-auto", className)}>
      {/* Welcome Header */}
      <div className="text-center md:text-left">
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-2 md:justify-start">
            <img src={logoBlack} alt="Lemmi Studio" className="h-10 dark:hidden" />
            <img src={logoWhite} alt="Lemmi Studio" className="h-10 hidden dark:block" />
          </div>
          <p className="text-lg text-muted-foreground">
            Create compelling App Store marketing content with AI-powered tools.
            Generate descriptions, optimize keywords, and design beautiful marketing images.
          </p>
          <div className="flex justify-center md:justify-start">
            <Button asChild size="lg" className="gap-2">
              <Link to="/new-project">
                <PlusIcon className="h-5 w-5" />
                Create New Project
              </Link>
            </Button>
          </div>
        </div>
      </div>


      {/* Recent Projects Section */}
      {(isLoadingProjects || recentProjects.length > 0) ? (
        <div className="relative">
          {/* Illustration positioned above the card */}
          {/* <div className="absolute right-8 -top-20 z-10 pointer-events-none">
            <img
              src="/list.svg"
              alt="Figure standing on list"
              className="h-24 w-auto"
            />
          </div> */}
          
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription>
                    Pick up where you left off
                  </CardDescription>
                </div>
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/history">
                    View All Projects
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
            <div className="space-y-0">
              {isLoadingProjects ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0"
                  >
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16 rounded-full" />
                        <Skeleton className="h-3 w-20 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                ))
              ) : (
                recentProjects.map((project) => {
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
                          <span>{formatDate(project.updatedAt)}</span>
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
                })
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      ) : (
        !isLoadingProjects && (
          /* Onboarding for New Users */
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">
                Quick Start Guide
              </CardTitle>
              <CardDescription className="text-base">
                Create your first App Store marketing project in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="grid grid-cols-1 gap-6 mb-8">
                {onboardingSteps.map((step, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-muted"
                  >
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-background">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h4 className="font-semibold text-base mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button asChild size="lg" className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/20">
                  <Link to="/new-project">
                    <PlusIcon className="h-5 w-5" />
                    Start Your First Project
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  No credit card required • Takes less than 5 minutes
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}

    
    </div>
  );
};