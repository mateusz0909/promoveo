import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ImagesTab } from "./tabs/ImagesTab";
import { AppStoreContentTab } from "./tabs/AppStoreContentTab";
import { ProjectOverviewTab } from "./tabs/ProjectOverviewTab";
import { LandingPageTab } from "./tabs/LandingPageTab";
import type { GeneratedImage, GeneratedText } from '@/types/project';

interface Step3Props {
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

export const Step3 = ({ appName, appDescription, generatedText, generatedImages, setAppName, setAppDescription, setGeneratedText, projectId, device, language, createdAt, updatedAt }: Step3Props) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard!");
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
    <div className="w-full">
      <Tabs defaultValue="images">
        <TabsList className='bg-background border'>
          <TabsTrigger 
          value="images"
          className='data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'> Images</TabsTrigger>
          <TabsTrigger value="text-content"
          className='data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary  data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'>App Store Content</TabsTrigger>
          <TabsTrigger value="project-overview"
          className='data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary  data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'>
            Project Overview</TabsTrigger>
          <TabsTrigger value="landing-page"
          className='data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary  data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'>
            Landing Page</TabsTrigger>
        </TabsList>
        <TabsContent value="images" className="w-full">
          <ImagesTab 
            imageList={generatedImages}
            projectId={projectId}
            appName={appName}
            appDescription={appDescription}
          />
        </TabsContent>
        <TabsContent value="text-content" className="w-full">
          <AppStoreContentTab 
            generatedText={generatedText}
            onCopy={handleCopy}
            appName={appName}
            appDescription={appDescription}
            imageDescriptions={generatedImages.map(img => img.description || '')}
            onContentUpdate={handleContentUpdate}
            language={language}
          />
        </TabsContent>
  <TabsContent value="project-overview" className="w-full">
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
        <TabsContent value="landing-page" className="w-full">
          <LandingPageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};