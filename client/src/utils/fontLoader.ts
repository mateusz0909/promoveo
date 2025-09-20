// client/src/utils/fontLoader.ts
/**
 * Font loading utilities for the frontend
 */

export const AVAILABLE_FONTS = [
  'Farro',
  'Headland One',
  'Inter',
  'Lato', 
  'Montserrat',
  'Nexa',
  'Open Sans',
  'Roboto'
];

/**
 * Preload fonts for canvas rendering
 */
export const preloadFonts = async (fontFamilies: string[]): Promise<void> => {
  const fontPromises = fontFamilies.map(async (family) => {
    // Check if already loaded
    if (document.fonts.check(`16px "${family}"`)) {
      return Promise.resolve();
    }
    
    // Load different weights commonly used
    const weights = ['400', '500', '700'];
    const weightPromises = weights.map(async (weight) => {
      try {
        await document.fonts.load(`${weight} 16px "${family}"`);
        console.log(`Loaded ${family} ${weight}`);
      } catch (error) {
        console.warn(`Failed to load ${family} ${weight}:`, error);
      }
    });
    
    return Promise.allSettled(weightPromises);
  });
  
  try {
    await Promise.allSettled(fontPromises);
    console.log('Font preloading completed');
  } catch (error) {
    console.warn('Some fonts failed to preload:', error);
  }
};

/**
 * Wait for a specific font to be ready before using in canvas
 */
export const waitForFont = async (family: string, weight: string = '400', size: string = '16px'): Promise<boolean> => {
  const fontString = `${weight} ${size} "${family}"`;
  
  if (document.fonts.check(fontString)) {
    return true;
  }
  
  try {
    await document.fonts.load(fontString);
    return document.fonts.check(fontString);
  } catch (error) {
    console.warn(`Failed to load font: ${fontString}`, error);
    return false;
  }
};