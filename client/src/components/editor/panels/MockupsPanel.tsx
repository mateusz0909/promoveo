import { useMemo, useState } from 'react';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { createMockupElement, isMockupElement, type MockupElement } from '@/context/studio-editor/elementTypes';
import { useProject } from '@/context/ProjectContext';
import { listAvailableDevicePresets, resolveDevicePreset } from '@/constants/devicePresets';

export function MockupsPanel() {
  const {
    screenshots,
    selection,
    addElement,
    global,
  } = useStudioEditor();
  const { currentProject } = useProject();

  const selectedScreenshot = selection.screenshotIndex !== null
    ? screenshots[selection.screenshotIndex]
    : null;

  const [isAdding, setIsAdding] = useState(false);

  const projectDeviceType = useMemo<'iphone' | 'ipad' | undefined>(() => {
    if (!currentProject?.device) return undefined;
    const normalized = currentProject.device.trim().toLowerCase();
    if (normalized.includes('ipad')) return 'ipad';
    if (normalized.includes('iphone')) return 'iphone';
    return undefined;
  }, [currentProject?.device]);

  const availableMockups = useMemo(() => {
    const presets = listAvailableDevicePresets();
    const fallback = presets;
    const targetType = projectDeviceType ?? resolveDevicePreset(global.deviceFrame).type;
    const filtered = presets.filter((preset) => preset.type === targetType);
    return filtered.length > 0 ? filtered : fallback;
  }, [global.deviceFrame, projectDeviceType]);

  const handleAddMockup = async (mockupType: string) => {
    if (!selectedScreenshot || selection.screenshotIndex === null) return;
    const preset = resolveDevicePreset(mockupType);
    
    setIsAdding(true);
    try {
      // Create mockup element with factory function
      const newMockup = createMockupElement(
        selectedScreenshot.image.sourceScreenshotUrl || '',
        preset.id,
        preset.mockup.offset ? { ...preset.mockup.offset } : { x: 0, y: 0 },
        {
          scale: preset.mockup.defaultScale,
        }
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
          {availableMockups.map((mockup) => {
            return (
              <Button
                key={mockup.id}
                onClick={() => handleAddMockup(mockup.id)}
                disabled={!selectedScreenshot || isAdding}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                {isAdding ? 'Adding...' : mockup.label}
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
                        <span>
                          {idx + 1}. {resolveDevicePreset(mockup.frameType).label}
                        </span>
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
