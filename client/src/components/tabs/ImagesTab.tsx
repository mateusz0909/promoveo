import { StudioEditorLayout } from '../studio-editor/StudioEditorLayout';
import type { GeneratedImage } from '@/types/project';

interface ImagesTabProps {
  imageList: GeneratedImage[];
  projectId?: string;
  appName: string;
  appDescription: string;
  device?: string;
}

/**
 * ImagesTab is now the full canvas editor - no gallery grid
 * Always shows the multi-screenshot editor interface
 */
export const ImagesTab = ({ 
  imageList, 
  projectId,
  appName,
  appDescription,
  device,
}: ImagesTabProps) => {
  // Directly render editor layout (no mode toggle, no gallery grid)
  return (
    <div className="h-full w-full min-w-0">
      <StudioEditorLayout 
        imageList={imageList}
        projectId={projectId || ''}
        appName={appName}
        appDescription={appDescription}
        device={device}
      />
    </div>
  );
};
