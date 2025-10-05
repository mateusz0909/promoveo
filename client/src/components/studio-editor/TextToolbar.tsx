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
import { Input } from '@/components/ui/input';

const FONT_FAMILIES = [
  'Inter',
  'Montserrat',
  'Roboto',
  'Lato',
  'Open Sans',
  'Farro',
  'Headland One',
  'Nexa',
];

const FONT_SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '24', '32', '36', '40', '48', '64', '96', '128'];

export function TextToolbar() {
  const { 
    selection,
    getSelectedElement,
    updateElement,
  } = useStudioEditor();

  // Get the selected element
  const selectedElement = getSelectedElement();
  
  // Only show toolbar if a text element is selected
  if (!selectedElement || !isTextElement(selectedElement)) {
    return null;
  }

  const textElement = selectedElement as TextElement;

  // Handler functions for updating text properties
  const handleUpdate = (updates: Partial<TextElement>) => {
    if (selection.screenshotIndex !== null && selection.elementId) {
      updateElement(selection.screenshotIndex, selection.elementId, updates);
    }
  };

  const handleFontChange = (fontFamily: string) => {
    handleUpdate({ fontFamily });
  };

  const handleSizeChange = (fontSize: string) => {
    handleUpdate({ fontSize: parseInt(fontSize, 10) });
  };

  const handleColorChange = (color: string) => {
    handleUpdate({ color });
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    handleUpdate({ align });
  };

  const handleLetterSpacingChange = (letterSpacing: number) => {
    handleUpdate({ letterSpacing });
  };

  const handleLineHeightChange = (lineHeight: number) => {
    handleUpdate({ lineHeight });
  };

  const handleTextChange = (text: string) => {
    handleUpdate({ text });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-l">


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