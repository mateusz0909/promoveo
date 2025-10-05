/**
 * Unified Element Renderer
 * 
 * Single rendering pipeline for all canvas elements (text, mockups, visuals)
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, FONT_SCALE_MULTIPLIER, wrapText } from './utils';
import type { CanvasElement, TextElement, MockupElement, VisualElement } from '@/context/studio-editor/elementTypes';
import { isTextElement, isMockupElement, isVisualElement, sortElementsByZIndex } from '@/context/studio-editor/elementTypes';

/**
 * Render a text element on the canvas
 */
function renderTextElement(
  ctx: CanvasRenderingContext2D,
  element: TextElement
): void {
  if (!element.text || element.text.trim() === '') return;

  const fontSize = element.fontSize * FONT_SCALE_MULTIPLIER;
  const fontWeight = element.isBold ? 'bold' : 'normal';
  
  ctx.save();
  
  // Apply rotation if needed
  if (element.rotation !== 0) {
    ctx.translate(element.position.x, element.position.y);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-element.position.x, -element.position.y);
  }

  // Set font
  ctx.font = `${fontWeight} ${fontSize}px ${element.fontFamily}`;
  ctx.fillStyle = element.color;
  ctx.textAlign = element.align;

  // Wrap text - use element width if specified, otherwise use 90% of canvas
  const maxTextWidth = element.width 
    ? element.width * FONT_SCALE_MULTIPLIER 
    : CANVAS_WIDTH * 0.9;
  const lines = wrapText(ctx, element.text, maxTextWidth);
  const lineHeight = fontSize * element.lineHeight;

  // Render each line
  let y = element.position.y;
  lines.forEach((line) => {
    // Apply letter spacing if needed
    if (element.letterSpacing > 0) {
      let x = element.position.x;
      const chars = line.split('');
      
      chars.forEach((char) => {
        ctx.fillText(char, x, y);
        const charWidth = ctx.measureText(char).width;
        x += charWidth + element.letterSpacing;
      });
    } else {
      ctx.fillText(line, element.position.x, y);
    }
    
    y += lineHeight;
  });

  ctx.restore();
}

/**
 * Render a mockup element on the canvas
 */
async function renderMockupElement(
  ctx: CanvasRenderingContext2D,
  element: MockupElement,
  screenshotImage: HTMLImageElement | null,
  deviceFrameImage: HTMLImageElement | null
): Promise<void> {
  if (!screenshotImage) return;

  const scaledWidth = element.baseWidth * element.scale;
  const scaledHeight = element.baseHeight * element.scale;

  // Calculate center position
  const centerX = (CANVAS_WIDTH - scaledWidth) / 2 + element.position.x;
  const centerY = (CANVAS_HEIGHT - scaledHeight) / 2 + element.position.y;

  ctx.save();

  // Apply rotation
  if (element.rotation !== 0) {
    const pivotX = centerX + scaledWidth / 2;
    const pivotY = centerY + scaledHeight / 2;
    ctx.translate(pivotX, pivotY);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-pivotX, -pivotY);
  }

  const cornerRadius = 40 * element.scale;
  const innerPadding = 20 * element.scale;

  // Draw rounded rectangle for frame
  ctx.beginPath();
  ctx.roundRect(centerX, centerY, scaledWidth, scaledHeight, cornerRadius);
  ctx.clip();

  // Draw screenshot inside frame
  const imgX = centerX + innerPadding;
  const imgY = centerY + innerPadding;
  const imgWidth = scaledWidth - innerPadding * 2;
  const imgHeight = scaledHeight - innerPadding * 2;

  ctx.drawImage(screenshotImage, imgX, imgY, imgWidth, imgHeight);

  // Draw device frame overlay if available
  if (deviceFrameImage) {
    ctx.drawImage(deviceFrameImage, centerX, centerY, scaledWidth, scaledHeight);
  }

  ctx.restore();
}

/**
 * Render a visual element on the canvas
 */
async function renderVisualElement(
  ctx: CanvasRenderingContext2D,
  element: VisualElement,
  imageCache: Map<string, HTMLImageElement>
): Promise<void> {
  // Load image from cache or create new
  let img = imageCache.get(element.imageUrl);
  
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = element.imageUrl;
    
    // Wait for image to load
    await new Promise((resolve, reject) => {
      img!.onload = resolve;
      img!.onerror = reject;
    });
    
    imageCache.set(element.imageUrl, img);
  }

  const scaledWidth = element.width * element.scale;
  const scaledHeight = element.height * element.scale;

  // Visual uses center-based positioning
  const x = element.position.x - scaledWidth / 2;
  const y = element.position.y - scaledHeight / 2;

  ctx.save();

  // Apply opacity
  ctx.globalAlpha = element.opacity;

  // Apply rotation
  if (element.rotation !== 0) {
    ctx.translate(element.position.x, element.position.y);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-element.position.x, -element.position.y);
  }

  // Draw image
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

  ctx.restore();
}

/**
 * Render all elements for a screenshot
 */
export async function renderAllElements(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  screenshotImage: HTMLImageElement | null,
  deviceFrameImage: HTMLImageElement | null,
  imageCache: Map<string, HTMLImageElement> = new Map()
): Promise<void> {
  // Sort by z-index (lower numbers render first)
  const sorted = sortElementsByZIndex(elements);

  for (const element of sorted) {
    try {
      if (isTextElement(element)) {
        renderTextElement(ctx, element);
      } else if (isMockupElement(element)) {
        await renderMockupElement(ctx, element, screenshotImage, deviceFrameImage);
      } else if (isVisualElement(element)) {
        await renderVisualElement(ctx, element, imageCache);
      }
    } catch (error) {
      console.error(`Error rendering element ${element.id}:`, error);
    }
  }
}

/**
 * Render selection indicator for an element
 */
export function renderSelectionIndicator(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  isPrimary: boolean = true
): void {
  const strokeColor = isPrimary ? '#3b82f6' : '#6366f1';
  const strokeWidth = 3;
  const padding = 8;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.setLineDash([8, 4]); // Slightly longer dashes for better visibility

  if (isTextElement(element)) {
    // For text, draw tight bounds around the actual text content
    const fontSize = element.fontSize * FONT_SCALE_MULTIPLIER;
    const maxTextWidth = CANVAS_WIDTH * 0.9;
    
    ctx.font = `${element.isBold ? 'bold' : 'normal'} ${fontSize}px ${element.fontFamily}`;
    const lines = wrapText(ctx, element.text, maxTextWidth);
    const lineHeight = fontSize * element.lineHeight;
    
    // Calculate actual text bounds
    let maxWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });

    // Account for letter spacing in width calculation
    if (element.letterSpacing > 0 && lines[0]) {
      maxWidth += element.letterSpacing * (lines[0].length - 1);
    }

    // Calculate top position (baseline - ascent)
    const ascent = fontSize * 0.8; // Approximate ascent height
    const topY = element.position.y - ascent;
    const totalHeight = lines.length * lineHeight;

    // Calculate left position based on alignment
    let leftX = element.position.x;
    if (element.align === 'center') {
      leftX -= maxWidth / 2;
    } else if (element.align === 'right') {
      leftX -= maxWidth;
    }

    // Draw rounded rectangle with padding
    const x = leftX - padding;
    const y = topY - padding;
    const width = maxWidth + (padding * 2);
    const height = totalHeight + (padding * 2);

    ctx.beginPath();
    const radius = 4;
    ctx.roundRect(x, y, width, height, radius);
    ctx.stroke();

    // Add corner handles for visual feedback
    drawCornerHandles(ctx, x, y, width, height, strokeColor);

  } else if (isMockupElement(element)) {
    const scaledWidth = element.baseWidth * element.scale;
    const scaledHeight = element.baseHeight * element.scale;
    const x = (CANVAS_WIDTH - scaledWidth) / 2 + element.position.x;
    const y = (CANVAS_HEIGHT - scaledHeight) / 2 + element.position.y;

    ctx.beginPath();
    ctx.roundRect(x, y, scaledWidth, scaledHeight, 4);
    ctx.stroke();
    
    drawCornerHandles(ctx, x, y, scaledWidth, scaledHeight, strokeColor);

  } else if (isVisualElement(element)) {
    const scaledWidth = element.width * element.scale;
    const scaledHeight = element.height * element.scale;
    const x = element.position.x - scaledWidth / 2;
    const y = element.position.y - scaledHeight / 2;

    ctx.beginPath();
    ctx.roundRect(x, y, scaledWidth, scaledHeight, 4);
    ctx.stroke();
    
    drawCornerHandles(ctx, x, y, scaledWidth, scaledHeight, strokeColor);
  }

  ctx.restore();
}

/**
 * Draw corner handles for selection frame
 */
function drawCornerHandles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  const handleSize = 8;
  const halfHandle = handleSize / 2;

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([]); // Solid for handles

  // Corner positions
  const corners = [
    { x: x, y: y }, // Top-left
    { x: x + width, y: y }, // Top-right
    { x: x, y: y + height }, // Bottom-left
    { x: x + width, y: y + height }, // Bottom-right
  ];

  corners.forEach(corner => {
    ctx.fillRect(
      corner.x - halfHandle,
      corner.y - halfHandle,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      corner.x - halfHandle,
      corner.y - halfHandle,
      handleSize,
      handleSize
    );
  });

  ctx.restore();
}
