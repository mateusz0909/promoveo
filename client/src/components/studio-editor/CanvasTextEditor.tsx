import { useEffect, useRef, useState } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { isTextElement, type TextElement } from '@/context/studio-editor/elementTypes';

interface CanvasTextEditorProps {
  screenshotIndex: number;
  elementType: 'heading' | 'subheading'; // Legacy prop, not used anymore
  onClose: () => void;
}

export function CanvasTextEditor({
  onClose,
}: CanvasTextEditorProps) {
  const { selection, getSelectedElement, updateElement } = useStudioEditor();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [displayScale, setDisplayScale] = useState(350 / 1200); // Default fallback

  // Get the selected text element
  const selectedElement = getSelectedElement();
  
  // Only proceed if we have a valid text element selected
  if (!selectedElement || !isTextElement(selectedElement)) {
    return null;
  }

  const textElement = selectedElement as TextElement;

  useEffect(() => {
    setValue(textElement.text);
  }, [textElement.text]);

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
    
    // Update element text via unified API
    if (selection.screenshotIndex !== null && selection.elementId) {
      updateElement(selection.screenshotIndex, selection.elementId, {
        text: newValue,
      });
    }
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

  // Get position and styling from text element
  const position = textElement.position;
  const fontSize = textElement.fontSize;
  const color = textElement.color;
  const fontFamily = textElement.fontFamily;
  const isBold = textElement.isBold;
  const align = textElement.align || 'left';
  const lineHeight = textElement.lineHeight || 1.2;
  
  // Canvas is 1200px wide logically
  const CANVAS_WIDTH = 1200;
  const FONT_SCALE = 3.4; // Canvas font scale multiplier
  
  // Calculate display position and font size
  const displayFontSize = fontSize * FONT_SCALE * displayScale;
  
  // Canvas renders text with fillText(x, y) where y is the BASELINE
  // Textarea positions from TOP-LEFT corner
  // The ascent (distance from top to baseline) is approximately 0.8 of font size
  const ascent = displayFontSize * 0.8;
  
  // Calculate Y position: canvas Y is baseline, textarea Y is top
  // So we need to subtract the ascent to get the top position
  const displayY = `${(position.y * displayScale) - ascent}px`;
  
  // Canvas textAlign affects how X position is interpreted:
  // - 'left': X is at left edge of text
  // - 'center': X is at center of text  
  // - 'right': X is at right edge of text
  // For textarea, we always position from left edge, but text-align CSS handles alignment
  
  // The textarea width should be the max text width allowed (90% of canvas)
  const textareaWidth = CANVAS_WIDTH * displayScale * 0.9;
  
  // Calculate left position based on alignment
  let displayX: string;
  if (align === 'left') {
    // Canvas X is already at left edge, use as-is
    displayX = `${position.x * displayScale}px`;
  } else if (align === 'center') {
    // Canvas X is at center of text, textarea needs to start at (center - width/2)
    displayX = `${(position.x * displayScale) - (textareaWidth / 2)}px`;
  } else { // 'right'
    // Canvas X is at right edge, textarea needs to start at (right - width)
    displayX = `${(position.x * displayScale) - textareaWidth}px`;
  }
  // For 'left' alignment, no adjustment needed - both use left edge

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
        fontSize: `${displayFontSize}px`,
        fontFamily: fontFamily,
        color: color,
        fontWeight: isBold ? 'bold' : 'normal',
        textAlign: align,
        width: `${textareaWidth}px`,
        height: 'auto',
        lineHeight: lineHeight,
        letterSpacing: `${(textElement.letterSpacing || 0) * FONT_SCALE * displayScale}px`,
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
