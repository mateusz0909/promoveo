/**
 * Wrapper for Transform Controls specifically for visual elements
 * Handles center-based positioning instead of canvas-centered mockup positioning
 */

import { useRef, useEffect, useState } from 'react';
import { TransformControls } from '../TransformControls';

interface VisualTransformControlsWrapperProps {
  index: number;
  visualId: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  baseWidth: number;
  baseHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  updateVisualPosition: (index: number, visualId: string, position: { x: number; y: number }) => void;
  updateVisualScale: (index: number, visualId: string, scale: number) => void;
  updateVisualRotation: (index: number, visualId: string, rotation: number) => void;
}

export function VisualTransformControlsWrapper({
  index,
  visualId,
  centerX,
  centerY,
  width,
  height,
  rotation,
  baseWidth,
  canvasWidth,
  zoom,
  updateVisualPosition,
  updateVisualScale,
  updateVisualRotation,
}: VisualTransformControlsWrapperProps) {
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

  // Calculate top-left position from center
  const x = centerX - width / 2;
  const y = centerY - height / 2;

  return (
    <div ref={wrapperRef} className="absolute inset-0 pointer-events-none">
      <TransformControls
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        displayScale={displayScale}
        onTransform={(transform) => {
          // Calculate new center position from transform x, y (which are top-left)
          const newCenterX = transform.x + transform.width / 2;
          const newCenterY = transform.y + transform.height / 2;
          
          // Update position (center-based)
          updateVisualPosition(index, visualId, {
            x: newCenterX,
            y: newCenterY
          });
          
          // Update scale based on width change
          const newScale = transform.width / baseWidth;
          updateVisualScale(index, visualId, newScale);
          
          // Update rotation
          updateVisualRotation(index, visualId, transform.rotation);
        }}
        showRotationHandle={true}
        showScaleHandles={true}
        showBoundingBox={true}
        minScale={0.1}
        maxScale={5.0}
      />
    </div>
  );
}
