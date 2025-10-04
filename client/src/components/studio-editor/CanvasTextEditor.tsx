import { useEffect, useRef, useState } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';

interface CanvasTextEditorProps {
  screenshotIndex: number;
  elementType: 'heading' | 'subheading';
  onClose: () => void;
}

export function CanvasTextEditor({
  screenshotIndex,
  elementType,
  onClose,
}: CanvasTextEditorProps) {
  const { screenshots, updateScreenshotText } = useStudioEditor();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [displayScale, setDisplayScale] = useState(350 / 1200); // Default fallback

  const screenshot = screenshots[screenshotIndex];
  const isHeading = elementType === 'heading';

  useEffect(() => {
    const initialValue = isHeading ? screenshot.heading : screenshot.subheading;
    setValue(initialValue);
  }, [screenshot, isHeading]);

  useEffect(() => {
    // Focus the textarea when it mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Calculate display scale based on actual canvas size
  useEffect(() => {
    // Find the canvas element in the parent container
    const parentDiv = textareaRef.current?.parentElement;
    const canvasElement = parentDiv?.querySelector('canvas');
    
    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      const scale = rect.width / 1200; // 1200 is the canvas logical width
      setDisplayScale(scale);
    }
  }, []);

  // Auto-resize textarea height to fit content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to recalculate
      textarea.style.height = 'auto';
      // Set to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, displayScale]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    updateScreenshotText(screenshotIndex, elementType, newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter for new lines
    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    // Prevent other shortcuts from bubbling up
    e.stopPropagation();
  };

  const handleBlur = () => {
    // Close editor when clicking outside
    onClose();
  };

  // Get actual position and styling from screenshot
  const position = isHeading ? screenshot.headingPosition : screenshot.subheadingPosition;
  const fontSize = isHeading ? screenshot.headingFontSize : screenshot.subheadingFontSize;
  const color = isHeading ? screenshot.headingColor : screenshot.subheadingColor;
  
  // Canvas is 1200px wide logically
  const CANVAS_WIDTH = 1200;
  const FONT_SCALE = 3.4; // Canvas font scale multiplier
  
  // Use calculated display scale
  const displayFontSize = fontSize * FONT_SCALE * displayScale;
  const baseY = elementType === 'heading' ? 150 : 400;
  
  // Position relative to canvas center
  const displayX = `calc(50% + ${position.x * displayScale}px)`;
  const displayY = `${(baseY + position.y) * displayScale}px`;

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      data-canvas-text-editor="true"
      className="absolute z-50 bg-transparent border-none outline-none resize-none"
      style={{
        left: displayX,
        top: displayY,
        transform: 'translateX(-50%)',
        fontSize: `${displayFontSize}px`,
        fontFamily: screenshot.fontFamily,
        color: color,
        fontWeight: isHeading ? 'bold' : 'normal',
        textAlign: 'center',
        width: `${CANVAS_WIDTH * displayScale * 0.9}px`,
        height: 'auto',
        lineHeight: '1.2',
        padding: '0',
        margin: '0',
        border: '0',
        caretColor: color,
        WebkitTextFillColor: color,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflow: 'hidden',
        overflowWrap: 'break-word',
        boxSizing: 'border-box',
        display: 'block',
      }}
    />
  );
}
