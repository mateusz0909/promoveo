export type ImageEditorTheme = "accent" | "light" | "dark";

export interface TemplateDeviceSpec {
  width: number;
  height: number;
  background?: TemplateBackgroundSpec;
  safeArea?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface TemplateBackgroundStop {
  offset?: number;
  color: string;
}

export interface TemplateBackgroundSpec {
  type: "gradient" | "solid";
  direction?: "vertical" | "horizontal" | "diagonal" | "diagonal-bottom-left" | "diagonal-right" | "radial";
  stops?: TemplateBackgroundStop[];
  color?: string;
  opacity?: number;
}

export interface TemplateFontSpec {
  family?: string;
  size?: number;
  weight?: string | number;
  transform?: "uppercase" | "lowercase" | "capitalize";
  letterSpacing?: number;
}

export interface TemplateShadowSpec {
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface TemplatePosition {
  x?: number | string;
  y?: number | string;
}

export interface TemplateSize {
  widthRatio?: number;
  heightRatio?: number;
  scale?: number;
  maxWidthRatio?: number;
  maxHeightRatio?: number;
}

export interface TemplateAccentShapeLayer {
  type: "accentShape";
  shape?: "rounded-rect" | "circle" | "capsule";
  position?: TemplatePosition;
  size?: TemplateSize;
  color?: string;
  opacity?: number;
  cornerRadiusRatio?: number;
  rotation?: number;
  blur?: number;
  shadow?: TemplateShadowSpec;
}

export interface TemplateBadgeLayer {
  type: "badge";
  text: string;
  position?: TemplatePosition;
  padding?: { x: number; y: number };
  backgroundColor?: string;
  color?: string;
  borderRadius?: number;
  opacity?: number;
  font?: TemplateFontSpec;
  shadow?: TemplateShadowSpec;
}

export interface TemplateTextLayerBase {
  position?: TemplatePosition;
  font?: TemplateFontSpec;
  color?: string;
  lineHeight?: number;
  maxWidthRatio?: number;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  allowOffset?: boolean;
  opacity?: number;
  shadow?: TemplateShadowSpec;
  baseline?: CanvasTextBaseline;
}

export interface TemplateHeadingLayer extends TemplateTextLayerBase {
  type: "heading";
  textSource?: "heading";
}

export interface TemplateSubheadingLayer extends TemplateTextLayerBase {
  type: "subheading";
  textSource?: "subheading";
}

export interface TemplateMockupLayer {
  type: "mockup";
  position?: TemplatePosition;
  size?: TemplateSize;
  rotation?: number;
  opacity?: number;
  allowOffset?: boolean;
  shadow?: TemplateShadowSpec;
}

export type TemplateLayer =
  | TemplateHeadingLayer
  | TemplateSubheadingLayer
  | TemplateMockupLayer
  | TemplateAccentShapeLayer
  | TemplateBadgeLayer;

export interface TemplateSchema {
  metadata?: {
    label?: string;
    version?: string;
  };
  canvas: {
    defaultDevice?: string;
    devices: Record<string, TemplateDeviceSpec>;
  };
  layers: TemplateLayer[];
}

export interface TemplateVersionSummary {
  id: string;
  version: string;
  isDefault: boolean;
  changelog?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  schema?: TemplateSchema | null;
  assets?: unknown;
  source?: "builtin" | "database";
}

export interface TemplateSummary {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  status?: string | null;
  thumbnailUrl?: string | null;
  supportedDevices?: string[];
  aspectRatios?: string[];
  tags?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
  source: "builtin" | "database" | "payload";
  version?: string | null;
  templateVersionId?: string | null;
  changelog?: string | null;
  isDefault?: boolean;
  publishedAt?: string | null;
  schema?: TemplateSchema | null;
  assets?: unknown;
  versions?: TemplateVersionSummary[];
}

export interface AxisOffset {
  x?: number | null;
  y?: number | null;
}

export interface TemplateOverrides {
  offsets?: {
    heading?: AxisOffset | null;
    subheading?: AxisOffset | null;
    mockup?: AxisOffset | null;
  } | null;
  colors?: {
    heading?: string | null;
    subheading?: string | null;
    background?: string | null;
  } | null;
  theme?: ImageEditorTheme | null;
}

export interface GeneratedImageConfiguration {
  heading?: string | null;
  subheading?: string | null;
  headingFont?: string | null;
  subheadingFont?: string | null;
  headingFontSize?: number | null;
  subheadingFontSize?: number | null;
  headingFontWeight?: string | null;
  subheadingFontWeight?: string | null;
  mockupX?: number | null;
  mockupY?: number | null;
  headingX?: number | null;
  headingY?: number | null;
  subheadingX?: number | null;
  subheadingY?: number | null;
  theme?: ImageEditorTheme | null;
  headingColor?: string | null;
  subheadingColor?: string | null;
  backgroundColor?: string | null;
  accentColor?: string | null;
  templateId?: string | null;
  templateVersionId?: string | null;
  templateSource?: "builtin" | "database" | "payload" | null;
  overrides?: TemplateOverrides | null;
  font?: Record<string, unknown> | null;
}

export interface GeneratedImage {
  id?: string;
  sourceScreenshotUrl?: string | null;
  generatedImageUrl?: string | null;
  accentColor?: string | null;
  templateVersionId?: string | null;
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
