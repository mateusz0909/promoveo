import { useEffect, useMemo, useRef, useState } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { isTextElement, type TextElement } from '@/context/studio-editor/elementTypes';
import { ensureFontLoaded } from '@/lib/fonts';
import { getCanvasMetrics } from './canvas/utils';

interface CanvasTextEditorProps {
  screenshotIndex: number;
  elementType: 'heading' | 'subheading';
  onClose: () => void;
}

export function CanvasTextEditor({ onClose }: CanvasTextEditorProps) {
  const { selection, getSelectedElement, updateElement, view, global } = useStudioEditor();
  const metrics = useMemo(() => getCanvasMetrics(global.deviceFrame), [global.deviceFrame]);
  const fontScaleMultiplier = metrics.fontScaleMultiplier;
  const defaultTextWidth = metrics.defaultTextWidth;
  const canvasWidth = metrics.width;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [displayScale, setDisplayScale] = useState(() => 350 / canvasWidth);

  const zoom = view.zoom ?? 1;

  const selectedElement = getSelectedElement();
  const textElement: TextElement | null = selectedElement && isTextElement(selectedElement)
    ? selectedElement
    : null;

  useEffect(() => {
    if (textElement) {
      setValue(textElement.text);
    }
  }, [textElement]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const activeFontFamily = textElement?.fontFamily;
  const activeFontWeight = textElement?.fontWeight ?? (textElement?.isBold ? 700 : 400);
  const activeFontSize = textElement?.fontSize;

  useEffect(() => {
    if (!activeFontFamily || !activeFontSize) {
      return;
    }

    void ensureFontLoaded(activeFontFamily, {
      weight: activeFontWeight,
      size: activeFontSize * fontScaleMultiplier,
    });
  }, [activeFontFamily, activeFontWeight, activeFontSize, fontScaleMultiplier]);

  useEffect(() => {
    const parent = textareaRef.current?.parentElement;
    const canvasElement = parent?.querySelector('canvas');

    if (canvasElement) {
      const logicalWidth = canvasElement.width || canvasWidth;
      const rect = canvasElement.getBoundingClientRect();
      const baseScale = rect.width / (logicalWidth * zoom);
      setDisplayScale(baseScale);
    }
  }, [zoom, canvasWidth, textElement]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, displayScale]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setValue(nextValue);

    if (selection.screenshotIndex !== null && selection.elementId) {
      updateElement(selection.screenshotIndex, selection.elementId, {
        text: nextValue,
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
    event.stopPropagation();
  };

  const handleBlur = () => {
    onClose();
  };

  if (!textElement) {
    return null;
  }

  const { position } = textElement;
  const fontSize = textElement.fontSize;
  const color = textElement.color;
  const fontFamily = textElement.fontFamily;
  const fontWeight = textElement.fontWeight ?? (textElement.isBold ? 700 : 400);
  const align = textElement.align || 'left';
  const lineHeight = textElement.lineHeight || 1.2;

  const displayFontSize = fontSize * fontScaleMultiplier * displayScale;
  const ascent = displayFontSize * 0.8;
  const displayY = `${position.y * displayScale - ascent}px`;

  const logicalTextWidth = textElement.width ?? defaultTextWidth;
  const textareaWidth = logicalTextWidth * displayScale;

  let displayX: string;
  if (align === 'left') {
    displayX = `${position.x * displayScale}px`;
  } else if (align === 'center') {
    displayX = `${position.x * displayScale - textareaWidth / 2}px`;
  } else {
    displayX = `${position.x * displayScale - textareaWidth}px`;
  }

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
        fontFamily,
        color,
        fontWeight,
        textAlign: align,
        width: `${textareaWidth}px`,
        height: 'auto',
        lineHeight,
        letterSpacing: `${(textElement.letterSpacing || 0) * fontScaleMultiplier * displayScale}px`,
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
