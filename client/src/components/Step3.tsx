import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ImageEditor } from "./ImageEditor";
import { ImagesTab } from "./tabs/ImagesTab";
import { AppStoreContentTab } from "./tabs/AppStoreContentTab";
import { ProjectOverviewTab } from "./tabs/ProjectOverviewTab";

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

interface Step3Props {
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

export const Step3 = ({ appName, appDescription, generatedText, generatedImages, setAppName, setAppDescription, setGeneratedText, onImageSave, projectId, device, language, createdAt, updatedAt }: Step3Props) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [fonts, setFonts] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageList, setImageList] = useState<any[]>([]);

  useEffect(() => {
    setImageList(generatedImages);
  }, [generatedImages]);

  useEffect(() => {
    fetch("http://localhost:3001/api/fonts")
      .then(res => res.json())
      .then(data => setFonts(data))
      .catch(err => console.error("Error fetching fonts:", err));
  }, []);

  const handleImageSave = async (newImageUrl: string, imageIndex: number, configuration: any) => {
    const newImageList = [...imageList];
    const imageToUpdate = newImageList[imageIndex];
    const oldImageUrl = imageToUpdate.generatedImageUrl;
    
    // Update with new immutable URL
    imageToUpdate.generatedImageUrl = newImageUrl;
    imageToUpdate.configuration = configuration;
    setImageList(newImageList);

    // Call the original onImageSave to update the parent state
    await onImageSave(newImageUrl, imageIndex, configuration);

    // Force invalidate old cached image if it exists in browser cache
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard!");
  };

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) {
      toast.info("No images to download.");
      return;
    }

    toast.info("Preparing images for download...");

    try {
      const fullImageUrls = generatedImages.map(image => image.generatedImageUrl);

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

  const handleContentUpdate = (contentType: string, newContent: string) => {
    if (!generatedText) return;
    
    const updatedText = { ...generatedText };
    
    // Handle the different content types properly
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
    
    setGeneratedText(updatedText);
  };

  return (
    <div className="w-full max-w-8xl mx-auto">
      <Tabs defaultValue="images">
        <TabsList className='bg-background border'>
          <TabsTrigger 
          value="images"
          className='data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'> Images</TabsTrigger>
          <TabsTrigger value="text-content"
          className='data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary  data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'>App Store Content</TabsTrigger>
          <TabsTrigger value="project-details"
          className='data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary  data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'>
            Project Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="images">
          <ImagesTab 
            imageList={imageList}
            onDownloadAll={handleDownloadAll}
            onDownloadSingle={handleDownloadSingleImage}
            onEdit={handleEdit}
          />
        </TabsContent>
        <TabsContent value="text-content">
          <AppStoreContentTab 
            generatedText={generatedText}
            onCopy={handleCopy}
            appName={appName}
            appDescription={appDescription}
            imageDescriptions={generatedImages.map(img => img.description || '')}
            onContentUpdate={handleContentUpdate}
          />
        </TabsContent>
        <TabsContent value="project-details">
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
        </TabsContent>
      </Tabs>

      <ImageEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageData={selectedImage}
        imageIndex={selectedImageIndex}
        fonts={fonts}
        onSave={handleImageSave}
        projectId={projectId}
        device={device}
      />
    </div>
  );
};