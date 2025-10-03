import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderedThemeList } from "@/constants/imageThemes";
import type { ImageEditorTheme } from "@/types/project";

interface ThemeSelectorProps {
  selectedTheme: ImageEditorTheme;
  setSelectedTheme: (theme: ImageEditorTheme) => void;
}

export function ThemeSelector({ selectedTheme, setSelectedTheme }: ThemeSelectorProps) {
  const currentTheme = orderedThemeList.find((theme) => theme.id === selectedTheme);

  return (
    <Select  value={selectedTheme} onValueChange={setSelectedTheme}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue placeholder="Select theme">
          {currentTheme?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {orderedThemeList.map((theme) => (
          <SelectItem 
            key={theme.id} 
            value={theme.id} 
            className="text-xs"
          >
            <div className="flex flex-col">
              <span className="font-medium">{theme.name}</span>
              <span className="text-[10px] text-muted-foreground">{theme.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
