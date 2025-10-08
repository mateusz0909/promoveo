/**
 * Unified Element Type System for Studio Editor
 * 
 * This file defines the core element types used throughout the editor.
 * All canvas elements (text, mockups, visuals) follow this unified model.
 */

import { resolveDevicePreset } from '@/constants/devicePresets';

// ============================================================================
// Base Types
// ============================================================================

export type ElementKind = 'text' | 'mockup' | 'visual';

export interface Position {
  x: number;
  y: number;
}

export interface Transform {
  position: Position;
  scale: number;
  rotation: number;
}

// ============================================================================
// Element Definitions
// ============================================================================

/**
 * Base interface for all canvas elements
 */
export interface BaseElement {
  id: string;              // Format: '{kind}-{timestamp}-{random}'
  kind: ElementKind;
  position: Position;
  scale: number;
  rotation: number;
  zIndex: number;          // Determines rendering order (higher = on top)
}

/**
 * Text element - headings, subheadings, body text
 */
export interface TextElement extends BaseElement {
  kind: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  fontWeight: 300 | 400 | 500 | 600 | 700 | number;
  isBold: boolean;
  width?: number;          // Optional text frame width (for wrapping)
}

/**
 * Mockup element - device frames with screenshots
 */
export interface MockupElement extends BaseElement {
  kind: 'mockup';
  sourceScreenshotUrl: string;
  frameType: string;       // 'iphone-15', 'ipad-pro', etc.
  baseWidth: number;       // Base frame width (before scaling)
  baseHeight: number;      // Base frame height (before scaling)
}

/**
 * Visual element - custom images, icons, shapes
 */
export interface VisualElement extends BaseElement {
  kind: 'visual';
  imageUrl: string;
  name: string;
  width: number;           // Original image width
  height: number;          // Original image height
  opacity: number;         // 0-1
}

/**
 * Union type of all element types
 */
export type CanvasElement = TextElement | MockupElement | VisualElement;

// ============================================================================
// Type Guards
// ============================================================================

export function isTextElement(element: CanvasElement): element is TextElement {
  return element.kind === 'text';
}

export function isMockupElement(element: CanvasElement): element is MockupElement {
  return element.kind === 'mockup';
}

export function isVisualElement(element: CanvasElement): element is VisualElement {
  return element.kind === 'visual';
}

export function getElementKind(elementId: string): ElementKind | null {
  if (elementId.startsWith('text-')) return 'text';
  if (elementId.startsWith('mockup-')) return 'mockup';
  if (elementId.startsWith('visual-')) return 'visual';
  return null;
}

// ============================================================================
// Element Factory Functions
// ============================================================================

/**
 * Generate a unique element ID
 */
function generateElementId(kind: ElementKind): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${kind}-${timestamp}-${random}`;
}

/**
 * Create a new text element with default properties
 */
export function createTextElement(
  text: string,
  position: Position,
  options: Partial<Omit<TextElement, 'id' | 'kind' | 'position'>> = {}
): TextElement {
  const requestedFontWeight = options.fontWeight ?? (options.isBold ? 700 : 400);
  const resolvedIsBold = options.isBold ?? (typeof requestedFontWeight === 'number' ? requestedFontWeight >= 600 : requestedFontWeight === 'bold');

  return {
    id: generateElementId('text'),
    kind: 'text',
    position,
    scale: 1,
    rotation: 0,
    zIndex: 0,
    text,
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#ffffff',
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    ...options,
    fontWeight: requestedFontWeight,
    isBold: resolvedIsBold,
  };
}

/**
 * Create a new mockup element with default properties
 */
export function createMockupElement(
  sourceScreenshotUrl: string,
  frameType: string,
  position: Position,
  options: Partial<Omit<MockupElement, 'id' | 'kind' | 'position' | 'sourceScreenshotUrl' | 'frameType'>> = {}
): MockupElement {
  const preset = resolveDevicePreset(frameType);
  const {
    baseWidth: baseWidthOverride,
    baseHeight: baseHeightOverride,
    scale: scaleOverride,
    rotation: rotationOverride,
    zIndex: zIndexOverride,
    ...otherOptions
  } = options;

  const baseWidth = baseWidthOverride ?? preset.mockup.baseWidth;
  const baseHeight = baseHeightOverride ?? preset.mockup.baseHeight;
  const scale = scaleOverride ?? preset.mockup.defaultScale;

  return {
    id: generateElementId('mockup'),
    kind: 'mockup',
    position,
    scale,
    rotation: rotationOverride ?? 0,
    zIndex: zIndexOverride ?? 0,
    sourceScreenshotUrl,
    frameType: preset.id,
    baseWidth,
    baseHeight,
    ...otherOptions,
  };
}

/**
 * Create a new visual element with default properties
 */
export function createVisualElement(
  imageUrl: string,
  name: string,
  width: number,
  height: number,
  position: Position,
  options: Partial<Omit<VisualElement, 'id' | 'kind' | 'position' | 'imageUrl' | 'name' | 'width' | 'height'>> = {}
): VisualElement {
  return {
    id: generateElementId('visual'),
    kind: 'visual',
    position,
    scale: 1,
    rotation: 0,
    zIndex: 0,
    imageUrl,
    name,
    width,
    height,
    opacity: 1,
    ...options,
  };
}

// ============================================================================
// Element Utilities
// ============================================================================

/**
 * Calculate the bounding box of an element after transformations
 */
export function getElementBounds(element: CanvasElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let baseWidth: number;
  let baseHeight: number;

  if (isTextElement(element)) {
    // Text bounds need to be calculated dynamically based on content
    // This is a placeholder - actual implementation would measure text
    baseWidth = element.fontSize * element.text.length * 0.6;
    baseHeight = element.fontSize * element.lineHeight;
  } else if (isMockupElement(element)) {
    baseWidth = element.baseWidth;
    baseHeight = element.baseHeight;
  } else if (isVisualElement(element)) {
    baseWidth = element.width;
    baseHeight = element.height;
  } else {
    baseWidth = 100;
    baseHeight = 100;
  }

  const scaledWidth = baseWidth * element.scale;
  const scaledHeight = baseHeight * element.scale;

  return {
    x: element.position.x,
    y: element.position.y,
    width: scaledWidth,
    height: scaledHeight,
  };
}

/**
 * Sort elements by zIndex (lower numbers render first)
 */
export function sortElementsByZIndex(elements: CanvasElement[]): CanvasElement[] {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Clone an element with a new ID
 */
export function cloneElement(element: CanvasElement): CanvasElement {
  const cloned = { ...element };
  cloned.id = generateElementId(element.kind);
  cloned.position = {
    x: element.position.x + 20,
    y: element.position.y + 20,
  };
  return cloned;
}
