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
  headingAlign?: 'left' | 'center' | 'right' | null;
  subheadingAlign?: 'left' | 'center' | 'right' | null;
  headingLetterSpacing?: number | null;
  subheadingLetterSpacing?: number | null;
  headingLineHeight?: number | null;
  subheadingLineHeight?: number | null;
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
  backgroundType?: string | null;
  backgroundSolid?: string | null;
  backgroundGradient?: {
    startColor: string;
    endColor: string;
    angle: number;
  } | null;
  backgroundImage?: {
    url: string;
    fit: 'cover' | 'contain' | 'fill' | 'tile';
    opacity: number;
  } | null;
  layout?: ImageLayout | null;
  deviceFrame?: string | null;
  visuals?: Array<{
    id: string;
    visualId: string;
    imageUrl: string;
    name: string;
    width: number;
    height: number;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    zIndex: number;
  }> | null;
  // New instance-based fields
  textInstances?: Array<{
    id: string;
    type: 'heading' | 'subheading';
    text: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
    letterSpacing: number;
    lineHeight: number;
    fontFamily: string;
  }> | null;
  mockupInstances?: Array<{
    id: string;
    type: string;
    sourceScreenshotUrl: string;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
  }> | null;
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
