import { useStudioEditor } from '@/context/StudioEditorContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DevicePhoneMobileIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';
import { isMockupElement, type MockupElement } from '@/context/studio-editor/elementTypes';

const DEVICE_FRAMES = [
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro' },
  { id: 'iphone-15', name: 'iPhone 15' },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro' },
  { id: 'ipad-pro-13', name: 'iPad Pro 13"' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"' },
];

export function MockupToolbar() {
  const { 
    selection, 
    global, 
    updateDeviceFrame,
    updateElement,
    getSelectedElement,
  } = useStudioEditor();

  // Get the selected element
  const selectedElement = getSelectedElement();
  
  // Only show toolbar if a mockup element is selected
  if (!selectedElement || !isMockupElement(selectedElement)) {
    return null;
  }

  const mockupElement = selectedElement as MockupElement;

  const handleDeviceChange = (deviceId: string) => {
    updateDeviceFrame(deviceId);
  };

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

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-l">
      {/* Device Frame Selector */}
      <div className="flex items-center gap-2">
        <DevicePhoneMobileIcon className="h-5 w-5 text-neutral-600" />
        <label className="text-sm font-medium text-neutral-600 whitespace-nowrap">Device:</label>
        <Select value={global.deviceFrame} onValueChange={handleDeviceChange}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_FRAMES.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
