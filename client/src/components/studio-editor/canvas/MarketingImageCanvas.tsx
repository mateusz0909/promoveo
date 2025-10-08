/**
 * Individual marketing image canvas component - Refactored with unified element system
 *
 * Renders a single marketing screenshot with:
 * - Background (gradient, solid, or image)
 * - All elements (text, mockups, visuals) in z-index order
 * - Selection indicators for the active element
 */

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { getCanvasMetrics } from './utils';
import { drawBackground } from './backgroundRenderer';
import { renderAllElements } from './elementRenderer';
import { getElementAtPoint } from './hitDetection';
import { isTextElement } from '@/context/studio-editor/elementTypes';
import type { ScreenshotState } from '@/context/studio-editor/types';
import type { CanvasElement } from '@/context/studio-editor/elementTypes';
import type { GlobalSettings } from '@/context/studio-editor/types';
import { cn } from '@/lib/utils';

interface DragState {
  startX: number;
  startY: number;
  elementIds: string[];
  initialPositions: Map<string, { x: number; y: number }>;
  hasMoved: boolean;
}

export interface MarketingImageCanvasProps {
  screenshot: ScreenshotState;
  index: number;
  totalImages: number;
  isSelected: boolean;
  selectedElementIds: string[];
  primarySelectedElementId: string | null;
  isEditing: boolean;
  onSelect: (index: number | null, elementId: string | null) => void;
  onUpdatePosition: (index: number, elementId: string, position: { x: number; y: number }) => void;
  deviceFrameImage: HTMLImageElement | null;
  global: GlobalSettings;
  isCanvasSelected: boolean;
}

export function MarketingImageCanvas({
  screenshot,
  index,
  totalImages,
  isSelected,
  selectedElementIds,
  primarySelectedElementId,
  isEditing,
  onSelect,
  onUpdatePosition,
  deviceFrameImage,
  global,
  isCanvasSelected,
}: MarketingImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenshotImage, setScreenshotImage] = useState<HTMLImageElement | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [imageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const dragStateRef = useRef<DragState | null>(null);
  const wasDraggingRef = useRef(false);
  const selectionHandledInMouseDownRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const metrics = useMemo(() => getCanvasMetrics(global.deviceFrame), [global.deviceFrame]);
  const canvasWidth = metrics.width;
  const canvasHeight = metrics.height;

  const primarySelectedElement: CanvasElement | null = useMemo(() => {
    if (!primarySelectedElementId) return null;
    return screenshot.elements?.find((el) => el.id === primarySelectedElementId) ?? null;
  }, [primarySelectedElementId, screenshot.elements]);

  const elementsToRender = useMemo(() => {
    if (!isSelected || !isEditing || !primarySelectedElement || !isTextElement(primarySelectedElement)) {
      return screenshot.elements ?? [];
    }

    return (screenshot.elements ?? []).filter((el) => el.id !== primarySelectedElement.id);
  }, [isEditing, isSelected, primarySelectedElement, screenshot.elements]);

  // ---------------------------------------------------------------------------
  // Image loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
  const imageUrl = screenshot.image.sourceScreenshotUrl;
    if (!imageUrl) {
      setScreenshotImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setScreenshotImage(img);
    img.onerror = () => {
      console.error('Failed to load screenshot');
      setScreenshotImage(null);
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [screenshot.image]);

  useEffect(() => {
    if (global.backgroundType === 'image' && global.backgroundImage?.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setBackgroundImage(img);
      img.onerror = () => {
        console.error('Failed to load background image');
        setBackgroundImage(null);
      };
      img.src = global.backgroundImage.url;

      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }

    setBackgroundImage(null);
  }, [global.backgroundType, global.backgroundImage?.url]);

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const targetWidth = canvasWidth * pixelRatio;
    const targetHeight = canvasHeight * pixelRatio;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    (async () => {
      try {
        drawBackground(
          ctx,
          global,
          canvasWidth,
          canvasHeight,
          index,
          totalImages,
          backgroundImage
        );

  await renderAllElements(ctx, elementsToRender, screenshotImage, deviceFrameImage, metrics, imageCache);
      } catch (error) {
        console.error('Error rendering canvas:', error);
      } finally {
        ctx.restore();
      }
    })();
  }, [
    backgroundImage,
    deviceFrameImage,
    elementsToRender,
    global,
    imageCache,
    index,
    isEditing,
    isSelected,
    primarySelectedElementId,
    screenshot.elements,
    screenshotImage,
    selectedElementIds,
    totalImages,
    canvasHeight,
    canvasWidth,
    metrics,
  ]);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (wasDraggingRef.current) {
        wasDraggingRef.current = false;
        return;
      }

      if (selectionHandledInMouseDownRef.current) {
        selectionHandledInMouseDownRef.current = false;
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;

      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;

      const clickedElementId = getElementAtPoint(
        clickX,
        clickY,
        screenshot.elements || [],
        canvas,
        metrics
      );

      if (clickedElementId) {
        onSelect(index, clickedElementId);
      } else {
        onSelect(index, null);
      }
    },
  [canvasHeight, canvasWidth, index, metrics, onSelect, screenshot.elements]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      selectionHandledInMouseDownRef.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;

      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;
      const hitElementId = getElementAtPoint(
        clickX,
        clickY,
        screenshot.elements || [],
        canvas,
        metrics
      );

      if (!isSelected || isEditing) {
        dragStateRef.current = null;
        return;
      }

      if (!hitElementId) {
        dragStateRef.current = null;
        return;
      }

      const isAlreadySelected = selectedElementIds.includes(hitElementId);

      if (!isAlreadySelected) {
        onSelect(index, hitElementId);
        selectionHandledInMouseDownRef.current = true;
      }

      const elementIdsForDrag = isAlreadySelected
        ? [...selectedElementIds]
        : [hitElementId];

      const initialPositions = new Map<string, { x: number; y: number }>();
      elementIdsForDrag.forEach((id) => {
        const element = screenshot.elements?.find((el) => el.id === id);
        if (element) {
          initialPositions.set(id, { ...element.position });
        }
      });

      dragStateRef.current = {
        startX: clickX,
        startY: clickY,
        elementIds: Array.from(initialPositions.keys()),
        initialPositions,
        hasMoved: false,
      };

      wasDraggingRef.current = false;

      if (dragStateRef.current.elementIds.length > 0) {
        setIsDragging(true);
      }
    },
  [canvasHeight, canvasWidth, index, isEditing, isSelected, metrics, onSelect, screenshot.elements, selectedElementIds]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.elementIds.length === 0 || isEditing) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;

      const mouseX = (event.clientX - rect.left) * scaleX;
      const mouseY = (event.clientY - rect.top) * scaleY;

      const deltaX = mouseX - dragState.startX;
      const deltaY = mouseY - dragState.startY;

      if (!dragState.hasMoved && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
        dragState.hasMoved = true;
        wasDraggingRef.current = true;
      }

      dragState.elementIds.forEach((elementId) => {
        const initial = dragState.initialPositions.get(elementId);
        if (!initial) return;

        onUpdatePosition(index, elementId, {
          x: initial.x + deltaX,
          y: initial.y + deltaY,
        });
      });
    },
  [canvasHeight, canvasWidth, index, isEditing, onUpdatePosition]
  );

  const handleMouseUp = useCallback(() => {
    dragStateRef.current = null;
    if (isDragging) {
      setIsDragging(false);
    }
    selectionHandledInMouseDownRef.current = false;
  }, [isDragging]);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (
        !primarySelectedElement ||
        !isSelected ||
        isEditing ||
        primarySelectedElement.kind !== 'text' ||
        selectedElementIds.length !== 1
      ) {
        return;
      }

      event.stopPropagation();

      window.dispatchEvent(
        new CustomEvent('startTextEditing', {
          detail: { screenshotIndex: index, elementId: primarySelectedElement.id },
        })
      );
    },
    [index, isEditing, isSelected, primarySelectedElement, selectedElementIds]
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn(
        'block  shadow-lg transition-all',
        isCanvasSelected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent',
        isDragging
          ? 'cursor-grabbing'
          : isSelected && (primarySelectedElementId || selectedElementIds.length > 0)
          ? 'cursor-grab'
          : 'cursor-pointer'
      )}
      style={{
        width: 'min(100%, 350px)',
        height: 'auto',
      }}
    />
  );
}
