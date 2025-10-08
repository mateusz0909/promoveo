const FONT_LIST = [
  'Inter',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Nunito',
  'Raleway',
  'Playfair Display',
  'Oswald',
  'Source Sans 3',
  'Work Sans',
  'Farro',
  'Headland One',
  'Nexa',
] as const;

export const quoteFontFamily = (fontFamily: string) =>
  fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;

/**
 * Font families available in the studio editor toolbar.
 */
export const FONT_FAMILIES = [...FONT_LIST];

const supportsFontLoading = (): boolean =>
  typeof document !== 'undefined' && 'fonts' in document;

/**
 * Ensure a font family is loaded before using it in canvas or overlays.
 * Gracefully resolves when the Font Loading API is unavailable (older browsers).
 */
export async function ensureFontLoaded(
  fontFamily: string,
  options?: {
    weight?: string | number;
    style?: string;
    size?: number;
  }
): Promise<void> {
  if (!supportsFontLoading()) {
    return;
  }

  const { weight = 'normal', style = 'normal', size = 64 } = options ?? {};
  const family = quoteFontFamily(fontFamily);
  const resolvedWeight = typeof weight === 'number'
    ? weight.toString()
    : weight;

  try {
    const descriptor = `${style} ${resolvedWeight} ${size}px ${family}`;
    await document.fonts.load(descriptor);
  } catch (error) {
    console.warn(`Failed to load font "${fontFamily}"`, error);
  }
}

/**
 * Preload an array of font families concurrently.
 */
export async function preloadFontFamilies(
  fontFamilies: readonly string[],
  options?: {
    weight?: string | number;
    style?: string;
    size?: number;
  }
): Promise<void> {
  if (!fontFamilies.length) {
    return;
  }

  const weights = options?.weight !== undefined
    ? [options.weight]
    : [300, 400, 500, 600, 700];

  await Promise.all(
    fontFamilies.flatMap((family) =>
      weights.map((weight) =>
        ensureFontLoaded(family, {
          ...options,
          weight,
        })
      )
    )
  );
}
