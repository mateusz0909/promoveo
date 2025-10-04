import { useState } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const GRADIENT_DIRECTIONS = [
  { name: 'Left to Right', angle: 90, icon: ArrowRightIcon },
  { name: 'Right to Left', angle: 270, icon: ArrowLeftIcon },
  { name: 'Top to Bottom', angle: 180, icon: ArrowDownIcon },
  { name: 'Bottom to Top', angle: 0, icon: ArrowUpIcon },
];

const SOLID_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Gray', value: '#9ca3af' },
  { name: 'Dark Gray', value: '#4b5563' },
  
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Light Blue', value: '#60a5fa' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Navy', value: '#1e3a8a' },
  
  { name: 'Purple', value: '#a855f7' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Magenta', value: '#d946ef' },
  
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
];

const GRADIENT_PRESETS = [
  { name: 'Purple Dream', startColor: '#667eea', endColor: '#764ba2' },
  { name: 'Ocean Blue', startColor: '#2e3192', endColor: '#1bffff' },
  { name: 'Sunset', startColor: '#ff6b6b', endColor: '#feca57' },
  { name: 'Forest', startColor: '#134e5e', endColor: '#71b280' },
  { name: 'Rose', startColor: '#f857a6', endColor: '#ff5858' },
  { name: 'Azure', startColor: '#0575e6', endColor: '#021b79' },
  { name: 'Candy', startColor: '#ff9a9e', endColor: '#fecfef' },
  { name: 'Mint', startColor: '#00f260', endColor: '#0575e6' },
  { name: 'Peach', startColor: '#ffecd2', endColor: '#fcb69f' },
  { name: 'Lavender', startColor: '#a18cd1', endColor: '#fbc2eb' },
  { name: 'Fire', startColor: '#f12711', endColor: '#f5af19' },
  { name: 'Ice', startColor: '#89f7fe', endColor: '#66a6ff' },
];

export function BackgroundPanel() {
  const { global, updateBackground } = useStudioEditor();
  const [activeTab, setActiveTab] = useState<'color' | 'gradient' | 'image'>(
    global.backgroundType === 'solid' ? 'color' : 
    global.backgroundType === 'gradient' ? 'gradient' : 'image'
  );

  const handleSolidColorChange = (color: string) => {
    updateBackground({
      backgroundType: 'solid',
      backgroundSolid: color,
    });
  };

  const handleGradientChange = (startColor: string, endColor: string, angle?: number) => {
    updateBackground({
      backgroundType: 'gradient',
      backgroundGradient: {
        startColor,
        endColor,
        angle: angle ?? global.backgroundGradient.angle,
      },
    });
  };

  const handleGradientAngleChange = (angle: number) => {
    updateBackground({
      backgroundGradient: {
        ...global.backgroundGradient,
        angle,
      },
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="color">Color</TabsTrigger>
        <TabsTrigger value="gradient">Gradient</TabsTrigger>
        <TabsTrigger value="image">Image</TabsTrigger>
      </TabsList>

      {/* Color Tab */}
      <TabsContent value="color" className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Preset Colors</Label>
          <div className="grid grid-cols-5 gap-2">
            {SOLID_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleSolidColorChange(color.value)}
                className={`relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                  global.backgroundType === 'solid' && global.backgroundSolid === color.value
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {global.backgroundType === 'solid' && global.backgroundSolid === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Label htmlFor="custom-color" className="text-xs text-muted-foreground mb-2 block">
            Custom Color
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-2">
              <input
                type="color"
                id="custom-color"
                value={global.backgroundType === 'solid' ? global.backgroundSolid : '#ffffff'}
                onChange={(e) => handleSolidColorChange(e.target.value)}
                className="w-10 h-10 rounded-full cursor-pointer border-2 border-neutral-200"
              />
              <Input
                type="text"
                value={global.backgroundType === 'solid' ? global.backgroundSolid : '#ffffff'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    handleSolidColorChange(value);
                  }
                }}
                className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 h-auto font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Gradient Tab */}
      <TabsContent value="gradient" className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Preset Gradients</Label>
          <div className="grid grid-cols-2 gap-2">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleGradientChange(preset.startColor, preset.endColor)}
                className={`relative h-16 rounded-lg border-2 transition-all hover:scale-105 ${
                  global.backgroundType === 'gradient' &&
                  global.backgroundGradient.startColor === preset.startColor &&
                  global.backgroundGradient.endColor === preset.endColor
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${preset.startColor}, ${preset.endColor})`,
                }}
                title={preset.name}
              >
                {global.backgroundType === 'gradient' &&
                  global.backgroundGradient.startColor === preset.startColor &&
                  global.backgroundGradient.endColor === preset.endColor && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    </div>
                  </div>
                )}
                <span className="absolute bottom-1 left-2 text-[10px] font-medium text-white drop-shadow-md">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">Custom Gradient</Label>
          
          <div className="space-y-2">
            <Label htmlFor="start-color" className="text-xs">Start Color</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                id="start-color"
                value={global.backgroundGradient.startColor}
                onChange={(e) => handleGradientChange(e.target.value, global.backgroundGradient.endColor)}
                className="w-12 h-12 rounded-full cursor-pointer border-2 border-neutral-200"
              />
              <Input
                type="text"
                value={global.backgroundGradient.startColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    handleGradientChange(value, global.backgroundGradient.endColor);
                  }
                }}
                className="flex-1 font-mono text-sm"
                placeholder="#667eea"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-color" className="text-xs">End Color</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                id="end-color"
                value={global.backgroundGradient.endColor}
                onChange={(e) => handleGradientChange(global.backgroundGradient.startColor, e.target.value)}
                className="w-12 h-12 rounded-full cursor-pointer border-2 border-neutral-200"
              />
              <Input
                type="text"
                value={global.backgroundGradient.endColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    handleGradientChange(global.backgroundGradient.startColor, value);
                  }
                }}
                className="flex-1 font-mono text-sm"
                placeholder="#764ba2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradient-direction" className="text-xs">Direction</Label>
            <Select
              value={global.backgroundGradient.angle.toString()}
              onValueChange={(value) => handleGradientAngleChange(parseInt(value))}
            >
              <SelectTrigger id="gradient-direction" className="w-full">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                {GRADIENT_DIRECTIONS.map((direction) => (
                  <SelectItem key={direction.angle} value={direction.angle.toString()}>
                    <div className="flex items-center gap-2">
                      {direction.icon && <direction.icon className="h-4 w-4" />}
                      <span>{direction.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      {/* Image Tab */}
      <TabsContent value="image" className="space-y-4">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            Upload a custom background image
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
