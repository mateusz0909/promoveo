import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Step1 } from "@/components/Step1";
import { Step2 } from "@/components/Step2";
import { Step3 } from "@/components/Step3";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

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



// This component will wrap the multi-step form for creating/editing a project
export function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const session = auth?.session;
  const { setParts } = useBreadcrumb();

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [language, setLanguage] = useState("English");
  const [device, setDevice] = useState("iPhone");
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState<GeneratedText | null>(null);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [sourceScreenshotUrls, setSourceScreenshotUrls] = useState<string[]>([]);
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
          setSourceScreenshotUrls(project.generatedImages.map((img: any) => img.sourceScreenshotUrl));
          setDevice(project.device || 'iPhone');
          setLanguage(project.language || 'English');
          setProjectCreatedAt(project.createdAt);
          setProjectUpdatedAt(project.updatedAt);

          setStep(3);

        } catch (error) {
          console.error(error);
          toast.error("Could not load the project.");
        } finally {
          setIsLoadingProject(false);
        }
      };

      fetchProject();
    }
  }, [id, session]);


  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  
  const handleImageSave = async (newImageUrl: string, imageIndex: number, configuration: any) => {
    const updatedImages = [...generatedImages];
    updatedImages[imageIndex].generatedImageUrl = `${newImageUrl}`;
    updatedImages[imageIndex].configuration = configuration;
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
    data.append('projectName', appName);
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
      setSourceScreenshotUrls(newProject.generatedImages.map((img: any) => img.sourceScreenshotUrl));
      setCreatedProjectId(newProject.id);
      
      // Navigate to the project-specific URL if we're creating a new project
      if (!id && newProject.id) {
        navigate(`/project/${newProject.id}`, { replace: true });
      }
      
      setStep(3);

    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Error generating content. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateImages = async (options: any) => {
    if (generatedImages.length === 0 || !generatedText) {
      toast.error("Something went wrong. Please start over.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/regenerate-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          generatedImages,
          // @ts-ignore
          headings: generatedText.headings,
          headingFontFamily: options.headingFont,
          subheadingFontFamily: options.subheadingFont,
          headingFontSize: options.headingFontSize,
          subheadingFontSize: options.subheadingFontSize,
        }),
      });

      const data = await response.json();
      const cacheBustedImages = data.images.map((image: any) => ({
        ...image,
        generatedImageUrl: `${image.generatedImageUrl}?t=${new Date().getTime()}`
      }));
      setGeneratedImages(cacheBustedImages);
    } catch (error) {
      console.error("Error regenerating images:", error);
      toast.error("Error regenerating images. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateWithAI = async () => {
    if (generatedImages.length === 0 || !appName || !appDescription) {
      toast.error("Please fill out all fields and select at least one file.");
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch("/api/regenerate-with-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          generatedImages,
          appName,
          appDescription,
        }),
      });

      const data = await response.json();
      const cacheBustedImages = data.images.map((image: any) => ({
        ...image,
        generatedImageUrl: `${image.generatedImageUrl}?t=${new Date().getTime()}`
      }));
      setGeneratedText(data.text);
      setGeneratedImages(cacheBustedImages);
    } catch (error) {
      console.error("Error regenerating with AI:", error);
      toast.error("Error regenerating with AI. Please check the console for details.");
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
        <Step3
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
