/**
 * Hit detection utilities for canvas elements
 */

import { wrapText, CANVAS_WIDTH, CANVAS_HEIGHT, FONT_SCALE_MULTIPLIER } from './utils';
import type { ElementType } from '@/context/StudioEditorContext';

export interface HitTestConfig {
  screenshot: any;
  canvas: HTMLCanvasElement;
  clickX: number;
  clickY: number;
}

/**
 * Detect which element was clicked on the canvas
 */
export function getClickedElement(config: HitTestConfig): ElementType | null {
  const { screenshot, canvas, clickX, clickY } = config;
  
  // Check if we're using instance-based architecture
  const textInstances = screenshot.textInstances || [];
  const mockupInstances = screenshot.mockupInstances || [];
  const useInstanceMode = textInstances.length > 0 || mockupInstances.length > 0;

  if (useInstanceMode) {
    // ========== INSTANCE-BASED HIT DETECTION ==========
    
    // Check mockup instances
    for (const mockupInstance of mockupInstances) {
      const mockupWidth = 700 * mockupInstance.scale;
      const mockupHeight = 1400 * mockupInstance.scale;
      const mockupX = (CANVAS_WIDTH - mockupWidth) / 2 + mockupInstance.position.x;
      const mockupY = (CANVAS_HEIGHT - mockupHeight) / 2 + mockupInstance.position.y;
      const mockupRotation = mockupInstance.rotation || 0;
      
      if (mockupRotation !== 0) {
        // Transform click point to mockup's local coordinate space
        const centerX = mockupX + mockupWidth / 2;
        const centerY = mockupY + mockupHeight / 2;
        
        const translatedX = clickX - centerX;
        const translatedY = clickY - centerY;
        
        const rad = (-mockupRotation * Math.PI) / 180;
        const rotatedX = translatedX * Math.cos(rad) - translatedY * Math.sin(rad);
        const rotatedY = translatedX * Math.sin(rad) + translatedY * Math.cos(rad);
        
        const localX = rotatedX + centerX;
        const localY = rotatedY + centerY;
        
        if (
          localX >= mockupX && 
          localX <= mockupX + mockupWidth &&
          localY >= mockupY && 
          localY <= mockupY + mockupHeight
        ) {
          return mockupInstance.id as ElementType;
        }
      } else {
        if (
          clickX >= mockupX && 
          clickX <= mockupX + mockupWidth &&
          clickY >= mockupY && 
          clickY <= mockupY + mockupHeight
        ) {
          return mockupInstance.id as ElementType;
        }
      }
    }

    // Check visuals
    const visuals = screenshot.image.configuration?.visuals || [];
    const sortedVisuals = [...visuals].sort((a, b) => b.zIndex - a.zIndex);
    
    for (const visual of sortedVisuals) {
      const baseWidth = visual.width || 300;
      const baseHeight = visual.height || 300;
      const visualWidth = baseWidth * visual.scale;
      const visualHeight = baseHeight * visual.scale;
      
      const visualX = visual.position.x - visualWidth / 2;
      const visualY = visual.position.y - visualHeight / 2;
      const rotation = visual.rotation || 0;
      
      if (rotation !== 0) {
        const centerX = visual.position.x;
        const centerY = visual.position.y;
        
        const translatedX = clickX - centerX;
        const translatedY = clickY - centerY;
        
        const rad = (-rotation * Math.PI) / 180;
        const rotatedX = translatedX * Math.cos(rad) - translatedY * Math.sin(rad);
        const rotatedY = translatedX * Math.sin(rad) + translatedY * Math.cos(rad);
        
        if (
          Math.abs(rotatedX) <= visualWidth / 2 && 
          Math.abs(rotatedY) <= visualHeight / 2
        ) {
          return `visual-${visual.id}` as ElementType;
        }
      } else {
        if (
          clickX >= visualX && 
          clickX <= visualX + visualWidth &&
          clickY >= visualY && 
          clickY <= visualY + visualHeight
        ) {
          return `visual-${visual.id}` as ElementType;
        }
      }
    }

    // Check text instances
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const maxTextWidth = CANVAS_WIDTH * 0.9;
    
    for (const textInstance of textInstances) {
      if (!textInstance.text || textInstance.text === '') continue;
      
      const fontSize = textInstance.fontSize * FONT_SCALE_MULTIPLIER;
      const fontWeight = textInstance.type === 'heading' ? 'bold' : 'normal';
      ctx.font = `${fontWeight} ${fontSize}px ${textInstance.fontFamily}`;
      
      const lines = wrapText(ctx, textInstance.text, maxTextWidth);
      const lineHeight = fontSize * (textInstance.lineHeight || 1.2);
      const totalHeight = lines.length * lineHeight;
      
      let maxWidth = 0;
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      
      // Calculate bounds based on alignment
      let minX: number, maxX: number;
      const textX = textInstance.position.x;
      const textY = textInstance.position.y;
      const align = textInstance.align || 'left';
      
      if (align === 'left') {
        minX = textX - 20;
        maxX = textX + maxWidth + 20;
      } else if (align === 'right') {
        minX = textX - maxWidth - 20;
        maxX = textX + 20;
      } else {
        minX = textX - maxWidth / 2 - 20;
        maxX = textX + maxWidth / 2 + 20;
      }
      
      if (
        clickX >= minX && 
        clickX <= maxX && 
        clickY >= textY - 20 && 
        clickY <= textY + totalHeight + 20
      ) {
        return textInstance.id as ElementType;
      }
    }

    // If no instance was clicked, fall through to check legacy elements below
  }

  // ========== LEGACY SINGLE-ELEMENT HIT DETECTION ==========
  // Always check legacy elements as fallback (even if instances exist)
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

  // Check visuals (in reverse Z-index order, so top elements are checked first)
  const visuals = screenshot.image.configuration?.visuals || [];
  const sortedVisuals = [...visuals].sort((a, b) => b.zIndex - a.zIndex);
  
  for (const visual of sortedVisuals) {
    // Use actual visual dimensions
    const baseWidth = visual.width || 300; // Fallback to 300 if not set
    const baseHeight = visual.height || 300; // Fallback to 300 if not set
    const visualWidth = baseWidth * visual.scale;
    const visualHeight = baseHeight * visual.scale;
    
    // Visual position is the CENTER, so calculate top-left corner
    const visualX = visual.position.x - visualWidth / 2;
    const visualY = visual.position.y - visualHeight / 2;
    const rotation = visual.rotation || 0;
    
    if (rotation !== 0) {
      // Transform click point to visual's local coordinate space
      const centerX = visual.position.x;
      const centerY = visual.position.y;
      
      // Translate to origin
      const translatedX = clickX - centerX;
      const translatedY = clickY - centerY;
      
      // Rotate (inverse rotation)
      const rad = (-rotation * Math.PI) / 180;
      const rotatedX = translatedX * Math.cos(rad) - translatedY * Math.sin(rad);
      const rotatedY = translatedX * Math.sin(rad) + translatedY * Math.cos(rad);
      
      // Check bounds in local space (centered on origin)
      if (
        Math.abs(rotatedX) <= visualWidth / 2 && 
        Math.abs(rotatedY) <= visualHeight / 2
      ) {
        return `visual-${visual.id}` as ElementType;
      }
    } else {
      // No rotation - simple bounds check
      if (
        clickX >= visualX && 
        clickX <= visualX + visualWidth &&
        clickY >= visualY && 
        clickY <= visualY + visualHeight
      ) {
        return `visual-${visual.id}` as ElementType;
      }
    }
  }

  // Check heading (with multi-line support)
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const maxTextWidth = CANVAS_WIDTH * 0.9;
  
  // Helper to get text X position
  const getTextX = (align: 'left' | 'center' | 'right', positionOffset: number) => {
    if (align === 'left') {
      return 60 + positionOffset;
    } else if (align === 'right') {
      return CANVAS_WIDTH - 60 + positionOffset;
    } else {
      return CANVAS_WIDTH / 2 + positionOffset;
    }
  };
  
  const headingX = getTextX(screenshot.headingAlign || 'left', screenshot.headingPosition.x);
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
  
  // Calculate heading bounds based on alignment
  let headingMinX: number, headingMaxX: number;
  const align = screenshot.headingAlign || 'left';
  
  if (align === 'left') {
    headingMinX = headingX - 20;
    headingMaxX = headingX + headingMaxWidth + 20;
  } else if (align === 'right') {
    headingMinX = headingX - headingMaxWidth - 20;
    headingMaxX = headingX + 20;
  } else {
    headingMinX = headingX - headingMaxWidth / 2 - 20;
    headingMaxX = headingX + headingMaxWidth / 2 + 20;
  }
  
  if (
    clickX >= headingMinX && 
    clickX <= headingMaxX && 
    clickY >= headingY - 20 && 
    clickY <= headingY + headingTotalHeight + 20
  ) {
    return 'heading';
  }

  // Check subheading (with multi-line support)
  const subheadingX = getTextX(screenshot.subheadingAlign || 'left', screenshot.subheadingPosition.x);
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
  
  // Calculate subheading bounds based on alignment
  let subheadingMinX: number, subheadingMaxX: number;
  const subAlign = screenshot.subheadingAlign || 'left';
  
  if (subAlign === 'left') {
    subheadingMinX = subheadingX - 20;
    subheadingMaxX = subheadingX + subheadingMaxWidth + 20;
  } else if (subAlign === 'right') {
    subheadingMinX = subheadingX - subheadingMaxWidth - 20;
    subheadingMaxX = subheadingX + 20;
  } else {
    subheadingMinX = subheadingX - subheadingMaxWidth / 2 - 20;
    subheadingMaxX = subheadingX + subheadingMaxWidth / 2 + 20;
  }
  
  if (
    clickX >= subheadingMinX && 
    clickX <= subheadingMaxX && 
    clickY >= subheadingY - 20 && 
    clickY <= subheadingY + subheadingTotalHeight + 20
  ) {
    return 'subheading';
  }

  return null;
}
