import { StudioEditorLayout } from '../studio-editor/StudioEditorLayout';
import type { GeneratedImage } from '@/types/project';

interface ImagesTabProps {
  imageList: GeneratedImage[];
  projectId?: string;
  onDownloadSingle: (imageUrl: string) => Promise<void>;
  onEdit: (image: GeneratedImage, index: number) => void;
}

/**
 * ImagesTab is now the full canvas editor - no gallery grid
 * Always shows the multi-screenshot editor interface
 */
export const ImagesTab = ({ 
  imageList, 
  projectId,
}: ImagesTabProps) => {
  // Directly render editor layout (no mode toggle, no gallery grid)
  return (
    <div className="h-full w-full">
      <StudioEditorLayout 
        imageList={imageList}
        projectId={projectId || ''}
      />
    </div>
  );
};
