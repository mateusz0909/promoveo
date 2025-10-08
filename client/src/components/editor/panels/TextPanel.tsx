import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { createTextElement, isTextElement } from '@/context/studio-editor/elementTypes';
import type { TextElement } from '@/context/studio-editor/elementTypes';

export function TextPanel() {
  const {
    screenshots,
    selection,
    addElement,
    generateScreenshotText,
    aiGenerationStatus,
  } = useStudioEditor();

  const selectedScreenshot = selection.screenshotIndex !== null
    ? screenshots[selection.screenshotIndex]
    : null;

  const [isAddingHeading, setIsAddingHeading] = useState(false);
  const [isAddingSubheading, setIsAddingSubheading] = useState(false);

  const hasTextElements = useMemo(() => {
    if (!selectedScreenshot) return false;
    return (selectedScreenshot.elements || []).some(isTextElement);
  }, [selectedScreenshot]);

  const aiStatus = selectedScreenshot ? aiGenerationStatus[selectedScreenshot.id] : undefined;
  const isGenerating = aiStatus?.status === 'loading';
  const activeStyle = aiStatus?.style;

  const handleAddHeading = async () => {
    if (selection.screenshotIndex === null) return;
    
    setIsAddingHeading(true);
    try {
      const newTextElement = createTextElement(
        'Tap to edit',
        { x: 100, y: 100 },
        { fontSize: 64, isBold: true, fontWeight: 700 }
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
        { fontSize: 32, isBold: false, fontWeight: 400 }
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
          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI suggestions
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Craft fresh headlines and subheadings tailored to this canvas.
                </p>
              </div>
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-auto w-full items-start justify-start gap-3 rounded-lg px-4 py-3 text-left"
                disabled={!hasTextElements || isGenerating}
                onClick={() => {
                  if (selection.screenshotIndex !== null) {
                    void generateScreenshotText(selection.screenshotIndex, 'concise');
                  }
                }}
              >
                {isGenerating && activeStyle === 'concise' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <div className="flex max-w-full flex-col items-start text-left">
                  <span className="text-sm font-medium">Concise AI</span>
                  <span className="text-xs leading-snug text-muted-foreground break-words whitespace-normal">
                    Quick, attention-grabbing copy
                  </span>
                </div>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-auto w-full items-start justify-start gap-3 rounded-lg px-4 py-3 text-left"
                disabled={!hasTextElements || isGenerating}
                onClick={() => {
                  if (selection.screenshotIndex !== null) {
                    void generateScreenshotText(selection.screenshotIndex, 'detailed');
                  }
                }}
              >
                {isGenerating && activeStyle === 'detailed' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <div className="flex max-w-full flex-col items-start text-left">
                  <span className="text-sm font-medium">Detailed AI</span>
                  <span className="text-xs leading-snug text-muted-foreground break-words whitespace-normal">
                    Rich storytelling with benefits
                  </span>
                </div>
              </Button>
            </div>

            {!hasTextElements && (
              <p className="mt-3 text-xs text-muted-foreground">
                Add a heading or subheading first to enable AI suggestions.
              </p>
            )}
          </div>

          {/* Get text elements from the unified elements array */}
          {(() => {
            const textElements = (selectedScreenshot.elements || [])
              .filter(isTextElement);
            
            const headings = textElements.filter(el => {
              const weight = el.fontWeight ?? (el.isBold ? 700 : 400);
              return weight >= 600;
            });
            const subheadings = textElements.filter(el => {
              const weight = el.fontWeight ?? (el.isBold ? 700 : 400);
              return weight < 600;
            });

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
