import type { VisualInstance } from '@/context/StudioEditorContext';

/**
 * Renders custom visual elements (uploaded images) on the canvas
 */
export async function renderVisuals(
  ctx: CanvasRenderingContext2D,
  visuals: VisualInstance[],
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  if (!visuals || visuals.length === 0) return;

  // Sort by zIndex to render in correct order
  const sortedVisuals = [...visuals].sort((a, b) => a.zIndex - b.zIndex);

  for (const visual of sortedVisuals) {
    await renderVisual(ctx, visual, canvasWidth, canvasHeight);
  }
}

/**
 * Renders a single visual instance
 */
async function renderVisual(
  ctx: CanvasRenderingContext2D,
  visual: VisualInstance,
  _canvasWidth: number,
  _canvasHeight: number
): Promise<void> {
  try {
    // Load the image
    const img = await loadImage(visual.imageUrl);
    
    // Save context state
    ctx.save();

    // Translate to visual position
    ctx.translate(visual.position.x, visual.position.y);

    // Apply rotation (convert degrees to radians)
    if (visual.rotation) {
      ctx.rotate((visual.rotation * Math.PI) / 180);
    }

    // Calculate scaled dimensions using stored dimensions
    const scaledWidth = visual.width * visual.scale;
    const scaledHeight = visual.height * visual.scale;

    // Draw centered on position
    ctx.drawImage(
      img,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Restore context state
    ctx.restore();
  } catch (error) {
    console.error('Error rendering visual:', visual.id, error);
  }
}

/**
 * Loads an image from a URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for Supabase images
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = url;
  });
}

/**
 * Gets the bounding box of a visual for hit detection
 */
export function getVisualBoundingBox(visual: VisualInstance, imageWidth: number, imageHeight: number) {
  const scaledWidth = imageWidth * visual.scale;
  const scaledHeight = imageHeight * visual.scale;

  // Simple axis-aligned bounding box (doesn't account for rotation)
  // For full hit detection with rotation, we'd need to transform the corners
  return {
    x: visual.position.x - scaledWidth / 2,
    y: visual.position.y - scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight,
  };
}

/**
 * Check if a point is inside a visual element
 */
export function isPointInVisual(
  x: number,
  y: number,
  visual: VisualInstance,
  imageWidth: number,
  imageHeight: number
): boolean {
  const scaledWidth = imageWidth * visual.scale;
  const scaledHeight = imageHeight * visual.scale;

  // For now, simple AABB collision (doesn't account for rotation)
  // TODO: Implement rotated rectangle collision detection
  const bounds = {
    x: visual.position.x - scaledWidth / 2,
    y: visual.position.y - scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight,
  };

  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}
