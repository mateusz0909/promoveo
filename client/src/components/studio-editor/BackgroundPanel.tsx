import { useMemo, useState, useRef } from 'react';
import { useStudioEditor } from '@/context/StudioEditorContext';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  PhotoIcon,
  TrashIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

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
  { name: 'Aurora', startColor: '#4facfe', endColor: '#00f2fe' },
  { name: 'Galaxy', startColor: '#3a1c71', endColor: '#d76d77' },
  { name: 'Coral Reef', startColor: '#ff9a8b', endColor: '#ff6a88' },
  { name: 'Tropical', startColor: '#43cea2', endColor: '#185a9d' },
  { name: 'Golden Hour', startColor: '#f6d365', endColor: '#fda085' },
  { name: 'Citrus', startColor: '#fbd72b', endColor: '#f9484a' },
  { name: 'Lime Pop', startColor: '#a8ff78', endColor: '#78ffd6' },
  { name: 'Deep Space', startColor: '#000428', endColor: '#004e92' },
];

export function BackgroundPanel() {
  const { global, updateBackground } = useStudioEditor();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'color' | 'gradient' | 'image'>(
    global.backgroundType === 'solid' ? 'color' : 
    global.backgroundType === 'gradient' ? 'gradient' : 'image'
  );

  const gradientPresetMatch = useMemo(() => {
    if (global.backgroundType !== 'gradient') return null;
    return GRADIENT_PRESETS.find(
      (preset) =>
        preset.startColor.toLowerCase() === global.backgroundGradient.startColor.toLowerCase() &&
        preset.endColor.toLowerCase() === global.backgroundGradient.endColor.toLowerCase()
    );
  }, [global.backgroundType, global.backgroundGradient.endColor, global.backgroundGradient.startColor]);
  const [isGradientPopoverOpen, setIsGradientPopoverOpen] = useState(false);

  // Handle tab change - automatically switch background type
  const handleTabChange = (newTab: 'color' | 'gradient' | 'image') => {
    setActiveTab(newTab);
    
    // Automatically update background type when switching tabs
    if (newTab === 'color' && global.backgroundType !== 'solid') {
      updateBackground({
        backgroundType: 'solid',
      });
    } else if (newTab === 'gradient' && global.backgroundType !== 'gradient') {
      updateBackground({
        backgroundType: 'gradient',
      });
    } else if (newTab === 'image' && global.backgroundType !== 'image') {
      // Only switch to image if there's a URL, otherwise keep current type
      if (global.backgroundImage.url) {
        updateBackground({
          backgroundType: 'image',
        });
      }
    }
  };

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    if (!session?.access_token) {
      toast.error('You must be logged in to upload images');
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('image', file);

      // Upload to server
      const response = await fetch('http://localhost:3001/api/images/upload-background', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const { imageUrl } = await response.json();

      // Update background with the permanent Supabase URL
      updateBackground({
        backgroundType: 'image',
        backgroundImage: {
          url: imageUrl,
          fit: global.backgroundImage.fit || 'cover',
          opacity: global.backgroundImage.opacity ?? 1,
        },
      });

      toast.success('Background image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleImageFitChange = (fit: 'cover' | 'contain' | 'fill' | 'tile') => {
    updateBackground({
      backgroundImage: {
        ...global.backgroundImage,
        fit,
      },
    });
  };

  const handleImageOpacityChange = (opacity: number) => {
    updateBackground({
      backgroundImage: {
        ...global.backgroundImage,
        opacity,
      },
    });
  };

  const handleRemoveImage = () => {
    // Clear the image URL completely
    updateBackground({
      backgroundType: 'gradient',
      backgroundImage: {
        url: '',
        fit: 'cover',
        opacity: 1,
      },
    });
    // Switch to gradient tab
    setActiveTab('gradient');
    toast.success('Background image removed');
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => handleTabChange(value as 'color' | 'gradient' | 'image')}
      className="w-full space-y-5  border-border/60 bg-muted/20 px-4 py-4"
    >
      <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
        <TabsTrigger value="color" className="rounded-lg py-2 text-xs font-medium">
          Color
        </TabsTrigger>
        <TabsTrigger value="gradient" className="rounded-lg py-2 text-xs font-medium">
          Gradient
        </TabsTrigger>
        <TabsTrigger value="image" className="rounded-lg py-2 text-xs font-medium">
          Image
        </TabsTrigger>
      </TabsList>

      {/* Color Tab */}
      <TabsContent value="color" className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Preset Colors
          </Label>
          <div className="grid grid-cols-5 gap-2.5">
            {SOLID_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleSolidColorChange(color.value)}
                className={`relative w-full aspect-square rounded-xl border transition-transform hover:-translate-y-0.5 hover:shadow ${
                  global.backgroundType === 'solid' && global.backgroundSolid === color.value
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border/60 hover:border-border'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {global.backgroundType === 'solid' && global.backgroundSolid === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-background rounded-full shadow flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="custom-color"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            Custom Color
          </Label>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 border border-border/70 rounded-lg px-3 py-2 bg-background/80">
              <input
                type="color"
                id="custom-color"
                value={global.backgroundType === 'solid' ? global.backgroundSolid : '#ffffff'}
                onChange={(e) => handleSolidColorChange(e.target.value)}
                className="w-11 h-11 rounded-full cursor-pointer border border-border/70 shadow-sm"
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
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto font-mono text-xs"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Gradient Tab */}
      <TabsContent value="gradient" className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Preset Gradients
          </Label>
          <Popover open={isGradientPopoverOpen} onOpenChange={setIsGradientPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-left min-h-[64px]"
              >
                <span
                  className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border/60"
                  style={{
                    background: `linear-gradient(135deg, ${global.backgroundGradient.startColor}, ${global.backgroundGradient.endColor})`,
                  }}
                />
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="text-sm font-semibold leading-tight whitespace-normal break-words">
                    {gradientPresetMatch ? gradientPresetMatch.name : 'Custom gradient'}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight whitespace-normal break-words">
                    Tap to browse curated gradients
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] rounded-xl border border-border/70 bg-card/95 p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Gradient Library
                </span>
                {gradientPresetMatch ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {gradientPresetMatch.name}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Custom
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {GRADIENT_PRESETS.map((preset) => {
                  const isActive =
                    gradientPresetMatch?.name === preset.name;
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => {
                        handleGradientChange(preset.startColor, preset.endColor);
                        setIsGradientPopoverOpen(false);
                      }}
                      className={`group relative h-16 rounded-xl border text-left transition-transform hover:-translate-y-0.5 hover:shadow-md ${
                        isActive
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border/60 hover:border-border'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${preset.startColor}, ${preset.endColor})`,
                      }}
                    >
                      <span className="absolute bottom-1 left-2 text-[10px] font-semibold text-white drop-shadow">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
                Customize colors below to craft your own gradient.
              </div>
            </PopoverContent>
          </Popover>

        </div>

        <div className="space-y-4 pt-3 border-t border-border/60">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Custom Gradient
          </Label>
          
          <div className="space-y-2">
            <Label htmlFor="start-color" className="text-xs text-muted-foreground">
              Start Color
            </Label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                id="start-color"
                value={global.backgroundGradient.startColor}
                onChange={(e) => handleGradientChange(e.target.value, global.backgroundGradient.endColor)}
                className="w-12 h-12 rounded-full cursor-pointer border border-border/70 shadow-sm"
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
                className="flex-1 font-mono text-xs"
                placeholder="#667eea"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-color" className="text-xs text-muted-foreground">
              End Color
            </Label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                id="end-color"
                value={global.backgroundGradient.endColor}
                onChange={(e) => handleGradientChange(global.backgroundGradient.startColor, e.target.value)}
                className="w-12 h-12 rounded-full cursor-pointer border border-border/70 shadow-sm"
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
                className="flex-1 font-mono text-xs"
                placeholder="#764ba2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradient-direction" className="text-xs text-muted-foreground">
              Direction
            </Label>
            <Select
              value={global.backgroundGradient.angle.toString()}
              onValueChange={(value: string) => handleGradientAngleChange(parseInt(value, 10))}
            >
              <SelectTrigger id="gradient-direction" className="w-full text-xs h-9">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent align="start" className="w-[220px]">
                {GRADIENT_DIRECTIONS.map((direction) => (
                  <SelectItem
                    key={direction.angle}
                    value={direction.angle.toString()}
                    className="flex items-center gap-3 text-xs"
                  >
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={handleImageUpload}
          className="hidden"
        />

        {!global.backgroundImage.url ? (
          /* Upload State */
          <div className="space-y-4">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
                isUploading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-blue-500 hover:bg-accent/50 cursor-pointer'
              }`}
            >
              <PhotoIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isUploading ? 'Uploading...' : 'Upload Background Image'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isUploading ? 'Please wait' : 'Click to browse or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP (Max 10MB)
              </p>
            </div>

            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline" 
              className="w-full"
              disabled={isUploading}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </Button>
          </div>
        ) : (
          /* Image Loaded State */
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={global.backgroundImage.url}
                alt="Background preview"
                className="w-full h-32 object-cover"
                style={{ opacity: global.backgroundImage.opacity }}
              />
              <div className="absolute top-2 right-2">
                <Button
                  onClick={handleRemoveImage}
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 p-0"
                  title="Remove image"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Fit Mode */}
            <div className="space-y-2">
              <Label htmlFor="image-fit" className="text-xs text-muted-foreground">
                Fit Mode
              </Label>
              <Select
                value={global.backgroundImage.fit ?? 'cover'}
                onValueChange={(value: 'cover' | 'contain' | 'fill' | 'tile') => handleImageFitChange(value)}
              >
                <SelectTrigger id="image-fit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Cover</span>
                      <span className="text-xs text-muted-foreground">Fill canvas, may crop</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="contain">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Contain</span>
                      <span className="text-xs text-muted-foreground">Fit entire image, may letterbox</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fill">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Fill</span>
                      <span className="text-xs text-muted-foreground">Stretch to fill (may distort)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tile">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Tile</span>
                      <span className="text-xs text-muted-foreground">Repeat pattern</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Opacity Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="image-opacity" className="text-xs text-muted-foreground">
                  Opacity
                </Label>
                <span className="text-xs font-medium text-foreground">
                  {Math.round(global.backgroundImage.opacity * 100)}%
                </span>
              </div>
              <Slider
                id="image-opacity"
                value={[global.backgroundImage.opacity * 100]}
                onValueChange={(values) => handleImageOpacityChange(values[0] / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Replace Image Button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isUploading}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Replace Image'}
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
