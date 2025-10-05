/**
 * Background rendering utilities
 */

import { interpolateGradient } from './utils';

export interface BackgroundConfig {
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundSolid: string;
  backgroundGradient: {
    startColor: string;
    endColor: string;
    angle: number;
  };
  backgroundImage: {
    url: string;
    fit: 'cover' | 'contain' | 'fill' | 'tile';
    opacity: number;
  };
}

// Cache for loaded background images
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load background image (with caching)
 */
export function loadBackgroundImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Draw image background with different fit modes
 * Supports seamless flow across multiple screenshots
 */
function drawImageBackground(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  fit: 'cover' | 'contain' | 'fill' | 'tile',
  opacity: number,
  canvasWidth: number,
  canvasHeight: number,
  screenshotIndex: number,
  totalScreenshots: number
): void {
  ctx.save();
  ctx.globalAlpha = opacity;

  if (fit === 'tile') {
    // Tile/repeat pattern - same for each canvas
    const pattern = ctx.createPattern(image, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  } else {
    // For cover, contain, and fill: calculate as if rendering one large panorama
    const totalWidth = canvasWidth * totalScreenshots;
    const imageAspect = image.width / image.height;
    const panoramaAspect = totalWidth / canvasHeight;
    
    let fullDrawWidth, fullDrawHeight, fullOffsetX, fullOffsetY;

    if (fit === 'fill') {
      // Fill: stretch entire image across all screenshots
      fullDrawWidth = totalWidth;
      fullDrawHeight = canvasHeight;
      fullOffsetX = 0;
      fullOffsetY = 0;
    } else if (fit === 'contain') {
      // Contain: fit entire image within the panorama (may letterbox)
      if (imageAspect > panoramaAspect) {
        // Image wider than panorama - fit by width
        fullDrawWidth = totalWidth;
        fullDrawHeight = totalWidth / imageAspect;
        fullOffsetX = 0;
        fullOffsetY = (canvasHeight - fullDrawHeight) / 2;
      } else {
        // Image taller than panorama - fit by height
        fullDrawHeight = canvasHeight;
        fullDrawWidth = canvasHeight * imageAspect;
        fullOffsetX = (totalWidth - fullDrawWidth) / 2;
        fullOffsetY = 0;
      }
    } else {
      // Cover: fill panorama while maintaining aspect ratio (may crop)
      if (imageAspect > panoramaAspect) {
        // Image wider than panorama - fit by height, crop width
        fullDrawHeight = canvasHeight;
        fullDrawWidth = canvasHeight * imageAspect;
        fullOffsetX = -(fullDrawWidth - totalWidth) / 2;
        fullOffsetY = 0;
      } else {
        // Image taller than panorama - fit by width, crop height
        fullDrawWidth = totalWidth;
        fullDrawHeight = totalWidth / imageAspect;
        fullOffsetX = 0;
        fullOffsetY = -(fullDrawHeight - canvasHeight) / 2;
      }
    }

    // Calculate this screenshot's portion of the full panorama
    const thisCanvasOffsetInPanorama = screenshotIndex * canvasWidth;
    
    // Calculate source rectangle from original image
    // Map panorama coordinates back to source image coordinates
    const scaleToSource = image.width / fullDrawWidth;
    
    const sourceX = (thisCanvasOffsetInPanorama - fullOffsetX) * scaleToSource;
    const sourceY = -fullOffsetY * scaleToSource;
    const sourceWidth = canvasWidth * scaleToSource;
    const sourceHeight = canvasHeight * scaleToSource;

    // Clamp source coordinates to image bounds
    const clampedSourceX = Math.max(0, Math.min(sourceX, image.width));
    const clampedSourceY = Math.max(0, Math.min(sourceY, image.height));
    const clampedSourceWidth = Math.min(sourceWidth, image.width - clampedSourceX);
    const clampedSourceHeight = Math.min(sourceHeight, image.height - clampedSourceY);

    // Calculate destination coordinates (accounting for clamping)
    const destX = (clampedSourceX - sourceX) / scaleToSource;
    const destY = (clampedSourceY - sourceY) / scaleToSource;
    const destWidth = clampedSourceWidth / scaleToSource;
    const destHeight = clampedSourceHeight / scaleToSource;

    // Draw the slice
    if (clampedSourceWidth > 0 && clampedSourceHeight > 0) {
      ctx.drawImage(
        image,
        clampedSourceX, clampedSourceY, clampedSourceWidth, clampedSourceHeight,
        destX, destY, destWidth, destHeight
      );
    }
  }

  ctx.restore();
}

/**
 * Draw background on canvas (solid, gradient, or image)
 * Note: For image backgrounds, you should preload the image using loadBackgroundImage
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  config: BackgroundConfig,
  canvasWidth: number,
  canvasHeight: number,
  screenshotIndex: number,
  totalScreenshots: number,
  backgroundImage?: HTMLImageElement | null
): void {
  if (config.backgroundType === 'image' && backgroundImage && config.backgroundImage.url) {
    // Image background with seamless flow across all screenshots
    drawImageBackground(
      ctx,
      backgroundImage,
      config.backgroundImage.fit,
      config.backgroundImage.opacity,
      canvasWidth,
      canvasHeight,
      screenshotIndex,
      totalScreenshots
    );
  } else if (config.backgroundType === 'solid') {
    // Solid color background
    ctx.fillStyle = config.backgroundSolid;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else if (config.backgroundType === 'gradient') {
    // Gradient background with seamless flow across all screenshots
    const angle = config.backgroundGradient.angle ?? 90; // Use nullish coalescing to allow 0
    
    // Determine gradient direction and color flow
    const isHorizontal = angle === 90 || angle === 270;
    const shouldReverseHorizontal = angle === 270; // Right to Left
    
    // Calculate this screenshot's portion of the overall gradient
    const imageWidthInGradient = 1 / totalScreenshots;
    let gradientStart = screenshotIndex * imageWidthInGradient;
    let gradientEnd = (screenshotIndex + 1) * imageWidthInGradient;
    
    // Reverse the interpolation factors for Right to Left only
    if (shouldReverseHorizontal) {
      gradientStart = 1 - gradientStart;
      gradientEnd = 1 - gradientEnd;
      [gradientStart, gradientEnd] = [gradientEnd, gradientStart]; // Swap
    }
    
    // Interpolate colors for this screenshot's slice
    const startColor = interpolateGradient(
      config.backgroundGradient.startColor,
      config.backgroundGradient.endColor,
      isHorizontal ? gradientStart : 0 // Vertical: use full gradient range
    );
    const endColor = interpolateGradient(
      config.backgroundGradient.startColor,
      config.backgroundGradient.endColor,
      isHorizontal ? gradientEnd : 1 // Vertical: use full gradient range
    );
    
    // Create gradient based on direction
    let gradient;
    if (angle === 90) {
      // Left to Right
      gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    } else if (angle === 270) {
      // Right to Left
      gradient = ctx.createLinearGradient(canvasWidth, 0, 0, 0);
    } else if (angle === 180) {
      // Top to Bottom
      gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    } else if (angle === 0) {
      // Bottom to Top
      gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0);
    } else {
      // Default: Left to Right
      gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    }
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    // Default fallback to horizontal gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    gradient.addColorStop(0, config.backgroundGradient.startColor);
    gradient.addColorStop(1, config.backgroundGradient.endColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}
