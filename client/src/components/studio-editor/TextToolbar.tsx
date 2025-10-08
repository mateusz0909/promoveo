import { useEffect, useMemo } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
} from '@heroicons/react/24/outline';
import { ColorPickerDropdown } from './ColorPickerDropdown';
import { isTextElement, type TextElement } from '@/context/studio-editor/elementTypes';
import { getCanvasMetrics } from './canvas/utils';
import { FONT_FAMILIES, ensureFontLoaded, preloadFontFamilies } from '@/lib/fonts';

const FONT_SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '24', '32', '36', '40', '48', '64', '96', '128'];
const FONT_WEIGHTS = [
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semi Bold', value: 600 },
  { label: 'Bold', value: 700 },
];

export function TextToolbar() {
  const { 
    selection,
    getSelectedElement,
    getSelectedElements,
    updateElement,
    global,
  } = useStudioEditor();

  const { fontScaleMultiplier, defaultTextWidth } = useMemo(() => {
    const metrics = getCanvasMetrics(global.deviceFrame);
    return {
      fontScaleMultiplier: metrics.fontScaleMultiplier,
      defaultTextWidth: metrics.defaultTextWidth,
    };
  }, [global.deviceFrame]);

  const selectedElement = getSelectedElement();
  const selectedElements = getSelectedElements();
  const selectedTextElements = selectedElements.filter((el): el is TextElement => isTextElement(el));
  const selectedTextElementIds = new Set(selectedTextElements.map((el) => el.id));

  const textElement = (() => {
    if (selectedElement && isTextElement(selectedElement)) {
      return selectedElement as TextElement;
    }

    if (selection.elementId && selectedTextElementIds.has(selection.elementId)) {
      return selectedTextElements.find((el) => el.id === selection.elementId) ?? null;
    }

    return selectedTextElements[0] ?? null;
  })();

  useEffect(() => {
    void preloadFontFamilies(FONT_FAMILIES);
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

  // Only show toolbar if a text element is selected
  if (!textElement) {
    return null;
  }

  // Handler functions for updating text properties
  const handleUpdate = (updates: Partial<TextElement>) => {
    const { screenshotIndex } = selection;
    if (screenshotIndex === null) {
      return;
    }

    const baseIds = selection.selectedElementIds.length
      ? selection.selectedElementIds
      : textElement
      ? [textElement.id]
      : [];

    const targetElementIds = baseIds.filter((id) => selectedTextElementIds.has(id));

    if (targetElementIds.length === 0 && textElement) {
      targetElementIds.push(textElement.id);
    }

    targetElementIds.forEach((elementId) => {
      void updateElement(screenshotIndex, elementId, updates);
    });
  };

  const handleFontChange = async (fontFamily: string) => {
  const sizeForLoading = (activeFontSize ?? textElement.fontSize) * fontScaleMultiplier;

    await ensureFontLoaded(fontFamily, {
      weight: activeFontWeight,
      size: sizeForLoading,
    });

    handleUpdate({ fontFamily });
  };

  const handleFontWeightChange = async (weightValue: string) => {
    const parsedWeight = parseInt(weightValue, 10) as 300 | 400 | 500 | 600 | 700;

    await ensureFontLoaded(textElement.fontFamily, {
      weight: parsedWeight,
      size: (activeFontSize ?? textElement.fontSize) * fontScaleMultiplier,
    });

    handleUpdate({
      fontWeight: parsedWeight,
      isBold: parsedWeight >= 600,
    });
  };

  const handleSizeChange = (fontSize: string) => {
    handleUpdate({ fontSize: parseInt(fontSize, 10) });
  };

  const handleColorChange = (color: string) => {
    handleUpdate({ color });
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    if (selection.screenshotIndex === null || !textElement) {
      return;
    }

    const { screenshotIndex } = selection;
    const textElementMap = new Map(selectedTextElements.map((el) => [el.id, el] as const));

    const baseIds = selection.selectedElementIds.length
      ? selection.selectedElementIds
      : [textElement.id];

    const targetIds = baseIds.filter((id) => selectedTextElementIds.has(id));
    const effectiveIds = targetIds.length > 0 ? targetIds : [textElement.id];

    effectiveIds.forEach((elementId) => {
      const element = textElementMap.get(elementId) ?? textElement;
  const frameWidth = element.width ?? defaultTextWidth;

      let currentLeft = element.position.x;
      if (element.align === 'center') {
        currentLeft = element.position.x - frameWidth / 2;
      } else if (element.align === 'right') {
        currentLeft = element.position.x - frameWidth;
      }

      let newX = currentLeft;
      if (align === 'center') {
        newX = currentLeft + frameWidth / 2;
      } else if (align === 'right') {
        newX = currentLeft + frameWidth;
      }

      void updateElement(screenshotIndex, elementId, {
        align,
        position: {
          ...element.position,
          x: newX,
        },
      });
    });
  };

  const handleLetterSpacingChange = (letterSpacing: number) => {
    handleUpdate({ letterSpacing });
  };

  const handleLineHeightChange = (lineHeight: number) => {
    handleUpdate({ lineHeight });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-l">
      {selectedTextElements.length > 1 && (
        <span className="text-sm text-neutral-500 pr-3 mr-1 border-r border-neutral-200">
          {selectedTextElements.length} text layers
        </span>
      )}

      {/* Font Family */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Font:</label>
        <Select value={textElement.fontFamily} onValueChange={handleFontChange}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Weight */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Weight:</label>
        <Select value={(textElement.fontWeight ?? 400).toString()} onValueChange={handleFontWeightChange}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_WEIGHTS.map(({ label, value }) => (
              <SelectItem key={value} value={value.toString()}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Size:</label>
        <Select value={textElement.fontSize.toString()} onValueChange={handleSizeChange}>
          <SelectTrigger className="w-24 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Color:</label>
        <ColorPickerDropdown 
          value={textElement.color}
          onChange={handleColorChange}
        />
      </div>

      {/* Letter Spacing */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Spacing:</label>
        <input
          type="number"
          value={textElement.letterSpacing}
          onChange={(e) => handleLetterSpacingChange(parseFloat(e.target.value) || 0)}
          className="w-16 px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          step="0.5"
          min="-10"
          max="20"
        />
      </div>

      {/* Line Height */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Height:</label>
        <input
          type="number"
          value={textElement.lineHeight}
          onChange={(e) => handleLineHeightChange(parseFloat(e.target.value) || 1.2)}
          className="w-16 px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          step="0.1"
          min="0.5"
          max="3"
        />
      </div>

      {/* Text Alignment */}
      <div className="flex items-center gap-1 border-l pl-3">
        <Button
          variant={textElement.align === 'left' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          title="Align Left"
          onClick={() => handleAlignChange('left')}
        >
          <Bars3BottomLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={textElement.align === 'center' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          title="Align Center"
          onClick={() => handleAlignChange('center')}
        >
          <Bars3Icon className="h-4 w-4" />
        </Button>
        <Button
          variant={textElement.align === 'right' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          title="Align Right"
          onClick={() => handleAlignChange('right')}
        >
          <Bars3BottomRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}