import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { createTextElement, isTextElement } from '@/context/studio-editor/elementTypes';
import type { TextElement } from '@/context/studio-editor/elementTypes';

export function TextPanel() {
  const {
    screenshots,
    selection,
    addElement,
  } = useStudioEditor();

  const selectedScreenshot = selection.screenshotIndex !== null
    ? screenshots[selection.screenshotIndex]
    : null;

  const [isAddingHeading, setIsAddingHeading] = useState(false);
  const [isAddingSubheading, setIsAddingSubheading] = useState(false);

  const handleAddHeading = async () => {
    if (selection.screenshotIndex === null) return;
    
    setIsAddingHeading(true);
    try {
      const newTextElement = createTextElement(
        'Tap to edit',
        { x: 100, y: 100 },
        { fontSize: 64, isBold: true }
      );
      await addElement(selection.screenshotIndex, newTextElement);
    } finally {
      setIsAddingHeading(false);
    }
  };

  const handleAddSubheading = async () => {
    if (selection.screenshotIndex === null) return;
    
    setIsAddingSubheading(true);
    try {
      const newTextElement = createTextElement(
        'Tap to edit',
        { x: 100, y: 300 },
        { fontSize: 32, isBold: false }
      );
      await addElement(selection.screenshotIndex, newTextElement);
    } finally {
      setIsAddingSubheading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Add Text</h3>
        <div className="space-y-2">
          <Button
            onClick={handleAddHeading}
            disabled={!selectedScreenshot || isAddingHeading}
            className="w-full justify-start"
            variant="outline"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {isAddingHeading ? 'Adding...' : 'Add Heading'}
          </Button>
          
          <Button
            onClick={handleAddSubheading}
            disabled={!selectedScreenshot || isAddingSubheading}
            className="w-full justify-start"
            variant="outline"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {isAddingSubheading ? 'Adding...' : 'Add Subheading'}
          </Button>
        </div>
      </div>

      {!selectedScreenshot && (
        <p className="text-xs text-muted-foreground">
          Select a screenshot to add text
        </p>
      )}

      {selectedScreenshot && (
        <div className="space-y-3">
          {/* Get text elements from the unified elements array */}
          {(() => {
            const textElements = (selectedScreenshot.elements || [])
              .filter(isTextElement);
            
            const headings = textElements.filter(el => el.isBold);
            const subheadings = textElements.filter(el => !el.isBold);

            return (
              <>
                {/* Show heading instances */}
                {headings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground">Headings</h4>
                    <div className="space-y-1">
                      {headings.map((text: TextElement, idx: number) => (
                        <div
                          key={text.id}
                          className="text-xs p-2 rounded bg-muted/50 truncate"
                          title={text.text}
                        >
                          {idx + 1}. {text.text || 'Empty'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show subheading instances */}
                {subheadings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground">Subheadings</h4>
                    <div className="space-y-1">
                      {subheadings.map((text: TextElement, idx: number) => (
                        <div
                          key={text.id}
                          className="text-xs p-2 rounded bg-muted/50 truncate"
                          title={text.text}
                        >
                          {idx + 1}. {text.text || 'Empty'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
