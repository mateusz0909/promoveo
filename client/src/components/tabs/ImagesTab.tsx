import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { LazyImage } from '../LazyImage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { PencilIcon, ArrowDownTrayIcon, PhotoIcon, FolderArrowDownIcon, EyeIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useState } from 'react';
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";
import type { GeneratedImage, TemplateSummary } from '@/types/project';

interface ImagesTabProps {
  imageList: GeneratedImage[];
  onDownloadAll: () => Promise<void>;
  onDownloadSingle: (imageUrl: string) => Promise<void>;
  onEdit: (image: GeneratedImage, index: number) => void;
  templates: TemplateSummary[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
  isLoadingTemplates: boolean;
}

export const ImagesTab = ({ 
  imageList, 
  onDownloadAll, 
  onDownloadSingle, 
  onEdit,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  isLoadingTemplates,
}: ImagesTabProps) => {
  const [downloadingStates, setDownloadingStates] = useState<Record<number, boolean>>({});
  const [showOriginalScreenshots, setShowOriginalScreenshots] = useState(false);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  const originalScreenshots = imageList.filter(
    (image): image is GeneratedImage & { sourceScreenshotUrl: string } =>
      Boolean(image?.sourceScreenshotUrl)
  );

  const handleDownloadSingle = async (imageUrl: string, index: number) => {
    setDownloadingStates(prev => ({ ...prev, [index]: true }));
    try {
      await onDownloadSingle(imageUrl);
    } finally {
      setDownloadingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <Card className="border border-border/50 bg-card/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PhotoIcon className="h-5 w-5" />
                  Generated Images
                  {imageList?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {imageList.length} {imageList.length === 1 ? 'image' : 'images'}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-generated marketing images ready for your app store listing
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {originalScreenshots.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowOriginalScreenshots(prev => !prev)}
                      >
                        <EyeIcon className="h-4 w-4" />
                        {showOriginalScreenshots ? 'Hide uploads' : 'View uploads'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle the original screenshots you uploaded</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {imageList?.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onDownloadAll} variant="outline" className="gap-2">
                        <FolderArrowDownIcon className="h-4 w-4" />
                        Download All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download all images as a ZIP file</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>

        <div className="px-6 pb-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Template</p>
                <p className="text-xs text-muted-foreground">
                  Choose how your marketing images are composed. Changes apply to future generations.
                </p>
              </div>
              {selectedTemplate ? (
                <Badge variant="secondary" className="w-fit">
                  Current: {selectedTemplate.name}
                </Badge>
              ) : null}
            </div>

            {isLoadingTemplates ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => onSelectTemplate(template.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/70 px-4 py-3 text-left transition",
                        "hover:border-primary/50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isSelected && "border-primary shadow-sm"
                      )}
                      aria-pressed={isSelected}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium leading-tight">{template.name}</span>
                        {template.description ? (
                          <span className="text-xs text-muted-foreground line-clamp-2">{template.description}</span>
                        ) : null}
                        {template.tags && template.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 ? (
                              <Badge variant="outline" className="text-[10px]">
                                +{template.tags.length - 3}
                              </Badge>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <Badge variant={isSelected ? "default" : "outline"} className="shrink-0">
                        {isSelected ? "Selected" : "Choose"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
                No templates available yet. Ask your administrator to publish one.
              </div>
            )}
          </div>
        </div>

          {showOriginalScreenshots && originalScreenshots.length > 0 && (
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Original uploads</p>
                  <p className="text-xs text-muted-foreground">
                    Reference the raw screenshots that power your generated marketing images.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                  {originalScreenshots.map((image, index) => (
                    <div key={`${image.sourceScreenshotUrl}-${index}`} className="group">
                      <ImageZoom zoomMargin={120}>
                        <div className="relative overflow-hidden rounded-lg border border-border/40 bg-muted/25 aspect-[9/19.5]">
                          <LazyImage
                                              src={image.sourceScreenshotUrl}
                            alt={`Uploaded screenshot ${index + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        </div>
                      </ImageZoom>
                      <p className="mt-1 text-center text-xs text-muted-foreground">
                        Upload {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Images Grid */}
        {imageList && imageList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {imageList.map((image, index) => {
              if (!image.generatedImageUrl) {
                return null;
              }

              const generatedUrl = image.generatedImageUrl;
              const templateForImage = image.configuration?.templateId
                ? templates.find((template) => template.id === image.configuration?.templateId)
                : selectedTemplate;

              return (
                <Card key={index} className="group overflow-hidden border border-border/50 hover:border-border hover:shadow-md max-w-xs transition-all duration-200">
                  <CardContent className="p-0 relative ">
                    {/* Image Container - Optimized for ImageZoom */}
                    <div className="relative bg-muted/25 overflow-hidden">
                        <LazyImage
                          src={generatedUrl}
                          alt={`Generated Image ${index + 1}`}
                          className=" w-full  object-contain transition-transform duration-200 group-hover:scale-[1.02] cursor-zoom-in"
                        />
                      
                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => handleDownloadSingle(generatedUrl, index)} 
                              size="sm" 
                              variant="secondary" 
                              className="h-8 w-8 p-0 bg-white/55 hover:bg-white shadow-lg border border-white/20 backdrop-blur-sm"
                              disabled={downloadingStates[index]}
                            >
                              {downloadingStates[index] ? (
                                <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                              ) : (
                                <ArrowDownTrayIcon className="h-4 w-4 text-gray-700" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download image</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => onEdit(image, index)} 
                              size="sm" 
                              variant="secondary" 
                              className="h-8 w-8 p-0 bg-white/55 hover:bg-white shadow-lg border border-white/20 backdrop-blur-sm"
                            >
                              <PencilIcon className="h-4 w-4 text-gray-700" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit image</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Image Number Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-black/70 text-white border-0 text-xs px-2 py-1">
                          {index + 1}
                        </Badge>
                      </div>
                    </div>

                    {/* Image Info - Connected seamlessly to image */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Screenshot {index + 1}</h4>
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                      </div>
                      
                      {image.configuration?.heading && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Heading</p>
                          <p className="text-sm font-medium leading-tight">{image.configuration.heading}</p>
                        </div>
                      )}
                      
                      {image.configuration?.subheading && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Subheading</p>
                          <p className="text-xs text-muted-foreground leading-tight">{image.configuration.subheading}</p>
                        </div>
                      )}

                      {image.accentColor && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">Color</p>
                          <div 
                            className="w-4 h-4 rounded border border-border shadow-sm"
                            style={{ backgroundColor: image.accentColor }}
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            {image.accentColor}
                          </span>
                        </div>
                      )}

                      {templateForImage ? (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">Template</p>
                          <Badge variant="outline" className="text-xs">
                            {templateForImage.name}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <PhotoIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Images Generated Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Complete the content generation process to create beautiful marketing images for your app store listing.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};