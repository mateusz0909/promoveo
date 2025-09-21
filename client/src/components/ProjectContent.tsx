import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ImagesTab } from './tabs/ImagesTab';
import { AppStoreContentTab } from './tabs/AppStoreContentTab';
import { ProjectOverviewTab } from './tabs/ProjectOverviewTab';
import { ImageEditor } from './ImageEditor';
import { toast } from "sonner";
import { useAuth } from '../context/AuthContext';

interface GeneratedText {
  title: string;
  subtitle: string;
  promotionalText: string;
  description: string;
  keywords: string;
  headings: {
    heading: string;
    subheading: string;
  }[];
}

interface ProjectContentProps {
  appName: string;
  appDescription: string;
  generatedText: GeneratedText | null;
  generatedImages: any[];
  setAppName: (name: string) => void;
  setAppDescription: (description: string) => void;
  setGeneratedText: (text: GeneratedText | null) => void;
  onImageSave: (newImageUrl: string, imageIndex: number, configuration: any) => Promise<void>;
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
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageList, setImageList] = useState<any[]>([]);

  useEffect(() => {
    setImageList(props.generatedImages);
  }, [props.generatedImages]);

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
    } else if (path.includes('/details')) {
      return 'overview';
    } else if (path.includes('/images') || path.match(/\/project\/[^/]+$/)) {
      // Default to images for base project route or explicit images route
      return 'images';
    }
    
    // Fallback to images
    return 'images';
  };

  // Handler functions from Step3
  const handleImageSave = async (newImageUrl: string, imageIndex: number, configuration: any) => {
    const newImageList = [...imageList];
    const imageToUpdate = newImageList[imageIndex];
    const oldImageUrl = imageToUpdate.generatedImageUrl;
    
    imageToUpdate.generatedImageUrl = newImageUrl;
    imageToUpdate.configuration = configuration;
    setImageList(newImageList);

    await props.onImageSave(newImageUrl, imageIndex, configuration);

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

  const handleEdit = (image: any, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
    setIsEditorOpen(true);
  };

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard!");
  }, []);

  const handleDownloadAll = async () => {
    if (props.generatedImages.length === 0) {
      toast.info("No images to download.");
      return;
    }

    toast.info("Preparing images for download...");

    try {
      const fullImageUrls = props.generatedImages.map(image => image.generatedImageUrl);

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
    if (!props.projectId) {
      toast.error("No project selected.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${props.projectId}`, {
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
    if (!props.generatedText || !props.projectId) return;
    
    const updatedText = { ...props.generatedText };
    
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
    props.setGeneratedText(updatedText);

    // Persist changes to database
    try {
      const response = await fetch(`/api/projects/${props.projectId}/content`, {
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
      // props.setGeneratedText(props.generatedText);
    }
  };

  // Memoize imageDescriptions to prevent unnecessary re-renders
  const imageDescriptions = useMemo(() => {
    return props.generatedImages.map(img => img.description || '');
  }, [props.generatedImages]);

  // Memoize handleContentUpdate to prevent ContentSection re-renders
  const memoizedHandleContentUpdate = useCallback(handleContentUpdate, [
    props.generatedText, 
    props.projectId, 
    props.setGeneratedText, 
    session?.access_token
  ]);

  const currentView = getCurrentView();

  // Render appropriate content based on current view (controlled by sidebar navigation)
  return (
    <div className="w-full">
      {currentView === 'content' && (
        <AppStoreContentTab 
          generatedText={props.generatedText}
          onCopy={handleCopy}
          appName={props.appName}
          appDescription={props.appDescription}
          imageDescriptions={imageDescriptions}
          onContentUpdate={memoizedHandleContentUpdate}
        />
      )}
      
      {currentView === 'overview' && (
        <ProjectOverviewTab 
          appName={props.appName}
          appDescription={props.appDescription}
          generatedImages={props.generatedImages}
          onAppNameChange={props.setAppName}
          onAppDescriptionChange={props.setAppDescription}
          onDeleteProject={handleDeleteProject}
          projectId={props.projectId}
          createdAt={props.createdAt}
          updatedAt={props.updatedAt}
          language={props.language}
          device={props.device}
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

      <ImageEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageData={selectedImage}
        imageIndex={selectedImageIndex}
        fonts={fonts}
        onSave={handleImageSave}
        projectId={props.projectId}
        device={props.device}
      />
    </div>
  );
};