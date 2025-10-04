import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useStudioEditor } from '@/context/StudioEditorContext';

export const EditorBottomToolbar = () => {
  const { view, setZoom, resetView } = useStudioEditor();

  const handleZoomOut = () => {
    setZoom(Math.max(0.25, view.zoom - 0.25));
  };

  const handleZoomIn = () => {
    setZoom(Math.min(2, view.zoom + 0.25));
  };

  const handleSliderChange = (values: number[]) => {
    setZoom(values[0] / 100);
  };

  return (
    <div 
      data-editor-toolbar="true"
      className="h-12 border-t border-border bg-card flex items-center justify-center gap-4 px-4 flex-shrink-0"
    >
      {/* Zoom Out Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        disabled={view.zoom <= 0.25}
        className="text-muted-foreground hover:text-foreground"
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      
      {/* Zoom Slider */}
      <Slider
        value={[view.zoom * 100]}
        onValueChange={handleSliderChange}
        min={25}
        max={200}
        step={5}
        className="w-48"
      />
      
      {/* Zoom Percentage */}
      <span className="text-sm text-muted-foreground w-12 text-center">
        {Math.round(view.zoom * 100)}%
      </span>
      
      {/* Zoom In Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        disabled={view.zoom >= 2}
        className="text-muted-foreground hover:text-foreground"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      
      {/* Reset View */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={resetView}
        className="text-muted-foreground hover:text-foreground"
      >
        Reset View
      </Button>
    </div>
  );
};
