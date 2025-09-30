import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ImagesTab } from './tabs/ImagesTab';
import { AppStoreContentTab } from './tabs/AppStoreContentTab';
import { ProjectOverviewTab } from './tabs/ProjectOverviewTab';
import { LandingPageTab } from './tabs/LandingPageTab';
import { ImageEditor } from './ImageEditor';
import { toast } from "sonner";
import { useAuth } from '../context/AuthContext';
import type { GeneratedImage, GeneratedImageConfiguration, GeneratedText } from '@/types/project';

interface ProjectContentProps {
  appName: string;
  appDescription: string;
  generatedText: GeneratedText | null;
  generatedImages: GeneratedImage[];
  setAppName: (name: string) => void;
  setAppDescription: (description: string) => void;
  setGeneratedText: (text: GeneratedText | null) => void;
  onImageSave: (newImageUrl: string, imageIndex: number, configuration: GeneratedImageConfiguration) => Promise<void>;
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
  const [fonts, setFonts] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageList, setImageList] = useState<GeneratedImage[]>([]);

  const {
    appName,
    appDescription,
    generatedText,
    generatedImages,
    setAppName,
    setAppDescription,
    setGeneratedText,
    onImageSave,
    projectId,
    device,
    language,
    createdAt,
    updatedAt,
  } = props;

  useEffect(() => {
    setImageList(generatedImages);
  }, [generatedImages]);

  useEffect(() => {
    fetch("http://localhost:3001/api/fonts")
      .then(res => res.json())
      .then(data => setFonts(data))
      .catch(err => console.error("Error fetching fonts:", err));
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

  // Handler functions from Step3
  const handleImageSave = async (newImageUrl: string, imageIndex: number, configuration: GeneratedImageConfiguration) => {
    const newImageList = [...imageList];
    const imageToUpdate = newImageList[imageIndex];
    if (!imageToUpdate) {
      return;
    }

    const oldImageUrl = imageToUpdate.generatedImageUrl;
    
    imageToUpdate.generatedImageUrl = newImageUrl;
    imageToUpdate.configuration = configuration;
    setImageList(newImageList);

  await onImageSave(newImageUrl, imageIndex, configuration);

    if (oldImageUrl && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            const cache = await caches.open(cacheName);
            await cache.delete(oldImageUrl);
          })
        );
        console.log('Successfully invalidated old cached image:', oldImageUrl);
      } catch (error) {
        console.warn('Failed to invalidate old cached image:', error);
      }
    }
  };

  const handleDownloadSingleImage = async (imageUrl: string) => {
    try {
      toast.info("Starting download...");
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = imageUrl.split('/').pop()?.split('?')[0] || `image-${Date.now()}.png`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image.");
    }
  };

  const handleEdit = (image: GeneratedImage, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
    setIsEditorOpen(true);
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

    toast.info("Preparing images for download...");

    try {
      const fullImageUrls = generatedImages
        .map(image => image.generatedImageUrl)
        .filter((url): url is string => Boolean(url));

      if (fullImageUrls.length === 0) {
        toast.info("No images available for download.");
        return;
      }

      const response = await fetch("http://localhost:3001/api/download-images-zip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrls: fullImageUrls }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Images downloaded successfully!");

    } catch (error) {
      console.error("Error downloading images:", error);
      toast.error("Failed to download images. Please try again.");
    }
  };

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

  const currentView = getCurrentView();

  // Render appropriate content based on current view (controlled by sidebar navigation)
  return (
    <div className="w-full">
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
          imageList={imageList}
          onDownloadAll={handleDownloadAll}
          onDownloadSingle={handleDownloadSingleImage}
          onEdit={handleEdit}
        />
      )}

      {currentView === 'landing-page' && (
        <LandingPageTab />
      )}

      <ImageEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageData={selectedImage}
        imageIndex={selectedImageIndex}
        fonts={fonts}
        onSave={handleImageSave}
        projectId={projectId}
        device={device}
        appName={appName}
        appDescription={appDescription}
      />
    </div>
  );
};