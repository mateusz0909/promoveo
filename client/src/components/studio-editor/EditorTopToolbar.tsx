import { CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Loader2Icon } from 'lucide-react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { TextToolbar } from './TextToolbar';
import { MockupToolbar } from './MockupToolbar';
import { Button } from '@/components/ui/button';
import { isTextElement, isMockupElement, isVisualElement } from '@/context/studio-editor/elementTypes';

export const EditorTopToolbar = () => {
  const { selection, isSaving, deleteElement, getSelectedElement } = useStudioEditor();
  
  const selectedElement = getSelectedElement();
  const hasTextSelection = selectedElement && isTextElement(selectedElement);
  const hasMockupSelection = selectedElement && isMockupElement(selectedElement);
  const hasVisualSelection = selectedElement && isVisualElement(selectedElement);
  const hasAnySelection = selection.elementId !== null;
  
  const handleDelete = () => {
    if (selection.screenshotIndex !== null && selection.elementId) {
      deleteElement(selection.screenshotIndex, selection.elementId);
    }
  };

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
        {!selection.elementId && (
          <p className="text-sm text-muted-foreground">
            Click on text or screenshot to edit
          </p>
        )}
        
        {hasTextSelection && <TextToolbar />}
        {hasMockupSelection && <MockupToolbar />}
        {hasVisualSelection && (
          <p className="text-sm text-muted-foreground">
            Visual selected - drag to move, use handles to resize/rotate
          </p>
        )}
      </div>

      {/* Right: Delete button */}
      {hasAnySelection && (
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};
