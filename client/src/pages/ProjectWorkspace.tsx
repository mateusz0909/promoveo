import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Step1 } from "@/components/Step1";
import { Step2 } from "@/components/Step2";
import { ProjectContent } from "@/components/ProjectContent";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { useProject } from "@/context/ProjectContext";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import type { GeneratedImage, GeneratedImageConfiguration, GeneratedText } from '@/types/project';

// This component will wrap the multi-step form for creating/editing a project
export function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const session = auth?.session;
  const { setParts } = useBreadcrumb();
  const { setCurrentProject } = useProject();

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [language, setLanguage] = useState("English");
  const [device, setDevice] = useState("iPhone");
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState<GeneratedText | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | undefined>();
  const [projectCreatedAt, setProjectCreatedAt] = useState<string | undefined>();
  const [projectUpdatedAt, setProjectUpdatedAt] = useState<string | undefined>();

  useEffect(() => {
    if (id) {
      setParts([{ name: appName || 'Project' }]);
    } else {
      setParts([{ name: 'New Project' }]);
    }
  }, [id, appName, setParts]);

  // Redirect base project route to images
  useEffect(() => {
    if (id && location.pathname === `/project/${id}`) {
      navigate(`/project/${id}/images`, { replace: true });
    }
  }, [id, location.pathname, navigate]);

  useEffect(() => {
    if (id && session) {
      const fetchProject = async () => {
        setIsLoadingProject(true);
        try {
          const response = await fetch(`/api/projects/${id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch project data.');
          }

          const project = await response.json();
          
          setAppName(project.inputAppName);
          setAppDescription(project.inputAppDescription);
          setGeneratedText(project.generatedAsoText);
          setGeneratedImages(project.generatedImages);
          setDevice(project.device || 'iPhone');
          setLanguage(project.language || 'English');
          setProjectCreatedAt(project.createdAt);
          setProjectUpdatedAt(project.updatedAt);

          // Set current project in context for TopPanel
          setCurrentProject({
            id: project.id,
            name: project.inputAppName,
            device: project.device || 'iPhone'
          });

          setStep(3);

        } catch (error) {
          console.error(error);
          toast.error("Could not load the project.");
        } finally {
          setIsLoadingProject(false);
        }
      };

      fetchProject();
    } else if (!id) {
      // Clear project context when creating new project
      setCurrentProject(null);
    }
  }, [id, session, setCurrentProject]);

  // Cleanup project context when component unmounts or route changes away from projects
  useEffect(() => {
    return () => {
      // Only clear if we're navigating completely away from projects
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/project/')) {
        setCurrentProject(null);
      }
    };
  }, [location.pathname, setCurrentProject]);


  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  
  const handleImageSave = async (newImageUrl: string, imageIndex: number, configuration: GeneratedImageConfiguration) => {
    const updatedImages = [...generatedImages];
    const imageToUpdate = updatedImages[imageIndex];
    if (!imageToUpdate) {
      return;
    }
    imageToUpdate.generatedImageUrl = `${newImageUrl}`;
    imageToUpdate.configuration = configuration;
    setGeneratedImages(updatedImages);
  };

  const handleGenerateAndSave = async () => {
    if (files.length === 0 || !appName || !appDescription) {
      toast.error("Please fill out all fields and select at least one file.");
      return;
    }

    if (!session) {
      toast.error("Please log in to create a project.");
      return;
    }

    setIsLoading(true);

    const data = new FormData();
    data.append('appName', appName);
    data.append('appDescription', appDescription);
    data.append('language', language);
    data.append('device', device);

    const descriptions = files.map((file, i) => ({
      heading: imageDescriptions[i] || file.name,
      subheading: ' ',
      font: {
        headingFont: 'Farro',
        subheadingFont: 'Headland One',
        headingFontSize: 120,
        subheadingFontSize: 69,
      },
    }));

    data.append('imageDescriptions', JSON.stringify(descriptions));

    for (let i = 0; i < files.length; i++) {
      data.append('screenshots', files[i]);
    }

    try {
      const response = await fetch('/api/generate-and-save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: data,
      });

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
        throw new Error(typeof errorData === 'string' ? errorData : errorData.error || 'Failed to generate project.');
      }

      const newProject = await response.json();
      setGeneratedText(newProject.generatedAsoText);
      setGeneratedImages(newProject.generatedImages);
      setCreatedProjectId(newProject.id);
      
      // Navigate to the project images section if we're creating a new project
      if (!id && newProject.id) {
        navigate(`/project/${newProject.id}/images`, { replace: true });
      }
      
      setStep(3);

    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Error generating content. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex justify-center items-center h-64">
        
        <p className="ml-2">Loading project </p>
        <Spinner variant="bars"/>
      </div>
    );
  }

  return (
    <>
      {step === 1 && (
        <Step1
          appName={appName}
          setAppName={setAppName}
          appDescription={appDescription}
          setAppDescription={setAppDescription}
          files={files}
          setFiles={setFiles}
          language={language}
          setLanguage={setLanguage}
          device={device}
          setDevice={setDevice}
          onNext={handleNext}
        />
      )}
      {step === 2 && files.length > 0 && (
        <Step2
          files={files}
          imageDescriptions={imageDescriptions}
          setImageDescriptions={setImageDescriptions}
          onGenerate={handleGenerateAndSave}
          onBack={handleBack}
          isLoading={isLoading}
        />
      )}
      {step === 3 && (
        <ProjectContent
          appName={appName}
          appDescription={appDescription}
          generatedText={generatedText}
          generatedImages={generatedImages}
          setAppName={setAppName}
          setAppDescription={setAppDescription}
          setGeneratedText={setGeneratedText}
          onImageSave={handleImageSave}
          projectId={id || createdProjectId}
          device={device}
          language={language}
          createdAt={projectCreatedAt}
          updatedAt={projectUpdatedAt}
        />
      )}
    </>
  );
}
