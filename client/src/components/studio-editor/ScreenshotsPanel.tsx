import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useStudioEditor } from '@/context/StudioEditorContext';
import ScreenshotThumbnail from './ScreenshotThumbnail';
import { Loader2 } from 'lucide-react';

export default function ScreenshotsPanel() {
  const { screenshots, addScreenshot, selection } = useStudioEditor();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddClick = async () => {
    setIsAdding(true);
    await addScreenshot();
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            App Store Images
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {screenshots.length}/10 images
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          disabled={screenshots.length >= 10 || isAdding}
          size="sm"
          className="gap-1.5"
          title={screenshots.length >= 10 ? 'Maximum 10 images allowed' : 'Add new image'}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
          Add
        </Button>
      </div>

      {/* Screenshot Grid */}
      <div className="grid grid-cols-2 gap-3">
        {screenshots.map((screenshot, index) => (
          <ScreenshotThumbnail
            key={screenshot.id}
            screenshot={screenshot}
            index={index}
            isSelected={selection.screenshotIndex === index}
          />
        ))}
      </div>

      {/* Helper text */}
      {screenshots.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          No images yet. Click "Add" to create one.
        </div>
      )}

      {screenshots.length >= 10 && (
        <div className="text-xs text-orange-600 dark:text-orange-400 text-center mt-2">
          Maximum limit reached (10 images)
        </div>
      )}
    </div>
  );
}
