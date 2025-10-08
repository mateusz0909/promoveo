/**
 * Transform Operations Hook
 * 
 * Handles position, scale, rotation, and z-index updates for canvas elements
 */

import { useCallback } from 'react';
import type { ScreenshotState } from './types';
import type { CanvasElement } from './elementTypes';

export function useTransform(
  setScreenshots: React.Dispatch<React.SetStateAction<ScreenshotState[]>>,
  markScreenshotDirty: (screenshotId: string) => void
) {
  
  /**
   * Update element position
   */
  const updateElementPosition = useCallback((
    screenshotIndex: number,
    elementId: string,
    position: { x: number; y: number }
  ) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      markScreenshotDirty(screenshot.id);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, position } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Update element scale
   */
  const updateElementScale = useCallback((
    screenshotIndex: number,
    elementId: string,
    scale: number
  ) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      markScreenshotDirty(screenshot.id);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, scale } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Update element rotation
   */
  const updateElementRotation = useCallback((
    screenshotIndex: number,
    elementId: string,
    rotation: number
  ) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      markScreenshotDirty(screenshot.id);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, rotation } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Update text element width (for text wrapping)
   */
  const updateTextWidth = useCallback((
    screenshotIndex: number,
    elementId: string,
    width: number
  ) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      markScreenshotDirty(screenshot.id);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, width } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Update element z-index (layer order)
   */
  const updateElementZIndex = useCallback((
    screenshotIndex: number,
    elementId: string,
    zIndex: number
  ) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      markScreenshotDirty(screenshot.id);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, zIndex } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Bring element to front (set highest z-index)
   */
  const bringToFront = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      markScreenshotDirty(screenshot.id);

      const maxZIndex = Math.max(...screenshot.elements.map(el => el.zIndex), 0);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, zIndex: maxZIndex + 1 } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Send element to back (set lowest z-index)
   */
  const sendToBack = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      markScreenshotDirty(screenshot.id);

      const minZIndex = Math.min(...screenshot.elements.map(el => el.zIndex), 0);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, zIndex: minZIndex - 1 } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Move element forward (increase z-index by 1)
   */
  const moveForward = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      const element = screenshot.elements.find(el => el.id === elementId);
      if (!element) return prev;

      markScreenshotDirty(screenshot.id);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, zIndex: element.zIndex + 1 } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

  /**
   * Move element backward (decrease z-index by 1)
   */
  const moveBackward = useCallback((screenshotIndex: number, elementId: string) => {
    setScreenshots(prev => {
      const screenshot = prev[screenshotIndex];
      if (!screenshot) return prev;

      const element = screenshot.elements.find(el => el.id === elementId);
      if (!element) return prev;

      markScreenshotDirty(screenshot.id);

      return prev.map((s, i) =>
        i === screenshotIndex
          ? {
              ...s,
              elements: s.elements.map(el =>
                el.id === elementId ? { ...el, zIndex: element.zIndex - 1 } as CanvasElement : el
              ),
            }
          : s
      );
    });
  }, [setScreenshots, markScreenshotDirty]);

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
