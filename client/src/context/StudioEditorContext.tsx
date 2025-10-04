import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { GeneratedImage } from '@/types/project';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Type definitions for editor state
export type ElementType = 'heading' | 'subheading' | 'mockup' | null;

export interface ScreenshotState {
  id: string;
  image: GeneratedImage;
  heading: string;
  subheading: string;
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
}

export interface SelectionItem {
  screenshotIndex: number;
  elementType: 'heading' | 'subheading';
}

export interface SelectionState {
  screenshotIndex: number | null; // Primary selection (for backward compatibility)
  elementType: ElementType;
  isEditing: boolean; // Whether text is being edited directly on canvas
  multiSelect: SelectionItem[]; // Multiple selections for bulk editing
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface GlobalSettings {
  backgroundType: 'gradient' | 'solid' | 'image';
  backgroundGradient: {
    startColor: string;
    endColor: string;
    angle: number;
  };
  backgroundSolid: string;
  deviceFrame: string; // 'iPhone 15 Pro', 'iPad Pro 13', etc.
  showDeviceFrame: boolean;
}

interface StudioEditorContextType {
  // State
  screenshots: ScreenshotState[];
  selection: SelectionState;
  view: ViewState;
  global: GlobalSettings;
  isSaving: boolean;
  
  // Actions - Selection
  selectElement: (screenshotIndex: number, elementType: ElementType, multiSelectMode?: boolean) => void;
  clearSelection: () => void;
  startEditing: () => void;
  stopEditing: () => void;
  
  // Actions - Screenshot updates
  updateScreenshotText: (index: number, field: 'heading' | 'subheading', value: string) => void;
  updateScreenshotPosition: (index: number, element: 'heading' | 'subheading' | 'mockup', position: { x: number; y: number }) => void;
  updateScreenshotScale: (index: number, scale: number) => void;
  updateScreenshotRotation: (index: number, rotation: number) => void;
  updateScreenshotFontSize: (index: number, field: 'heading' | 'subheading', size: number) => void;
  updateScreenshotFont: (index: number, fontFamily: string) => void;
  updateScreenshotTheme: (index: number, theme: string) => void;
  updateScreenshotColor: (index: number, field: 'heading' | 'subheading', color: string) => void;
  updateScreenshotAlign: (index: number, field: 'heading' | 'subheading', align: 'left' | 'center' | 'right') => void;
  updateScreenshotLetterSpacing: (index: number, field: 'heading' | 'subheading', spacing: number) => void;
  updateScreenshotLineHeight: (index: number, field: 'heading' | 'subheading', lineHeight: number) => void;
  
  // Actions - Bulk updates for multi-selection
  updateScreenshotFontBulk: (fontFamily: string, selections: SelectionItem[]) => void;
  updateScreenshotFontSizeBulk: (size: number, selections: SelectionItem[]) => void;
  updateScreenshotColorBulk: (color: string, selections: SelectionItem[]) => void;
  updateScreenshotAlignBulk: (align: 'left' | 'center' | 'right', selections: SelectionItem[]) => void;
  updateScreenshotLetterSpacingBulk: (spacing: number, selections: SelectionItem[]) => void;
  updateScreenshotLineHeightBulk: (lineHeight: number, selections: SelectionItem[]) => void;
  
  // Actions - View
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  
  // Actions - Global settings
  updateBackground: (settings: Partial<GlobalSettings>) => void;
  updateDeviceFrame: (device: string) => void;
  
  // Utilities
  getSelectedScreenshot: () => ScreenshotState | null;
}

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
  const previousStateRef = useRef<string>(''); // Track previous state as JSON string
  const previousSelectionRef = useRef<SelectionState | null>(null); // Track previous selection
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize screenshot states from GeneratedImage data
  const [screenshots, setScreenshots] = useState<ScreenshotState[]>(() => 
    initialScreenshots.map((img, index) => ({
      id: img.id || `screenshot-${index}`,
      image: img,
      heading: img.configuration?.heading || 'Tap to edit',
      subheading: img.configuration?.subheading || 'Tap to add subheading',
      mockupPosition: { 
        x: img.configuration?.mockupX || 0, 
        y: img.configuration?.mockupY || 0 
      },
      mockupScale: img.configuration?.mockupScale || 1,
      mockupRotation: img.configuration?.mockupRotation || 0,
      headingPosition: { 
        x: img.configuration?.headingX || 100, 
        y: img.configuration?.headingY || 100 
      },
      subheadingPosition: { 
        x: img.configuration?.subheadingX || 100, 
        y: img.configuration?.subheadingY || 200 
      },
      headingFontSize: img.configuration?.headingFontSize || 64,
      subheadingFontSize: img.configuration?.subheadingFontSize || 32,
      headingColor: img.configuration?.headingColor || '#ffffff',
      subheadingColor: img.configuration?.subheadingColor || '#ffffff',
      headingAlign: (img.configuration?.headingAlign as 'left' | 'center' | 'right') || 'left',
      subheadingAlign: (img.configuration?.subheadingAlign as 'left' | 'center' | 'right') || 'left',
      headingLetterSpacing: img.configuration?.headingLetterSpacing || 0,
      subheadingLetterSpacing: img.configuration?.subheadingLetterSpacing || 0,
      headingLineHeight: img.configuration?.headingLineHeight || 1.2,
      subheadingLineHeight: img.configuration?.subheadingLineHeight || 1.2,
      fontFamily: img.configuration?.headingFont || 'Inter',
      theme: img.configuration?.theme || 'light',
    }))
  );

  const [selection, setSelection] = useState<SelectionState>({
    screenshotIndex: null,
    elementType: null,
    isEditing: false,
    multiSelect: [],
  });

  const [view, setView] = useState<ViewState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const [global, setGlobal] = useState<GlobalSettings>(() => {
    // Try to load global settings from first screenshot's configuration
    const firstImage = initialScreenshots[0];
    const config = firstImage?.configuration;
    
    return {
      backgroundType: (config?.backgroundType as 'gradient' | 'solid' | 'image') || 'gradient',
      backgroundGradient: {
        startColor: config?.backgroundGradient?.startColor || '#667eea',
        endColor: config?.backgroundGradient?.endColor || '#764ba2',
        angle: config?.backgroundGradient?.angle ?? 90, // Use nullish coalescing to allow 0
      },
      backgroundSolid: config?.backgroundSolid || '#ffffff',
      deviceFrame,
      showDeviceFrame: true,
    };
  });

  // Selection actions
  const selectElement = useCallback((screenshotIndex: number, elementType: ElementType, multiSelectMode = false) => {
    if (multiSelectMode && elementType !== 'mockup') {
      // Multi-select mode (Cmd/Ctrl+Click)
      setSelection(prev => {
        const newItem: SelectionItem = { screenshotIndex, elementType: elementType as 'heading' | 'subheading' };
        
        // Check if this item is already selected
        const existingIndex = prev.multiSelect.findIndex(
          item => item.screenshotIndex === screenshotIndex && item.elementType === elementType
        );
        
        if (existingIndex >= 0) {
          // Deselect if already selected
          const newMultiSelect = prev.multiSelect.filter((_, i) => i !== existingIndex);
          if (newMultiSelect.length === 0) {
            // If no more selections, clear everything
            return { screenshotIndex: null, elementType: null, isEditing: false, multiSelect: [] };
          }
          // Set primary selection to the first remaining item
          return {
            screenshotIndex: newMultiSelect[0].screenshotIndex,
            elementType: newMultiSelect[0].elementType,
            isEditing: false,
            multiSelect: newMultiSelect,
          };
        } else {
          // Add to selection
          const newMultiSelect = [...prev.multiSelect, newItem];
          return {
            screenshotIndex, // Set as primary selection
            elementType,
            isEditing: false,
            multiSelect: newMultiSelect,
          };
        }
      });
    } else {
      // Single select mode
      if (elementType === 'mockup' || elementType === null) {
        setSelection({ screenshotIndex, elementType, isEditing: false, multiSelect: [] });
      } else {
        // For text elements, start with one item in multiSelect
        setSelection({
          screenshotIndex,
          elementType,
          isEditing: false,
          multiSelect: [{ screenshotIndex, elementType: elementType as 'heading' | 'subheading' }],
        });
      }
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({ screenshotIndex: null, elementType: null, isEditing: false, multiSelect: [] });
  }, []);

  const startEditing = useCallback(() => {
    setSelection(prev => ({ ...prev, isEditing: true }));
  }, []);

  const stopEditing = useCallback(() => {
    setSelection(prev => ({ ...prev, isEditing: false }));
  }, []);

  // Screenshot update actions
  const updateScreenshotText = useCallback((index: number, field: 'heading' | 'subheading', value: string) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ));
  }, []);

  const updateScreenshotPosition = useCallback((
    index: number, 
    element: 'heading' | 'subheading' | 'mockup', 
    position: { x: number; y: number }
  ) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === index 
        ? { ...s, [`${element}Position`]: position }
        : s
    ));
  }, []);

  const updateScreenshotScale = useCallback((index: number, scale: number) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === index ? { ...s, mockupScale: scale } : s
    ));
  }, []);

  const updateScreenshotRotation = useCallback((index: number, rotation: number) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === index ? { ...s, mockupRotation: rotation } : s
    ));
  }, []);

  const updateScreenshotFontSize = useCallback((index: number, field: 'heading' | 'subheading', size: number) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === index ? { ...s, [`${field}FontSize`]: size } : s
    ));
  }, []);

  const updateScreenshotFont = useCallback((index: number, fontFamily: string) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === index ? { ...s, fontFamily } : s
    ));
  }, []);

  // Bulk update font for multi-selection
  const updateScreenshotFontBulk = useCallback((fontFamily: string, selections: SelectionItem[]) => {
    const indices = new Set(selections.map(s => s.screenshotIndex));
    setScreenshots(prev => prev.map((s, i) => 
      indices.has(i) ? { ...s, fontFamily } : s
    ));
  }, []);

  // Bulk update font size for multi-selection
  const updateScreenshotFontSizeBulk = useCallback((size: number, selections: SelectionItem[]) => {
    // Group selections by screenshot index to handle multiple elements per screenshot
    const updatesByIndex = new Map<number, Set<'heading' | 'subheading'>>();
    selections.forEach(s => {
      if (!updatesByIndex.has(s.screenshotIndex)) {
        updatesByIndex.set(s.screenshotIndex, new Set());
      }
      updatesByIndex.get(s.screenshotIndex)!.add(s.elementType);
    });
    
    setScreenshots(prev => prev.map((s, i) => {
      const elements = updatesByIndex.get(i);
      if (!elements) return s;
      
      const updates: any = {};
      elements.forEach(elementType => {
        updates[`${elementType}FontSize`] = size;
      });
      
      return { ...s, ...updates };
    }));
  }, []);

  const updateScreenshotTheme = useCallback((index: number, theme: string) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === index ? { ...s, theme } : s
    ));
  }, []);

  const updateScreenshotColor = useCallback((index: number, field: 'heading' | 'subheading', color: string) => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== index) return s;
      return {
        ...s,
        [field === 'heading' ? 'headingColor' : 'subheadingColor']: color
      };
    }));
  }, []);

  // Bulk update color for multi-selection
  const updateScreenshotColorBulk = useCallback((color: string, selections: SelectionItem[]) => {
    // Group selections by screenshot index to handle multiple elements per screenshot
    const updatesByIndex = new Map<number, Set<'heading' | 'subheading'>>();
    selections.forEach(s => {
      if (!updatesByIndex.has(s.screenshotIndex)) {
        updatesByIndex.set(s.screenshotIndex, new Set());
      }
      updatesByIndex.get(s.screenshotIndex)!.add(s.elementType);
    });
    
    setScreenshots(prev => prev.map((s, i) => {
      const elements = updatesByIndex.get(i);
      if (!elements) return s;
      
      const updates: any = {};
      elements.forEach(elementType => {
        updates[elementType === 'heading' ? 'headingColor' : 'subheadingColor'] = color;
      });
      
      return { ...s, ...updates };
    }));
  }, []);

  const updateScreenshotAlign = useCallback((index: number, field: 'heading' | 'subheading', align: 'left' | 'center' | 'right') => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== index) return s;
      return {
        ...s,
        [field === 'heading' ? 'headingAlign' : 'subheadingAlign']: align
      };
    }));
  }, []);

  // Bulk update alignment for multi-selection
  const updateScreenshotAlignBulk = useCallback((align: 'left' | 'center' | 'right', selections: SelectionItem[]) => {
    // Group selections by screenshot index to handle multiple elements per screenshot
    const updatesByIndex = new Map<number, Set<'heading' | 'subheading'>>();
    selections.forEach(s => {
      if (!updatesByIndex.has(s.screenshotIndex)) {
        updatesByIndex.set(s.screenshotIndex, new Set());
      }
      updatesByIndex.get(s.screenshotIndex)!.add(s.elementType);
    });
    
    setScreenshots(prev => prev.map((s, i) => {
      const elements = updatesByIndex.get(i);
      if (!elements) return s;
      
      const updates: any = {};
      elements.forEach(elementType => {
        updates[elementType === 'heading' ? 'headingAlign' : 'subheadingAlign'] = align;
      });
      
      return { ...s, ...updates };
    }));
  }, []);

  const updateScreenshotLetterSpacing = useCallback((index: number, field: 'heading' | 'subheading', spacing: number) => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== index) return s;
      return {
        ...s,
        [field === 'heading' ? 'headingLetterSpacing' : 'subheadingLetterSpacing']: spacing
      };
    }));
  }, []);

  // Bulk update letter spacing for multi-selection
  const updateScreenshotLetterSpacingBulk = useCallback((spacing: number, selections: SelectionItem[]) => {
    // Group selections by screenshot index to handle multiple elements per screenshot
    const updatesByIndex = new Map<number, Set<'heading' | 'subheading'>>();
    selections.forEach(s => {
      if (!updatesByIndex.has(s.screenshotIndex)) {
        updatesByIndex.set(s.screenshotIndex, new Set());
      }
      updatesByIndex.get(s.screenshotIndex)!.add(s.elementType);
    });
    
    setScreenshots(prev => prev.map((s, i) => {
      const elements = updatesByIndex.get(i);
      if (!elements) return s;
      
      const updates: any = {};
      elements.forEach(elementType => {
        updates[elementType === 'heading' ? 'headingLetterSpacing' : 'subheadingLetterSpacing'] = spacing;
      });
      
      return { ...s, ...updates };
    }));
  }, []);

  const updateScreenshotLineHeight = useCallback((index: number, field: 'heading' | 'subheading', lineHeight: number) => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== index) return s;
      return {
        ...s,
        [field === 'heading' ? 'headingLineHeight' : 'subheadingLineHeight']: lineHeight
      };
    }));
  }, []);

  // Bulk update line height for multi-selection
  const updateScreenshotLineHeightBulk = useCallback((lineHeight: number, selections: SelectionItem[]) => {
    // Group selections by screenshot index to handle multiple elements per screenshot
    const updatesByIndex = new Map<number, Set<'heading' | 'subheading'>>();
    selections.forEach(s => {
      if (!updatesByIndex.has(s.screenshotIndex)) {
        updatesByIndex.set(s.screenshotIndex, new Set());
      }
      updatesByIndex.get(s.screenshotIndex)!.add(s.elementType);
    });
    
    setScreenshots(prev => prev.map((s, i) => {
      const elements = updatesByIndex.get(i);
      if (!elements) return s;
      
      const updates: any = {};
      elements.forEach(elementType => {
        updates[elementType === 'heading' ? 'headingLineHeight' : 'subheadingLineHeight'] = lineHeight;
      });
      
      return { ...s, ...updates };
    }));
  }, []);

  // View actions
  const setZoom = useCallback((zoom: number) => {
    setView(prev => ({ ...prev, zoom }));
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    setView(prev => ({ ...prev, panX: x, panY: y }));
  }, []);

  const resetView = useCallback(() => {
    setView({ zoom: 1, panX: 0, panY: 0 });
  }, []);

  // Global settings actions
  const updateBackground = useCallback((settings: Partial<GlobalSettings>) => {
    setGlobal(prev => ({ ...prev, ...settings }));
  }, []);

  const updateDeviceFrame = useCallback((device: string) => {
    setGlobal(prev => ({ ...prev, deviceFrame: device }));
  }, []);

  // Utilities
  const getSelectedScreenshot = useCallback(() => {
    if (selection.screenshotIndex === null) return null;
    return screenshots[selection.screenshotIndex] || null;
  }, [selection.screenshotIndex, screenshots]);

  // Auto-save configuration to database
  const saveConfiguration = useCallback(async () => {
    console.log('💾 saveConfiguration called', { 
      hasSession: !!session?.access_token, 
      projectId,
      screenshotCount: screenshots.length 
    });
    
    if (!session?.access_token || !projectId) {
      console.warn('⚠️ Missing session or projectId, skipping save');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save each screenshot's configuration with display order
      await Promise.all(
        screenshots.map(async (screenshot, index) => {
          const configuration = {
            heading: screenshot.heading,
            subheading: screenshot.subheading,
            headingFont: screenshot.fontFamily,
            subheadingFont: screenshot.fontFamily,
            headingFontSize: screenshot.headingFontSize,
            subheadingFontSize: screenshot.subheadingFontSize,
            headingColor: screenshot.headingColor,
            subheadingColor: screenshot.subheadingColor,
            headingAlign: screenshot.headingAlign,
            subheadingAlign: screenshot.subheadingAlign,
            headingLetterSpacing: screenshot.headingLetterSpacing,
            subheadingLetterSpacing: screenshot.subheadingLetterSpacing,
            headingLineHeight: screenshot.headingLineHeight,
            subheadingLineHeight: screenshot.subheadingLineHeight,
            mockupX: screenshot.mockupPosition.x,
            mockupY: screenshot.mockupPosition.y,
            mockupScale: screenshot.mockupScale,
            mockupRotation: screenshot.mockupRotation,
            headingX: screenshot.headingPosition.x,
            headingY: screenshot.headingPosition.y,
            subheadingX: screenshot.subheadingPosition.x,
            subheadingY: screenshot.subheadingPosition.y,
            theme: screenshot.theme,
            // Global settings
            deviceFrame: global.deviceFrame,
            backgroundType: global.backgroundType,
            backgroundGradient: global.backgroundGradient,
            backgroundSolid: global.backgroundSolid,
          };

          const response = await fetch(
            `http://localhost:3001/api/projects/${projectId}/images/${screenshot.id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                configuration,
                displayOrder: index  // Preserve the order
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to save screenshot ${screenshot.id}`);
          }
        })
      );
      
      console.log('Configuration saved successfully');
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save changes');
      setIsSaving(false);
    }
  }, [screenshots, global, projectId, session]);

  // Auto-save when global settings change (background, device frame, etc.)
  useEffect(() => {
    const isFirstRender = !previousStateRef.current;
    if (isFirstRender) {
      previousStateRef.current = JSON.stringify({ screenshots, global });
      return;
    }

    const timeout = setTimeout(() => {
      (async () => {
        try {
          await saveConfiguration();
          console.log('✅ Global settings auto-saved');
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
        }
      })();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global]);

  // Save on unfocus (when selection changes from something to null/nothing)
  useEffect(() => {
    // Initialize previous state on first render
    if (!previousStateRef.current) {
      previousStateRef.current = JSON.stringify({ screenshots, global });
      previousSelectionRef.current = selection;
      return;
    }
    
    // Check if we just unfocused (selection went from selected to null)
    const wasSelected = previousSelectionRef.current?.elementType !== null;
    const isNowUnselected = selection.elementType === null;
    
    // Update previous selection
    previousSelectionRef.current = selection;
    
    // Only save if:
    // 1. We just unfocused (was selected, now unselected)
    // 2. Content actually changed
    if (wasSelected && isNowUnselected) {
      const currentState = JSON.stringify({ screenshots, global });
      if (currentState !== previousStateRef.current) {
        // Content changed, save it
        console.log('🔄 Unfocus detected - triggering save...');
        previousStateRef.current = currentState;
        
        // Call async save function
        (async () => {
          try {
            await saveConfiguration();
            console.log('✅ Save completed successfully');
          } catch (error) {
            console.error('❌ Save failed:', error);
          }
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  const value: StudioEditorContextType = {
    screenshots,
    selection,
    view,
    global,
    isSaving,
    selectElement,
    clearSelection,
    startEditing,
    stopEditing,
    updateScreenshotText,
    updateScreenshotPosition,
    updateScreenshotScale,
    updateScreenshotRotation,
    updateScreenshotFontSize,
    updateScreenshotFont,
    updateScreenshotTheme,
    updateScreenshotColor,
    updateScreenshotAlign,
    updateScreenshotLetterSpacing,
    updateScreenshotLineHeight,
    updateScreenshotFontBulk,
    updateScreenshotFontSizeBulk,
    updateScreenshotColorBulk,
    updateScreenshotAlignBulk,
    updateScreenshotLetterSpacingBulk,
    updateScreenshotLineHeightBulk,
    setZoom,
    setPan,
    resetView,
    updateBackground,
    updateDeviceFrame,
    getSelectedScreenshot,
  };

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
