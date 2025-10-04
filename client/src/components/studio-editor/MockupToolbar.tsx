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
  ArrowUpTrayIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';

const DEVICE_FRAMES = [
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro' },
  { id: 'iphone-15', name: 'iPhone 15' },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro' },
  { id: 'ipad-pro-13', name: 'iPad Pro 13"' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"' },
];

export function MockupToolbar() {
  const { 
    screenshots, 
    selection, 
    global, 
    updateDeviceFrame, 
    updateScreenshotScale, 
    updateScreenshotPosition,
    updateScreenshotRotation 
  } = useStudioEditor();

  if (selection.screenshotIndex === null || selection.elementType !== 'mockup') {
    return null;
  }

  const screenshot = screenshots[selection.screenshotIndex];

  const handleDeviceChange = (deviceId: string) => {
    updateDeviceFrame(deviceId);
  };

  const handleUploadScreenshot = () => {
    // TODO: Implement screenshot upload/replace
    console.log('Upload screenshot for index:', selection.screenshotIndex);
  };

  const handleResetTransform = () => {
    if (selection.screenshotIndex !== null) {
      // Reset position, scale, and rotation to defaults
      updateScreenshotPosition(selection.screenshotIndex, 'mockup', { x: 0, y: 0 });
      updateScreenshotScale(selection.screenshotIndex, 1.0);
      updateScreenshotRotation(selection.screenshotIndex, 0);
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

      {/* Current Transform Info (read-only display) */}
      <div className="flex items-center gap-4 text-sm text-neutral-600 border-l pl-4">
        <div className="flex items-center gap-1">
          <span className="font-medium">Scale:</span>
          <span className="tabular-nums">{Math.round(screenshot.mockupScale * 100)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">Rotation:</span>
          <span className="tabular-nums">{Math.round(screenshot.mockupRotation || 0)}°</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Upload New Screenshot */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadScreenshot}
          className="h-9"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Replace
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
