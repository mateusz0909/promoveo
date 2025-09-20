import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import { LazyImage } from '../LazyImage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import {
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  CalendarDaysIcon,
  ClockIcon,
  LanguageIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface ProjectOverviewTabProps {
  appName: string;
  appDescription: string;
  generatedImages: any[];
  onAppNameChange: (name: string) => void;
  onAppDescriptionChange: (description: string) => void;
  onDeleteProject: () => Promise<void>;
  // Additional project data
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  language?: string;
  device?: string;
}

export const ProjectOverviewTab = ({ 
  appName, 
  appDescription, 
  generatedImages, 
  onAppNameChange, 
  onAppDescriptionChange, 
  onDeleteProject,
  projectId,
  createdAt,
  updatedAt,
  language = "English",
  device = "iPhone"
}: ProjectOverviewTabProps) => {
  const { session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({ appName, appDescription });

  // Track changes
  useEffect(() => {
    const hasChanges = appName !== originalValues.appName || appDescription !== originalValues.appDescription;
    setHasUnsavedChanges(hasChanges);
  }, [appName, appDescription, originalValues]);

  const saveProject = useCallback(async (showToast = true) => {
    if (!projectId || !session?.access_token || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          inputAppName: appName,
          inputAppDescription: appDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setOriginalValues({ appName, appDescription });
      
      if (showToast) {
        toast.success('Project saved successfully!');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      if (showToast) {
        toast.error('Failed to save project. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [projectId, session, appName, appDescription, hasUnsavedChanges]);

  // Save on blur for form fields
  const handleFieldBlur = () => {
    if (hasUnsavedChanges && projectId) {
      saveProject(false); // Save without toast on blur
    }
  };

  const handleDownloadLandingPage = async () => {
    if (!projectId || !session?.access_token) return;

    setIsDownloading(true);
    toast.info("Generating your landing page... this may take a moment.");

    try {
      const response = await fetch(`/api/projects/${projectId}/landing-page`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate landing page.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName}-landing-page.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Landing page downloaded successfully!");

    } catch (error) {
      console.error("Error downloading landing page:", error);
      toast.error("Failed to download landing page. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    return device.toLowerCase().includes('ipad') ? DeviceTabletIcon : DevicePhoneMobileIcon;
  };

  const DeviceIcon = getDeviceIcon(device);

  return (
    <div className="space-y-6">
      {/* Project Header with Stats */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Project Overview</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  Manage your app's basic information and project settings
                </p>
                {projectId && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      {hasUnsavedChanges ? (
                        <>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          <span className="text-xs text-orange-600">Unsaved changes</span>
                        </>
                      ) : lastSaved ? (
                        <>
                          <CheckCircleIcon className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600">
                            Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Saves when you click outside</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {projectId && (
                <>
                  <Badge variant="secondary" className="font-mono text-xs">
                    ID: {projectId.slice(-8)}
                  </Badge>
                  <Button
                    onClick={() => saveProject(true)}
                    disabled={!hasUnsavedChanges || isSaving}
                    size="sm"
                    variant={hasUnsavedChanges ? "default" : "outline"}
                    className="min-w-[80px]"
                  >
                    {isSaving ? (
                      <>
                        <CloudArrowUpIcon className="w-4 h-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                        Save
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Saved
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDownloadLandingPage}
                    disabled={isDownloading}
                    size="sm"
                    variant="outline"
                  >
                    {isDownloading ? (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Get Landing Page
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Stats */}
          {(createdAt || updatedAt || language || device) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/25 rounded-lg border">
              {createdAt && (
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              )}
              
              {updatedAt && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Updated</p>
                    <p className="text-sm">{formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <LanguageIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Language</p>
                  <p className="text-sm">{language}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Device</p>
                  <p className="text-sm">{device}</p>
                </div>
              </div>
            </div>
          )}

          {/* App Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">App Information</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="appName" className="text-sm font-medium">App Name</Label>
                <Input 
                  id="appName" 
                  value={appName} 
                  onChange={(e) => onAppNameChange(e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="Enter your app name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">The name that will appear in app stores</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Project Summary</Label>
                <div className="flex items-center gap-4 p-3 bg-muted/25 rounded-md">
                  <div className="flex items-center gap-1">
                    <PhotoIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{generatedImages?.length || 0}</span>
                    <span className="text-xs text-muted-foreground">screenshots</span>
                  </div>
                  <div className="text-muted-foreground">•</div>
                  <div className="text-sm">
                    <span className="font-medium">{appDescription.length}</span>
                    <span className="text-muted-foreground text-xs">/4000 chars</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appDescription" className="text-sm font-medium">App Description</Label>
              <Textarea 
                id="appDescription" 
                value={appDescription} 
                onChange={(e) => onAppDescriptionChange(e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="Describe what your app does and its key features..."
                className="min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                maxLength={4000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Provide a clear description of your app's purpose and main features</span>
                <span>{appDescription.length}/4000</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshots Preview */}
      {generatedImages && generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhotoIcon className="h-5 w-5" />
              Screenshots ({generatedImages.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Preview of your uploaded app screenshots
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="group relative">
                  <ImageZoom zoomMargin={120}>
                    <div className="relative overflow-hidden rounded-lg border bg-muted/25 aspect-[9/19.5]">
                      <LazyImage
                        src={image.sourceScreenshotUrl}
                        alt={`Screenshot ${index + 1}`}
                        className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    </div>
                  </ImageZoom>
                  <p className="text-xs text-muted-foreground mt-1 text-center">Screenshot {index + 1}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <p className="text-sm text-muted-foreground">
            Irreversible actions that will permanently affect your project
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <h4 className="text-sm font-medium">Delete Project</h4>
              <p className="text-xs text-muted-foreground mt-1">
                This will permanently delete your project and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete Project</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your project
                    "{appName}" and remove all associated data from our servers, including
                    generated content, images, and configurations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};