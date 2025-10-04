/**
 * Background rendering utilities
 */

import { interpolateGradient } from './utils';

export interface BackgroundConfig {
  backgroundType: 'solid' | 'gradient';
  backgroundSolid: string;
  backgroundGradient: {
    startColor: string;
    endColor: string;
    angle: number;
  };
}

/**
 * Draw background on canvas (solid or gradient)
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  config: BackgroundConfig,
  canvasWidth: number,
  canvasHeight: number,
  screenshotIndex: number,
  totalScreenshots: number
): void {
  if (config.backgroundType === 'solid') {
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
