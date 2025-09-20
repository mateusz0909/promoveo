import { useRef } from 'react';

type DraggableElement = "mockup" | "heading" | "subheading" | null;

function lightenColor(hex: string | null | undefined, percent: number) {
  // Handle null, undefined, or empty string
  if (!hex) {
    hex = '#000000'; // Default to black
  }
  
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, r + (255 - r) * (percent / 100));
  const newG = Math.min(255, g + (255 - g) * (percent / 100));
  const newB = Math.min(255, b + (255 - b) * (percent / 100));

  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): { lines: { text: string, y: number }[], bounds: DOMRect } {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push({ text: line, y: currentY });
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  lines.push({ text: line, y: currentY });

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  lines.forEach(lineItem => {
    const metrics = context.measureText(lineItem.text);
    const textWidth = metrics.width;
    const lineX = x - textWidth / 2; // Since textAlign is center
    minX = Math.min(minX, lineX);
    maxX = Math.max(maxX, lineX + textWidth);
    minY = Math.min(minY, lineItem.y - (metrics.actualBoundingBoxAscent || 0));
    maxY = Math.max(maxY, lineItem.y + (metrics.actualBoundingBoxDescent || 0));
  });

  if (lines.length === 0) {
    return { lines: [], bounds: new DOMRect(x, y, 0, 0) };
  }

  return {
    lines,
    bounds: new DOMRect(minX, minY, maxX - minX, maxY - minY)
  };
}

async function generateMockupImage(screenshotUrl: string, device: string = 'iPhone'): Promise<HTMLCanvasElement> {
  const deviceConfigs: Record<string, any> = {
    iPhone: {
        frameWidth: 1293,
        frameHeight: 2656,
        screenWidth: 1179 + 4,
        screenHeight: 2552 + 4,
        screenX: (1293 - (1179 + 4)) / 2,
        screenY: (2656 - (2552 + 4)) / 2,
        cornerRadius: 70,
        framePath: '/iphone_15_frame.png',
    },
    iPad: {
        frameWidth: 1145,
        frameHeight: 1480,
        screenWidth: 1038,
        screenHeight: 1385,
        screenX: (1145 - 1038) / 2,
        screenY: (1480 - 1385) / 2,
        cornerRadius: 40,
        framePath: '/iPad Pro 13 Frame.png',
    }
  };

  const config = deviceConfigs[device] || deviceConfigs.iPhone;
  const { frameWidth, frameHeight, screenWidth, screenHeight, screenX, screenY, cornerRadius, framePath } = config;

  const canvas = document.createElement('canvas');
  canvas.width = frameWidth;
  canvas.height = frameHeight;
  const context = canvas.getContext('2d')!;

  const screenshot = new Image();
  screenshot.crossOrigin = 'Anonymous';
  const frame = new Image();
  frame.crossOrigin = 'Anonymous';

  await Promise.all([
    new Promise(resolve => { screenshot.onload = resolve; screenshot.src = screenshotUrl; }),
    new Promise(resolve => { frame.onload = resolve; frame.src = framePath; })
  ]);

  context.save();
  context.beginPath();
  context.roundRect(screenX, screenY, screenWidth, screenHeight, [cornerRadius]);
  context.clip();

  const screenshotAspectRatio = screenshot.width / screenshot.height;
  let screenshotDrawWidth = screenWidth + 6;
  let screenshotDrawHeight = screenshotDrawWidth / screenshotAspectRatio;
  if (screenshotDrawHeight < screenHeight + 6) {
    screenshotDrawHeight = screenHeight + 6;
    screenshotDrawWidth = screenshotDrawHeight * screenshotAspectRatio;
  }
  const screenshotDrawX = screenX - 2;
  const screenshotDrawY = screenY - 2;

  context.drawImage(screenshot, screenshotDrawX, screenshotDrawY, screenshotDrawWidth, screenshotDrawHeight);
  context.restore();

  context.drawImage(frame, 0, 0, frameWidth, frameHeight);

  return canvas;
}

interface DrawImageOptions {
  heading: string;
  subheading: string;
  screenshotUrl: string;
  headingFontFamily?: string;
  subheadingFontFamily?: string;
  headingFontSize?: number;
  subheadingFontSize?: number;
  accentColor?: string;
  headingColor?: string;
  subheadingColor?: string;
  mockupX?: number;
  mockupY?: number;
  headingX?: number;
  headingY?: number;
  subheadingX?: number;
  subheadingY?: number;
  isHovering?: boolean;
  isDragging?: boolean;
  dragTarget?: DraggableElement;
  device?: string;
}

export const useImageEditor = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const mockupCanvasCache = useRef<HTMLCanvasElement | null>(null);
  const lastScreenshotUrl = useRef<string | null>(null);
  const lastDevice = useRef<string | null>(null);

  const drawImage = async (options: DrawImageOptions) => {
    const {
      heading,
      subheading,
      screenshotUrl,
      headingFontFamily = 'Farro',
      subheadingFontFamily = 'Headland One',
      headingFontSize = 120,
      subheadingFontSize = 80,
      accentColor = '#000000',
      headingColor = '#FFFFFF',
      subheadingColor = '#FFFFFF',
      mockupX = 0,
      mockupY = 0,
      headingX = 0,
      headingY = 0,
      subheadingX = 0,
      subheadingY = 0,
      isHovering = false,
      isDragging = false,
      dragTarget = null,
      device = 'iPhone',
    } = options;
    
    // Ensure accentColor is never null or undefined
    const safeAccentColor = accentColor || '#000000';

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const context = canvas.getContext('2d');
    if (!context) return null;

    // Ensure fonts are loaded before drawing
    try {
      await Promise.all([
        document.fonts.load(`${headingFontSize}px "${headingFontFamily}"`),
        document.fonts.load(`${subheadingFontSize}px "${subheadingFontFamily}"`)
      ]);
    } catch (error) {
      console.warn('Font loading failed, continuing with fallback:', error);
    }

    const width = canvas.width;
    const height = canvas.height;

    // Background
    if (safeAccentColor === '#FFFFFF' || safeAccentColor === '#000000') {
      context.fillStyle = safeAccentColor;
    } else {
      const backgroundColor = lightenColor(safeAccentColor, 80);
      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, backgroundColor);
      gradient.addColorStop(1, '#f0f0f0');
      context.fillStyle = gradient;
    }
    context.fillRect(0, 0, width, height);

    // --- Text and Mockup Drawing ---
    let headingBounds: DOMRect | null = null;
    let subheadingBounds: DOMRect | null = null;
    let mockupBounds: DOMRect | null = null;

    // Heading
    context.font = `bold ${headingFontSize}px "${headingFontFamily}"`;
    context.fillStyle = headingColor;
    context.textAlign = 'center';
    const headingInitialY = 200;
    const headingDrawX = (width / 2) + headingX;
    const headingDrawY = headingInitialY + headingY;
    const { lines: headingLines, bounds: hBounds } = wrapText(context, heading, headingDrawX, headingDrawY, width - 100, headingFontSize * 1.1);
    headingLines.forEach(line => context.fillText(line.text, headingDrawX, line.y));
    headingBounds = hBounds;

    // Subheading
    context.font = `${subheadingFontSize}px "${subheadingFontFamily}"`;
    context.fillStyle = subheadingColor;
    context.textAlign = 'center';
    // Decouple subheading Y position from heading
    const subheadingInitialY = 400;
    const subheadingDrawX = (width / 2) + subheadingX;
    const subheadingDrawY = subheadingInitialY + subheadingY;
    const { lines: subheadingLines, bounds: sBounds } = wrapText(context, subheading, subheadingDrawX, subheadingDrawY, width - 100, subheadingFontSize * 1.2);
    subheadingLines.forEach(line => context.fillText(line.text, subheadingDrawX, line.y));
    subheadingBounds = sBounds;

    // Mockup
    if (lastScreenshotUrl.current !== screenshotUrl || lastDevice.current !== device) {
      mockupCanvasCache.current = null; // Invalidate cache
      lastScreenshotUrl.current = screenshotUrl;
      lastDevice.current = device;
    }

    if (!mockupCanvasCache.current) {
      mockupCanvasCache.current = await generateMockupImage(screenshotUrl, device);
    }
    const mockupCanvas = mockupCanvasCache.current;

    const textHeight = 500;
    const remainingHeight = height - textHeight;
    const mockupAspectRatio = mockupCanvas.width / mockupCanvas.height;
    let mockupDrawHeight = remainingHeight * 0.9;
    let mockupDrawWidth = mockupDrawHeight * mockupAspectRatio;

    if (mockupDrawWidth > width * 0.9) {
      mockupDrawWidth = width * 0.9;
      mockupDrawHeight = mockupDrawWidth / mockupAspectRatio;
    }

    const mockupInitialX = (width - mockupDrawWidth) / 2;
    const mockupInitialY = textHeight + (remainingHeight - mockupDrawHeight) / 2;
    const mockupDrawX = mockupInitialX + mockupX;
    const mockupDrawY = mockupInitialY + mockupY;

    context.drawImage(mockupCanvas, mockupDrawX, mockupDrawY, mockupDrawWidth, mockupDrawHeight);
    mockupBounds = new DOMRect(mockupDrawX, mockupDrawY, mockupDrawWidth, mockupDrawHeight);

    // --- Borders for Hover/Drag ---
    if (isHovering || isDragging) {
      context.strokeStyle = isDragging ? '#3b82f6' : '#9ca3af';
      context.lineWidth = 15;
      let boundsToDraw: DOMRect | null = null;
      switch (dragTarget) {
        case 'mockup': boundsToDraw = mockupBounds; break;
        case 'heading': boundsToDraw = headingBounds; break;
        case 'subheading': boundsToDraw = subheadingBounds; break;
      }
      if (boundsToDraw) {
        context.strokeRect(boundsToDraw.x, boundsToDraw.y, boundsToDraw.width, boundsToDraw.height);
      }
    }
    
    return { mockup: mockupBounds, heading: headingBounds, subheading: subheadingBounds };
  };

  return { drawImage };
};