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
  SparklesIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';

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
    <div className={cn("space-y-8", className)}>
      {/* Welcome Header */}
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center gap-3 mb-2 md:justify-start">
            <img src={logo} alt="Lemmi Studio" className="h-10 w-10 dark:invert transition-all duration-200" />
            <h1 className="text-3xl md:text-4xl font-bold">Welcome to Lemmi Studio</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
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
        <div className="relative flex justify-center md:justify-end">
          <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl p-4 backdrop-blur">
            <img
              src="/control-panel-animate.svg"
              alt="Animated analytics showcasing marketing insights"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>


      {/* Recent Projects Section */}
      {(isLoadingProjects || recentProjects.length > 0) ? (
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
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="flex items-center space-x-4 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <PhotoIcon className="h-6 w-6 text-primary" />
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        !isLoadingProjects && (
          /* Onboarding for New Users */
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Create your first App Store marketing project in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {onboardingSteps.map((step, index) => (
                  <div key={index} className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/new-project">
                    <PlusIcon className="h-4 w-4" />
                    Start Your First Project
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}

    
    </div>
  );
};