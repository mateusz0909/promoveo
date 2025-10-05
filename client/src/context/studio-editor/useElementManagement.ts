/**
 * Element Management Hook
 * 
 * Handles all CRUD operations for canvas elements (text, mockups, visuals)
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { CanvasElement } from './elementTypes';
import type { ScreenshotState } from './types';
import { cloneElement } from './elementTypes';

export function useElementManagement(
  screenshots: ScreenshotState[],
  setScreenshots: React.Dispatch<React.SetStateAction<ScreenshotState[]>>,
  clearSelection: () => void
) {
  
  /**
   * Add a new element to a screenshot
   */
  const addElement = useCallback(async (screenshotIndex: number, element: CanvasElement) => {
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) {
      toast.error('Screenshot not found');
      return;
    }

    // Update state - auto-save will handle persistence
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? { ...s, elements: [...s.elements, element] }
        : s
    ));

    toast.success('Element added');
  }, [screenshots, setScreenshots]);

  /**
   * Update an existing element
   */
  const updateElement = useCallback(async (
    screenshotIndex: number,
    elementId: string,
    updates: Partial<CanvasElement>
  ) => {
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) return;

    // Optimistic update - preserve element type by casting
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? {
            ...s,
            elements: s.elements.map(el =>
              el.id === elementId ? { ...el, ...updates } as CanvasElement : el
            ),
          }
        : s
    ));

    // Auto-save handled by debounced save in context
  }, [screenshots, setScreenshots]);

  /**
   * Delete an element
   */
  const deleteElement = useCallback(async (screenshotIndex: number, elementId: string) => {
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) {
      toast.error('Screenshot not found');
      return;
    }

    // Update state - auto-save will handle persistence
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? { ...s, elements: s.elements.filter(el => el.id !== elementId) }
        : s
    ));

    clearSelection();
    toast.success('Element deleted');
  }, [screenshots, setScreenshots, clearSelection]);

  /**
   * Duplicate an element
   */
  const duplicateElement = useCallback(async (screenshotIndex: number, elementId: string) => {
    const screenshot = screenshots[screenshotIndex];
    if (!screenshot) {
      toast.error('Screenshot not found');
      return;
    }

    const element = screenshot.elements.find(el => el.id === elementId);
    if (!element) {
      toast.error('Element not found');
      return;
    }

    const cloned = cloneElement(element);
    await addElement(screenshotIndex, cloned);
  }, [screenshots, addElement]);

  return {
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
  };
}
