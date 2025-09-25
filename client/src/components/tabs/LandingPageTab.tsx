import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  PhotoIcon, 
  CloudArrowUpIcon, 
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

  useEffect(() => {
    hasLoadedInitialConfig.current = false;
    setSavedLogoInfo(null);
    setLandingPageMeta({ downloadUrl: null, updatedAt: null });
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

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString();
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No project selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <GlobeAltIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Landing Page Generator</h2>
          <p className="text-muted-foreground">
            Customize your landing page with app store link, logo, and screenshot
          </p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Saved landing page package
          </CardTitle>
          <CardDescription>
            Your most recent landing page ZIP is stored for quick access. Regenerate after making updates to keep it fresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
              Loading saved configuration...
            </div>
          ) : landingPageMeta.downloadUrl ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Latest package ready to download</p>
                {landingPageMeta.updatedAt && (
                  <p className="text-sm text-muted-foreground">
                    Generated {formatTimestamp(landingPageMeta.updatedAt)}
                  </p>
                )}
                {savedLogoInfo && (
                  <p className="text-xs text-muted-foreground">
                    Saved logo: {savedLogoInfo.originalName || 'Custom logo'}{' '}
                    {savedLogoInfo.publicUrl && (
                      <a
                        href={savedLogoInfo.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Preview
                      </a>
                    )}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={handleDownloadExisting}
                className="w-full md:w-auto"
                disabled={isDownloadingExisting}
              >
                {isDownloadingExisting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download latest ZIP
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No landing page package yet. Complete the form and select Generate & Download when you’re ready.
            </p>
          )}
        </CardContent>
      </Card>

      {/* App Store Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5" />
            App Store Configuration
          </CardTitle>
          <CardDescription>
            Provide your App Store ID to generate the download link
          </CardDescription>
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
              <div className="mt-2">
                <p className="text-sm font-medium">Generated URL:</p>
                <p className="text-sm text-blue-600 break-all">
                  {generateAppStoreUrl(formData.appStoreId)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudArrowUpIcon className="h-5 w-5" />
            App Logo
          </CardTitle>
          <CardDescription>
            Upload your app logo to display in the landing page header
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="sr-only">
                  Upload logo
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JPEG, PNG, SVG, WebP (max 2MB)
                </p>
                {!formData.logoFile && savedLogoInfo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span>Using saved logo{savedLogoInfo.originalName ? ` (${savedLogoInfo.originalName})` : ''}</span>
                    {savedLogoInfo.publicUrl && (
                      <a
                        href={savedLogoInfo.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Preview
                      </a>
                    )}
                  </div>
                )}
              </div>
              {formData.logoFile && (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {formData.logoFile.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5" />
            Screenshot Mockup Selection
          </CardTitle>
          <CardDescription>
            Choose a marketing image from your project to feature on the landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingImages ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading images...</p>
              </div>
            </div>
          ) : projectImages.length === 0 ? (
            <div className="text-center py-8">
              <PhotoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No marketing images found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate some marketing images in the Images tab first
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {projectImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                    formData.selectedImageId === image.id
                      ? 'border-primary shadow-md'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => handleImageSelection(image.id)}
                >
                  <div className="h-100  flex items-center justify-center overflow-hidden">
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
                        <div className="h-6 w-6 border-2 border-muted-foreground/40 border-t-transparent rounded-full animate-spin" />
                        <span>Preparing mockup...</span>
                      </div>
                    )}
                  </div>
                  {formData.selectedImageId === image.id && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-xs">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {isGeneratingMockups ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
              Preparing previews...
            </span>
          ) : isLoadingConfig ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
              Loading saved configuration...
            </span>
          ) : isFormValid() ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              Ready to generate landing page
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ExclamationCircleIcon className="h-4 w-4" />
              Please complete all required fields
            </span>
          )}
        </div>
        <Button
          onClick={handleGenerateLandingPage}
          disabled={!isFormValid() || isGeneratingLandingPage || isGeneratingMockups}
          size="lg"
        >
          {isGeneratingLandingPage ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Generating...
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Generate & Download
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
