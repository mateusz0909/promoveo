import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, Loader2, Image } from 'lucide-react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { toast } from 'sonner';
import { VisualThumbnail } from './VisualThumbnail';

export function VisualsPanel() {
  const { visuals, uploadVisual } = useStudioEditor();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file types and sizes
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Please upload JPEG, PNG, WebP, or SVG.`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    try {
      for (const file of validFiles) {
        try {
          await uploadVisual(file);
          successCount++;
        } catch (error) {
          console.error('Error uploading visual:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} visual${successCount > 1 ? 's' : ''}`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Upload Button */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full"
          size="sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Visual
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Visuals Count */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
        {visuals.length} visual{visuals.length !== 1 ? 's' : ''}
      </div>

      {/* Visuals Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {visuals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Image className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No visuals yet</p>
            <p className="text-xs text-muted-foreground/70">
              Upload custom images, objects, or shapes
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {visuals.map((visual) => (
              <VisualThumbnail key={visual.id} visual={visual} />
            ))}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> Select a canvas first, then click a visual to add it
        </p>
      </div>
    </div>
  );
}
