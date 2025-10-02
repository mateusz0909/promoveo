import { useCallback, useRef } from 'react';
import type { ImageThemeDefinition } from '@/constants/imageThemes';
import { lightenColor } from '@/utils/color';

type DraggableElement = "mockup" | "heading" | "subheading" | null;
type HandleType = "rotate" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se" | null;

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
  headingColor?: string;
  subheadingColor?: string;
  mockupX?: number;
  mockupY?: number;
  mockupScale?: number;
  mockupRotation?: number;
  headingX?: number;
  headingY?: number;
  subheadingX?: number;
  subheadingY?: number;
  isHovering?: boolean;
  isDragging?: boolean;
  dragTarget?: DraggableElement;
  activeHandle?: HandleType;
  device?: string;
  accentColor?: string | null;
  theme: ImageThemeDefinition;
  layout?: 'text-top' | 'text-bottom';
}

export const useImageEditor = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const mockupCanvasCache = useRef<HTMLCanvasElement | null>(null);
  const lastScreenshotUrl = useRef<string | null>(null);
  const lastDevice = useRef<string | null>(null);

  const drawImage = useCallback(async (options: DrawImageOptions) => {
    const {
      heading,
      subheading,
      screenshotUrl,
      headingFontFamily = 'Farro',
      subheadingFontFamily = 'Headland One',
      headingFontSize = 120,
      subheadingFontSize = 80,
      headingColor: headingColorOverride,
      subheadingColor: subheadingColorOverride,
      mockupX = 0,
      mockupY = 0,
      mockupScale = 1,
      mockupRotation = 0,
      headingX = 0,
      headingY = 0,
      subheadingX = 0,
      subheadingY = 0,
      isHovering = false,
      isDragging = false,
      dragTarget = null,
      activeHandle = null,
      device = 'iPhone',
      accentColor: accentColorInput,
      theme,
      layout = 'text-top',
    } = options;

    const resolvedHeadingColor = headingColorOverride ?? theme.headingColor;
    const resolvedSubheadingColor = subheadingColorOverride ?? theme.subheadingColor;
    const rawAccentColor = accentColorInput ?? (theme.background.type === 'accent' ? theme.background.fallback : '#4F46E5');

    // Ensure accentColor is never null or undefined
    const safeAccentColor = rawAccentColor || '#000000';
    const accentLightenPercent = theme.background.type === 'accent' ? (theme.background.lightenBasePercent ?? 45) : 0;
    const pastelAccentColor = theme.background.type === 'accent'
      ? lightenColor(safeAccentColor, accentLightenPercent)
      : safeAccentColor;

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

    const applyBackground = () => {
      switch (theme.background.type) {
        case 'accent': {
          const base = pastelAccentColor || theme.background.fallback || '#4F46E5';
          // Match backend: gradient from lightened accent to almost white
          const gradient = context.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, base); // top: lightened accent color
          gradient.addColorStop(1, '#f0f0f0'); // bottom: almost white (matches backend)
          context.fillStyle = gradient;
          break;
        }
        case 'solid': {
          context.fillStyle = theme.background.color;
          break;
        }
        case 'linear-gradient': {
          const { colors, angle = 0 } = theme.background;
          const radians = (angle % 360) * (Math.PI / 180);
          const halfWidth = width / 2;
          const halfHeight = height / 2;
          const x = Math.cos(radians);
          const y = Math.sin(radians);
          const x0 = halfWidth - x * halfWidth;
          const y0 = halfHeight - y * halfHeight;
          const x1 = halfWidth + x * halfWidth;
          const y1 = halfHeight + y * halfHeight;
          const gradient = context.createLinearGradient(x0, y0, x1, y1);
          const stopCount = colors.length;
          colors.forEach((color, index) => {
            const position = stopCount === 1 ? 1 : index / (stopCount - 1);
            gradient.addColorStop(position, color);
          });
          context.fillStyle = gradient;
          break;
        }
        case 'radial-gradient': {
          const radius = Math.min(width, height) * (theme.background.radiusRatio ?? 0.65);
          const centerX = width / 2;
          const centerY = height * 0.35;
          const radial = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          radial.addColorStop(0, theme.background.innerColor);
          radial.addColorStop(1, theme.background.outerColor);
          context.fillStyle = radial;
          break;
        }
      }
      context.fillRect(0, 0, width, height);
    };

    applyBackground();

    if (theme.overlay?.type === 'spotlight') {
      const overlay = theme.overlay;
      const radius = Math.min(width, height) * (overlay.radiusRatio ?? 0.6);
      const centerX = width / 2;
      const centerY = height * (overlay.yOffsetRatio ?? 0.35);
      const spotlight = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      spotlight.addColorStop(0, overlay.color);
      spotlight.addColorStop(1, 'rgba(255,255,255,0)');
      context.save();
      context.globalAlpha = overlay.opacity ?? 0.3;
      context.fillStyle = spotlight;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (theme.ribbon) {
      const { colors, heightRatio = 0.2, opacity = 0.25 } = theme.ribbon;
      const ribbonHeight = height * heightRatio;
      const startY = height * 0.55;
      const gradient = context.createLinearGradient(0, startY, width, startY);
      const stopCount = colors.length;
      colors.forEach((color, index) => {
        const position = stopCount === 1 ? 1 : index / (stopCount - 1);
        gradient.addColorStop(position, color);
      });
      context.save();
      context.globalAlpha = opacity;
      context.fillStyle = gradient;
      context.fillRect(0, startY, width, ribbonHeight);
      context.restore();
    }

    // --- Text and Mockup Drawing ---
    let headingBounds: DOMRect | null = null;
    let subheadingBounds: DOMRect | null = null;
    let mockupBounds: DOMRect | null = null;

    // Mockup preparation
    if (lastScreenshotUrl.current !== screenshotUrl || lastDevice.current !== device) {
      mockupCanvasCache.current = null; // Invalidate cache
      lastScreenshotUrl.current = screenshotUrl;
      lastDevice.current = device;
    }

    if (!mockupCanvasCache.current) {
      mockupCanvasCache.current = await generateMockupImage(screenshotUrl, device);
    }
    const mockupCanvas = mockupCanvasCache.current;

    // Calculate mockup dimensions
    const textHeight = 500;
    const remainingHeight = height - textHeight;
    const mockupAspectRatio = mockupCanvas.width / mockupCanvas.height;
    let mockupDrawHeight = remainingHeight * 0.9;
    let mockupDrawWidth = mockupDrawHeight * mockupAspectRatio;

    if (mockupDrawWidth > width * 0.9) {
      mockupDrawWidth = width * 0.9;
      mockupDrawHeight = mockupDrawWidth / mockupAspectRatio;
    }

    // Layout-based positioning
    let headingInitialY: number;
    let subheadingInitialY: number;
    let mockupInitialX: number;
    let mockupInitialY: number;

    if (layout === 'text-bottom') {
      // Layout: Mockup at top, then heading, then subheading - DYNAMIC SPACING
      const topPadding = 80;
      const bottomPadding = 0;
      
      // Step 1: Calculate how many lines the text will take (rough estimation)
      const maxTextWidth = width - 100;
      
      // Create temporary context to measure text
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // Measure heading lines
        tempCtx.font = `bold ${headingFontSize}px "${headingFontFamily}"`;
        const headingWords = heading.split(' ');
        let headingLines = 1;
        let currentLine = '';
        for (const word of headingWords) {
          const testLine = currentLine + word + ' ';
          const metrics = tempCtx.measureText(testLine);
          if (metrics.width > maxTextWidth && currentLine !== '') {
            headingLines++;
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        // Measure subheading lines
        tempCtx.font = `${subheadingFontSize}px "${subheadingFontFamily}"`;
        const subheadingWords = subheading.split(' ');
        let subheadingLines = 1;
        currentLine = '';
        for (const word of subheadingWords) {
          const testLine = currentLine + word + ' ';
          const metrics = tempCtx.measureText(testLine);
          if (metrics.width > maxTextWidth && currentLine !== '') {
            subheadingLines++;
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        // Step 2: Calculate actual text heights
        const headingHeight = headingLines * headingFontSize * 1.1;
        const subheadingHeight = subheadingLines * subheadingFontSize * 1.2;
        const totalTextHeight = headingHeight + subheadingHeight;
        
        // Step 3: Size mockup to use 65% of canvas, leaving 35% for text + spacing
        const mockupTargetHeight = height * 0.70;
        let adjustedMockupHeight = Math.min(mockupDrawHeight, mockupTargetHeight);
        let adjustedMockupWidth = adjustedMockupHeight * mockupAspectRatio;
        
        if (adjustedMockupWidth > width * 0.9) {
          adjustedMockupWidth = width * 0.9;
          adjustedMockupHeight = adjustedMockupWidth / mockupAspectRatio;
        }
        
        // Update mockup dimensions
        mockupDrawHeight = adjustedMockupHeight;
        mockupDrawWidth = adjustedMockupWidth;
        
        // Step 4: Calculate available space below mockup
        const spaceAfterMockup = height - topPadding - mockupDrawHeight - bottomPadding;
        
        // Step 5: Distribute space: gaps around text
        const totalGapsNeeded = 2; // gap before heading, gap between heading/subheading
        const gapSize = Math.max(30, (spaceAfterMockup - totalTextHeight) / totalGapsNeeded);
        
        mockupInitialX = (width - mockupDrawWidth) / 2;
        mockupInitialY = topPadding;
        headingInitialY = topPadding + mockupDrawHeight + gapSize;
        subheadingInitialY = headingInitialY + headingHeight + (gapSize * 0.1); // Smaller gap between texts
      } else {
        // Fallback if context is not available
        const mockupToTextGap = 120;
        const headingToSubheadingGap = 30;
        const estimatedHeadingHeight = headingFontSize * 2.5;
        
        const mockupTargetHeight = height * 0.65;
        let adjustedMockupHeight = Math.min(mockupDrawHeight, mockupTargetHeight);
        let adjustedMockupWidth = adjustedMockupHeight * mockupAspectRatio;
        
        if (adjustedMockupWidth > width * 0.9) {
          adjustedMockupWidth = width * 0.9;
          adjustedMockupHeight = adjustedMockupWidth / mockupAspectRatio;
        }
        
        mockupDrawHeight = adjustedMockupHeight;
        mockupDrawWidth = adjustedMockupWidth;
        
        mockupInitialX = (width - mockupDrawWidth) / 2;
        mockupInitialY = topPadding;
        headingInitialY = topPadding + mockupDrawHeight + mockupToTextGap;
        subheadingInitialY = headingInitialY + estimatedHeadingHeight + headingToSubheadingGap;
      }
    } else {
      // Layout: Text at top (heading, subheading), mockup below (default)
      headingInitialY = 200;
      subheadingInitialY = 400;
      mockupInitialX = (width - mockupDrawWidth) / 2;
      mockupInitialY = textHeight + (remainingHeight - mockupDrawHeight) / 2;
    }

    const mockupDrawX = mockupInitialX + mockupX;
    const mockupDrawY = mockupInitialY + mockupY;

    // Draw in correct order based on layout
    if (layout === 'text-bottom') {
      // Draw mockup first
      context.save();
      const mockupCenterX = mockupDrawX + mockupDrawWidth / 2;
      const mockupCenterY = mockupDrawY + mockupDrawHeight / 2;
      context.translate(mockupCenterX, mockupCenterY);
      context.rotate((mockupRotation * Math.PI) / 180);
      context.scale(mockupScale, mockupScale);
      context.translate(-mockupCenterX, -mockupCenterY);
      context.drawImage(mockupCanvas, mockupDrawX, mockupDrawY, mockupDrawWidth, mockupDrawHeight);
      context.restore();

      const scaledWidth = mockupDrawWidth * mockupScale;
      const scaledHeight = mockupDrawHeight * mockupScale;
      const scaledX = mockupCenterX - scaledWidth / 2;
      const scaledY = mockupCenterY - scaledHeight / 2;
      mockupBounds = new DOMRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Then draw text
      context.font = `bold ${headingFontSize}px "${headingFontFamily}"`;
      context.fillStyle = resolvedHeadingColor;
      context.textAlign = 'center';
      const headingDrawX = (width / 2) + headingX;
      const headingDrawY = headingInitialY + headingY;
      const { lines: headingLines, bounds: hBounds } = wrapText(context, heading, headingDrawX, headingDrawY, width - 100, headingFontSize * 1.1);
      headingLines.forEach(line => context.fillText(line.text, headingDrawX, line.y));
      headingBounds = hBounds;

      context.font = `${subheadingFontSize}px "${subheadingFontFamily}"`;
      context.fillStyle = resolvedSubheadingColor;
      context.textAlign = 'center';
      const subheadingDrawX = (width / 2) + subheadingX;
      const subheadingDrawY = subheadingInitialY + subheadingY;
      const { lines: subheadingLines, bounds: sBounds } = wrapText(context, subheading, subheadingDrawX, subheadingDrawY, width - 100, subheadingFontSize * 1.2);
      subheadingLines.forEach(line => context.fillText(line.text, subheadingDrawX, line.y));
      subheadingBounds = sBounds;
    } else {
      // Draw text first (default layout)
      context.font = `bold ${headingFontSize}px "${headingFontFamily}"`;
      context.fillStyle = resolvedHeadingColor;
      context.textAlign = 'center';
      const headingDrawX = (width / 2) + headingX;
      const headingDrawY = headingInitialY + headingY;
      const { lines: headingLines, bounds: hBounds } = wrapText(context, heading, headingDrawX, headingDrawY, width - 100, headingFontSize * 1.1);
      headingLines.forEach(line => context.fillText(line.text, headingDrawX, line.y));
      headingBounds = hBounds;

      context.font = `${subheadingFontSize}px "${subheadingFontFamily}"`;
      context.fillStyle = resolvedSubheadingColor;
      context.textAlign = 'center';
      const subheadingDrawX = (width / 2) + subheadingX;
      const subheadingDrawY = subheadingInitialY + subheadingY;
      const { lines: subheadingLines, bounds: sBounds } = wrapText(context, subheading, subheadingDrawX, subheadingDrawY, width - 100, subheadingFontSize * 1.2);
      subheadingLines.forEach(line => context.fillText(line.text, subheadingDrawX, line.y));
      subheadingBounds = sBounds;

      // Then draw mockup
      context.save();
      const mockupCenterX = mockupDrawX + mockupDrawWidth / 2;
      const mockupCenterY = mockupDrawY + mockupDrawHeight / 2;
      context.translate(mockupCenterX, mockupCenterY);
      context.rotate((mockupRotation * Math.PI) / 180);
      context.scale(mockupScale, mockupScale);
      context.translate(-mockupCenterX, -mockupCenterY);
      context.drawImage(mockupCanvas, mockupDrawX, mockupDrawY, mockupDrawWidth, mockupDrawHeight);
      context.restore();

      const scaledWidth = mockupDrawWidth * mockupScale;
      const scaledHeight = mockupDrawHeight * mockupScale;
      const scaledX = mockupCenterX - scaledWidth / 2;
      const scaledY = mockupCenterY - scaledHeight / 2;
      mockupBounds = new DOMRect(scaledX, scaledY, scaledWidth, scaledHeight);
    }

    // Calculate mockup center for handle drawing (needs to be accessible outside the if blocks)
    const mockupCenterX = mockupDrawX + mockupDrawWidth / 2;
    const mockupCenterY = mockupDrawY + mockupDrawHeight / 2;
    const scaledWidth = mockupDrawWidth * mockupScale;
    const scaledHeight = mockupDrawHeight * mockupScale;

    // --- Borders for Hover/Drag ---
    if (isHovering || isDragging) {
      context.strokeStyle = isDragging ? '#3b82f6' : '#9ca3af';
      context.lineWidth = 5;
      let boundsToDraw: DOMRect | null = null;
      switch (dragTarget) {
        case 'heading': boundsToDraw = headingBounds; break;
        case 'subheading': boundsToDraw = subheadingBounds; break;
        // Mockup bounds are drawn in rotated space below, so skip here
      }
      if (boundsToDraw) {
        context.strokeRect(boundsToDraw.x, boundsToDraw.y, boundsToDraw.width, boundsToDraw.height);
      }
    }

    // --- Interactive Handles for Mockup ---
    if ((isHovering || isDragging) && dragTarget === 'mockup' && mockupBounds) {
      const handleSize = 24;
      const rotateHandleOffset = 40;
      
      // Save context for handles
      context.save();
      
      // Rotate context for handles to match mockup rotation
      context.translate(mockupCenterX, mockupCenterY);
      context.rotate((mockupRotation * Math.PI) / 180);
      
      // Draw bounding box in rotated space
      const halfWidth = scaledWidth / 2;
      const halfHeight = scaledHeight / 2;
      
      context.strokeStyle = isDragging ? '#3b82f6' : '#9ca3af';
      context.lineWidth = 5;
      context.strokeRect(-halfWidth, -halfHeight, scaledWidth, scaledHeight);
      
      // Helper to draw a handle
      const drawHandle = (x: number, y: number, isActive: boolean) => {
        context.fillStyle = isActive ? '#3b82f6' : '#ffffff';
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 5;
        context.beginPath();
        context.arc(x, y, handleSize / 2, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      };
      
      // Corner resize handles
      const corners = [
        { x: -halfWidth, y: -halfHeight, handle: 'resize-nw' },
        { x: halfWidth, y: -halfHeight, handle: 'resize-ne' },
        { x: -halfWidth, y: halfHeight, handle: 'resize-sw' },
        { x: halfWidth, y: halfHeight, handle: 'resize-se' },
      ];
      
      corners.forEach(corner => {
        const isActive = activeHandle === corner.handle;
        drawHandle(corner.x, corner.y, isActive);
      });
      
      // Rotation handle (above top edge)
      const rotateY = -halfHeight - rotateHandleOffset;
      const isRotateActive = activeHandle === 'rotate';
      
      // Draw line from top center to rotate handle
      context.strokeStyle = '#3b82f6';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, -halfHeight);
      context.lineTo(0, rotateY);
      context.stroke();
      
      // Draw rotation handle as a circle with rotation icon
      context.fillStyle = isRotateActive ? '#3b82f6' : '#ffffff';
      context.strokeStyle = '#3b82f6';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(0, rotateY, handleSize / 2, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      
      // Draw curved arrow inside rotation handle
      context.strokeStyle = isRotateActive ? '#ffffff' : '#3b82f6';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(0, rotateY, handleSize / 4, -Math.PI * 0.3, Math.PI * 1.5, false);
      context.stroke();
      // Arrow head
      const arrowSize = 4;
      context.beginPath();
      context.moveTo(-arrowSize / 2, rotateY - handleSize / 4);
      context.lineTo(arrowSize / 2, rotateY - handleSize / 4);
      context.lineTo(0, rotateY - handleSize / 4 - arrowSize);
      context.closePath();
      context.fillStyle = isRotateActive ? '#ffffff' : '#3b82f6';
      context.fill();
      
      context.restore();
    }
    
    return { mockup: mockupBounds, heading: headingBounds, subheading: subheadingBounds };
  }, [canvasRef]);

  return { drawImage };
};