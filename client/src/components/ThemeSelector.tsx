import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { orderedThemeList } from "@/constants/imageThemes";
import type { ImageEditorTheme } from "@/types/project";
import { useState } from "react";

interface ThemeSelectorProps {
  selectedTheme: ImageEditorTheme;
  setSelectedTheme: (theme: ImageEditorTheme) => void;
}

export function ThemeSelector({ selectedTheme, setSelectedTheme }: ThemeSelectorProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      {orderedThemeList.map((theme) => {
        // Add a helpful tooltip for the Accent theme
        if (theme.id === "accent") {
          return (
            <Tooltip 
              key={theme.id} 
              delayDuration={800}
              open={tooltipOpen}
              onOpenChange={setTooltipOpen}
            >
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTheme === theme.id ? "secondary" : "outline"}
                  onClick={() => setSelectedTheme(theme.id)}
                  className="px-3 py-2 text-xs"
                  onFocus={(e) => e.preventDefault()}
                >
                  {theme.name}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  This theme automatically detects the dominant color from your screenshot
                  and uses it to create a matching background. Each image gets its own unique color!
                </p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Button
            key={theme.id}
            variant={selectedTheme === theme.id ? "secondary" : "outline"}
            onClick={() => setSelectedTheme(theme.id)}
            title={theme.description}
            className="px-3 py-2 text-xs"
          >
            {theme.name}
          </Button>
        );
      })}
    </div>
  );
}
