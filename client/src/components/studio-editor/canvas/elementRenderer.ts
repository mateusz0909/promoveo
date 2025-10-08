/**
 * Unified Element Renderer
 * 
 * Single rendering pipeline for all canvas elements (text, mockups, visuals)
 */

import { wrapText, drawLineWithLetterSpacing } from './utils';
import type { CanvasMetrics } from './utils';
import type { CanvasElement, TextElement, MockupElement, VisualElement } from '@/context/studio-editor/elementTypes';
import { isTextElement, isMockupElement, isVisualElement, sortElementsByZIndex } from '@/context/studio-editor/elementTypes';
import { quoteFontFamily } from '@/lib/fonts';

/**
 * Render a text element on the canvas
 */
function renderTextElement(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  metrics: CanvasMetrics
): void {
  if (!element.text || element.text.trim() === '') return;

  const fontSize = element.fontSize * metrics.fontScaleMultiplier;
  const weightValue = element.fontWeight ?? (element.isBold ? 700 : 400);
  const fontWeight = typeof weightValue === 'number' ? weightValue.toString() : weightValue;
  
  ctx.save();
  
  // Apply rotation if needed
  if (element.rotation !== 0) {
    ctx.translate(element.position.x, element.position.y);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-element.position.x, -element.position.y);
  }

  // Set font
  const fontFamily = quoteFontFamily(element.fontFamily);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = element.color;
  ctx.textAlign = element.align;

  // Wrap text - use element width if specified, otherwise use 90% of canvas
  const maxTextWidth = element.width 
    ? element.width 
    : metrics.defaultTextWidth;
  const lines = wrapText(ctx, element.text, maxTextWidth, element.letterSpacing ?? 0);
  const lineHeight = fontSize * element.lineHeight;

  // Render each line
  let y = element.position.y;
  const letterSpacing = element.letterSpacing ?? 0;

  lines.forEach((line) => {
    drawLineWithLetterSpacing(
      ctx,
      line,
      element.position.x,
      y,
      element.align,
      letterSpacing
    );
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
  deviceFrameImage: HTMLImageElement | null,
  metrics: CanvasMetrics
): Promise<void> {
  if (!screenshotImage) return;

  const mockupPreset = metrics.preset.mockup;
  const scaledWidth = element.baseWidth * element.scale;
  const scaledHeight = element.baseHeight * element.scale;

  // Calculate center position
  const centerX = (metrics.width - scaledWidth) / 2 + element.position.x;
  const centerY = (metrics.height - scaledHeight) / 2 + element.position.y;

  ctx.save();

  // Apply rotation
  if (element.rotation !== 0) {
    const pivotX = centerX + scaledWidth / 2;
    const pivotY = centerY + scaledHeight / 2;
    ctx.translate(pivotX, pivotY);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-pivotX, -pivotY);
  }

  const cornerRadius = (mockupPreset.cornerRadius ?? 55) * element.scale;
  const innerPadding = (mockupPreset.innerPadding ?? 20) * element.scale;
  const clipRadius = cornerRadius;
  // Draw screenshot inside frame with rounded clipping
  const imgX = centerX + innerPadding;
  const imgY = centerY + innerPadding;
  const imgWidth = scaledWidth - innerPadding * 2;
  const imgHeight = scaledHeight - innerPadding * 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(imgX, imgY, imgWidth, imgHeight, clipRadius);
  ctx.clip();
  ctx.drawImage(screenshotImage, imgX, imgY, imgWidth, imgHeight);
  ctx.restore();

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
  metrics: CanvasMetrics,
  imageCache: Map<string, HTMLImageElement> = new Map()
): Promise<void> {
  // Sort by z-index (lower numbers render first)
  const sorted = sortElementsByZIndex(elements);

  for (const element of sorted) {
    try {
      if (isTextElement(element)) {
        renderTextElement(ctx, element, metrics);
      } else if (isMockupElement(element)) {
        await renderMockupElement(ctx, element, screenshotImage, deviceFrameImage, metrics);
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
  metrics: CanvasMetrics,
  isPrimary: boolean = true
): void {
  const strokeColor = isPrimary ? '#3b82f6' : '#6366f1';
  const strokeWidth = 3;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.setLineDash([8, 4]); // Slightly longer dashes for better visibility

  if (isTextElement(element)) {
    ctx.restore();
    return;
  } else if (isMockupElement(element)) {
    const scaledWidth = element.baseWidth * element.scale;
    const scaledHeight = element.baseHeight * element.scale;
  const x = (metrics.width - scaledWidth) / 2 + element.position.x;
  const y = (metrics.height - scaledHeight) / 2 + element.position.y;

    ctx.beginPath();
    ctx.roundRect(x, y, scaledWidth, scaledHeight, 4);
    ctx.stroke();

  } else if (isVisualElement(element)) {
    const scaledWidth = element.width * element.scale;
    const scaledHeight = element.height * element.scale;
    const x = element.position.x - scaledWidth / 2;
    const y = element.position.y - scaledHeight / 2;

    ctx.beginPath();
    ctx.roundRect(x, y, scaledWidth, scaledHeight, 4);
    ctx.stroke();
  }

  ctx.restore();
}
