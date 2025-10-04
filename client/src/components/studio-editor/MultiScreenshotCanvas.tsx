/**
 * Multi-screenshot canvas container component
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { CanvasTextEditor } from './CanvasTextEditor';
import { MarketingImageCanvas } from './canvas/MarketingImageCanvas';
import { TransformControlsWrapper } from './canvas/TransformControlsWrapper';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './canvas/utils';

export function MultiScreenshotCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    screenshots, 
    selection, 
    view, 
    global,
    selectElement,
    clearSelection,
    updateScreenshotPosition,
    updateScreenshotScale,
    updateScreenshotRotation,
    startEditing,
    stopEditing,
    setZoom
  } = useStudioEditor();

  // Load device frame
  const [deviceFrameImage, setDeviceFrameImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const frameImg = new Image();
    frameImg.onload = () => setDeviceFrameImage(frameImg);
    frameImg.onerror = () => console.error('Failed to load device frame');
    
    const frameFiles: Record<string, string> = {
      'iPhone 15 Pro': '/iphone_15_frame.png',
      'iPhone 15': '/iphone_15_frame.png',
      'iPhone 14 Pro': '/iphone_15_frame.png',
      'iPad Pro 13': '/iPad Pro 13 Frame.png',
      'iPad Pro 11': '/iPad Pro 13 Frame.png',
    };
    
    frameImg.src = frameFiles[global.deviceFrame] || '/iphone_15_frame.png';
  }, [global.deviceFrame]);

  // Listen for double-click editing event
  useEffect(() => {
    const handleStartEditing = () => {
      startEditing();
    };

    window.addEventListener('startTextEditing', handleStartEditing);
    return () => window.removeEventListener('startTextEditing', handleStartEditing);
  }, [startEditing]);

  // Handle Ctrl/Cmd + Scroll to zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // Determine zoom direction (negative deltaY = scroll up = zoom in)
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(2, view.zoom + zoomDelta));
        
        setZoom(newZoom);
      }
    };

    const container = containerRef.current;
    if (container) {
      // Use passive: false to allow preventDefault
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [view.zoom, setZoom]);

  const handleSelect = useCallback((index: number | null, elementType: any, multiSelectMode?: boolean) => {
    if (index === null) {
      clearSelection();
    } else {
      selectElement(index, elementType, multiSelectMode);
    }
  }, [selectElement, clearSelection]);

  const handleUpdatePosition = useCallback((
    index: number, 
    element: string, 
    position: { x: number; y: number }
  ) => {
    updateScreenshotPosition(index, element as 'heading' | 'subheading' | 'mockup', position);
  }, [updateScreenshotPosition]);

  // Handle click on background to clear selection
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto bg-muted/30 relative"
      onClick={handleBackgroundClick}
    >
      <div 
        className="flex gap-6 items-start p-6 min-w-min"
        style={{ 
          transform: `scale(${view.zoom})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease-out'
        }}
      >
        {screenshots.map((screenshot, index) => {
          const isThisScreenshotEditing = selection.isEditing && selection.screenshotIndex === index;
          
          const handleWrapperClick = (e: React.MouseEvent) => {
            // If in editing mode and clicking canvas (not textarea), close editor
            if (isThisScreenshotEditing) {
              const target = e.target as HTMLElement;
              const isTextarea = target.closest('[data-canvas-text-editor]');
              const isCanvas = target.tagName === 'CANVAS';
              
              if (isCanvas && !isTextarea) {
                stopEditing();
              }
            }
          };
          
          const mockupWidth = 700 * screenshot.mockupScale;
          const mockupHeight = 1400 * screenshot.mockupScale;
          const mockupX = (CANVAS_WIDTH - mockupWidth) / 2 + screenshot.mockupPosition.x;
          const mockupY = (CANVAS_HEIGHT - mockupHeight) / 2 + screenshot.mockupPosition.y;
          
          const isSelectedMockup = selection.screenshotIndex === index && selection.elementType === 'mockup';
          
          // Get all selected elements for this screenshot
          const selectedElements = new Set<'heading' | 'subheading'>(
            selection.multiSelect
              .filter(item => item.screenshotIndex === index)
              .map(item => item.elementType)
          );
          
          return (
            <div 
              key={screenshot.id} 
              className="relative inline-block" 
              onClick={handleWrapperClick}
            >
              <MarketingImageCanvas
                screenshot={screenshot}
                index={index}
                totalImages={screenshots.length}
                isSelected={selection.screenshotIndex === index}
                selectedElement={selection.screenshotIndex === index ? selection.elementType : null}
                isEditing={selection.isEditing && selection.screenshotIndex === index}
                selectedElements={selectedElements}
                onSelect={handleSelect}
                onUpdatePosition={handleUpdatePosition}
                deviceFrameImage={deviceFrameImage}
                global={global}
              />
              
              {/* Transform controls for mockup */}
              {isSelectedMockup && !selection.isEditing && (
                <TransformControlsWrapper
                  screenshot={screenshot}
                  index={index}
                  mockupX={mockupX}
                  mockupY={mockupY}
                  mockupWidth={mockupWidth}
                  mockupHeight={mockupHeight}
                  canvasWidth={CANVAS_WIDTH}
                  canvasHeight={CANVAS_HEIGHT}
                  zoom={view.zoom}
                  updateScreenshotPosition={updateScreenshotPosition}
                  updateScreenshotScale={updateScreenshotScale}
                  updateScreenshotRotation={updateScreenshotRotation}
                />
              )}
              
              {/* In-canvas text editor */}
              {selection.isEditing && 
               selection.screenshotIndex === index && 
               selection.elementType &&
               (selection.elementType === 'heading' || selection.elementType === 'subheading') && (
                <CanvasTextEditor
                  screenshotIndex={index}
                  elementType={selection.elementType}
                  onClose={stopEditing}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
