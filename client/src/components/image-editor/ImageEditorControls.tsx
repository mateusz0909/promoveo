import type { ImageEditorTheme } from "@/types/project";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ThemeSelector } from "../ThemeSelector";
import { SparklesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const PRESET_FONT_SIZES = [
  32,
  36,
  48,
  60,
  72,
  96,
  120,
  144,
  160,
  175,
  190,
  210,
  230,
  250,
];

interface ImageEditorControlsProps {
  fonts: string[];
  heading: string;
  onHeadingChange: (value: string) => void;
  headingFont: string;
  onHeadingFontChange: (value: string) => void;
  headingFontSize: number;
  onHeadingFontSizeChange: (value: number) => void;
  subheading: string;
  onSubheadingChange: (value: string) => void;
  subheadingFont: string;
  onSubheadingFontChange: (value: string) => void;
  subheadingFontSize: number;
  onSubheadingFontSizeChange: (value: number) => void;
  selectedTheme: ImageEditorTheme;
  onThemeChange: (theme: ImageEditorTheme) => void;
  onRegenerateContent?: (style: 'concise' | 'detailed') => void;
  isRegenerating?: boolean;
}

export const ImageEditorControls = ({
  fonts,
  heading,
  onHeadingChange,
  headingFont,
  onHeadingFontChange,
  headingFontSize,
  onHeadingFontSizeChange,
  subheading,
  onSubheadingChange,
  subheadingFont,
  onSubheadingFontChange,
  subheadingFontSize,
  onSubheadingFontSizeChange,
  selectedTheme,
  onThemeChange,
  onRegenerateContent,
  isRegenerating = false,
}: ImageEditorControlsProps) => {
  const handleHeadingSize = (value: string) => {
    onHeadingFontSizeChange(parseInt(value, 10) || 0);
  };

  const handleSubheadingSize = (value: string) => {
    onSubheadingFontSizeChange(parseInt(value, 10) || 0);
  };

  return (
    <div className="col-span-4 h-full w-full flex flex-col overflow-y-auto space-y-3 p-3 rounded-md border">
      <h3 className="text-xs font-semibold mb-1 uppercase tracking-wide">Controls</h3>
      
      {/* Theme Section */}
      <div className="space-y-1">
        <Label className="text-xs">Theme</Label>
        <ThemeSelector selectedTheme={selectedTheme} setSelectedTheme={onThemeChange} />
      </div>
      
      {/* AI Generation Section */}
      {onRegenerateContent && (
        <div className="space-y-1.5 pb-2 border-b">
          <Label className="text-xs text-muted-foreground">AI Generation</Label>
          <div className="grid grid-cols-2 gap-1.5">
            <Button 
              onClick={() => onRegenerateContent('concise')} 
              disabled={isRegenerating}
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2"
            >
              <SparklesIcon className="h-3.5 w-3.5 mr-1" />
              {isRegenerating ? "..." : "Concise"}
            </Button>
            <Button 
              onClick={() => onRegenerateContent('detailed')} 
              disabled={isRegenerating}
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2"
            >
              <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
              {isRegenerating ? "..." : "Detailed"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Heading Section */}
      <div className="space-y-2 pb-2 border-b">
        <Label className="text-xs font-semibold">Heading</Label>
        <div className="space-y-1.5">
          <div>
            <Label htmlFor="heading-text" className="text-xs text-muted-foreground">Text</Label>
            <Textarea 
              id="heading-text" 
              value={heading} 
              onChange={(e) => onHeadingChange(e.target.value)}
              className="min-h-[60px] text-xs"
            />
          </div>
          <div>
            <Label htmlFor="heading-font" className="text-xs text-muted-foreground">Font</Label>
            <Select value={headingFont} onValueChange={onHeadingFontChange}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((font) => (
                  <SelectItem key={font} value={font} className="text-xs">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="heading-font-size" className="text-xs text-muted-foreground">Size</Label>
            <div className="flex gap-1.5">
              <Input
                id="heading-font-size"
                type="number"
                value={headingFontSize}
                onChange={(e) => handleHeadingSize(e.target.value)}
                className="h-9 text-xs"
              />
              <Select
                value={PRESET_FONT_SIZES.includes(headingFontSize) ? headingFontSize.toString() : undefined}
                onValueChange={handleHeadingSize}
              >
                <SelectTrigger className="w-[100px] h-9 text-xs">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()} className="text-xs">
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subheading Section */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Subheading</Label>
        <div className="space-y-1.5">
          <div>
            <Label htmlFor="subheading-text" className="text-xs text-muted-foreground">Text</Label>
            <Textarea 
              id="subheading-text" 
              value={subheading} 
              onChange={(e) => onSubheadingChange(e.target.value)}
              className="min-h-[60px] text-xs"
            />
          </div>
          <div>
            <Label htmlFor="subheading-font" className="text-xs text-muted-foreground">Font</Label>
            <Select value={subheadingFont} onValueChange={onSubheadingFontChange}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((font) => (
                  <SelectItem key={font} value={font} className="text-xs">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subheading-font-size" className="text-xs text-muted-foreground">Size</Label>
            <div className="flex gap-1.5">
              <Input
                id="subheading-font-size"
                type="number"
                value={subheadingFontSize}
                onChange={(e) => handleSubheadingSize(e.target.value)}
                className="h-9 text-xs"
              />
              <Select
                value={PRESET_FONT_SIZES.includes(subheadingFontSize) ? subheadingFontSize.toString() : undefined}
                onValueChange={handleSubheadingSize}
              >
                <SelectTrigger className="w-[100px] h-9 text-xs">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()} className="text-xs">
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
