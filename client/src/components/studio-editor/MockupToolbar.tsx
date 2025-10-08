import { useRef, useState, type ChangeEvent } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { Button } from '@/components/ui/button';
import {
  DevicePhoneMobileIcon,
  ArrowPathRoundedSquareIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { isMockupElement, type MockupElement } from '@/context/studio-editor/elementTypes';
import { resolveDevicePreset } from '@/constants/devicePresets';

export function MockupToolbar() {
  const { 
    selection, 
    global, 
    updateElement,
    getSelectedElement,
    getSelectedScreenshot,
    replaceScreenshotImage,
  } = useStudioEditor();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const selectedElement = getSelectedElement();
  const selectedScreenshot = getSelectedScreenshot();
  
  // Only show toolbar if a mockup element is selected
  if (!selectedElement || !isMockupElement(selectedElement)) {
    return null;
  }

  const mockupElement = selectedElement as MockupElement;

  const deviceLabel = resolveDevicePreset(global.deviceFrame).label;

  const handleResetTransform = () => {
    if (selection.screenshotIndex !== null && selection.elementId) {
      // Reset position, scale, and rotation to defaults
      updateElement(selection.screenshotIndex, selection.elementId, {
        position: { x: 250, y: 600 },
        scale: 1.0,
        rotation: 0,
      });
    }
  };

  const handleScaleChange = (scale: number) => {
    if (selection.screenshotIndex !== null && selection.elementId) {
      updateElement(selection.screenshotIndex, selection.elementId, { scale });
    }
  };

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selection.screenshotIndex === null) {
      event.target.value = '';
      return;
    }

    setIsReplacing(true);

    try {
      await replaceScreenshotImage(selection.screenshotIndex, file);
    } catch (error) {
      console.error('MockupToolbar: Failed to replace screenshot', error);
    } finally {
      setIsReplacing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-l">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
        {/* Device Frame Information */}
      <div className="flex items-center gap-2">
        <DevicePhoneMobileIcon className="h-5 w-5 text-neutral-600" />
          <div className="flex items-center gap-1 text-sm text-neutral-600 whitespace-nowrap">
            <span className="font-medium">Device:</span>
            <span>{deviceLabel}</span>
          </div>
      </div>

      {/* Scale Slider */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Scale:</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={mockupElement.scale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          className="w-32"
        />
        <span className="text-sm text-neutral-600 tabular-nums w-12">
          {Math.round(mockupElement.scale * 100)}%
        </span>
      </div>

      {/* Current Transform Info (read-only display) */}
      <div className="flex items-center gap-4 text-sm text-neutral-600 border-l pl-4">
        <div className="flex items-center gap-1">
          <span className="font-medium">Rotation:</span>
          <span className="tabular-nums">{Math.round(mockupElement.rotation || 0)}°</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">Position:</span>
          <span className="tabular-nums">
            ({Math.round(mockupElement.position.x)}, {Math.round(mockupElement.position.y)})
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReplaceClick}
          className="h-9"
          disabled={isReplacing || !selectedScreenshot}
          title="Upload a replacement screenshot image"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          {isReplacing ? 'Replacing…' : 'Replace Screenshot'}
        </Button>
        {/* Reset Transform */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetTransform}
          className="h-9"
          title="Reset position, scale, and rotation"
        >
          <ArrowPathRoundedSquareIcon className="h-4 w-4 mr-2" />
          Reset Transform
        </Button>
      </div>
    </div>
  );
}
