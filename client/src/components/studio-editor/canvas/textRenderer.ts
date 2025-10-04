/**
 * Text rendering utilities
 */

import { wrapText, CANVAS_WIDTH, FONT_SCALE_MULTIPLIER } from './utils';

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
}

/**
 * Calculate X position based on alignment
 */
function getTextX(align: 'left' | 'center' | 'right', positionOffset: number): number {
  if (align === 'left') {
    return 60 + positionOffset; // Left margin + offset
  } else if (align === 'right') {
    return CANVAS_WIDTH - 60 + positionOffset; // Right margin + offset
  } else {
    return CANVAS_WIDTH / 2 + positionOffset; // Center + offset
  }
}

/**
 * Draw text with wrapping, letter spacing, and line height
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  config: TextConfig,
  baseY: number
): void {
  ctx.fillStyle = config.color;
  const fontSize = config.fontSize * FONT_SCALE_MULTIPLIER;
  const fontWeight = config.isBold ? 'bold ' : '';
  ctx.font = `${fontWeight}${fontSize}px ${config.fontFamily}`;
  ctx.textAlign = config.align;
  ctx.textBaseline = 'top';
  
  // Apply letter spacing (convert percentage to em units)
  ctx.letterSpacing = `${config.letterSpacing * 0.01}em`;
  
  // Wrap text with max width of 90% canvas width
  const maxTextWidth = CANVAS_WIDTH * 0.9;
  const lines = wrapText(ctx, config.text, maxTextWidth);
  const lineHeight = fontSize * config.lineHeight;
  
  const textX = getTextX(config.align, config.position.x);
  const textY = baseY + config.position.y;
  
  lines.forEach((line, lineIndex) => {
    ctx.fillText(line, textX, textY + (lineIndex * lineHeight));
  });
  
  // Reset letter spacing
  ctx.letterSpacing = '0px';
}

/**
 * Draw selection box around text
 */
export function drawTextSelection(
  ctx: CanvasRenderingContext2D,
  config: TextConfig,
  baseY: number,
  isPrimary: boolean
): void {
  const fontSize = config.fontSize * FONT_SCALE_MULTIPLIER;
  const fontWeight = config.isBold ? 'bold ' : '';
  ctx.font = `${fontWeight}${fontSize}px ${config.fontFamily}`;
  ctx.textAlign = config.align;
  
  const maxTextWidth = CANVAS_WIDTH * 0.9;
  const lines = wrapText(ctx, config.text, maxTextWidth);
  const lineHeight = fontSize * config.lineHeight;
  const totalHeight = lines.length * lineHeight;
  
  // Find widest line for bounding box
  let maxLineWidth = 0;
  lines.forEach(line => {
    const metrics = ctx.measureText(line);
    maxLineWidth = Math.max(maxLineWidth, metrics.width);
  });
  
  // Set selection style
  ctx.strokeStyle = isPrimary ? '#3b82f6' : '#60a5fa';
  ctx.lineWidth = isPrimary ? 8 : 6;
  ctx.setLineDash([20, 10]);
  
  // Calculate bounding box based on alignment
  const textX = getTextX(config.align, config.position.x);
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
