import type { MouseEventHandler, RefObject } from "react";

interface ImageEditorCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  device?: string;
  onMouseDown: MouseEventHandler<HTMLCanvasElement>;
  onMouseMove: MouseEventHandler<HTMLCanvasElement>;
  onMouseUp: MouseEventHandler<HTMLCanvasElement>;
  onMouseLeave: MouseEventHandler<HTMLCanvasElement>;
}

export const ImageEditorCanvas = ({
  canvasRef,
  device,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}: ImageEditorCanvasProps) => {
  const width = device === "iPad" ? 2048 : 1284;
  const height = device === "iPad" ? 2732 : 2778;

  return (
    <div className="col-span-8 h-full rounded-md overflow-hidden flex items-center justify-center bg-muted">
      <canvas
        ref={canvasRef}
        className="h-full object-contain"
        width={width}
        height={height}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
};
