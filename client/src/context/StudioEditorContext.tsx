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
import { migrateLegacyScreenshots, convertToLegacyFormat } from './studio-editor/migration';
import type {
  ScreenshotState,
  ViewState,
  GlobalSettings,
  Visual,
  StudioEditorContextType,
} from './studio-editor/types';
import type { CanvasElement } from './studio-editor/elementTypes';

const StudioEditorContext = createContext<StudioEditorContextType | undefined>(undefined);

interface StudioEditorProviderProps {
  children: ReactNode;
  initialScreenshots: GeneratedImage[];
  projectId: string;
  deviceFrame?: string;
}

export function StudioEditorProvider({ 
  children, 
  initialScreenshots,
  projectId,
  deviceFrame = 'iPhone 15 Pro'
}: StudioEditorProviderProps) {
  const { session } = useAuth();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // ============================================================================
  // Initialize Screenshots with Migration
  // ============================================================================
  
  const [screenshots, setScreenshots] = useState<ScreenshotState[]>(() => {
    // Convert GeneratedImage[] to legacy format first
    const legacyData = initialScreenshots.map((img, index) => ({
      id: img.id || `screenshot-${index}`,
      image: img,
      heading: img.configuration?.heading ?? '',
      subheading: img.configuration?.subheading ?? '',
      mockupPosition: { 
        x: img.configuration?.mockupX ?? 0, 
        y: img.configuration?.mockupY ?? 0 
      },
      mockupScale: img.configuration?.mockupScale ?? 1,
      mockupRotation: img.configuration?.mockupRotation ?? 0,
      headingPosition: { 
        x: img.configuration?.headingX ?? 100, 
        y: img.configuration?.headingY ?? 100 
      },
      subheadingPosition: { 
        x: img.configuration?.subheadingX ?? 100, 
        y: img.configuration?.subheadingY ?? 200 
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
    }));
    
    // Migrate to new unified format
    return migrateLegacyScreenshots(legacyData);
  });

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
      deviceFrame,
      showDeviceFrame: true,
    };
  });

  const [visuals, setVisuals] = useState<Visual[]>([]);

  // ============================================================================
  // Initialize Hooks
  // ============================================================================

  const selectionHooks = useSelection();
  const transformHooks = useTransform(setScreenshots);
  const viewHooks = useView(setView);
  const globalHooks = useGlobalSettings(setGlobal);
  const elementHooks = useElementManagement(
    screenshots,
    setScreenshots,
    selectionHooks.clearSelection
  );

  // ============================================================================
  // Auto-Save Logic
  // ============================================================================

  useEffect(() => {
    // Skip auto-save on initial mount
    if (autoSaveTimeoutRef.current === undefined) {
      autoSaveTimeoutRef.current = null as any;
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounced auto-save (2 seconds)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!session?.access_token) return;

      setIsSaving(true);
      
      try {
        // Save each screenshot
        for (const screenshot of screenshots) {
          // Convert to legacy format for API compatibility
          const legacyData = convertToLegacyFormat(screenshot);
          
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
  }, [screenshots, session, projectId]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getSelectedElement = useCallback((): CanvasElement | null => {
    const { screenshotIndex, elementId } = selectionHooks.selection;
    if (screenshotIndex === null || elementId === null) return null;
    
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) return null;
    
    return screenshot.elements.find(el => el.id === elementId) || null;
  }, [selectionHooks.selection.screenshotIndex, selectionHooks.selection.elementId, screenshots]);

  const getSelectedScreenshot = useCallback((): ScreenshotState | null => {
    const { screenshotIndex } = selectionHooks.selection;
    if (screenshotIndex === null) return null;
    return screenshots[screenshotIndex] || null;
  }, [selectionHooks.selection.screenshotIndex, screenshots]);

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
    // TODO: Implement when needed
    console.warn('addScreenshot not yet implemented');
  }, []);

  const removeScreenshot = useCallback(async (_index: number) => {
    // TODO: Implement when needed
    console.warn('removeScreenshot not yet implemented');
  }, []);

  const reorderScreenshots = useCallback(async (_fromIndex: number, _toIndex: number) => {
    // TODO: Implement when needed
    console.warn('reorderScreenshots not yet implemented');
  }, []);

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
        setVisuals(data.visuals || []);
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

  const value: StudioEditorContextType = {
    // State
    screenshots,
    view,
    global,
    isSaving,
    visuals,
    projectId,

    // Selection (spread hooks which includes 'selection' state)
    ...selectionHooks,

    // Elements
    ...elementHooks,

    // Transform
    ...transformHooks,

    // Screenshot Management
    addScreenshot,
    removeScreenshot,
    reorderScreenshots,

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
