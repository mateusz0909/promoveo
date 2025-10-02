export type ImageEditorTheme =
  | "accent"
  | "light"
  | "dark"
  | "neon-gradient"
  | "prism-burst"
  | "nightfall"
  | "lifestyle"
  | "badge-punch"
  | "glass-morphism"
  | "gradient-mesh"
  | "minimal-pro"
  | "tech-blueprint"
  | "warm-sunset";

export type ImageLayout = "text-top" | "text-bottom";

export interface GeneratedImageConfiguration {
  heading?: string | null;
  subheading?: string | null;
  headingFont?: string | null;
  subheadingFont?: string | null;
  headingFontSize?: number | null;
  subheadingFontSize?: number | null;
  mockupX?: number | null;
  mockupY?: number | null;
  mockupScale?: number | null;
  mockupRotation?: number | null;
  headingX?: number | null;
  headingY?: number | null;
  subheadingX?: number | null;
  subheadingY?: number | null;
  theme?: ImageEditorTheme | null;
  headingColor?: string | null;
  subheadingColor?: string | null;
  backgroundColor?: string | null;
  layout?: ImageLayout | null;
}

export interface GeneratedImage {
  id?: string;
  sourceScreenshotUrl?: string | null;
  generatedImageUrl?: string | null;
  accentColor?: string | null;
  description?: string | null;
  configuration?: GeneratedImageConfiguration | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratedText {
  title: string;
  subtitle: string;
  promotionalText: string;
  description: string;
  keywords: string;
  headings: {
    heading: string;
    subheading: string;
  }[];
}

export interface ProjectSummary {
  id: string;
  inputAppName: string;
  inputAppDescription: string;
  language?: string;
  device?: string;
  createdAt?: string;
  updatedAt?: string;
  generatedAsoText?: GeneratedText | null;
  generatedImages?: GeneratedImage[];
}
