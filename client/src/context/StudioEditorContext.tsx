/**
 * Studio Editor Context - Refactored Version
 * 
 * Clean implementation using unified element model
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { GeneratedImage } from '@/types/project';
import { useAuth } from './AuthContext';
import { useSelection } from './studio-editor/useSelectionNew';
import { useTransform } from './studio-editor/useTransform';
import { useView } from './studio-editor/useView';
import { useGlobalSettings } from './studio-editor/useGlobalSettings';
import { useElementManagement } from './studio-editor/useElementManagement';
import { toast } from 'sonner';
import { migrateLegacyScreenshots, migrateLegacyScreenshot, convertToLegacyFormat, generatedImageToLegacyData } from './studio-editor/migration';
import type {
  ScreenshotState,
  ViewState,
  GlobalSettings,
  Visual,
  StudioEditorContextType,
  AiGenerationStyle,
  ScreenshotAiStatus,
} from './studio-editor/types';
import type { CanvasElement } from './studio-editor/elementTypes';
import { isMockupElement, isTextElement } from './studio-editor/elementTypes';
import { DEFAULT_DEVICE_PRESET_ID } from '@/constants/devicePresets';

const StudioEditorContext = createContext<StudioEditorContextType | undefined>(undefined);

interface StudioEditorProviderProps {
  children: ReactNode;
  initialScreenshots: GeneratedImage[];
  projectId: string;
  deviceFrame?: string;
  appName: string;
  appDescription: string;
}

export function StudioEditorProvider({ 
  children, 
  initialScreenshots,
  projectId,
  deviceFrame = DEFAULT_DEVICE_PRESET_ID,
  appName,
  appDescription,
}: StudioEditorProviderProps) {
  const { session } = useAuth();
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialRenderRef = useRef(true);
  const dirtyScreenshotIdsRef = useRef<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  // ============================================================================
  // Initialize Screenshots with Migration
  // ============================================================================
  
  const [screenshots, setScreenshots] = useState<ScreenshotState[]>(() => {
    const legacyData = initialScreenshots.map((img, index) => generatedImageToLegacyData(img, index));
    return migrateLegacyScreenshots(legacyData);
  });

  const markScreenshotDirty = useCallback((screenshotId: string | null | undefined) => {
    if (!screenshotId) return;
    dirtyScreenshotIdsRef.current.add(screenshotId);
  }, []);

  const markAllScreenshotsDirty = useCallback(() => {
    screenshots.forEach(screenshot => {
      dirtyScreenshotIdsRef.current.add(screenshot.id);
    });
  }, [screenshots]);

  // ============================================================================
  // Initialize Other State
  // ============================================================================

  const [view, setView] = useState<ViewState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const [global, setGlobal] = useState<GlobalSettings>(() => {
    const firstImage = initialScreenshots[0];
    const config = firstImage?.configuration;
    
    return {
      backgroundType: (config?.backgroundType as 'gradient' | 'solid' | 'image') || 'gradient',
      backgroundGradient: {
        startColor: config?.backgroundGradient?.startColor || '#667eea',
        endColor: config?.backgroundGradient?.endColor || '#764ba2',
        angle: config?.backgroundGradient?.angle ?? 90,
      },
      backgroundSolid: config?.backgroundSolid || '#ffffff',
      backgroundImage: {
        url: config?.backgroundImage?.url || '',
        fit: (config?.backgroundImage?.fit as 'cover' | 'contain' | 'fill' | 'tile') || 'cover',
        opacity: config?.backgroundImage?.opacity ?? 1,
      },
      deviceFrame: deviceFrame || config?.deviceFrame || DEFAULT_DEVICE_PRESET_ID,
      showDeviceFrame: true,
    };
  });

  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [appContext, setAppContext] = useState({ appName, appDescription });
  const [aiGenerationStatus, setAiGenerationStatus] = useState<Record<string, ScreenshotAiStatus>>({});

  useEffect(() => {
    setAppContext({ appName, appDescription });
  }, [appName, appDescription]);

  // ============================================================================
  // Initialize Hooks
  // ============================================================================

  const selectionHooks = useSelection();
  const { selection } = selectionHooks;
  const transformHooks = useTransform(setScreenshots, markScreenshotDirty);
  const viewHooks = useView(setView);
  const globalHooks = useGlobalSettings(setGlobal, markAllScreenshotsDirty);
  const elementHooks = useElementManagement(
    screenshots,
    setScreenshots,
    selectionHooks.clearSelection,
    markScreenshotDirty
  );

  useEffect(() => {
    const normalizedFrame = deviceFrame || DEFAULT_DEVICE_PRESET_ID;
    let didUpdate = false;

    setGlobal(prev => {
      if (prev.deviceFrame === normalizedFrame) {
        return prev;
      }

      didUpdate = true;
      return { ...prev, deviceFrame: normalizedFrame };
    });

    if (didUpdate) {
      markAllScreenshotsDirty();
    }
  }, [deviceFrame, markAllScreenshotsDirty]);

  // ============================================================================
  // Auto-Save Logic
  // ============================================================================

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounced auto-save (2 seconds)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!session?.access_token) return;

      const dirtyIds = Array.from(dirtyScreenshotIdsRef.current);
      if (dirtyIds.length === 0) {
        return;
      }

      const dirtySet = new Set(dirtyIds);
      const screenshotsToSave = screenshots.filter(screenshot => dirtySet.has(screenshot.id));

      if (screenshotsToSave.length === 0) {
        dirtyIds.forEach(id => dirtyScreenshotIdsRef.current.delete(id));
        return;
      }

      setIsSaving(true);
      
      try {
        // Save each screenshot
        for (const screenshot of screenshotsToSave) {
          // Convert to legacy format for API compatibility
          const legacyData = convertToLegacyFormat(screenshot, global);
          
          console.log('Auto-save: Saving screenshot', screenshot.id, {
            numElements: screenshot.elements.length,
            configuration: legacyData.image.configuration
          });
          
          const response = await fetch(
            `http://localhost:3001/api/projects/${projectId}/images/${screenshot.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                configuration: legacyData.image.configuration,
              }),
            }
          );
          
          if (!response.ok) {
            console.error('Auto-save failed for screenshot', screenshot.id, await response.text());
          } else {
            console.log('Auto-save successful for screenshot', screenshot.id);
            dirtyScreenshotIdsRef.current.delete(screenshot.id);
          }
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [screenshots, global, session, projectId]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getSelectedElement = useCallback((): CanvasElement | null => {
    const { screenshotIndex, elementId } = selection;
    if (screenshotIndex === null || elementId === null) return null;
    
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) return null;
    
    return screenshot.elements.find(el => el.id === elementId) || null;
  }, [selection, screenshots]);

  const getSelectedElements = useCallback((): CanvasElement[] => {
    const { screenshotIndex, selectedElementIds } = selection;
    if (screenshotIndex === null || selectedElementIds.length === 0) {
      return [];
    }

    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) {
      return [];
    }

    const selectedSet = new Set(selectedElementIds);
    return (screenshot.elements || []).filter(el => selectedSet.has(el.id));
  }, [selection, screenshots]);

  const getSelectedScreenshot = useCallback((): ScreenshotState | null => {
    const { screenshotIndex } = selection;
    if (screenshotIndex === null) return null;
    return screenshots[screenshotIndex] || null;
  }, [selection, screenshots]);

  const getElementsByKind = useCallback((
    screenshotIndex: number,
    kind: 'text' | 'mockup' | 'visual'
  ): CanvasElement[] => {
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) return [];
    
    return screenshot.elements.filter(el => el.kind === kind);
  }, [screenshots]);

  // ============================================================================
  // Screenshot Management
  // ============================================================================

  const addScreenshot = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    if (screenshots.length >= 10) {
      toast.error('Maximum images reached', {
        description: 'You can have up to 10 App Store images per project.',
      });
      return;
    }

    const displayOrder = screenshots.length;

    try {
      const response = await fetch(
        `http://localhost:3001/api/projects/${projectId}/images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ displayOrder }),
        }
      );

      if (!response.ok) {
        let message = 'Failed to add image';
        try {
          const errorBody = await response.json();
          message = errorBody?.error || errorBody?.message || message;
        } catch (error) {
          console.warn('addScreenshot: Could not parse error response', error);
        }

        toast.error('Failed to add image', { description: message });
        throw new Error(message);
      }

      const newImage: GeneratedImage = await response.json();

      const legacyData = generatedImageToLegacyData(newImage, displayOrder);
      const migratedScreenshot = migrateLegacyScreenshot(legacyData);

      setScreenshots(prev => [...prev, migratedScreenshot]);
      selectionHooks.selectElement(displayOrder, null);

      toast.success('App Store image added', {
        description: 'A placeholder image has been created and selected.',
      });
    } catch (error) {
      console.error('addScreenshot: Error adding image', error);
      throw error;
    }
  }, [session, screenshots, projectId, selectionHooks]);

  const removeScreenshot = useCallback(async (index: number) => {
    if (!session?.access_token) {
      console.error('removeScreenshot: No session available');
      toast.error('Authentication required');
      return;
    }

    if (screenshots.length <= 1) {
      toast.error('Cannot delete last image', {
        description: 'At least one App Store image is required.',
      });
      return;
    }

    const screenshot = screenshots[index];
    if (!screenshot) {
      toast.error('Screenshot not found');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/projects/${projectId}/images/${screenshot.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.error || errorBody.message || 'Failed to delete image';

        if (response.status === 400 && message.toLowerCase().includes('last app store image')) {
          toast.error('Cannot delete last image', {
            description: 'At least one App Store image is required.',
          });
          return;
        }

        throw new Error(message);
      }

      setScreenshots(prev => prev.filter((_, i) => i !== index));

      // Update selection state
      const currentSelection = selectionHooks.selection;
      if (currentSelection.screenshotIndex === index) {
        selectionHooks.clearSelection();
      } else if (
        currentSelection.screenshotIndex !== null &&
        currentSelection.screenshotIndex > index
      ) {
        selectionHooks.selectElement(currentSelection.screenshotIndex - 1, null);
      }

      toast.success('Image deleted', {
        description: `App Store image #${index + 1} has been removed.`,
      });
    } catch (error) {
      console.error('removeScreenshot: Error deleting image', error);
      toast.error('Failed to delete image', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      throw error;
    }
  }, [session, screenshots, projectId, selectionHooks]);

  const reorderScreenshots = useCallback(async (fromIndex: number, toIndex: number) => {
    console.warn('reorderScreenshots not yet implemented', { fromIndex, toIndex });
  }, []);

  const replaceScreenshotImage = useCallback(async (screenshotIndex: number, file: File) => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return null;
    }

    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) {
      toast.error('Screenshot not found');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('screenshot', file);

      const response = await fetch(
        `http://localhost:3001/api/projects/${projectId}/images/${screenshot.id}/replace-screenshot`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let message = 'Failed to replace screenshot';
        try {
          const errorBody = await response.json();
          message = errorBody?.error || errorBody?.message || message;
        } catch (error) {
          console.warn('replaceScreenshotImage: Could not parse error response', error);
        }

        toast.error('Failed to replace screenshot', {
          description: message,
        });
        return null;
      }

      const data = await response.json();
      const newUrl: string | undefined = data?.sourceScreenshotUrl;

      if (!newUrl) {
        toast.error('Failed to replace screenshot', {
          description: 'No image URL returned from server.',
        });
        return null;
      }

      setScreenshots(prev => prev.map((s, idx) => {
        if (idx !== screenshotIndex) {
          return s;
        }

        const updatedElements = (s.elements || []).map(element => {
          if (isMockupElement(element)) {
            return {
              ...element,
              sourceScreenshotUrl: newUrl,
            };
          }
          return element;
        });

        let updatedConfiguration = s.image.configuration;
        if (s.image.configuration) {
          const config = s.image.configuration;
          const updatedMockups = Array.isArray(config.mockupInstances)
            ? config.mockupInstances.map(instance => ({
                ...instance,
                sourceScreenshotUrl: newUrl,
              }))
            : config.mockupInstances;

          updatedConfiguration = {
            ...config,
            mockupInstances: updatedMockups,
          } as typeof config;
        }

        return {
          ...s,
          image: {
            ...s.image,
            sourceScreenshotUrl: newUrl,
            configuration: updatedConfiguration,
          },
          elements: updatedElements,
        };
      }));

      toast.success('Screenshot replaced', {
        description: 'Your mockup now uses the updated screenshot.',
      });

      return newUrl;
    } catch (error) {
      console.error('replaceScreenshotImage: Error replacing screenshot', error);
      toast.error('Failed to replace screenshot', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      return null;
    }
  }, [session, screenshots, projectId]);

  // ============================================================================
  // Visual Library Management
  // ============================================================================

  const loadVisuals = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('http://localhost:3001/api/visuals', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.visuals)
          ? data.visuals
          : [];

        setVisuals(normalized);
      }
    } catch (error) {
      console.error('Error loading visuals:', error);
    }
  }, [session]);

  const uploadVisual = useCallback(async (file: File) => {
    if (!session?.access_token) {
      console.error('No session available for visual upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', file.name);
      formData.append('category', 'custom');

      const response = await fetch('http://localhost:3001/api/visuals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload visual');
      }

      const newVisual = await response.json();
      setVisuals(prev => [newVisual, ...prev]);
      
      console.log('Visual uploaded successfully:', newVisual);
    } catch (error) {
      console.error('Error uploading visual:', error);
      throw error;
    }
  }, [session]);

  const deleteVisual = useCallback(async (visualId: string) => {
    if (!session?.access_token) {
      console.error('No session available for visual deletion');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/visuals/${visualId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete visual');
      }

      setVisuals(prev => prev.filter(v => v.id !== visualId));
      
      console.log('Visual deleted successfully:', visualId);
    } catch (error) {
      console.error('Error deleting visual:', error);
      throw error;
    }
  }, [session]);

  // ============================================================================
  // Font & Theme Management
  // ============================================================================

  const updateDefaultFont = useCallback((screenshotIndex: number, fontFamily: string) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex ? { ...s, fontFamily } : s
    ));
  }, []);

  const updateTheme = useCallback((screenshotIndex: number, theme: string) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex ? { ...s, theme } : s
    ));
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const generateScreenshotText = useCallback(async (screenshotIndex: number, style: AiGenerationStyle) => {
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) {
      toast.error('Screenshot not found');
      return;
    }

    const screenshotId = screenshot.id;
    const textElements = (screenshot.elements || []).filter(isTextElement);

    if (textElements.length === 0) {
      toast.error('Add a heading or subheading layer before using AI.');
      return;
    }

  type TextEl = (typeof textElements)[number];

  const getWeight = (el: TextEl) => el.fontWeight ?? (el.isBold ? 700 : 400);
    const isPlaceholder = (text: string | undefined) => {
      if (!text) return true;
      const trimmed = text.trim().toLowerCase();
      return trimmed === '' || trimmed === 'tap to edit';
    };

    const selectedTextElement = selection.screenshotIndex === screenshotIndex
      ? textElements.find((el) => el.id === selection.elementId)
      : null;

    const pickElement = (
      candidates: TextEl[],
      fallback?: TextEl | null
    ) => {
      if (!candidates.length) {
        return fallback ?? null;
      }

      if (fallback && candidates.some(el => el.id === fallback.id)) {
        return fallback;
      }

      const placeholder = candidates.find(el => isPlaceholder(el.text));
      if (placeholder) {
        return placeholder;
      }

      return candidates[candidates.length - 1];
    };

  let headingCandidates = textElements.filter(el => getWeight(el) >= 600);
  const subheadingCandidates = textElements.filter(el => getWeight(el) < 600);

    if (!headingCandidates.length && textElements.length) {
      headingCandidates = [textElements[0]];
    }

    let headingElement = pickElement(
      headingCandidates,
      selectedTextElement && getWeight(selectedTextElement) >= 600 ? selectedTextElement : null
    );

    let filteredSubheadingCandidates = subheadingCandidates.filter(el => el.id !== headingElement?.id);
    if (!filteredSubheadingCandidates.length) {
      filteredSubheadingCandidates = textElements.filter(el => el.id !== headingElement?.id);
    }

    let subheadingElement = pickElement(
      filteredSubheadingCandidates,
      selectedTextElement && getWeight(selectedTextElement) < 600 ? selectedTextElement : null
    );

    if (!headingElement && textElements.length) {
      headingElement = textElements[0];
    }

    if (!subheadingElement && textElements.length > 1) {
      const alternative = textElements.find(el => el.id !== headingElement?.id);
      if (alternative) {
        subheadingElement = alternative;
      }
    }

  const imageUrl = screenshot.image.sourceScreenshotUrl;
    if (!imageUrl) {
      toast.error('Screenshot image unavailable for AI generation.');
      return;
    }

    const trimmedAppName = appContext.appName?.trim();
    const trimmedAppDescription = appContext.appDescription?.trim();

    if (!trimmedAppName || !trimmedAppDescription) {
      toast.error('Provide app name and description to generate copy.');
      return;
    }

    setAiGenerationStatus((prev) => ({
      ...prev,
      [screenshotId]: { status: 'loading', style },
    }));

    const toastId = toast.loading(`Generating ${style === 'concise' ? 'concise' : 'detailed'} copy...`);

    try {
      const screenshotResponse = await fetch(imageUrl);
      if (!screenshotResponse.ok) {
        throw new Error('Unable to download screenshot for AI processing.');
      }

      const screenshotBlob = await screenshotResponse.blob();
      const formData = new FormData();
      formData.append('image', screenshotBlob, 'screenshot.png');
      formData.append('appName', trimmedAppName);
      formData.append('appDescription', trimmedAppDescription);
      formData.append('currentHeading', headingElement?.text ?? '');
      formData.append('currentSubheading', subheadingElement?.text ?? '');
      formData.append('style', style);

      const response = await fetch('/api/images/generate-heading-subheading', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'AI service failed to generate copy.');
      }

      const result = await response.json();
      const nextHeading = typeof result.heading === 'string' ? result.heading : headingElement?.text;
      const nextSubheading = typeof result.subheading === 'string' ? result.subheading : subheadingElement?.text;

      setScreenshots((prev) => prev.map((s, idx) => {
        if (idx !== screenshotIndex) {
          return s;
        }

        const updatedElements = (s.elements || []).map((el) => {
          if (headingElement && el.id === headingElement.id && nextHeading !== undefined) {
            return { ...el, text: nextHeading ?? '' };
          }
          if (subheadingElement && el.id === subheadingElement.id && nextSubheading !== undefined) {
            return { ...el, text: nextSubheading ?? '' };
          }
          return el;
        });

        const updatedConfiguration = {
          ...(s.image.configuration ?? {}),
          ...(nextHeading !== undefined ? { heading: nextHeading } : {}),
          ...(nextSubheading !== undefined ? { subheading: nextSubheading } : {}),
        };

        return {
          ...s,
          elements: updatedElements,
          image: {
            ...s.image,
            configuration: updatedConfiguration,
          },
        };
      }));

      markScreenshotDirty(screenshotId);

      toast.success('AI copy generated', { id: toastId });
    } catch (error) {
      console.error('generateScreenshotText error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate copy with AI', {
        id: toastId,
      });
    } finally {
      setAiGenerationStatus((prev) => {
        const next = { ...prev };
        delete next[screenshotId];
        return next;
      });
    }
  }, [screenshots, appContext, markScreenshotDirty, selection]);

  const value: StudioEditorContextType = {
    // State
    screenshots,
    view,
    global,
    isSaving,
    visuals,
    projectId,
    appName: appContext.appName,
    appDescription: appContext.appDescription,
    aiGenerationStatus,

    // Selection (spread hooks which includes 'selection' state)
    ...selectionHooks,

    // Elements
    ...elementHooks,
    generateScreenshotText,

    // Transform
    ...transformHooks,

    // Screenshot Management
    addScreenshot,
    removeScreenshot,
    reorderScreenshots,
    replaceScreenshotImage,

    // View
    ...viewHooks,

    // Global Settings
    ...globalHooks,
    updateDefaultFont,
    updateTheme,

    // Visual Library
    loadVisuals,
    uploadVisual,
    deleteVisual,

    // Utilities
    getSelectedElement,
    getSelectedScreenshot,
    getSelectedElements,
    getElementsByKind,
  };

  // Load visuals on mount
  useEffect(() => {
    loadVisuals();
  }, [loadVisuals]);

  return (
    <StudioEditorContext.Provider value={value}>
      {children}
    </StudioEditorContext.Provider>
  );
}

export function useStudioEditor() {
  const context = useContext(StudioEditorContext);
  if (context === undefined) {
    throw new Error('useStudioEditor must be used within a StudioEditorProvider');
  }
  return context;
}

export { StudioEditorContext };
export type { ScreenshotState } from './studio-editor/types';
