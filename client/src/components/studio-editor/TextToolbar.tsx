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
    screenshots, 
    selection, 
    updateScreenshotFont, 
    updateScreenshotFontSize, 
    updateScreenshotColor, 
    updateScreenshotAlign, 
    updateScreenshotLetterSpacing, 
    updateScreenshotLineHeight,
    updateScreenshotFontBulk,
    updateScreenshotFontSizeBulk,
    updateScreenshotColorBulk,
    updateScreenshotAlignBulk,
    updateScreenshotLetterSpacingBulk,
    updateScreenshotLineHeightBulk
  } = useStudioEditor();

  if (selection.screenshotIndex === null || !selection.elementType) {
    return null;
  }

  // Check if we're in multi-select mode
  const isMultiSelect = selection.multiSelect.length > 1;
  const selectedCount = selection.multiSelect.length;

  const screenshot = screenshots[selection.screenshotIndex];
  const isHeading = selection.elementType === 'heading';
  const currentFont = screenshot.fontFamily;
  const currentFontSize = isHeading ? screenshot.headingFontSize : screenshot.subheadingFontSize;
  const currentColor = isHeading ? screenshot.headingColor : screenshot.subheadingColor;
  const currentAlign = isHeading ? screenshot.headingAlign : screenshot.subheadingAlign;
  const currentLetterSpacing = isHeading ? screenshot.headingLetterSpacing : screenshot.subheadingLetterSpacing;
  const currentLineHeight = isHeading ? screenshot.headingLineHeight : screenshot.subheadingLineHeight;

  const handleFontChange = (newFont: string) => {
    if (isMultiSelect) {
      updateScreenshotFontBulk(newFont, selection.multiSelect);
    } else if (selection.screenshotIndex !== null) {
      updateScreenshotFont(selection.screenshotIndex, newFont);
    }
  };

  const handleSizeChange = (newSize: string) => {
    if (isMultiSelect) {
      updateScreenshotFontSizeBulk(parseInt(newSize, 10), selection.multiSelect);
    } else if (selection.screenshotIndex !== null) {
      updateScreenshotFontSize(
        selection.screenshotIndex,
        isHeading ? 'heading' : 'subheading',
        parseInt(newSize, 10)
      );
    }
  };

  const handleColorChange = (color: string) => {
    if (isMultiSelect) {
      updateScreenshotColorBulk(color, selection.multiSelect);
    } else if (selection.screenshotIndex !== null) {
      updateScreenshotColor(
        selection.screenshotIndex,
        isHeading ? 'heading' : 'subheading',
        color
      );
    }
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    if (isMultiSelect) {
      updateScreenshotAlignBulk(align, selection.multiSelect);
    } else if (selection.screenshotIndex !== null) {
      updateScreenshotAlign(
        selection.screenshotIndex,
        isHeading ? 'heading' : 'subheading',
        align
      );
    }
  };

  const handleLetterSpacingChange = (spacing: number) => {
    if (isMultiSelect) {
      updateScreenshotLetterSpacingBulk(spacing, selection.multiSelect);
    } else if (selection.screenshotIndex !== null) {
      updateScreenshotLetterSpacing(
        selection.screenshotIndex,
        isHeading ? 'heading' : 'subheading',
        spacing
      );
    }
  };

  const handleLineHeightChange = (lineHeight: number) => {
    if (isMultiSelect) {
      updateScreenshotLineHeightBulk(lineHeight, selection.multiSelect);
    } else if (selection.screenshotIndex !== null) {
      updateScreenshotLineHeight(
        selection.screenshotIndex,
        isHeading ? 'heading' : 'subheading',
        lineHeight
      );
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-l">
      {/* Multi-select indicator */}
      {isMultiSelect && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-xs font-medium text-blue-700">
            {selectedCount} items selected
          </span>
        </div>
      )}
      
      {/* Font Family */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Font:</label>
        <Select value={currentFont} onValueChange={handleFontChange}>
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
        <Select value={currentFontSize.toString()} onValueChange={handleSizeChange}>
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
          value={currentColor}
          onChange={handleColorChange}
        />
      </div>

      {/* Letter Spacing */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Spacing:</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={currentLetterSpacing}
            onChange={(e) => handleLetterSpacingChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.5"
            min="-10"
            max="20"
          />
     
        </div>
      </div>

      {/* Line Height */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-600">Height:</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={currentLineHeight}
            onChange={(e) => handleLineHeightChange(parseFloat(e.target.value) || 1.2)}
            className="w-16 px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.1"
            min="0.5"
            max="3"
          />
        </div>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center gap-1 border-l pl-3">
        <Button
          variant={currentAlign === 'left' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          title="Align Left"
          onClick={() => handleAlignChange('left')}
        >
          <Bars3BottomLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={currentAlign === 'center' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          title="Align Center"
          onClick={() => handleAlignChange('center')}
        >
          <Bars3Icon className="h-4 w-4" />
        </Button>
        <Button
          variant={currentAlign === 'right' ? 'default' : 'ghost'}
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