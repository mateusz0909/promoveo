import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Loader2Icon } from 'lucide-react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { TextToolbar } from './TextToolbar';
import { MockupToolbar } from './MockupToolbar';

export const EditorTopToolbar = () => {
  const { selection, isSaving } = useStudioEditor();

  const hasTextSelection = 
    selection.elementType === 'heading' || 
    selection.elementType === 'subheading';
  
  const hasMockupSelection = selection.elementType === 'mockup';

  return (
    <div 
      data-editor-toolbar="true"
      className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 flex-shrink-0"
    >
      {/* Left: Save status indicator */}
      <div className="flex items-center gap-2 text-sm w-24 flex-shrink-0">
        {isSaving ? (
          <>
            <Loader2Icon className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Saving...</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-3 w-3 text-green-600" />
            <span className="text-muted-foreground">Saved</span>
          </>
        )}
      </div>
      
      {/* Center: Context-aware controls */}
      <div className="flex-1 flex items-center justify-center">
        {!selection.elementType && (
          <p className="text-sm text-muted-foreground">
            Click on text or screenshot to edit
          </p>
        )}
        
        {hasTextSelection && <TextToolbar />}
        {hasMockupSelection && <MockupToolbar />}
      </div>
    </div>
  );
};
