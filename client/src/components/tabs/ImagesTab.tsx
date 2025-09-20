import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";    
import { Badge } from "../ui/badge";
import { LazyImage } from '../LazyImage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { PencilIcon, ArrowDownTrayIcon, PhotoIcon, FolderArrowDownIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useState } from 'react';

interface ImagesTabProps {
  imageList: any[];
  onDownloadAll: () => Promise<void>;
  onDownloadSingle: (imageUrl: string) => Promise<void>;
  onEdit: (image: any, index: number) => void;
}

export const ImagesTab = ({ 
  imageList, 
  onDownloadAll, 
  onDownloadSingle, 
  onEdit 
}: ImagesTabProps) => {
  const [downloadingStates, setDownloadingStates] = useState<{[key: number]: boolean}>({});

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
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
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
          </CardHeader>
        </Card>

        {/* Images Grid */}
        {imageList && imageList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {imageList.map((image, index) => (
              <Card key={index} className="group overflow-hidden border border-border/50 hover:border-border hover:shadow-md max-w-xs transition-all duration-200">
                <CardContent className="p-0 relative ">
                  {/* Image Container - Optimized for ImageZoom */}
                  <div className="relative bg-muted/25 overflow-hidden">

                      <LazyImage
                        src={image.generatedImageUrl}
                        alt={`Generated Image ${index + 1}`}
                        className=" w-full h-full transition-transform duration-200 group-hover:scale-[1.02] cursor-zoom-in"
                      />

                    
                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => handleDownloadSingle(image.generatedImageUrl, index)} 
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
                  </div>
                </CardContent>
              </Card>
            ))}
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