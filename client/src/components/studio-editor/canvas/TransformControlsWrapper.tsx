/**
 * Wrapper component for Transform Controls with dynamic display scale
 */

import { useRef, useEffect, useState } from 'react';
import { TransformControls } from '../TransformControls';

interface TransformControlsWrapperProps {
  screenshot: any;
  index: number;
  mockupX: number;
  mockupY: number;
  mockupWidth: number;
  mockupHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  updateScreenshotPosition: (index: number, element: 'mockup', position: { x: number; y: number }) => void;
  updateScreenshotScale: (index: number, scale: number) => void;
  updateScreenshotRotation: (index: number, rotation: number) => void;
}

export function TransformControlsWrapper({
  screenshot,
  index,
  mockupX,
  mockupY,
  mockupWidth,
  mockupHeight,
  canvasWidth,
  canvasHeight,
  zoom,
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
        rotation={screenshot.mockupRotation || 0}
        displayScale={displayScale}
        onTransform={(transform) => {
          // Update position
          const newX = transform.x - (canvasWidth - transform.width) / 2;
          const newY = transform.y - (canvasHeight - transform.height) / 2;
          updateScreenshotPosition(index, 'mockup', { x: newX, y: newY });
          
          // Update scale
          updateScreenshotScale(index, transform.scale);
          
          // Update rotation
          updateScreenshotRotation(index, transform.rotation);
        }}
        showRotationHandle={true}
        showScaleHandles={true}
        minScale={0.3}
        maxScale={2.5}
      />
    </div>
  );
}
