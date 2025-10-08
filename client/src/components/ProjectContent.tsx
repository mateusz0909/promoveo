import React, { useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ImagesTab } from './tabs/ImagesTab';
import { AppStoreContentTab } from './tabs/AppStoreContentTab';
import { ProjectOverviewTab } from './tabs/ProjectOverviewTab';
import { LandingPageTab } from './tabs/LandingPageTab';
import { toast } from "sonner";
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { renderScreenshotToCanvas } from './studio-editor/canvasRenderer';
import JSZip from 'jszip';
import type { GeneratedImage, GeneratedImageConfiguration, GeneratedText } from '@/types/project';
import { FONT_FAMILIES, preloadFontFamilies } from '@/lib/fonts';

type CanvasRenderConfiguration = Parameters<typeof renderScreenshotToCanvas>[1]['configuration'];

const omitNullish = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map((item) => omitNullish(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, val]) => {
        const cleaned = omitNullish(val);
        if (cleaned !== undefined) {
          acc[key] = cleaned;
        }
        return acc;
      },
      {}
    );
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  return value;
};

const normalizeConfiguration = (
  config: GeneratedImageConfiguration | null | undefined
): CanvasRenderConfiguration => {
  const cleaned = omitNullish(config ?? {}) ?? {};
  return cleaned as CanvasRenderConfiguration;
};

interface ProjectContentProps {
  appName: string;
  appDescription: string;
  generatedText: GeneratedText | null;
  generatedImages: GeneratedImage[];
  setAppName: (name: string) => void;
  setAppDescription: (description: string) => void;
  setGeneratedText: (text: GeneratedText | null) => void;
  projectId?: string;
  device?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ProjectContent: React.FC<ProjectContentProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { setOnDownloadAll } = useProject();

  const {
    appName,
    appDescription,
    generatedText,
    generatedImages,
    setAppName,
    setAppDescription,
    setGeneratedText,
    projectId,
    device,
    language,
    createdAt,
    updatedAt,
  } = props;

  useEffect(() => {
    void preloadFontFamilies(FONT_FAMILIES);
  }, []);

  // Determine which content to show based on URL
  const getCurrentView = () => {
    const path = location.pathname;
    
    // Check for explicit sub-routes
    if (path.includes('/text-content')) {
      return 'content';
    } else if (path.includes('/overview')) {
      return 'overview';
    } else if (path.includes('/landing-page')) {
      return 'landing-page';
    } else if (path.includes('/images') || path.match(/\/project\/[^/]+$/)) {
      // Default to images for base project route or explicit images route
      return 'images';
    }
    
    // Fallback to images
    return 'images';
  };

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard!");
  }, []);

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) {
      toast.info("No images to download.");
      return;
    }

    const toastId = toast.loading("Generating images...");

    try {
      const zip = new JSZip();

      // Generate each image from configuration
      for (let i = 0; i < generatedImages.length; i++) {
  const image = generatedImages[i];
  const configuration = normalizeConfiguration(image.configuration);

        // Create a temporary canvas for this image
  const canvas = document.createElement('canvas');
  canvas.width = 1242;
  canvas.height = 2688;

        // Render the screenshot using the same logic as the editor
        await renderScreenshotToCanvas(canvas, {
          sourceScreenshotUrl: image.sourceScreenshotUrl || '',
          configuration,
          device: device || 'iPhone',
          index: i, // Pass the screenshot index
          totalImages: generatedImages.length, // Pass total count for gradient interpolation
        });

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        // Add to ZIP
        zip.file(`image_${i + 1}.png`, blob);
        
        // Update progress
        toast.loading(`Generating image ${i + 1}/${generatedImages.length}...`, { id: toastId });
      }

      toast.loading("Creating ZIP file...", { id: toastId });

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      console.log('ZIP blob created:', zipBlob.size, 'bytes');

      // Create download link with proper MIME type
      const url = URL.createObjectURL(new Blob([zipBlob], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${appName || 'app_images'}_${Date.now()}.zip`;
      link.style.display = 'none';
      
      console.log('Download link created:', link.download);
      
      // Add to DOM, trigger click, and clean up
      document.body.appendChild(link);
      
      // Use requestAnimationFrame to ensure the link is in the DOM before clicking
      requestAnimationFrame(() => {
        console.log('Triggering download click...');
        link.click();
        
        // Clean up after download starts
        setTimeout(() => {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
          console.log('Download cleanup completed');
        }, 1000);
      });
      
      toast.success("ZIP file downloaded successfully!", { id: toastId });

    } catch (error) {
      console.error("Error downloading images:", error);
      toast.error("Failed to download images. Please try again.", { id: toastId });
    }
  };

  // Set download callback in context when on images tab
  const currentView = getCurrentView();
  useEffect(() => {
    if (currentView === 'images') {
      setOnDownloadAll(handleDownloadAll);
    } else {
      setOnDownloadAll(null);
    }
    return () => setOnDownloadAll(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const handleDeleteProject = async () => {
    if (!projectId) {
      toast.error("No project selected.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast.success("Project deleted successfully!");
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project.");
    }
  }

  const handleContentUpdate = async (contentType: string, newContent: string) => {
    if (!generatedText || !projectId) return;
    
    const updatedText = { ...generatedText };
    
    switch (contentType) {
      case 'title':
        updatedText.title = newContent;
        break;
      case 'subtitle':
        updatedText.subtitle = newContent;
        break;
      case 'promotionalText':
        updatedText.promotionalText = newContent;
        break;
      case 'description':
        updatedText.description = newContent;
        break;
      case 'keywords':
        updatedText.keywords = newContent;
        break;
      default:
        console.warn(`Unknown content type: ${contentType}`);
        return;
    }
    
    // Update local state immediately for responsive UI
  setGeneratedText(updatedText);

    // Persist changes to database
    try {
  const response = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          generatedAsoText: updatedText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes to database');
      }

      console.log('Content updated and saved to database successfully');
    } catch (error) {
      console.error('Error saving content to database:', error);
      toast.error('Failed to save changes. Please try again.');
      // Optionally revert the local state change on error
  // setGeneratedText(generatedText);
    }
  };

  // Memoize imageDescriptions to prevent unnecessary re-renders
  const imageDescriptions = useMemo(() => {
    return generatedImages.map(img => img.description || '');
  }, [generatedImages]);

  // Memoize handleContentUpdate to prevent ContentSection re-renders
  const memoizedHandleContentUpdate = useCallback(handleContentUpdate, [
    generatedText, 
    projectId, 
    setGeneratedText, 
    session?.access_token
  ]);

  // Render appropriate content based on current view (controlled by sidebar navigation)
  return (
    <div className="w-full h-full">
      {currentView === 'content' && (
        <AppStoreContentTab 
          generatedText={generatedText}
          onCopy={handleCopy}
          appName={appName}
          appDescription={appDescription}
          imageDescriptions={imageDescriptions}
          onContentUpdate={memoizedHandleContentUpdate}
          language={language}
        />
      )}
      
      {currentView === 'overview' && (
        <ProjectOverviewTab 
          appName={appName}
          appDescription={appDescription}
          generatedImages={generatedImages}
          onAppNameChange={setAppName}
          onAppDescriptionChange={setAppDescription}
          onDeleteProject={handleDeleteProject}
          projectId={projectId}
          createdAt={createdAt}
          updatedAt={updatedAt}
          language={language}
          device={device}
        />
      )}
      
      {currentView === 'images' && (
        <ImagesTab 
          imageList={generatedImages}
          projectId={projectId}
          appName={appName}
          appDescription={appDescription}
          device={device}
        />
      )}

      {currentView === 'landing-page' && (
        <LandingPageTab />
      )}
    </div>
  );
};