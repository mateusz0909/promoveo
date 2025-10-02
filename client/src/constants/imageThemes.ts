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
    background: { type: "solid", color: "#FAFAFA" },
    headingColor: "#111827",
    subheadingColor: "#6B7280",
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
  "glass-morphism": {
    id: "glass-morphism",
    name: "Glass Morphism",
    description: "Modern frosted glass effect with abstract geometric shapes.",
    background: { type: "linear-gradient", colors: ["#EEF2FF", "#E0E7FF", "#DDD6FE"], angle: 135 },
    headingColor: "#1E293B",
    subheadingColor: "#64748B",
    overlay: { type: "spotlight", color: "rgba(139, 92, 246, 0.15)", radiusRatio: 1.2, opacity: 1, yOffsetRatio: 0.15 },
    ribbon: { colors: ["rgba(167, 139, 250, 0.2)", "rgba(196, 181, 253, 0.15)"], heightRatio: 0.45, opacity: 1 },
  },
  "gradient-mesh": {
    id: "gradient-mesh",
    name: "Gradient Mesh",
    description: "Sophisticated multi-color gradient mesh for creative apps.",
    background: { type: "radial-gradient", innerColor: "#8B5CF6", outerColor: "#DB2777", radiusRatio: 0.75 },
    headingColor: "#FFFFFF",
    subheadingColor: "#F3E8FF",
    overlay: { type: "spotlight", color: "#A78BFA", radiusRatio: 0.6, opacity: 0.25, yOffsetRatio: 0.4 },
  },
  "minimal-pro": {
    id: "minimal-pro",
    name: "Minimal Pro",
    description: "Ultra-clean design with modern geometric accent shapes.",
    background: { type: "linear-gradient", colors: ["#FFFFFF", "#F8FAFC"], angle: 180 },
    headingColor: "#0F172A",
    subheadingColor: "#64748B",
    overlay: { type: "spotlight", color: "rgba(59, 130, 246, 0.08)", radiusRatio: 0.8, opacity: 1, yOffsetRatio: 0.75 },
    ribbon: { colors: ["rgba(37, 99, 235, 0.12)", "rgba(59, 130, 246, 0.08)"], heightRatio: 0.25, opacity: 1 },
  },
  "tech-blueprint": {
    id: "tech-blueprint",
    name: "Tech Blueprint",
    description: "Developer-focused with grid patterns and technical aesthetic.",
    background: { type: "linear-gradient", colors: ["#0A0E27", "#1A1F3A"], angle: 160 },
    headingColor: "#38BDF8",
    subheadingColor: "#94A3B8",
    overlay: { type: "spotlight", color: "#1E40AF", radiusRatio: 0.6, opacity: 0.15, yOffsetRatio: 0.4 },
  },
  "warm-sunset": {
    id: "warm-sunset",
    name: "Warm Sunset",
    description: "Inviting warm gradients perfect for lifestyle and wellness apps.",
    background: { type: "linear-gradient", colors: ["#FEF3C7", "#FED7AA", "#FECACA"], angle: 135 },
    headingColor: "#7C2D12",
    subheadingColor: "#92400E",
    overlay: { type: "spotlight", color: "#FEF3C7", radiusRatio: 0.75, opacity: 0.5, yOffsetRatio: 0.2 },
  },
};

export const orderedThemeList = Object.values(imageThemes);
