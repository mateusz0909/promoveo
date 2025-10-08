import { resolveDevicePreset } from '@/constants/devicePresets';

/**
 * Canvas utility functions for text wrapping and color manipulation
 */

/**
 * Helper function to interpolate between two colors
 */
export function interpolateGradient(color1: string, color2: string, factor: number): string {
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

/**
 * Helper function to wrap text to fit within a maximum width
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing = 0
): string[] {
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
      const charCount = Math.max(Array.from(testLine).length - 1, 0);
      const additionalSpacing = letterSpacing * charCount;
      const testWidth = Math.max(metrics.width + additionalSpacing, 0);

      if (testWidth > maxWidth && currentLine) {
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

export interface CanvasMetrics {
  preset: ReturnType<typeof resolveDevicePreset>;
  width: number;
  height: number;
  fontScaleMultiplier: number;
  defaultTextWidth: number;
}

export function getCanvasMetrics(deviceFrame?: string | null): CanvasMetrics {
  const preset = resolveDevicePreset(deviceFrame);

  return {
    preset,
    width: preset.canvasWidth,
    height: preset.canvasHeight,
    fontScaleMultiplier: preset.fontScaleMultiplier,
    defaultTextWidth: preset.defaultTextWidth,
  };
}

/**
 * Draw a single line of text while preserving kerning and applying custom letter spacing.
 */
export function drawLineWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  align: 'left' | 'center' | 'right',
  letterSpacing: number
): void {
  const previousAlign = ctx.textAlign;
  ctx.textAlign = align;

  if (!text || letterSpacing === 0) {
    ctx.fillText(text, anchorX, y);
    ctx.textAlign = previousAlign;
    return;
  }

  const chars = Array.from(text);
  const metrics = ctx.measureText(text);
  const spacingTotal = letterSpacing * Math.max(chars.length - 1, 0);
  const lineWidth = Math.max(metrics.width + spacingTotal, 0);

  let startX = anchorX;
  if (align === 'center') {
    startX -= lineWidth / 2;
  } else if (align === 'right') {
    startX -= lineWidth;
  }

  ctx.textAlign = 'left';

  let currentX = startX;
  let prefix = '';
  let previousWidth = 0;

  chars.forEach((char, index) => {
    const nextPrefix = prefix + char;
    const nextWidth = ctx.measureText(nextPrefix).width;
    const charWidth = nextWidth - previousWidth;

    ctx.fillText(char, currentX, y);

    currentX += charWidth;
    if (index < chars.length - 1) {
      currentX += letterSpacing;
    }

    prefix = nextPrefix;
    previousWidth = nextWidth;
  });

  ctx.textAlign = previousAlign;
}
