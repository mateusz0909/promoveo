/**
 * Standalone canvas renderer for generating marketing images.
 * Reuses the Studio editor element pipeline so downloads match the live preview.
 */

import { getCanvasMetrics } from './canvas/utils';
import {
  drawBackground,
  loadBackgroundImage,
  type BackgroundConfig,
} from './canvas/backgroundRenderer';
import { renderAllElements } from './canvas/elementRenderer';
import type { CanvasElement } from '@/context/studio-editor/elementTypes';
import { isMockupElement, isTextElement } from '@/context/studio-editor/elementTypes';
import {
  generatedImageToLegacyData,
  migrateLegacyScreenshot,
} from '@/context/studio-editor/migration';
import type { GeneratedImage, GeneratedImageConfiguration } from '@/types/project';
import { ensureFontLoaded } from '@/lib/fonts';

interface RenderConfig {
  sourceScreenshotUrl: string;
  configuration: Record<string, unknown> | null | undefined;
  device?: string;
  index?: number;
  totalImages?: number;
}

const DEFAULT_BACKGROUND_SOLID = '#f6d365';
const DEFAULT_BACKGROUND_GRADIENT_START = '#f6d365';
const DEFAULT_BACKGROUND_GRADIENT_END = '#fda085';
const DEFAULT_FONT_FAMILY = 'Poppins';

const fontLoadPromises = new Map<string, Promise<void>>();
const sharedImageCache = new Map<string, HTMLImageElement>();
const imageLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const visualImageCache = new Map<string, HTMLImageElement>();

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeFontWeight = (value: unknown, isBold: boolean | undefined): number => {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    if (trimmed === 'bold') {
      return 700;
    }
    if (trimmed === 'semibold' || trimmed === 'semi-bold') {
      return 600;
    }
    if (trimmed === 'medium') {
      return 500;
    }
    if (trimmed === 'light') {
      return 300;
    }
  }

  return isBold ? 700 : 400;
};

const queueFontLoad = (family: string, weight: number): Promise<void> => {
  const key = `${family}::${weight}`;
  const existing = fontLoadPromises.get(key);
  if (existing) {
    return existing;
  }

  const loadPromise = ensureFontLoaded(family, { weight }).catch((error) => {
    fontLoadPromises.delete(key);
    throw error;
  });

  fontLoadPromises.set(key, loadPromise);
  return loadPromise;
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  const cached = sharedImageCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = imageLoadPromises.get(url);
  if (pending) {
    return pending;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sharedImageCache.set(url, img);
      imageLoadPromises.delete(url);
      resolve(img);
    };
    img.onerror = (error) => {
      imageLoadPromises.delete(url);
      reject(error);
    };
    img.src = url;
  });

  imageLoadPromises.set(url, promise);
  return promise;
};

const resolveDeviceFrame = (
  configuration: GeneratedImageConfiguration | null | undefined,
  fallbackDevice?: string
): string => {
  if (configuration?.deviceFrame && configuration.deviceFrame.trim()) {
    return configuration.deviceFrame;
  }
  if (fallbackDevice) {
    return fallbackDevice;
  }
  return 'iPhone 15 Pro';
};

const normalizeBackgroundConfig = (
  configuration: GeneratedImageConfiguration | null | undefined
): BackgroundConfig => {
  const typeCandidate = configuration?.backgroundType
    ? configuration.backgroundType.toLowerCase()
    : undefined;

  let backgroundType: 'solid' | 'gradient' | 'image';
  switch (typeCandidate) {
    case 'solid':
      backgroundType = 'solid';
      break;
    case 'image':
      backgroundType = 'image';
      break;
    case 'gradient':
    case 'accent':
    case 'default':
    default:
      backgroundType = 'gradient';
      break;
  }

  const gradient = configuration?.backgroundGradient ?? undefined;
  const backgroundSolid =
    configuration?.backgroundSolid || configuration?.backgroundColor || DEFAULT_BACKGROUND_SOLID;

  return {
    backgroundType,
    backgroundSolid,
    backgroundGradient: {
      startColor: gradient?.startColor || DEFAULT_BACKGROUND_GRADIENT_START,
      endColor: gradient?.endColor || DEFAULT_BACKGROUND_GRADIENT_END,
      angle: isFiniteNumber(gradient?.angle) ? (gradient?.angle as number) : 270,
    },
    backgroundImage: {
      url: configuration?.backgroundImage?.url || '',
      fit:
        configuration?.backgroundImage?.fit &&
        ['cover', 'contain', 'fill', 'tile'].includes(configuration.backgroundImage.fit)
          ? (configuration.backgroundImage.fit as 'cover' | 'contain' | 'fill' | 'tile')
          : 'cover',
      opacity: isFiniteNumber(configuration?.backgroundImage?.opacity)
        ? (configuration?.backgroundImage?.opacity as number)
        : 1,
    },
  };
};

const collectFontRequests = (
  elements: CanvasElement[]
): Array<{ family: string; weight: number }> => {
  const requests = new Map<string, { family: string; weight: number }>();

  elements.forEach((element) => {
    if (!isTextElement(element)) {
      return;
    }

    const family = element.fontFamily?.trim() || DEFAULT_FONT_FAMILY;
    const weight = normalizeFontWeight(element.fontWeight, element.isBold);

    const key = `${family}-${weight}`;
    if (!requests.has(key)) {
      requests.set(key, { family, weight });
    }
  });

  return Array.from(requests.values());
};

const loadDeviceFrameImage = async (
  frameAsset: string | null | undefined,
  hasMockup: boolean
): Promise<HTMLImageElement | null> => {
  if (!hasMockup) {
    return null;
  }
  if (!frameAsset) {
    return null;
  }
  try {
    return await loadImage(frameAsset);
  } catch (error) {
    console.warn('Failed to load device frame image for download', error);
    return null;
  }
};

const loadScreenshotImage = async (
  url: string | null | undefined
): Promise<HTMLImageElement | null> => {
  if (!url) {
    return null;
  }
  try {
    return await loadImage(url);
  } catch (error) {
    console.warn('Failed to load screenshot image for download', error);
    return null;
  }
};

export async function renderScreenshotToCanvas(
  canvas: HTMLCanvasElement,
  config: RenderConfig
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas context');
  }

  const configuration = (config.configuration ?? {}) as GeneratedImageConfiguration;

  const generatedImage: GeneratedImage = {
    sourceScreenshotUrl: config.sourceScreenshotUrl,
    configuration,
  };

  const legacyData = generatedImageToLegacyData(generatedImage, config.index ?? 0);
  const screenshotState = migrateLegacyScreenshot(legacyData);

  const deviceFrame = resolveDeviceFrame(screenshotState.image.configuration, config.device);
  const backgroundConfig = normalizeBackgroundConfig(screenshotState.image.configuration);
  const elements = screenshotState.elements;

  const metrics = getCanvasMetrics(deviceFrame);

  canvas.width = metrics.width;
  canvas.height = metrics.height;

  const fontRequests = collectFontRequests(elements);
  await Promise.all(
    fontRequests.map(({ family, weight }) => queueFontLoad(family, weight))
  );

  const [backgroundImage, screenshotImage, deviceFrameImage] = await Promise.all([
    backgroundConfig.backgroundType === 'image' && backgroundConfig.backgroundImage.url
      ? loadBackgroundImage(backgroundConfig.backgroundImage.url).catch(() => null)
      : Promise.resolve(null),
    loadScreenshotImage(screenshotState.image.sourceScreenshotUrl || config.sourceScreenshotUrl),
    loadDeviceFrameImage(metrics.preset.frameAsset, elements.some(isMockupElement)),
  ]);

  ctx.clearRect(0, 0, metrics.width, metrics.height);

  drawBackground(
    ctx,
    backgroundConfig,
    metrics.width,
    metrics.height,
    config.index ?? 0,
    config.totalImages ?? 1,
    backgroundImage
  );

  await renderAllElements(
    ctx,
    elements,
    screenshotImage,
    deviceFrameImage,
    metrics,
    visualImageCache
  );
}
