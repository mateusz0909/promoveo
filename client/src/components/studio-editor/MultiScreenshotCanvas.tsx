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

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { MarketingImageCanvas } from './canvas/MarketingImageCanvas';
import { CanvasTextEditor } from './CanvasTextEditor';
import { TransformControlsWrapper } from './canvas/TransformControlsWrapper';
import { VisualTransformControlsWrapper } from './canvas/VisualTransformControlsWrapper';
import { TextTransformControlsWrapper } from './canvas/TextTransformControlsWrapper';
import { getCanvasMetrics } from './canvas/utils';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { isTextElement, isMockupElement, isVisualElement } from '@/context/studio-editor/elementTypes';

export function MultiScreenshotCanvas() {
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
    updateTextWidth,
    startEditing,
    stopEditing,
    setZoom,
  } = useStudioEditor();

  const metrics = useMemo(() => getCanvasMetrics(global.deviceFrame), [global.deviceFrame]);
  const canvasWidth = metrics.width;
  const canvasHeight = metrics.height;
  const devicePreset = metrics.preset;

  // Load device frame
  const [deviceFrameImage, setDeviceFrameImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!global.showDeviceFrame) {
      setDeviceFrameImage(null);
      return;
    }

    const frameImg = new Image();
    frameImg.onload = () => setDeviceFrameImage(frameImg);
    frameImg.onerror = () => {
      console.error('Failed to load device frame');
      setDeviceFrameImage(null);
    };
    frameImg.src = devicePreset.frameAsset;

    return () => {
      frameImg.onload = null;
      frameImg.onerror = null;
    };
  }, [devicePreset.frameAsset, global.showDeviceFrame]);

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
    if (index === null) {
      clearSelection();
      return;
    }

    selectElement(index, elementId);
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
      className="relative h-full w-full min-w-0 overflow-auto bg-muted/30"
      onClick={handleBackgroundClick}
    >
      <div 
        className="flex gap-2 items-start p-6 min-w-min"
        style={{ 
          transform: `scale(${view.zoom})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease-out'
        }}
      >
        {screenshots.map((screenshot, index) => {
          const isSelected = selection.screenshotIndex === index;
          const selectedElementId = isSelected ? selection.elementId : null;
          const selectedElementIds = isSelected ? selection.selectedElementIds : [];
          const isCanvasSelected = isSelected && !selectedElementId;
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
                selectedElementIds={selectedElementIds}
                primarySelectedElementId={selectedElementId}
                isEditing={isThisScreenshotEditing}
                onSelect={handleSelect}
                onUpdatePosition={handleUpdatePosition}
                deviceFrameImage={global.showDeviceFrame ? deviceFrameImage : null}
                global={global}
                isCanvasSelected={isCanvasSelected}
              />
              
              {/* Transform controls for mockup elements */}
              {selectedElement && isMockupElement(selectedElement) && !selection.isEditing && (
                (() => {
                  const baseWidth = selectedElement.baseWidth;
                  const baseHeight = selectedElement.baseHeight;
                  const scaledWidth = baseWidth * selectedElement.scale;
                  const scaledHeight = baseHeight * selectedElement.scale;
                  const mockupCenterX = (canvasWidth - scaledWidth) / 2 + selectedElement.position.x;
                  const mockupCenterY = (canvasHeight - scaledHeight) / 2 + selectedElement.position.y;

                  return (
                    <TransformControlsWrapper
                      index={index}
                      elementId={selectedElement.id}
                      mockupX={mockupCenterX}
                      mockupY={mockupCenterY}
                      mockupWidth={scaledWidth}
                      mockupHeight={scaledHeight}
                      baseWidth={baseWidth}
                      canvasWidth={canvasWidth}
                      canvasHeight={canvasHeight}
                      zoom={view.zoom}
                      rotation={selectedElement.rotation || 0}
                      updateScreenshotPosition={(idx, elemId, pos) => updateElementPosition(idx, elemId as string, pos)}
                      updateScreenshotScale={(idx, scale, elemId) => updateElementScale(idx, elemId || selectedElement.id, scale)}
                      updateScreenshotRotation={(idx, rotation, elemId) => updateElementRotation(idx, elemId || selectedElement.id, rotation)}
                    />
                  );
                })()
              )}
              
              {/* Transform controls for text elements (when not editing) */}
              {selectedElement && isTextElement(selectedElement) && !selection.isEditing && (
                <TextTransformControlsWrapper
                  screenshot={screenshot}
                  index={index}
                  element={selectedElement}
                  canvasWidth={canvasWidth}
                  fontScaleMultiplier={metrics.fontScaleMultiplier}
                  defaultTextWidth={metrics.defaultTextWidth}
                  zoom={view.zoom}
                  updateTextWidth={updateTextWidth}
                  updateTextPosition={(idx, elemId, pos) => updateElementPosition(idx, elemId, pos)}
                  updateTextRotation={(idx, elemId, rotation) => updateElementRotation(idx, elemId, rotation)}
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
                      canvasWidth={canvasWidth}
                      canvasHeight={canvasHeight}
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
                  const inferredWeight = selectedElement.fontWeight ?? (selectedElement.isBold ? 700 : 400);
                  const elementType = selectedElement.id.startsWith('heading-') 
                    ? 'heading' 
                    : selectedElement.id.startsWith('subheading-')
                    ? 'subheading'
                    : inferredWeight >= 600 
                    ? 'heading'
                    : 'subheading';
                    
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
