/**
 * Standalone canvas renderer for generating marketing images
 * This can be used both in the editor and for downloads
 */

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 2600;
const FONT_SCALE_MULTIPLIER = 3.4;

interface RenderConfig {
  sourceScreenshotUrl: string;
  configuration: {
    heading?: string;
    subheading?: string;
    fontFamily?: string;
    headingFont?: string;
    headingFontSize?: number;
    subheadingFontSize?: number;
    headingColor?: string;
    subheadingColor?: string;
    headingAlign?: 'left' | 'center' | 'right';
    subheadingAlign?: 'left' | 'center' | 'right';
    headingLetterSpacing?: number;
    subheadingLetterSpacing?: number;
    headingLineHeight?: number;
    subheadingLineHeight?: number;
    mockupScale?: number;
    mockupRotation?: number;
    mockupX?: number;
    mockupY?: number;
    headingX?: number;
    headingY?: number;
    subheadingX?: number;
    subheadingY?: number;
    backgroundType?: string;
    backgroundGradient?: {
      startColor: string;
      endColor: string;
      angle?: number;
    };
    backgroundColor?: string; // Legacy support
    backgroundSolid?: string; // Current naming
    deviceFrame?: string;
    headingPosition?: { x: number; y: number };
    subheadingPosition?: { x: number; y: number };
    mockupPosition?: { x: number; y: number };
  };
  device?: string;
  index?: number; // Index of this screenshot
  totalImages?: number; // Total number of screenshots
}

/**
 * Helper function to interpolate between two colors
 */
function interpolateGradient(color1: string, color2: string, factor: number): string {
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
 * Wraps text to fit within a maximum width
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
 * Loads an image from a URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Renders a screenshot to a canvas using the stored configuration
 */
export async function renderScreenshotToCanvas(
  canvas: HTMLCanvasElement,
  config: RenderConfig
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const {
    heading = '',
    subheading = '',
    fontFamily,
    headingFont,
    headingFontSize = 64,
    subheadingFontSize = 32,
    headingColor = '#ffffff',
    subheadingColor = '#ffffff',
    mockupScale = 1.0,
    mockupRotation = 0,
    // Support both formats: position objects or individual X/Y values
    mockupPosition,
    mockupX,
    mockupY,
    headingPosition,
    headingX,
    headingY,
    subheadingPosition,
    subheadingX,
    subheadingY,
    backgroundType = 'gradient',
    backgroundGradient = {
      startColor: '#667eea',
      endColor: '#764ba2',
      angle: 135
    },
    backgroundColor = '#667eea',
    backgroundSolid,
    deviceFrame = 'iPhone 15 Pro'
  } = config.configuration;

  // Use fontFamily as the primary font, fallback to headingFont for backward compatibility
  const actualFontFamily = fontFamily || headingFont || 'Inter';

  // Handle both position object format and individual X/Y format
  const actualMockupPosition = mockupPosition || { x: mockupX || 0, y: mockupY || 0 };
  const actualHeadingPosition = headingPosition || { x: headingX || 0, y: headingY || 0 };
  const actualSubheadingPosition = subheadingPosition || { x: subheadingX || 0, y: subheadingY || 0 };

  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw background with seamless horizontal flow across screenshots
  if (backgroundType === 'gradient') {
    const index = config.index ?? 0;
    const totalImages = config.totalImages ?? 1;
    const angle = backgroundGradient.angle ?? 90; // Use nullish coalescing to allow 0
    
    // Determine gradient direction and color flow
    const isHorizontal = angle === 90 || angle === 270;
    const shouldReverseHorizontal = angle === 270; // Right to Left
    
    // Calculate this screenshot's portion of the overall gradient
    const imageWidthInGradient = 1 / totalImages;
    let gradientStart = index * imageWidthInGradient;
    let gradientEnd = (index + 1) * imageWidthInGradient;
    
    // Reverse the interpolation factors for Right to Left only
    if (shouldReverseHorizontal) {
      gradientStart = 1 - gradientStart;
      gradientEnd = 1 - gradientEnd;
      [gradientStart, gradientEnd] = [gradientEnd, gradientStart]; // Swap
    }
    
    // Interpolate colors for this screenshot's slice
    const startColor = interpolateGradient(
      backgroundGradient.startColor,
      backgroundGradient.endColor,
      isHorizontal ? gradientStart : 0 // Vertical: use full gradient range
    );
    const endColor = interpolateGradient(
      backgroundGradient.startColor,
      backgroundGradient.endColor,
      isHorizontal ? gradientEnd : 1 // Vertical: use full gradient range
    );
    
    // Create gradient based on direction
    let gradient;
    if (angle === 90) {
      // Left to Right
      gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    } else if (angle === 270) {
      // Right to Left
      gradient = ctx.createLinearGradient(CANVAS_WIDTH, 0, 0, 0);
    } else if (angle === 180) {
      // Top to Bottom
      gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    } else if (angle === 0) {
      // Bottom to Top
      gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, 0);
    } else {
      // Default: Left to Right
      gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    }
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    ctx.fillStyle = gradient;
  } else {
    // Use backgroundSolid if available, fallback to backgroundColor for legacy support
    ctx.fillStyle = backgroundSolid || backgroundColor;
  }
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Calculate mockup dimensions and position
  const mockupWidth = 700 * mockupScale;
  const mockupHeight = 1400 * mockupScale;
  const finalMockupX = (CANVAS_WIDTH - mockupWidth) / 2 + actualMockupPosition.x;
  const finalMockupY = (CANVAS_HEIGHT - mockupHeight) / 2 + actualMockupPosition.y;

  // Text positions
  const maxTextWidth = CANVAS_WIDTH * 0.9;
  
  // Calculate X position based on alignment
  // The alignment changes the anchor point, but position offset is always applied
  const getTextX = (align: 'left' | 'center' | 'right' | undefined, positionOffset: number) => {
    if (align === 'left') {
      return 60 + positionOffset; // Left margin + offset
    } else if (align === 'right') {
      return CANVAS_WIDTH - 60 + positionOffset; // Right margin + offset
    } else {
      return CANVAS_WIDTH / 2 + positionOffset; // Center (default) + offset
    }
  };
  
  const finalHeadingX = getTextX(config.configuration.headingAlign, actualHeadingPosition.x);
  const finalHeadingY = 150 + actualHeadingPosition.y;
  const finalSubheadingX = getTextX(config.configuration.subheadingAlign, actualSubheadingPosition.x);
  const finalSubheadingY = 400 + actualSubheadingPosition.y;

  // Draw heading text with wrapping
  if (heading) {
    ctx.fillStyle = headingColor;
    const scaledHeadingSize = headingFontSize * FONT_SCALE_MULTIPLIER;
    ctx.font = `bold ${scaledHeadingSize}px ${actualFontFamily}`;
    ctx.textAlign = (config.configuration.headingAlign || 'left') as CanvasTextAlign;
    ctx.textBaseline = 'top';
    
    // Apply letter spacing (convert percentage to em units)
    const headingLetterSpacing = config.configuration.headingLetterSpacing || 0;
    ctx.letterSpacing = `${headingLetterSpacing * 0.01}em`;
    
    const headingLines = wrapText(ctx, heading, maxTextWidth);
    const headingLineHeight = scaledHeadingSize * (config.configuration.headingLineHeight || 1.2);
    
    headingLines.forEach((line, lineIndex) => {
      ctx.fillText(line, finalHeadingX, finalHeadingY + (lineIndex * headingLineHeight));
    });
    
    // Reset letter spacing
    ctx.letterSpacing = '0px';
  }

  // Draw subheading text with wrapping
  if (subheading) {
    ctx.fillStyle = subheadingColor;
    const scaledSubheadingSize = subheadingFontSize * FONT_SCALE_MULTIPLIER;
    ctx.font = `${scaledSubheadingSize}px ${actualFontFamily}`;
    ctx.textAlign = (config.configuration.subheadingAlign || 'left') as CanvasTextAlign;
    ctx.textBaseline = 'top';
    
    // Apply letter spacing (convert percentage to em units)
    const subheadingLetterSpacing = config.configuration.subheadingLetterSpacing || 0;
    ctx.letterSpacing = `${subheadingLetterSpacing * 0.01}em`;
    
    const subheadingLines = wrapText(ctx, subheading, maxTextWidth);
    const subheadingLineHeight = scaledSubheadingSize * (config.configuration.subheadingLineHeight || 1.2);
    
    subheadingLines.forEach((line, lineIndex) => {
      ctx.fillText(line, finalSubheadingX, finalSubheadingY + (lineIndex * subheadingLineHeight));
    });
    
    // Reset letter spacing
    ctx.letterSpacing = '0px';
  }

  // Load and draw screenshot with rotation
  try {
    const screenshotImg = await loadImage(config.sourceScreenshotUrl);
    
    const radius = 40 * mockupScale;
    const innerPadding = 20 * mockupScale;
    
    // Calculate center point for rotation
    const centerX = finalMockupX + mockupWidth / 2;
    const centerY = finalMockupY + mockupHeight / 2;
    
    ctx.save();
    
    // Apply rotation transformation
    if (mockupRotation !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate((mockupRotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
    
    ctx.beginPath();
    ctx.roundRect(
      finalMockupX + innerPadding,
      finalMockupY + innerPadding,
      mockupWidth - innerPadding * 2,
      mockupHeight - innerPadding * 2,
      radius
    );
    ctx.clip();
    
    ctx.drawImage(
      screenshotImg,
      finalMockupX + innerPadding,
      finalMockupY + innerPadding,
      mockupWidth - innerPadding * 2,
      mockupHeight - innerPadding * 2
    );
    
    ctx.restore();
  } catch (error) {
    console.error('Failed to load screenshot:', error);
  }

  // Load and draw device frame with rotation
  try {
    // Map device frame names to file paths (same as MultiScreenshotCanvas)
    const frameFiles: Record<string, string> = {
      'iPhone 15 Pro': '/iphone_15_frame.png',
      'iPhone 15': '/iphone_15_frame.png',
      'iPhone 14 Pro': '/iphone_15_frame.png',
      'iPad Pro 13': '/iPad Pro 13 Frame.png',
      'iPad Pro 11': '/iPad Pro 13 Frame.png',
    };
    
    const frameUrl = frameFiles[deviceFrame] || '/iphone_15_frame.png';
    const frameImg = await loadImage(frameUrl);
    
    // Calculate center point for rotation
    const centerX = finalMockupX + mockupWidth / 2;
    const centerY = finalMockupY + mockupHeight / 2;
    
    ctx.save();
    
    // Apply rotation transformation
    if (mockupRotation !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate((mockupRotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
    
    ctx.drawImage(frameImg, finalMockupX, finalMockupY, mockupWidth, mockupHeight);
    ctx.restore();
  } catch (error) {
    console.error('Failed to load device frame, using fallback border:', error);
    // Fallback: draw a simple frame
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 8 * mockupScale;
    ctx.beginPath();
    ctx.roundRect(finalMockupX, finalMockupY, mockupWidth, mockupHeight, 40 * mockupScale);
    ctx.stroke();
  }
}
