import { useState } from 'react';
import { CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { TextToolbar } from './TextToolbar';
import { MockupToolbar } from './MockupToolbar';
import { Button } from '@/components/ui/button';
import { isTextElement, isMockupElement, isVisualElement } from '@/context/studio-editor/elementTypes';

export const EditorTopToolbar = () => {
  const {
    selection,
    screenshots,
    isSaving,
    deleteElement,
    removeScreenshot,
    addScreenshot,
    getSelectedElement,
  } = useStudioEditor();

  const [isProcessingScreenshot, setIsProcessingScreenshot] = useState<
    'adding' | 'deleting' | null
  >(null);
  
  const selectedElement = getSelectedElement();
  const hasTextSelection = selectedElement && isTextElement(selectedElement);
  const hasMockupSelection = selectedElement && isMockupElement(selectedElement);
  const hasVisualSelection = selectedElement && isVisualElement(selectedElement);
  const hasElementSelection = selection.elementId !== null;
  const hasScreenshotSelection = selection.screenshotIndex !== null;
  const isCanvasSelected = hasScreenshotSelection && !hasElementSelection;
  const hasNoSelection = selection.screenshotIndex === null;
  const canAddScreenshot = screenshots.length < 10;
  
  const handleDeleteElement = () => {
    if (selection.screenshotIndex !== null && selection.elementId) {
      deleteElement(selection.screenshotIndex, selection.elementId);
    }
  };

  const hasSelectionInInput = () => {
    if (typeof document === 'undefined') return false;
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;
    const tag = active.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      active.contentEditable === 'true'
    );
  };

  const handleDeleteScreenshot = async () => {
    if (!isCanvasSelected || selection.screenshotIndex === null) return;

    setIsProcessingScreenshot('deleting');
    try {
      await removeScreenshot(selection.screenshotIndex);
    } finally {
      setIsProcessingScreenshot(null);
    }
  };

  const handleAddScreenshot = async () => {
    if (!canAddScreenshot || hasSelectionInInput()) return;

    setIsProcessingScreenshot('adding');
    try {
      await addScreenshot();
    } finally {
      setIsProcessingScreenshot(null);
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
        {hasNoSelection && (
          <p className="text-sm text-muted-foreground">
            Select a canvas to edit or add a new App Store image.
          </p>
        )}
        {isCanvasSelected && (
          <p className="text-sm text-muted-foreground">
            Canvas selected – delete to remove this image or add elements.
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

      <div className="flex items-center gap-2 flex-shrink-0">
        {hasElementSelection && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteElement}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete element"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}

        {isCanvasSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteScreenshot}
            disabled={isProcessingScreenshot === 'deleting'}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {isProcessingScreenshot === 'deleting' ? (
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4 mr-2" />
            )}
            Delete image
          </Button>
        )}

        {hasNoSelection && (
          <Button
            variant="default"
            size="sm"
            onClick={handleAddScreenshot}
            disabled={!canAddScreenshot || isProcessingScreenshot === 'adding'}
            className="gap-2"
          >
            {isProcessingScreenshot === 'adding' ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            Add App Store image
          </Button>
        )}
      </div>
    </div>
  );
};
