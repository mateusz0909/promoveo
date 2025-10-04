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
