/**
 * Multi-screenshot canvas container - Refactored with unified element system
 * 
 * This component orchestrates the multi-canvas editing experience:
 * - Renders all marketing canvases side by side
 * - Handles zoom with Ctrl/Cmd + Scroll
 * - Manages transform controls for selected elements
 * - Supports inline text editing
 * - Clean integration with unified element model
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { MarketingImageCanvas } from './canvas/MarketingImageCanvasNew';
import { CanvasTextEditor } from './CanvasTextEditor';
import { TransformControlsWrapper } from './canvas/TransformControlsWrapper';
import { VisualTransformControlsWrapper } from './canvas/VisualTransformControlsWrapper';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './canvas/utils';
import { useStudioEditor } from '@/context/StudioEditorContextNew';
import { isTextElement, isMockupElement, isVisualElement } from '@/context/studio-editor/elementTypes';

export function MultiScreenshotCanvasNew() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    screenshots, 
    selection, 
    view, 
    global,
    selectElement,
    clearSelection,
    updateElementPosition,
    updateElementScale,
    updateElementRotation,
    startEditing,
    stopEditing,
    setZoom,
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

  // Handle selection
  const handleSelect = useCallback((
    index: number | null, 
    elementId: string | null
  ) => {
    if (index === null || elementId === null) {
      clearSelection();
    } else {
      selectElement(index, elementId);
    }
  }, [selectElement, clearSelection]);

  // Handle position updates from drag
  const handleUpdatePosition = useCallback((
    index: number, 
    elementId: string, 
    position: { x: number; y: number }
  ) => {
    updateElementPosition(index, elementId, position);
  }, [updateElementPosition]);

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
          const isSelected = selection.screenshotIndex === index;
          const selectedElementId = isSelected ? selection.elementId : null;
          const isThisScreenshotEditing = selection.isEditing && isSelected;
          
          // Get the selected element data
          const selectedElement = selectedElementId 
            ? screenshot.elements?.find(el => el.id === selectedElementId)
            : null;
          
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
                isSelected={isSelected}
                selectedElement={selectedElementId}
                isEditing={isThisScreenshotEditing}
                onSelect={handleSelect}
                onUpdatePosition={handleUpdatePosition}
                deviceFrameImage={deviceFrameImage}
                global={global}
              />
              
              {/* Transform controls for mockup elements */}
              {selectedElement && isMockupElement(selectedElement) && !selection.isEditing && (
                <TransformControlsWrapper
                  screenshot={screenshot}
                  index={index}
                  elementId={selectedElement.id}
                  mockupX={(CANVAS_WIDTH - 700 * selectedElement.scale) / 2 + selectedElement.position.x}
                  mockupY={(CANVAS_HEIGHT - 1400 * selectedElement.scale) / 2 + selectedElement.position.y}
                  mockupWidth={700 * selectedElement.scale}
                  mockupHeight={1400 * selectedElement.scale}
                  canvasWidth={CANVAS_WIDTH}
                  canvasHeight={CANVAS_HEIGHT}
                  zoom={view.zoom}
                  updateScreenshotPosition={(idx, elemId, pos) => updateElementPosition(idx, elemId as string, pos)}
                  updateScreenshotScale={(idx, scale, elemId) => updateElementScale(idx, elemId || selectedElement.id, scale)}
                  updateScreenshotRotation={(idx, rotation, elemId) => updateElementRotation(idx, elemId || selectedElement.id, rotation)}
                />
              )}
              
              {/* Transform controls for visual elements */}
              {selectedElement && isVisualElement(selectedElement) && !selection.isEditing && (
                (() => {
                  const baseWidth = selectedElement.width || 300;
                  const baseHeight = selectedElement.height || 300;
                  const visualWidth = baseWidth * selectedElement.scale;
                  const visualHeight = baseHeight * selectedElement.scale;
                  
                  return (
                    <VisualTransformControlsWrapper
                      screenshot={screenshot}
                      index={index}
                      visualId={selectedElement.id.replace('visual-', '')}
                      centerX={selectedElement.position.x}
                      centerY={selectedElement.position.y}
                      width={visualWidth}
                      height={visualHeight}
                      rotation={selectedElement.rotation || 0}
                      scale={selectedElement.scale}
                      baseWidth={baseWidth}
                      baseHeight={baseHeight}
                      canvasWidth={CANVAS_WIDTH}
                      canvasHeight={CANVAS_HEIGHT}
                      zoom={view.zoom}
                      updateVisualPosition={(idx, visualId, pos) => 
                        updateElementPosition(idx, `visual-${visualId}`, pos)
                      }
                      updateVisualScale={(idx, visualId, scale) => 
                        updateElementScale(idx, `visual-${visualId}`, scale)
                      }
                      updateVisualRotation={(idx, visualId, rotation) => 
                        updateElementRotation(idx, `visual-${visualId}`, rotation)
                      }
                    />
                  );
                })()
              )}
              
              {/* In-canvas text editor for text elements */}
              {selectedElement && 
               isTextElement(selectedElement) && 
               selection.isEditing && 
               isSelected && (
                (() => {
                  // Extract 'heading' or 'subheading' from element ID
                  // IDs are like: "text-1234567890-abc" (general text) or legacy "heading-1234" / "subheading-1234"
                  const elementType = selectedElement.id.startsWith('heading-') 
                    ? 'heading' 
                    : selectedElement.id.startsWith('subheading-')
                    ? 'subheading'
                    : selectedElement.isBold 
                    ? 'heading'  // Default for bold text
                    : 'subheading'; // Default for regular text
                    
                  return (
                    <CanvasTextEditor
                      screenshotIndex={index}
                      elementType={elementType as 'heading' | 'subheading'}
                      onClose={stopEditing}
                    />
                  );
                })()
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
