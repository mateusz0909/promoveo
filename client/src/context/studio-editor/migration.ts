/**
 * Migration utilities to convert legacy screenshot data to unified element model
 */

import type { CanvasElement } from './elementTypes';
import type { ScreenshotState, LegacyScreenshotData } from './types';
import { createTextElement, createMockupElement, createVisualElement } from './elementTypes';

/**
 * Check if screenshot data is in legacy format
 */
export function isLegacyFormat(data: any): data is LegacyScreenshotData {
  return (
    data.heading !== undefined ||
    data.subheading !== undefined ||
    data.mockupPosition !== undefined ||
    data.headingPosition !== undefined ||
    data.subheadingPosition !== undefined
  );
}

/**
 * Migrate legacy screenshot data to new unified element model
 */
export function migrateLegacyScreenshot(legacy: LegacyScreenshotData): ScreenshotState {
  const elements: CanvasElement[] = [];
  let zIndex = 0;

  // Migrate legacy mockup to mockup element
  if (legacy.mockupScale && legacy.mockupScale > 0.01) {
    const mockupElement = createMockupElement(
      legacy.image.sourceScreenshotUrl || '',
      'iPhone 15 Pro', // Default frame type
      legacy.mockupPosition || { x: 0, y: 0 },
      {
        scale: legacy.mockupScale || 1,
        rotation: legacy.mockupRotation || 0,
        zIndex: zIndex++,
      }
    );
    elements.push(mockupElement);
  }

  // Migrate legacy heading to text element
  if (legacy.heading && legacy.heading.trim() !== '') {
    const headingElement = createTextElement(
      legacy.heading,
      legacy.headingPosition || { x: 100, y: 100 },
      {
        fontSize: legacy.headingFontSize || 32,
        color: legacy.headingColor || '#ffffff',
        align: legacy.headingAlign || 'left',
        letterSpacing: legacy.headingLetterSpacing || 0,
        lineHeight: legacy.headingLineHeight || 1.2,
        fontFamily: legacy.fontFamily || 'Inter',
        isBold: true,
        zIndex: zIndex++,
      }
    );
    elements.push(headingElement);
  }

  // Migrate legacy subheading to text element
  if (legacy.subheading && legacy.subheading.trim() !== '') {
    const subheadingElement = createTextElement(
      legacy.subheading,
      legacy.subheadingPosition || { x: 100, y: 200 },
      {
        fontSize: legacy.subheadingFontSize || 24,
        color: legacy.subheadingColor || '#ffffff',
        align: legacy.subheadingAlign || 'left',
        letterSpacing: legacy.subheadingLetterSpacing || 0,
        lineHeight: legacy.subheadingLineHeight || 1.2,
        fontFamily: legacy.fontFamily || 'Inter',
        isBold: false,
        zIndex: zIndex++,
      }
    );
    elements.push(subheadingElement);
  }

  // Migrate visuals from configuration
  const visuals = legacy.image.configuration?.visuals || [];
  visuals.forEach((visual: any) => {
    const visualElement = createVisualElement(
      visual.imageUrl,
      visual.name || 'Visual',
      visual.width || 300,
      visual.height || 300,
      visual.position || { x: 600, y: 1300 },
      {
        scale: visual.scale || 1,
        rotation: visual.rotation || 0,
        zIndex: visual.zIndex !== undefined ? visual.zIndex : zIndex++,
        opacity: 1,
      }
    );
    elements.push(visualElement);
  });

  return {
    id: legacy.id,
    image: legacy.image,
    elements,
    fontFamily: legacy.fontFamily || 'Inter',
    theme: legacy.theme || 'default',
  };
}

/**
 * Migrate array of legacy screenshots
 */
export function migrateLegacyScreenshots(legacyScreenshots: any[]): ScreenshotState[] {
  return legacyScreenshots.map(screenshot => {
    if (isLegacyFormat(screenshot)) {
      return migrateLegacyScreenshot(screenshot);
    }
    // Already in new format
    return screenshot as ScreenshotState;
  });
}

/**
 * Convert new screenshot to legacy format for API compatibility
 * (Used when saving to backend until backend is updated)
 */
export function convertToLegacyFormat(screenshot: ScreenshotState): any {
  // Initialize with existing configuration to preserve all fields
  const existingConfig = screenshot.image.configuration || {};
  
  // Collect element data
  let heading = '';
  let subheading = '';
  let headingFontSize = 64;
  let subheadingFontSize = 32;
  let headingColor = '#ffffff';
  let subheadingColor = '#ffffff';
  let headingAlign: 'left' | 'center' | 'right' = 'left';
  let subheadingAlign: 'left' | 'center' | 'right' = 'left';
  let headingLetterSpacing = 0;
  let subheadingLetterSpacing = 0;
  let headingLineHeight = 1.2;
  let subheadingLineHeight = 1.2;
  let headingX = 100;
  let headingY = 100;
  let subheadingX = 100;
  let subheadingY = 200;
  let mockupX = 0;
  let mockupY = 0;
  let mockupScale = 1;
  let mockupRotation = 0;
  
  const visuals: any[] = [];
  let hasHeading = false;
  let hasSubheading = false;

  screenshot.elements.forEach(element => {
    if (element.kind === 'text') {
      // Use first bold text as heading, first non-bold as subheading
      if (element.isBold && !hasHeading) {
        heading = element.text;
        headingX = element.position.x;
        headingY = element.position.y;
        headingFontSize = element.fontSize;
        headingColor = element.color;
        headingAlign = element.align;
        headingLetterSpacing = element.letterSpacing;
        headingLineHeight = element.lineHeight;
        hasHeading = true;
      } else if (!element.isBold && !hasSubheading) {
        subheading = element.text;
        subheadingX = element.position.x;
        subheadingY = element.position.y;
        subheadingFontSize = element.fontSize;
        subheadingColor = element.color;
        subheadingAlign = element.align;
        subheadingLetterSpacing = element.letterSpacing;
        subheadingLineHeight = element.lineHeight;
        hasSubheading = true;
      }
    } else if (element.kind === 'mockup') {
      // Use first mockup as primary
      if (!visuals.some(v => v.kind === 'mockup')) {
        mockupX = element.position.x;
        mockupY = element.position.y;
        mockupScale = element.scale;
        mockupRotation = element.rotation;
      }
    } else if (element.kind === 'visual') {
      visuals.push({
        id: element.id.replace('visual-', ''),
        imageUrl: element.imageUrl,
        name: element.name,
        width: element.width,
        height: element.height,
        position: element.position,
        scale: element.scale,
        rotation: element.rotation,
        zIndex: element.zIndex,
      });
    }
  });

  // Build complete configuration object with all fields
  const configuration = {
    // Preserve existing fields
    ...existingConfig,
    
    // Update with current element data
    heading,
    subheading,
    headingFont: screenshot.fontFamily || existingConfig.headingFont || 'Inter',
    headingFontSize,
    subheadingFontSize,
    headingColor,
    subheadingColor,
    headingAlign,
    subheadingAlign,
    headingLetterSpacing,
    subheadingLetterSpacing,
    headingLineHeight,
    subheadingLineHeight,
    headingX,
    headingY,
    subheadingX,
    subheadingY,
    mockupX,
    mockupY,
    mockupScale,
    mockupRotation,
    theme: screenshot.theme || existingConfig.theme || 'light',
    
    // Update visuals array
    visuals,
  };

  return {
    id: screenshot.id,
    image: {
      ...screenshot.image,
      configuration,
    },
  };
}
