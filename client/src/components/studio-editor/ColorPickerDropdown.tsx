import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const PREDEFINED_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
];

const RECENT_COLORS_KEY = 'studio-editor-recent-colors';
const MAX_RECENT_COLORS = 8;

interface ColorPickerDropdownProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPickerDropdown({ value, onChange }: ColorPickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  // Load recent colors from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent colors:', e);
      }
    }
  }, []);

  const addToRecentColors = (color: string) => {
    // Don't add if it's already in predefined colors
    if (PREDEFINED_COLORS.some(c => c.value.toLowerCase() === color.toLowerCase())) {
      return;
    }

    setRecentColors(prev => {
      // Remove if already exists
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      // Add to beginning
      const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
      
      // Save to localStorage
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
      
      return updated;
    });
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    addToRecentColors(color);
    setOpen(false);
    setShowCustomPicker(false);
  };

  const handleCustomColorConfirm = () => {
    handleColorSelect(customColor);
  };

  const handleClearRecent = () => {
    setRecentColors([]);
    localStorage.removeItem(RECENT_COLORS_KEY);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-24 h-9 px-2 justify-start gap-2"
        >
          <div
            className="w-5 h-5 rounded border border-neutral-300 flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs truncate">{value.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          {/* Custom Color Button */}
          <div>
            {!showCustomPicker ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowCustomPicker(true);
                  setCustomColor(value);
                }}
              >
                <PlusIcon className="h-4 w-4" />
                <span className="text-sm">Custom Color</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-12 h-9 rounded-full cursor-pointer border-2 border-neutral-300"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded"
                  placeholder="#000000"
                />
                <Button
                  size="sm"
                  onClick={handleCustomColorConfirm}
                >
                  OK
                </Button>
              </div>
            )}
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-neutral-600">Custom</p>
                <button
                  onClick={handleClearRecent}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600 transition-colors"
                  title="Clear recent colors"
                >
                  <TrashIcon className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color,
                      borderColor: value.toLowerCase() === color.toLowerCase() ? '#3b82f6' : '#e5e7eb'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Predefined Colors */}
          <div>
            <p className="text-xs font-medium text-neutral-600 mb-2">Colors</p>
            <div className="grid grid-cols-6 gap-1.5">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className="w-9 h-9 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color.value,
                    borderColor: value.toLowerCase() === color.value.toLowerCase() ? '#3b82f6' : '#e5e7eb'
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
