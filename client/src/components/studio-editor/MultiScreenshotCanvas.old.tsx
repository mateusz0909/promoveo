import { useRef, useEffect, useCallback, useState } from 'react';
import { useStudioEditor, type ElementType } from '@/context/StudioEditorContext';

// Helper function to interpolate between two colors
function interpolateGradient(color1: string, color2: string, factor: number): string {
  factor = Math.max(0, Math.min(1, factor));
  
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Helper function to wrap text to fit within a maximum width
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // First split by manual line breaks
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  
  // Process each paragraph
  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      // Preserve empty lines
      lines.push('');
      continue;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

// Individual marketing image canvas component
interface MarketingImageCanvasProps {
  screenshot: any;
  index: number;
  totalImages: number;
  isSelected: boolean;
  selectedElement: string | null;
  isEditing: boolean;
  selectedElements: Set<'heading' | 'subheading'>; // NEW: All selected elements for this screenshot
  onSelect: (index: number | null, elementType: any, multiSelectMode?: boolean) => void;
  onUpdatePosition: (index: number, element: string, position: { x: number; y: number }) => void;
  deviceFrameImage: HTMLImageElement | null;
  global: any;
}

function MarketingImageCanvas({ 
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

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 2600;

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

    // Draw background based on type
    if (global.backgroundType === 'solid') {
      // Solid color background
      ctx.fillStyle = global.backgroundSolid;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (global.backgroundType === 'gradient') {
      // Gradient background with seamless flow across all screenshots
      const angle = global.backgroundGradient.angle ?? 90; // Use nullish coalescing to allow 0
      
      // Determine gradient direction and color flow
      const isHorizontal = angle === 90 || angle === 270;
      const shouldReverseHorizontal = angle === 270; // Right to Left
      
      // Calculate this screenshot's portion of the overall gradient
      const imageWidthInGradient = 1 / totalImages;
      let gradientStart = index * imageWidthInGradient;
      let gradientEnd = (index + 1) * imageWidthInGradient;
      
      // Reverse the interpolation factors for Right to Left only
      if (shouldReverseHorizontal) {
        gradientStart = 1 - gradientStart;
        gradientEnd = 1 - gradientEnd;
        [gradientStart, gradientEnd] = [gradientEnd, gradientStart]; // Swap
      }
      
      // Interpolate colors for this screenshot's slice
      const startColor = interpolateGradient(
        global.backgroundGradient.startColor,
        global.backgroundGradient.endColor,
        isHorizontal ? gradientStart : 0 // Vertical: use full gradient range
      );
      const endColor = interpolateGradient(
        global.backgroundGradient.startColor,
        global.backgroundGradient.endColor,
        isHorizontal ? gradientEnd : 1 // Vertical: use full gradient range
      );
      
      // Create gradient based on direction
      let gradient;
      if (angle === 90) {
        // Left to Right
        gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
      } else if (angle === 270) {
        // Right to Left
        gradient = ctx.createLinearGradient(CANVAS_WIDTH, 0, 0, 0);
      } else if (angle === 180) {
        // Top to Bottom
        gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      } else if (angle === 0) {
        // Bottom to Top
        gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, 0);
      } else {
        // Default: Left to Right
        gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
      }
      
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Default fallback to horizontal gradient
      const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
      gradient.addColorStop(0, global.backgroundGradient.startColor);
      gradient.addColorStop(1, global.backgroundGradient.endColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Calculate mockup dimensions and position
    // Base mockup size: ~700×1400px for ~60% canvas width, leaving space for text
    const mockupWidth = 700 * screenshot.mockupScale;
    const mockupHeight = 1400 * screenshot.mockupScale;
    const mockupX = (CANVAS_WIDTH - mockupWidth) / 2 + screenshot.mockupPosition.x;
    const mockupY = (CANVAS_HEIGHT - mockupHeight) / 2 + screenshot.mockupPosition.y;

    // Constants for text rendering
    const FONT_SCALE_MULTIPLIER = 3.4; // 1200px canvas / ~350px display
    const maxTextWidth = CANVAS_WIDTH * 0.9;
    
    // Calculate X position based on alignment
    // The alignment changes the anchor point, but position offset is always applied
    const getTextX = (align: 'left' | 'center' | 'right', positionOffset: number) => {
      if (align === 'left') {
        return 60 + positionOffset; // Left margin + offset
      } else if (align === 'right') {
        return CANVAS_WIDTH - 60 + positionOffset; // Right margin + offset
      } else {
        return CANVAS_WIDTH / 2 + positionOffset; // Center + offset
      }
    };
    
    const headingX = getTextX(screenshot.headingAlign || 'left', screenshot.headingPosition.x);
    const headingY = 150 + screenshot.headingPosition.y;
    const subheadingX = getTextX(screenshot.subheadingAlign || 'left', screenshot.subheadingPosition.x);
    const subheadingY = 400 + screenshot.subheadingPosition.y;

    // Draw heading text with wrapping (skip if editing this element)
    const isEditingHeading = isEditing && selectedElement === 'heading';
    if (!isEditingHeading) {
      ctx.fillStyle = screenshot.headingColor || '#ffffff';
      const headingFontSize = screenshot.headingFontSize * FONT_SCALE_MULTIPLIER;
      ctx.font = `bold ${headingFontSize}px ${screenshot.fontFamily}`;
      ctx.textAlign = screenshot.headingAlign || 'left';
      ctx.textBaseline = 'top';
      
      // Apply letter spacing (convert percentage to em units)
      const headingLetterSpacing = screenshot.headingLetterSpacing || 0;
      ctx.letterSpacing = `${headingLetterSpacing * 0.01}em`;
      
      // Wrap text with max width of 90% canvas width for better space utilization
      const maxTextWidth = CANVAS_WIDTH * 0.9;
      const headingLines = wrapText(ctx, screenshot.heading, maxTextWidth);
      const headingLineHeight = headingFontSize * (screenshot.headingLineHeight || 1.2);
      
      headingLines.forEach((line, lineIndex) => {
        ctx.fillText(line, headingX, headingY + (lineIndex * headingLineHeight));
      });
      
      // Reset letter spacing
      ctx.letterSpacing = '0px';
    }

    // Draw subheading text with wrapping (skip if editing this element)
    const isEditingSubheading = isEditing && selectedElement === 'subheading';
    if (!isEditingSubheading) {
      ctx.fillStyle = screenshot.subheadingColor || '#ffffff';
      const subheadingFontSize = screenshot.subheadingFontSize * FONT_SCALE_MULTIPLIER;
      ctx.font = `${subheadingFontSize}px ${screenshot.fontFamily}`;
      ctx.textAlign = screenshot.subheadingAlign || 'left';
      ctx.textBaseline = 'top';
      
      // Apply letter spacing (convert percentage to em units)
      const subheadingLetterSpacing = screenshot.subheadingLetterSpacing || 0;
      ctx.letterSpacing = `${subheadingLetterSpacing * 0.01}em`;
      
      const subheadingLines = wrapText(ctx, screenshot.subheading, maxTextWidth);
      const subheadingLineHeight = subheadingFontSize * (screenshot.subheadingLineHeight || 1.2);
      
      subheadingLines.forEach((line, lineIndex) => {
        ctx.fillText(line, subheadingX, subheadingY + (lineIndex * subheadingLineHeight));
      });
      
      // Reset letter spacing
      ctx.letterSpacing = '0px';
    }
    
    // Draw screenshot inside mockup with rotation
    if (screenshotImage) {
      const radius = 40 * screenshot.mockupScale;
      const innerPadding = 20 * screenshot.mockupScale;
      const mockupRotation = screenshot.mockupRotation || 0;
      
      // Calculate center point for rotation
      const centerX = mockupX + mockupWidth / 2;
      const centerY = mockupY + mockupHeight / 2;
      
      ctx.save();
      
      // Apply rotation transformation
      if (mockupRotation !== 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate((mockupRotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      ctx.beginPath();
      ctx.roundRect(
        mockupX + innerPadding,
        mockupY + innerPadding,
        mockupWidth - innerPadding * 2,
        mockupHeight - innerPadding * 2,
        radius
      );
      ctx.clip();
      
      ctx.drawImage(
        screenshotImage,
        mockupX + innerPadding,
        mockupY + innerPadding,
        mockupWidth - innerPadding * 2,
        mockupHeight - innerPadding * 2
      );
      
      ctx.restore();
    }

    // Draw device frame with rotation
    if (deviceFrameImage) {
      const mockupRotation = screenshot.mockupRotation || 0;
      const centerX = mockupX + mockupWidth / 2;
      const centerY = mockupY + mockupHeight / 2;
      
      ctx.save();
      
      // Apply rotation transformation
      if (mockupRotation !== 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate((mockupRotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      ctx.drawImage(deviceFrameImage, mockupX, mockupY, mockupWidth, mockupHeight);
      ctx.restore();
    } else {
      // Fallback border with rotation
      const mockupRotation = screenshot.mockupRotation || 0;
      const centerX = mockupX + mockupWidth / 2;
      const centerY = mockupY + mockupHeight / 2;
      
      ctx.save();
      
      if (mockupRotation !== 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate((mockupRotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 8 * screenshot.mockupScale;
      ctx.beginPath();
      ctx.roundRect(mockupX, mockupY, mockupWidth, mockupHeight, 40 * screenshot.mockupScale);
      ctx.stroke();
      ctx.restore();
    }

    // Draw selection indicators (skip mockup - handled by TransformControls)
    // Show selection for either primary selection or multi-select
    const showSelectionForHeading = selectedElements.has('heading');
    const showSelectionForSubheading = selectedElements.has('subheading');
    
    if (showSelectionForHeading && !isEditing) {
      // Determine color based on whether this is the primary selection
      const isPrimarySelection = isSelected && selectedElement === 'heading';
      ctx.strokeStyle = isPrimarySelection ? '#3b82f6' : '#60a5fa';
      ctx.lineWidth = isPrimarySelection ? 8 : 6;
      ctx.setLineDash([20, 10]);
      
      const headingFontSize = screenshot.headingFontSize * FONT_SCALE_MULTIPLIER;
      ctx.font = `bold ${headingFontSize}px ${screenshot.fontFamily}`;
      ctx.textAlign = screenshot.headingAlign || 'left';
      const headingLines = wrapText(ctx, screenshot.heading, maxTextWidth);
      const headingLineHeight = headingFontSize * (screenshot.headingLineHeight || 1.2);
      const totalHeight = headingLines.length * headingLineHeight;
      
      // Find widest line for bounding box
      let maxLineWidth = 0;
      headingLines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxLineWidth = Math.max(maxLineWidth, metrics.width);
      });
      
      // Calculate bounding box based on alignment
      let boxX, boxY, boxWidth, boxHeight;
      const align = screenshot.headingAlign || 'left';
      boxY = headingY - 20;
      boxWidth = maxLineWidth + 40;
      boxHeight = totalHeight + 40;
      
      if (align === 'left') {
        boxX = headingX - 20;
      } else if (align === 'right') {
        boxX = headingX - maxLineWidth - 20;
      } else {
        boxX = headingX - maxLineWidth / 2 - 20;
      }
      
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.setLineDash([]);
    }
    
    if (showSelectionForSubheading && !isEditing) {
      // Determine color based on whether this is the primary selection
      const isPrimarySelection = isSelected && selectedElement === 'subheading';
      ctx.strokeStyle = isPrimarySelection ? '#3b82f6' : '#60a5fa';
      ctx.lineWidth = isPrimarySelection ? 8 : 6;
      ctx.setLineDash([20, 10]);
      
      const subheadingFontSize = screenshot.subheadingFontSize * FONT_SCALE_MULTIPLIER;
      ctx.font = `${subheadingFontSize}px ${screenshot.fontFamily}`;
      ctx.textAlign = screenshot.subheadingAlign || 'left';
      const subheadingLines = wrapText(ctx, screenshot.subheading, maxTextWidth);
      const subheadingLineHeight = subheadingFontSize * (screenshot.subheadingLineHeight || 1.2);
      const totalHeight = subheadingLines.length * subheadingLineHeight;
      
      // Find widest line for bounding box
      let maxLineWidth = 0;
      subheadingLines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxLineWidth = Math.max(maxLineWidth, metrics.width);
      });
      
      // Calculate bounding box based on alignment
      let boxX, boxY, boxWidth, boxHeight;
      const align = screenshot.subheadingAlign || 'left';
      boxY = subheadingY - 20;
      boxWidth = maxLineWidth + 40;
      boxHeight = totalHeight + 40;
      
      if (align === 'left') {
        boxX = subheadingX - 20;
      } else if (align === 'right') {
        boxX = subheadingX - maxLineWidth - 20;
      } else {
        boxX = subheadingX - maxLineWidth / 2 - 20;
      }
      
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.setLineDash([]);
    }
  }, [screenshot, screenshotImage, deviceFrameImage, global, isSelected, selectedElement, selectedElements, isEditing, index, totalImages]);

  // Helper function to detect which element was clicked
  const getClickedElement = useCallback((canvas: HTMLCanvasElement, clickX: number, clickY: number): ElementType | null => {
    const mockupWidth = 700 * screenshot.mockupScale;
    const mockupHeight = 1400 * screenshot.mockupScale;
    const mockupX = (CANVAS_WIDTH - mockupWidth) / 2 + screenshot.mockupPosition.x;
    const mockupY = (CANVAS_HEIGHT - mockupHeight) / 2 + screenshot.mockupPosition.y;
    const mockupRotation = screenshot.mockupRotation || 0;
    
    // Check mockup with rotation
    if (mockupRotation !== 0) {
      // Transform click point to mockup's local coordinate space
      const centerX = mockupX + mockupWidth / 2;
      const centerY = mockupY + mockupHeight / 2;
      
      // Translate to origin
      const translatedX = clickX - centerX;
      const translatedY = clickY - centerY;
      
      // Rotate (inverse rotation)
      const rad = (-mockupRotation * Math.PI) / 180;
      const rotatedX = translatedX * Math.cos(rad) - translatedY * Math.sin(rad);
      const rotatedY = translatedX * Math.sin(rad) + translatedY * Math.cos(rad);
      
      // Translate back
      const localX = rotatedX + centerX;
      const localY = rotatedY + centerY;
      
      // Check bounds in local space
      if (
        localX >= mockupX && 
        localX <= mockupX + mockupWidth &&
        localY >= mockupY && 
        localY <= mockupY + mockupHeight
      ) {
        return 'mockup';
      }
    } else {
      // No rotation - simple bounds check
      if (
        clickX >= mockupX && 
        clickX <= mockupX + mockupWidth &&
        clickY >= mockupY && 
        clickY <= mockupY + mockupHeight
      ) {
        return 'mockup';
      }
    }

    // Check heading (with multi-line support)
    const FONT_SCALE_MULTIPLIER = 3.4;
    const maxTextWidth = CANVAS_WIDTH * 0.9;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const headingX = CANVAS_WIDTH / 2 + screenshot.headingPosition.x;
      const headingY = 150 + screenshot.headingPosition.y;
      const headingFontSize = screenshot.headingFontSize * FONT_SCALE_MULTIPLIER;
      
      ctx.font = `bold ${headingFontSize}px ${screenshot.fontFamily}`;
      const headingLines = wrapText(ctx, screenshot.heading, maxTextWidth);
      const headingLineHeight = headingFontSize * (screenshot.headingLineHeight || 1.2);
      const headingTotalHeight = headingLines.length * headingLineHeight;
      
      let headingMaxWidth = 0;
      headingLines.forEach(line => {
        const metrics = ctx.measureText(line);
        headingMaxWidth = Math.max(headingMaxWidth, metrics.width);
      });
      
      if (
        clickX >= headingX - headingMaxWidth / 2 - 20 && 
        clickX <= headingX + headingMaxWidth / 2 + 20 && 
        clickY >= headingY - 20 && 
        clickY <= headingY + headingTotalHeight + 20
      ) {
        return 'heading';
      }

      // Check subheading (with multi-line support)
      const subheadingX = CANVAS_WIDTH / 2 + screenshot.subheadingPosition.x;
      const subheadingY = 400 + screenshot.subheadingPosition.y;
      const subheadingFontSize = screenshot.subheadingFontSize * FONT_SCALE_MULTIPLIER;
      
      ctx.font = `${subheadingFontSize}px ${screenshot.fontFamily}`;
      const subheadingLines = wrapText(ctx, screenshot.subheading, maxTextWidth);
      const subheadingLineHeight = subheadingFontSize * (screenshot.subheadingLineHeight || 1.2);
      const subheadingTotalHeight = subheadingLines.length * subheadingLineHeight;
      
      let subheadingMaxWidth = 0;
      subheadingLines.forEach(line => {
        const metrics = ctx.measureText(line);
        subheadingMaxWidth = Math.max(subheadingMaxWidth, metrics.width);
      });
      
      if (
        clickX >= subheadingX - subheadingMaxWidth / 2 - 20 && 
        clickX <= subheadingX + subheadingMaxWidth / 2 + 20 && 
        clickY >= subheadingY - 20 && 
        clickY <= subheadingY + subheadingTotalHeight + 20
      ) {
        return 'subheading';
      }
    }

    return null;
  }, [screenshot, CANVAS_WIDTH, CANVAS_HEIGHT]);

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

    // Use helper to detect clicked element
    const clickedElement = getClickedElement(canvas, clickX, clickY);
    
    if (clickedElement) {
      // Select the clicked element (with multi-select support)
      onSelect(index, clickedElement, multiSelectMode);
    } else {
      // Click outside any element - only clear if not in multi-select mode
      if (!multiSelectMode) {
        onSelect(null, null);
      }
    }
  }, [getClickedElement, index, onSelect]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Check if clicking on an element - only start dragging if we hit an element
    const hitElement = getClickedElement(canvas, clickX, clickY);
    
    if (hitElement) {
      // If clicking the currently selected element, start dragging
      if (isSelected && selectedElement === hitElement) {
        setIsDragging(true);
        setDragStart({ x: clickX, y: clickY });
      }
    }
    // If clicking outside any element, the handleClick will handle unfocusing
  }, [isSelected, selectedElement, getClickedElement]);

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
    
    // Parent will handle starting edit mode
    event.stopPropagation();
    
    // Signal that we want to edit (parent component will handle this)
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

import { CanvasTextEditor } from './CanvasTextEditor';
import { TransformControls } from './TransformControls';

// Wrapper component that calculates display scale dynamically
interface TransformControlsWrapperProps {
  screenshot: any;
  index: number;
  mockupX: number;
  mockupY: number;
  mockupWidth: number;
  mockupHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  updateScreenshotPosition: (index: number, element: 'mockup', position: { x: number; y: number }) => void;
  updateScreenshotScale: (index: number, scale: number) => void;
  updateScreenshotRotation: (index: number, rotation: number) => void;
}

function TransformControlsWrapper({
  screenshot,
  index,
  mockupX,
  mockupY,
  mockupWidth,
  mockupHeight,
  canvasWidth,
  canvasHeight,
  updateScreenshotPosition,
  updateScreenshotScale,
  updateScreenshotRotation,
}: TransformControlsWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

  // Find the canvas element within this wrapper's parent and calculate display scale
  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        // Find the canvas sibling within the same parent
        const parent = wrapperRef.current.parentElement;
        const canvas = parent?.querySelector('canvas') as HTMLCanvasElement;
        
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const scale = rect.width / canvasWidth;
          setDisplayScale(scale);
        }
      }
    };
    
    updateScale();
    
    // Recalculate on window resize
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasWidth]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 pointer-events-none">
      <TransformControls
        x={mockupX}
        y={mockupY}
        width={mockupWidth}
        height={mockupHeight}
        rotation={screenshot.mockupRotation || 0}
        displayScale={displayScale}
        onTransform={(transform) => {
          // Update position
          const newX = transform.x - (canvasWidth - transform.width) / 2;
          const newY = transform.y - (canvasHeight - transform.height) / 2;
          updateScreenshotPosition(index, 'mockup', { x: newX, y: newY });
          
          // Update scale
          updateScreenshotScale(index, transform.scale);
          
          // Update rotation
          updateScreenshotRotation(index, transform.rotation);
        }}
        showRotationHandle={true}
        showScaleHandles={true}
        minScale={0.3}
        maxScale={2.5}
      />
    </div>
  );
}

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
    stopEditing 
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
    // Only clear if clicking directly on the background, not on canvases
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
        className="flex gap-6 items-start p-6"
        style={{ 
          transform: `scale(${view.zoom})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease-out'
        }}
      >
        {screenshots.map((screenshot, index) => {
          const isThisScreenshotEditing = selection.isEditing && selection.screenshotIndex === index;
          
          const handleWrapperClick = (e: React.MouseEvent) => {
            // If in editing mode and clicking the canvas (not the textarea), close editor
            if (isThisScreenshotEditing) {
              const target = e.target as HTMLElement;
              const isTextarea = target.closest('[data-canvas-text-editor]');
              const isCanvas = target.tagName === 'CANVAS';
              
              // If clicking canvas but not textarea, close editing
              if (isCanvas && !isTextarea) {
                stopEditing();
              }
            }
          };
          
          const CANVAS_WIDTH = 1200;
          const CANVAS_HEIGHT = 2600;
          
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
                updateScreenshotPosition={updateScreenshotPosition}
                updateScreenshotScale={updateScreenshotScale}
                updateScreenshotRotation={updateScreenshotRotation}
              />
            )}
            
            {/* In-canvas text editor - positioned relative to this canvas */}
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
