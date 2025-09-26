const fs = require('fs');
const axios = require('axios');
const { Vibrant } = require('node-vibrant/node');
const templateRenderer = require('./templateRenderer');
const templateService = require('./templateService');
const { BUILTIN_TEMPLATES } = require('../templates/registry/builtinTemplates');

console.log('Initializing Image Generation service...');

const normalizeDeviceName = (device) => {
  if (!device) {
    return 'iPhone';
  }

  const normalized = device.toString().toLowerCase();
  if (normalized.includes('ipad')) {
    return 'iPad';
  }

  return 'iPhone';
};

const analyzeImageColors = async (imageBuffer) => {
  try {
    const palette = await Vibrant.from(imageBuffer).getPalette();

    let accentColor =
      palette.Vibrant?.hex ||
      palette.LightVibrant?.hex ||
      palette.DarkVibrant?.hex ||
      palette.Muted?.hex ||
      palette.LightMuted?.hex ||
      palette.DarkMuted?.hex;

    if (!accentColor || accentColor === '#000000' || accentColor === '#ffffff') {
      accentColor = '#4F46E5';
    }

    return { accentColor };
  } catch (error) {
    console.error('ImageGenerationService: Failed to analyze image colors, using fallback.', error.message);
    return { accentColor: '#4F46E5' };
  }
};

const fetchBufferFromUrl = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
};

const normalizeScreenshotBuffer = async (input) => {
  if (!input) {
    throw new Error('Screenshot input is required');
  }

  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    return Buffer.from(input);
  }

  if (ArrayBuffer.isView(input)) {
    return Buffer.from(input.buffer);
  }

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return fetchBufferFromUrl(input);
    }

    try {
      return fs.readFileSync(input);
    } catch (readError) {
      throw new Error(`Unable to read screenshot from path: ${input}`);
    }
  }

  if (input?.data && Array.isArray(input.data)) {
    return Buffer.from(input.data);
  }

  throw new Error('Unsupported screenshot input type. Provide a Buffer, file path, or URL.');
};

const coerceNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeFonts = (options) => {
  const headingFamily =
    options.headingFontFamily ||
    options.fonts?.heading?.family ||
    options.font?.headingFont ||
    options.configuration?.headingFont ||
    'Farro';

  const subheadingFamily =
    options.subheadingFontFamily ||
    options.fonts?.subheading?.family ||
    options.font?.subheadingFont ||
    options.configuration?.subheadingFont ||
    'Headland One';

  const headingSize =
    coerceNumber(
      options.headingFontSize ||
        options.fonts?.heading?.size ||
        options.font?.headingFontSize ||
        options.configuration?.headingFontSize,
      120
    );

  const subheadingSize =
    coerceNumber(
      options.subheadingFontSize ||
        options.fonts?.subheading?.size ||
        options.font?.subheadingFontSize ||
        options.configuration?.subheadingFontSize,
      72
    );

  const headingWeight =
    options.headingFontWeight ||
    options.fonts?.heading?.weight ||
    options.font?.headingFontWeight ||
    options.configuration?.headingFontWeight ||
    '700';

  const subheadingWeight =
    options.subheadingFontWeight ||
    options.fonts?.subheading?.weight ||
    options.font?.subheadingFontWeight ||
    options.configuration?.subheadingFontWeight ||
    '400';

  return {
    heading: {
      family: headingFamily,
      size: headingSize,
      weight: headingWeight,
    },
    subheading: {
      family: subheadingFamily,
      size: subheadingSize,
      weight: subheadingWeight,
    },
  };
};

const normalizeOffsets = (options) => ({
  heading: {
    x: coerceNumber(options.headingX ?? options.configuration?.headingX, 0),
    y: coerceNumber(options.headingY ?? options.configuration?.headingY, 0),
  },
  subheading: {
    x: coerceNumber(options.subheadingX ?? options.configuration?.subheadingX, 0),
    y: coerceNumber(options.subheadingY ?? options.configuration?.subheadingY, 0),
  },
  mockup: {
    x: coerceNumber(options.mockupX ?? options.configuration?.mockupX, 0),
    y: coerceNumber(options.mockupY ?? options.configuration?.mockupY, 0),
  },
});

const normalizeColorOverrides = (options) => ({
  heading: options.headingColor || options.configuration?.headingColor || null,
  subheading: options.subheadingColor || options.configuration?.subheadingColor || null,
  background: options.backgroundColor || options.configuration?.backgroundColor || null,
});

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

const clampQuality = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0.55;
  }

  return clampNumber(numeric, 0.2, 0.95);
};

const normalizeGenerationOptions = async (rawOptions) => {
  if (!rawOptions || typeof rawOptions !== 'object') {
    throw new Error('generateAppStoreImage expects an options object');
  }

  const heading = rawOptions.heading ?? rawOptions.title;
  const subheading = rawOptions.subheading ?? rawOptions.caption;

  if (!heading || !subheading) {
    throw new Error('Heading and subheading are required to generate an image');
  }

  const screenshotInput =
    rawOptions.screenshotBuffer ||
    rawOptions.screenshot ||
    rawOptions.screenshotPath ||
    rawOptions.screenshotUrl ||
    rawOptions.image ||
    rawOptions.buffer;

  if (!screenshotInput) {
    throw new Error('Screenshot input is required to generate an image');
  }

  const screenshotBuffer = await normalizeScreenshotBuffer(screenshotInput);

  return {
    heading,
    subheading,
    screenshotInput,
    screenshotBuffer,
    fonts: normalizeFonts(rawOptions),
    offsets: normalizeOffsets(rawOptions),
    colorOverrides: normalizeColorOverrides(rawOptions),
    device: normalizeDeviceName(rawOptions.device || rawOptions.targetDevice || rawOptions.configuration?.device),
    templateId: rawOptions.templateId || rawOptions.configuration?.templateId || null,
    templateVersionId: rawOptions.templateVersionId || rawOptions.configuration?.templateVersionId || null,
    templateSchema: rawOptions.templateSchema || rawOptions.configuration?.templateSchema || null,
    accentColorOverride: rawOptions.accentColor || rawOptions.configuration?.accentColor || null,
    theme: rawOptions.theme || rawOptions.configuration?.theme || 'accent',
    quality: clampQuality(rawOptions.quality || 0.55),
  };
};

const resolveTemplate = async ({ templateId, templateVersionId, templateSchema }) => {
  if (templateSchema) {
    return {
      id: templateId || 'custom-template',
      templateVersionId: templateVersionId || null,
      version: 'custom',
      source: 'payload',
      schema: templateSchema,
    };
  }

  if (templateVersionId) {
    const versionRecord = await templateService.findTemplateVersionById(templateVersionId, { includeSchema: true });
    if (versionRecord?.schema) {
      return versionRecord;
    }
  }

  if (templateId) {
    const templateRecord = await templateService.findTemplateByIdentifier(templateId, { includeSchema: true });
    if (templateRecord?.schema) {
      return templateRecord;
    }
  }

  if (templateService.DEFAULT_TEMPLATE_ID) {
    const fallback = await templateService.findTemplateByIdentifier(templateService.DEFAULT_TEMPLATE_ID, { includeSchema: true });
    if (fallback?.schema) {
      return fallback;
    }
  }

  const builtin = BUILTIN_TEMPLATES[0];
  return {
    id: builtin.id,
    slug: builtin.slug,
    templateVersionId: null,
    version: builtin.version,
    source: 'builtin',
    schema: builtin.schema,
  };
};

const generateAppStoreImage = async (rawOptions) => {
  const options = await normalizeGenerationOptions(rawOptions);
  const template = await resolveTemplate({
    templateId: options.templateId,
    templateVersionId: options.templateVersionId,
    templateSchema: options.templateSchema,
  });

  const { accentColor } = options.accentColorOverride
    ? { accentColor: options.accentColorOverride }
    : await analyzeImageColors(options.screenshotBuffer);

  const renderResult = await templateRenderer.renderTemplateToCanvas({
    templateSchema: template.schema,
    device: options.device,
    heading: options.heading,
    subheading: options.subheading,
    screenshotInput: options.screenshotInput,
    fonts: options.fonts,
    accentColor,
    overrides: {
      offsets: options.offsets,
      colors: options.colorOverrides,
      theme: options.theme,
    },
  });

  const imageBuffer = renderResult.canvas.toBuffer('image/jpeg', { quality: options.quality });

  return {
    imageBuffer,
    accentColor,
    templateId: template.id,
    templateVersionId: template.templateVersionId || null,
    templateSource: template.source || 'database',
    templateVersion: template.version || null,
  };
};

const generateDeviceMockupBuffer = async (screenshotInput, device = 'iPhone') => {
  const canvas = await templateRenderer.generateMockupCanvas(screenshotInput, normalizeDeviceName(device));
  return canvas.toBuffer('image/png');
};

console.log('ImageGenerationService initialized.');

module.exports = {
  generateAppStoreImage,
  generateDeviceMockupBuffer,
};