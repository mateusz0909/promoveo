import type { GeneratedImage, GeneratedImageConfiguration } from '@/types/project';
import type { CanvasElement } from './elementTypes';

// ============================================================================
// Screenshot State
// ============================================================================

export interface ScreenshotState {
  id: string;
  image: GeneratedImage;
  elements: CanvasElement[];  // Unified array of all canvas elements
  fontFamily: string;          // Default font for new text elements
  theme: string;               // Color theme
}

// ============================================================================
// Selection State
// ============================================================================

export interface SelectionState {
  screenshotIndex: number | null;
  elementId: string | null;     // ID of selected element
  selectedElementIds: string[]; // Currently single-selection, kept array for future compatibility
  isEditing: boolean;            // Whether text is being edited inline
}

// ============================================================================
// View State
// ============================================================================

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

// ============================================================================
// Global Settings
// ============================================================================

export interface GlobalSettings {
  backgroundType: 'gradient' | 'solid' | 'image';
  backgroundGradient: {
    startColor: string;
    endColor: string;
    angle: number;
  };
  backgroundSolid: string;
  backgroundImage: {
    url: string;
    fit: 'cover' | 'contain' | 'fill' | 'tile';
    opacity: number;
  };
  deviceFrame: string; // 'iPhone 15 Pro', 'iPad Pro 13', etc.
  showDeviceFrame: boolean;
}

// ============================================================================
// Visual Library
// ============================================================================

export interface Visual {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt?: string;
}

// ============================================================================
// Context Type
// ============================================================================

export type AiGenerationStyle = 'concise' | 'detailed';

export interface ScreenshotAiStatus {
  status: 'idle' | 'loading';
  style?: AiGenerationStyle;
}

export interface StudioEditorContextType {
  // State
  screenshots: ScreenshotState[];
  selection: SelectionState;
  view: ViewState;
  global: GlobalSettings;
  isSaving: boolean;
  visuals: Visual[];
  projectId: string;
  appName: string;
  appDescription: string;
  aiGenerationStatus: Record<string, ScreenshotAiStatus>;
  
  // Selection Actions
  selectElement: (screenshotIndex: number, elementId: string | null) => void;
  clearSelection: () => void;
  startEditing: () => void;
  stopEditing: () => void;
  
  // Element CRUD
  addElement: (screenshotIndex: number, element: CanvasElement) => Promise<void>;
  updateElement: (screenshotIndex: number, elementId: string, updates: Partial<CanvasElement>) => Promise<void>;
  deleteElement: (screenshotIndex: number, elementId: string) => Promise<void>;
  duplicateElement: (screenshotIndex: number, elementId: string) => Promise<void>;
  generateScreenshotText: (screenshotIndex: number, style: AiGenerationStyle) => Promise<void>;
  
  // Transform Operations
  updateElementPosition: (screenshotIndex: number, elementId: string, position: { x: number; y: number }) => void;
  updateElementScale: (screenshotIndex: number, elementId: string, scale: number) => void;
  updateElementRotation: (screenshotIndex: number, elementId: string, rotation: number) => void;
  updateTextWidth: (screenshotIndex: number, elementId: string, width: number) => void;
  updateElementZIndex: (screenshotIndex: number, elementId: string, zIndex: number) => void;
  
  // Screenshot Management
  addScreenshot: () => Promise<void>;
  removeScreenshot: (index: number) => Promise<void>;
  reorderScreenshots: (fromIndex: number, toIndex: number) => Promise<void>;
  replaceScreenshotImage: (screenshotIndex: number, file: File) => Promise<string | null>;
  
  // View Actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  
  // Global Settings
  updateBackground: (settings: Partial<GlobalSettings>) => void;
  updateDeviceFrame: (device: string) => void;
  updateDefaultFont: (screenshotIndex: number, fontFamily: string) => void;
  updateTheme: (screenshotIndex: number, theme: string) => void;
  
  // Visual Library
  loadVisuals: () => Promise<void>;
  uploadVisual: (file: File) => Promise<void>;
  deleteVisual: (visualId: string) => Promise<void>;
  
  // Utilities
  getSelectedElement: () => CanvasElement | null;
  getSelectedElements: () => CanvasElement[];
  getSelectedScreenshot: () => ScreenshotState | null;
  getElementsByKind: (screenshotIndex: number, kind: 'text' | 'mockup' | 'visual') => CanvasElement[];
}

// ============================================================================
// Legacy Types (for migration)
// ============================================================================

export interface LegacyScreenshotData {
  id: string;
  image: GeneratedImage;
  heading: string;
  subheading: string;
  headingWidth?: number;
  subheadingWidth?: number;
  mockupPosition: { x: number; y: number };
  mockupScale: number;
  mockupRotation: number;
  headingPosition: { x: number; y: number };
  subheadingPosition: { x: number; y: number };
  headingFontSize: number;
  subheadingFontSize: number;
  headingColor: string;
  subheadingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  subheadingAlign: 'left' | 'center' | 'right';
  headingLetterSpacing: number;
  subheadingLetterSpacing: number;
  headingLineHeight: number;
  subheadingLineHeight: number;
  fontFamily: string;
  theme: string;
  textInstances?: GeneratedImageConfiguration['textInstances'];
}
