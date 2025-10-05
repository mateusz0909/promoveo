/**
 * Transform Operations Hook
 * 
 * Handles position, scale, rotation, and z-index updates for canvas elements
 */

import { useCallback } from 'react';
import type { ScreenshotState } from './types';
import type { CanvasElement } from './elementTypes';

export function useTransform(
  setScreenshots: React.Dispatch<React.SetStateAction<ScreenshotState[]>>
) {
  
  /**
   * Update element position
   */
  const updateElementPosition = useCallback((
    screenshotIndex: number,
    elementId: string,
    position: { x: number; y: number }
  ) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? {
            ...s,
            elements: s.elements.map(el =>
              el.id === elementId ? { ...el, position } as CanvasElement : el
            ),
          }
        : s
    ));
  }, [setScreenshots]);

  /**
   * Update element scale
   */
  const updateElementScale = useCallback((
    screenshotIndex: number,
    elementId: string,
    scale: number
  ) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? {
            ...s,
            elements: s.elements.map(el =>
              el.id === elementId ? { ...el, scale } as CanvasElement : el
            ),
          }
        : s
    ));
  }, [setScreenshots]);

  /**
   * Update element rotation
   */
  const updateElementRotation = useCallback((
    screenshotIndex: number,
    elementId: string,
    rotation: number
  ) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? {
            ...s,
            elements: s.elements.map(el =>
              el.id === elementId ? { ...el, rotation } as CanvasElement : el
            ),
          }
        : s
    ));
  }, [setScreenshots]);

  /**
   * Update text element width (for text wrapping)
   */
  const updateTextWidth = useCallback((
    screenshotIndex: number,
    elementId: string,
    width: number
  ) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? {
            ...s,
            elements: s.elements.map(el =>
              el.id === elementId ? { ...el, width } as CanvasElement : el
            ),
          }
        : s
    ));
  }, [setScreenshots]);

  /**
   * Update element z-index (layer order)
   */
  const updateElementZIndex = useCallback((
    screenshotIndex: number,
    elementId: string,
    zIndex: number
  ) => {
    setScreenshots(prev => prev.map((s, i) => 
      i === screenshotIndex
        ? {
            ...s,
            elements: s.elements.map(el =>
              el.id === elementId ? { ...el, zIndex } as CanvasElement : el
            ),
          }
        : s
    ));
  }, [setScreenshots]);

  /**
   * Bring element to front (set highest z-index)
   */
  const bringToFront = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== screenshotIndex) return s;
      
      const maxZIndex = Math.max(...s.elements.map(el => el.zIndex), 0);
      return {
        ...s,
        elements: s.elements.map(el =>
          el.id === elementId ? { ...el, zIndex: maxZIndex + 1 } as CanvasElement : el
        ),
      };
    }));
  }, [setScreenshots]);

  /**
   * Send element to back (set lowest z-index)
   */
  const sendToBack = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== screenshotIndex) return s;
      
      const minZIndex = Math.min(...s.elements.map(el => el.zIndex), 0);
      return {
        ...s,
        elements: s.elements.map(el =>
          el.id === elementId ? { ...el, zIndex: minZIndex - 1 } as CanvasElement : el
        ),
      };
    }));
  }, [setScreenshots]);

  /**
   * Move element forward (increase z-index by 1)
   */
  const moveForward = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== screenshotIndex) return s;
      
      const element = s.elements.find(el => el.id === elementId);
      if (!element) return s;
      
      return {
        ...s,
        elements: s.elements.map(el =>
          el.id === elementId ? { ...el, zIndex: element.zIndex + 1 } as CanvasElement : el
        ),
      };
    }));
  }, [setScreenshots]);

  /**
   * Move element backward (decrease z-index by 1)
   */
  const moveBackward = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => prev.map((s, i) => {
      if (i !== screenshotIndex) return s;
      
      const element = s.elements.find(el => el.id === elementId);
      if (!element) return s;
      
      return {
        ...s,
        elements: s.elements.map(el =>
          el.id === elementId ? { ...el, zIndex: element.zIndex - 1 } as CanvasElement : el
        ),
      };
    }));
  }, [setScreenshots]);

  return {
    updateElementPosition,
    updateElementScale,
    updateElementRotation,
    updateTextWidth,
    updateElementZIndex,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
  };
}
