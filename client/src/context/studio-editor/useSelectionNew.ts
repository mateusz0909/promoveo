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
    isEditing: false,
  });

  /**
   * Select an element
   */
  const selectElement = useCallback((screenshotIndex: number, elementId: string | null) => {
    setSelection({
      screenshotIndex,
      elementId,
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
      isEditing: false,
    });
  }, []);

  /**
   * Start editing mode (for inline text editing)
   */
  const startEditing = useCallback(() => {
    setSelection(prev => ({
      ...prev,
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
