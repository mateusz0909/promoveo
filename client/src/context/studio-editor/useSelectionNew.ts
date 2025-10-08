/**
 * Selection Management Hook
 * 
 * Handles element selection state and editing mode
 */

import { useState, useCallback } from 'react';
import type { SelectionState } from './types';

export function useSelection() {
  const [selection, setSelection] = useState<SelectionState>({
    screenshotIndex: null,
    elementId: null,
    selectedElementIds: [],
    isEditing: false,
  });

  /**
   * Select an element
   */
  const selectElement = useCallback((
    screenshotIndex: number,
    elementId: string | null
  ) => {
    if (elementId === null) {
      setSelection({
        screenshotIndex,
        elementId: null,
        selectedElementIds: [],
        isEditing: false,
      });
      return;
    }

    setSelection({
      screenshotIndex,
      elementId,
      selectedElementIds: [elementId],
      isEditing: false,
    });
  }, []);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelection({
      screenshotIndex: null,
      elementId: null,
      selectedElementIds: [],
      isEditing: false,
    });
  }, []);

  /**
   * Start editing mode (for inline text editing)
   */
  const startEditing = useCallback(() => {
    setSelection(prev => ({
      ...prev,
      selectedElementIds: prev.selectedElementIds.length ? prev.selectedElementIds : prev.elementId ? [prev.elementId] : [],
      isEditing: true,
    }));
  }, []);

  /**
   * Stop editing mode
   */
  const stopEditing = useCallback(() => {
    setSelection(prev => ({
      ...prev,
      isEditing: false,
    }));
  }, []);

  return {
    selection,
    selectElement,
    clearSelection,
    startEditing,
    stopEditing,
  };
}
