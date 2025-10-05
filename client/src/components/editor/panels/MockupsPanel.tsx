import { useState } from 'react';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { createMockupElement, isMockupElement, type MockupElement } from '@/context/studio-editor/elementTypes';

const AVAILABLE_MOCKUPS = [
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    icon: DevicePhoneMobileIcon,
  },
];

export function MockupsPanel() {
  const {
    screenshots,
    selection,
    addElement,
  } = useStudioEditor();

  const selectedScreenshot = selection.screenshotIndex !== null
    ? screenshots[selection.screenshotIndex]
    : null;

  const [isAdding, setIsAdding] = useState(false);

  const handleAddMockup = async (mockupType: string) => {
    if (!selectedScreenshot || selection.screenshotIndex === null) return;
    
    setIsAdding(true);
    try {
      // Create mockup element with factory function
      const newMockup = createMockupElement(
        selectedScreenshot.image.sourceScreenshotUrl || '',
        mockupType,
        { x: 250, y: 600 }, // Default centered position
        { baseWidth: 700, baseHeight: 1400 }
      );
      
      // Add to screenshot using unified API
      await addElement(selection.screenshotIndex, newMockup);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Add Mockup</h3>
        <div className="space-y-2">
          {AVAILABLE_MOCKUPS.map((mockup) => {
            const Icon = mockup.icon;
            return (
              <Button
                key={mockup.id}
                onClick={() => handleAddMockup(mockup.id)}
                disabled={!selectedScreenshot || isAdding}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Icon className="h-4 w-4 mr-2" />
                {isAdding ? 'Adding...' : mockup.name}
              </Button>
            );
          })}
        </div>
      </div>

      {!selectedScreenshot && (
        <p className="text-xs text-muted-foreground">
          Select a screenshot to add mockup
        </p>
      )}

      {selectedScreenshot && (
        <>
          {/* Get mockup elements from unified elements array */}
          {(() => {
            const mockupElements = (selectedScreenshot.elements || [])
              .filter(isMockupElement);

            if (mockupElements.length === 0) return null;

            return (
              <div>
                <h4 className="text-xs font-medium mb-2 text-muted-foreground">
                  Mockups on Canvas ({mockupElements.length})
                </h4>
                <div className="space-y-1">
                  {mockupElements.map((mockup: MockupElement, idx: number) => (
                    <div
                      key={mockup.id}
                      className="text-xs p-2 rounded bg-muted/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <DevicePhoneMobileIcon className="h-4 w-4" />
                        <span>{idx + 1}. {mockup.frameType}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {Math.round(mockup.scale * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
