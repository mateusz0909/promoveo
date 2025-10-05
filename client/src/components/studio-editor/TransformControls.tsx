import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Transform Controls Component - Professional canvas transform handles
 * Inspired by Canva, Figma, and other professional design tools
 * 
 * Features:
 * - 8 resize handles (corners + sides)
 * - Rotation handle at the top
 * - Visual bounding box
 * - Keyboard modifiers (Shift for uniform scaling, Alt for center scaling)
 * - Real-time visual feedback
 */

interface TransformControlsProps {
  // Element bounds in canvas coordinates
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  
  // Display scale (canvas size / display size)
  displayScale: number;
  
  // Callbacks
  onTransformStart?: () => void;
  onTransform: (transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
  }) => void;
  onTransformEnd?: () => void;
  
  // Options
  showRotationHandle?: boolean;
  showScaleHandles?: boolean;
  hideTopBottomHandles?: boolean; // New: hide top and bottom handles for text
  minScale?: number;
  maxScale?: number;
}

type HandleType = 
  | 'rotation'
  | 'top-left' | 'top' | 'top-right'
  | 'right' | 'bottom-right' | 'bottom'
  | 'bottom-left' | 'left'
  | null;

export function TransformControls({
  x,
  y,
  width,
  height,
  rotation,
  displayScale,
  onTransformStart,
  onTransform,
  onTransformEnd,
  showRotationHandle = true,
  showScaleHandles = true,
  hideTopBottomHandles = false,
  minScale = 0.1,
  maxScale = 5.0,
}: TransformControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialRotation, setInitialRotation] = useState<number>(0);
  const [initialTransform, setInitialTransform] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
  } | null>(null);

  // Convert canvas coordinates to display coordinates
  const displayX = x * displayScale;
  const displayY = y * displayScale;
  const displayWidth = width * displayScale;
  const displayHeight = height * displayScale;

  // Handle size in pixels
  const HANDLE_SIZE = 12;
  const ROTATION_HANDLE_DISTANCE = 40; // Distance from top edge
  const OUTLINE_OFFSET = 5; // Offset to center handles on dotted line (4px gap + 1px to center of 2px outline)

  // Handle mouse down on a handle
  const handleMouseDown = useCallback((handle: HandleType, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setActiveHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Calculate initial angle for rotation handle
    if (handle === 'rotation') {
      const centerDisplayX = displayX + displayWidth / 2;
      const centerDisplayY = displayY + displayHeight / 2;
      
      const initialAngle = Math.atan2(
        e.clientY - centerDisplayY,
        e.clientX - centerDisplayX
      );
      
      setInitialRotation((initialAngle * 180) / Math.PI - 90);
    }
    
    setInitialTransform({
      x,
      y,
      width,
      height,
      rotation,
      scale: width / 700, // Assuming base width is 700
    });
    
    onTransformStart?.();
  }, [x, y, width, height, rotation, displayX, displayY, displayWidth, displayHeight, onTransformStart]);

  // Handle mouse move during drag
  useEffect(() => {
    if (!activeHandle || !dragStart || !initialTransform) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (activeHandle === 'rotation') {
        // Calculate current angle from center
        const centerDisplayX = displayX + displayWidth / 2;
        const centerDisplayY = displayY + displayHeight / 2;
        
        const currentAngle = Math.atan2(
          e.clientY - centerDisplayY,
          e.clientX - centerDisplayX
        );
        
        const currentAngleDeg = (currentAngle * 180) / Math.PI - 90;
        
        // Calculate rotation delta from initial grab point
        let rotationDelta = currentAngleDeg - initialRotation;
        
        // Calculate new rotation
        let newRotation = initialTransform.rotation + rotationDelta;
        
        // Normalize to -180 to 180 range
        while (newRotation > 180) newRotation -= 360;
        while (newRotation < -180) newRotation += 360;
        
        // Snap to 15° increments if Shift is held
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        
        onTransform({
          ...initialTransform,
          rotation: newRotation,
        });
      } else {
        // Handle scaling - work in canvas coordinates
        const deltaX = (e.clientX - dragStart.x) / displayScale;
        const deltaY = (e.clientY - dragStart.y) / displayScale;
        // Handle scaling
        const isCorner = activeHandle?.includes('-') && activeHandle !== 'top' && activeHandle !== 'bottom';
        const isUniformScaling = e.shiftKey || isCorner;
        const isCenterScaling = e.altKey;

        let newWidth = initialTransform.width;
        let newHeight = initialTransform.height;
        let newX = initialTransform.x;
        let newY = initialTransform.y;

        // Calculate scale change based on handle
        if (activeHandle?.includes('right')) {
          newWidth = Math.max(50, initialTransform.width + deltaX);
        } else if (activeHandle?.includes('left')) {
          newWidth = Math.max(50, initialTransform.width - deltaX);
          if (!isCenterScaling) {
            newX = initialTransform.x + deltaX;
          }
        }

        if (activeHandle?.includes('bottom')) {
          newHeight = Math.max(100, initialTransform.height + deltaY);
        } else if (activeHandle?.includes('top')) {
          newHeight = Math.max(100, initialTransform.height - deltaY);
          if (!isCenterScaling) {
            newY = initialTransform.y + deltaY;
          }
        }

        // Uniform scaling - maintain aspect ratio
        if (isUniformScaling) {
          const scaleX = newWidth / initialTransform.width;
          const scaleY = newHeight / initialTransform.height;
          const scale = Math.max(scaleX, scaleY);
          
          newWidth = initialTransform.width * scale;
          newHeight = initialTransform.height * scale;
        }

        // Center scaling - scale from center point
        if (isCenterScaling) {
          const widthDiff = newWidth - initialTransform.width;
          const heightDiff = newHeight - initialTransform.height;
          
          newX = initialTransform.x - widthDiff / 2;
          newY = initialTransform.y - heightDiff / 2;
        }

        // Calculate final scale
        const scale = newWidth / 700; // Assuming base width is 700
        
        // Clamp scale to limits
        if (scale >= minScale && scale <= maxScale) {
          onTransform({
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            rotation: initialTransform.rotation,
            scale,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
      setDragStart(null);
      setInitialRotation(0);
      setInitialTransform(null);
      onTransformEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, dragStart, initialTransform, initialRotation, displayScale, displayX, displayY, displayWidth, displayHeight, onTransform, onTransformEnd, minScale, maxScale]);

  // Render handle
  const renderHandle = (type: HandleType, style: React.CSSProperties) => {
    if (!showScaleHandles && type !== 'rotation') return null;
    if (!showRotationHandle && type === 'rotation') return null;

    const isRotation = type === 'rotation';
    
    return (
      <div
        className={`absolute ${
          isRotation 
            ? 'w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab hover:scale-125 transition-transform'
            : 'bg-white border-2 border-blue-500 rounded hover:bg-blue-50 transition-colors'
        }`}
        style={{
          width: isRotation ? '16px' : `${HANDLE_SIZE}px`,
          height: isRotation ? '16px' : `${HANDLE_SIZE}px`,
          ...style,
          cursor: isRotation ? 'grab' : getCursor(type),
          zIndex: 10,
        }}
        onMouseDown={(e) => handleMouseDown(type, e)}
      />
    );
  };

  // Get cursor style for handle
  const getCursor = (type: HandleType): string => {
    const cursors: Record<string, string> = {
      'top-left': 'nwse-resize',
      'top': 'ns-resize',
      'top-right': 'nesw-resize',
      'right': 'ew-resize',
      'bottom-right': 'nwse-resize',
      'bottom': 'ns-resize',
      'bottom-left': 'nesw-resize',
      'left': 'ew-resize',
    };
    return cursors[type as string] || 'default';
  };

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none"
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: 50,
      }}
    >
      {/* Bounding box - using outline to render outside the bounds */}
      <div 
        className="absolute pointer-events-none" 
        style={{
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          outline: '2px dashed #3b82f6',
          outlineOffset: '4px',
          borderRadius: '2px',
        }} 
      />

      {/* Rotation handle (top center, extended above box) */}
      {showRotationHandle && renderHandle('rotation', {
        left: `${displayWidth / 2 - 8}px`,
        top: `-${ROTATION_HANDLE_DISTANCE}px`,
        pointerEvents: 'auto',
      })}

      {/* Rotation handle connector line */}
      {showRotationHandle && (
        <div
          className="absolute bg-blue-500"
          style={{
            left: `${displayWidth / 2 - 1}px`,
            top: `-${ROTATION_HANDLE_DISTANCE - 8}px`,
            width: '2px',
            height: `${ROTATION_HANDLE_DISTANCE - 8}px`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Corner handles - positioned on center of dotted outline */}
      {!hideTopBottomHandles && renderHandle('top-left', {
        left: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        top: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        pointerEvents: 'auto',
      })}
      {!hideTopBottomHandles && renderHandle('top-right', {
        right: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        top: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        pointerEvents: 'auto',
      })}
      {!hideTopBottomHandles && renderHandle('bottom-right', {
        right: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        bottom: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        pointerEvents: 'auto',
      })}
      {!hideTopBottomHandles && renderHandle('bottom-left', {
        left: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        bottom: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        pointerEvents: 'auto',
      })}

      {/* Side handles - positioned on center of dotted outline */}
      {!hideTopBottomHandles && renderHandle('top', {
        left: `${displayWidth / 2 - HANDLE_SIZE / 2}px`,
        top: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        pointerEvents: 'auto',
      })}
      {renderHandle('right', {
        right: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        top: `${displayHeight / 2 - HANDLE_SIZE / 2}px`,
        pointerEvents: 'auto',
      })}
      {!hideTopBottomHandles && renderHandle('bottom', {
        left: `${displayWidth / 2 - HANDLE_SIZE / 2}px`,
        bottom: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        pointerEvents: 'auto',
      })}
      {renderHandle('left', {
        left: `-${HANDLE_SIZE / 2 + OUTLINE_OFFSET}px`,
        top: `${displayHeight / 2 - HANDLE_SIZE / 2}px`,
        pointerEvents: 'auto',
      })}
    </div>
  );
}
