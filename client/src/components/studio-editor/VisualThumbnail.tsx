import { useState } from 'react';
import { Trash2Icon } from 'lucide-react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import type { Visual } from '@/context/studio-editor/types';
import { toast } from 'sonner';
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

interface VisualThumbnailProps {
  visual: Visual;
}

export function VisualThumbnail({ visual }: VisualThumbnailProps) {
  const { selection, deleteVisual, addElement, screenshots } = useStudioEditor();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddToCanvas = async () => {
    // Check if a screenshot is selected
    if (selection.screenshotIndex === null) {
      toast.error('Please select a canvas first');
      return;
    }

    try {
      // Create a visual element and add it to the selected screenshot
      const { createVisualElement } = await import('@/context/studio-editor/elementTypes');
      
      // Use actual dimensions from the visual, fallback to 300x300 if not available
      const width = visual.width || 300;
      const height = visual.height || 300;
      
      const visualElement = createVisualElement(
        visual.imageUrl,
        visual.name,
        width,
        height,
        { x: 600, y: 1300 }, // Default position (center-ish)
        {
          scale: 1,
          rotation: 0,
          zIndex: screenshots[selection.screenshotIndex].elements.length,
          opacity: 1,
        }
      );

      await addElement(selection.screenshotIndex, visualElement);
      toast.success('Visual added to canvas');
    } catch (error) {
      console.error('Error adding visual to canvas:', error);
      toast.error('Failed to add visual');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteVisual(visual.id);
      toast.success('Visual deleted');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting visual:', error);
      toast.error('Failed to delete visual');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/50 hover:border-primary transition-colors cursor-pointer">
        {/* Visual Image */}
        <button
          onClick={handleAddToCanvas}
          className="w-full h-full flex items-center justify-center p-2"
        >
          <img
            src={visual.imageUrl}
            alt={visual.name}
            className="max-w-full max-h-full object-contain"
          />
        </button>

        {/* Delete Button - Always visible on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-md bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
          title="Delete visual"
        >
          <Trash2Icon className="h-3 w-3" />
        </button>

        {/* Name Label */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-xs text-white truncate" title={visual.name}>
            {visual.name}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visual</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{visual.name}"? This will remove it from all canvases where it's used.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
