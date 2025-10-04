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
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
      
      if (metrics.width > maxWidth && currentLine) {
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

/**
 * Canvas rendering constants
 */
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 2600;
export const FONT_SCALE_MULTIPLIER = 3.4; // 1200px canvas / ~350px display
