/**
 * Helper to get visual image dimensions
 * Caches loaded images to avoid repeated loading
 */

const imageCache = new Map<string, { width: number; height: number }>();

export async function getVisualDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  // Check cache first
  if (imageCache.has(imageUrl)) {
    return imageCache.get(imageUrl)!;
  }

  // Load image to get dimensions
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };
      imageCache.set(imageUrl, dimensions);
      resolve(dimensions);
    };
    
    img.onerror = () => {
      // Fallback to default dimensions if image fails to load
      const fallback = { width: 300, height: 300 };
      imageCache.set(imageUrl, fallback);
      resolve(fallback);
    };
    
    img.src = imageUrl;
  });
}

export function clearVisualDimensionsCache() {
  imageCache.clear();
}
