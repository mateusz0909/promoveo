import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
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
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import type { GeneratedImage } from '@/types/project';

interface ProjectOverviewTabProps {
  appName: string;
  appDescription: string;
  generatedImages?: GeneratedImage[];
  onAppNameChange: (name: string) => void;
  onAppDescriptionChange: (description: string) => void;
  onDeleteProject: () => Promise<void>;
  // Additional project data
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  language?: string;
  device?: string;
  landingPageZipUpdatedAt?: string;
}

export const ProjectOverviewTab = ({ 
  appName, 
  appDescription, 
  generatedImages = [], 
  onAppNameChange, 
  onAppDescriptionChange, 
  onDeleteProject,
  projectId,
  createdAt,
  updatedAt,
  language = "English",
  device = "iPhone",
  landingPageZipUpdatedAt,
}: ProjectOverviewTabProps) => {
  const { session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
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

  const getDeviceIcon = (device: string) => {
    return device.toLowerCase().includes('ipad') ? DeviceTabletIcon : DevicePhoneMobileIcon;
  };

  const DeviceIcon = getDeviceIcon(device);
  const generatedImageCount = generatedImages.length;
  const descriptionLength = appDescription.length;

  type MetadataCardConfig = {
    key: string;
    label: string;
    value: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    helper?: string;
  };

  const metadataCandidates: Array<MetadataCardConfig | null> = [
    createdAt
      ? {
          key: "createdAt",
          label: "Created",
          value: formatDistanceToNow(new Date(createdAt), { addSuffix: true }),
          icon: CalendarDaysIcon,
          helper: new Date(createdAt).toLocaleString(),
        }
      : null,
    updatedAt
      ? {
          key: "updatedAt",
          label: "Last updated",
          value: formatDistanceToNow(new Date(updatedAt), { addSuffix: true }),
          icon: ClockIcon,
          helper: new Date(updatedAt).toLocaleString(),
        }
      : null,
    language
      ? {
          key: "language",
          label: "Language",
          value: language,
          icon: LanguageIcon,
        }
      : null,
    device
      ? {
          key: "device",
          label: "Device preset",
          value: device,
          icon: DeviceIcon,
        }
      : null,
    landingPageZipUpdatedAt
      ? {
          key: "landingPage",
          label: "Landing page build",
          value: formatDistanceToNow(new Date(landingPageZipUpdatedAt), { addSuffix: true }),
          icon: CloudArrowDownIcon,
          helper: new Date(landingPageZipUpdatedAt).toLocaleString(),
        }
      : null,
    {
      key: "assets",
      label: "Generated assets",
      value: `${generatedImageCount} ${generatedImageCount === 1 ? "image" : "images"}`,
      icon: PhotoIcon,
      helper: `${descriptionLength}/4000 characters in description`,
    },
  ];

  const metadataCards = metadataCandidates.filter(
    (card): card is MetadataCardConfig => card !== null
  );

  const renderSaveStatus = () => {
    if (!projectId) return null;

    if (hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>Unsaved changes</span>
        </div>
      );
    }

    if (lastSaved) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircleIcon className="w-3 h-3" />
          <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
        </div>
      );
    }

    return <span className="text-xs text-muted-foreground">Saves when you click outside</span>;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/60 border border-border/50 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              Project overview
            </div>
            <CardTitle className="mt-1 text-2xl">Keep your project details aligned</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Update app basics, monitor metadata, and manage workspace health without leaving the studio.
            </CardDescription>
          </div>

          {projectId && (
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Badge variant="secondary" className="font-mono text-xs">
                ID: {projectId.slice(-8)}
              </Badge>
              <div className="flex flex-col gap-2 sm:items-end">
                <Button
                  onClick={() => saveProject(true)}
                  disabled={!hasUnsavedChanges || isSaving}
                  size="sm"
                  variant={hasUnsavedChanges ? "secondary" : "outline"}
                  className="min-w-[96px]"
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
                {renderSaveStatus()}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-10">
          {metadataCards.length > 0 && (
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Project metadata
                </h3>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  Snapshot of key attributes that influence generation results and exports.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {metadataCards.map(({ key, label, value, icon: Icon, helper }) => (
                  <Card key={key} className="border border-border/50 bg-background/60 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-lg font-semibold leading-none text-foreground">{value}</p>
                      {helper && (
                        <p className="text-xs text-muted-foreground">{helper}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Identity & narrative
              </h3>
              <p className="mt-1 text-sm text-muted-foreground/80">
                Keep these fields polished—they feed both AI generation and your public listing.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border border-border/50 bg-background/60 shadow-sm">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base font-semibold">App name</CardTitle>
                  <CardDescription>Displayed anywhere your listing appears.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    id="appName"
                    value={appName}
                    onChange={(e) => onAppNameChange(e.target.value)}
                    onBlur={handleFieldBlur}
                    placeholder="Enter your app name"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Short, memorable names perform best. Autosaves when you click away.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-background/60 shadow-sm">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base font-semibold">Project summary</CardTitle>
                  <CardDescription>Quick health check for your assets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Generated images</span>
                    <Badge variant="secondary" className="font-mono">
                      {generatedImageCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Description length</span>
                    <span className="font-mono text-muted-foreground">
                      {descriptionLength}/4000
                    </span>
                  </div>
                  {language && (
                    <div className="flex items-center justify-between">
                      <span>Language</span>
                      <span className="font-mono text-muted-foreground">{language}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-background/60 shadow-sm lg:col-span-2">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base font-semibold">App description</CardTitle>
                  <CardDescription>
                    Share the value prop and core features that differentiate your experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    id="appDescription"
                    value={appDescription}
                    onChange={(e) => onAppDescriptionChange(e.target.value)}
                    onBlur={handleFieldBlur}
                    placeholder="Describe what your app does and its key features..."
                    className="min-h-[140px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    maxLength={4000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Use paragraphs and bullet points. We preserve formatting downstream.</span>
                    <span>{descriptionLength}/4000</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="border border-destructive/20 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription className="text-muted-foreground">
            Irreversible actions that will permanently affect your project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-medium text-foreground">Delete project</h4>
              <p className="text-xs text-foreground/70 mt-1">
                This will permanently delete your project and all associated data.
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