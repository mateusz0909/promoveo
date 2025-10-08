const { Vibrant } = require('node-vibrant/node');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_ACCENT_COLOR = '#Fda085';
const CANVAS_WIDTH = 1242;
const CANVAS_HEIGHT = 2688;
const DEFAULT_CONFIGURATION_TEMPLATE = {
  layout: 'text-top',
  theme: 'light',
  heading: 'Tap to edit heading',
  subheading: 'Tap to edit subheading',
  headingFont: 'Poppins',
  subheadingFont: 'Poppins',
  headingFontSize: 40,
  subheadingFontSize: 24,
  headingAlign: 'center',
  subheadingAlign: 'center',
  headingLetterSpacing: -1.5,
  subheadingLetterSpacing: 0,
  headingLineHeight: 1.2,
  subheadingLineHeight: 1.4,
  headingWidth: 1118,
  subheadingWidth: 1118,
  headingX: 617.8945227766038,
  headingY: 284.5538461538465,
  subheadingX: 634.749381527838,
  subheadingY: 655.4692695018977,
  headingColor: '#000000',
  subheadingColor: '#3b3b3b',
  mockupX: 10.514285714285724,
  mockupY: 441.8769230769232,
  mockupScale: 1.2,
  mockupRotation: 0,
  backgroundType: 'gradient',
  backgroundGradient: {
    startColor: '#f6d365',
    endColor: '#fda085',
    angle: 270,
  },
  backgroundSolid: '#8b5cf6',
  backgroundImage: {
    url: '',
    fit: 'cover',
    opacity: 1,
  },
  deviceFrame: 'iPhone 15 Pro',
  visuals: [],
  textInstances: [
    {
      id: 'text-heading-template',
      type: 'heading',
      text: 'Tap to edit heading',
      position: {
        x: 617.8945227766038,
        y: 284.5538461538465,
      },
      fontSize: 40,
      color: '#000000',
      align: 'center',
      letterSpacing: -1.5,
      lineHeight: 1.2,
      fontFamily: 'Poppins',
      fontWeight: 700,
      isBold: true,
      width: 1118,
      rotation: 0,
      zIndex: 1,
    },
    {
      id: 'text-subheading-template',
      type: 'subheading',
      text: 'Tap to edit subheading',
      position: {
        x: 634.749381527838,
        y: 655.4692695018977,
      },
      fontSize: 24,
      color: '#3b3b3b',
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.4,
      fontFamily: 'Poppins',
      fontWeight: 500,
      isBold: false,
      width: 1118,
      rotation: 0,
      zIndex: 2,
    },
  ],
  mockupInstances: [
    {
      id: 'mockup-template',
      type: 'iphone',
      sourceScreenshotUrl: '',
      baseWidth: 724.5,
      baseHeight: 1447.3846153846155,
      position: {
        x: 631.5132857142857,
        y: 1785.8769230769233,
      },
      scale: 1.2,
      rotation: 0,
      zIndex: 0,
    },
  ],
};

function isValidHex(hex) {
  if (!hex || typeof hex !== 'string') {
    return false;
  }
  return /^#?[0-9a-fA-F]{6}$/.test(hex.trim());
}

function normalizeHex(hex) {
  if (!isValidHex(hex)) {
    return DEFAULT_ACCENT_COLOR;
  }
  let value = hex.trim();
  if (!value.startsWith('#')) {
    value = `#${value}`;
  }
  return value.toUpperCase();
}

function clamp(value, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function adjustChannel(channel, percent) {
  const factor = percent / 100;
  if (percent >= 0) {
    return clamp(Math.round(channel + (255 - channel) * factor));
  }
  return clamp(Math.round(channel + channel * factor));
}

function adjustColor(hex, percent) {
  const normalized = normalizeHex(hex);
  const numeric = parseInt(normalized.slice(1), 16);

  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  const newR = adjustChannel(r, percent);
  const newG = adjustChannel(g, percent);
  const newB = adjustChannel(b, percent);

  const combined = (newR << 16) | (newG << 8) | newB;
  return `#${combined.toString(16).padStart(6, '0').toUpperCase()}`;
}

function lightenColor(hex, percent) {
  return adjustColor(hex, Math.abs(percent));
}

function darkenColor(hex, percent) {
  return adjustColor(hex, -Math.abs(percent));
}

async function extractAccentColor(buffer) {
  try {
    const palette = await Vibrant.from(buffer).getPalette();
    const candidates = [
      palette.Vibrant?.hex,
      palette.LightVibrant?.hex,
      palette.DarkVibrant?.hex,
      palette.Muted?.hex,
      palette.LightMuted?.hex,
      palette.DarkMuted?.hex,
    ];

    const valid = candidates.find((hex) => isValidHex(hex) && hex !== '#000000' && hex !== '#FFFFFF');
    return normalizeHex(valid || DEFAULT_ACCENT_COLOR);
  } catch (error) {
    console.error('imageConfigurationService: Failed to extract accent color', error);
    return DEFAULT_ACCENT_COLOR;
  }
}

function createTextInstance({
  type,
  text,
  fontFamily,
  fontSize,
  color,
  positionY,
  zIndex,
}) {
  const isHeading = type === 'heading';
  return {
    id: `${type}-${uuidv4()}`,
    type,
    text,
    position: { x: CANVAS_WIDTH / 2, y: positionY },
    fontSize,
    color,
    align: 'center',
    letterSpacing: 0,
    lineHeight: isHeading ? 1.1 : 1.3,
    fontFamily,
    fontWeight: isHeading ? 700 : 400,
    isBold: isHeading,
    width: Math.round(CANVAS_WIDTH * 0.82),
    rotation: 0,
    zIndex,
  };
}

function resolveDeviceFrame(device) {
  if (!device) {
    return {
      frameLabel: 'iPhone 15 Pro',
      mockupScale: 1,
    };
  }

  const lower = device.toLowerCase();
  if (lower.includes('ipad')) {
    return {
      frameLabel: 'iPad Pro 13',
      mockupScale: 1.08,
    };
  }

  return {
    frameLabel: 'iPhone 15 Pro',
    mockupScale: 1,
  };
}

async function createInitialImageConfig({
  screenshotBuffer,
  heading,
  subheading,
  font = {},
  device = 'iPhone',
  sourceScreenshotUrl = '',
}) {
  const resolvedHeading = (heading || '').trim() || 'Tap to edit heading';
  const resolvedSubheading = (subheading || '').trim() || 'Tap to edit subheading';

  // Clone the template to avoid mutating the original reference
  const configuration = JSON.parse(JSON.stringify(DEFAULT_CONFIGURATION_TEMPLATE));

  const headingFont = 'Poppins';
  const subheadingFont = 'Poppins';

  configuration.heading = resolvedHeading;
  configuration.subheading = resolvedSubheading;
  configuration.headingFont = headingFont;
  configuration.subheadingFont = subheadingFont;
  configuration.deviceFrame = resolveDeviceFrame(device).frameLabel;

  // Update text instances with dynamic text and ids
  configuration.textInstances = configuration.textInstances.map((instance) => {
    const updated = { ...instance };
    if (instance.type === 'heading') {
      updated.id = `heading-${uuidv4()}`;
      updated.text = resolvedHeading;
      updated.fontFamily = headingFont;
    } else if (instance.type === 'subheading') {
      updated.id = `subheading-${uuidv4()}`;
      updated.text = resolvedSubheading;
      updated.fontFamily = subheadingFont;
    }
    return updated;
  });

  const headingInstance = configuration.textInstances.find((instance) => instance.type === 'heading');
  const subheadingInstance = configuration.textInstances.find((instance) => instance.type === 'subheading');

  if (headingInstance) {
    configuration.headingX = headingInstance.position.x;
    configuration.headingY = headingInstance.position.y;
    configuration.headingFontSize = headingInstance.fontSize;
    configuration.headingColor = headingInstance.color;
    configuration.headingLetterSpacing = headingInstance.letterSpacing;
    configuration.headingLineHeight = headingInstance.lineHeight;
    configuration.headingWidth = headingInstance.width;
  }

  if (subheadingInstance) {
    configuration.subheadingX = subheadingInstance.position.x;
    configuration.subheadingY = subheadingInstance.position.y;
    configuration.subheadingFontSize = subheadingInstance.fontSize;
    configuration.subheadingColor = subheadingInstance.color;
    configuration.subheadingLetterSpacing = subheadingInstance.letterSpacing;
    configuration.subheadingLineHeight = subheadingInstance.lineHeight;
    configuration.subheadingWidth = subheadingInstance.width;
  }

  // Update mockup instance to reference the uploaded screenshot and match template style
  configuration.mockupInstances = configuration.mockupInstances.map((mockup) => ({
    ...mockup,
    id: `mockup-${uuidv4()}`,
    type: configuration.deviceFrame.toLowerCase().includes('ipad') ? 'ipad' : 'iphone',
    sourceScreenshotUrl,
  }));

  // Ensure legacy mockup fields align with the selected instance
  const primaryMockup = configuration.mockupInstances[0];
  if (primaryMockup) {
    configuration.mockupScale = primaryMockup.scale;
    configuration.mockupRotation = primaryMockup.rotation;
  }

  const accentColor = await extractAccentColor(screenshotBuffer).catch(() => DEFAULT_ACCENT_COLOR);

  return {
    accentColor,
    configuration,
  };
}

module.exports = {
  createInitialImageConfig,
};
