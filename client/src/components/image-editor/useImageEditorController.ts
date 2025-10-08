import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  GeneratedImage,
  GeneratedImageConfiguration,
  ImageEditorTheme,
  ImageLayout,
} from '@/types/project';

type RegenerationStyle = 'concise' | 'detailed';

interface UseImageEditorControllerParams {
  isOpen: boolean;
  imageData: GeneratedImage | null;
  imageIndex: number | null;
  fonts: string[];
  onSave: (
    imageIndex: number,
    configuration: GeneratedImageConfiguration,
    accentColor?: string | null
  ) => Promise<void>;
  onClose: () => void;
  projectId?: string;
  device?: string;
  sessionToken?: string;
  appName?: string;
  appDescription?: string;
}

const FALLBACK_FONT = 'Poppins';

const ALL_THEMES: ImageEditorTheme[] = [
  'accent',
  'light',
  'dark',
  'neon-gradient',
  'prism-burst',
  'nightfall',
  'lifestyle',
  'badge-punch',
  'glass-morphism',
  'gradient-mesh',
  'minimal-pro',
  'tech-blueprint',
  'warm-sunset',
];

const resolveFont = (candidate: string | null | undefined, fonts: string[]): string => {
  if (candidate && candidate.trim().length > 0) {
    return candidate;
  }
  if (fonts.length > 0) {
    return fonts[0];
  }
  return FALLBACK_FONT;
};

const resolveFontSize = (value: number | null | undefined, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const resolveLayout = (value: string | null | undefined): ImageLayout => {
  return value === 'text-bottom' ? 'text-bottom' : 'text-top';
};

const resolveTheme = (value: string | null | undefined): ImageEditorTheme => {
  const candidate = typeof value === 'string' ? value : '';
  return (ALL_THEMES.find((theme) => theme === candidate) ?? 'accent') as ImageEditorTheme;
};

const buildConfiguration = (
  base: GeneratedImageConfiguration | null | undefined,
  overrides: Partial<GeneratedImageConfiguration>
): GeneratedImageConfiguration => ({
  ...base,
  ...overrides,
});

export function useImageEditorController({
  isOpen,
  imageData,
  imageIndex,
  fonts,
  onSave,
  onClose,
  device = 'iPhone',
}: UseImageEditorControllerParams) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initialConfig = useMemo<GeneratedImageConfiguration | null>(
    () => imageData?.configuration ?? null,
    [imageData?.configuration]
  );

  const [heading, setHeading] = useState(() => initialConfig?.heading ?? '');
  const [subheading, setSubheading] = useState(() => initialConfig?.subheading ?? '');

  const [headingFont, setHeadingFont] = useState(() =>
    resolveFont(initialConfig?.headingFont, fonts)
  );
  const [subheadingFont, setSubheadingFont] = useState(() =>
    resolveFont(initialConfig?.subheadingFont, fonts)
  );

  const defaultHeadingSize = device.toLowerCase().includes('ipad') ? 130 : 120;
  const defaultSubheadingSize = device.toLowerCase().includes('ipad') ? 90 : 72;

  const [headingFontSize, setHeadingFontSize] = useState(() =>
    resolveFontSize(initialConfig?.headingFontSize, defaultHeadingSize)
  );
  const [subheadingFontSize, setSubheadingFontSize] = useState(() =>
    resolveFontSize(initialConfig?.subheadingFontSize, defaultSubheadingSize)
  );

  const [selectedTheme, setSelectedTheme] = useState<ImageEditorTheme>(() =>
    resolveTheme(initialConfig?.theme)
  );
  const [layout, setLayout] = useState<ImageLayout>(() => resolveLayout(initialConfig?.layout));
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageData) {
      return;
    }

    const configuration = imageData.configuration ?? {};

    setHeading(configuration.heading ?? '');
    setSubheading(configuration.subheading ?? '');
    setHeadingFont(resolveFont(configuration.headingFont, fonts));
    setSubheadingFont(resolveFont(configuration.subheadingFont, fonts));
    setHeadingFontSize(resolveFontSize(configuration.headingFontSize, defaultHeadingSize));
    setSubheadingFontSize(resolveFontSize(configuration.subheadingFontSize, defaultSubheadingSize));
    setSelectedTheme(resolveTheme(configuration.theme));
    setLayout(resolveLayout(configuration.layout));
  }, [isOpen, imageData, fonts, defaultHeadingSize, defaultSubheadingSize]);

  const handleSave = useCallback(async () => {
    if (imageIndex === null || !imageData) {
      toast.error('Unable to save changes for this image.');
      return;
    }

    const configuration = buildConfiguration(initialConfig, {
      heading,
      subheading,
      headingFont,
      subheadingFont,
      headingFontSize,
      subheadingFontSize,
      layout,
      theme: selectedTheme,
    });

    try {
      await onSave(imageIndex, configuration, imageData.accentColor ?? null);
      toast.success('Image configuration saved.');
      onClose();
    } catch (error) {
      console.error('Legacy image editor save failed:', error);
      toast.error('Failed to save image configuration.');
    }
  }, [
    imageIndex,
    imageData,
    initialConfig,
    heading,
    subheading,
    headingFont,
    subheadingFont,
    headingFontSize,
    subheadingFontSize,
    layout,
    selectedTheme,
    onSave,
    onClose,
  ]);

  const handleRegenerateContent = useCallback(async (style: RegenerationStyle) => {
    setIsRegenerating(true);
    toast.info(
      `AI regenerate (${style}) is unavailable in the legacy editor. Switch to the Studio to access this feature.`
    );
    setTimeout(() => setIsRegenerating(false), 1200);
  }, []);

  const noop = useCallback(() => {
    // No-op: the legacy modal is no longer interactive. This is kept for type compatibility.
  }, []);

  return {
    canvasRef,
    heading,
    setHeading,
    subheading,
    setSubheading,
    headingFont,
    setHeadingFont,
    subheadingFont,
    setSubheadingFont,
    headingFontSize,
    setHeadingFontSize,
    subheadingFontSize,
    setSubheadingFontSize,
    selectedTheme,
    setSelectedTheme,
    layout,
    setLayout,
    handleMouseDown: noop,
    handleMouseMove: noop,
    handleMouseUp: noop,
    handleMouseLeave: noop,
    handleSave,
    handleRegenerateContent,
    isRegenerating,
  };
}
