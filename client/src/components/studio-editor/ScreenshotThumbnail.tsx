import { useState } from 'react';
import { TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStudioEditor, type ScreenshotState } from '@/context/StudioEditorContext';
import { Loader2 } from 'lucide-react';

interface ScreenshotThumbnailProps {
  screenshot: ScreenshotState;
  index: number;
  isSelected: boolean;
}

export default function ScreenshotThumbnail({
  screenshot,
  index,
  isSelected,
}: ScreenshotThumbnailProps) {
  const { selectElement, removeScreenshot, screenshots } = useStudioEditor();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelect = () => {
    selectElement(index, null);
  };

  const headingText = screenshot.image.configuration?.heading ?? `Screenshot ${index + 1}`;
  const subheadingText = screenshot.image.configuration?.subheading ?? '';

  const handleDelete = async () => {
    setIsDeleting(true);
    await removeScreenshot(index);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className={`
          group relative rounded-lg cursor-pointer
          transition-all duration-200 p-3
          ${isSelected 
            ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950/30' 
            : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 bg-white dark:bg-gray-800'
          }
        `}
        onClick={handleSelect}
      >
        {/* Icon, Number, and Delete Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`
              flex-shrink-0 w-8 h-8 rounded flex items-center justify-center
              ${isSelected 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
            `}>
              <PhotoIcon className="h-4 w-4" />
            </div>
            
            <span className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
              #{index + 1}
            </span>
          </div>
          
          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`
              h-6 w-6 flex-shrink-0 
              text-gray-400 hover:text-red-600 dark:hover:text-red-400
              hover:bg-red-50 dark:hover:bg-red-950/30
              ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              transition-opacity
            `}
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            disabled={screenshots.length <= 1}
            title={screenshots.length <= 1 ? 'Cannot delete last image' : 'Delete image'}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App Store Image?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete image #{index + 1}? This action cannot be undone.
              {screenshots.length <= 1 && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400 font-semibold">
                  Cannot delete the last image. At least one is required.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Image info in dialog */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                <PhotoIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {headingText}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subheadingText}
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={screenshots.length <= 1 || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
