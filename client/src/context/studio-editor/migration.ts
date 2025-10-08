/**
 * Migration utilities to convert legacy screenshot data to unified element model
 */

import type { CanvasElement, TextElement } from './elementTypes';
import type { ScreenshotState, LegacyScreenshotData, GlobalSettings } from './types';
import type { GeneratedImage, GeneratedImageConfiguration } from '@/types/project';
import { createTextElement, createMockupElement, createVisualElement } from './elementTypes';
import { resolveDevicePreset } from '@/constants/devicePresets';

const DEFAULT_TEXT_WIDTH = 1118; // 90% of 1242px canvas width (rounded)

interface LegacyVisualConfiguration {
  id?: string;
  imageUrl: string;
  name?: string;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  zIndex?: number;
}

type LegacyScreenshotInput = LegacyScreenshotData | ScreenshotState;

interface ConvertedLegacyScreenshot {
  id: string;
  image: GeneratedImage;
}

/**
 * Check if screenshot data is in legacy format
 */
export function isLegacyFormat(data: unknown): data is LegacyScreenshotData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const maybe = data as Partial<LegacyScreenshotData>;

  return (
    maybe.heading !== undefined ||
    maybe.subheading !== undefined ||
    maybe.mockupPosition !== undefined ||
    maybe.headingPosition !== undefined ||
    maybe.subheadingPosition !== undefined
  );
}

/**
 * Migrate legacy screenshot data to new unified element model
 */
export function migrateLegacyScreenshot(legacy: LegacyScreenshotData): ScreenshotState {
  const elements: CanvasElement[] = [];
  let zIndex = 0;

  const configTextInstances = Array.isArray(legacy.textInstances)
    ? legacy.textInstances
    : Array.isArray(legacy.image.configuration?.textInstances)
    ? legacy.image.configuration?.textInstances
    : null;

  if (configTextInstances && configTextInstances.length > 0) {
    configTextInstances
      .slice()
      .sort((a, b) => (a?.zIndex ?? 0) - (b?.zIndex ?? 0))
      .forEach((instance) => {
        const textElement = createTextElement(
          instance?.text ?? '',
          instance?.position ?? { x: 100, y: 100 },
          {
            fontSize: instance?.fontSize ?? 32,
            color: instance?.color ?? '#ffffff',
            align: instance?.align ?? 'left',
            letterSpacing: instance?.letterSpacing ?? 0,
            lineHeight: instance?.lineHeight ?? 1.2,
            fontFamily: instance?.fontFamily ?? legacy.fontFamily ?? 'Inter',
            fontWeight: instance?.fontWeight ?? (instance?.isBold ? 700 : undefined),
            isBold: instance?.isBold ?? ((instance?.fontWeight ?? 400) >= 600),
            width: instance?.width ?? DEFAULT_TEXT_WIDTH,
          }
        );

        if (instance?.id) {
          textElement.id = instance.id;
        }

        if (typeof instance?.rotation === 'number') {
          textElement.rotation = instance.rotation;
        }

        if (typeof instance?.zIndex === 'number') {
          textElement.zIndex = instance.zIndex;
        } else {
          textElement.zIndex = zIndex++;
        }

        elements.push(textElement);
      });

    const firstHeading = configTextInstances.find((item) => item?.type === 'heading');
    const firstSubheading = configTextInstances.find((item) => item?.type === 'subheading' && item !== firstHeading);

    if (firstHeading) {
      legacy.heading = firstHeading.text ?? legacy.heading;
      legacy.headingFontSize = firstHeading.fontSize ?? legacy.headingFontSize;
      legacy.headingColor = firstHeading.color ?? legacy.headingColor;
      legacy.headingAlign = (firstHeading.align as 'left' | 'center' | 'right') ?? legacy.headingAlign;
      legacy.headingLetterSpacing = firstHeading.letterSpacing ?? legacy.headingLetterSpacing;
      legacy.headingLineHeight = firstHeading.lineHeight ?? legacy.headingLineHeight;
      legacy.headingPosition = firstHeading.position ?? legacy.headingPosition;
      legacy.headingWidth = firstHeading.width ?? legacy.headingWidth;
      legacy.fontFamily = firstHeading.fontFamily ?? legacy.fontFamily;
    }

    if (firstSubheading) {
      legacy.subheading = firstSubheading.text ?? legacy.subheading;
      legacy.subheadingFontSize = firstSubheading.fontSize ?? legacy.subheadingFontSize;
      legacy.subheadingColor = firstSubheading.color ?? legacy.subheadingColor;
      legacy.subheadingAlign = (firstSubheading.align as 'left' | 'center' | 'right') ?? legacy.subheadingAlign;
      legacy.subheadingLetterSpacing = firstSubheading.letterSpacing ?? legacy.subheadingLetterSpacing;
      legacy.subheadingLineHeight = firstSubheading.lineHeight ?? legacy.subheadingLineHeight;
      legacy.subheadingPosition = firstSubheading.position ?? legacy.subheadingPosition;
      legacy.subheadingWidth = firstSubheading.width ?? legacy.subheadingWidth;
    }
  }

  // Migrate legacy mockup to mockup element
  if (legacy.mockupScale && legacy.mockupScale > 0.01) {
    const configurationFrame = typeof legacy.image.configuration?.deviceFrame === 'string'
      ? legacy.image.configuration?.deviceFrame
      : undefined;
    const preset = resolveDevicePreset(configurationFrame ?? 'iPhone 15 Pro');
    const defaultPosition = legacy.mockupPosition
      ? { ...legacy.mockupPosition }
      : (preset.mockup.offset ? { ...preset.mockup.offset } : { x: 0, y: 0 });
    const mockupElement = createMockupElement(
      legacy.image.sourceScreenshotUrl || '',
      preset.id,
      defaultPosition,
      {
        scale: Math.min(legacy.mockupScale ?? preset.mockup.defaultScale, preset.mockup.defaultScale),
        rotation: legacy.mockupRotation || 0,
        zIndex: zIndex++,
      }
    );
    elements.push(mockupElement);
  }

  // Migrate legacy heading to text element
  if (!configTextInstances || configTextInstances.length === 0) {
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
          width: legacy.headingWidth ?? DEFAULT_TEXT_WIDTH,
          zIndex: zIndex++,
        }
      );
      elements.push(headingElement);
    }

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
          width: legacy.subheadingWidth ?? DEFAULT_TEXT_WIDTH,
          zIndex: zIndex++,
        }
      );
      elements.push(subheadingElement);
    }
  }

  // Migrate visuals from configuration
  const visualsConfig: LegacyVisualConfiguration[] = Array.isArray(legacy.image.configuration?.visuals)
    ? (legacy.image.configuration?.visuals as LegacyVisualConfiguration[])
    : [];
  visualsConfig.forEach((visual) => {
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
export function migrateLegacyScreenshots(legacyScreenshots: LegacyScreenshotInput[]): ScreenshotState[] {
  return legacyScreenshots.map(screenshot => {
    if (isLegacyFormat(screenshot)) {
      return migrateLegacyScreenshot(screenshot);
    }
    // Already in new format
    return screenshot as ScreenshotState;
  });
}

export function generatedImageToLegacyData(
  img: GeneratedImage,
  fallbackIndex: number
): LegacyScreenshotData {
  return {
    id: img.id || `screenshot-${fallbackIndex}`,
    image: img,
    heading: img.configuration?.heading ?? '',
    subheading: img.configuration?.subheading ?? '',
  headingWidth: img.configuration?.headingWidth ?? DEFAULT_TEXT_WIDTH,
  subheadingWidth: img.configuration?.subheadingWidth ?? DEFAULT_TEXT_WIDTH,
    mockupPosition: {
      x: img.configuration?.mockupX ?? 0,
      y: img.configuration?.mockupY ?? 0,
    },
    mockupScale: img.configuration?.mockupScale ?? 1,
    mockupRotation: img.configuration?.mockupRotation ?? 0,
    headingPosition: {
      x: img.configuration?.headingX ?? 100,
      y: img.configuration?.headingY ?? 100,
    },
    subheadingPosition: {
      x: img.configuration?.subheadingX ?? 100,
      y: img.configuration?.subheadingY ?? 200,
    },
    headingFontSize: img.configuration?.headingFontSize ?? 64,
    subheadingFontSize: img.configuration?.subheadingFontSize ?? 32,
    headingColor: img.configuration?.headingColor ?? '#ffffff',
    subheadingColor: img.configuration?.subheadingColor ?? '#ffffff',
    headingAlign: (img.configuration?.headingAlign as 'left' | 'center' | 'right') ?? 'left',
    subheadingAlign: (img.configuration?.subheadingAlign as 'left' | 'center' | 'right') ?? 'left',
    headingLetterSpacing: img.configuration?.headingLetterSpacing ?? 0,
    subheadingLetterSpacing: img.configuration?.subheadingLetterSpacing ?? 0,
    headingLineHeight: img.configuration?.headingLineHeight ?? 1.2,
    subheadingLineHeight: img.configuration?.subheadingLineHeight ?? 1.2,
    fontFamily: img.configuration?.headingFont ?? 'Inter',
    theme: img.configuration?.theme ?? 'light',
    textInstances: img.configuration?.textInstances ?? undefined,
  };
}

/**
 * Convert new screenshot to legacy format for API compatibility
 * (Used when saving to backend until backend is updated)
 */
export function convertToLegacyFormat(
  screenshot: ScreenshotState,
  globalSettings?: GlobalSettings
): ConvertedLegacyScreenshot {
  // Initialize with existing configuration to preserve all fields
  const existingConfig = (screenshot.image.configuration || {}) as Partial<GeneratedImageConfiguration> & Record<string, unknown>;
  
  // Collect element data
  let heading = '';
  let subheading = '';
  const existingHeadingFont = typeof existingConfig.headingFont === 'string' && existingConfig.headingFont
    ? existingConfig.headingFont
    : 'Inter';
  const existingSubheadingFont = typeof existingConfig.subheadingFont === 'string' && existingConfig.subheadingFont
    ? existingConfig.subheadingFont
    : existingHeadingFont;
  let headingFontFamily = existingHeadingFont;
  let subheadingFontFamily = existingSubheadingFont;
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
  let headingWidth = typeof existingConfig.headingWidth === 'number'
    ? existingConfig.headingWidth
    : DEFAULT_TEXT_WIDTH;
  let subheadingWidth = typeof existingConfig.subheadingWidth === 'number'
    ? existingConfig.subheadingWidth
    : DEFAULT_TEXT_WIDTH;
  let headingX = 100;
  let headingY = 100;
  let subheadingX = 100;
  let subheadingY = 200;
  let mockupX = 0;
  let mockupY = 0;
  let mockupScale = 1;
  let mockupRotation = 0;
  
  const visuals: LegacyVisualConfiguration[] = [];
  let hasHeading = false;
  let hasSubheading = false;
  let hasMockup = false;

  const textElements: TextElement[] = [];
  let headingElementRef: TextElement | null = null;
  let subheadingElementRef: TextElement | null = null;

  screenshot.elements.forEach(element => {
    if (element.kind === 'text') {
      textElements.push(element);
      const weight = element.fontWeight ?? (element.isBold ? 700 : 400);
      const isHeadingCandidate = weight >= 600;

      if (isHeadingCandidate && !hasHeading) {
        heading = element.text;
        headingX = element.position.x;
        headingY = element.position.y;
        headingFontSize = element.fontSize;
        if (element.fontFamily) {
          headingFontFamily = element.fontFamily;
        }
        headingColor = element.color;
        headingAlign = element.align;
        headingLetterSpacing = element.letterSpacing;
        headingLineHeight = element.lineHeight;
        if (typeof element.width === 'number') {
          headingWidth = element.width;
        }
        headingElementRef = element;
        hasHeading = true;
      } else if (!isHeadingCandidate && !hasSubheading) {
        subheading = element.text;
        subheadingX = element.position.x;
        subheadingY = element.position.y;
        subheadingFontSize = element.fontSize;
        if (element.fontFamily) {
          subheadingFontFamily = element.fontFamily;
        }
        subheadingColor = element.color;
        subheadingAlign = element.align;
        subheadingLetterSpacing = element.letterSpacing;
        subheadingLineHeight = element.lineHeight;
        if (typeof element.width === 'number') {
          subheadingWidth = element.width;
        }
        subheadingElementRef = element;
        hasSubheading = true;
      }
    } else if (element.kind === 'mockup') {
      // Use first mockup as primary
      if (!hasMockup) {
        mockupX = element.position.x;
        mockupY = element.position.y;
        mockupScale = element.scale;
        mockupRotation = element.rotation;
        hasMockup = true;
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

  if (!hasHeading && textElements.length > 0) {
    const fallback = textElements[0];
    heading = fallback.text;
    headingX = fallback.position.x;
    headingY = fallback.position.y;
    headingFontSize = fallback.fontSize;
    headingFontFamily = fallback.fontFamily || headingFontFamily;
    headingColor = fallback.color;
    headingAlign = fallback.align;
    headingLetterSpacing = fallback.letterSpacing;
    headingLineHeight = fallback.lineHeight;
  headingWidth = typeof fallback.width === 'number' ? fallback.width : headingWidth;
    headingElementRef = fallback;
    hasHeading = true;
  }

  if (!hasSubheading) {
    const fallback = textElements.find(el => el.id !== headingElementRef?.id);
    if (fallback) {
      subheading = fallback.text;
      subheadingX = fallback.position.x;
      subheadingY = fallback.position.y;
      subheadingFontSize = fallback.fontSize;
      subheadingFontFamily = fallback.fontFamily || subheadingFontFamily;
      subheadingColor = fallback.color;
      subheadingAlign = fallback.align;
      subheadingLetterSpacing = fallback.letterSpacing;
      subheadingLineHeight = fallback.lineHeight;
  subheadingWidth = typeof fallback.width === 'number' ? fallback.width : subheadingWidth;
      subheadingElementRef = fallback;
      hasSubheading = true;
    }
  }

  const textInstances = textElements.map((element) => {
    const weight = element.fontWeight ?? (element.isBold ? 700 : 400);
    let inferredType: 'heading' | 'subheading' | 'text' = 'text';

    if (headingElementRef && element.id === headingElementRef.id) {
      inferredType = 'heading';
    } else if (subheadingElementRef && element.id === subheadingElementRef.id) {
      inferredType = 'subheading';
    } else if (weight >= 600) {
      inferredType = 'heading';
    } else {
      inferredType = 'subheading';
    }

    return {
      id: element.id,
      type: inferredType,
      text: element.text,
      position: { ...element.position },
      fontSize: element.fontSize,
      color: element.color,
      align: element.align,
      letterSpacing: element.letterSpacing,
      lineHeight: element.lineHeight,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      isBold: element.isBold,
      width: element.width,
      rotation: element.rotation,
      zIndex: element.zIndex,
    };
  });

  // Build complete configuration object with all fields
  const configuration = {
    // Preserve existing fields
    ...existingConfig,
    
    // Update with current element data
    heading,
    subheading,
    headingFont: headingFontFamily,
    subheadingFont: subheadingFontFamily,
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
    headingWidth,
    subheadingWidth,
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
    textInstances,
  } as GeneratedImageConfiguration;

  if (globalSettings) {
    configuration.backgroundType = globalSettings.backgroundType;
    configuration.backgroundGradient = globalSettings.backgroundGradient;
    configuration.backgroundSolid = globalSettings.backgroundSolid;
    configuration.backgroundImage = globalSettings.backgroundImage;
    configuration.deviceFrame = globalSettings.deviceFrame;
  }

  return {
    id: screenshot.id,
    image: {
      ...screenshot.image,
      configuration,
    },
  };
}
