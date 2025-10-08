/**
 * Text rendering utilities
 */

import { wrapText, drawLineWithLetterSpacing } from './utils';
import type { CanvasMetrics } from './utils';
import { quoteFontFamily } from '@/lib/fonts';

export interface TextConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  position: { x: number; y: number };
  letterSpacing: number;
  lineHeight: number;
  isBold?: boolean;
  fontWeight?: number;
}

/**
 * Calculate X position based on alignment
 */
function getTextX(
  align: 'left' | 'center' | 'right',
  positionOffset: number,
  metrics: CanvasMetrics
): number {
  if (align === 'left') {
    return 60 + positionOffset; // Left margin + offset
  } else if (align === 'right') {
    return metrics.width - 60 + positionOffset; // Right margin + offset
  } else {
    return metrics.width / 2 + positionOffset; // Center + offset
  }
}

/**
 * Draw text with wrapping, letter spacing, and line height
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  config: TextConfig,
  baseY: number,
  metrics: CanvasMetrics
): void {
  ctx.fillStyle = config.color;
  const fontSize = config.fontSize * metrics.fontScaleMultiplier;
  const weightValue = config.fontWeight ?? (config.isBold ? 700 : 400);
  const fontWeightSegment = typeof weightValue === 'number' ? `${weightValue} ` : '';
  const fontFamily = quoteFontFamily(config.fontFamily);
  ctx.font = `${fontWeightSegment}${fontSize}px ${fontFamily}`;
  ctx.textAlign = config.align;
  ctx.textBaseline = 'top';
  
  // Wrap text with max width of 90% canvas width
  const maxTextWidth = metrics.defaultTextWidth;
  const lines = wrapText(ctx, config.text, maxTextWidth, config.letterSpacing);
  const lineHeight = fontSize * config.lineHeight;
  
  const textX = getTextX(config.align, config.position.x, metrics);
  const textY = baseY + config.position.y;
  
  lines.forEach((line, lineIndex) => {
    drawLineWithLetterSpacing(
      ctx,
      line,
      textX,
      textY + (lineIndex * lineHeight),
      config.align,
      config.letterSpacing
    );
  });
}

/**
 * Draw selection box around text
 */
export function drawTextSelection(
  ctx: CanvasRenderingContext2D,
  config: TextConfig,
  baseY: number,
  isPrimary: boolean,
  metrics: CanvasMetrics
): void {
  const fontSize = config.fontSize * metrics.fontScaleMultiplier;
  const weightValue = config.fontWeight ?? (config.isBold ? 700 : 400);
  const fontWeightSegment = typeof weightValue === 'number' ? `${weightValue} ` : '';
  const fontFamily = quoteFontFamily(config.fontFamily);
  ctx.font = `${fontWeightSegment}${fontSize}px ${fontFamily}`;
  ctx.textAlign = config.align;
  
  const maxTextWidth = metrics.defaultTextWidth;
  const lines = wrapText(ctx, config.text, maxTextWidth, config.letterSpacing);
  const lineHeight = fontSize * config.lineHeight;
  const totalHeight = lines.length * lineHeight;
  
  // Find widest line for bounding box
  let maxLineWidth = 0;
  lines.forEach(line => {
    const metrics = ctx.measureText(line);
    const spacingTotal = config.letterSpacing * Math.max(line.length - 1, 0);
    const totalWidth = Math.max(metrics.width + spacingTotal, 0);
    maxLineWidth = Math.max(maxLineWidth, totalWidth);
  });
  
  // Set selection style
  ctx.strokeStyle = isPrimary ? '#3b82f6' : '#60a5fa';
  ctx.lineWidth = isPrimary ? 8 : 6;
  ctx.setLineDash([20, 10]);
  
  // Calculate bounding box based on alignment
  const textX = getTextX(config.align, config.position.x, metrics);
  const textY = baseY + config.position.y;
  
  let boxX: number;
  const boxY = textY - 20;
  const boxWidth = maxLineWidth + 40;
  const boxHeight = totalHeight + 40;
  
  if (config.align === 'left') {
    boxX = textX - 20;
  } else if (config.align === 'right') {
    boxX = textX - maxLineWidth - 20;
  } else {
    boxX = textX - maxLineWidth / 2 - 20;
  }
  
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  ctx.setLineDash([]);
}
