/**
 * Wrapper component for Transform Controls with dynamic display scale
 */

import { useRef, useEffect, useState } from 'react';
import { TransformControls } from '../TransformControls';

interface TransformControlsWrapperProps {
  index: number;
  elementId?: string; // Instance ID for mockup instances (e.g., 'mockup-123')
  mockupX: number;
  mockupY: number;
  mockupWidth: number;
  mockupHeight: number;
  baseWidth: number;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  rotation: number;
  updateScreenshotPosition: (index: number, element: 'mockup' | string, position: { x: number; y: number }) => void;
  updateScreenshotScale: (index: number, scale: number, elementId?: string) => void;
  updateScreenshotRotation: (index: number, rotation: number, elementId?: string) => void;
}

export function TransformControlsWrapper({
  index,
  elementId, // Instance ID for mockup instances
  mockupX,
  mockupY,
  mockupWidth,
  mockupHeight,
  baseWidth,
  canvasWidth,
  canvasHeight,
  zoom,
  rotation,
  updateScreenshotPosition,
  updateScreenshotScale,
  updateScreenshotRotation,
}: TransformControlsWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

  // Find the canvas element and calculate display scale
  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const parent = wrapperRef.current.parentElement;
        const canvas = parent?.querySelector('canvas') as HTMLCanvasElement;
        
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          // Account for both natural canvas scaling AND zoom level
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

  return (
    <div ref={wrapperRef} className="absolute inset-0 pointer-events-none">
      <TransformControls
        x={mockupX}
        y={mockupY}
        width={mockupWidth}
        height={mockupHeight}
        rotation={rotation}
        baseWidth={baseWidth}
        displayScale={displayScale}
        onTransform={(transform) => {
          // Update position (use elementId for instances, 'mockup' for legacy)
          const positionElement = elementId || 'mockup';
          const newX = transform.x - (canvasWidth - transform.width) / 2;
          const newY = transform.y - (canvasHeight - transform.height) / 2;
          updateScreenshotPosition(index, positionElement, { x: newX, y: newY });
          
          // Update scale (pass elementId for instances)
          updateScreenshotScale(index, transform.scale, elementId);
          
          // Update rotation (pass elementId for instances)
          updateScreenshotRotation(index, transform.rotation, elementId);
        }}
        showRotationHandle={true}
        showScaleHandles={true}
        showBoundingBox={true}
        minScale={0.3}
        maxScale={2.5}
      />
    </div>
  );
}
