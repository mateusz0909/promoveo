import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowPathIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

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

interface AppStoreContentTabProps {
  generatedText: GeneratedText | null;
  onCopy: (text: string) => void;
  appName: string;
  appDescription: string;
  imageDescriptions?: string[];
  onContentUpdate: (contentType: string, newContent: string) => void;
}

export const AppStoreContentTab = ({ 
  generatedText, 
  onCopy, 
  appName, 
  appDescription, 
  imageDescriptions,
  onContentUpdate 
}: AppStoreContentTabProps) => {
  const { session } = useAuth();
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const handleCopy = async (text: string, contentType: string) => {
    await onCopy(text);
    setCopiedStates(prev => ({ ...prev, [contentType]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [contentType]: false }));
    }, 2000);
  };

  const handleRegenerate = async (contentType: string, currentContent: string) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to regenerate content.");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [contentType]: true }));
    
    try {
      toast.info(`Regenerating ${contentType}...`);
      
      const response = await fetch("http://localhost:3001/api/regenerate-content-part", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          appName,
          appDescription,
          imageDescriptions,
          contentType,
          currentContent,
          language: 'English'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const newContent = result[contentType];
      
      if (newContent) {
        onContentUpdate(contentType, newContent);
        toast.success(`${contentType} regenerated successfully!`);
      } else {
        throw new Error("No content received from API");
      }
      
    } catch (error) {
      console.error(`Error regenerating ${contentType}:`, error);
      toast.error(`Failed to regenerate ${contentType}. Please try again.`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [contentType]: false }));
    }
  };

  const ContentSection = ({ 
    title, 
    content, 
    contentType, 
    description,
    multiline = false 
  }: { 
    title: string; 
    content: string; 
    contentType: string; 
    description?: string;
    multiline?: boolean;
  }) => {
    const isLoading = loadingStates[contentType];
    const isCopied = copiedStates[contentType];

    return (
      <div className="group border rounded-lg p-4 hover:bg-muted/25 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-sm">{title}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => handleRegenerate(contentType, content)}
                  size="sm" 
                  variant="ghost"
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ArrowPathIcon className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Regenerate with AI</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => handleCopy(content, contentType)} 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  {isCopied ? (
                    <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isCopied ? 'Copied!' : 'Copy to clipboard'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className={`text-sm text-foreground ${multiline ? 'whitespace-pre-wrap' : ''} leading-relaxed`}>
          {content}
        </div>
      </div>
    );
  };
  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">App Store Content</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-generated content for your app listing. Hover over sections to reveal actions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedText ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Localizable Information</h3>
                {generatedText.title && (
                  <ContentSection
                    title="Name"
                    content={generatedText.title}
                    contentType="title"
                    description="The main title for your app listing"
                  />
                )}
                {generatedText.subtitle && (
                  <ContentSection
                    title="Subtitle"
                    content={generatedText.subtitle}
                    contentType="subtitle"
                    description="A brief tagline that appears under your app name"
                  />
                )}
              </div>

              {/* Marketing Content */}
              {(generatedText.promotionalText || generatedText.description) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Marketing Content</h3>
                  {generatedText.promotionalText && (
                    <ContentSection
                      title="Promotional Text"
                      content={generatedText.promotionalText}
                      contentType="promotionalText"
                      description="Short promotional text for marketing materials"
                    />
                  )}
                  {generatedText.description && (
                    <ContentSection
                      title="Description"
                      content={generatedText.description}
                      contentType="description"
                      description="Full app description for the store listing"
                      multiline={true}
                    />
                  )}
                </div>
              )}

              {/* SEO & Discovery */}
              {generatedText.keywords && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">SEO & Discovery</h3>
                  <ContentSection
                    title="Keywords"
                    content={generatedText.keywords}
                    contentType="keywords"
                    description="Search keywords to help users find your app"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No content generated yet. Complete the previous steps to generate App Store content.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};