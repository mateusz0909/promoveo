/**
 * Mockup rendering utilities
 */

export interface MockupConfig {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  baseWidth: number;
  baseHeight: number;
  cornerRadius: number;
  innerPadding: number;
}

/**
 * Draw screenshot inside mockup frame with rotation
 */
export function drawMockup(
  ctx: CanvasRenderingContext2D,
  screenshotImage: HTMLImageElement,
  deviceFrameImage: HTMLImageElement | null,
  config: MockupConfig,
  canvasWidth: number,
  canvasHeight: number
): void {
  const mockupWidth = config.baseWidth * config.scale;
  const mockupHeight = config.baseHeight * config.scale;
  const mockupX = (canvasWidth - mockupWidth) / 2 + config.position.x;
  const mockupY = (canvasHeight - mockupHeight) / 2 + config.position.y;
  
  const radius = config.cornerRadius * config.scale;
  const innerPadding = config.innerPadding * config.scale;
  
  // Calculate center point for rotation
  const centerX = mockupX + mockupWidth / 2;
  const centerY = mockupY + mockupHeight / 2;
  
  // Draw screenshot with clipping and rotation
  ctx.save();
  
  // Apply rotation transformation
  if (config.rotation !== 0) {
    ctx.translate(centerX, centerY);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }
  
  ctx.beginPath();
  ctx.roundRect(
    mockupX + innerPadding,
    mockupY + innerPadding,
    mockupWidth - innerPadding * 2,
    mockupHeight - innerPadding * 2,
    radius
  );
  ctx.clip();
  
  ctx.drawImage(
    screenshotImage,
    mockupX + innerPadding,
    mockupY + innerPadding,
    mockupWidth - innerPadding * 2,
    mockupHeight - innerPadding * 2
  );
  
  ctx.restore();
  
  // Draw device frame or fallback border
  ctx.save();
  
  if (config.rotation !== 0) {
    ctx.translate(centerX, centerY);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }
  
  if (deviceFrameImage) {
    ctx.drawImage(deviceFrameImage, mockupX, mockupY, mockupWidth, mockupHeight);
  } else {
    // Fallback border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 8 * config.scale;
    ctx.beginPath();
    ctx.roundRect(mockupX, mockupY, mockupWidth, mockupHeight, radius);
    ctx.stroke();
  }
  
  ctx.restore();
}
