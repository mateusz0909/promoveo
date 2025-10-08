/**
 * Wrapper for Transform Controls specifically for text elements
 * Handles text frame resizing with automatic height based on text wrapping
 */

import { useRef, useEffect, useState } from 'react';
import { TransformControls } from '../TransformControls';
import { wrapText } from './utils';
import { quoteFontFamily } from '@/lib/fonts';
import type { TextElement } from '@/context/studio-editor/elementTypes';
import type { ScreenshotState } from '@/context/studio-editor/types';

interface TextTransformControlsWrapperProps {
  screenshot: ScreenshotState;
  index: number;
  element: TextElement;
  canvasWidth: number;
  fontScaleMultiplier: number;
  defaultTextWidth: number;
  zoom: number;
  updateTextWidth: (index: number, elementId: string, width: number) => void;
  updateTextPosition: (index: number, elementId: string, position: { x: number; y: number }) => void;
  updateTextRotation: (index: number, elementId: string, rotation: number) => void;
}

export function TextTransformControlsWrapper({
  index,
  element,
  canvasWidth,
  fontScaleMultiplier,
  defaultTextWidth,
  zoom,
  updateTextWidth,
  updateTextPosition,
  updateTextRotation,
}: TextTransformControlsWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [textBounds, setTextBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Find the canvas element and calculate display scale
  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const parent = wrapperRef.current.parentElement;
        const canvas = parent?.querySelector('canvas') as HTMLCanvasElement;
        
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const baseScale = rect.width / canvasWidth;
          const finalScale = baseScale / zoom;
          setDisplayScale(finalScale);
        }
      }
    };
    
    updateScale();
    
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasWidth, zoom]);

  // Calculate text bounds based on current width and wrapping
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

  const fontSize = element.fontSize * fontScaleMultiplier;
    const weightValue = element.fontWeight ?? (element.isBold ? 700 : 400);
    const fontWeight = typeof weightValue === 'number' ? weightValue.toString() : weightValue;
    const fontFamily = quoteFontFamily(element.fontFamily);
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Use element width if specified, otherwise use 90% of canvas
    const maxTextWidth = element.width ?? defaultTextWidth;
    
    const lines = wrapText(ctx, element.text, maxTextWidth, element.letterSpacing ?? 0);
    const lineHeight = fontSize * element.lineHeight;
    const totalHeight = lines.length * lineHeight;

    // Calculate actual width based on longest line
    let actualWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      const charCount = Math.max(Array.from(line).length - 1, 0);
      const spacingTotal = (element.letterSpacing ?? 0) * charCount;
      const lineWidth = Math.max(metrics.width + spacingTotal, 0);
      actualWidth = Math.max(actualWidth, lineWidth);
    });

    // Calculate bounds based on alignment
    let minX: number;
    const textX = element.position.x;
    const textY = element.position.y;
    const frameWidth = element.width ?? maxTextWidth;

    if (element.align === 'left') {
      minX = textX;
    } else if (element.align === 'right') {
      minX = textX - frameWidth;
    } else {
      minX = textX - frameWidth / 2;
    }

    // Text position is baseline, so adjust for font height
    const topY = textY - fontSize * 0.8;

    setTextBounds({
      x: minX,
      y: topY,
      width: frameWidth,
      height: totalHeight,
    });
  }, [element, defaultTextWidth, fontScaleMultiplier]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 pointer-events-none">
      <TransformControls
        x={textBounds.x}
        y={textBounds.y}
        width={textBounds.width}
        height={textBounds.height}
        rotation={element.rotation}
        displayScale={displayScale}
        onTransform={(transform) => {
          // Calculate new position based on alignment
          let newX: number;
          if (element.align === 'left') {
            newX = transform.x;
          } else if (element.align === 'right') {
            newX = transform.x + transform.width;
          } else {
            newX = transform.x + transform.width / 2;
          }

          // Adjust Y back to baseline from top
          const fontSize = element.fontSize * fontScaleMultiplier;
          const newY = transform.y + fontSize * 0.8;

          // Update position
          updateTextPosition(index, element.id, {
            x: newX,
            y: newY,
          });

          // Update width (convert from canvas pixels to logical pixels)
          const newWidth = transform.width;
          updateTextWidth(index, element.id, newWidth);

          // Update rotation
          updateTextRotation(index, element.id, transform.rotation);
        }}
        showRotationHandle={true}
        hideTopBottomHandles={true}
        showBoundingBox={true}
      />
    </div>
  );
}
