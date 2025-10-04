/**
 * Individual marketing image canvas component
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils';
import { drawBackground } from './backgroundRenderer';
import { drawText, drawTextSelection } from './textRenderer';
import { drawMockup } from './mockupRenderer';
import { getClickedElement } from './hitDetection';

export interface MarketingImageCanvasProps {
  screenshot: any;
  index: number;
  totalImages: number;
  isSelected: boolean;
  selectedElement: string | null;
  isEditing: boolean;
  selectedElements: Set<'heading' | 'subheading'>;
  onSelect: (index: number | null, elementType: any, multiSelectMode?: boolean) => void;
  onUpdatePosition: (index: number, element: string, position: { x: number; y: number }) => void;
  deviceFrameImage: HTMLImageElement | null;
  global: any;
}

export function MarketingImageCanvas({ 
  screenshot, 
  index,
  totalImages,
  isSelected, 
  selectedElement,
  isEditing,
  selectedElements,
  onSelect,
  onUpdatePosition,
  deviceFrameImage,
  global 
}: MarketingImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenshotImage, setScreenshotImage] = useState<HTMLImageElement | null>(null);
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

  // Draw the marketing image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    drawBackground(ctx, global, CANVAS_WIDTH, CANVAS_HEIGHT, index, totalImages);

    // Draw heading text (skip if editing)
    const isEditingHeading = isEditing && selectedElement === 'heading';
    if (!isEditingHeading) {
      drawText(ctx, {
        text: screenshot.heading,
        fontFamily: screenshot.fontFamily,
        fontSize: screenshot.headingFontSize,
        color: screenshot.headingColor || '#ffffff',
        align: screenshot.headingAlign || 'left',
        position: screenshot.headingPosition,
        letterSpacing: screenshot.headingLetterSpacing || 0,
        lineHeight: screenshot.headingLineHeight || 1.2,
        isBold: true,
      }, 150);
    }

    // Draw subheading text (skip if editing)
    const isEditingSubheading = isEditing && selectedElement === 'subheading';
    if (!isEditingSubheading) {
      drawText(ctx, {
        text: screenshot.subheading,
        fontFamily: screenshot.fontFamily,
        fontSize: screenshot.subheadingFontSize,
        color: screenshot.subheadingColor || '#ffffff',
        align: screenshot.subheadingAlign || 'left',
        position: screenshot.subheadingPosition,
        letterSpacing: screenshot.subheadingLetterSpacing || 0,
        lineHeight: screenshot.subheadingLineHeight || 1.2,
      }, 400);
    }
    
    // Draw mockup with screenshot
    if (screenshotImage) {
      drawMockup(
        ctx,
        screenshotImage,
        deviceFrameImage,
        {
          position: screenshot.mockupPosition,
          scale: screenshot.mockupScale,
          rotation: screenshot.mockupRotation || 0,
          baseWidth: 700,
          baseHeight: 1400,
          cornerRadius: 40,
          innerPadding: 20,
        },
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
    }

    // Draw selection indicators
    const showSelectionForHeading = selectedElements.has('heading');
    const showSelectionForSubheading = selectedElements.has('subheading');
    
    if (showSelectionForHeading && !isEditing) {
      const isPrimarySelection = isSelected && selectedElement === 'heading';
      drawTextSelection(ctx, {
        text: screenshot.heading,
        fontFamily: screenshot.fontFamily,
        fontSize: screenshot.headingFontSize,
        color: screenshot.headingColor || '#ffffff',
        align: screenshot.headingAlign || 'left',
        position: screenshot.headingPosition,
        letterSpacing: screenshot.headingLetterSpacing || 0,
        lineHeight: screenshot.headingLineHeight || 1.2,
        isBold: true,
      }, 150, isPrimarySelection);
    }
    
    if (showSelectionForSubheading && !isEditing) {
      const isPrimarySelection = isSelected && selectedElement === 'subheading';
      drawTextSelection(ctx, {
        text: screenshot.subheading,
        fontFamily: screenshot.fontFamily,
        fontSize: screenshot.subheadingFontSize,
        color: screenshot.subheadingColor || '#ffffff',
        align: screenshot.subheadingAlign || 'left',
        position: screenshot.subheadingPosition,
        letterSpacing: screenshot.subheadingLetterSpacing || 0,
        lineHeight: screenshot.subheadingLineHeight || 1.2,
      }, 400, isPrimarySelection);
    }
  }, [screenshot, screenshotImage, deviceFrameImage, global, isSelected, selectedElement, selectedElements, isEditing, index, totalImages]);

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

    // Detect clicked element
    const clickedElement = getClickedElement({ screenshot, canvas, clickX, clickY });
    
    if (clickedElement) {
      onSelect(index, clickedElement, multiSelectMode);
    } else {
      // Click outside - only clear if not in multi-select mode
      if (!multiSelectMode) {
        onSelect(null, null);
      }
    }
  }, [screenshot, index, onSelect]);

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
    const hitElement = getClickedElement({ screenshot, canvas, clickX, clickY });
    
    if (hitElement && isSelected && selectedElement === hitElement) {
      setIsDragging(true);
      setDragStart({ x: clickX, y: clickY });
    }
  }, [isSelected, selectedElement, screenshot]);

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

    let currentPos;
    if (selectedElement === 'heading') {
      currentPos = screenshot.headingPosition;
    } else if (selectedElement === 'subheading') {
      currentPos = screenshot.subheadingPosition;
    } else if (selectedElement === 'mockup') {
      currentPos = screenshot.mockupPosition;
    } else {
      return;
    }

    onUpdatePosition(index, selectedElement, {
      x: currentPos.x + deltaX,
      y: currentPos.y + deltaY,
    });

    setDragStart({ x: mouseX, y: mouseY });
  }, [isDragging, dragStart, selectedElement, screenshot, index, onUpdatePosition]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Handle double-click to start editing text
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedElement || (selectedElement !== 'heading' && selectedElement !== 'subheading')) return;
    
    event.stopPropagation();
    
    window.dispatchEvent(new CustomEvent('startTextEditing', { 
      detail: { screenshotIndex: index, elementType: selectedElement } 
    }));
  }, [selectedElement, index]);

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
