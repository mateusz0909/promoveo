import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  PhotoIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface GeneratedImage {
  id: string;
  sourceScreenshotUrl: string;
  generatedImageUrl: string;
  accentColor?: string;
  configuration?: Record<string, unknown> | null;
  createdAt: string;
}

interface LandingPageFormData {
  appStoreId: string;
  logoFile: File | null;
  selectedImageId: string;
}

interface SavedLogoInfo {
  originalName?: string;
  publicUrl?: string;
}

interface LandingPageTabProps {
  className?: string;
}

type DeviceType = 'iPhone' | 'iPad';

const DEVICE_CONFIGS: Record<DeviceType, {
  frameWidth: number;
  frameHeight: number;
  screenWidth: number;
  screenHeight: number;
  cornerRadius: number;
  framePath: string;
}> = {
  iPhone: {
    frameWidth: 1293,
    frameHeight: 2656,
    screenWidth: 1179 + 4,
    screenHeight: 2552 + 4,
    cornerRadius: 70,
    framePath: '/iphone_15_frame.png',
  },
  iPad: {
    frameWidth: 1145,
    frameHeight: 1494,
    screenWidth: 1038 - 2,
    screenHeight: 1385 - 2,
    cornerRadius: 20,
    framePath: '/iPad%20Pro%2013%20Frame.png',
  },
};

const DEFAULT_DEVICE: DeviceType = 'iPhone';

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = src;
  });
}

async function generateMockupPreview(screenshotUrl: string, device: string | null | undefined): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Mockup preview generation is only available in the browser environment.');
  }

  const normalizedDevice = (device?.toLowerCase() === 'ipad' ? 'iPad' : 'iPhone') as DeviceType;
  const config = DEVICE_CONFIGS[normalizedDevice] || DEVICE_CONFIGS[DEFAULT_DEVICE];

  const canvas = document.createElement('canvas');
  canvas.width = config.frameWidth;
  canvas.height = config.frameHeight;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to obtain 2D context for mockup preview generation.');
  }

  const [screenshot, frame] = await Promise.all([
    loadImageElement(screenshotUrl),
    loadImageElement(config.framePath),
  ]);

  const screenX = (config.frameWidth - config.screenWidth) / 2;
  const screenY = (config.frameHeight - config.screenHeight) / 2;

  context.save();
  context.beginPath();

  const x = screenX;
  const y = screenY;
  const w = config.screenWidth;
  const h = config.screenHeight;
  const r = config.cornerRadius;

  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
  context.clip();

  const screenshotAspectRatio = screenshot.width / screenshot.height;
  let screenshotDrawWidth = config.screenWidth + 6;
  let screenshotDrawHeight = screenshotDrawWidth / screenshotAspectRatio;
  if (screenshotDrawHeight < config.screenHeight + 6) {
    screenshotDrawHeight = config.screenHeight + 6;
    screenshotDrawWidth = screenshotDrawHeight * screenshotAspectRatio;
  }

  const screenshotDrawX = screenX - 2;
  const screenshotDrawY = screenY - 2;

  context.drawImage(screenshot, screenshotDrawX, screenshotDrawY, screenshotDrawWidth, screenshotDrawHeight);

  context.restore();
  context.drawImage(frame, 0, 0, config.frameWidth, config.frameHeight);

  return canvas.toDataURL('image/png');
}

export function LandingPageTab({ className }: LandingPageTabProps) {
  const { session } = useAuth();
  const { currentProject } = useProject();
  const [formData, setFormData] = useState<LandingPageFormData>({
    appStoreId: '',
    logoFile: null,
    selectedImageId: '',
  });
  const [projectImages, setProjectImages] = useState<GeneratedImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isGeneratingLandingPage, setIsGeneratingLandingPage] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [mockupPreviews, setMockupPreviews] = useState<Record<string, string>>({});
  const [mockupErrors, setMockupErrors] = useState<Record<string, boolean>>({});
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);
  const [savedLogoInfo, setSavedLogoInfo] = useState<SavedLogoInfo | null>(null);
  const [landingPageMeta, setLandingPageMeta] = useState<{ downloadUrl: string | null; updatedAt: string | null }>({
    downloadUrl: null,
    updatedAt: null,
  });
  const hasLoadedInitialConfig = useRef(false);
  const [isDownloadingExisting, setIsDownloadingExisting] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);

  useEffect(() => {
    hasLoadedInitialConfig.current = false;
    setSavedLogoInfo(null);
    setLandingPageMeta({ downloadUrl: null, updatedAt: null });
    setShowSuccessView(false);
  }, [currentProject?.id]);

  // Fetch project images
  useEffect(() => {
    if (!currentProject?.id || !session) return;

    const fetchProjectImages = async () => {
      setIsLoadingImages(true);
      try {
        const response = await fetch(`/api/projects/${currentProject.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const project = await response.json();
          setProjectImages(project.generatedImages || []);
        } else {
          console.error('Failed to fetch project images');
          toast.error('Failed to load project images');
        }
      } catch (error) {
        console.error('Error fetching project images:', error);
        toast.error('Error loading project images');
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchProjectImages();
  }, [currentProject?.id, session]);

  useEffect(() => {
    if (!currentProject?.id || !session) return;

    let isMounted = true;

    const fetchLandingPageState = async () => {
      setIsLoadingConfig(true);
      try {
        const response = await fetch(`/api/projects/${currentProject.id}/landing-page`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return;
          }
          throw new Error('Failed to fetch landing page state');
        }

        const data = await response.json();
        if (!isMounted) return;

        setLandingPageMeta({
          downloadUrl: data.downloadUrl || null,
          updatedAt: data.updatedAt || null,
        });

        // If there's a download URL, show the success view
        if (data.downloadUrl) {
          setShowSuccessView(true);
        }

        if (data.config) {
          setSavedLogoInfo(data.config.logo || null);
          if (!hasLoadedInitialConfig.current) {
            setFormData((prev) => ({
              ...prev,
              appStoreId: data.config.appStoreId || '',
              selectedImageId: data.config.selectedImageId || '',
              logoFile: null,
            }));
            hasLoadedInitialConfig.current = true;
          }
        } else {
          setSavedLogoInfo(null);
        }
      } catch (error) {
        console.error('Error fetching landing page state:', error);
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      }
    };

    fetchLandingPageState();

    return () => {
      isMounted = false;
    };
  }, [currentProject?.id, session]);

  useEffect(() => {
    let isMounted = true;

    const createMockupPreviews = async () => {
      if (!projectImages.length) {
        if (isMounted) {
          setMockupPreviews({});
          setMockupErrors({});
        }
        return;
      }

      setIsGeneratingMockups(true);

      const previewEntries = await Promise.all(projectImages.map(async (image) => {
        if (!image.sourceScreenshotUrl) {
          return [image.id, null] as const;
        }

        try {
          const previewUrl = await generateMockupPreview(image.sourceScreenshotUrl, currentProject?.device);
          return [image.id, previewUrl] as const;
        } catch (error) {
          console.error('Failed to generate mockup preview:', error);
          return [image.id, null] as const;
        }
      }));

      if (!isMounted) return;

      const previewMap: Record<string, string> = {};
      const errorMap: Record<string, boolean> = {};

      previewEntries.forEach(([id, url]) => {
        if (url) {
          previewMap[id] = url;
        } else {
          errorMap[id] = true;
        }
      });

      setMockupPreviews(previewMap);
      setMockupErrors(errorMap);
      setIsGeneratingMockups(false);
    };

    createMockupPreviews();

    return () => {
      isMounted = false;
    };
  }, [projectImages, currentProject?.device]);

  // Handle form input changes
  const handleInputChange = (field: keyof LandingPageFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle logo file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, SVG, or WebP)');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        logoFile: file
      }));
      setSavedLogoInfo(null);
      toast.success('Logo uploaded successfully');
    }
  };

  // Handle image selection
  const handleImageSelection = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedImageId: imageId
    }));
  };

  // Validate form
  const isFormValid = () => {
    const hasLogo = formData.logoFile !== null || !!savedLogoInfo;
    return formData.appStoreId.trim() !== '' && 
      hasLogo && 
      formData.selectedImageId !== '';
  };

  // Generate landing page
  const handleGenerateLandingPage = async () => {
    if (!currentProject?.id || !session || !isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGeneratingLandingPage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('appStoreId', formData.appStoreId);
      formDataToSend.append('selectedImageId', formData.selectedImageId);
      if (formData.logoFile) {
        formDataToSend.append('logo', formData.logoFile);
      }

      const response = await fetch(`/api/projects/${currentProject.id}/landing-page`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to generate landing page';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.config) {
        setFormData((prev) => ({
          ...prev,
          appStoreId: data.config.appStoreId || '',
          selectedImageId: data.config.selectedImageId || '',
          logoFile: null,
        }));
        setSavedLogoInfo(data.config.logo || null);
      } else {
        setSavedLogoInfo(null);
      }

      setLandingPageMeta({
        downloadUrl: data.downloadUrl || null,
        updatedAt: data.updatedAt || null,
      });

      // Transition to success view
      setShowSuccessView(true);

      if (data.downloadUrl) {
        try {
          await triggerZipDownload(data.downloadUrl);
        } catch (error) {
          window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
          toast.info('Landing page zip opened in a new tab.');
        }
      }

      toast.success('Landing page generated and saved successfully!');
    } catch (error) {
      console.error('Error generating landing page:', error);
      toast.error(error instanceof Error ? error.message : 'Error generating landing page');
    } finally {
      setIsGeneratingLandingPage(false);
    }
  };

  // Generate App Store URL preview
  const generateAppStoreUrl = (appId: string) => {
    if (!appId.trim()) return '';
    return `https://apps.apple.com/app/id${appId}`;
  };

  const triggerZipDownload = async (url: string) => {
    try {
      const response = await fetch(url, {
        credentials: 'omit',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${currentProject?.name || 'landing_page'}_landing_page.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  const handleDownloadExisting = async () => {
    if (!landingPageMeta.downloadUrl) return;
    setIsDownloadingExisting(true);
    try {
      await triggerZipDownload(landingPageMeta.downloadUrl);
    } catch (error) {
      window.open(landingPageMeta.downloadUrl, '_blank', 'noopener,noreferrer');
      toast.info('Opened latest zip in a new tab.');
    } finally {
      setIsDownloadingExisting(false);
    }
  };

  const handleEditSettings = () => {
    setShowSuccessView(false);
  };

  const handleRegenerate = async () => {
    setShowSuccessView(false);
    // Small delay to ensure UI updates before regenerating
    setTimeout(() => {
      handleGenerateLandingPage();
    }, 100);
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString();
  };

  const hasExistingBundle = Boolean(landingPageMeta.downloadUrl);

  if (!currentProject) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No project selected</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking for existing landing page
  if (isLoadingConfig) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading landing page configuration...</p>
        </div>
      </div>
    );
  }

  // ACT II: Success View - "Package Ready" Dashboard
  if (showSuccessView && hasExistingBundle) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-8 px-6 ${className ?? ''}`}>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/30">
            <CheckCircleIcon className="h-20 w-20 text-green-600 dark:text-green-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Your Landing Page Package is Ready!
            </h2>
            <p className="text-lg text-muted-foreground">
              Generated on: {formatTimestamp(landingPageMeta.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col gap-4">
          <Button
            onClick={handleDownloadExisting}
            disabled={isDownloadingExisting}
            size="lg"
            className="h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            {isDownloadingExisting ? (
              <>
                <div className="mr-2 h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                Download Landing Page (.ZIP)
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              onClick={handleRegenerate}
              disabled={isGeneratingLandingPage}
              className="flex items-center gap-2"
            >
              {isGeneratingLandingPage ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleEditSettings}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Edit Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ACT I: Configuration Wizard
  return (
    <div className={`flex h-full flex-col gap-6 ${className ?? ''}`}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Landing Page Generator</h2>
        <p className="text-muted-foreground">
          Follow the steps below to build your project's landing page.
        </p>
      </div>

      {/* Step 1: App Store Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              1
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5" />
                App Store Configuration
              </CardTitle>
              <CardDescription>
                Provide your App Store ID to generate the download link
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appStoreId">App Store ID *</Label>
            <Input
              id="appStoreId"
              type="text"
              placeholder="e.g., 1234567890"
              value={formData.appStoreId}
              onChange={(e) => handleInputChange('appStoreId', e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Find your App Store ID in your app's URL on the App Store
            </p>
            {formData.appStoreId && (
              <div className="mt-2 space-y-1 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Generated URL
                </p>
                <a
                  href={generateAppStoreUrl(formData.appStoreId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {generateAppStoreUrl(formData.appStoreId)}
                </a>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="logo-upload">App Logo - Optional but recommended</Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Supports JPEG, PNG, SVG, WebP (max 2MB)
              </p>
              {!formData.logoFile && savedLogoInfo && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    Using saved logo{savedLogoInfo.originalName ? ` (${savedLogoInfo.originalName})` : ''}
                  </span>
                  {savedLogoInfo.publicUrl && (
                    <a
                      href={savedLogoInfo.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Preview
                    </a>
                  )}
                </div>
              )}
              {formData.logoFile && (
                <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-500">
                  <CheckCircleIcon className="h-4 w-4" />
                  {formData.logoFile.name}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Screenshot Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              2
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <PhotoIcon className="h-5 w-5" />
                Screenshot Selection
              </CardTitle>
              <CardDescription>
                Choose a marketing image from your project to feature on the landing page
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingImages ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-2 h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Loading images...</p>
              </div>
            </div>
          ) : projectImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 p-12 text-center">
              <PhotoIcon className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">No marketing images found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate marketing images in the Images tab first
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {projectImages.map((image) => (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => handleImageSelection(image.id)}
                  className={`group relative overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    formData.selectedImageId === image.id
                      ? 'border-primary shadow-lg ring-2 ring-primary ring-offset-2'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="relative flex aspect-[9/19] items-center justify-center bg-muted/20">
                    {mockupPreviews[image.id] ? (
                      <img
                        src={mockupPreviews[image.id]}
                        alt="Screenshot mockup"
                        className="h-full w-full object-contain"
                      />
                    ) : mockupErrors[image.id] ? (
                      <img
                        src={image.sourceScreenshotUrl || image.generatedImageUrl}
                        alt="Screenshot"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/40 border-t-transparent animate-spin" />
                        <span>Loading...</span>
                      </div>
                    )}
                  </div>
                  {formData.selectedImageId === image.id && (
                    <div className="absolute top-2 right-2">
                      <Badge className="flex items-center gap-1 text-xs bg-primary">
                        <CheckCircleIcon className="h-3 w-3" />
                        Selected
                      </Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Generate */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              3
            </div>
            <div>
              <CardTitle>Generate Your Package</CardTitle>
              <CardDescription>
                Once all required fields are complete, you're ready to build your site
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFormValid() && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-500">
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="h-5 w-5" />
                <span className="font-medium">Please complete all required fields above</span>
              </div>
            </div>
          )}
          
          {isFormValid() && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-500">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">Ready to generate landing page</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={handleGenerateLandingPage}
            disabled={!isFormValid() || isGeneratingLandingPage || isGeneratingMockups}
            size="lg"
            className="h-14 w-full max-w-md text-lg font-semibold"
          >
            {isGeneratingLandingPage ? (
              <>
                <div className="mr-2 h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Generating Landing Page...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Generate Landing Page
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
