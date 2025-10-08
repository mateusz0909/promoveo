/**
 * Unified Hit Detection
 *
 * Single algorithm for detecting which element was clicked
 */

import { wrapText } from './utils';
import type { CanvasMetrics } from './utils';
import { quoteFontFamily } from '@/lib/fonts';
import type { CanvasElement, TextElement, MockupElement, VisualElement } from '@/context/studio-editor/elementTypes';
import { isTextElement, isMockupElement, isVisualElement, sortElementsByZIndex } from '@/context/studio-editor/elementTypes';

/**
 * Check if a point is inside a rotated rectangle
 */
function isPointInRotatedRect(
  pointX: number,
  pointY: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  rotation: number
): boolean {
  if (rotation === 0) {
    return (
      pointX >= rectX &&
      pointX <= rectX + rectWidth &&
      pointY >= rectY &&
      pointY <= rectY + rectHeight
    );
  }

  // For rotated rectangles, transform the point to the rectangle's local coordinate system
  const centerX = rectX + rectWidth / 2;
  const centerY = rectY + rectHeight / 2;

  // Translate point to origin
  const translatedX = pointX - centerX;
  const translatedY = pointY - centerY;

  // Rotate point in opposite direction
  const rad = (-rotation * Math.PI) / 180;
  const rotatedX = translatedX * Math.cos(rad) - translatedY * Math.sin(rad);
  const rotatedY = translatedX * Math.sin(rad) + translatedY * Math.cos(rad);

  // Check if rotated point is inside unrotated rectangle
  return (
    rotatedX >= -rectWidth / 2 &&
    rotatedX <= rectWidth / 2 &&
    rotatedY >= -rectHeight / 2 &&
    rotatedY <= rectHeight / 2
  );
}

/**
 * Check if a click hit a text element
 */
function checkTextElementHit(
  element: TextElement,
  clickX: number,
  clickY: number,
  ctx: CanvasRenderingContext2D,
  metrics: CanvasMetrics
): boolean {
  if (!element.text || element.text.trim() === '') return false;

  const fontSize = element.fontSize * metrics.fontScaleMultiplier;
  const weightValue = element.fontWeight ?? (element.isBold ? 700 : 400);
  const fontWeight = typeof weightValue === 'number' ? weightValue.toString() : weightValue;
  
  const fontFamily = quoteFontFamily(element.fontFamily);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Use element width if specified, otherwise use 90% of canvas
  const maxTextWidth = element.width 
    ? element.width 
    : metrics.defaultTextWidth;
  const lines = wrapText(ctx, element.text, maxTextWidth, element.letterSpacing ?? 0);
  const lineHeight = fontSize * element.lineHeight;

  const textX = element.position.x;
  const textY = element.position.y;
  const align = element.align;
  const padding = 8; // Reduced padding for tighter bounds

  // Check each line individually for tighter hit detection
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const metrics = ctx.measureText(line);
    const charCount = Math.max(Array.from(line).length - 1, 0);
    const spacingTotal = (element.letterSpacing ?? 0) * charCount;
    const lineWidth = Math.max(metrics.width + spacingTotal, 0);
    
    // Y position is the baseline of the text (where text is drawn)
    const baselineY = textY + i * lineHeight;
    
    // Calculate line bounds based on alignment
    let lineMinX: number, lineMaxX: number;
    
    if (align === 'left') {
      lineMinX = textX - padding;
      lineMaxX = textX + lineWidth + padding;
    } else if (align === 'right') {
      lineMinX = textX - lineWidth - padding;
      lineMaxX = textX + padding;
    } else { // center
      lineMinX = textX - lineWidth / 2 - padding;
      lineMaxX = textX + lineWidth / 2 + padding;
    }

    // Text baseline is roughly 80% down from the top of the font size
    // So we need to check from above the baseline to below it
    const lineMinY = baselineY - fontSize * 0.8 - padding;
    const lineMaxY = baselineY + fontSize * 0.2 + padding;

    const hit = isPointInRotatedRect(
      clickX,
      clickY,
      lineMinX,
      lineMinY,
      lineMaxX - lineMinX,
      lineMaxY - lineMinY,
      element.rotation
    );

    if (hit) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a click hit a mockup element
 */
function checkMockupElementHit(
  element: MockupElement,
  clickX: number,
  clickY: number,
  metrics: CanvasMetrics
): boolean {
  const scaledWidth = element.baseWidth * element.scale;
  const scaledHeight = element.baseHeight * element.scale;
  
  const x = (metrics.width - scaledWidth) / 2 + element.position.x;
  const y = (metrics.height - scaledHeight) / 2 + element.position.y;

  return isPointInRotatedRect(
    clickX,
    clickY,
    x,
    y,
    scaledWidth,
    scaledHeight,
    element.rotation
  );
}

/**
 * Check if a click hit a visual element
 */
function checkVisualElementHit(
  element: VisualElement,
  clickX: number,
  clickY: number
): boolean {
  const scaledWidth = element.width * element.scale;
  const scaledHeight = element.height * element.scale;
  
  // Visual uses center-based positioning
  const x = element.position.x - scaledWidth / 2;
  const y = element.position.y - scaledHeight / 2;

  return isPointInRotatedRect(
    clickX,
    clickY,
    x,
    y,
    scaledWidth,
    scaledHeight,
    element.rotation
  );
}

/**
 * Get the element at the given click position
 * Returns the topmost element (highest z-index) that was clicked
 */
export function getElementAtPoint(
  clickX: number,
  clickY: number,
  elements: CanvasElement[],
  canvas: HTMLCanvasElement,
  metrics: CanvasMetrics
): string | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Sort by z-index in reverse order (highest first)
  const sorted = sortElementsByZIndex(elements).reverse();

  for (const element of sorted) {
    let hit = false;

    if (isTextElement(element)) {
      hit = checkTextElementHit(element, clickX, clickY, ctx, metrics);
    } else if (isMockupElement(element)) {
      hit = checkMockupElementHit(element, clickX, clickY, metrics);
    } else if (isVisualElement(element)) {
      hit = checkVisualElementHit(element, clickX, clickY);
    }

    if (hit) {
      return element.id;
    }
  }

  return null;
}

/**
 * Get all elements at the given point (for multi-select)
 */
export function getAllElementsAtPoint(
  clickX: number,
  clickY: number,
  elements: CanvasElement[],
  canvas: HTMLCanvasElement,
  metrics: CanvasMetrics
): string[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const hits: string[] = [];

  for (const element of elements) {
    let hit = false;

    if (isTextElement(element)) {
      hit = checkTextElementHit(element, clickX, clickY, ctx, metrics);
    } else if (isMockupElement(element)) {
      hit = checkMockupElementHit(element, clickX, clickY, metrics);
    } else if (isVisualElement(element)) {
      hit = checkVisualElementHit(element, clickX, clickY);
    }

    if (hit) {
      hits.push(element.id);
    }
  }

  return hits;
}
