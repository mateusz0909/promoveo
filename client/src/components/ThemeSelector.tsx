import { Button } from "@/components/ui/button";

const themes = [
  { name: "Accent", value: "accent" },
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
];

export function ThemeSelector({ selectedTheme, setSelectedTheme }) {
  return (
    <div className="flex gap-2">
      {themes.map((theme) => (
        <Button
          key={theme.value}
          variant={selectedTheme === theme.value ? "secondary" : "outline"}
          onClick={() => setSelectedTheme(theme.value)}
        >
          {theme.name}
        </Button>
      ))}
    </div>
  );
}
