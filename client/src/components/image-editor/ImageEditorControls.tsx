import type { ImageEditorTheme, ImageLayout } from "@/types/project";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
  layout: ImageLayout;
  onLayoutChange: (layout: ImageLayout) => void;
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
  layout,
  onLayoutChange,
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
    <div className="col-span-4 h-full w-full flex flex-col overflow-hidden p-3 rounded-md border">
      <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide">Controls</h3>
      
      {/* Top Controls Grid - Theme, Layout, AI */}
      <div className="grid grid-cols-2 gap-2 pb-2 border-b mb-2">
        {/* Theme */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Theme</Label>
          <ThemeSelector selectedTheme={selectedTheme} setSelectedTheme={onThemeChange} />
        </div>

        {/* Layout */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Layout</Label>
          <Select value={layout} onValueChange={onLayoutChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text-top" className="text-xs">
                Text on Top
              </SelectItem>
              <SelectItem value="text-bottom" className="text-xs">
                Text on Bottom
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* AI Generation */}
        {onRegenerateContent && (
          <div className="col-span-2 space-y-1">
            <Label className="text-[10px] text-muted-foreground">AI Generation</Label>
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
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {/* Heading Section */}
        <div className="space-y-1.5 pb-2 border-b">
          <Label className="text-xs font-semibold">Heading</Label>
          <div className="space-y-1.5">
            <div>
              <Label htmlFor="heading-text" className="text-[10px] text-muted-foreground">Text</Label>
              <Textarea 
                id="heading-text" 
                value={heading} 
                onChange={(e) => onHeadingChange(e.target.value)}
                className="min-h-[50px] text-xs resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Label htmlFor="heading-font" className="text-[10px] text-muted-foreground">Font</Label>
                <Select value={headingFont} onValueChange={onHeadingFontChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Font" />
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
                <Label htmlFor="heading-font-size" className="text-[10px] text-muted-foreground">Size</Label>
                <Select
                  value={headingFontSize.toString()}
                  onValueChange={handleHeadingSize}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue>
                      {headingFontSize}px
                    </SelectValue>
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
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Subheading</Label>
          <div className="space-y-1.5">
            <div>
              <Label htmlFor="subheading-text" className="text-[10px] text-muted-foreground">Text</Label>
              <Textarea 
                id="subheading-text" 
                value={subheading} 
                onChange={(e) => onSubheadingChange(e.target.value)}
                className="min-h-[50px] text-xs resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Label htmlFor="subheading-font" className="text-[10px] text-muted-foreground">Font</Label>
                <Select value={subheadingFont} onValueChange={onSubheadingFontChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Font" />
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
                <Label htmlFor="subheading-font-size" className="text-[10px] text-muted-foreground">Size</Label>
                <Select
                  value={subheadingFontSize.toString()}
                  onValueChange={handleSubheadingSize}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue>
                      {subheadingFontSize}px
                    </SelectValue>
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
    </div>
  );
};
