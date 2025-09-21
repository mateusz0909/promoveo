import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowPathIcon, ClipboardDocumentIcon, CheckIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
  const [editingStates, setEditingStates] = useState<{[key: string]: boolean}>({});
  const [editValues, setEditValues] = useState<{[key: string]: string}>({});

  // Character limits for App Store compliance
  const characterLimits: {[key: string]: number} = {
    title: 30,
    subtitle: 30,
    promotionalText: 170,
    description: 4000,
    keywords: 100
  };

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

  const handleEdit = (contentType: string, currentContent: string) => {
    setEditingStates(prev => ({ ...prev, [contentType]: true }));
    setEditValues(prev => ({ ...prev, [contentType]: currentContent }));
  };

  const handleSaveEdit = async (contentType: string) => {
    const newValue = editValues[contentType] || '';
    
    // Exit edit mode first to prevent re-render issues
    setEditingStates(prev => ({ ...prev, [contentType]: false }));
    
    // Then update the content
    await onContentUpdate(contentType, newValue);
    
    // Clear edit values after successful update
    setEditValues(prev => ({ ...prev, [contentType]: '' }));
    toast.success('Content updated successfully!');
  };

  const handleCancelEdit = (contentType: string) => {
    setEditingStates(prev => ({ ...prev, [contentType]: false }));
    setEditValues(prev => ({ ...prev, [contentType]: '' }));
  };

  const getCharacterCount = (content: string, contentType: string) => {
    const limit = characterLimits[contentType];
    return limit ? `${content.length} / ${limit}` : '';
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
    const isEditing = editingStates[contentType];
    const editValue = editValues[contentType] || content;
    const characterCount = getCharacterCount(isEditing ? editValue : content, contentType);
    const limit = characterLimits[contentType];
    const isOverLimit = limit ? editValue.length > limit : false;

    return (
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{title}</h4>
              {characterCount && (
                <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {characterCount}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* Content Display or Edit Input */}
        <div className="mb-3">
          {isEditing ? (
            multiline ? (
              <textarea
                key={`${contentType}-textarea`}
                value={editValue}
                onChange={(e) => setEditValues(prev => ({ ...prev, [contentType]: e.target.value }))}
                className={`w-full min-h-[100px] p-3 border rounded-md text-sm resize-y ${
                  isOverLimit ? 'border-red-300 focus:border-red-500' : 'border-input focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Enter your content..."
                autoFocus
              />
            ) : (
              <input
                key={`${contentType}-input`}
                type="text"
                value={editValue}
                onChange={(e) => setEditValues(prev => ({ ...prev, [contentType]: e.target.value }))}
                className={`w-full p-3 border rounded-md text-sm ${
                  isOverLimit ? 'border-red-300 focus:border-red-500' : 'border-input focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Enter your content..."
                autoFocus
              />
            )
          ) : (
            <div className={`text-sm text-foreground ${multiline ? 'whitespace-pre-wrap' : ''} leading-relaxed p-3 bg-muted/25 rounded-md min-h-[48px] flex items-center`}>
              {content || <span className="text-muted-foreground italic">No content</span>}
            </div>
          )}
        </div>

        {/* Action Buttons - Always Visible */}
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            // Edit mode: Show Save/Cancel
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleCancelEdit.bind(null, contentType)}
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Cancel</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleSaveEdit.bind(null, contentType)}
                    size="sm" 
                    variant="ghost"
                    disabled={isOverLimit}
                    className={`h-8 w-8 p-0 ${isOverLimit ? 'text-red-500' : 'text-green-600 hover:text-green-700'}`}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isOverLimit ? 'Content exceeds limit' : 'Save changes'}</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            // View mode: Show Edit/Regenerate/Copy
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleEdit.bind(null, contentType, content)}
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Edit content</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleRegenerate.bind(null, contentType, content)}
                    size="sm" 
                    variant="ghost"
                    disabled={isLoading}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
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
                    onClick={handleCopy.bind(null, content, contentType)} 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
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
            </>
          )}
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
            AI-generated content for your app listing. Use the action buttons to edit, regenerate, or copy content.
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