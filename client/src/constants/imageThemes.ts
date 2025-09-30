import type { ImageEditorTheme } from "@/types/project";

export type ThemeBackground =
  | {
      type: "accent";
      fallback: string;
      gradientStrength?: number;
      overlayOpacity?: number;
      lightenBasePercent?: number;
    }
  | { type: "solid"; color: string }
  | { type: "linear-gradient"; colors: string[]; angle?: number }
  | { type: "radial-gradient"; innerColor: string; outerColor: string; radiusRatio?: number };

export type ThemeOverlay =
  | { type: "spotlight"; color: string; radiusRatio?: number; opacity?: number; yOffsetRatio?: number };

export interface ThemeBand {
  colors: string[];
  heightRatio?: number;
  opacity?: number;
}

export interface ImageThemeDefinition {
  id: ImageEditorTheme;
  name: string;
  description: string;
  background: ThemeBackground;
  headingColor: string;
  subheadingColor: string;
  overlay?: ThemeOverlay;
  ribbon?: ThemeBand;
  badgeStyle?: "numbered";
}

export const imageThemes: Record<ImageEditorTheme, ImageThemeDefinition> = {
  accent: {
    id: "accent",
    name: "Accent",
    description: "Uses the generated accent color with a soft vertical wash.",
    background: {
      type: "accent",
      fallback: "#4F46E5",
      lightenBasePercent: 50,
    },
    headingColor: "#1a1a1a",
    subheadingColor: "#383838",
  },
  light: {
    id: "light",
    name: "Light",
    description: "Clean white canvas with dark copy, great for productivity apps.",
    background: { type: "solid", color: "#FFFFFF" },
    headingColor: "#000000",
    subheadingColor: "#333333",
  },
  dark: {
    id: "dark",
    name: "Dark",
    description: "High-contrast dark mode treatment with bright typography.",
    background: { type: "solid", color: "#000000" },
    headingColor: "#FFFFFF",
    subheadingColor: "#CCCCCC",
  },
  "neon-gradient": {
    id: "neon-gradient",
    name: "Neon Gradient",
    description: "Vivid purple-to-cyan gradient inspired by top-grossing creatives.",
    background: { type: "linear-gradient", colors: ["#7F5BFF", "#24D2FE"], angle: 120 },
    headingColor: "#FFFFFF",
    subheadingColor: "#E0F2FE",
  },
  "prism-burst": {
    id: "prism-burst",
    name: "Prism Burst",
    description: "Diagonal neon burst that spotlights high-energy feature drops.",
    background: { type: "linear-gradient", colors: ["#FF6B6B", "#F8E71C", "#24C6DC"], angle: 135 },
    headingColor: "#0B0B0F",
    subheadingColor: "#1F2933",
  },
  nightfall: {
    id: "nightfall",
    name: "Nightfall",
    description: "Deep midnight gradient that highlights premium dark-mode flows.",
    background: { type: "linear-gradient", colors: ["#050B18", "#0D1117"], angle: 180 },
    headingColor: "#58A6FF",
    subheadingColor: "#C5D1E6",
  },
  lifestyle: {
    id: "lifestyle",
    name: "Lifestyle Spotlight",
    description: "Warm backdrop with a soft spotlight for human-centered narratives.",
    background: { type: "solid", color: "#FFF4EC" },
    headingColor: "#C2410C",
    subheadingColor: "#7C2D12",
    overlay: { type: "spotlight", color: "#FFD7BA", radiusRatio: 0.7, opacity: 0.35, yOffsetRatio: 0.25 },
  },
  "badge-punch": {
    id: "badge-punch",
    name: "Badge Punch",
    description: "Deep navy canvas with a punchy gradient band for numbered callouts.",
    background: { type: "linear-gradient", colors: ["#0F172A", "#1E293B"], angle: 200 },
    headingColor: "#FACC15",
    subheadingColor: "#E2E8F0",
    ribbon: { colors: ["#F97316", "#FACC15"], heightRatio: 0.22, opacity: 0.35 },
    badgeStyle: "numbered",
  },
};

export const orderedThemeList = Object.values(imageThemes);
