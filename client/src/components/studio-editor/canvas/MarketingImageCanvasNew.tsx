/**
 * Individual marketing image canvas component - Refactored with unified element system
 * 
 * This component renders a single marketing screenshot with:
 * - Background (gradient or solid color)
 * - All elements (text, mockups, visuals) in z-index order
 * - Selection indicators for selected elements
 * 
 * Uses the new unified rendering pipeline from elementRenderer.ts
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils';
import { drawBackground } from './backgroundRenderer';
import { renderAllElements, renderSelectionIndicator } from './elementRenderer';
import { getElementAtPoint } from './hitDetectionNew';
import type { ScreenshotState } from '@/context/studio-editor/types';

export interface MarketingImageCanvasProps {
  screenshot: ScreenshotState;
  index: number;
  totalImages: number;
  isSelected: boolean;
  selectedElement: string | null;
  isEditing: boolean;
  onSelect: (index: number | null, elementId: string | null, multiSelectMode?: boolean) => void;
  onUpdatePosition: (index: number, elementId: string, position: { x: number; y: number }) => void;
  deviceFrameImage: HTMLImageElement | null;
  global: {
    backgroundType: 'gradient' | 'solid' | 'image';
    backgroundSolid: string;
    backgroundGradient: {
      startColor: string;
      endColor: string;
      angle: number;
    };
    backgroundImage?: {
      url: string;
      fit?: 'cover' | 'contain' | 'fill' | 'tile';
      opacity?: number;
    };
  };
}

export function MarketingImageCanvas({ 
  screenshot, 
  index,
  totalImages,
  isSelected, 
  selectedElement,
  isEditing,
  onSelect,
  onUpdatePosition,
  deviceFrameImage,
  global 
}: MarketingImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenshotImage, setScreenshotImage] = useState<HTMLImageElement | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [imageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Load screenshot image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setScreenshotImage(img);
    img.onerror = () => console.error('Failed to load screenshot');
    
    const imageUrl = screenshot.image.sourceScreenshotUrl || screenshot.image.generatedImageUrl;
    if (imageUrl) {
      img.src = imageUrl;
    }
  }, [screenshot.image]);

  // Load background image when URL changes
  useEffect(() => {
    if (global.backgroundType === 'image' && global.backgroundImage?.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setBackgroundImage(img);
      img.onerror = () => {
        console.error('Failed to load background image');
        setBackgroundImage(null);
      };
      img.src = global.backgroundImage.url;
    } else {
      setBackgroundImage(null);
    }
  }, [global.backgroundType, global.backgroundImage?.url]);

  // Main render effect - uses unified rendering pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Async render function
    (async () => {
      try {
        // Step 1: Draw background
        // Cast to BackgroundConfig - the global object comes from context with all required fields
        drawBackground(
          ctx, 
          global as any, // TODO: Type properly once global state types are unified
          CANVAS_WIDTH, 
          CANVAS_HEIGHT, 
          index, 
          totalImages, 
          backgroundImage
        );

        // Step 2: Render all elements using unified pipeline
        await renderAllElements(
          ctx,
          screenshot.elements || [],
          screenshotImage,
          deviceFrameImage,
          imageCache
        );

        // Step 3: Draw selection indicator for selected element (if not editing)
        if (isSelected && selectedElement && !isEditing) {
          const selectedElementData = screenshot.elements?.find(el => el.id === selectedElement);
          if (selectedElementData) {
            renderSelectionIndicator(ctx, selectedElementData);
          }
        }
      } catch (error) {
        console.error('Error rendering canvas:', error);
      }
    })();
  }, [
    screenshot.elements,
    screenshot.image,
    screenshotImage,
    deviceFrameImage,
    backgroundImage,
    imageCache,
    global,
    isSelected,
    selectedElement,
    isEditing,
    index,
    totalImages
  ]);

  // Handle click detection
  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Check if Cmd (macOS) or Ctrl (Windows/Linux) key is pressed for multi-select
    const multiSelectMode = event.metaKey || event.ctrlKey;

    // Detect clicked element using unified hit detection
    const clickedElementId = getElementAtPoint(
      clickX,
      clickY,
      screenshot.elements || [],
      canvas
    );
    
    if (clickedElementId) {
      onSelect(index, clickedElementId, multiSelectMode);
    } else {
      // Click outside - only clear if not in multi-select mode
      if (!multiSelectMode) {
        onSelect(null, null);
      }
    }
  }, [screenshot.elements, index, onSelect]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Check if clicking on an element
    const hitElementId = getElementAtPoint(
      clickX,
      clickY,
      screenshot.elements || [],
      canvas
    );
    
    if (hitElementId && isSelected && selectedElement === hitElementId) {
      setIsDragging(true);
      setDragStart({ x: clickX, y: clickY });
    }
  }, [isSelected, selectedElement, screenshot.elements]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;

    // Find the element being dragged
    const element = screenshot.elements?.find(el => el.id === selectedElement);
    if (!element) return;

    // Update position with delta
    onUpdatePosition(index, selectedElement, {
      x: element.position.x + deltaX,
      y: element.position.y + deltaY,
    });

    setDragStart({ x: mouseX, y: mouseY });
  }, [isDragging, dragStart, selectedElement, screenshot.elements, index, onUpdatePosition]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Handle double-click to start editing text
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedElement) return;
    
    // Only allow editing text elements
    const element = screenshot.elements?.find(el => el.id === selectedElement);
    if (!element || element.kind !== 'text') return;
    
    event.stopPropagation();
    
    // Dispatch custom event for inline text editing
    window.dispatchEvent(new CustomEvent('startTextEditing', { 
      detail: { screenshotIndex: index, elementId: selectedElement } 
    }));
  }, [selectedElement, screenshot.elements, index]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`shadow-lg rounded-lg transition-all ${
        isDragging ? 'cursor-grabbing' : isSelected && selectedElement ? 'cursor-grab' : 'cursor-pointer'
      }`}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: '350px',
      }}
    />
  );
}
